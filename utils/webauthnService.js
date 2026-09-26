const {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse
} = require('@simplewebauthn/server');
const crypto = require('crypto');

const CHALLENGE_TIMEOUT = 5 * 60 * 1000; // 5 minutes

class WebAuthnService {
  constructor(config = {}) {
    this.rpName = config.rpName || 'JWT-BABA';
    this.rpID = config.rpID;
    this.origin = config.origin;
    this.challenges = new Map();

    this._validateConfig();
    this._startChallengeCleanup();
  }

  _validateConfig() {
    if (!this.rpID) {
      throw new Error('WebAuthn rpID is required. Set WEBAUTHN_RP_ID in environment');
    }
    if (!this.origin) {
      throw new Error('WebAuthn origin is required. Set WEBAUTHN_ORIGIN in environment');
    }

    // Validate rpID format
    if (!this.rpID.match(/^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?(\.[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?)*$/i)) {
      throw new Error('Invalid WebAuthn rpID format. Must be a valid domain');
    }

    // Validate origin format
    try {
      const originUrl = new URL(this.origin);
      if (!['https:', 'http:'].includes(originUrl.protocol)) {
        throw new Error('WebAuthn origin must use https:// or http:// protocol');
      }
      // In production, enforce HTTPS
      if (process.env.NODE_ENV === 'production' && originUrl.protocol !== 'https:') {
        throw new Error('WebAuthn origin must use https:// in production');
      }
    } catch (err) {
      throw new Error(`Invalid WebAuthn origin: ${err.message}`);
    }

    console.log('✅ WebAuthn configured:', {
      rpName: this.rpName,
      rpID: this.rpID,
      origin: this.origin
    });
  }

  _startChallengeCleanup() {
    setInterval(() => {
      const now = Date.now();
      for (const [key, value] of this.challenges.entries()) {
        if (now - value.timestamp > CHALLENGE_TIMEOUT) {
          this.challenges.delete(key);
        }
      }
    }, 60000); // Cleanup every minute
  }

  _storeChallenge(userId, challenge, type = 'registration') {
    const key = `${userId}-${type}`;
    this.challenges.set(key, {
      challenge,
      timestamp: Date.now()
    });

    // Auto-expire after timeout
    setTimeout(() => {
      this.challenges.delete(key);
    }, CHALLENGE_TIMEOUT);
  }

  _getChallenge(userId, type = 'registration') {
    const key = `${userId}-${type}`;
    const stored = this.challenges.get(key);

    if (!stored) {
      throw new Error('Challenge not found or expired');
    }

    // Check if expired
    if (Date.now() - stored.timestamp > CHALLENGE_TIMEOUT) {
      this.challenges.delete(key);
      throw new Error('Challenge expired');
    }

    return stored.challenge;
  }

  _deleteChallenge(userId, type = 'registration') {
    const key = `${userId}-${type}`;
    this.challenges.delete(key);
  }

  async generateRegistrationOptions(user, existingCredentials = []) {
    const userId = user._id.toString();

    // Generate WebAuthn user ID (persistent across sessions)
    let webauthnUserId = user.webauthnUserId;
    if (!webauthnUserId) {
      webauthnUserId = crypto.randomBytes(32).toString('base64url');
      user.webauthnUserId = webauthnUserId;
      await user.save();
    }

    const options = await generateRegistrationOptions({
      rpName: this.rpName,
      rpID: this.rpID,
      userID: webauthnUserId,
      userName: user.email,
      userDisplayName: user.name || user.email,
      attestationType: 'none',
      excludeCredentials: existingCredentials.map(cred => ({
        id: Buffer.from(cred.credentialId, 'base64url'),
        type: 'public-key',
        transports: cred.transports
      })),
      authenticatorSelection: {
        residentKey: 'preferred',
        userVerification: 'preferred',
        authenticatorAttachment: 'platform'
      }
    });

    this._storeChallenge(userId, options.challenge, 'registration');

    return options;
  }

  async verifyRegistration(userId, response) {
    const expectedChallenge = this._getChallenge(userId, 'registration');

    let verification;
    try {
      verification = await verifyRegistrationResponse({
        response,
        expectedChallenge,
        expectedOrigin: this.origin,
        expectedRPID: this.rpID,
        requireUserVerification: false
      });
    } catch (error) {
      throw new Error(`Registration verification failed: ${error.message}`);
    }

    if (!verification.verified) {
      throw new Error('Registration verification failed');
    }

    // Delete challenge after successful verification
    this._deleteChallenge(userId, 'registration');

    const { registrationInfo } = verification;

    return {
      credentialId: Buffer.from(registrationInfo.credentialID).toString('base64url'),
      credentialPublicKey: Buffer.from(registrationInfo.credentialPublicKey),
      counter: registrationInfo.counter,
      credentialDeviceType: registrationInfo.credentialDeviceType,
      credentialBackedUp: registrationInfo.credentialBackedUp,
      aaguid: registrationInfo.aaguid,
      transports: response.response.transports || []
    };
  }

  async generateAuthenticationOptions(userCredentials) {
    const options = await generateAuthenticationOptions({
      rpID: this.rpID,
      allowCredentials: userCredentials.map(cred => ({
        id: Buffer.from(cred.credentialId, 'base64url'),
        type: 'public-key',
        transports: cred.transports
      })),
      userVerification: 'preferred'
    });

    // Store challenge with a temporary identifier (we'll use credentialId later)
    return options;
  }

  async verifyAuthentication(credential, response) {
    let verification;
    try {
      verification = await verifyAuthenticationResponse({
        response,
        expectedChallenge: response.challenge || credential.challenge,
        expectedOrigin: this.origin,
        expectedRPID: this.rpID,
        authenticator: {
          credentialID: Buffer.from(credential.credentialId, 'base64url'),
          credentialPublicKey: credential.credentialPublicKey,
          counter: credential.counter
        },
        requireUserVerification: false
      });
    } catch (error) {
      throw new Error(`Authentication verification failed: ${error.message}`);
    }

    if (!verification.verified) {
      throw new Error('Authentication verification failed');
    }

    return {
      verified: true,
      newCounter: verification.authenticationInfo.newCounter
    };
  }

  getConfig() {
    return {
      rpName: this.rpName,
      rpID: this.rpID,
      origin: this.origin
    };
  }
}

let webauthnServiceInstance = null;

function initWebAuthnService(config) {
  if (!webauthnServiceInstance) {
    webauthnServiceInstance = new WebAuthnService(config);
  }
  return webauthnServiceInstance;
}

function getWebAuthnService() {
  if (!webauthnServiceInstance) {
    throw new Error('WebAuthn service not initialized. Call initWebAuthnService first.');
  }
  return webauthnServiceInstance;
}

module.exports = {
  WebAuthnService,
  initWebAuthnService,
  getWebAuthnService
};

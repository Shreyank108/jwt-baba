const express = require('express');
const User = require('../models/User');
const Passkey = require('../models/Passkey');
const { getWebAuthnService } = require('../utils/webauthnService');
const babaBlessing = require('../utils/babaBlessing');
const authMiddleware = require('./authMiddleware');

function passkeyRoutes(JWT_SECRET) {
  const router = express.Router();

  // ====== REGISTRATION FLOW ======

  // Step 1: Generate registration options
  router.post('/register/options', authMiddleware(JWT_SECRET), async (req, res) => {
    try {
      const userId = req.user.userId || req.user.id;
      const user = await User.findById(userId);

      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      // Get existing passkeys for this user
      const existingPasskeys = await Passkey.find({ userId: user._id });

      const webauthn = getWebAuthnService();
      const options = await webauthn.generateRegistrationOptions(user, existingPasskeys);

      babaBlessing._audit('PASSKEY_REGISTER_OPTIONS', user.email, 'SUCCESS');

      res.json(options);
    } catch (err) {
      console.error('❌ Passkey registration options error:', err);
      babaBlessing._audit('PASSKEY_REGISTER_OPTIONS', 'unknown', 'FAILED', { error: err.message });
      res.status(500).json({ message: 'Failed to generate registration options', error: err.message });
    }
  });

  // Step 2: Verify registration response and store credential
  router.post('/register/verify', authMiddleware(JWT_SECRET), async (req, res) => {
    try {
      const userId = req.user.userId || req.user.id;
      const { credential, deviceName } = req.body;

      if (!credential) {
        return res.status(400).json({ message: 'Credential required' });
      }

      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      const webauthn = getWebAuthnService();
      const verifiedCredential = await webauthn.verifyRegistration(userId, credential);

      // Check if credential already exists
      const existing = await Passkey.findOne({ credentialId: verifiedCredential.credentialId });
      if (existing) {
        return res.status(400).json({ message: 'This passkey is already registered' });
      }

      // Store the passkey
      const passkey = new Passkey({
        userId: user._id,
        credentialId: verifiedCredential.credentialId,
        credentialPublicKey: verifiedCredential.credentialPublicKey,
        counter: verifiedCredential.counter,
        credentialDeviceType: verifiedCredential.credentialDeviceType,
        credentialBackedUp: verifiedCredential.credentialBackedUp,
        transports: verifiedCredential.transports,
        aaguid: verifiedCredential.aaguid,
        deviceName: deviceName || 'Unknown Device'
      });

      await passkey.save();

      babaBlessing._audit('PASSKEY_REGISTERED', user.email, 'SUCCESS', {
        credentialId: verifiedCredential.credentialId,
        deviceName: deviceName
      });

      res.json({
        message: '🔓 Baba ki kripa se passkey registered successfully',
        verified: true,
        passkey: {
          id: passkey._id,
          deviceName: passkey.deviceName,
          createdAt: passkey.createdAt
        }
      });
    } catch (err) {
      console.error('❌ Passkey registration verification error:', err);
      babaBlessing._audit('PASSKEY_REGISTER_VERIFY', 'unknown', 'FAILED', { error: err.message });
      res.status(400).json({ message: 'Registration verification failed', error: err.message });
    }
  });

  // ====== AUTHENTICATION FLOW ======

  // Step 1: Generate authentication options
  router.post('/login/options', async (req, res) => {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({ message: 'Email required' });
      }

      const user = await User.findOne({ email });
      if (!user) {
        // Don't reveal if user exists
        return res.status(400).json({ message: 'No passkeys found for this account' });
      }

      // Get user's passkeys
      const userPasskeys = await Passkey.find({ userId: user._id });

      if (userPasskeys.length === 0) {
        return res.status(400).json({ message: 'No passkeys found for this account' });
      }

      const webauthn = getWebAuthnService();
      const options = await webauthn.generateAuthenticationOptions(userPasskeys);

      // Store challenge temporarily with user email as identifier
      // We'll match it later with the credential used
      req.app.locals.authChallenges = req.app.locals.authChallenges || new Map();
      req.app.locals.authChallenges.set(email, {
        challenge: options.challenge,
        timestamp: Date.now()
      });

      babaBlessing._audit('PASSKEY_LOGIN_OPTIONS', email, 'SUCCESS');

      res.json(options);
    } catch (err) {
      console.error('❌ Passkey authentication options error:', err);
      babaBlessing._audit('PASSKEY_LOGIN_OPTIONS', 'unknown', 'FAILED', { error: err.message });
      res.status(500).json({ message: 'Failed to generate authentication options', error: err.message });
    }
  });

  // Step 2: Verify authentication response and issue JWT
  router.post('/login/verify', async (req, res) => {
    try {
      const { email, credential } = req.body;

      if (!email || !credential) {
        return res.status(400).json({ message: 'Email and credential required' });
      }

      const user = await User.findOne({ email });
      if (!user) {
        babaBlessing._audit('PASSKEY_LOGIN_VERIFY', email, 'FAILED', { reason: 'user_not_found' });
        return res.status(401).json({ message: 'Authentication failed' });
      }

      // Get the credential from database
      const credentialId = credential.id;
      const storedPasskey = await Passkey.findOne({
        credentialId,
        userId: user._id
      });

      if (!storedPasskey) {
        babaBlessing._audit('PASSKEY_LOGIN_VERIFY', email, 'FAILED', { reason: 'credential_not_found' });
        return res.status(401).json({ message: 'Authentication failed' });
      }

      // Get stored challenge
      const authChallenges = req.app.locals.authChallenges || new Map();
      const storedChallenge = authChallenges.get(email);

      if (!storedChallenge) {
        return res.status(400).json({ message: 'Challenge not found or expired' });
      }

      // Check challenge expiry (5 minutes)
      if (Date.now() - storedChallenge.timestamp > 5 * 60 * 1000) {
        authChallenges.delete(email);
        return res.status(400).json({ message: 'Challenge expired' });
      }

      // Verify the authentication
      const webauthn = getWebAuthnService();
      const verification = await webauthn.verifyAuthentication(storedPasskey, {
        ...credential,
        challenge: storedChallenge.challenge
      });

      if (!verification.verified) {
        babaBlessing._audit('PASSKEY_LOGIN_VERIFY', email, 'FAILED', { reason: 'verification_failed' });
        return res.status(401).json({ message: 'Authentication failed' });
      }

      // Update counter and lastUsedAt
      storedPasskey.counter = verification.newCounter;
      storedPasskey.lastUsedAt = new Date();
      await storedPasskey.save();

      // Delete used challenge
      authChallenges.delete(email);

      // Generate JWT tokens using babaBlessing
      const tokens = babaBlessing.generateTokens({
        userId: user._id.toString(),
        email: user.email,
        name: user.name,
        authMethod: 'passkey'
      });

      babaBlessing._audit('PASSKEY_LOGIN_VERIFY', email, 'SUCCESS', {
        credentialId: storedPasskey.credentialId,
        deviceName: storedPasskey.deviceName
      });

      res.json({
        message: '🔓 Baba ki kripa se passkey authentication successful',
        verified: true,
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        user: {
          id: user._id,
          email: user.email,
          name: user.name
        }
      });
    } catch (err) {
      console.error('❌ Passkey authentication verification error:', err);
      babaBlessing._audit('PASSKEY_LOGIN_VERIFY', 'unknown', 'FAILED', { error: err.message });
      res.status(401).json({ message: 'Authentication failed', error: err.message });
    }
  });

  // ====== PASSKEY MANAGEMENT ======

  // List user's passkeys
  router.get('/list', authMiddleware(JWT_SECRET), async (req, res) => {
    try {
      const userId = req.user.userId || req.user.id;

      const passkeys = await Passkey.find({ userId }).select('-credentialPublicKey').sort('-createdAt');

      res.json({
        passkeys: passkeys.map(pk => ({
          id: pk._id,
          deviceName: pk.deviceName,
          credentialDeviceType: pk.credentialDeviceType,
          credentialBackedUp: pk.credentialBackedUp,
          transports: pk.transports,
          createdAt: pk.createdAt,
          lastUsedAt: pk.lastUsedAt
        }))
      });
    } catch (err) {
      console.error('❌ Passkey list error:', err);
      res.status(500).json({ message: 'Failed to retrieve passkeys' });
    }
  });

  // Remove a passkey
  router.delete('/:passkeyId', authMiddleware(JWT_SECRET), async (req, res) => {
    try {
      const userId = req.user.userId || req.user.id;
      const { passkeyId } = req.params;

      const passkey = await Passkey.findOne({ _id: passkeyId, userId });

      if (!passkey) {
        return res.status(404).json({ message: 'Passkey not found' });
      }

      await Passkey.deleteOne({ _id: passkeyId });

      babaBlessing._audit('PASSKEY_REMOVED', req.user.email, 'SUCCESS', {
        passkeyId,
        deviceName: passkey.deviceName
      });

      res.json({ message: 'Passkey removed successfully' });
    } catch (err) {
      console.error('❌ Passkey removal error:', err);
      res.status(500).json({ message: 'Failed to remove passkey' });
    }
  });

  // Update passkey device name
  router.patch('/:passkeyId', authMiddleware(JWT_SECRET), async (req, res) => {
    try {
      const userId = req.user.userId || req.user.id;
      const { passkeyId } = req.params;
      const { deviceName } = req.body;

      if (!deviceName) {
        return res.status(400).json({ message: 'Device name required' });
      }

      const passkey = await Passkey.findOne({ _id: passkeyId, userId });

      if (!passkey) {
        return res.status(404).json({ message: 'Passkey not found' });
      }

      passkey.deviceName = deviceName;
      await passkey.save();

      res.json({
        message: 'Passkey updated successfully',
        passkey: {
          id: passkey._id,
          deviceName: passkey.deviceName
        }
      });
    } catch (err) {
      console.error('❌ Passkey update error:', err);
      res.status(500).json({ message: 'Failed to update passkey' });
    }
  });

  return router;
}

module.exports = passkeyRoutes;

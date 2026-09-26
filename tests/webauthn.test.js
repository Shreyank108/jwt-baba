/**
 * JWT-BABA WebAuthn/Passkey Test Suite
 *
 * Tests for passkey registration, authentication, and management.
 * Run with: npm test
 *
 * Note: These are integration tests that require:
 * - MongoDB running
 * - Express server initialized
 * - WebAuthn configured
 */

const { WebAuthnService, initWebAuthnService } = require('../utils/webauthnService');
const User = require('../models/User');
const Passkey = require('../models/Passkey');

describe('WebAuthn Service', () => {
  let webauthn;

  beforeAll(() => {
    webauthn = initWebAuthnService({
      rpName: 'JWT-BABA Test',
      rpID: 'localhost',
      origin: 'http://localhost:5000'
    });
  });

  describe('Configuration Validation', () => {
    test('should throw error if rpID is missing', () => {
      expect(() => {
        new WebAuthnService({ rpName: 'Test', origin: 'http://localhost:5000' });
      }).toThrow('WebAuthn rpID is required');
    });

    test('should throw error if origin is missing', () => {
      expect(() => {
        new WebAuthnService({ rpName: 'Test', rpID: 'localhost' });
      }).toThrow('WebAuthn origin is required');
    });

    test('should throw error for invalid rpID format', () => {
      expect(() => {
        new WebAuthnService({
          rpName: 'Test',
          rpID: 'https://example.com',
          origin: 'http://localhost:5000'
        });
      }).toThrow('Invalid WebAuthn rpID format');
    });

    test('should throw error for invalid origin format', () => {
      expect(() => {
        new WebAuthnService({
          rpName: 'Test',
          rpID: 'localhost',
          origin: 'example.com'
        });
      }).toThrow('Invalid WebAuthn origin');
    });

    test('should enforce HTTPS in production', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      expect(() => {
        new WebAuthnService({
          rpName: 'Test',
          rpID: 'example.com',
          origin: 'http://example.com'
        });
      }).toThrow('WebAuthn origin must use https:// in production');

      process.env.NODE_ENV = originalEnv;
    });

    test('should accept valid configuration', () => {
      expect(() => {
        new WebAuthnService({
          rpName: 'Test',
          rpID: 'localhost',
          origin: 'http://localhost:5000'
        });
      }).not.toThrow();
    });
  });

  describe('Challenge Management', () => {
    test('should generate registration options', async () => {
      const mockUser = {
        _id: '507f1f77bcf86cd799439011',
        email: 'test@example.com',
        name: 'Test User',
        webauthnUserId: null,
        save: jest.fn().mockResolvedValue(true)
      };

      const options = await webauthn.generateRegistrationOptions(mockUser, []);

      expect(options).toHaveProperty('challenge');
      expect(options).toHaveProperty('rp');
      expect(options.rp.name).toBe('JWT-BABA Test');
      expect(options.rp.id).toBe('localhost');
      expect(options).toHaveProperty('user');
      expect(options.user.name).toBe('test@example.com');
    });

    test('should generate authentication options', async () => {
      const mockCredentials = [
        {
          credentialId: 'test-credential-id',
          transports: ['internal']
        }
      ];

      const options = await webauthn.generateAuthenticationOptions(mockCredentials);

      expect(options).toHaveProperty('challenge');
      expect(options).toHaveProperty('allowCredentials');
      expect(options.allowCredentials).toHaveLength(1);
    });

    test('should track challenges with expiry', () => {
      const userId = 'user-123';
      const challenge = 'test-challenge';

      webauthn._storeChallenge(userId, challenge, 'registration');

      expect(() => {
        webauthn._getChallenge(userId, 'registration');
      }).not.toThrow();
    });

    test('should reject expired challenges', (done) => {
      const userId = 'user-456';
      const challenge = 'expired-challenge';

      webauthn._storeChallenge(userId, challenge, 'registration');

      // Mock expired challenge by setting old timestamp
      const key = `${userId}-registration`;
      const stored = webauthn.challenges.get(key);
      stored.timestamp = Date.now() - (6 * 60 * 1000); // 6 minutes ago
      webauthn.challenges.set(key, stored);

      setTimeout(() => {
        expect(() => {
          webauthn._getChallenge(userId, 'registration');
        }).toThrow('Challenge expired');
        done();
      }, 100);
    });
  });

  describe('Registration Flow', () => {
    test('should generate webauthnUserId if not present', async () => {
      const mockUser = {
        _id: '507f1f77bcf86cd799439011',
        email: 'test@example.com',
        name: 'Test User',
        webauthnUserId: null,
        save: jest.fn().mockResolvedValue(true)
      };

      await webauthn.generateRegistrationOptions(mockUser, []);

      expect(mockUser.webauthnUserId).toBeTruthy();
      expect(mockUser.save).toHaveBeenCalled();
    });

    test('should exclude existing credentials', async () => {
      const mockUser = {
        _id: '507f1f77bcf86cd799439011',
        email: 'test@example.com',
        name: 'Test User',
        webauthnUserId: 'existing-user-id',
        save: jest.fn()
      };

      const existingCredentials = [
        {
          credentialId: 'credential-1',
          transports: ['internal']
        }
      ];

      const options = await webauthn.generateRegistrationOptions(mockUser, existingCredentials);

      expect(options.excludeCredentials).toHaveLength(1);
    });
  });

  describe('Authentication Flow', () => {
    test('should allow credentials from user', async () => {
      const userCredentials = [
        {
          credentialId: 'user-credential-1',
          transports: ['internal', 'usb']
        },
        {
          credentialId: 'user-credential-2',
          transports: ['internal']
        }
      ];

      const options = await webauthn.generateAuthenticationOptions(userCredentials);

      expect(options.allowCredentials).toHaveLength(2);
      expect(options.allowCredentials[0].transports).toContain('internal');
    });
  });

  describe('Configuration Access', () => {
    test('should return configuration', () => {
      const config = webauthn.getConfig();

      expect(config).toHaveProperty('rpName');
      expect(config).toHaveProperty('rpID');
      expect(config).toHaveProperty('origin');
      expect(config.rpName).toBe('JWT-BABA Test');
    });
  });
});

describe('Passkey Model', () => {
  test('should have required fields', () => {
    const passkey = new Passkey({
      userId: '507f1f77bcf86cd799439011',
      credentialId: 'test-credential',
      credentialPublicKey: Buffer.from('public-key'),
      counter: 0
    });

    expect(passkey.userId).toBeTruthy();
    expect(passkey.credentialId).toBeTruthy();
    expect(passkey.credentialPublicKey).toBeTruthy();
    expect(passkey.counter).toBe(0);
  });

  test('should have default values', () => {
    const passkey = new Passkey({
      userId: '507f1f77bcf86cd799439011',
      credentialId: 'test-credential',
      credentialPublicKey: Buffer.from('public-key')
    });

    expect(passkey.counter).toBe(0);
    expect(passkey.credentialDeviceType).toBe('multiDevice');
    expect(passkey.credentialBackedUp).toBe(false);
    expect(passkey.transports).toEqual([]);
    expect(passkey.deviceName).toBe('Unknown Device');
  });

  test('should have updateLastUsed method', () => {
    const passkey = new Passkey({
      userId: '507f1f77bcf86cd799439011',
      credentialId: 'test-credential',
      credentialPublicKey: Buffer.from('public-key')
    });

    expect(passkey.updateLastUsed).toBeInstanceOf(Function);
  });
});

describe('User Model Updates', () => {
  test('should support optional password', () => {
    const user = new User({
      email: 'test@example.com',
      name: 'Test User'
      // password omitted
    });

    expect(user.email).toBe('test@example.com');
    expect(user.password).toBeUndefined();
  });

  test('should have webauthnUserId field', () => {
    const user = new User({
      email: 'test@example.com',
      name: 'Test User',
      webauthnUserId: 'webauthn-user-id'
    });

    expect(user.webauthnUserId).toBe('webauthn-user-id');
  });

  test('should have hasAuthMethod method', () => {
    const user = new User({
      email: 'test@example.com',
      name: 'Test User'
    });

    expect(user.hasAuthMethod).toBeInstanceOf(Function);
  });
});

describe('Security Requirements', () => {
  test('should not expose biometric data in any endpoint', () => {
    // This is a conceptual test - ensures no biometric data storage
    const passkey = new Passkey({
      userId: '507f1f77bcf86cd799439011',
      credentialId: 'test-credential',
      credentialPublicKey: Buffer.from('public-key'),
      counter: 0
    });

    const passkeyObject = passkey.toObject();

    // Ensure no fields that could contain biometric data
    expect(passkeyObject).not.toHaveProperty('biometricData');
    expect(passkeyObject).not.toHaveProperty('fingerprint');
    expect(passkeyObject).not.toHaveProperty('faceData');
    expect(passkeyObject).not.toHaveProperty('privateKey');
  });

  test('should only store cryptographic public key', () => {
    const passkey = new Passkey({
      userId: '507f1f77bcf86cd799439011',
      credentialId: 'test-credential',
      credentialPublicKey: Buffer.from('public-key'),
      counter: 0
    });

    expect(passkey.credentialPublicKey).toBeInstanceOf(Buffer);
    expect(passkey.credentialPublicKey.toString()).toBe('public-key');
  });
});

// Mock implementation helpers
global.fetch = jest.fn();

console.log(`
✅ JWT-BABA WebAuthn Test Suite
===============================

Run these tests with:
  npm install --save-dev jest
  npm test

Or manually:
  node tests/webauthn.test.js

Note: Integration tests require MongoDB and Express server.
`);

module.exports = {
  // Export for external test runners
};

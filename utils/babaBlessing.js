const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const ALGORITHM = 'HS256';
const ACCESS_TOKEN_EXPIRY = process.env.JWT_ACCESS_EXPIRY || '15m';
const REFRESH_TOKEN_EXPIRY = process.env.JWT_REFRESH_EXPIRY || '7d';
const MAX_ATTEMPTS = 5;
const ATTEMPT_WINDOW = 15 * 60 * 1000; // 15 minutes

const loginAttempts = new Map();
const tokenBlacklist = new Set();
const refreshTokenRotation = new Map();

class BabaBlessing {
  constructor() {
    this.secret = process.env.JWT_SECRET || this._generateSecret();
    this.refreshSecret = process.env.JWT_REFRESH_SECRET || this._generateSecret();
    if (!process.env.JWT_SECRET) {
      console.warn('⚠️  JWT_SECRET not set in env. Using generated secret (NOT for production)');
    }
  }

  _generateSecret() {
    return crypto.randomBytes(32).toString('hex');
  }

  _getRateLimit(identifier) {
    if (!loginAttempts.has(identifier)) {
      loginAttempts.set(identifier, []);
    }
    const attempts = loginAttempts.get(identifier);
    const now = Date.now();
    const recentAttempts = attempts.filter(t => now - t < ATTEMPT_WINDOW);
    loginAttempts.set(identifier, recentAttempts);
    return recentAttempts.length;
  }

  _recordAttempt(identifier) {
    if (!loginAttempts.has(identifier)) {
      loginAttempts.set(identifier, []);
    }
    loginAttempts.get(identifier).push(Date.now());
  }

  _audit(action, user, status, details = {}) {
    const timestamp = new Date().toISOString();
    console.log(JSON.stringify({
      timestamp,
      action,
      user,
      status,
      ...details
    }));
  }

  generateTokens(payload) {
    const jti = crypto.randomUUID();

    const accessToken = jwt.sign(
      { ...payload, type: 'access', jti },
      this.secret,
      { algorithm: ALGORITHM, expiresIn: ACCESS_TOKEN_EXPIRY }
    );

    const refreshToken = jwt.sign(
      { userId: payload.userId, type: 'refresh', jti },
      this.refreshSecret,
      { algorithm: ALGORITHM, expiresIn: REFRESH_TOKEN_EXPIRY }
    );

    refreshTokenRotation.set(jti, { token: refreshToken, createdAt: Date.now() });

    this._audit('TOKEN_GENERATED', payload.userId, 'SUCCESS', { jti });
    return { accessToken, refreshToken };
  }

  verifyAccessToken(token) {
    try {
      if (tokenBlacklist.has(token)) {
        throw new Error('Token revoked');
      }
      const decoded = jwt.verify(token, this.secret, { algorithms: [ALGORITHM] });
      if (decoded.type !== 'access') {
        throw new Error('Invalid token type');
      }
      return decoded;
    } catch (err) {
      this._audit('TOKEN_VERIFY', 'unknown', 'FAILED', { error: err.message });
      throw err;
    }
  }

  refreshAccessToken(refreshToken) {
    try {
      const decoded = jwt.verify(refreshToken, this.refreshSecret, { algorithms: [ALGORITHM] });
      if (decoded.type !== 'refresh') {
        throw new Error('Invalid token type');
      }

      const stored = refreshTokenRotation.get(decoded.jti);
      if (!stored || stored.token !== refreshToken) {
        throw new Error('Refresh token rotation violation');
      }

      tokenBlacklist.add(refreshToken);
      const newTokens = this.generateTokens({ userId: decoded.userId });

      this._audit('TOKEN_REFRESHED', decoded.userId, 'SUCCESS', { jti: decoded.jti });
      return newTokens;
    } catch (err) {
      this._audit('TOKEN_REFRESH_FAILED', 'unknown', 'FAILED', { error: err.message });
      throw err;
    }
  }

  validateCredentials(userId, password, storedHash) {
    const identifier = `${userId}`;
    const attempts = this._getRateLimit(identifier);

    if (attempts >= MAX_ATTEMPTS) {
      this._audit('AUTH_ATTEMPT', userId, 'BLOCKED', { reason: 'rate_limit' });
      throw new Error(`Too many attempts. Try again after ${ATTEMPT_WINDOW / 60000} minutes`);
    }

    this._recordAttempt(identifier);

    const hash = crypto.createHash('sha256').update(password).digest('hex');
    const isValid = hash === storedHash;

    if (isValid) {
      loginAttempts.delete(identifier);
      this._audit('AUTH_ATTEMPT', userId, 'SUCCESS');
      return true;
    }

    this._audit('AUTH_ATTEMPT', userId, 'FAILED', { attempt: attempts + 1 });
    return false;
  }

  revokeToken(token) {
    tokenBlacklist.add(token);
    this._audit('TOKEN_REVOKED', 'unknown', 'SUCCESS');
  }

  middleware() {
    return (req, res, next) => {
      const authHeader = req.headers.authorization;

      if (!authHeader) {
        return res.status(401).json({ error: 'Missing authorization header' });
      }

      const token = authHeader.startsWith('Bearer ')
        ? authHeader.slice(7)
        : authHeader;

      try {
        req.user = this.verifyAccessToken(token);
        next();
      } catch (err) {
        res.status(401).json({ error: 'Invalid or expired token', message: err.message });
      }
    };
  }

  getJWKS() {
    const decoded = jwt.decode(this.secret, { complete: true });
    return {
      keys: [{
        kty: 'oct',
        k: Buffer.from(this.secret).toString('base64'),
        alg: ALGORITHM,
        use: 'sig'
      }]
    };
  }
}

module.exports = new BabaBlessing();
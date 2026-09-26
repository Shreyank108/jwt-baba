# 🔐 JWT Baba - Security & Features Guide

## ✨ New Flagship Features

### 1. **Dual Token System** (Access + Refresh)
- **Access Token**: Short-lived (15m default), for API requests
- **Refresh Token**: Long-lived (7d default), for getting new access tokens
- **Token Rotation**: Every refresh generates new tokens; old refresh tokens are revoked
- **Prevents**: Session fixation, token theft impact

```bash
# Login returns both tokens
{
  "accessToken": "eyJhbGc...",      # Use this for API calls
  "refreshToken": "eyJhbGc..."      # Use this to refresh when access expires
}
```

### 2. **Rate Limiting**
- Max 5 login attempts per 15 minutes per user
- Automatic blocking with retry guidance
- Audit logging of all attempts

```bash
curl -X POST /api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"pass"}'
# After 5 attempts: "Too many attempts. Try again after 15 minutes"
```

### 3. **Token Refresh Endpoint**
- Get new access token without re-authenticating
- Prevents token expiry interruptions
- Implements secure rotation

```bash
curl -X POST /api/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{"refreshToken":"eyJhbGc..."}'
```

### 4. **Audit Logging**
Every security event is logged:
- User authentication attempts (success/failure)
- Token generation & verification
- Token refresh operations
- Revocation events

```json
{
  "timestamp": "2026-09-26T10:30:45.123Z",
  "action": "TOKEN_GENERATED",
  "user": "user@example.com",
  "status": "SUCCESS",
  "jti": "uuid-value"
}
```

### 5. **Token Blacklist**
- Revoke tokens immediately
- Enforce logout across sessions
- Prevents reuse of revoked tokens

### 6. **Token Rotation Tracking**
- JTI (JWT ID) for every token
- Track refresh token lineage
- Detect rotation violations (detect token replay)

### 7. **Express Middleware**
- Drop-in protection for routes
- Automatic token verification
- User context injection

```javascript
app.get('/protected', authMiddleware, (req, res) => {
  console.log(req.user); // { userId, email, type, jti }
});
```

## 🔧 Environment Configuration

```env
JWT_SECRET=your-super-secret-key-min-32-chars
JWT_REFRESH_SECRET=separate-refresh-secret-key
JWT_ACCESS_EXPIRY=15m          # Access token lifetime
JWT_REFRESH_EXPIRY=7d          # Refresh token lifetime
```

**Best Practices:**
- Use different secrets for access & refresh tokens
- Rotate secrets regularly
- Store in `.env.local` (never commit)
- Use cryptographically secure random generation

## 📚 API Endpoints

### Register
```bash
POST /api/auth/register
Content-Type: application/json

{
  "name": "Shreyank",
  "email": "user@example.com",
  "password": "securepass123"
}

Response:
{
  "message": "🔓 Baba ki kripa se user registered successfully",
  "accessToken": "...",
  "refreshToken": "...",
  "user": { "id": "...", "email": "...", "name": "..." }
}
```

### Login
```bash
POST /api/auth/login
{
  "email": "user@example.com",
  "password": "securepass123"
}
```

### Refresh Token
```bash
POST /api/auth/refresh
{
  "refreshToken": "eyJhbGc..."
}

Response:
{
  "accessToken": "new-token",
  "refreshToken": "new-refresh-token"
}
```

### Logout
```bash
POST /api/auth/logout
{
  "refreshToken": "eyJhbGc..."
}
```

### Verify Token
```bash
POST /api/auth/verify
{
  "token": "eyJhbGc..."
}

Response:
{
  "valid": true,
  "user": { "userId": "...", "email": "...", "jti": "..." }
}
```

### Protected Route
```bash
GET /protected
Authorization: Bearer eyJhbGc...

Response:
"🛡️ Welcome user@example.com, you have accessed a protected route."
```

## 🛡️ Security Features

### ✅ Implemented
- HMAC-SHA256 signing (HS256)
- Algorithm whitelist enforcement
- Rate limiting (5 attempts/15min)
- Token expiry validation
- JTI tracking
- Token rotation
- Refresh token blacklisting
- Audit logging
- Password hashing with bcrypt

### 🚀 Can Be Enhanced
- JWKS endpoint for key distribution
- RS256 (asymmetric) signing
- Multi-factor authentication
- OAuth2/OIDC support
- Device fingerprinting
- Suspicious activity detection
- IP-based rate limiting
- Redis for distributed rate limiting

## 🧪 Testing

```javascript
const babaBlessing = require('./utils/babaBlessing');

// Generate tokens
const tokens = babaBlessing.generateTokens({
  userId: 'user123',
  email: 'user@example.com'
});

// Verify access token
const decoded = babaBlessing.verifyAccessToken(tokens.accessToken);
console.log(decoded); // { userId, email, type: 'access', jti }

// Refresh tokens
const newTokens = babaBlessing.refreshAccessToken(tokens.refreshToken);

// Revoke token
babaBlessing.revokeToken(tokens.refreshToken);
```

## 🔍 Debugging

Enable audit logs to track all auth operations:
```bash
NODE_DEBUG=* npm start
```

Check console output for JSON audit logs:
```json
{
  "timestamp": "...",
  "action": "LOGIN_ATTEMPT",
  "user": "user@example.com",
  "status": "SUCCESS|FAILED",
  "details": {...}
}
```

## 📖 Migration from Old System

**Old Way:**
```javascript
const token = jwt.sign({...}, JWT_SECRET, { expiresIn: '1h' });
// Single long-lived token
```

**New Way:**
```javascript
const { accessToken, refreshToken } = babaBlessing.generateTokens({...});
// Two tokens: short access + long refresh
// Client refreshes when access expires
```

## 🎯 Deployment Checklist

- [ ] Set `JWT_SECRET` & `JWT_REFRESH_SECRET` in production `.env`
- [ ] Use HTTPS for all token transmission
- [ ] Set secure cookie flags for token storage
- [ ] Enable audit logging to persistent storage
- [ ] Monitor failed login attempts
- [ ] Implement Redis for distributed rate limiting
- [ ] Set up token refresh intervals in frontend
- [ ] Test logout & token revocation
- [ ] Monitor for suspicious patterns
- [ ] Regularly rotate secrets

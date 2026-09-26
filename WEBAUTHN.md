# 🔐 JWT-BABA WebAuthn / Passkey Authentication

## What is WebAuthn?

**WebAuthn (Web Authentication)** is a W3C standard that enables passwordless authentication using biometrics and security keys. JWT-BABA implements this standard to provide **flagship-level security** without storing passwords or biometric data.

### What JWT-BABA Does NOT Do

❌ **Does NOT store fingerprints, Face ID data, or any biometric information**  
❌ **Does NOT access your camera, fingerprint sensor, or biometric hardware**  
❌ **Does NOT implement custom biometric recognition**  

### What JWT-BABA DOES Do

✅ **Uses the browser's native WebAuthn API**  
✅ **Stores only cryptographic public keys (not biometric data)**  
✅ **Verifies cryptographic signatures from your device's authenticator**  
✅ **Issues JWT tokens after successful verification**  
✅ **Works with existing JWT-BABA middleware without changes**  

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER'S DEVICE                            │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  Browser (React/HTML)                                       │ │
│  │  ├─ navigator.credentials.create()  (Registration)        │ │
│  │  └─ navigator.credentials.get()     (Login)               │ │
│  └──────────────────┬──────────────────────────────────────────┘ │
│                     │                                             │
│  ┌──────────────────▼──────────────────────────────────────────┐ │
│  │  Platform Authenticator (OS-level)                          │ │
│  │  ├─ Touch ID / Face ID (macOS/iOS)                         │ │
│  │  ├─ Windows Hello (Windows)                                │ │
│  │  ├─ Fingerprint Sensor (Android/Linux)                     │ │
│  │  ├─ Device PIN / Pattern                                   │ │
│  │  └─ External Security Key (YubiKey, etc.)                  │ │
│  │                                                              │ │
│  │  🔒 Biometric verification happens HERE (locally)          │ │
│  │  🔒 Private key stored in secure enclave (never leaves)    │ │
│  └──────────────────┬──────────────────────────────────────────┘ │
│                     │                                             │
│                     │ Cryptographic Credential/Assertion          │
│                     │ (Public key + signature, NO biometrics)     │
└─────────────────────┼─────────────────────────────────────────────┘
                      │
                      │ HTTPS
                      ▼
┌─────────────────────────────────────────────────────────────────┐
│                    JWT-BABA BACKEND                              │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  WebAuthn Service (webauthnService.js)                     │ │
│  │  ├─ Challenge generation                                   │ │
│  │  ├─ Origin/RP ID verification                              │ │
│  │  ├─ Signature verification (using stored public key)       │ │
│  │  ├─ Counter validation (replay protection)                 │ │
│  │  └─ @simplewebauthn/server (cryptographic operations)      │ │
│  └──────────────────┬──────────────────────────────────────────┘ │
│                     │                                             │
│  ┌──────────────────▼──────────────────────────────────────────┐ │
│  │  User Authenticated ✅                                      │ │
│  └──────────────────┬──────────────────────────────────────────┘ │
│                     │                                             │
│  ┌──────────────────▼──────────────────────────────────────────┐ │
│  │  JWT Token Generation (babaBlessing.js)                     │ │
│  │  ├─ Access Token (15m)                                      │ │
│  │  └─ Refresh Token (7d)                                      │ │
│  └──────────────────┬──────────────────────────────────────────┘ │
│                     │                                             │
│  ┌──────────────────▼──────────────────────────────────────────┐ │
│  │  Existing authMiddleware (no changes needed)                │ │
│  │  req.user = { userId, email, authMethod: 'passkey' }       │ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

---

## Registration Flow

### Step-by-Step

```
User Action                 Browser                 JWT-BABA Server
──────────                  ───────                ────────────────
                                                   
1. Click "Setup Passkey"
    │                                              
    ├─────────────────────►                      
                            POST /api/auth/passkey/register/options
                            Authorization: Bearer <access_token>
                            │                      
                            │◄─────────────────────
                                                   {
                                                     challenge,
                                                     user: { id, name, email },
                                                     rpName, rpID, origin
                                                   }
                                                   
2. Touch sensor/Face ID
    │                      
    ├────────►             
              navigator.credentials.create({
                publicKey: options
              })
              │
              ▼
         Platform Authenticator
         ├─ Verify biometric locally
         ├─ Generate key pair
         ├─ Store private key (secure enclave)
         └─ Return public key + attestation
              │
              ◄─────
              Credential {
                id, rawId, response: {
                  clientDataJSON,
                  attestationObject
                }
              }
              │
              │
              POST /api/auth/passkey/register/verify
              Authorization: Bearer <access_token>
              { credential, deviceName }
              │
              │◄─────────────────────
                                     Verify:
                                     ├─ Challenge matches
                                     ├─ Origin matches
                                     ├─ RP ID matches
                                     ├─ Signature valid
                                     └─ Store:
                                        - credentialId
                                        - publicKey (NOT biometric!)
                                        - counter
                                        - deviceName
                                                   
                                     { verified: true }
              ◄─────
```

---

## Login Flow

### Step-by-Step

```
User Action                 Browser                 JWT-BABA Server
──────────                  ───────                ────────────────

1. Enter email + click "Login with Passkey"
    │
    ├─────────────────────►
                            POST /api/auth/passkey/login/options
                            { email }
                            │
                            │◄─────────────────────
                                                   Query user's passkeys
                                                   Generate challenge
                                                   
                                                   {
                                                     challenge,
                                                     allowCredentials: [
                                                       { id, type, transports }
                                                     ]
                                                   }

2. Touch sensor/Face ID
    │
    ├────────►
              navigator.credentials.get({
                publicKey: options
              })
              │
              ▼
         Platform Authenticator
         ├─ Verify biometric locally
         ├─ Sign challenge with private key
         └─ Return signature
              │
              ◄─────
              Credential {
                id, rawId, response: {
                  authenticatorData,
                  clientDataJSON,
                  signature,
                  userHandle
                }
              }
              │
              │
              POST /api/auth/passkey/login/verify
              { email, credential }
              │
              │◄─────────────────────
                                     Verify:
                                     ├─ Challenge matches
                                     ├─ Origin matches
                                     ├─ RP ID matches
                                     ├─ Signature valid (using stored public key)
                                     ├─ Counter > stored counter (replay protection)
                                     └─ Update counter
                                     
                                     Generate JWT tokens
                                     
                                     {
                                       verified: true,
                                       accessToken,
                                       refreshToken,
                                       user
                                     }
              ◄─────
              
3. Store tokens
   localStorage.setItem('accessToken', ...)
   localStorage.setItem('refreshToken', ...)
```

---

## Configuration

### Server Setup

```javascript
const express = require('express');
const initAuthSystem = require('jwt-baba');

const app = express();
app.use(express.json());

initAuthSystem(app, {
  webauthn: {
    rpName: 'My Application',              // Human-readable name
    rpID: 'example.com',                   // Domain (no protocol/port)
    origin: 'https://example.com'          // Full origin URL
  }
});
```

### Environment Variables

```env
# Required for JWT authentication
JWT_SECRET=your-super-secret-key-min-32-chars
JWT_REFRESH_SECRET=separate-refresh-secret-key

# Required for WebAuthn/Passkeys
WEBAUTHN_RP_ID=example.com
WEBAUTHN_ORIGIN=https://example.com

# Optional: Token expiry
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d

# MongoDB
MONGO_URI=mongodb://localhost:27017/jwt-baba
```

### Important Configuration Rules

#### RP ID (Relying Party ID)
- Must be a valid domain name
- Cannot include protocol (`https://`), port, or path
- Examples:
  - ✅ `example.com`
  - ✅ `auth.example.com`
  - ❌ `https://example.com`
  - ❌ `example.com:5000`
  - ❌ `example.com/api`

#### Origin
- Must be the complete origin URL
- Must use `https://` in production
- `http://localhost` allowed for development
- Examples:
  - ✅ `https://example.com`
  - ✅ `https://auth.example.com:3000`
  - ✅ `http://localhost:5000` (dev only)
  - ❌ `example.com`
  - ❌ `http://example.com` (prod)

#### HTTPS Requirement
- **Production**: MUST use HTTPS
- **Development**: `http://localhost` allowed
- WebAuthn will NOT work over HTTP (except localhost)

---

## API Endpoints

### Registration

#### POST `/api/auth/passkey/register/options`

Generate registration options for creating a new passkey.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response:**
```json
{
  "challenge": "base64url-encoded-challenge",
  "rp": {
    "name": "JWT-BABA",
    "id": "example.com"
  },
  "user": {
    "id": "base64url-user-id",
    "name": "user@example.com",
    "displayName": "User Name"
  },
  "pubKeyCredParams": [...],
  "timeout": 60000,
  "attestation": "none",
  "excludeCredentials": [...],
  "authenticatorSelection": {
    "residentKey": "preferred",
    "userVerification": "preferred"
  }
}
```

#### POST `/api/auth/passkey/register/verify`

Verify registration response and store credential.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Body:**
```json
{
  "deviceName": "MacBook Pro",
  "credential": {
    "id": "credential-id",
    "rawId": "base64-raw-id",
    "type": "public-key",
    "response": {
      "clientDataJSON": "base64-client-data",
      "attestationObject": "base64-attestation",
      "transports": ["internal"]
    }
  }
}
```

**Response:**
```json
{
  "message": "🔓 Baba ki kripa se passkey registered successfully",
  "verified": true,
  "passkey": {
    "id": "passkey-id",
    "deviceName": "MacBook Pro",
    "createdAt": "2026-09-26T..."
  }
}
```

---

### Authentication

#### POST `/api/auth/passkey/login/options`

Generate authentication options for login.

**Body:**
```json
{
  "email": "user@example.com"
}
```

**Response:**
```json
{
  "challenge": "base64url-encoded-challenge",
  "timeout": 60000,
  "rpId": "example.com",
  "allowCredentials": [
    {
      "id": "base64url-credential-id",
      "type": "public-key",
      "transports": ["internal"]
    }
  ],
  "userVerification": "preferred"
}
```

#### POST `/api/auth/passkey/login/verify`

Verify authentication response and issue JWT tokens.

**Body:**
```json
{
  "email": "user@example.com",
  "credential": {
    "id": "credential-id",
    "rawId": "base64-raw-id",
    "type": "public-key",
    "response": {
      "clientDataJSON": "base64-client-data",
      "authenticatorData": "base64-authenticator-data",
      "signature": "base64-signature",
      "userHandle": "base64-user-handle"
    }
  }
}
```

**Response:**
```json
{
  "message": "🔓 Baba ki kripa se passkey authentication successful",
  "verified": true,
  "accessToken": "jwt-access-token",
  "refreshToken": "jwt-refresh-token",
  "user": {
    "id": "user-id",
    "email": "user@example.com",
    "name": "User Name"
  }
}
```

---

### Passkey Management

#### GET `/api/auth/passkey/list`

List all passkeys for the authenticated user.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response:**
```json
{
  "passkeys": [
    {
      "id": "passkey-id",
      "deviceName": "MacBook Pro",
      "credentialDeviceType": "multiDevice",
      "credentialBackedUp": true,
      "transports": ["internal"],
      "createdAt": "2026-09-26T...",
      "lastUsedAt": "2026-09-26T..."
    }
  ]
}
```

#### DELETE `/api/auth/passkey/:passkeyId`

Remove a passkey.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response:**
```json
{
  "message": "Passkey removed successfully"
}
```

#### PATCH `/api/auth/passkey/:passkeyId`

Update passkey device name.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Body:**
```json
{
  "deviceName": "New Device Name"
}
```

**Response:**
```json
{
  "message": "Passkey updated successfully",
  "passkey": {
    "id": "passkey-id",
    "deviceName": "New Device Name"
  }
}
```

---

## Database Schema

### Passkey Model

```javascript
{
  userId: ObjectId,                      // Reference to User
  credentialId: String (unique),         // WebAuthn credential ID
  credentialPublicKey: Buffer,           // Public key (NOT biometric data!)
  counter: Number,                       // Sign counter (replay protection)
  credentialDeviceType: String,          // 'singleDevice' or 'multiDevice'
  credentialBackedUp: Boolean,           // Synced across devices?
  transports: [String],                  // ['internal', 'usb', 'nfc', 'ble']
  deviceName: String,                    // User-friendly name
  aaguid: String,                        // Authenticator GUID
  createdAt: Date,
  lastUsedAt: Date
}
```

### User Model Updates

```javascript
{
  name: String,
  email: String (unique, required),
  password: String (optional now),       // Can be null for passkey-only accounts
  webauthnUserId: String (unique),       // Persistent WebAuthn user ID
  timestamps: true,
  
  // Virtual
  passkeys: [Passkey]
}
```

---

## Security Features

### ✅ What JWT-BABA Protects Against

| Attack | Protection |
|--------|-----------|
| **Phishing** | WebAuthn requires matching origin; credential won't work on fake sites |
| **Replay Attacks** | Counter validation prevents reuse of old signatures |
| **Man-in-the-Middle** | HTTPS + cryptographic signature verification |
| **Credential Stuffing** | No password to steal or reuse |
| **Brute Force** | No password to brute force |
| **Database Breach** | Only public keys stored (useless without private key) |
| **Credential Theft** | Private keys never leave device's secure enclave |

### 🔒 Security Implementation Details

#### Challenge Generation
- Cryptographically random
- Unique per request
- 5-minute expiry
- Stored temporarily in memory
- Deleted after use

#### Origin & RP ID Verification
- Server validates origin matches configured value
- RP ID must match domain
- Prevents cross-domain attacks

#### Signature Verification
- Uses stored public key
- Verifies authenticator signed the challenge
- Ensures credential ownership

#### Counter Validation
- Tracks sign counter per credential
- Detects cloned authenticators
- Prevents replay attacks

#### Audit Logging
```json
{
  "timestamp": "2026-09-26T10:30:45.123Z",
  "action": "PASSKEY_LOGIN_VERIFY",
  "user": "user@example.com",
  "status": "SUCCESS",
  "credentialId": "...",
  "deviceName": "MacBook Pro"
}
```

---

## Frontend Examples

### Vanilla JavaScript

See [`examples/passkey-browser.html`](./examples/passkey-browser.html) for a complete working example.

```javascript
// Login
const optionsRes = await fetch('/api/auth/passkey/login/options', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email })
});
const options = await optionsRes.json();

const credential = await navigator.credentials.get({
  publicKey: {
    ...options,
    challenge: base64urlToUint8Array(options.challenge),
    allowCredentials: options.allowCredentials.map(cred => ({
      ...cred,
      id: base64urlToUint8Array(cred.id)
    }))
  }
});

// Send to server for verification...
```

### React Component

See [`examples/PasskeyAuth.jsx`](./examples/PasskeyAuth.jsx) for a complete React component.

```jsx
import PasskeyAuth from './examples/PasskeyAuth';

function App() {
  return (
    <PasskeyAuth apiBase="https://api.example.com/api" />
  );
}
```

---

## Multi-Device Support

### How It Works

When you register a passkey on your MacBook, that same passkey can be used on your iPhone if:

1. **Passkey is synced** (via iCloud Keychain, Google Password Manager, etc.)
2. **RP ID matches** across devices
3. **Origin matches** (same domain)

### Example Scenarios

#### Scenario 1: Register on MacBook, login on iPhone
✅ **Works** if passkey is backed up to iCloud and synced

#### Scenario 2: Register on iPhone, login on Android
❌ **Doesn't work** (Apple ↔ Android don't sync)  
✅ **Solution**: Register separate passkeys on each device

#### Scenario 3: External security key (YubiKey)
✅ **Works** across ALL devices (key is physical)

### Managing Multiple Passkeys

Users can register multiple passkeys:
- MacBook fingerprint
- iPhone Face ID
- Android fingerprint
- YubiKey hardware key
- Windows Hello

Each device gets its own credential stored in JWT-BABA.

---

## Account Recovery

### Recommended Strategy

1. **Keep password authentication enabled** (default)
   - Users can recover via password reset email
   - Passkeys are supplementary, not replacement

2. **Email-based recovery**
   ```
   Forgot password → Email verification → Set new password
   ```

3. **Never attempt to recover biometric credentials**
   - Private keys cannot be recovered
   - User must re-register passkey on new device

### Passwordless-Only Accounts

If you disable password authentication:
- **Email verification MUST be rock-solid**
- Consider backup codes
- Consider admin recovery flow
- Document recovery process clearly

---

## Testing

### Browser Compatibility

| Browser | Platform | Support |
|---------|----------|---------|
| **Chrome** | macOS, Windows, Linux, Android | ✅ Full |
| **Safari** | macOS, iOS | ✅ Full |
| **Edge** | Windows | ✅ Full |
| **Firefox** | macOS, Windows, Linux | ✅ Full |

### Testing Checklist

```bash
# Registration
[ ] Generate options (authenticated user)
[ ] Create credential in browser
[ ] Verify and store credential
[ ] List shows new passkey
[ ] Device name displays correctly

# Authentication
[ ] Generate options (email provided)
[ ] Get credential in browser
[ ] Verify signature succeeds
[ ] JWT tokens issued correctly
[ ] authMiddleware accepts tokens

# Security
[ ] Expired challenge rejected
[ ] Invalid origin rejected
[ ] Invalid RP ID rejected
[ ] Invalid signature rejected
[ ] Replay attack detected (counter)
[ ] Unknown credential rejected

# Multi-device
[ ] Register passkey on device A
[ ] Login with passkey on device A
[ ] Login with synced passkey on device B
[ ] Remove passkey and verify removal

# Edge Cases
[ ] User with no passkeys
[ ] User with multiple passkeys
[ ] Cancelled registration
[ ] Cancelled login
[ ] Network error handling
```

---

## Troubleshooting

### Common Issues

#### 1. "WebAuthn not supported"
**Cause**: Browser doesn't support WebAuthn API  
**Solution**: Use modern browser (Chrome, Safari, Firefox, Edge)

#### 2. "Origin mismatch"
**Cause**: Configured origin doesn't match actual origin  
**Solution**: Ensure `WEBAUTHN_ORIGIN` matches exactly (including protocol, port)

```env
# Wrong
WEBAUTHN_ORIGIN=example.com

# Right
WEBAUTHN_ORIGIN=https://example.com
```

#### 3. "RP ID mismatch"
**Cause**: RP ID doesn't match domain  
**Solution**: RP ID must be domain only (no protocol/port)

```env
# Wrong
WEBAUTHN_RP_ID=https://example.com

# Right
WEBAUTHN_RP_ID=example.com
```

#### 4. "NotAllowedError: The operation either timed out or was not allowed"
**Causes**:
- User cancelled biometric prompt
- Timeout expired (60 seconds)
- Browser blocked due to user gesture requirement

**Solution**: Ensure action is triggered by user click, not auto-invoked

#### 5. "Challenge not found or expired"
**Cause**: Challenge expired (5 minutes) or user took too long  
**Solution**: Generate new options and try again

#### 6. "HTTP not allowed"
**Cause**: Using HTTP in production  
**Solution**: Use HTTPS (localhost is exempt)

#### 7. "Passkey not syncing to other devices"
**Causes**:
- iCloud Keychain disabled
- Google Password Manager not syncing
- Different ecosystems (Apple ↔ Android)

**Solution**: Register separate passkey on each device

---

## Production Deployment Checklist

- [ ] HTTPS enabled (required)
- [ ] `WEBAUTHN_RP_ID` set to production domain
- [ ] `WEBAUTHN_ORIGIN` set to production origin
- [ ] JWT secrets rotated and secured
- [ ] MongoDB indexes created
- [ ] Audit logging to persistent storage
- [ ] Error tracking (Sentry, etc.)
- [ ] Rate limiting on endpoints
- [ ] CORS configured correctly
- [ ] Security headers set (CSP, etc.)
- [ ] Backup/recovery process documented
- [ ] User education materials prepared

---

## Performance

### Latency

| Operation | Latency |
|-----------|---------|
| Generate options | < 50ms |
| Browser WebAuthn prompt | 1-3s (user interaction) |
| Verify credential | < 100ms |
| Total login flow | 2-5s (including biometric) |

### Scaling

- **Challenges**: In-memory (consider Redis for multi-server)
- **Public keys**: MongoDB (indexed by credentialId)
- **JWT tokens**: Stateless (scales infinitely)

---

## References

- [W3C WebAuthn Specification](https://www.w3.org/TR/webauthn-2/)
- [SimpleWebAuthn Library](https://simplewebauthn.dev/)
- [WebAuthn Guide by Auth0](https://webauthn.guide/)
- [FIDO Alliance](https://fidoalliance.org/)

---

## License

MIT - See [LICENSE](./LICENSE)

---

**Jai Baba Ki!** 🔓


<!-- -------------------------- -->
<!-- 🔥 JWT-BABA BY SHREYANK 🔥 -->
<!-- -------------------------- -->

<p align="center">
  <img src="https://github.com/Shreyank108/JWT-Placeholder/blob/main/public/jwt-baba.png" alt="JWT Baba Logo" width="300"/>
</p>

<h1 align="center">🔐 JWT BABA</h1>

<p align="center">
  <b>Secure authentication in seconds — just chant <code>jai baba ki</code> 🧙‍♂️</b><br/>
  🔥 Plug &amp; Play JWT + Passkey Auth for Express + MongoDB
</p>

<p align="center">
  <img src="https://img.shields.io/npm/v/jwt-baba?color=purple&style=for-the-badge" />
  <img src="https://img.shields.io/npm/dm/jwt-baba?color=blueviolet&style=for-the-badge" />
  <img src="https://img.shields.io/github/license/Shreyank108/jwt-baba?style=for-the-badge" />
  <img src="https://img.shields.io/github/stars/Shreyank108/jwt-baba?style=social" />
</p>

<p align="center">
  <i>No password? No problem. No time? Also no problem. Baba ke paas sab ka solution hai.</i> 🙏
</p>

---

## 📖 Table of Contents

- [The Baba Origin Story](#-the-baba-origin-story)
- [What is JWT BABA?](#-what-is-jwt-baba)
- [Installation](#-installation)
- [Environment Setup](#️-environment-setup)
- [Quick Start](#-quick-start)
- [Auth Routes](#-auth-routes-provided)
- [Custom User Fields](#-add-custom-fields-to-user)
- [Protecting Routes](#️-using-authmiddleware)
- [React Integration](#-react-integration-guide)
- [Security Features](#-security-features)
- [Docs & Roadmap](#-documentation)
- [FAQ](#-frequently-asked-questions-baba-answers)

---

## 🕉️ The Baba Origin Story

*Ye baat hai aaj se 4000 saal purani...* 🧘

Ek developer tha. Bahut pareshaan tha. `bcrypt`, `jsonwebtoken`, refresh tokens, rate limiters — sab alag-alag packages, sab alag-alag documentation, aur bugs itne ki puch mat. Raat ko neend nahi aati thi, sirf `401 Unauthorized` sapno mein aata tha.

Phir ek din, dhyaan mein baithe-baithe, gyaan mila: **"Beta, auth ko complicated banana band kar. Ek package bana, jo sab sambhal le."**

Aur waha se janam hua — **JWT BABA**. 🔥

Ab tu bhi pareshaan mat ho. Bas `npm install jwt-baba` kar, aur *jai baba ki* bol.

---

## 🧠 What is JWT BABA?

A **flagship authentication package** for Node.js developers using Express and MongoDB.

It gives you **password auth**, **JWT access/refresh tokens**, and **passwordless biometric login** (WebAuthn/Passkeys — fingerprint, Face ID, Windows Hello) — all wired up and ready in **under a minute**. No boilerplate, no 3 AM `jwt.verify()` debugging sessions.

### 🎯 Key Features

| | Feature | What it does |
|---|---------|---------------|
| 🔐 | **Password Authentication** | Classic email/password login, done right |
| 👆 | **Passkey Authentication** | Biometric login — Touch ID, Face ID, Windows Hello |
| 🔄 | **JWT Tokens** | Access + Refresh tokens with automatic rotation |
| 🛡️ | **Rate Limiting** | Built-in brute-force protection out of the box |
| 📝 | **Audit Logging** | Every auth event, logged and traceable |
| 🚀 | **Plug & Play** | Zero config required to get started |
| 🔒 | **Production Ready** | Enterprise-grade security defaults |

---

## 📦 Installation

```bash
npm install jwt-baba
```

That's it. One command. Baba doesn't believe in a 10-step install wizard.

---

## ⚙️ Environment Setup

Create a `.env` file in your project root and fill it in:

```env
# Server
PORT=5000

# MongoDB
MONGO_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/myDB
DB_USER=your-username
DB_PASS=your-password

# JWT Authentication
JWT_SECRET=your-super-secret-key-min-32-chars
JWT_REFRESH_SECRET=separate-refresh-secret-key
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d

# WebAuthn/Passkey (Optional - for biometric auth)
WEBAUTHN_RP_ID=localhost
WEBAUTHN_ORIGIN=http://localhost:5000
```

> ⚠️ **Baba's warning:** Never commit your `.env` file. Never hardcode secrets. Never share your `JWT_SECRET` in a group chat, even to "just test something quickly." Respect the secret, or the secret won't respect your production server.

---

## 🚀 Quick Start

### 1️⃣ Password-Only Authentication

```js
const express = require('express');
const cors = require('cors');
const app = express();
require('dotenv').config();

// ✅ Add Middleware
app.use(cors({ origin: 'http://localhost:5173', credentials: true }));
app.use(express.json());

// ✅ Initialize JWT-BABA
const initAuthSystem = require('jwt-baba');
initAuthSystem(app); // 🪄 Baba is activated!
```

### 2️⃣ With Passkey/Biometric Authentication

```js
const express = require('express');
const cors = require('cors');
const app = express();
require('dotenv').config();

app.use(cors({ origin: 'http://localhost:5173', credentials: true }));
app.use(express.json());

// ✅ Initialize JWT-BABA with WebAuthn
const initAuthSystem = require('jwt-baba');
initAuthSystem(app, {
  webauthn: {
    rpName: 'My Application',              // Your app name
    rpID: process.env.WEBAUTHN_RP_ID,      // Domain (e.g., 'example.com')
    origin: process.env.WEBAUTHN_ORIGIN    // Full origin (e.g., 'https://example.com')
  }
}); // 🪄 Baba is activated with passkey power!
```

That's the whole setup. Seriously. Go touch grass now, Baba's got the rest. 🌱

---

## 🔐 Auth Routes Provided

### Password Authentication

| Method | Route                 | Description                   |
|--------|-----------------------|-------------------------------|
| POST   | `/api/auth/register`  | Register user + get tokens    |
| POST   | `/api/auth/login`     | Login & get JWT tokens        |
| POST   | `/api/auth/refresh`   | Refresh access token          |
| POST   | `/api/auth/logout`    | Revoke refresh token          |
| POST   | `/api/auth/verify`    | Verify token validity         |

### Passkey/Biometric Authentication (WebAuthn)

| Method | Route                                | Description                        |
|--------|--------------------------------------|------------------------------------|
| POST   | `/api/auth/passkey/register/options` | Get passkey registration options   |
| POST   | `/api/auth/passkey/register/verify`  | Verify & store passkey credential  |
| POST   | `/api/auth/passkey/login/options`    | Get passkey login options          |
| POST   | `/api/auth/passkey/login/verify`     | Verify passkey & get JWT tokens    |
| GET    | `/api/auth/passkey/list`             | List user's registered passkeys    |
| DELETE | `/api/auth/passkey/:passkeyId`       | Remove a passkey                   |
| PATCH  | `/api/auth/passkey/:passkeyId`       | Update passkey device name         |

### Protected Routes (Example)

| Method | Route        | Description           |
|--------|--------------|-----------------------|
| GET    | `/protected` | Test-protected route  |

🧾 **Token Format (Frontend)**

```
Authorization: Bearer <your_access_token>
```

---

## ✨ Add Custom Fields to User

> Want to save `image`, `bio`, `phoneNumber`, etc? Baba doesn't mind. Add whatever you want.

### ✅ Step 1: Create Custom User Model

```js
// models/User.js

const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: String,
  image: String,
  bio: String,
  dob: Date,
  phoneNumber: String,
});

module.exports = mongoose.models.User || mongoose.model('User', userSchema);
```

### ✅ Step 2: Inject Custom User

```js
const initAuthSystem = require('jwt-baba');
const customUserModel = require('./models/User');

initAuthSystem(app, { customUserModel });
```

---

## 🧙‍♂️ Using `authMiddleware`

JWT-BABA provides ready-made middleware to **protect any route**.

### ✅ Import & Apply

```js
const { authMiddleware, User } = require('jwt-baba');

app.get('/me', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: 'Something went wrong' });
  }
});
```

**🔥 `req.user` already contains decoded ID & email**

---

## 📂 Project Structure (Recommended)

```bash
your-app/
├── models/
│   └── User.js          # ← custom user schema
├── routes/
│   └── other-routes.js
├── server.js
└── .env
```

---

## 💻 React Integration Guide

### ✅ Password Authentication

#### Step 1: Registration

```js
const handleRegister = async () => {
  const res = await axios.post('http://localhost:5000/api/auth/register', {
    name, email, password
  });

  // Store tokens
  localStorage.setItem('accessToken', res.data.accessToken);
  localStorage.setItem('refreshToken', res.data.refreshToken);
  alert("User registered & logged in!");
};
```

#### Step 2: Login

```js
const handleLogin = async () => {
  const res = await axios.post('http://localhost:5000/api/auth/login', {
    email, password
  });

  // Store tokens
  localStorage.setItem('accessToken', res.data.accessToken);
  localStorage.setItem('refreshToken', res.data.refreshToken);
  alert("Login successful!");
};
```

#### Step 3: Protecting React Routes

```js
useEffect(() => {
  const fetchUser = async () => {
    const token = localStorage.getItem('accessToken');
    if (!token) return;

    const res = await axios.get('http://localhost:5000/me', {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    console.log(res.data); // ← Logged-in user info
  };

  fetchUser();
}, []);
```

---

### 👆 Passkey/Biometric Authentication

#### Option 1: Use Pre-built React Component

```jsx
import PasskeyAuth from 'jwt-baba/examples/PasskeyAuth';

function App() {
  return <PasskeyAuth apiBase="http://localhost:5000/api" />;
}
```

#### Option 2: Use Pre-built HTML Demo

Open [`node_modules/jwt-baba/examples/passkey-browser.html`](./examples/passkey-browser.html) in your browser.

#### Option 3: Build Your Own

See complete example in [`examples/PasskeyAuth.jsx`](./examples/PasskeyAuth.jsx).

**Key Steps:**
1. User clicks "Login with Passkey"
2. Call `/api/auth/passkey/login/options` to get challenge
3. Use `navigator.credentials.get()` to invoke biometric prompt
4. Send credential to `/api/auth/passkey/login/verify`
5. Store returned JWT tokens

```js
// Simplified passkey login
const handlePasskeyLogin = async (email) => {
  // Step 1: Get options
  const optionsRes = await fetch('/api/auth/passkey/login/options', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email })
  });
  const options = await optionsRes.json();

  // Step 2: Browser biometric prompt
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

  // Step 3: Verify with server
  const verifyRes = await fetch('/api/auth/passkey/login/verify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, credential: serializeCredential(credential) })
  });

  const { accessToken, refreshToken } = await verifyRes.json();
  localStorage.setItem('accessToken', accessToken);
  localStorage.setItem('refreshToken', refreshToken);
};
```

**📖 Full Documentation:** See [`WEBAUTHN.md`](./WEBAUTHN.md) for complete passkey integration guide with architecture diagrams.

---


## 🧾 Axios with Token (Frontend)

```js
axios.get('http://localhost:5000/me', {
  headers: {
    Authorization: `Bearer ${localStorage.getItem('authToken')}`
  }
});
```

Copy, paste, change nothing else, move on with your life.

---

## 📸 Screenshots

<p align="center">
  <img src="https://github.com/Shreyank108/JWT-Placeholder/blob/main/public/image.png" alt="JWT Baba Demo" width="600" />
</p>

---

## 📚 Documentation

- **[WEBAUTHN.md](./WEBAUTHN.md)** - Complete WebAuthn/Passkey guide with architecture diagrams
- **[SECURITY.md](./SECURITY.md)** - Security features, token rotation, rate limiting, audit logs
- **[UPGRADES.md](./UPGRADES.md)** - Migration guide from v1.x to v2.x
- **[examples/](./examples/)** - Browser HTML and React component examples

---

## 🔒 Security Features

| Feature | Description |
|---------|-------------|
| **Dual Token System** | Access (15m) + Refresh (7d) tokens with rotation |
| **Rate Limiting** | 5 login attempts per 15 minutes per user |
| **Token Rotation** | New tokens on every refresh; old ones revoked |
| **Token Blacklist** | Instant logout & session revocation |
| **Audit Logging** | JSON logs for all auth events |
| **JTI Tracking** | Prevents token replay attacks |
| **WebAuthn/Passkeys** | Biometric authentication (no passwords stored) |
| **Challenge Expiry** | 5-minute challenge timeout |
| **Counter Validation** | Replay protection for passkeys |
| **Origin Verification** | Prevents cross-domain attacks |

---

## 🧪 Future Roadmap

- [x] WebAuthn/Passkey authentication
- [x] Token rotation & refresh
- [x] Rate limiting
- [x] Audit logging
- [ ] `npx create-baba-app` CLI
- [ ] OAuth login (Google, GitHub)
- [ ] Admin/Role middleware
- [ ] Built-in UI components library
- [ ] TypeScript Support
- [ ] Redis support for distributed systems

---

## ⚠️ Name Protection Notice

**jwt-baba** is a creative identity built with love and purpose.

Please don’t publish similarly named packages on NPM.
If inspired, feel free to fork — just credit the baba 🙏

> "Saaf shabdo mein — ye naam use mat karna, ghode." 😂

---

## ❓ Frequently Asked Questions (Baba Answers)

**Q: Kya ye production mein use kar sakte hain?**
Baba: Haan beta, isiliye toh bana hai. Rate limiting, token rotation, audit logs — sab already lagaya hua hai.

**Q: MongoDB ke bina chalega kya?**
Baba: Nahi beta. Baba ko Mongoose chahiye prasad chadhane ke liye. 🙏

**Q: Passkey samajh nahi aa raha, kya karu?**
Baba: Ghabra mat. [`WEBAUTHN.md`](./WEBAUTHN.md) padh, diagrams ke saath sab samjhaya hai.

**Q: Bug mil gaya, ab kya karu?**
Baba: Issue khol GitHub pe, ya PR bhej. Baba sab dekh lega. 🧙‍♂️

**Q: Kya main apna khud ka `jwt-baba-2` bana sakta hoon?**
Baba: *(dhyaan se dekhta hai)* ... beta, [naam protection notice](#️-name-protection-notice) padh le pehle. 😄

---

## 👨‍💻 Author

Made with ❤️ by **Shreyank Agrawal**

> “Phool hai gulaab ka, sugandh lijiye,  
> Unemployed hai guys , support kijiye.” 😄

---

## 🧙‍♂️ Final Blessing

```bash
# In your terminal after setup:
jai baba ki 🔥
```

Thanks for using **JWT BABA** — may your APIs stay protected, your passkeys work flawlessly, and bugs stay away!

### 🎯 What Makes JWT-BABA Flagship?

- ✅ **Production-ready** WebAuthn implementation (no custom biometric code)
- ✅ **Zero biometric data storage** (only cryptographic public keys)
- ✅ **Works with Touch ID, Face ID, Windows Hello, security keys**
- ✅ **Multi-device passkey support** (register on MacBook, login on iPhone)
- ✅ **Backward compatible** (existing password auth continues to work)
- ✅ **Enterprise security** (rate limiting, audit logs, token rotation)
- ✅ **Developer friendly** (plug & play, comprehensive docs)


<hr>

# 🧙‍♂️ Contributions
Pull requests are welcome. For major changes, open an issue first.
Respect Baba. Respect Auth.

# 📜 License
MIT

# See You Soon Vatsh 
<img src="https://github.com/Shreyank108/JWT-Placeholder/blob/main/public/discription.png" alt="JWT Baba Logo" width=600 />


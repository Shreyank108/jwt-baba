
<!-- -------------------------- -->
<!-- 🔥 JWT-BABA BY SHREYANK 🔥 -->
<!-- -------------------------- -->

<p align="center">
  <img src="https://github.com/Shreyank108/jwt-baba/blob/main/public/jwt-baba.png?raw=true" alt="JWT Baba Logo" width="300"/>
</p>

# 🔐 JWT BABA

> Secure authentication in seconds — just chant `jai baba ki` 🧙‍♂️  
> 🔥 Plug & Play JWT Auth for Express + MongoDB

<p align="center">
  <img src="https://img.shields.io/npm/v/jwt-baba?color=purple&style=for-the-badge" />
  <img src="https://img.shields.io/github/license/Shreyank108/jwt-baba?style=for-the-badge" />
  <img src="https://img.shields.io/github/stars/Shreyank108/jwt-baba?style=social" />
</p>

---
## Story ... 
To ye baat hai aaj se 4000 saal purani, jb m authentication m problem face krta tha ,, m bahut pareshaan tha ,,,

## 🧠 What is JWT BABA?

A **zero-config authentication package** for Node.js developers using Express and MongoDB.  
Easily add registration, login, JWT tokens, and protected routes — in **less than 1 minute**.

---

## 📦 Installation

```bash
npm install jwt-baba
```

---

## ⚙️ Environment Setup

`.env` file in root:

```env
PORT=5000
MONGO_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/myDB
JWT_SECRET=shreyankislegend
```

---

## 🚀 Quick Start

### 📝 `server.js`

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

---

## 🔐 Auth Routes Provided

| Method | Route                 | Description                   |
|--------|-----------------------|-------------------------------|
| POST   | `/api/auth/register`  | Register user                 |
| POST   | `/api/auth/login`     | Login & get JWT token         |
| GET    | `/protected`          | Test-protected route          |

🧾 **Token Format (Frontend)**

```
Authorization: Bearer <your_token>
```

---

## ✨ Add Custom Fields to User

> Want to save `image`, `bio`, `phoneNumber`, etc? Easy!

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

### ✅ Step 1: Registration + Auto Login

```js
const handleRegister = async () => {
  const res = await axios.post('http://localhost:5000/api/auth/register', {
    name, email, password
  });

  // 🧙 Auto-login after register
  const loginRes = await axios.post('http://localhost:5000/api/auth/login', {
    email, password
  });

  localStorage.setItem('authToken', loginRes.data.token);
  alert("User logged in!");
};
```

---

### ✅ Step 2: Protecting React Routes

```js
useEffect(() => {
  const fetchUser = async () => {
    const token = localStorage.getItem('authToken');
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


## 🧾 Axios with Token (Frontend)

```js
axios.get('http://localhost:5000/me', {
  headers: {
    Authorization: `Bearer ${localStorage.getItem('authToken')}`
  }
});
```

---

## 📸 Screenshots

<p align="center">
  <img src="https://github.com/Shreyank108/jwt-baba/blob/main/public/image.png?raw=true" alt="JWT Baba Demo" width="600" />
</p>

---

## 🧪 Future Roadmap

- [ ] `npx create-baba-app` CLI
- [ ] OAuth login (Google, GitHub)
- [ ] Admin/Role middleware
- [ ] Built-in UI components for login/register
- [ ] TypeScript Support

---

## ⚠️ Name Protection Notice

**jwt-baba** is a creative identity built with love and purpose.

Please don’t publish similarly named packages on NPM.  
If inspired, feel free to fork — just credit the baba 🙏

"Saaf shabdo m ye naam use mt krna ghode "
---

## 👨‍💻 Author

Made with ❤️ by **Shreyank Agrawal**

> “Phool hai gulaab ka, sugandh lijiye,  
> Unemployed hai guys , support kijiye.” 😄

---

## 🧙‍♂️ Final Blessing
 <p><b>NOTE : </b>Write this in your terminal for jwt-baba activation</p>

```bash
# In your terminal after setup:
jai baba ki 🔥
```

Thanks for using **JWT BABA** — may your APIs stay protected and bugs stay away!


<hr>

# 🧙‍♂️ Contributions
Pull requests are welcome. For major changes, open an issue first.
Respect Baba. Respect Auth.

# 📜 License
MIT

# See You Soon Vatsh 
<img src="https://github.com/Shreyank108/jwt-baba/blob/main/public/discription.png?raw=true" alt="JWT Baba Logo" width=600 />


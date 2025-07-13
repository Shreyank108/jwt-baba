
<!-- -------------------------- -->
<!-- 🔥 JWT-BABA BY SHREYANK 🔥 -->
<!-- -------------------------- -->

<p align="center">
  <img src="https://github.com/Shreyank108/jwt-baba/blob/main/public/jwt-baba.png?raw=true" alt="JWT Baba Logo" width="300"/>
</p>

<h1 align="center">🔐 JWT Baba</h1>

<p align="center"><i>Secure authentication just by chanting <code>"jai baba ki"</code></i></p>

<p align="center">
  <img src="https://img.shields.io/npm/v/jwt-baba?color=purple&style=for-the-badge" />
  <img src="https://img.shields.io/github/license/Shreyank108/jwt-baba?style=for-the-badge" />
  <img src="https://img.shields.io/github/stars/Shreyank108/jwt-baba?style=social" />
</p>

---

## 🧠 What is JWT Baba?

A plug-and-play authentication module built with Node.js, Express, MongoDB, and JWT.  
Setup auth in seconds — just install the package, type `jai baba ki`, and you're protected!

---

## 📦 Installation

```bash
npm install jwt-baba
```
# 🚀 Quick Start
server.js or index.js 
``` js
const express = require('express');
const app = express();
require('dotenv').config();

const initAuthSystem = require('jwt-baba');

initAuthSystem(app);
```

# 🔐 Routes Provided
Method	Route	Description
POST	/api/auth/register	Register user
POST	/api/auth/login	Login + Token
GET	/protected	Protected Route

🔑 Use token as Bearer:

```makefile

Authorization: Bearer <your_token_here>

```
# 🧾 .env File Example
```

PORT=5000
MONGO_URI=Ab ye bhi mai batau
JWT_SECRET=shreyankislegend
```
📁 Folder Structure
```pgsql

jwt-baba/
├── index.js
├── auth/
│   ├── authRoutes.js
│   └── authMiddleware.js
├── models/
│   └── User.js
├── utils/
│   └── babaBlessing.js
├── .env.example
├── package.json
└── README.md
```
# 🪄 Terminal Blessing
``` bash
Type "jai baba ki" to activate JWT Baba 🔓
```
# 📸 Screenshots
<img src="https://github.com/Shreyank108/jwt-baba/blob/main/public/image.png?raw=true" alt="JWT Baba Logo" />

# ✍️ Custom Fields kaise Add karein?
By default, JWT Baba ek simple User schema use karta hai (name, email, password).
Lekin agar aapko extra fields chahiye like:

🖼️ image || 📜 bio || 🎂 dob || 🧵 posts (array) || 📞 phoneNumber

Toh aap simply apna User.js banakar override kar sakte ho.

# 📁 Suggested Folder Structure
Apne app me kuch is tarah rakho:

```sql
your-app/
├── models/
│   └── User.js        ← 👈 Yaha apna custom user model banao
├── server.js
└── ...
```

🛠️ Example: Custom User Model

```js
// /models/User.js

const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: String,
  image: String,
  bio: String,
  dob: Date,
  posts: [String],
  phoneNumber: String,
});

module.exports = mongoose.model('User', userSchema);
```
# 🔁 How to Override JWT Baba's Default Model
JWT Baba allows you to override the internal User model.
Just import initAuthSystem from jwt-baba, and set your own User like this:

```js
// server.js

const express = require('express');
const app = express();
require('dotenv').config();

const initAuthSystem = require('jwt-baba');
const { authMiddleware } = require('jwt-baba');

// 👇 Apna custom user model inject karo
const customUserModel = require('./models/User');
initAuthSystem(app, { customUserModel });
```
⚠️ jwt-baba automatically uses your customUserModel if passed during setup.

# ✅ Ab kya hoga?
Registration aur login ke waqt extra fields bhi MongoDB me save ho jaayenge.

req.user me bhi saare updated fields honge.

Tu completely control me rahega ki User schema me kya ho.

# <h1> ⚙️ Advanced Usage with jwt-baba </h1>

# ✅ CORS Setup
No rocket science needed. Just this on your backend:

```js
const cors = require('cors');

app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true,
}));
```
And on frontend (React, etc), you're all set. Axios already works:

```js
axios.post('http://localhost:5000/api/auth/register', {
  email: "user@gmail.com",
  password: "123456"
});
```
Or with token:

```js
axios.get('http://localhost:5000/me', {
  headers: {
    Authorization: `Bearer ${token}`
  },
  withCredentials: true
});
```
# 🛠️ Register & Login (Frontend)
Just two simple functions:

```js

// Register
const registerUser = async () => {
  const res = await axios.post('http://localhost:5000/api/auth/register', {
    email,
    password,
  });
  console.log(res.data); // includes token
};

// Login
const loginUser = async () => {
  const res = await axios.post('http://localhost:5000/api/auth/login', {
    email,
    password,
  });
  localStorage.setItem('token', res.data.token);
};
```
# 🧙 Custom User.js (if needed)

If you want extra fields like bio, image, etc., just create your own model:

```js
// models/User.js
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email: String,
  password: String,
  bio: String,
  image: String
});

module.exports = mongoose.model('User', userSchema);
```

Use it like this:

```js
const User = require('./models/User');

app.get('/me', authMiddleware, async (req, res) => {
  const user = await User.findById(req.user.id).select('-password');
  res.json(user);
});
```
# 👤 /me Route (Get Logged-in User)

``JWT`` Baba already gives you the ``req.user`` after middleware. You can easily create a /me route:

```js

const { authMiddleware, User } = require('jwt-baba');

app.get('/me', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});
```
That’s it.

## 🔭 Future Scope

- [ ] 🧪 Add CLI to auto-generate folder structure and custom `User.js`
- [ ] 🔐 OAuth (Google, GitHub) login support
- [ ] 🛠️ Admin middleware and role-based access
- [ ] 🧙‍♂️ `npx create-baba-app` — Zero-config auth starter
- [ ] 📦 TypeScript support

## ⚠️ Important Note

The name **jwt-baba** is a unique and creative identity built with purpose and vision.  
Please refrain from publishing any ``npm package`` using the same or deceptively similar name.

> Respecting original work fosters a stronger and more collaborative developer community. 🙏

If you're inspired by this project and wish to extend it, feel free to ``contribute`` or fork with proper attribution.


# 👨‍💻 Author
Made with ❤️ by Shreyank Agrawal

"Seekho || Explore kro || Invent kro" — JWT Baba 🧙‍♂️

<p>Ek last line ,bahut man kr rha tha bol du</p> 

"Phool hai gulaab ka , Sughandh ligiye <br>
"Hum thode se unemployed hai support kijiye"

<hr>

# 🧙‍♂️ Contributions
Pull requests are welcome. For major changes, open an issue first.
Respect Baba. Respect Auth.

# 📜 License
MIT

# See You Soon Vatsh 
<img src="https://github.com/Shreyank108/jwt-baba/blob/main/public/discription.png?raw=true" alt="JWT Baba Logo" width=600 />



<!-- -------------------------- -->
<!-- 🔥 JWT-BABA BY SHREYANK 🔥 -->
<!-- -------------------------- -->

<p align="center">
  <img src="jwt-baba.png" alt="JWT Baba Logo" width="200"/>
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
``` js
Copy
Edit
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
Copy
Edit
Authorization: Bearer <your_token_here>
🧾 .env File Example
```
```env
Copy
Edit
PORT=5000
MONGO_URI=Ab ye bhi mai batau
JWT_SECRET=shreyankislegend
```
📁 Folder Structure
```pgsql
Copy
Edit
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
Copy
Edit
Type "jai baba ki" to activate JWT Baba 🔓
```
# 📸 Screenshots
<img src="image.png" alt="JWT Baba Logo" />

# 👨‍💻 Author
Made with ❤️ by Shreyank Agrawal

"Secure toh sab karte hain, swag se karo." — JWT Baba 🧙‍♂️

<p>Ek last line ,bahut man kr rha tha bol du</p> 
"Phool hai gulaab ka , Sughandh ligiye"
"Dost hai l*du ke support kijiye"

🧙‍♂️ Contributions
Pull requests are welcome. For major changes, open an issue first.
Respect Baba. Respect Auth.

📜 License
MIT


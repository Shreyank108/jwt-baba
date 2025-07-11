
# jwt-baba
Plug-and-play JWT authentication system with Express, Mongoose, middleware, and Babaji-powered CLI.
=======

# 🔐 JWT-BABA v1.0.0

> Authentication made easy, secure & magical — **just say _jai baba ki_** ✨

JWT-BABA is a plug-and-play authentication system built on Node.js, Express, and MongoDB. No boilerplate, no setup headache — just install and get blessed with working auth.

---

## ✨ Features

✅ Register & Login APIs using JWT  
✅ MongoDB integration with Mongoose  
✅ Password encryption with bcrypt  
✅ Secure middleware for protected routes  
✅ `babaji.txt` file & CLI blessing system 🤘  
✅ Ready to use in any Express app

---

## 🚀 Installation

```bash
npm install jwt-baba
📁 Project Structure (After Install)
js
Copy
Edit
// server.js (your file)
const express = require('express');
const app = express();
const initAuthSystem = require('jwt-baba');

initAuthSystem(app);
⚙️ Environment Variables
Create a .env file in your root directory:

env
Copy
Edit
PORT=5000
MONGO_URI=your_mongodb_atlas_uri
JWT_SECRET=your_super_secret_key
Or refer to .env.example provided.

🔓 CLI Blessing (Fun Terminal Input)
When you run the project, you’ll see:

graphql
Copy
Edit
Type "jai baba ki" to activate JWT Baba:
If you type wrong, Baba gets angry 😡
If you type it right — Auth system begins with full power 💥

🔐 Auth API Usage
➕ Register
http
Copy
Edit
POST /api/auth/register
Content-Type: application/json

{
  "name": "shreyank",
  "email": "shreyank@jwt.com",
  "password": "baba123"
}
🔑 Login
http
Copy
Edit
POST /api/auth/login
Content-Type: application/json

{
  "email": "shreyank@jwt.com",
  "password": "baba123"
}
Returns:

json
Copy
Edit
{
  "token": "your_jwt_token"
}
🛡️ Protected Routes
js
Copy
Edit
const { authMiddleware } = require('jwt-baba');

app.get('/secret', authMiddleware(process.env.JWT_SECRET), (req, res) => {
  res.send(`Hello ${req.user.email}, Baba ki kripa tumpe hai.`);
});
📄 babaji.txt
Generated in project root automatically:

vbnet
Copy
Edit
Package: jwt-baba
Created by: Shreyank Agrawal
Date: Wed Jul 10 2025
Description: JWT authentication ka baba.

Yeh sab Shreyank ne akela kiya hai.

To activate baba's blessing, type below:
>>
💬 Why JWT-BABA?
Because writing auth logic again & again is boring 😴
So we added ✨ magic, memes, and modularity ✨

📜 License
MIT — free to use, free to modify, Baba ki kripa sab par barqaraar rahe 🧘

👑 Created by
Shreyank Agrawal
GitHub | LinkedIn

yaml
Copy
Edit

---

## ✅ Next Step

Bol bhai:
- `README.md` paste kar du file me?
- Fir chalte hain `npm publish` wale step pe — live karne ka full step-by-step de dunga 🔥

Ready? 😎


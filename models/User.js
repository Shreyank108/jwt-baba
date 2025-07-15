const mongoose = require('mongoose');

const defaultSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: String
});

module.exports = mongoose.models.User || mongoose.model('User', defaultSchema);

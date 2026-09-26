const mongoose = require('mongoose');

const defaultSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true, required: true },
  password: { type: String, required: false },
  webauthnUserId: {
    type: String,
    unique: true,
    sparse: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for passkeys
defaultSchema.virtual('passkeys', {
  ref: 'Passkey',
  localField: '_id',
  foreignField: 'userId'
});

// Check if user has any authentication method
defaultSchema.methods.hasAuthMethod = function() {
  return !!this.password || this.webauthnUserId;
};

module.exports = mongoose.models.User || mongoose.model('User', defaultSchema);

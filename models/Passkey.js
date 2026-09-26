const mongoose = require('mongoose');

const passkeySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  credentialId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  credentialPublicKey: {
    type: Buffer,
    required: true
  },
  counter: {
    type: Number,
    required: true,
    default: 0
  },
  credentialDeviceType: {
    type: String,
    enum: ['singleDevice', 'multiDevice'],
    default: 'multiDevice'
  },
  credentialBackedUp: {
    type: Boolean,
    default: false
  },
  transports: {
    type: [String],
    default: []
  },
  deviceName: {
    type: String,
    default: 'Unknown Device'
  },
  aaguid: {
    type: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  lastUsedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for efficient queries
passkeySchema.index({ userId: 1, createdAt: -1 });

// Update lastUsedAt on authentication
passkeySchema.methods.updateLastUsed = function() {
  this.lastUsedAt = new Date();
  return this.save();
};

module.exports = mongoose.models.Passkey || mongoose.model('Passkey', passkeySchema);

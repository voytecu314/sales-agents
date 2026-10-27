const mongoose = require('mongoose');

const providerKeySchema = new mongoose.Schema({
  slug: { type: String, required: true, index: true },
  provider: { type: String, required: true, maxlength: 40 },
  ciphertext: { type: String, required: true, select: false },
  iv: { type: String, required: true, select: false },
  authTag: { type: String, required: true, select: false },
  last4: { type: String, required: true, maxlength: 4 },
  position: { type: Number, default: 0 },
  status: { type: String, enum: ['active', 'invalid'], default: 'active' },
  cooldownUntil: { type: Date, default: null },
  lastTestedAt: Date
}, { timestamps: true });

providerKeySchema.index({ slug: 1, provider: 1, position: 1 });
module.exports = mongoose.models.ProviderKey || mongoose.model('ProviderKey', providerKeySchema);

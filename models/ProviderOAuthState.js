const mongoose = require('mongoose');

const providerOAuthStateSchema = new mongoose.Schema({
  slug: { type: String, required: true, index: true },
  stateHash: { type: String, required: true, unique: true },
  verifierCiphertext: { type: String, required: true },
  verifierIv: { type: String, required: true },
  verifierAuthTag: { type: String, required: true },
  expiresAt: { type: Date, required: true }
}, { timestamps: true });

providerOAuthStateSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
module.exports = mongoose.models.ProviderOAuthState || mongoose.model('ProviderOAuthState', providerOAuthStateSchema);

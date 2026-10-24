const mongoose = require('mongoose');

// Logos live in their own collection so the agent document (read on every message) stays small.
const logoSchema = new mongoose.Schema({
  slug: { type: String, required: true, unique: true },
  contentType: { type: String, required: true, enum: ['image/png', 'image/jpeg', 'image/webp'] },
  data: { type: Buffer, required: true }
});

module.exports = mongoose.models.Logo || mongoose.model('Logo', logoSchema);

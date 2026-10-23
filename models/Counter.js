const mongoose = require('mongoose');

// One document per counter: rate limit windows and daily caps. MongoDB deletes them by itself
// when `expireAt` passes (TTL index), so nothing needs cleaning up.
const counterSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true },
  count: { type: Number, default: 0 },
  expireAt: { type: Date, required: true, index: { expires: 0 } }
});

module.exports = mongoose.models.Counter || mongoose.model('Counter', counterSchema);

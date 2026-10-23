const mongoose = require('mongoose');

// "Report this assistant" clicks from visitors.
const reportSchema = new mongoose.Schema({
  slug: { type: String, required: true, index: true },
  reason: { type: String, default: '', maxlength: 300 },
  expireAt: { type: Date, default: () => new Date(Date.now() + 180 * 86_400_000), index: { expires: 0 } }
}, { timestamps: { createdAt: true, updatedAt: false } });

module.exports = mongoose.models.Report || mongoose.model('Report', reportSchema);

const mongoose = require('mongoose');

const RETENTION_DAYS = Number(process.env.LEAD_RETENTION_DAYS) || 90;

// A contact request from a visitor. Personal data: deleted automatically after RETENTION_DAYS.
const leadSchema = new mongoose.Schema({
  slug: { type: String, required: true, index: true },
  name: { type: String, required: true, maxlength: 100 },
  email: { type: String, required: true, maxlength: 254 },
  message: { type: String, default: '', maxlength: 1000 },
  lang: { type: String, default: 'en' },                       // language the visitor used
  context: { type: [new mongoose.Schema({ role: { type: String, enum: ['user', 'assistant'] }, text: { type: String, maxlength: 600 } }, { _id: false })], default: [] }, // last chat messages, sent with the form
  emailed: { type: Boolean, default: false },
  expireAt: { type: Date, default: () => new Date(Date.now() + RETENTION_DAYS * 86_400_000), index: { expires: 0 } }
}, { timestamps: { createdAt: true, updatedAt: false } });

module.exports = mongoose.models.Lead || mongoose.model('Lead', leadSchema);

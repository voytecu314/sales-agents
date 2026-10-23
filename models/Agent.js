const mongoose = require('mongoose');
const { LANGS } = require('../services/i18n');

const quickReply = new mongoose.Schema({
  label: { type: String, required: true, maxlength: 40 },
  send: { type: String, required: true, maxlength: 200 }
}, { _id: false });

const locale = new mongoose.Schema({
  tagline: { type: String, default: '', maxlength: 100 },
  welcome: { type: String, required: true, maxlength: 400 },
  quickReplies: { type: [quickReply], default: [] }
}, { _id: false });

const agentSchema = new mongoose.Schema({
  slug: { type: String, required: true, unique: true, lowercase: true, trim: true }, // unique index
  name: { type: String, required: true, maxlength: 60 },
  emoji: { type: String, default: '💬', maxlength: 16 },
  language: { type: String, enum: LANGS, default: 'en' },   // main language of the company
  palette: {
    accent: String, accent2: String, accent3: String, bg: String, panel: String
  },
  locales: { en: locale, de: locale, pl: locale },
  systemPrompt: { type: String, required: true, maxlength: 12000 },
  status: { type: String, enum: ['active', 'paused'], default: 'active' },
  plan: { type: String, default: 'free' },                  // filled by Stripe later
  editTokenHash: { type: String, required: true, select: false } // sha256 of the owner's secret key
}, { timestamps: true });

module.exports = mongoose.models.Agent || mongoose.model('Agent', agentSchema);

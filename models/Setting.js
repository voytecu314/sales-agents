const mongoose = require('mongoose');

// Admin switches you can flip in the Atlas UI without redeploying, e.g.
// { key: "killSwitch", value: true } stops all LLM calls within ~15 seconds.
const settingSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true },
  value: mongoose.Schema.Types.Mixed
});

module.exports = mongoose.models.Setting || mongoose.model('Setting', settingSchema);

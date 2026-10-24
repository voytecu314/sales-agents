const mongoose = require('mongoose');

// A generated agent that the owner is still reviewing. The system prompt stays HERE, on the server:
// the browser only gets the draftId, so the owner never sees or changes the prompt.
const draftSchema = new mongoose.Schema({
  draftId: { type: String, required: true, unique: true },
  systemPrompt: { type: String, required: true },
  inputs: { type: Object, default: {} },
  expireAt: { type: Date, required: true, index: { expires: 0 } } // MongoDB deletes it after 2 hours
});

module.exports = mongoose.models.Draft || mongoose.model('Draft', draftSchema);

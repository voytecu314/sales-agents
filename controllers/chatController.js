// Demo chat: the single company prompt from prompts/company.txt (phase 1 behavior).
const { SYSTEM_PROMPT } = require('../services/prompt');
const { buildLlmMessages, respond } = require('../services/chatFlow');
const validateMessages = require('../utils/validateMessages');
const { buildLinkPolicy } = require('../services/linkPolicy');

const linkPolicy = buildLinkPolicy(SYSTEM_PROMPT);

async function chat(req, res) {
  const parsed = validateMessages(req.body?.messages);
  if (parsed.error) return res.status(400).json({ error: parsed.error });
  await respond(res, buildLlmMessages(SYSTEM_PROMPT, parsed.messages), { linkPolicy });
}

module.exports = { chat };

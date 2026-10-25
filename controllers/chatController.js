// Urban Web chat (POST /api/chat): the company prompt from prompts/urban_web.txt plus the shared platform rules.
const { COMPANY_PROMPT, promptFor } = require('../services/prompt');
const { buildLlmMessages, respond } = require('../services/chatFlow');
const validateMessages = require('../utils/validateMessages');
const { buildLinkPolicy } = require('../services/linkPolicy');
const { LANGS } = require('../services/i18n');

const linkPolicy = buildLinkPolicy(COMPANY_PROMPT); // links survive only if the company text contains them

async function chat(req, res) {
  const parsed = validateMessages(req.body?.messages);
  if (parsed.error) return res.status(400).json({ error: parsed.error });
  const lang = LANGS.includes(req.body?.lang) ? req.body.lang : null;
  await respond(res, buildLlmMessages(promptFor(lang), parsed.messages), { linkPolicy });
}

module.exports = { chat };

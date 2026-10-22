const { SYSTEM_PROMPT } = require('../services/prompt');
const { REMINDER } = require('../prompts/uiRules');
const { askChain } = require('../services/llm');
const cleanHtml = require('../utils/cleanHtml');
const htmlToText = require('../utils/htmlToText');
const validateMessages = require('../utils/validateMessages');

// Assistant turns come back from the client as compact text; wrap them so the
// model knows what they were.
const wrapAssistant = (text) => `[Your previous reply, shown to the customer as rich HTML. Text version: ${text}]`;

async function chat(req, res) {
  const parsed = validateMessages(req.body?.messages);
  if (parsed.error) return res.status(400).json({ error: parsed.error });

  const last = parsed.messages.length - 1;
  const messages = [
    { role: 'system', content: SYSTEM_PROMPT },
    ...parsed.messages.map((m, i) => ({
      role: m.role,
      content: m.role === 'assistant' ? wrapAssistant(m.content) : (i === last ? m.content + REMINDER : m.content)
    }))
  ];

  try {
    const raw = await askChain(messages);
    const html = cleanHtml(raw);
    if (!html) return res.status(502).json({ error: 'The model returned an empty response. Try again.' });

    // `text` is what the client sends back as the assistant side of the history
    res.json({ html, text: htmlToText(html) || '(visual reply)' });
  } catch (err) {
    console.error('LLM error:', err);
    res.status(err.status || 502).json({ error: err.message || 'AI providers are unavailable right now. Try again in a moment.' });
  }
}

module.exports = { chat };

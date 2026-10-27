// Shared by the demo chat (/api/chat) and the agent chat (/api/agents/:slug/chat).
const { REMINDER } = require('../prompts/uiRules');
const { askChain } = require('./llm');
const cleanHtml = require('../utils/cleanHtml');
const sanitizeHtml = require('../utils/sanitizeHtml');
const htmlToText = require('../utils/htmlToText');

// Assistant turns come back from the client as compact text; wrap them so the model knows what they were.
const wrapAssistant = (text) => `[Your previous reply, shown to the customer as rich HTML. Text version: ${text}]`;

function buildLlmMessages(systemPrompt, validated) {
  const last = validated.length - 1;
  return [
    { role: 'system', content: systemPrompt },
    ...validated.map((m, i) => ({
      role: m.role,
      content: m.role === 'assistant' ? wrapAssistant(m.content) : (i === last ? m.content + REMINDER : m.content)
    }))
  ];
}

async function respond(res, messages, { linkPolicy = null, llmOptions = {} } = {}) {
  try {
    const raw = await askChain(messages, llmOptions);
    const html = sanitizeHtml(cleanHtml(raw), { linkPolicy }); // cleanHtml tidies the format, the sanitizer makes it safe
    if (!html) return res.status(502).json({ error: 'The model returned an empty response. Try again.' });
    // `text` is what the client sends back as the assistant side of the history
    res.json({ html, text: htmlToText(html) || '(visual reply)' });
  } catch (err) {
    console.error('LLM error:', err);
    res.status(err.status || 502).json({ error: err.message || 'AI providers are unavailable right now. Try again in a moment.' });
  }
}

module.exports = { buildLlmMessages, respond };

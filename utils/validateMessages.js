// The client holds the whole conversation and sends it with every request, so
// everything in it is untrusted input. We accept ONLY plain user/assistant turns
// with string content; any other role (system, tool...) or extra field is dropped
// or rejected. The server builds the system prompt itself.
const MAX_MESSAGES = 21;          // 20 history messages + the new user message
const MAX_RAW_MESSAGES = 60;      // reject absurd payloads before doing any work
const MAX_USER_CHARS = 4000;      // same limit as before
const MAX_ASSISTANT_CHARS = 2000; // assistant side is a compact text version
const MAX_TOTAL_CHARS = 20000;

function validateMessages(input) {
  if (!Array.isArray(input) || input.length === 0) return { error: 'Please type something first.' };
  if (input.length > MAX_RAW_MESSAGES) return { error: 'Conversation is too long. Start a new one.' };

  let messages = [];
  for (const m of input) {
    if (!m || typeof m !== 'object' || (m.role !== 'user' && m.role !== 'assistant') || typeof m.content !== 'string') {
      return { error: 'Invalid message format.' };
    }
    const content = m.content.trim();
    if (!content) return { error: 'Please type something first.' };
    const max = m.role === 'user' ? MAX_USER_CHARS : MAX_ASSISTANT_CHARS;
    if (m.role === 'user' && content.length > max) {
      return { error: `Message is too long (max ${max} characters).` };
    }
    messages.push({ role: m.role, content: content.slice(0, max) });
  }

  if (messages[messages.length - 1].role !== 'user') return { error: 'The last message must come from the user.' };

  messages = messages.slice(-MAX_MESSAGES);
  while (messages[0].role !== 'user') messages.shift(); // history must start with the customer

  const total = messages.reduce((n, m) => n + m.content.length, 0);
  if (total > MAX_TOTAL_CHARS) return { error: 'Conversation is too long. Start a new one.' };

  return { messages };
}

module.exports = validateMessages;

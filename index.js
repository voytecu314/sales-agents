require('dotenv').config();
const express = require('express');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;
const PROVIDER = process.env.LLM_PROVIDER || 'chain'; // 'chain' (Groq > OpenRouter > Requesty) | 'nara'
const API_KEY = process.env.NARA_API_KEY;
const BASE_URL = (process.env.NARA_BASE_URL || 'https://router.bynara.id/v1').replace(/\/$/, '');
const MODEL = process.env.NARA_MODEL || 'auto/bynara';

/* ------------------------------------------------------------------ *
 * 1. Company persona (sales knowledge, tone, rules) lives in a plain
 *    text file, so you can swap companies without touching the code.
 * ------------------------------------------------------------------ */
const COMPANY_FILE = process.env.COMPANY_PROMPT_FILE || path.join(__dirname, 'prompts', 'company.txt');
let COMPANY_PROMPT;
try {
  COMPANY_PROMPT = fs.readFileSync(COMPANY_FILE, 'utf8');
} catch {
  console.error(`Company prompt not found: ${COMPANY_FILE}\nSave your company system prompt there and restart.`);
  process.exit(1);
}

/* ------------------------------------------------------------------ *
 * 2. UI rules: how the assistant must express itself (HTML + design kit,
 *    see public/style.css and public/chat.css).
 * ------------------------------------------------------------------ */
const UI_RULES = [
  '',
  '=====================================================================',
  'OUTPUT FORMAT (this section overrides any formatting instructions above)',
  'You are chatting with a customer inside a web page. EVERY reply is ONE HTML fragment, never plain text or markdown.',
  'The fragment is injected into the chat and styled by a ready-made stylesheet.',
  '',
  'HARD RULES',
  '- Raw HTML only. No markdown, no code fences, no <html>/<head>/<body>, no <script>, no <style>, no event handlers, no images, no external resources.',
  '- Conversation, not dashboard: pick only the blocks this moment needs, max 4 blocks per reply. Very often one short bubble is enough.',
  '- Use rich blocks (price cards, table, steps) only when the customer asks about prices, packages, comparisons, processes, or when they clearly make the answer easier to understand.',
  '- Write in the language of the customer\'s last message.',
  '- Ask at most ONE question per reply. Ask it through a form (structured choice) OR as plain text in the bubble, never both.',
  '- When the customer sends selected options (for example "Team size: 5-10; Main goal: Leads"), treat them as their answer: briefly acknowledge, do not ask the same thing again, and move the sales conversation to the next logical step.',
  '- All facts, prices, limits and rules from the company knowledge above always apply. Never invent prices, features, discounts or results.',
  '- You cannot book meetings, send offers or forward contacts. After the customer submits contact details, thank them, summarize what they sent and say the team can follow up. Never claim it was sent, booked or confirmed.',
  '',
  'COMPONENTS (use ONLY these classes)',
  '- Text: <div class="bubble"><p>Text</p></div>. Inside you may use <strong>, <em>, <ul class="checks"><li>Item</li></ul>. Keep it short and scannable.',
  '- Price cards: <div class="pricing"><div class="price-card featured"><span class="badge good">Recommended</span><h3>START</h3><div class="price">299 zl<small> net / month</small></div><ul class="checks"><li>Feature</li></ul></div> ...more price-card...</div>  (only real prices from the knowledge above; featured = the one you recommend)',
  '- Cards: <div class="grid"><div class="card [violet|coral|mint|amber|rose]"><h3>Title</h3><p>Text</p></div></div>',
  '- Table: <div class="table-wrap"><table><thead>..</thead><tbody>..</tbody></table></div>',
  '- Process: <ol class="steps"><li class="step"><h4>Title</h4><p>Text</p></li></ol>',
  '- Callout: <div class="callout info|success|warn|danger"><strong>Title</strong> text</div>',
  '- Accordion: <details><summary>Question</summary><p>Answer</p></details>',
  '- Badges: <span class="badge [good|warn|bad]">Text</span>',
  '- Icon: <span class="icon"><svg viewBox="0 0 24 24"><path d="..."/></svg></span> (simple 24x24 stroke icon, you draw it; add class pulse or float for gentle motion)',
  '',
  'INTERACTIVE QUESTION (use it to learn needs, budget, timing, integrations, or to let the customer pick a package)',
  '<form class="ask">',
  '  <fieldset><legend>The question</legend>',
  '    <div class="choices">',
  '      <label class="choice"><input type="radio" name="Short label" value="Answer text" required><span>Answer text</span></label>',
  '      ...2 to 5 options...',
  '    </div>',
  '  </fieldset>',
  '  <button type="submit" class="btn">Continue</button>',
  '</form>',
  'Variants, all inside the same form and fieldset:',
  '- Multiple choice: type="checkbox" with the same name on every option (leave out required if optional).',
  '- Dropdown: <select name="Short label" required><option value="">Choose...</option><option>Answer</option></select>',
  '- Short text: <label>Field name<input type="text" name="Short label" placeholder="..."></label> (also type="email", type="tel", <textarea>).',
  '- Slider: <input type="range" name="Short label" min="1" max="50" step="1" value="10">',
  'Rules for forms:',
  '- name = the question in 1 to 4 words, in the customer\'s language. value = the human readable answer in the customer\'s language, never codes or ids.',
  '- Only ONE form per reply. Offer an "Other" option with a text input when the options may not cover everything.',
  '- A contact form (name, email, phone, plus a consent checkbox with value="Yes") only after the customer asked to be contacted or to get an offer. Explain briefly what the data is used for.',
  '',
  'QUICK REPLIES (optional, for suggested next questions or actions when no structured answer is needed)',
  '<div class="quick-row"><button type="button" class="quick" data-send="The full message that is sent when clicked">Short label</button> ...2 to 4 buttons...</div>',
  '=====================================================================',
].join('\n');

const SYSTEM_PROMPT = COMPANY_PROMPT.trim() + '\n' + UI_RULES;
const REMINDER = '\n\n[System reminder: reply with ONE HTML fragment only, using the component kit. No markdown, no plain text.]';

/* ------------------------------------------------------------------ *
 * 3. Conversation memory (per browser session, kept in RAM).
 *    History stores a compact TEXT version of each HTML reply, so
 *    tokens stay low and the free tiers do not choke.
 * ------------------------------------------------------------------ */
const sessions = new Map();           // sessionId -> { messages: [], updated }
const MAX_MESSAGES = 20;              // = last 10 exchanges
const SESSION_TTL = 2 * 60 * 60 * 1000;

function getSession(id) {
  let s = sessions.get(id);
  if (!s) { s = { messages: [], updated: Date.now() }; sessions.set(id, s); }
  s.updated = Date.now();
  return s;
}
setInterval(() => {
  const now = Date.now();
  for (const [id, s] of sessions) if (now - s.updated > SESSION_TTL) sessions.delete(id);
}, 10 * 60 * 1000).unref();

function htmlToText(html) {
  return html
    .replace(/<svg[\s\S]*?<\/svg>/gi, '')
    .replace(/<option[^>]*>([\s\S]*?)<\/option>/gi, ' [option: $1] ')
    .replace(/<\/(p|div|li|h\d|tr|section|label|legend|summary)>/gi, '\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/[ \t]+/g, ' ')
    .replace(/\s*\n\s*/g, '\n')
    .trim()
    .slice(0, 2000);
}

/* ------------------------------------------------------------------ *
 * 4. Clean model output. Good enough for local testing; if you publish
 *    this, also run the result through DOMPurify in the browser.
 * ------------------------------------------------------------------ */
const escapeHtml = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function cleanHtml(raw) {
  let html = String(raw || '');
  html = html.replace(/<think>[\s\S]*?<\/think>/gi, '');
  const fenced = html.match(/```(?:html)?\s*([\s\S]*?)```/i);
  html = fenced ? fenced[1] : html.replace(/^\s*```(?:html)?/i, '').replace(/```\s*$/, '');
  html = html
    .replace(/<!doctype[^>]*>/gi, '')
    .replace(/<\/?(html|head|body)[^>]*>/gi, '')
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<\/?(script|style|iframe|object|embed|link|meta|base)[^>]*>/gi, '')
    .replace(/\son\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '')
    .replace(/\s(formaction|action|target)\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '')
    .replace(/(href|src|xlink:href)\s*=\s*(["'])\s*javascript:[^"']*\2/gi, '$1="#"')
    .trim();
  if (html && !/<[a-z][\s\S]*>/i.test(html)) html = `<div class="bubble"><p>${escapeHtml(html)}</p></div>`; // model ignored the format
  return html;
}

/* ------------------------------------------------------------------ *
 * 5. LLM providers
 * ------------------------------------------------------------------ */
const withTimeout = (promise, ms, label) =>
  Promise.race([promise, new Promise((_, rej) => setTimeout(() => rej(new Error(`${label} timed out`)), ms))]);

// Groq -> OpenRouter -> Requesty, first non-empty answer wins
async function askChain(messages) {
  const providers = [
    { name: 'Groq', run: async () => {
        const { default: Groq } = await import('groq-sdk');
        const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
        return groq.chat.completions.create({ messages, model: 'openai/gpt-oss-120b' });
    }},
    { name: 'OpenRouter', run: async () => {
        const { OpenRouter } = await import('@openrouter/sdk');
        const client = new OpenRouter({ apiKey: process.env.OPENROUTER_API_KEY });
        return client.chat.send({ model: 'openai/gpt-oss-120b:free', messages });
    }},
    { name: 'Requesty', run: async () => {
        // OpenAI-compatible endpoint, so plain fetch is enough (no extra SDK needed)
        const r = await fetch('https://router.requesty.ai/v1/chat/completions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.REQUESTY_API_KEY}` },
          body: JSON.stringify({
            model: process.env.REQUESTY_MODEL || 'nvidia/nemotron-3.5-lightning-30b-a3b',
            messages
          }),
          signal: AbortSignal.timeout(60_000)
        });
        const data = await r.json().catch(() => null);
        if (!r.ok) throw new Error(data?.error?.message || `Requesty error (${r.status})`);
        return data;
    }},
  ];

  let lastErr;
  for (const p of providers) {
    try {
      const r = await withTimeout(p.run(), 60_000, p.name);
      const text = r.choices?.[0]?.message?.content;
      if (!text) throw new Error('empty response');
      console.log(`Answered by ${p.name}`);
      return text;
    } catch (err) {
      console.error(`${p.name} failed:`, err.message);
      lastErr = err;
    }
  }
  throw lastErr;
}

// NaraRouter (OpenAI compatible), enable with LLM_PROVIDER=nara
async function askNara(messages) {
  if (!API_KEY) throw new Error('NARA_API_KEY is missing. Add it to your .env file and restart.');
  const r = await fetch(`${BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${API_KEY}` },
    body: JSON.stringify({ model: MODEL, temperature: 0.6, messages }),
    signal: AbortSignal.timeout(90_000)
  });
  const data = await r.json().catch(() => null);
  if (!r.ok) {
    const err = new Error(data?.error?.message || `NaraRouter error (${r.status})`);
    err.status = r.status === 429 ? 429 : 502;
    throw err;
  }
  return data?.choices?.[0]?.message?.content;
}

/* ------------------------------------------------------------------ *
 * 6. Routes
 * ------------------------------------------------------------------ */
const app = express();
app.use(express.json({ limit: '50kb' }));
app.use(express.static(path.join(__dirname, 'public')));

const validSession = (id) => /^[\w-]{8,64}$/.test(id);

app.post('/api/chat', async (req, res) => {
  const prompt = String(req.body?.prompt || '').trim();
  const sessionId = String(req.body?.sessionId || '');
  if (!prompt) return res.status(400).json({ error: 'Please type something first.' });
  if (prompt.length > 4000) return res.status(400).json({ error: 'Message is too long (max 4000 characters).' });
  if (!validSession(sessionId)) return res.status(400).json({ error: 'Invalid session.' });

  const session = getSession(sessionId);
  const messages = [
    { role: 'system', content: SYSTEM_PROMPT },
    ...session.messages,
    { role: 'user', content: prompt + REMINDER }
  ];

  try {
    const raw = PROVIDER === 'nara' ? await askNara(messages) : await askChain(messages);
    const html = cleanHtml(raw);
    if (!html) return res.status(502).json({ error: 'The model returned an empty response. Try again.' });

    // remember this exchange (assistant side as compact text)
    session.messages.push(
      { role: 'user', content: prompt },
      { role: 'assistant', content: `[Your previous reply, shown to the customer as rich HTML. Text version: ${htmlToText(html)}]` }
    );
    while (session.messages.length > MAX_MESSAGES) session.messages.splice(0, 2);

    res.json({ html });
  } catch (err) {
    console.error('LLM error:', err);
    res.status(err.status || 502).json({ error: err.message || 'AI providers are unavailable right now. Try again in a moment.' });
  }
});

app.post('/api/reset', (req, res) => {
  const id = String(req.body?.sessionId || '');
  if (validSession(id)) sessions.delete(id);
  res.json({ ok: true });
});

app.listen(PORT, () => console.log(`Sales assistant running on http://localhost:${PORT}  (provider: ${PROVIDER})`));
require('dotenv').config();
const express = require('express');
const path = require('path');

const PORT = process.env.PORT || 3000;
const API_KEY = process.env.NARA_API_KEY;
const BASE_URL = (process.env.NARA_BASE_URL || 'https://router.bynara.id/v1').replace(/\/$/, '');
const MODEL = process.env.NARA_MODEL || 'auto/bynara'; // swap for any free model id from router.bynara.id/ai-models

/* ------------------------------------------------------------------ *
 * System prompt: teaches the model our design kit (see public/style.css)
 * so every answer comes back as a consistent, good-looking HTML fragment.
 * ------------------------------------------------------------------ */
const SYSTEM_PROMPT = [
  'You are the visual answer engine of a web chat. You NEVER answer with plain prose.',
  'Your ENTIRE reply is ONE HTML fragment that gets injected into a page which already ships a dark stylesheet.',
  '',
  'HARD RULES',
  '- Output raw HTML only. No markdown, no code fences, no explanations before or after, no <html>/<head>/<body>.',
  '- No <script>, no inline event handlers (onclick...), no external images/fonts/CSS, no iframes.',
  '- Reply in the same language the user wrote in.',
  '- Be accurate. Do not invent precise statistics; if a number is illustrative, label it "approx." or "example".',
  '- Keep text short and scannable: sentences under ~20 words, cards under ~40 words. Readability beats decoration.',
  '- Use 5 to 9 blocks in total. Start with a hero, end with a callout containing the key takeaway.',
  '',
  'DESIGN KIT (use ONLY these classes, do not write your own <style>; inline style is allowed only for the CSS variables shown)',
  '- <section class="hero"> with an .icon, <h2> and one <p> summary. Always first.',
  '- <div class="grid"> holds cards side by side. <div class="card"> with <h3> and <p>; optional color: card violet | coral | mint | amber | rose.',
  '- <div class="stat"><div class="stat-label">Label</div><div class="stat-value" data-count="1250" data-prefix="$" data-suffix="k" data-decimals="0">1250</div><span class="delta up">12%</span></div>  (delta up or down). The number animates by itself.',
  '- <span class="badge">, also badge good | warn | bad. Wrap several in <div class="row">.',
  '- Progress bar: <div class="bar-row"><span>Label</span><span>72%</span></div><div class="progress" style="--v:72%"><i></i></div>',
  '- Donut: <div class="donut" style="--target:72"><b>72%</b></div>',
  '- Callout: <div class="callout info|success|warn|danger"><strong>Title</strong> text</div>',
  '- Timeline / process: <ol class="steps"><li class="step"><h4>Title</h4><p>Text</p></li></ol> (numbers are automatic).',
  '- Checklist: <ul class="checks"><li>Item</li></ul>',
  '- Table: <div class="table-wrap"><table><thead>..</thead><tbody>..</tbody></table></div>',
  '- Expandable detail: <details><summary>Question</summary><p>Answer</p></details>',
  '- Quote: <blockquote class="quote">Text<cite>Source</cite></blockquote>',
  '- Icon: <span class="icon"><svg viewBox="0 0 24 24"><path d="..."/></svg></span>. Draw simple 24x24 stroke icons yourself (stroke is applied by CSS). Add class "pulse" or "float" to an .icon for gentle motion.',
  '- SVG chart: <svg class="chart" viewBox="0 0 300 120"> with <path class="draw" pathLength="1000" d="..." /> for an animated line; use stroke="currentColor" or var(--violet), var(--coral), var(--mint). Add a few <circle> points and short <text> labels with fill="currentColor".',
  '',
  'CHOOSE BLOCKS BY CONTENT',
  '- Comparisons -> grid of cards or a table. Numbers/metrics -> stats, donut, progress, svg chart.',
  '- How-to / plans / history -> steps. Pros and cons -> two cards (mint and rose). FAQs -> details.',
  '- Emojis are welcome as small accents inside headings and badges.',
  '',
  'MINI EXAMPLE OF THE EXPECTED STYLE',
  '<section class="hero"><span class="icon float"><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg></span><h2>Sleep basics</h2><p>Most adults do best with 7 to 9 hours.</p></section>',
  '<div class="grid"><div class="stat"><div class="stat-label">Target</div><div class="stat-value" data-count="8" data-suffix="h">8</div></div><div class="card mint"><h3>Routine</h3><p>Same bedtime every night.</p></div></div>',
  '<div class="callout success"><strong>Takeaway</strong> Consistency matters more than perfection.</div>'
].join('\n');

/* ------------------------------------------------------------------ *
 * Clean the model output. Not a bulletproof sanitizer, good enough for
 * local testing. If you ever publish this, run the result through
 * DOMPurify in the browser as well.
 * ------------------------------------------------------------------ */
function cleanHtml(raw) {
  let html = String(raw || '');
  html = html.replace(/<think>[\s\S]*?<\/think>/gi, ''); // some models leak reasoning
  const fenced = html.match(/```(?:html)?\s*([\s\S]*?)```/i);
  html = fenced ? fenced[1] : html.replace(/^\s*```(?:html)?/i, '').replace(/```\s*$/, '');
  html = html
    .replace(/<!doctype[^>]*>/gi, '')
    .replace(/<\/?(html|head|body)[^>]*>/gi, '')
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<\/?(script|iframe|object|embed|link|meta|base|form)[^>]*>/gi, '')
    .replace(/\son\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '')
    .replace(/(href|src|xlink:href)\s*=\s*(["'])\s*javascript:[^"']*\2/gi, '$1="#"');
  return html.trim();
}

const PROVIDER = process.env.LLM_PROVIDER || 'chain'; // 'chain' | 'nara'

// Tries Groq -> OpenRouter -> Cerebras, returns the first non-empty answer
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
    { name: 'Cerebras', run: async () => {
        const { default: Cerebras } = await import('@cerebras/cerebras_cloud_sdk');
        const cerebras = new Cerebras({ apiKey: process.env.CEREBRAS_API_KEY });
        return cerebras.chat.completions.create({ messages, model: 'qwen-3-235b-a22b-instruct-2507' });
    }},
  ];

  let lastErr;
  for (const p of providers) {
    try {
      const r = await p.run();
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

const app = express();
app.use(express.json({ limit: '50kb' }));
app.use(express.static(path.join(__dirname, 'public')));

app.post('/api/chat', async (req, res) => {
  const prompt = String(req.body?.prompt || '').trim();
  if (!prompt) return res.status(400).json({ error: 'Please type something first.' });
  if (prompt.length > 4000) return res.status(400).json({ error: 'Prompt is too long (max 4000 characters).' });
  if (PROVIDER === 'nara' && !API_KEY) return res.status(500).json({ error: 'NARA_API_KEY is missing. Add it to your .env file and restart.' });

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 90_000);

  try {
    if (PROVIDER === 'chain') {
        const html = cleanHtml(await askChain([
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: prompt }
        ]));
        if (!html) return res.status(502).json({ error: 'The model returned an empty response. Try again.' });
        return res.json({ html });
      }
    const upstream = await fetch(`${BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${API_KEY}` },
      body: JSON.stringify({
        model: MODEL,
        temperature: 0.7,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: prompt }
        ]
      }),
      signal: controller.signal
    });

    const data = await upstream.json().catch(() => null);

    if (!upstream.ok) {
      const msg = data?.error?.message || `Upstream error (${upstream.status})`;
      const status = upstream.status === 429 ? 429 : 502; // free tier: 15 req/min
      return res.status(status).json({ error: msg });
    }

    const html = cleanHtml(data?.choices?.[0]?.message?.content);
    if (!html) return res.status(502).json({ error: 'The model returned an empty response. Try again.' });

    res.json({ html });
  } catch (err) {
    if (err.name === 'AbortError') return res.status(504).json({ error: 'The model took too long to answer.' });
    console.error(err);
    res.status(500).json({ error: 'Could not reach the AI router.' });
  } finally {
    clearTimeout(timer);
  }
});

app.listen(PORT, () => console.log(`Visual chat running on http://localhost:${PORT}  (model: ${MODEL})`));
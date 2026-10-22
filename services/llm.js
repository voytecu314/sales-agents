// LLM provider chain: Groq -> OpenRouter -> Requesty, first non-empty answer wins.
const TIMEOUT_MS = Number(process.env.PROVIDER_TIMEOUT_MS) || 60_000;

function withTimeout(promise, ms, label) {
  let timer;
  const timeout = new Promise((_, rej) => { timer = setTimeout(() => rej(new Error(`${label} timed out`)), ms); });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

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
          signal: AbortSignal.timeout(TIMEOUT_MS)
        });
        const data = await r.json().catch(() => null);
        if (!r.ok) throw new Error(data?.error?.message || `Requesty error (${r.status})`);
        return data;
    }},
  ];

  let lastErr;
  for (const p of providers) {
    try {
      const r = await withTimeout(p.run(), TIMEOUT_MS, p.name);
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

module.exports = { askChain };

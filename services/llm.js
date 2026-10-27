// OpenAI-compatible LLM chain: Groq -> OpenRouter -> Requesty, first non-empty answer wins.
const { configuredProviders } = require('./providerRegistry');
const TIMEOUT_MS = Number(process.env.PROVIDER_TIMEOUT_MS) || 60_000;

async function askProvider(provider, messages, fetchImpl = fetch) {
  const response = await fetchImpl(`${provider.baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${provider.apiKey}`,
      ...provider.headers
    },
    body: JSON.stringify({ model: provider.model, messages }),
    signal: AbortSignal.timeout(TIMEOUT_MS)
  });
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(data?.error?.message || `${provider.name} error (${response.status})`);
  }
  return data;
}

async function askChain(messages) {
  const providers = configuredProviders();
  if (!providers.length) throw new Error('No LLM provider API keys are configured');

  let lastErr;
  for (const provider of providers) {
    try {
      const result = await askProvider(provider, messages);
      const text = result.choices?.[0]?.message?.content;
      if (typeof text !== 'string' || !text.trim()) throw new Error('empty response');
      console.log(`Answered by ${provider.name}`);
      return text;
    } catch (err) {
      console.error(`${provider.name} failed:`, err.message);
      lastErr = err;
    }
  }
  throw lastErr;
}

module.exports = { askChain, askProvider };

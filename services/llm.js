// OpenAI-compatible client. Owner keys are tried first; platform keys are a capped fallback.
const { configuredProviders } = require('./providerRegistry');
const TIMEOUT_MS = Number(process.env.PROVIDER_TIMEOUT_MS) || 60_000;
const OWNER_DAILY_CAP = () => Number(process.env.OWNER_PROVIDER_DAILY_CAP) || 100;
const PLATFORM_FALLBACK_PER_AGENT = () => Number(process.env.PLATFORM_FALLBACK_DAILY_CAP) || 10;
const PLATFORM_FALLBACK_GLOBAL = () => Number(process.env.PLATFORM_FALLBACK_GLOBAL_DAILY_CAP) || 500;
const dayKey = () => new Date().toISOString().slice(0, 10);

async function askProvider(provider, messages, fetchImpl = fetch) {
  const response = await fetchImpl(`${provider.baseUrl.replace(/\/+$/, '')}/chat/completions`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${provider.apiKey}`, ...provider.headers },
    body: JSON.stringify({ model: provider.model, messages }), signal: AbortSignal.timeout(TIMEOUT_MS)
  });
  const data = await response.json().catch(() => null);
  if (!response.ok) throw Object.assign(new Error(data?.error?.message || `${provider.name || provider.id} error (${response.status})`), { status: response.status });
  return data;
}
function answerText(result) {
  const value = result?.choices?.[0]?.message?.content;
  return typeof value === 'string' ? value.trim() : Array.isArray(value) ? value.map((p) => p.text || '').join('').trim() : '';
}
async function tryProviders(providers, messages, slug, ownerKeys) {
  let lastErr;
  for (const provider of providers) {
    try {
      const result = await askProvider(provider, messages);
      const text = answerText(result);
      if (!text) throw new Error('empty response');
      if (ownerKeys && provider._id) await require('../models/ProviderKey').updateOne({ _id: provider._id }, { $set: { lastTestedAt: new Date(), status: 'active', cooldownUntil: null } });
      console.log(`Answered by ${provider.name || provider.id}`);
      return text;
    } catch (err) {
      lastErr = err;
      if (ownerKeys && provider._id) {
        const ProviderKey = require('../models/ProviderKey');
        if (err.status === 401 || err.status === 403) {
          const changed = await ProviderKey.updateOne({ _id: provider._id, status: 'active' }, { $set: { status: 'invalid', lastTestedAt: new Date() } });
          if (changed.modifiedCount) {
            try {
              const agent = await require('../models/Agent').findOne({ slug }).select('name notifyEmail notifyEmailVerified').lean();
              if (agent?.notifyEmailVerified && agent.notifyEmail) {
                await require('./mailer').sendMail({ to: agent.notifyEmail, subject: 'An AI provider key needs attention', text: `The ${provider.name || provider.id} API key for your AI agent “${agent.name}” was rejected (HTTP ${err.status}). It has been disabled automatically. Open your agent edit page, remove the invalid key, and add a valid key. No API key value was included in this email.` });
              }
            } catch (mailErr) { console.error('Provider-key alert could not be sent.'); }
          }
        } else if (err.status === 429) await ProviderKey.updateOne({ _id: provider._id }, { $set: { cooldownUntil: new Date(Date.now() + 15 * 60_000), lastTestedAt: new Date() } });
      }
      console.error(`${provider.name || provider.id} failed:`, err.message);
    }
  }
  if (lastErr) throw lastErr;
  throw new Error('No usable LLM provider keys are configured');
}
async function askChain(messages, { slug = null, useOwnerKeys = true } = {}) {
  const { hit, dailyKey } = require('./counters');
  if (slug && useOwnerKeys) {
    const { loadUsableKeys } = require('./keyVault');
    const keys = await loadUsableKeys(slug);
    if (keys.length) {
      const ownerDaily = await hit(dailyKey('owner-provider', slug), 2 * 86_400_000);
      const agent = await require('../models/Agent').findOne({ slug }).select('providerDailyCap').lean();
      const cap = Math.max(1, Number(agent?.providerDailyCap) || OWNER_DAILY_CAP());
      if (ownerDaily > cap) throw Object.assign(new Error('This assistant has reached its daily provider-key limit set by the owner.'), { status: 429 });
      try { return await tryProviders(keys.map((k) => ({ ...k.provider, apiKey: k.apiKey, _id: k._id })), messages, slug, true); }
      catch (err) { console.error(`Owner provider keys exhausted for ${slug}; trying limited platform fallback:`, err.message); }
    }
    const perAgent = await hit(dailyKey('platform-fallback', slug), 2 * 86_400_000);
    if (perAgent > PLATFORM_FALLBACK_PER_AGENT()) throw Object.assign(new Error('This assistant has no working provider key and has reached its limited platform quota. The owner needs to add or repair a provider key.'), { status: 429 });
    const global = await hit(`platform-fallback-global:${dayKey()}`, 2 * 86_400_000);
    if (global > PLATFORM_FALLBACK_GLOBAL()) throw Object.assign(new Error('The platform fallback limit has been reached. Please try again tomorrow.'), { status: 429 });
  }
  return tryProviders(configuredProviders(), messages, slug, false);
}
async function testProviderKey(provider, apiKey) {
  const result = await askProvider({ ...provider, apiKey }, [{ role: 'user', content: 'Reply with exactly: API key test successful' }]);
  const text = answerText(result);
  if (!text) throw new Error('The provider returned an empty response.');
  return true;
}
module.exports = { askChain, askProvider, testProviderKey, OWNER_DAILY_CAP };

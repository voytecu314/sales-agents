// OpenAI-compatible providers. Keep definitions data-driven so adding a provider does not require an SDK.
const PROVIDERS = [
  { id: 'groq', name: 'Groq', apiKeyEnv: 'GROQ_API_KEY', baseUrlEnv: 'GROQ_BASE_URL', modelEnv: 'GROQ_MODEL', baseUrl: 'https://api.groq.com/openai/v1', model: 'openai/gpt-oss-120b', help: 'Create an API key in the Groq console.' },
  { id: 'openrouter', name: 'OpenRouter', apiKeyEnv: 'OPENROUTER_API_KEY', baseUrlEnv: 'OPENROUTER_BASE_URL', modelEnv: 'OPENROUTER_MODEL', baseUrl: 'https://openrouter.ai/api/v1', model: 'openai/gpt-oss-120b', help: 'Create an API key in your OpenRouter account.' },
  { id: 'requesty', name: 'Requesty', apiKeyEnv: 'REQUESTY_API_KEY', baseUrlEnv: 'REQUESTY_BASE_URL', modelEnv: 'REQUESTY_MODEL', baseUrl: 'https://router.requesty.ai/v1', model: 'nvidia/nemotron-3.5-lightning-30b-a3b', help: 'Create an API key in the Requesty console.' }
];
function configuredProviders(env = process.env) {
  return PROVIDERS.map((provider) => ({ ...provider, apiKey: env[provider.apiKeyEnv], baseUrl: (env[provider.baseUrlEnv] || provider.baseUrl).replace(/\/+$/, ''), model: env[provider.modelEnv] || provider.model }))
    .filter((provider) => typeof provider.apiKey === 'string' && provider.apiKey.trim());
}
module.exports = { PROVIDERS, configuredProviders };

const test = require('node:test');
const assert = require('node:assert/strict');
const { PROVIDERS, configuredProviders } = require('../services/providerRegistry');
const { askProvider } = require('../services/llm');

test('provider registry preserves fallback order and default OpenAI-compatible endpoints/models', () => {
  assert.deepEqual(PROVIDERS.map((p) => p.name), ['Groq', 'OpenRouter', 'Requesty']);
  const providers = configuredProviders({ GROQ_API_KEY: 'g', OPENROUTER_API_KEY: 'o', REQUESTY_API_KEY: 'r' });
  assert.deepEqual(providers.map((p) => p.baseUrl), [
    'https://api.groq.com/openai/v1',
    'https://openrouter.ai/api/v1',
    'https://router.requesty.ai/v1'
  ]);
  assert.deepEqual(providers.map((p) => p.model), [
    'openai/gpt-oss-120b',
    'openai/gpt-oss-120b',
    'nvidia/nemotron-3.5-lightning-30b-a3b'
  ]);
});

test('provider registry supports model/base URL overrides and skips missing keys', () => {
  const providers = configuredProviders({
    GROQ_BASE_URL: 'https://groq.example/v1/', GROQ_MODEL: 'test-model', GROQ_API_KEY: ' key ',
    REQUESTY_MODEL: 'ignored-without-key'
  });
  assert.equal(providers.length, 1);
  assert.equal(providers[0].baseUrl, 'https://groq.example/v1');
  assert.equal(providers[0].model, 'test-model');
  assert.equal(providers[0].apiKey, ' key ');
});

test('generic provider client posts OpenAI-compatible chat completions and returns parsed data', async () => {
  let request;
  const provider = { name: 'Test', baseUrl: 'https://llm.example/v1', apiKey: 'secret', model: 'model-x' };
  const data = await askProvider(provider, [{ role: 'user', content: 'Hello' }], async (url, options) => {
    request = { url, options };
    return { ok: true, json: async () => ({ choices: [{ message: { content: 'Hi' } }] }) };
  });
  assert.equal(request.url, 'https://llm.example/v1/chat/completions');
  assert.equal(request.options.method, 'POST');
  assert.equal(request.options.headers.Authorization, 'Bearer secret');
  assert.deepEqual(JSON.parse(request.options.body), { model: 'model-x', messages: [{ role: 'user', content: 'Hello' }] });
  assert.equal(data.choices[0].message.content, 'Hi');
});

test('generic provider client surfaces API error messages', async () => {
  await assert.rejects(
    askProvider({ name: 'Test', baseUrl: 'https://llm.example/v1', apiKey: 'x', model: 'm' }, [], async () => ({
      ok: false, status: 401, json: async () => ({ error: { message: 'invalid key' } })
    })),
    /invalid key/
  );
});

test('provider registry has stable provider IDs and unique definitions', () => {
  assert.deepEqual(PROVIDERS.map((p) => p.id), ['groq', 'openrouter', 'requesty']);
  assert.equal(new Set(PROVIDERS.map((p) => p.id)).size, PROVIDERS.length);
});

test('OpenRouter default model uses the current non-free-suffixed model name', () => {
  assert.equal(PROVIDERS.find((p) => p.id === 'openrouter').model, 'openai/gpt-oss-120b');
});

test('configured platform providers omit missing keys and honor overrides', () => {
  const providers = configuredProviders({ GROQ_API_KEY: 'test-key', GROQ_MODEL: 'custom-model', OPENROUTER_API_KEY: 'router-key' });
  assert.deepEqual(providers.map((p) => p.id), ['groq', 'openrouter']);
  assert.equal(providers[0].model, 'custom-model');
  assert.equal(providers[1].model, 'openai/gpt-oss-120b');
});

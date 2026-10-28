const test = require('node:test');
const assert = require('node:assert/strict');
const { toPublicConfig } = require('../services/agentSchema');

test('public agent config exposes only a valid visitor daily limit', () => {
  const base = {
    slug: 'sample-agent', name: 'Sample', language: 'en', palette: {}, locales: { en: {} },
    systemPrompt: 'private', inputs: { secret: 'private' }, editTokenHash: 'private'
  };
  assert.equal(toPublicConfig({ ...base, visitorDailyLimit: 25 }).visitorDailyLimit, 25);
  assert.equal(toPublicConfig({ ...base, visitorDailyLimit: null }).visitorDailyLimit, null);
  assert.equal(toPublicConfig({ ...base, visitorDailyLimit: 0 }).visitorDailyLimit, null);
  assert.equal(toPublicConfig({ ...base, visitorDailyLimit: 2.5 }).visitorDailyLimit, null);
  const config = toPublicConfig({ ...base, visitorDailyLimit: 25 });
  assert.equal('systemPrompt' in config, false);
  assert.equal('inputs' in config, false);
  assert.equal('editTokenHash' in config, false);
});

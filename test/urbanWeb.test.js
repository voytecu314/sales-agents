// Run: node --test        (no extra packages needed; MongoDB, SMTP and the LLM are replaced by fakes)
const test = require('node:test');
const assert = require('node:assert/strict');

const { renderAgentPage } = require('../services/renderPage');
const { URBAN_WEB, siteOptions } = require('../services/urbanWeb');
const { parseLead } = require('../services/leadInput');
const { createDemoLeadHandler, DEMO_SLUG } = require('../services/demoLead');
const { contrast } = require('../services/agentSchema');

/* ---------- page ---------- */
const page = (lang = 'en') => renderAgentPage(URBAN_WEB, { lang, baseUrl: 'https://example.test', site: siteOptions('https://example.test') });

test('Urban Web page: logo top right, brand stylesheet last, no unreplaced tokens', () => {
  const html = page('de');
  assert.ok(!/%%[A-Z_]+%%/.test(html), 'unreplaced template token');
  assert.match(html, /<html lang="de">/);
  assert.match(html, /class="uw-logo"/);
  assert.ok(html.indexOf('</style>') < html.indexOf('/urbanweb.css'), 'urbanweb.css must come after the theme <style>');
  assert.ok(html.indexOf('class="uw-logo"') > html.indexOf('id="reset"'), 'logo comes after the actions block');
  assert.match(html, /property="og:url" content="https:\/\/example\.test\/"/);
  assert.ok(!html.includes('id="report"'), 'no report button on the own site');
});

test('Urban Web page: own endpoints and all three languages in the embedded config', () => {
  const html = page();
  const json = html.match(/id="agent-config">([\s\S]*?)<\/script>/)[1];
  const cfg = JSON.parse(json);
  assert.equal(cfg.chatUrl, '/api/chat');
  assert.equal(cfg.leadUrl, '/api/lead');
  for (const l of ['en', 'de', 'pl']) {
    assert.equal(cfg.locales[l].quickReplies.length, 3);
    assert.ok(cfg.locales[l].welcome.length <= 400);
    assert.ok(cfg.locales[l].tagline.length <= 100);
    assert.ok(cfg.locales[l].quickReplies.every((q) => q.label.length <= 40 && q.send.length <= 200));
  }
  assert.ok(!('systemPrompt' in cfg));
});

test('stored agents keep their page: report button, endpoints from the slug, no logo block', () => {
  const agent = { ...URBAN_WEB, slug: 'acme', name: 'Acme' };
  const html = renderAgentPage(agent, { lang: 'en', baseUrl: 'https://example.test' });
  assert.ok(!/%%[A-Z_]+%%/.test(html));
  assert.match(html, /id="report"/);
  assert.ok(!html.includes('uw-logo') && !html.includes('urbanweb.css'));
  assert.match(html, /property="og:url" content="https:\/\/example\.test\/a\/acme"/);
  const cfg = JSON.parse(html.match(/id="agent-config">([\s\S]*?)<\/script>/)[1]);
  assert.equal(cfg.chatUrl, undefined);
});

test('brand: white on primary blue reaches 4.5:1, deep text is far above', () => {
  assert.ok(contrast('#ffffff', '#0d6efd') >= 4.5);
  assert.ok(contrast('#212529', '#ffffff') >= 7);
});

/* ---------- prompt ---------- */
test('prompt: company text + rules, contact form only when MongoDB is configured, language hint', () => {
  const saved = process.env.MONGODB_URI;
  try {
    delete process.env.MONGODB_URI;
    const { promptFor, COMPANY_PROMPT } = require('../services/prompt');
    const without = promptFor('pl');
    assert.ok(without.startsWith(COMPANY_PROMPT.slice(0, 50)));
    assert.match(without, /PLATFORM RULES/);
    assert.match(without, /OUTPUT FORMAT/);
    assert.ok(!without.includes('CONTACT REQUESTS'));
    assert.match(without, /chose Polish/);

    process.env.MONGODB_URI = 'mongodb://fake';
    const withForm = promptFor('pl');
    assert.match(withForm, /CONTACT REQUESTS/);
    assert.notEqual(withForm, without);
  } finally {
    if (saved === undefined) delete process.env.MONGODB_URI; else process.env.MONGODB_URI = saved;
  }
});

/* ---------- lead input ---------- */
test('parseLead: honeypot, missing consent, bad e-mail, clean value', () => {
  assert.deepEqual(parseLead({ website: 'x', name: 'A', email: 'a@b.co', consent: true }), { honeypot: true });
  assert.ok(parseLead({ name: 'Ann', email: 'ann@example.com' }).error, 'consent required');
  assert.ok(parseLead({ name: 'Ann', email: 'nope', consent: true }).error);
  assert.ok(parseLead({ name: '', email: 'ann@example.com', consent: true }).error);
  const ok = parseLead({ name: ' Ann\r\nBcc: x ', email: 'ANN@Example.com', message: 'Hi\nthere', consent: 'yes', lang: 'de' });
  assert.deepEqual(ok.value, { name: 'Ann Bcc: x', email: 'ann@example.com', message: 'Hi\nthere', lang: 'de' });
  assert.equal(parseLead({ name: 'A', email: 'a@b.co', consent: true, lang: 'xx' }).value.lang, 'en');
});

/* ---------- site lead endpoint (fakes) ---------- */
function setup({ count = 1, mailResult = true, mailThrows = false, to = 'owner@example.com' } = {}) {
  const calls = { created: [], updated: [], mails: [] };
  const handler = createDemoLeadHandler({
    Lead: {
      create: async (doc) => { calls.created.push(doc); return { _id: 'id1', ...doc }; },
      updateOne: async (...a) => { calls.updated.push(a); }
    },
    hit: async () => count,
    dailyKey: (k, s) => `${k}:${s}`,
    sendSiteLead: async (m) => { calls.mails.push(m); if (mailThrows) throw new Error('smtp down'); return mailResult; },
    recipient: () => to
  });
  const res = { code: 200, body: null, status(c) { this.code = c; return this; }, json(b) { this.body = b; return this; } };
  return { handler, calls, res };
}
const body = { name: 'Ann', email: 'ann@example.com', message: 'Hello', consent: true, lang: 'pl' };

test('site lead: stored under a reserved slug, mailed, marked as emailed', async () => {
  const { handler, calls, res } = setup();
  await handler({ body }, res);
  assert.deepEqual(res.body, { ok: true });
  assert.equal(calls.created[0].slug, DEMO_SLUG);
  assert.ok(!/^[a-z0-9]/.test(DEMO_SLUG), 'must never be a valid agent slug');
  assert.equal(calls.mails[0].to, 'owner@example.com');
  assert.equal(calls.updated.length, 1);
});

test('site lead: SMTP failure or missing recipient never loses the request', async () => {
  for (const opts of [{ mailThrows: true }, { to: '' }, { mailResult: false }]) {
    const { handler, calls, res } = setup(opts);
    await handler({ body }, res);
    assert.deepEqual(res.body, { ok: true }, JSON.stringify(opts));
    assert.equal(calls.created.length, 1);
    assert.equal(calls.updated.length, 0);
  }
});

test('site lead: honeypot stores nothing, invalid input 400, daily cap 429', async () => {
  let t = setup();
  await t.handler({ body: { ...body, website: 'spam' } }, t.res);
  assert.deepEqual(t.res.body, { ok: true });
  assert.equal(t.calls.created.length, 0);

  t = setup();
  await t.handler({ body: { ...body, consent: false } }, t.res);
  assert.equal(t.res.code, 400);
  assert.equal(t.calls.created.length, 0);

  t = setup({ count: 9999 });
  await t.handler({ body }, t.res);
  assert.equal(t.res.code, 429);
  assert.equal(t.calls.created.length, 0);
});

/* ---------- contact form rules for stored agents ---------- */
test('agent prompt: contact form rules are always included (requests are stored even without notification e-mail)', () => {
  const { buildAgentPrompt } = require('../services/agentPrompt');
  const base = { systemPrompt: 'You are the assistant of Acme. '.repeat(10) }; // no notifyEmail
  assert.match(buildAgentPrompt(base, 'en'), /CONTACT REQUESTS/);
  assert.ok(!buildAgentPrompt(base, 'en', { leads: false }).includes('CONTACT REQUESTS'));
});

/* ---------- notification e-mail suggestion ---------- */
test('suggestEmail: contact options first, skips placeholders and no-reply, empty when nothing found', () => {
  const { suggestEmail } = require('../services/emailSuggest');
  assert.equal(suggestEmail({ description: 'Write to Info@Acme.de or call us', contact: 'Sales: sales@acme.de' }), 'sales@acme.de');
  assert.equal(suggestEmail({ description: 'Mail: info@Acme.de.' }), 'info@acme.de');
  assert.equal(suggestEmail({ description: 'noreply@acme.de, name@example.com, real@acme.de' }), 'real@acme.de');
  assert.equal(suggestEmail({ description: 'no address here', offer: 'x@y' }), '');
  assert.equal(suggestEmail({}), '');
  assert.equal(suggestEmail(undefined), '');
});

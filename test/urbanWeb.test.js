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
  assert.deepEqual(ok.value, { name: 'Ann Bcc: x', email: 'ann@example.com', message: 'Hi\nthere', lang: 'de', context: [] });
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

/* ---------- mails and pages for the agent owner, in the owner's language ---------- */
test('mailTexts: en/de/pl differ, unknown language falls back to English, names and links are kept', () => {
  const { verificationMail, leadMail, verifyPageTexts, pick } = require('../services/mailTexts');
  const lead = { name: 'Ann', email: 'ann@example.com', lang: 'en', message: 'Hi' };
  const subjects = new Set();
  for (const l of ['en', 'de', 'pl']) {
    const v = verificationMail(l, 'Acme', 'https://x/verify');
    assert.ok(v.subject.includes('Acme') && v.text.includes('https://x/verify'));
    const m = leadMail(l, 'Acme', lead, 'https://x/a/acme', 'me@acme.de');
    assert.ok(m.text.includes('ann@example.com') && m.text.includes('https://x/a/acme') && m.text.includes('me@acme.de'));
    subjects.add(v.subject).add(m.subject);
    assert.ok(verifyPageTexts(l).ok.length > 20);
  }
  assert.equal(subjects.size, 6);
  assert.deepEqual(verificationMail('xx', 'Acme', 'L'), verificationMail('en', 'Acme', 'L'));
  assert.equal(pick(undefined), 'en');
  assert.notEqual(verifyPageTexts('de').invalid, verifyPageTexts('pl').invalid);
});

test('verification link: carries the owner language, signature does not depend on it', () => {
  const saved = process.env.EMAIL_VERIFY_SECRET;
  process.env.EMAIL_VERIFY_SECRET = 'test-secret';
  try {
    const { verificationLink } = require('../services/mailer');
    const a = { slug: 'acme', notifyEmail: 'me@acme.de', name: 'Acme' };
    const de = verificationLink({ ...a, lang: 'de' }, 'https://x');
    const pl = verificationLink({ ...a, lang: 'pl' }, 'https://x');
    assert.match(de, /&l=de$/);
    assert.match(pl, /&l=pl$/);
    assert.equal(de.replace(/&l=de$/, ''), pl.replace(/&l=pl$/, ''));
    assert.match(verificationLink({ ...a, lang: 'zz' }, 'https://x'), /&l=en$/);
    delete process.env.EMAIL_VERIFY_SECRET;
    assert.equal(verificationLink(a, 'https://x'), null);
  } finally {
    if (saved === undefined) delete process.env.EMAIL_VERIFY_SECRET; else process.env.EMAIL_VERIFY_SECRET = saved;
  }
});

test('mailer: confirmation and lead mails are sent in the owner language (SMTP replaced by a fake)', async () => {
  const Module = require('module');
  const sent = [];
  const origLoad = Module._load;
  const savedHost = process.env.SMTP_HOST;
  const savedSecret = process.env.EMAIL_VERIFY_SECRET;
  Module._load = function (request, ...rest) {
    return request === 'nodemailer' ? { createTransport: () => ({ sendMail: async (m) => { sent.push(m); } }) } : origLoad.call(this, request, ...rest);
  };
  process.env.SMTP_HOST = 'smtp.fake';
  process.env.EMAIL_VERIFY_SECRET = 'test-secret';
  try {
    delete require.cache[require.resolve('../services/mailer')]; // the mailer caches its SMTP transport: start with a fresh one
    const { sendVerification, sendLead } = require('../services/mailer');
    const agent = { slug: 'acme', name: 'Acme', notifyEmail: 'me@acme.de' };
    assert.equal(await sendVerification({ ...agent, lang: 'pl' }, 'https://x'), true);
    assert.match(sent[0].subject, /^Potwierdź/);
    assert.match(sent[0].text, /&l=pl/);
    const lead = { name: 'Ann', email: 'ann@example.com', lang: 'en', message: '' };
    await sendLead({ ...agent, ownerLang: 'de', language: 'pl' }, lead, 'https://x');
    assert.match(sent[1].subject, /^Neue Kontaktanfrage/);
    await sendLead({ ...agent, language: 'pl' }, lead, 'https://x'); // older agent without ownerLang
    assert.match(sent[2].subject, /^Nowe zgłoszenie/);
    assert.equal(sent[2].replyTo, 'ann@example.com');
  } finally {
    Module._load = origLoad;
    if (savedHost === undefined) delete process.env.SMTP_HOST; else process.env.SMTP_HOST = savedHost;
    if (savedSecret === undefined) delete process.env.EMAIL_VERIFY_SECRET; else process.env.EMAIL_VERIFY_SECRET = savedSecret;
  }
});

/* ---------- conversation context in lead mails ---------- */
test('parseContext: keeps the latest messages, drops junk, cuts long texts, strips control characters', () => {
  const { parseContext } = require('../services/leadInput');
  assert.deepEqual(parseContext('x'), []);
  assert.deepEqual(parseContext([null, { role: 'system', content: 'x' }, { role: 'user', content: 5 }, { role: 'user', content: '  ' }]), []);
  const many = Array.from({ length: 30 }, (_, i) => ({ role: i % 2 ? 'assistant' : 'user', content: `m${i}` }));
  const out = parseContext(many);
  assert.equal(out.length, 12);
  assert.equal(out.at(-1).text, 'm29');
  assert.equal(parseContext([{ role: 'user', content: 'a'.repeat(5000) }])[0].text.length, 600);
  assert.equal(parseContext([{ role: 'user', content: 'Hi\r\nBcc: x\u0000' }])[0].text, 'Hi Bcc: x');
});

test('lead mail: visitor language named and conversation included, in the owner language', () => {
  const { leadMail, languageName } = require('../services/mailTexts');
  const lead = { name: 'Ann', email: 'ann@example.com', lang: 'pl', message: 'Hi', context: [{ role: 'user', text: 'Ile kosztuje strona?' }, { role: 'assistant', text: 'Zależy od zakresu.' }] };
  const de = leadMail('de', 'Acme', lead, 'https://x/a/acme', 'me@acme.de');
  assert.match(de.text, /Sprache des Besuchers: Polnisch \(pl\)/);
  assert.match(de.text, /Bisheriges Gespräch[^\n]*:\nBesucher: Ile kosztuje strona\?\nAgent: Zależy od zakresu\./);
  assert.match(de.text, /dieses Gespräch weiterzugeben/);
  assert.match(leadMail('pl', 'Acme', lead, 'u', 'a@b.pl').text, /Język odwiedzającego: polski \(pl\)/);
  assert.match(leadMail('en', 'Acme', { ...lead, lang: 'de' }, 'u', 'a@b.co').text, /Visitor's language: German \(de\)/);
  assert.ok(!leadMail('en', 'Acme', { ...lead, context: [] }, 'u', 'a@b.co').text.includes('Conversation so far'));
  assert.equal(languageName('en', 'xx'), 'xx (xx)');
});

test('site lead mail (to the Urban Web owner) includes language and conversation', async () => {
  const Module = require('module');
  const sent = [];
  const origLoad = Module._load;
  const savedHost = process.env.SMTP_HOST;
  Module._load = function (request, ...rest) {
    return request === 'nodemailer' ? { createTransport: () => ({ sendMail: async (m) => { sent.push(m); } }) } : origLoad.call(this, request, ...rest);
  };
  process.env.SMTP_HOST = 'smtp.fake';
  try {
    delete require.cache[require.resolve('../services/mailer')]; // the mailer caches its SMTP transport: start with a fresh one
    const { sendSiteLead } = require('../services/mailer');
    await sendSiteLead({ to: 'me@uw.de', lead: { name: 'Ann', email: 'ann@example.com', lang: 'de', message: '', context: [{ role: 'user', text: 'Hallo' }] } });
    assert.match(sent[0].text, /Visitor's language: German \(de\)/);
    assert.match(sent[0].text, /Visitor: Hallo/);
  } finally {
    Module._load = origLoad;
    if (savedHost === undefined) delete process.env.SMTP_HOST; else process.env.SMTP_HOST = savedHost;
  }
});

/* ---------- privacy policy and conversation sharing ---------- */
test('privacy page: every language, operator details escaped, visible placeholders when unset', () => {
  const { renderPrivacyPage, policyFor } = require('../services/privacyText');
  const env = { LEGAL_NAME: 'Urban <b>Web</b>', LEGAL_ADDRESS: 'Str. 1, Berlin', LEGAL_EMAIL: 'privacy@example.org', LEGAL_HOSTING: 'HostCo', LEAD_RETENTION_DAYS: '30' };
  for (const [l, title] of [['en', 'Privacy policy'], ['de', 'Datenschutzerklärung'], ['pl', 'Polityka prywatności']]) {
    const html = renderPrivacyPage(l, env);
    assert.match(html, new RegExp(`<html lang="${l}">`));
    assert.ok(html.includes(`<h1>${title}</h1>`));
    assert.ok(!/%%[A-Z_]+%%/.test(html) && !/\{(operator|email|days|hosting)\}/.test(html));
    assert.ok(html.includes('Urban &lt;b&gt;Web&lt;/b&gt;') && !html.includes('<b>Web</b>'), 'operator name must be escaped');
    assert.ok(html.includes('privacy@example.org') && html.includes('(HostCo)') && html.includes('30'));
    assert.ok(!html.includes('class="notice"'));
    for (const name of ['Groq', 'OpenRouter', 'Requesty']) assert.ok(html.includes(name));
  }
  const missing = renderPrivacyPage('en', {});
  assert.ok(missing.includes('[LEGAL_NAME not set]') && missing.includes('class="notice"'));
  assert.equal(policyFor('xx', env).lang, 'en');
  assert.match(renderPrivacyPage('en', env), /<a href="\/privacy\?lang=de">DE<\/a>/);
});

test('agent pages link to the privacy policy in the page language', () => {
  const de = page('de');
  assert.match(de, /<a id="privacy" class="linklike" href="\/privacy\?lang=de">Datenschutz<\/a>/);
  const stored = renderAgentPage({ ...URBAN_WEB, slug: 'acme', name: 'Acme' }, { lang: 'pl', baseUrl: 'https://x' });
  assert.match(stored, /href="\/privacy\?lang=pl">Polityka prywatności<\/a>/);
  assert.match(stored, /id="report"/); // report button still there for stored agents
});

test('lead mail: the sharing sentence appears only when the conversation is included', () => {
  const { leadMail } = require('../services/mailTexts');
  const lead = { name: 'Ann', email: 'ann@example.com', lang: 'en', message: '' };
  assert.ok(!leadMail('de', 'Acme', lead, 'u', 'a@b.de').text.includes('dieses Gespräch weiterzugeben'));
  assert.match(leadMail('de', 'Acme', { ...lead, context: [{ role: 'user', text: 'Hi' }] }, 'u', 'a@b.de').text, /dieses Gespräch weiterzugeben/);
});

/* ---------- self-hosted fonts ---------- */
test('fonts: no Google requests in pages or CSP, font files declared (and present once public/fonts exists)', (t) => {
  const fs = require('fs');
  const path = require('path');
  const root = path.join(__dirname, '..');
  for (const v of ['agent', 'create', 'edit', 'legal']) {
    assert.ok(!/fonts\.(googleapis|gstatic)\.com/.test(fs.readFileSync(path.join(root, 'views', `${v}.html`), 'utf8')), `${v}.html still uses Google Fonts`);
  }
  const headers = {};
  require('../middleware/securityHeaders').securityHeaders({}, { set: (k, v) => { headers[k] = v; } }, () => {});
  assert.ok(!/google|gstatic/.test(headers['Content-Security-Policy']));
  assert.match(headers['Content-Security-Policy'], /font-src 'self'/);
  const css = fs.readFileSync(path.join(root, 'public', 'style.css'), 'utf8');
  const files = ['bricolage-latin', 'bricolage-latin-ext', 'figtree-latin', 'figtree-latin-ext'].map((n) => `${n}.woff2`);
  for (const f of files) assert.ok(css.includes(`/fonts/${f}`), `${f} not declared in style.css`);
  if (!fs.existsSync(path.join(root, 'public', 'fonts', 'figtree-latin.woff2')) && !fs.existsSync(path.join(root, 'public', 'fonts', 'bricolage-latin.woff2'))) {
    return t.skip('font files not added yet (see public/fonts/README.md)');
  }
  for (const f of files) assert.ok(fs.existsSync(path.join(root, 'public', 'fonts', f)), `public/fonts/${f} is missing`);
});

test('privacy policy: no font provider section any more, sections numbered 1..9', () => {
  const { policyFor } = require('../services/privacyText');
  for (const l of ['en', 'de', 'pl']) {
    const { body } = policyFor(l, {});
    assert.ok(!/Google/.test(body));
    assert.deepEqual([...body.matchAll(/<h2>(\d+)\./g)].map((m) => Number(m[1])), [1, 2, 3, 4, 5, 6, 7, 8, 9]);
  }
});

/* ---------- legal notice (Impressum), terms of use ---------- */
test('impressumUrl: only http(s) addresses from the environment are accepted', () => {
  const { impressumUrl } = require('../services/legalDocs');
  assert.equal(impressumUrl({ LEGAL_IMPRESSUM_URL: 'https://urban-web.example/impressum' }), 'https://urban-web.example/impressum');
  for (const bad of ['', undefined, 'javascript:alert(1)', 'ftp://x.de/i', 'not a url']) assert.equal(impressumUrl({ LEGAL_IMPRESSUM_URL: bad }), '');
});

test('agent page footer: operator Impressum from the environment, company legal notice link or text, in the page language', () => {
  const saved = process.env.LEGAL_IMPRESSUM_URL;
  const base = { ...URBAN_WEB, slug: 'acme', name: 'Acme' };
  try {
    delete process.env.LEGAL_IMPRESSUM_URL;
    const none = renderAgentPage(base, { lang: 'de', baseUrl: 'https://x' });
    assert.ok(!none.includes('id="impressum"') && !none.includes('id="owner-legal"'));

    process.env.LEGAL_IMPRESSUM_URL = 'https://urban-web.example/impressum';
    const withImp = renderAgentPage(base, { lang: 'de', baseUrl: 'https://x' });
    assert.match(withImp, /<a id="impressum" class="linklike" href="https:\/\/urban-web\.example\/impressum" target="_blank" rel="noopener">Impressum<\/a>/);
    assert.match(renderAgentPage(base, { lang: 'en', baseUrl: 'https://x' }), />Legal notice<\/a>/);

    const link = renderAgentPage({ ...base, legalUrl: 'https://acme.example/imprint', legalText: 'ignored when a link is set' }, { lang: 'de', baseUrl: 'https://x' });
    assert.match(link, /id="owner-legal" class="linklike" href="https:\/\/acme\.example\/imprint"[^>]*>Impressum des Unternehmens<\/a>/);

    const text = renderAgentPage({ ...base, legalText: 'Acme GmbH, Street 1' }, { lang: 'pl', baseUrl: 'https://x' });
    assert.match(text, /id="owner-legal" class="linklike" href="\/a\/acme\/legal\?lang=pl"[^>]*>Informacje prawne firmy<\/a>/);
    assert.ok(!/%%[A-Z_]+%%/.test(text));
  } finally {
    if (saved === undefined) delete process.env.LEGAL_IMPRESSUM_URL; else process.env.LEGAL_IMPRESSUM_URL = saved;
  }
});

test('validateAgent: legalUrl must be a clean https address, legalText keeps paragraphs and has a limit', () => {
  const { validateAgent } = require('../services/agentSchema');
  const ok = { name: 'Acme', language: 'en', locales: URBAN_WEB.locales, palette: URBAN_WEB.palette };
  const run = (extra) => validateAgent({ ...ok, ...extra });
  assert.deepEqual(run({}).errors, []);
  assert.equal(run({ legalUrl: ' https://acme.example/imprint ' }).value.legalUrl, 'https://acme.example/imprint');
  for (const bad of ['http://acme.example', 'javascript:alert(1)', 'https://user:pw@acme.example', 'acme.example', `https://a.example/${'x'.repeat(300)}`]) {
    assert.ok(run({ legalUrl: bad }).errors.some((e) => e.startsWith('legalUrl')), bad);
  }
  assert.equal(run({ legalText: 'Acme GmbH\nStreet 1\n\nCEO: A. B.' }).value.legalText, 'Acme GmbH\nStreet 1\n\nCEO: A. B.');
  assert.ok(run({ legalText: 'x'.repeat(1501) }).errors.some((e) => e.startsWith('legalText')));
});

test('company legal notice page: text is escaped, paragraphs kept, shell has the footer links', () => {
  const { renderOwnerLegal } = require('../services/legalDocs');
  const html = renderOwnerLegal('de', 'Acme <GmbH>', 'Acme <b>GmbH</b>\nStreet 1\n\nCEO: A. B.', {});
  assert.match(html, /<title>Impressum von Acme &lt;GmbH&gt;<\/title>/);
  assert.ok(html.includes('<p>Acme &lt;b&gt;GmbH&lt;/b&gt;<br>Street 1</p>') && html.includes('<p>CEO: A. B.</p>'));
  assert.ok(!html.includes('<b>') && html.includes('/privacy?lang=de') && html.includes('/terms?lang=de'));
});

test('terms of use: three languages, 10 sections, Impressum duty names the real form field', () => {
  const fs = require('fs');
  const { renderTermsPage, TEXT, TERMS_VERSION } = require('../services/termsText');
  const form = fs.readFileSync(require('path').join(__dirname, '..', 'public', 'agent-form.js'), 'utf8');
  const env = { LEGAL_NAME: 'Urban Web', LEGAL_ADDRESS: 'Str. 1', LEGAL_EMAIL: 'legal@example.org', LEGAL_IMPRESSUM_URL: 'https://u.example/impressum' };
  assert.match(TERMS_VERSION, /^\d{4}-\d{2}-\d{2}$/);
  for (const [l, field] of [['en', 'Legal notice of your company'], ['de', 'Impressum Ihres Unternehmens'], ['pl', 'Informacje prawne Twojej firmy']]) {
    const html = renderTermsPage(l, env);
    assert.equal((html.match(/<h2>/g) || []).length, 10);
    assert.ok(!/\{(operator|email|days|hosting)\}/.test(html) && html.includes('legal@example.org') && html.includes('https://u.example/impressum'));
    assert.ok(JSON.stringify(TEXT[l]).includes(field), `terms (${l}) must name the field "${field}"`);
    assert.ok(form.includes(field), `form (${l}) must contain "${field}"`);
  }
});

test('forms: the ids used by the scripts exist in the views', () => {
  const fs = require('fs');
  const v = (n) => fs.readFileSync(require('path').join(__dirname, '..', 'views', n), 'utf8');
  for (const id of ['r-legal-url', 'r-legal-text']) assert.ok(v('review-form.html').includes(`id="${id}"`), id);
  assert.ok(v('create.html').includes('id="r-terms"') && v('create.html').includes('id="r-terms-link"'));
  for (const f of ['create.html', 'edit.html']) assert.ok(v(f).includes('%%LEGAL_FOOT%%'), f);
});

test('returning visitor choice is translated in all supported languages', () => {
  const { STRINGS } = require('../services/i18n');
  for (const lang of ['en', 'de', 'pl']) {
    assert.ok(STRINGS[lang].continueConversation.length > 0, `${lang} continue label`);
    assert.ok(STRINGS[lang].startFresh.length > 0, `${lang} new conversation label`);
    assert.ok(STRINGS[lang].resumeText.length > 0, `${lang} resume explanation`);
  }
});

test('create completion includes provider-key onboarding in all supported UI languages', () => {
  const fs = require('fs');
  const path = require('path');
  const form = fs.readFileSync(path.join(__dirname, '..', 'public', 'agent-form.js'), 'utf8');
  const html = fs.readFileSync(path.join(__dirname, '..', 'views', 'create.html'), 'utf8');
  for (const key of ['providerSetupTitle', 'providerSetupBody', 'providerSetupStep1', 'providerSetupStep2', 'providerSetupStep3', 'providerSetupCta']) {
    assert.equal((form.match(new RegExp(`${key}:`, 'g')) || []).length, 3, `${key} should be translated in en/de/pl`);
    assert.ok(html.includes(`data-i18n="${key}"`), `${key} should be used by create.html`);
  }
  assert.ok(html.includes('https://console.groq.com/'));
  assert.ok(html.includes('https://www.requesty.ai/'));
  assert.ok(html.includes('https://openrouter.ai/'));
});

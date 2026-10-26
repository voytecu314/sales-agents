// Owner endpoints. requireOwner has already checked the owner key and put the agent in req.agentDoc.
const Agent = require('../models/Agent');
const Lead = require('../models/Lead');
const Logo = require('../models/Logo');
const { validateAgent } = require('../services/agentSchema');
const { normalizeCompanyInput, generatePrompt } = require('../services/metaPrompt');
const { moderate, textOf } = require('../services/moderation');
const { sendVerification, verifyToken } = require('../services/mailer');
const { pick, verifyPageTexts } = require('../services/mailTexts');
const { LANGS } = require('../services/i18n');
const { invalidate } = require('../services/agentCache');
const { peek, hit, dailyKey } = require('../services/counters');
const { baseUrl, DAILY_CAP } = require('./agentsController');
const { isValidSlug } = require('../services/slug');
const crypto = require('crypto');

const REGEN_DAILY_CAP = 10; // rewrites of the instructions per agent and day (each one is an LLM call)

// What the owner may see and change. NOT the system prompt: the server writes it from `inputs`.
const editable = (a) => ({
  name: a.name, emoji: a.emoji || '', language: a.language, palette: a.palette, locales: a.locales,
  legalUrl: a.legalUrl || '', legalText: a.legalText || '',
  notifyEmail: a.notifyEmail || '', notifyEmailVerified: Boolean(a.notifyEmailVerified), status: a.status,
  logoUrl: a.hasLogo ? `/api/agents/${a.slug}/logo?v=${a.logoVersion || 0}` : null
});

// GET /api/agents/:slug/owner
async function owner(req, res) {
  const a = req.agentDoc;
  try {
    const [today, leads] = await Promise.all([
      peek(dailyKey('cap', a.slug)),
      Lead.find({ slug: a.slug }).sort({ createdAt: -1 }).limit(50).lean()
    ]);
    res.json({
      agent: editable(a),
      inputs: a.inputs || {},
      keyExpiresAt: req.keyExpiresAt,
      url: `${baseUrl(req)}/a/${a.slug}`,
      usage: { today, cap: DAILY_CAP() },
      leads: leads.map((l) => ({ name: l.name, email: l.email, message: l.message, lang: l.lang, context: l.context || [], createdAt: l.createdAt }))
    });
  } catch (err) {
    console.error('Owner load failed:', err.message);
    res.status(503).json({ error: 'Service temporarily unavailable.' });
  }
}

// PUT /api/agents/:slug   { agent: { branding..., status }, inputs?: { description, guided answers } }
// If the inputs changed, the server rewrites the system prompt from them. The prompt itself is never sent or accepted.
async function update(req, res) {
  const old = req.agentDoc;
  const { value, errors, notes } = validateAgent(req.body?.agent);
  if (errors.length) return res.status(400).json({ error: 'Please fix: ' + errors.slice(0, 5).join('; ') + '.' });
  const status = req.body.agent.status === 'paused' ? 'paused' : 'active';

  let inputs = null;
  if (req.body?.inputs !== undefined) {
    const n = normalizeCompanyInput(req.body.inputs);
    if (n.error) return res.status(400).json({ error: n.error });
    inputs = n.value;
  }
  const oldInputs = normalizeCompanyInput(old.inputs).value;
  const inputsChanged = Boolean(inputs) && JSON.stringify(inputs) !== JSON.stringify(oldInputs);

  try {
    // Check what the owner wrote BEFORE spending an LLM call on it. (Prompt excluded: it is ours.)
    const forCheck = (a, i) => textOf({ name: a.name, locales: a.locales, inputs: i, legalText: a.legalText, systemPrompt: '' });
    const nextInputs = inputsChanged ? inputs : (old.inputs || {});
    if (forCheck(value, nextInputs) !== forCheck(old, old.inputs || {})) {
      const verdict = await moderate(forCheck(value, nextInputs));
      if (!verdict.ok) return res.status(400).json({ error: `This agent cannot be saved: ${verdict.reason}. Please change your description.` });
    }

    let systemPrompt = old.systemPrompt;
    if (inputsChanged) {
      if (await hit(dailyKey('regen', old.slug), 2 * 86_400_000) > REGEN_DAILY_CAP) {
        return res.status(429).json({ error: 'You changed the description too often today. Please try again tomorrow.' });
      }
      try {
        systemPrompt = await generatePrompt(inputs);
      } catch (err) {
        console.error('Prompt regeneration failed:', err.message);
        return res.status(502).json({ error: 'Could not rewrite the agent instructions right now. Nothing was changed. Please try again.' });
      }
    }

    const emailChanged = value.notifyEmail !== (old.notifyEmail || '');
    const set = { ...value, status };
    if (inputsChanged) {
      set.systemPrompt = systemPrompt;
      set.inputs = inputs;
      if (inputs.language !== 'auto') set.language = inputs.language;
    }
    if (LANGS.includes(req.body?.lang)) set.ownerLang = req.body.lang; // follows the language the owner currently works in
    if (emailChanged) set.notifyEmailVerified = false;   // a new address must be confirmed first

    await Agent.updateOne({ slug: old.slug }, { $set: set }); // slug, plan and key hash are never taken from the request
    invalidate(old.slug);

    if (emailChanged && value.notifyEmail) {
      await sendVerification({ slug: old.slug, name: value.name, notifyEmail: value.notifyEmail, lang: set.ownerLang || old.ownerLang || old.language }, baseUrl(req)).catch((e) => console.error('Verification mail failed:', e.message));
    }
    res.json({ ok: true, emailVerificationSent: Boolean(emailChanged && value.notifyEmail), instructionsRewritten: inputsChanged, colorsAdjusted: notes.includes('palette') });
  } catch (err) {
    console.error('Owner update failed:', err);
    res.status(500).json({ error: 'Could not save. Please try again.' });
  }
}

// DELETE /api/agents/:slug : removes the agent and its leads
async function remove(req, res) {
  try {
    await Promise.all([Agent.deleteOne({ slug: req.agentDoc.slug }), Lead.deleteMany({ slug: req.agentDoc.slug }), Logo.deleteOne({ slug: req.agentDoc.slug })]);
    invalidate(req.agentDoc.slug);
    res.json({ ok: true });
  } catch (err) {
    console.error('Owner delete failed:', err.message);
    res.status(500).json({ error: 'Could not delete. Please try again.' });
  }
}

// GET /api/agents/:slug/verify-email?e=...&t=...  (link from the confirmation e-mail)
async function verifyEmail(req, res) {
  const lang = pick(req.query.l); // language of the confirmation mail, taken from the link
  const x = verifyPageTexts(lang);
  const page = (msg, code = 200) => res.status(code).type('html').send(`<!doctype html><html lang="${lang}"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${x.title}</title><body style="font:16px system-ui;background:#0f0a1f;color:#f1edff;display:grid;place-items:center;min-height:100vh;margin:0"><p>${msg}</p></body>`);
  const slug = String(req.params.slug || '');
  const email = String(req.query.e || '').toLowerCase();
  const token = String(req.query.t || '');
  const expected = verifyToken(slug, email);
  if (!isValidSlug(slug) || !expected || token.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(token), Buffer.from(expected))) {
    return page(x.invalid, 400);
  }
  try {
    const r = await Agent.updateOne({ slug, notifyEmail: email }, { $set: { notifyEmailVerified: true } }); // only if it is still the current address
    invalidate(slug);
    return r.matchedCount ? page(x.ok) : page(x.gone, 400);
  } catch (err) {
    console.error('Verify failed:', err.message);
    return page(x.unavailable, 503);
  }
}

module.exports = { owner, update, remove, verifyEmail };

// Owner endpoints. requireOwner has already checked the owner key and put the agent in req.agentDoc.
const Agent = require('../models/Agent');
const Lead = require('../models/Lead');
const { validateAgent } = require('../services/agentSchema');
const { moderate, textOf } = require('../services/moderation');
const { sendVerification, verifyToken } = require('../services/mailer');
const { invalidate } = require('../services/agentCache');
const { peek, dailyKey } = require('../services/counters');
const { baseUrl, DAILY_CAP } = require('./agentsController');
const { isValidSlug } = require('../services/slug');
const crypto = require('crypto');

const editable = (a) => ({
  name: a.name, emoji: a.emoji, language: a.language, palette: a.palette, locales: a.locales,
  systemPrompt: a.systemPrompt, notifyEmail: a.notifyEmail || '', notifyEmailVerified: Boolean(a.notifyEmailVerified), status: a.status
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
      url: `${baseUrl(req)}/a/${a.slug}`,
      usage: { today, cap: DAILY_CAP() },
      leads: leads.map((l) => ({ name: l.name, email: l.email, message: l.message, lang: l.lang, createdAt: l.createdAt }))
    });
  } catch (err) {
    console.error('Owner load failed:', err.message);
    res.status(503).json({ error: 'Service temporarily unavailable.' });
  }
}

// PUT /api/agents/:slug   { agent: {..., status} }
async function update(req, res) {
  const old = req.agentDoc;
  const { value, errors } = validateAgent(req.body?.agent);
  if (errors.length) return res.status(400).json({ error: 'Please fix: ' + errors.slice(0, 5).join('; ') + '.' });
  const status = req.body.agent.status === 'paused' ? 'paused' : 'active';

  try {
    if (textOf(value) !== textOf(old)) {
      const verdict = await moderate(textOf(value));
      if (!verdict.ok) return res.status(400).json({ error: `This agent cannot be saved: ${verdict.reason}. Please change the instructions.` });
    }

    const emailChanged = value.notifyEmail !== (old.notifyEmail || '');
    const set = { ...value, status };
    if (emailChanged) set.notifyEmailVerified = false;   // a new address must be confirmed first

    await Agent.updateOne({ slug: old.slug }, { $set: set }); // slug, plan and key hash are never taken from the request
    invalidate(old.slug);

    if (emailChanged && value.notifyEmail) {
      await sendVerification({ slug: old.slug, name: value.name, notifyEmail: value.notifyEmail }, baseUrl(req)).catch((e) => console.error('Verification mail failed:', e.message));
    }
    res.json({ ok: true, emailVerificationSent: Boolean(emailChanged && value.notifyEmail) });
  } catch (err) {
    console.error('Owner update failed:', err);
    res.status(500).json({ error: 'Could not save. Please try again.' });
  }
}

// DELETE /api/agents/:slug : removes the agent and its leads
async function remove(req, res) {
  try {
    await Promise.all([Agent.deleteOne({ slug: req.agentDoc.slug }), Lead.deleteMany({ slug: req.agentDoc.slug })]);
    invalidate(req.agentDoc.slug);
    res.json({ ok: true });
  } catch (err) {
    console.error('Owner delete failed:', err.message);
    res.status(500).json({ error: 'Could not delete. Please try again.' });
  }
}

// GET /api/agents/:slug/verify-email?e=...&t=...  (link from the confirmation e-mail)
async function verifyEmail(req, res) {
  const page = (msg, code = 200) => res.status(code).type('html').send(`<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>E-mail</title><body style="font:16px system-ui;background:#0f0a1f;color:#f1edff;display:grid;place-items:center;min-height:100vh;margin:0"><p>${msg}</p></body>`);
  const slug = String(req.params.slug || '');
  const email = String(req.query.e || '').toLowerCase();
  const token = String(req.query.t || '');
  const expected = verifyToken(slug, email);
  if (!isValidSlug(slug) || !expected || token.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(token), Buffer.from(expected))) {
    return page('This confirmation link is not valid.', 400);
  }
  try {
    const r = await Agent.updateOne({ slug, notifyEmail: email }, { $set: { notifyEmailVerified: true } }); // only if it is still the current address
    invalidate(slug);
    return r.matchedCount ? page('Thank you, your e-mail address is confirmed. Contact requests will now be sent to it.') : page('This address is no longer used by the agent.', 400);
  } catch (err) {
    console.error('Verify failed:', err.message);
    return page('Service temporarily unavailable. Please try the link again in a moment.', 503);
  }
}

module.exports = { owner, update, remove, verifyEmail };

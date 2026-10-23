const Agent = require('../models/Agent');
const Lead = require('../models/Lead');
const Report = require('../models/Report');
const { loadAgent, baseUrl } = require('./agentsController');
const { EMAIL_RE } = require('../services/agentSchema');
const { LANGS } = require('../services/i18n');
const { hit, dailyKey } = require('../services/counters');
const { sendLead, sendMail } = require('../services/mailer');

const CONTROL = /[\u0000-\u001F\u007F]/g;
const line = (v, max) => String(v ?? '').replace(CONTROL, ' ').replace(/\s+/g, ' ').trim().slice(0, max);

// POST /api/agents/:slug/lead   { name, email, message, consent, lang, website }
// Called by the page itself (not by the AI), so contact data never goes through the LLM providers.
async function lead(req, res) {
  try {
    const cached = await loadAgent(req, res);
    if (!cached) return;
    // Read fresh (not from the 60 s cache): whether an address is confirmed decides if we send mail.
    const agent = await Agent.findOne({ slug: cached.slug }).lean();
    if (!agent || agent.status !== 'active' || !agent.notifyEmail) return res.status(404).json({ error: 'Contact requests are not available for this assistant.' });

    const b = req.body || {};
    if (b.website) return res.json({ ok: true }); // honeypot field filled in: a bot. Pretend success, store nothing.

    const name = line(b.name, 100);
    const email = line(b.email, 254).toLowerCase();
    const message = String(b.message ?? '').replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '').trim().slice(0, 1000);
    if (!name || !EMAIL_RE.test(email)) return res.status(400).json({ error: 'Please enter your name and a valid e-mail address.' });
    if (b.consent !== true && b.consent !== 'yes') return res.status(400).json({ error: 'Please agree that the company may contact you.' });

    const cap = Number(process.env.LEAD_DAILY_CAP) || 50;
    if (await hit(dailyKey('lead', agent.slug), 2 * 86_400_000) > cap) {
      return res.status(429).json({ error: 'Too many requests for this assistant today. Please contact the company directly.' });
    }

    const doc = await Lead.create({ slug: agent.slug, name, email, message, lang: LANGS.includes(b.lang) ? b.lang : 'en' });

    if (agent.notifyEmailVerified) { // only confirmed addresses receive mail
      try {
        if (await sendLead(agent, doc, baseUrl(req))) await Lead.updateOne({ _id: doc._id }, { $set: { emailed: true } });
      } catch (err) {
        console.error('Lead mail failed:', err.message); // the lead is stored: the owner can read it in the edit page
      }
    }
    res.json({ ok: true });
  } catch (err) {
    console.error('Lead failed:', err);
    res.status(500).json({ error: 'Could not send your request. Please try again.' });
  }
}

// POST /api/agents/:slug/report   { reason? }
async function report(req, res) {
  try {
    const agent = await loadAgent(req, res);
    if (!agent) return;
    await Report.create({ slug: agent.slug, reason: line(req.body?.reason, 300) });
    if (process.env.ADMIN_EMAIL) {
      await sendMail({ to: process.env.ADMIN_EMAIL, subject: `Report: ${agent.slug}`, text: `A visitor reported the assistant ${baseUrl(req)}/a/${agent.slug}` }).catch(() => {});
    }
    res.json({ ok: true });
  } catch (err) {
    console.error('Report failed:', err.message);
    res.status(500).json({ error: 'Could not send the report.' });
  }
}

module.exports = { lead, report };

const Agent = require('../models/Agent');
const Lead = require('../models/Lead');
const Report = require('../models/Report');
const { loadAgent, baseUrl } = require('./agentsController');
const { parseLead, line } = require('../services/leadInput');
const { hit, dailyKey } = require('../services/counters');
const { sendLead, sendMail } = require('../services/mailer');

// POST /api/agents/:slug/lead   { name, email, message, consent, lang, website }
// Called by the page itself (not by the AI), so contact data never goes through the LLM providers.
async function lead(req, res) {
  try {
    const cached = await loadAgent(req, res);
    if (!cached) return;
    // Read fresh (not from the 60 s cache): whether an address is confirmed decides if we send mail.
    const agent = await Agent.findOne({ slug: cached.slug }).lean();
    if (!agent || agent.status !== 'active') return res.status(404).json({ error: 'Contact requests are not available for this assistant.' });

    const parsed = parseLead(req.body);
    if (parsed.honeypot) return res.json({ ok: true }); // a bot: pretend success, store nothing
    if (parsed.error) return res.status(400).json({ error: parsed.error });

    const cap = Number(process.env.LEAD_DAILY_CAP) || 50;
    if (await hit(dailyKey('lead', agent.slug), 2 * 86_400_000) > cap) {
      return res.status(429).json({ error: 'Too many requests for this assistant today. Please contact the company directly.' });
    }

    const doc = await Lead.create({ slug: agent.slug, ...parsed.value });

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

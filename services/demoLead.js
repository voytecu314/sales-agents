// Contact requests of the Urban Web site itself (the page at "/"). Stored in MongoDB and e-mailed to the company.
// Dependencies are injected so the handler can be tested without a database or SMTP server.
const { parseLead } = require('./leadInput');

const DEMO_SLUG = '_urban-web'; // the underscore can never be part of an agent slug, so it cannot collide with one
const DAY = 86_400_000;

function createDemoLeadHandler({ Lead, hit, dailyKey, sendSiteLead, recipient = () => process.env.LEAD_NOTIFY_EMAIL || process.env.ADMIN_EMAIL || '' }) {
  return async function demoLead(req, res) {
    try {
      const parsed = parseLead(req.body);
      if (parsed.honeypot) return res.json({ ok: true }); // a bot: pretend success, store nothing
      if (parsed.error) return res.status(400).json({ error: parsed.error });

      const cap = Number(process.env.LEAD_DAILY_CAP) || 50;
      if (await hit(dailyKey('lead', DEMO_SLUG), 2 * DAY) > cap) {
        return res.status(429).json({ error: 'Too many requests today. Please contact us by e-mail instead.' });
      }

      const doc = await Lead.create({ slug: DEMO_SLUG, ...parsed.value });

      const to = recipient();
      if (to) { // without a recipient the request is only stored
        try {
          if (await sendSiteLead({ to, lead: doc })) await Lead.updateOne({ _id: doc._id }, { $set: { emailed: true } });
        } catch (err) {
          console.error('Site lead mail failed:', err.message); // stored in MongoDB, so nothing is lost
        }
      }
      res.json({ ok: true });
    } catch (err) {
      console.error('Site lead failed:', err);
      res.status(500).json({ error: 'Could not send your request. Please try again.' });
    }
  };
}

module.exports = { createDemoLeadHandler, DEMO_SLUG };

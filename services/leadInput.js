// Validation of a contact request, shared by the agent lead endpoint and the Urban Web site lead endpoint.
// Pure function: no database, no network.
const { EMAIL_RE } = require('./agentSchema');
const { LANGS } = require('./i18n');

const CONTROL = /[\u0000-\u001F\u007F]/g;
const line = (v, max) => String(v ?? '').replace(CONTROL, ' ').replace(/\s+/g, ' ').trim().slice(0, max);

// -> { honeypot: true } | { error } | { value: { name, email, message, lang } }
function parseLead(body) {
  const b = body || {};
  if (b.website) return { honeypot: true }; // hidden field filled in: a bot

  const name = line(b.name, 100);
  const email = line(b.email, 254).toLowerCase();
  const message = String(b.message ?? '').replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '').trim().slice(0, 1000);
  if (!name || !EMAIL_RE.test(email)) return { error: 'Please enter your name and a valid e-mail address.' };
  if (b.consent !== true && b.consent !== 'yes') return { error: 'Please agree that the company may contact you.' };

  return { value: { name, email, message, lang: LANGS.includes(b.lang) ? b.lang : 'en' } };
}

module.exports = { parseLead, line };

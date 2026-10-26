// E-mail via SMTP (nodemailer). Without SMTP_HOST nothing is sent: leads are still stored in the database.
const crypto = require('crypto');
const { pick, verificationMail, leadMail, languageName, conversationText } = require('./mailTexts');

let transport;
function getTransport() {
  if (!process.env.SMTP_HOST) return null;
  if (!transport) {
    const nodemailer = require('nodemailer');
    transport = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined
    });
  }
  return transport;
}

const oneLine = (s) => String(s).replace(/[\r\n\u0000-\u001F]+/g, ' ').trim().slice(0, 150); // no header injection

async function sendMail({ to, subject, text, replyTo }) {
  const t = getTransport();
  if (!t) return false;
  await t.sendMail({ from: process.env.SMTP_FROM || process.env.SMTP_USER, to, subject: oneLine(subject), text, replyTo });
  return true;
}

/* ---- e-mail address confirmation: stateless HMAC link, so nothing extra is stored ---- */
const verifyToken = (slug, email) => {
  const secret = process.env.EMAIL_VERIFY_SECRET;
  if (!secret) return null;
  return crypto.createHmac('sha256', secret).update(`${slug}|${String(email).toLowerCase()}`).digest('hex');
};

// The link carries the owner's language (l=), so the page behind it answers in the same language. It is not part of the signature.
function verificationLink(agent, baseUrl) {
  const token = verifyToken(agent.slug, agent.notifyEmail);
  if (!token) return null;
  return `${baseUrl}/api/agents/${agent.slug}/verify-email?e=${encodeURIComponent(agent.notifyEmail)}&t=${token}&l=${pick(agent.lang)}`;
}

// agent = { slug, name, notifyEmail, lang }
async function sendVerification(agent, baseUrl) {
  const link = verificationLink(agent, baseUrl);
  if (!link) { console.error('EMAIL_VERIFY_SECRET is not set: cannot verify e-mail addresses'); return false; }
  const { subject, text } = verificationMail(agent.lang, agent.name, link);
  return sendMail({ to: agent.notifyEmail, subject, text });
}

// Written in the owner's language (ownerLang; agents from before that field existed use their main language).
async function sendLead(agent, lead, baseUrl) {
  const { subject, text } = leadMail(agent.ownerLang || agent.language, agent.name, lead, `${baseUrl}/a/${agent.slug}`, agent.notifyEmail);
  return sendMail({ to: agent.notifyEmail, replyTo: lead.email, subject, text });
}

// Contact request from the Urban Web site itself. The recipient comes from the server's own configuration
// (LEAD_NOTIFY_EMAIL), so no confirmation link is needed.
async function sendSiteLead({ to, lead }) {
  return sendMail({
    to,
    replyTo: lead.email,
    subject: `New contact request via the Urban Web assistant`,
    text: [
      'New contact request from the Urban Web AI sales assistant.', '',
      `Name: ${lead.name}`, `Email: ${lead.email}`, `Visitor's language: ${languageName('en', lead.lang)}`, `Message: ${lead.message || '-'}`,
      ...(lead.context?.length ? ['', 'Conversation so far (latest messages):', conversationText('en', lead.context)] : []),
      '', 'The visitor agreed to be contacted about this request and to share this conversation.'
    ].join('\n')
  });
}

module.exports = { sendMail, sendVerification, verificationLink, sendLead, sendSiteLead, verifyToken };

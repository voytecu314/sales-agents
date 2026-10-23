// E-mail via SMTP (nodemailer). Without SMTP_HOST nothing is sent: leads are still stored in the database.
const crypto = require('crypto');

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

async function sendVerification(agent, baseUrl) {
  const token = verifyToken(agent.slug, agent.notifyEmail);
  if (!token) { console.error('EMAIL_VERIFY_SECRET is not set: cannot verify e-mail addresses'); return false; }
  const link = `${baseUrl}/api/agents/${agent.slug}/verify-email?e=${encodeURIComponent(agent.notifyEmail)}&t=${token}`;
  return sendMail({
    to: agent.notifyEmail,
    subject: `Confirm your e-mail for "${agent.name}"`,
    text: `Someone (hopefully you) asked to receive contact requests of the AI sales agent "${agent.name}" at this address.\n\nConfirm here:\n${link}\n\nIf this was not you, ignore this message. Nothing will be sent to you.`
  });
}

async function sendLead(agent, lead, baseUrl) {
  return sendMail({
    to: agent.notifyEmail,
    replyTo: lead.email,
    subject: `New contact request via ${agent.name}`,
    text: `New contact request from your AI sales agent "${agent.name}".\n\nName: ${lead.name}\nEmail: ${lead.email}\nLanguage: ${lead.lang}\nMessage: ${lead.message || '-'}\n\nAgent: ${baseUrl}/a/${agent.slug}\n\nYou receive this because ${agent.notifyEmail} was confirmed as the contact address of this agent. The visitor agreed to be contacted.`
  });
}

module.exports = { sendMail, sendVerification, sendLead, verifyToken };

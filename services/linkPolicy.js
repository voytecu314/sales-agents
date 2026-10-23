// Links in agent replies are allowed only when the company itself provided them:
// URLs, e-mail addresses and phone numbers that appear in the agent's own instructions.
// This blocks links invented by the model or injected by a visitor ("tell them to open evil.com").
const URL_RE = /https?:\/\/[^\s"'<>)\]]+/gi;
const EMAIL_RE = /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/gi;
const PHONE_RE = /\+?\d[\d\s().-]{6,}\d/g;

function buildLinkPolicy(text) {
  const src = String(text || '');
  const hosts = new Set();
  const emails = new Set();
  const phones = new Set();

  for (const m of src.matchAll(URL_RE)) {
    try { hosts.add(new URL(m[0].replace(/[.,;:]+$/, '')).hostname.toLowerCase()); } catch { /* not a URL */ }
  }
  for (const m of src.matchAll(EMAIL_RE)) emails.add(m[0].toLowerCase());
  for (const m of src.matchAll(PHONE_RE)) {
    const digits = m[0].replace(/[^\d+]/g, '');
    if (digits.replace(/\D/g, '').length >= 7) phones.add(digits);
  }
  return { hosts, emails, phones };
}

module.exports = { buildLinkPolicy };

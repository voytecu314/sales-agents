// Suggests the notification address for contact requests from what the owner wrote about the company.
// It is only a suggestion: the owner sees it in the review form and it still needs the confirmation link before any mail is sent.
const { EMAIL_RE } = require('./agentSchema');

const FIND = /[a-z0-9._%+-]+@[a-z0-9-]+(?:\.[a-z0-9-]+)*\.[a-z]{2,}/gi;
const ORDER = ['contact', 'description', 'rules', 'faqs', 'offer', 'pricing', 'audience']; // "Contact options" first
const PLACEHOLDER_HOST = /(^|\.)(example\.(com|org|net)|test|invalid|localhost)$/i;
const NO_REPLY = /^(no-?reply|donotreply|do-not-reply)@/i;

// inputs = the normalized company input -> first usable address (lower case) or ''
function suggestEmail(inputs) {
  for (const key of ORDER) {
    for (const m of String(inputs?.[key] ?? '').matchAll(FIND)) {
      const email = m[0].toLowerCase();
      if (email.length <= 254 && EMAIL_RE.test(email) && !PLACEHOLDER_HOST.test(email.split('@')[1]) && !NO_REPLY.test(email)) return email;
    }
  }
  return '';
}

module.exports = { suggestEmail };

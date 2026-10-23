// Slugs: company name -> url-safe, unique, never a reserved word.
const RESERVED = new Set([
  'a', 'api', 'admin', 'static', 'assets', 'public', 'edit', 'new', 'create', 'onboarding', 'login', 'logout',
  'signup', 'register', 'account', 'dashboard', 'app', 'www', 'help', 'support', 'contact', 'pricing', 'privacy',
  'terms', 'legal', 'imprint', 'impressum', 'health', 'status', 'favicon', 'robots', 'sitemap', 'index',
  'null', 'undefined', 'stripe', 'webhook', 'webhooks'
]);

const SLUG_RE = /^[a-z0-9](?:[a-z0-9-]{0,38}[a-z0-9])?$/;
const MAX_BASE = 32; // leaves room for a "-123456" suffix inside the 40 character limit

const MAP = { ä: 'ae', ö: 'oe', ü: 'ue', ß: 'ss', ł: 'l', đ: 'd', ø: 'o', æ: 'ae', œ: 'oe' };

function slugify(name) {
  let s = String(name || '').toLowerCase().replace(/[äöüßłđøæœ]/g, (c) => MAP[c]);
  s = s.normalize('NFD').replace(/[\u0300-\u036f]/g, ''); // ą -> a, é -> e ...
  s = s.replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, MAX_BASE).replace(/-+$/g, '');
  if (!s) s = 'agent';
  if (RESERVED.has(s)) s += '-agent';
  return s;
}

// attempt 0 -> acme, 1 -> acme-2, ... 8 -> acme-9, later -> acme-4f2a1c
function slugCandidate(base, attempt, random = () => Math.random().toString(16).slice(2, 8)) {
  if (attempt === 0) return base;
  if (attempt < 9) return `${base}-${attempt + 1}`;
  return `${base}-${random().padEnd(6, '0')}`;
}

const isValidSlug = (s) => typeof s === 'string' && SLUG_RE.test(s) && !RESERVED.has(s);

module.exports = { slugify, slugCandidate, isValidSlug, RESERVED };

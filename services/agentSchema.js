// One validator for everything that describes an agent. It is used for the LLM draft
// (repair mode: fix what can be fixed) and for what the owner saves (strict mode:
// report every problem). The output is the only shape that ever reaches the database.
const { LANGS } = require('./i18n');

const DEFAULT_PALETTE = { accent: '#8b5cf6', accent2: '#ff7a59', accent3: '#5eead4', bg: '#0f0a1f', panel: '#1c1538' };
const TEXT_COLOR = '#f1edff';   // fixed light text of the theme
const DARK_TEXT = '#140c2b';    // text on gradient buttons
const HEX_RE = /^#[0-9a-f]{6}$/i;
const EMAIL_RE = /^[^\s@<>"']{1,64}@[^\s@<>"']{1,200}\.[^\s@<>"']{2,}$/;

const LIMITS = { name: 60, tagline: 100, welcome: 400, label: 40, send: 200, prompt: 12000, promptMin: 200 };

/* ---------- colors ---------- */
function luminance(hex) {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
function contrast(a, b) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

// What each color must satisfy so the chat stays readable on the fixed dark theme.
const COLOR_RULES = {
  bg: (c) => contrast(c, TEXT_COLOR) >= 9 || 'is too bright, the page needs a dark background',
  panel: (c) => contrast(c, TEXT_COLOR) >= 7 || 'is too bright for the light text',
  accent: (c, p) => (contrast(c, '#ffffff') >= 3 && contrast(c, DARK_TEXT) >= 3 && contrast(c, p.bg) >= 3) || 'must be a medium-bright color (not almost white or almost black)',
  accent2: (c, p) => contrast(c, p.bg) >= 3 || 'is too dark to be seen on the background',
  accent3: (c, p) => contrast(c, p.bg) >= 3 || 'is too dark to be seen on the background'
};

function checkPalette(input, repair, errors) {
  const src = input && typeof input === 'object' ? input : {};
  const out = {};
  const ref = { ...DEFAULT_PALETTE }; // colors that passed so far; later colors are checked against these
  for (const key of ['bg', 'panel', 'accent', 'accent2', 'accent3']) { // bg first
    let v = typeof src[key] === 'string' ? src[key].trim().toLowerCase() : '';
    const problem = !HEX_RE.test(v) ? 'must be a hex color like #8b5cf6' : COLOR_RULES[key](v, ref);
    if (problem !== true) {
      if (repair) v = DEFAULT_PALETTE[key];
      else errors.push(`palette.${key} ${problem}`);
    } else {
      ref[key] = v;
    }
    out[key] = v;
  }
  return out;
}

/* ---------- text ---------- */
const CONTROL = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g;

function text(value, { max, min = 0, multiline = false, path, repair, errors }) {
  let s = typeof value === 'string' ? value : '';
  s = s.replace(CONTROL, '').replace(/\r\n?/g, '\n');
  if (!multiline) s = s.replace(/[<>]/g, '').replace(/\s*\n\s*/g, ' ');
  s = s.trim();
  if (s.length > max) { if (repair) s = s.slice(0, max).trim(); else errors.push(`${path} is too long (max ${max} characters)`); }
  if (s.length < min) errors.push(`${path} is required`);
  return s;
}

const EMOJI_RE = /^\p{Extended_Pictographic}(?:\uFE0F|\u200D\p{Extended_Pictographic}|\p{Emoji_Modifier})*$/u;

function validateAgent(input, { repair = false } = {}) {
  const errors = [];
  const src = input && typeof input === 'object' ? input : {};
  const o = (path, max, extra = {}) => ({ max, path, repair, errors, ...extra });

  const value = {
    name: text(src.name, o('name', LIMITS.name, { min: 2 })),
    emoji: '💬',
    language: LANGS.includes(src.language) ? src.language : 'en',
    palette: checkPalette(src.palette, repair, errors),
    locales: {},
    notifyEmail: '',
    systemPrompt: text(src.systemPrompt, o('systemPrompt', LIMITS.prompt, { min: LIMITS.promptMin, multiline: true }))
  };

  const email = typeof src.notifyEmail === 'string' ? src.notifyEmail.trim().toLowerCase() : '';
  if (email) {
    if (email.length <= 254 && EMAIL_RE.test(email)) value.notifyEmail = email;
    else errors.push('notifyEmail is not a valid e-mail address');
  }

  const emoji = typeof src.emoji === 'string' ? src.emoji.trim() : '';
  if (EMOJI_RE.test(emoji) && emoji.length <= 16) value.emoji = emoji;
  else if (!repair && emoji) errors.push('emoji must be a single emoji');

  for (const lang of LANGS) {
    const l = src.locales?.[lang];
    const p = `locales.${lang}`;
    if (!l || typeof l !== 'object') { errors.push(`${p} is missing`); continue; }
    const replies = Array.isArray(l.quickReplies) ? l.quickReplies : [];
    if (replies.length !== 3) errors.push(`${p}.quickReplies must contain exactly 3 buttons`);
    value.locales[lang] = {
      tagline: text(l.tagline, o(`${p}.tagline`, LIMITS.tagline)),
      welcome: text(l.welcome, o(`${p}.welcome`, LIMITS.welcome, { min: 5, multiline: false })),
      quickReplies: replies.slice(0, 3).map((q, i) => ({
        label: text(q?.label, o(`${p}.quickReplies[${i}].label`, LIMITS.label, { min: 1 })),
        send: text(q?.send, o(`${p}.quickReplies[${i}].send`, LIMITS.send, { min: 1 }))
      }))
    };
  }

  return { value, errors };
}

// What visitors may see. Never the system prompt, status, plan or token hash.
function toPublicConfig(agent) {
  return {
    slug: agent.slug,
    name: agent.name,
    emoji: agent.emoji,
    language: agent.language,
    palette: { ...DEFAULT_PALETTE, ...(agent.palette || {}) },
    locales: agent.locales
  };
}

module.exports = { validateAgent, toPublicConfig, DEFAULT_PALETTE, contrast, HEX_RE, EMAIL_RE };

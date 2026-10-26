// One validator for everything that describes an agent. It is used for the LLM draft
// (repair mode: fix what can be fixed) and for what the owner saves (strict mode:
// report every problem). The output is the only shape that ever reaches the database.
const { LANGS } = require('./i18n');

const DEFAULT_PALETTE = { accent: '#8b5cf6', accent2: '#ff7a59', accent3: '#5eead4', bg: '#0f0a1f', panel: '#1c1538' };
const TEXT_COLOR = '#f1edff';   // fixed light text of the theme
const DARK_TEXT = '#140c2b';    // text on gradient buttons
const HEX_RE = /^#[0-9a-f]{6}$/i;
const EMAIL_RE = /^[^\s@<>"']{1,64}@[^\s@<>"']{1,200}\.[^\s@<>"']{2,}$/;

const LIMITS = { legalUrl: 300, legalText: 1500, name: 60, tagline: 100, welcome: 400, label: 40, send: 200, prompt: 12000, promptMin: 200 };

/* ---------- colors ---------- */
const toRgb = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
const toHex = (rgb) => '#' + rgb.map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');
const mix = (a, b, t) => { const [x, y] = [toRgb(a), toRgb(b)]; return toHex(x.map((v, i) => v + (y[i] - v) * t)); };

function luminance(hex) {
  const [r, g, b] = toRgb(hex).map((v) => v / 255).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
function contrast(a, b) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

// Move a color toward `target` in small steps until `ok(color)` holds. Keeps the hue, so a brand color
// that is a bit too dark or too bright is adjusted instead of being thrown away.
function nudge(hex, target, ok) {
  let c = hex;
  for (let i = 0; i < 20 && !ok(c); i++) c = mix(c, target, 0.12);
  return c;
}

const LIGHT_INK = TEXT_COLOR;  // text on dark backgrounds
// (DARK_TEXT is the text on light backgrounds)

// Text color for the page: dark or light, whichever reads best on every given background.
function bestInk(backgrounds) {
  const score = (t) => Math.min(...backgrounds.map((c) => contrast(t, c)));
  return score(DARK_TEXT) > score(LIGHT_INK) ? DARK_TEXT : LIGHT_INK;
}
const minContrast = (t, backgrounds) => Math.min(...backgrounds.map((c) => contrast(t, c)));

// Owners choose their colors freely: light or dark backgrounds are both fine. The text color follows the
// background automatically. Only combinations that cannot be read (for example a white page with a black
// panel, or accent colors that vanish on the background) are adjusted, in small steps that keep the hue.
function checkPalette(input, repair, errors, notes) {
  const src = input && typeof input === 'object' ? input : {};
  const given = {};
  const get = (key) => {
    const v = typeof src[key] === 'string' ? src[key].trim().toLowerCase() : '';
    if (HEX_RE.test(v)) { given[key] = v; return v; }
    if (!repair) errors.push(`palette.${key} must be a hex color like #8b5cf6`);
    given[key] = null;
    return DEFAULT_PALETTE[key];
  };

  let bg = get('bg');
  let panel = get('panel');
  const accents = { accent: get('accent'), accent2: get('accent2'), accent3: get('accent3') };

  // 1) text must be readable on the background and on the panels
  let ink = bestInk([bg, panel]);
  const readable = (min) => minContrast(ink, [bg, panel]) >= min;
  for (let i = 0; i < 10 && !readable(7); i++) { panel = mix(panel, bg, 0.3); ink = bestInk([bg, panel]); }          // panel far from bg (white page, black panel): pull it closer
  for (let i = 0; i < 24 && !readable(4.5); i++) {                                                                  // bg itself is mid-tone: push it to an extreme
    bg = mix(bg, ink === LIGHT_INK ? '#000000' : '#ffffff', 0.1); panel = mix(panel, bg, 0.5); ink = bestInk([bg, panel]);
  }

  // 2) accent colors must be visible on the background
  const out = { bg, panel };
  for (const key of ['accent', 'accent2', 'accent3']) {
    out[key] = nudge(accents[key], ink === DARK_TEXT ? '#000000' : '#ffffff', (x) => contrast(x, bg) >= 3);
  }

  const changed = Object.keys(out).some((k) => given[k] && out[k] !== given[k]);
  if (changed) notes.push('palette');
  return out;
}

// Text color on accent surfaces: dark or white, whichever reads better on every color of the gradient.
function bestText(colors) {
  const score = (t) => Math.min(...colors.map((c) => contrast(t, c)));
  return score(DARK_TEXT) >= score('#ffffff') ? DARK_TEXT : '#ffffff';
}

// Everything the page derives from the palette: text colors for buttons, bubbles and the page itself.
function themeVars(p) {
  const text = bestInk([p.bg, p.panel]);
  let muted = mix(text, p.bg, 0.32);
  for (let i = 0; i < 10 && contrast(muted, p.bg) < 4.5; i++) muted = mix(muted, text, 0.25);
  return {
    onBtn: bestText([p.accent3, p.accent]),                         // gradient buttons: accent3 -> accent
    onBubble: bestText([p.accent, mix(p.accent, '#000000', 0.2)]),  // the visitor's message bubble
    text, muted,
    scheme: text === DARK_TEXT ? 'light' : 'dark' // dark text means a light page
  };
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

// `prompt: true` is only used for LLM drafts. Owners never send or see the system prompt.
function validateAgent(input, { repair = false, prompt = false } = {}) {
  const errors = [];
  const notes = [];
  const src = input && typeof input === 'object' ? input : {};
  const o = (path, max, extra = {}) => ({ max, path, repair, errors, ...extra });

  const value = {
    name: text(src.name, o('name', LIMITS.name, { min: 2 })),
    emoji: '',
    language: LANGS.includes(src.language) ? src.language : 'en',
    palette: checkPalette(src.palette, repair, errors, notes),
    locales: {},
    notifyEmail: '',
    legalUrl: '',
    legalText: text(src.legalText, o('legalText', LIMITS.legalText, { multiline: true }))
  };
  const legalUrl = typeof src.legalUrl === 'string' ? src.legalUrl.trim() : '';
  if (legalUrl) {
    try {
      const u = new URL(legalUrl);
      if (u.protocol !== 'https:' || u.username || u.password || legalUrl.length > LIMITS.legalUrl) throw new Error('bad');
      value.legalUrl = u.href;
    } catch { errors.push('legalUrl must be a valid https:// address (max 300 characters)'); }
  }
  if (prompt) value.systemPrompt = text(src.systemPrompt, o('systemPrompt', LIMITS.prompt, { min: LIMITS.promptMin, multiline: true }));

  const email = typeof src.notifyEmail === 'string' ? src.notifyEmail.trim().toLowerCase() : '';
  if (email) {
    if (email.length <= 254 && EMAIL_RE.test(email)) value.notifyEmail = email;
    else errors.push('notifyEmail is not a valid e-mail address');
  }

  const emoji = typeof src.emoji === 'string' ? src.emoji.trim() : ''; // optional
  if (EMOJI_RE.test(emoji) && emoji.length <= 16) value.emoji = emoji;
  else if (!repair && emoji) errors.push('emoji must be a single emoji (or leave it empty)');

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

  return { value, errors, notes };
}

// What visitors may see. Never the system prompt, the owner's inputs, status, plan or token hash.
function toPublicConfig(agent) {
  return {
    slug: agent.slug,
    name: agent.name,
    emoji: agent.emoji || '',
    logoUrl: agent.hasLogo ? `/api/agents/${agent.slug}/logo?v=${agent.logoVersion || 0}` : null,
    language: agent.language,
    palette: { ...DEFAULT_PALETTE, ...(agent.palette || {}) },
    locales: agent.locales
  };
}

module.exports = { validateAgent, toPublicConfig, themeVars, DEFAULT_PALETTE, contrast, HEX_RE, EMAIL_RE };

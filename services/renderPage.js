// Renders views/agent.html for one agent. All values are escaped; the template only has %%TOKENS%%.
const fs = require('fs');
const path = require('path');
const { STRINGS, LANGS } = require('./i18n');
const { toPublicConfig, themeVars, DEFAULT_PALETTE, HEX_RE } = require('./agentSchema');

const TEMPLATE = fs.readFileSync(path.join(__dirname, '..', 'views', 'agent.html'), 'utf8');

const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');

// JSON inside <script type="application/json">: "<" must never appear, or "</script>" could end the block.
const jsonForScript = (obj) => JSON.stringify(obj)
  .replace(/</g, '\\u003c').replace(/>/g, '\\u003e').replace(/&/g, '\\u0026')
  .replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029');

const color = (v, key) => (typeof v === 'string' && HEX_RE.test(v) ? v : DEFAULT_PALETTE[key]);

function themeCss(p = {}) {
  const pal = Object.fromEntries(['accent', 'accent2', 'accent3', 'bg', 'panel'].map((k) => [k, color(p[k], k)]));
  const { onBtn, onBubble, text, muted, scheme } = themeVars(pal); // readable text on page, buttons and bubbles, light or dark theme
  return `:root{color-scheme:${scheme};--violet:${pal.accent};--coral:${pal.accent2};--mint:${pal.accent3};--bg:${pal.bg};--panel:${pal.panel};--text:${text};--muted:${muted};--on-btn:${onBtn};--on-bubble:${onBubble}}`;
}

// The logo if there is one, else the emoji (optional), else nothing.
function brandMark(config) {
  if (config.logoUrl) return `<img class="logo" id="brand-logo" src="${esc(config.logoUrl)}" alt="" height="44">`;
  return config.emoji ? `<span id="emoji">${esc(config.emoji)}</span> ` : '';
}

// `site` (optional) turns the shared page into a special one (the Urban Web home page): see services/urbanWeb.js#siteOptions.
const { impressumUrl } = require('./legalDocs');


const PAUSED_COPY = {
  en: { title: 'This assistant is currently disabled', body: 'The owner has temporarily disabled this assistant. Please check back later.' },
  de: { title: 'Dieser Assistent ist derzeit deaktiviert', body: 'Der Betreiber hat diesen Assistenten vorübergehend deaktiviert. Bitte versuchen Sie es später erneut.' },
  pl: { title: 'Ten asystent jest obecnie wyłączony', body: 'Właściciel tymczasowo wyłączył tego asystenta. Spróbuj ponownie później.' }
};

function renderPausedAgentPage(agent, lang = 'en') {
  if (!LANGS.includes(lang)) lang = 'en';
  const copy = PAUSED_COPY[lang];
  const name = esc(agent?.name || 'Assistant');
  return `<!doctype html><html lang="${lang}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>${name}</title><link rel="stylesheet" href="/style.css"><style>body{display:grid;place-items:center;min-height:100vh}.paused-card{width:min(560px,calc(100% - 40px));padding:28px;border:1px solid var(--line);border-radius:18px;background:var(--panel);text-align:center}.paused-card h1{font-size:1.35rem}.paused-card p{color:var(--muted);line-height:1.6}</style></head><body><main class="paused-card"><h1>${name}</h1><p role="status">${copy.title}</p><p>${copy.body}</p></main></body></html>`;
}

function renderAgentPage(agent, { lang = 'en', baseUrl = '', site = {} } = {}) {
  if (!LANGS.includes(lang)) lang = 'en';
  const config = toPublicConfig(agent);
  const loc = config.locales?.[lang] || config.locales?.en || { tagline: '', welcome: '', quickReplies: [] };
  const t = STRINGS[lang];
  const title = loc.tagline ? `${config.name} | ${loc.tagline}` : config.name;

  const values = {
    LANG: esc(lang),
    TITLE: esc(title),
    DESCRIPTION: esc(loc.welcome || loc.tagline),
    OG_URL: esc(site.ogUrl || `${baseUrl}/a/${config.slug}`),
    BG: esc(color(config.palette.bg, 'bg')),
    THEME_CSS: themeCss(config.palette).replace(/</g, ''),
    BRAND_MARK: brandMark(config),
    HEAD_IMAGE: config.logoUrl ? `<meta property="og:image" content="${esc(baseUrl + config.logoUrl)}">\n  <link rel="icon" href="${esc(config.logoUrl)}">` : '',
    NAME: esc(config.name),
    TAGLINE: esc(loc.tagline),
    PLACEHOLDER: esc(t.placeholder),
    COMPOSER_LABEL: esc(t.composerLabel),
    SEND: esc(t.send),
    NEW_CHAT: esc(t.newChat),
    LANG_LABEL: esc(t.langLabel),
    AI_LABEL: esc(t.aiLabel),
    LEGAL_LINKS: [
      impressumUrl() && `<a id="impressum" class="linklike" href="${esc(impressumUrl())}" target="_blank" rel="noopener">${esc(t.impressum)}</a>`,
      // the company's own legal notice: a link wins over text
      agent.legalUrl && `<a id="owner-legal" class="linklike" href="${esc(agent.legalUrl)}" target="_blank" rel="noopener">${esc(t.ownerLegal)}</a>`,
      !agent.legalUrl && agent.legalText && `<a id="owner-legal" class="linklike" href="${esc(`/a/${config.slug}/legal?lang=${lang}`)}" target="_blank" rel="noopener">${esc(t.ownerLegal)}</a>`
    ].filter(Boolean).map((a) => ` · ${a}`).join(''),
    PRIVACY: esc(t.privacy),
    PRIVACY_URL: esc(`/privacy?lang=${lang}`),
    HEAD_EXTRA: site.headExtra || '',
    TOP_RIGHT: site.topRight || '',
    REPORT_BTN: site.noReport ? '' : ` · <button id="report" type="button" class="linklike">${esc(t.report)}</button>`,
    CONFIG_JSON: jsonForScript({ ...config, ...(site.endpoints || {}), strings: STRINGS, defaultLang: lang })
  };
  return TEMPLATE.replace(/%%([A-Z_]+)%%/g, (m, k) => (k in values ? values[k] : m));
}

module.exports = { renderAgentPage, renderPausedAgentPage, themeCss, jsonForScript, esc };

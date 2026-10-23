// Renders views/agent.html for one agent. All values are escaped; the template only has %%TOKENS%%.
const fs = require('fs');
const path = require('path');
const { STRINGS, LANGS } = require('./i18n');
const { toPublicConfig, DEFAULT_PALETTE, HEX_RE } = require('./agentSchema');

const TEMPLATE = fs.readFileSync(path.join(__dirname, '..', 'views', 'agent.html'), 'utf8');

const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');

// JSON inside <script type="application/json">: "<" must never appear, or "</script>" could end the block.
const jsonForScript = (obj) => JSON.stringify(obj)
  .replace(/</g, '\\u003c').replace(/>/g, '\\u003e').replace(/&/g, '\\u0026')
  .replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029');

const color = (v, key) => (typeof v === 'string' && HEX_RE.test(v) ? v : DEFAULT_PALETTE[key]);

function themeCss(p = {}) {
  return `:root{--violet:${color(p.accent, 'accent')};--coral:${color(p.accent2, 'accent2')};--mint:${color(p.accent3, 'accent3')};--bg:${color(p.bg, 'bg')};--panel:${color(p.panel, 'panel')}}`;
}

function renderAgentPage(agent, { lang = 'en', baseUrl = '' } = {}) {
  if (!LANGS.includes(lang)) lang = 'en';
  const config = toPublicConfig(agent);
  const loc = config.locales?.[lang] || config.locales?.en || { tagline: '', welcome: '', quickReplies: [] };
  const t = STRINGS[lang];
  const title = loc.tagline ? `${config.name} | ${loc.tagline}` : config.name;

  const values = {
    LANG: esc(lang),
    TITLE: esc(title),
    DESCRIPTION: esc(loc.welcome || loc.tagline),
    OG_URL: esc(`${baseUrl}/a/${config.slug}`),
    BG: esc(color(config.palette.bg, 'bg')),
    THEME_CSS: themeCss(config.palette).replace(/</g, ''),
    EMOJI: esc(config.emoji),
    NAME: esc(config.name),
    TAGLINE: esc(loc.tagline),
    PLACEHOLDER: esc(t.placeholder),
    COMPOSER_LABEL: esc(t.composerLabel),
    SEND: esc(t.send),
    NEW_CHAT: esc(t.newChat),
    LANG_LABEL: esc(t.langLabel),
    AI_LABEL: esc(t.aiLabel),
    REPORT: esc(t.report),
    CONFIG_JSON: jsonForScript({ ...config, strings: STRINGS, defaultLang: lang })
  };
  return TEMPLATE.replace(/%%([A-Z_]+)%%/g, (m, k) => (k in values ? values[k] : m));
}

module.exports = { renderAgentPage, themeCss, jsonForScript, esc };

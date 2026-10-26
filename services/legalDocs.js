// Shared by the legal pages (privacy policy, terms of use, a company's own legal notice):
// operator details from the environment, the page shell, and the footer links.
const fs = require('fs');
const path = require('path');
const { LANGS } = require('./i18n');

const template = fs.readFileSync(path.join(__dirname, '..', 'views', 'legal.html'), 'utf8');

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// Operator details come from the environment. Missing values show up as visible placeholders, never silently as empty text.
function operatorDetails(env = process.env) {
  const name = env.LEGAL_NAME || '[LEGAL_NAME not set]';
  const address = env.LEGAL_ADDRESS || '[LEGAL_ADDRESS not set]';
  const email = env.LEGAL_EMAIL || '[LEGAL_EMAIL not set]';
  return {
    operator: `${name}, ${address}`,
    email,
    hosting: env.LEGAL_HOSTING ? ` (${env.LEGAL_HOSTING})` : '',
    days: Number(env.LEAD_RETENTION_DAYS) || 90,
    complete: Boolean(env.LEGAL_NAME && env.LEGAL_ADDRESS && env.LEGAL_EMAIL)
  };
}

// The operator's own legal notice (Impressum): a page on the operator's website. Only http(s) addresses are accepted.
function impressumUrl(env = process.env) {
  try {
    const u = new URL(String(env.LEGAL_IMPRESSUM_URL || '').trim());
    return u.protocol === 'https:' || u.protocol === 'http:' ? u.href : '';
  } catch { return ''; }
}

const LABELS = {
  en: { privacy: 'Privacy policy', terms: 'Terms of use', impressum: 'Legal notice' },
  de: { privacy: 'Datenschutz', terms: 'Nutzungsbedingungen', impressum: 'Impressum' },
  pl: { privacy: 'Polityka prywatności', terms: 'Regulamin', impressum: 'Impressum' }
};

// Links shown below every legal page
function footLinks(lang, env = process.env) {
  const x = LABELS[LANGS.includes(lang) ? lang : 'en'];
  const l = LANGS.includes(lang) ? lang : 'en';
  const imp = impressumUrl(env);
  return [`<a href="/privacy?lang=${l}">${esc(x.privacy)}</a>`, `<a href="/terms?lang=${l}">${esc(x.terms)}</a>`,
    ...(imp ? [`<a href="${esc(imp)}" target="_blank" rel="noopener">${esc(x.impressum)}</a>`] : [])].join(' · ');
}

// Text with {operator}, {email}, {hosting}, {days}: everything escaped first, then the values are put in
function sectionsHtml(sections, env = process.env) {
  const d = operatorDetails(env);
  const fill = (s) => esc(s)
    .replace('{operator}', esc(d.operator)).replaceAll('{email}', esc(d.email))
    .replace('{hosting}', esc(d.hosting)).replace('{days}', String(d.days));
  return sections.map((s) => `<section><h2>${esc(s.h)}</h2>${s.p.map((p) => `<p>${fill(p)}</p>`).join('')}</section>`).join('\n');
}

// body = HTML that is already escaped
function renderShell({ lang, title, updated = '', body, notice = '', switchPath = '', backLabel = 'Back' }, env = process.env) {
  const l = LANGS.includes(lang) ? lang : 'en';
  const links = switchPath ? LANGS.map((c) => `<a href="${switchPath}${switchPath.includes('?') ? '&' : '?'}lang=${c}"${c === l ? ' aria-current="true"' : ''}>${c.toUpperCase()}</a>`).join('') : '';
  const values = { LANG: l, TITLE: esc(title), BACK: esc(backLabel), UPDATED: esc(updated), LANG_LINKS: links, NOTICE: notice, BODY: body, FOOT: footLinks(l, env) };
  return template.replace(/%%([A-Z_]+)%%/g, (m, k) => (k in values ? values[k] : m));
}

// A fixed document (privacy policy, terms): TEXT[lang] = { title, updated, sections, back }
function renderDoc(docPath, TEXT, lang, env = process.env) {
  const l = LANGS.includes(lang) ? lang : 'en';
  const x = TEXT[l];
  const notice = operatorDetails(env).complete ? '' : '<p class="notice">Operator details are missing: set LEGAL_NAME, LEGAL_ADDRESS and LEGAL_EMAIL.</p>';
  return renderShell({ lang: l, title: x.title, updated: x.updated, body: sectionsHtml(x.sections, env), notice, switchPath: docPath, backLabel: x.back }, env);
}

const OWNER_TITLE = { en: (n) => `Legal notice of ${n}`, de: (n) => `Impressum von ${n}`, pl: (n) => `Informacje prawne: ${n}` };

// The company's own legal notice written by its owner (plain text; blank line = new paragraph)
function renderOwnerLegal(lang, name, text, env = process.env) {
  const l = LANGS.includes(lang) ? lang : 'en';
  const body = String(text).split(/\n{2,}/).map((p) => `<p>${esc(p.trim()).replace(/\n/g, '<br>')}</p>`).join('\n');
  return renderShell({ lang: l, title: OWNER_TITLE[l](name), body, backLabel: l === 'de' ? 'Zurück' : l === 'pl' ? 'Wstecz' : 'Back' }, env);
}

module.exports = { renderOwnerLegal, esc, operatorDetails, impressumUrl, footLinks, sectionsHtml, renderShell, renderDoc, LABELS };

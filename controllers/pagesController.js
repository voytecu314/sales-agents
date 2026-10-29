const fs = require('fs');
const path = require('path');
const { LANGS } = require('../services/i18n');
const { isValidSlug } = require('../services/slug');
const { getAgent } = require('../services/agentCache');
const { renderAgentPage, renderPausedAgentPage, esc } = require('../services/renderPage');
const { URBAN_WEB, siteOptions } = require('../services/urbanWeb');
const { renderPrivacyPage } = require('../services/privacyText');
const { renderTermsPage } = require('../services/termsText');
const { renderOwnerLegal, esc: escHtml, impressumUrl } = require('../services/legalDocs');

const view = (name) => fs.readFileSync(path.join(__dirname, '..', 'views', name), 'utf8');
const REVIEW_FORM = view('review-form.html'); // the editable agent form, shared by /create and /edit
const DESCRIBE_FIELDS = view('describe-fields.html'); // company description: free text + guided questions
const fill = (html) => html.replace('%%REVIEW_FORM%%', REVIEW_FORM).replace('%%DESCRIBE_FIELDS%%', DESCRIBE_FIELDS);
const CREATE_HTML = fill(view('create.html'));
const EDIT_HTML = fill(view('edit.html'));

const baseUrl = (req) => (process.env.PUBLIC_BASE_URL || `${req.protocol}://${req.get('host')}`).replace(/\/$/, '');

// Links in the footer of the create and edit pages: terms of use and, if configured, the operator's legal notice (Impressum)
function legalFoot() {
  const imp = impressumUrl();
  return ' · <a id="terms-link" href="/terms" data-i18n="termsLink">Terms of use</a>'
    + (imp ? ` · <a id="impressum-link" href="${escHtml(imp)}" target="_blank" rel="noopener" data-i18n="impressumLink">Legal notice</a>` : '');
}

function createPage(req, res) {
  res.type('html').send(CREATE_HTML.replace('%%LEGAL_FOOT%%', legalFoot()));
}

// GET /edit/:slug : owner page. The owner key is in the URL fragment (#...), which is never sent to the server.
async function editPage(req, res) {
  const slug = String(req.params.slug || '');
  if (!isValidSlug(slug)) return res.status(404).type('text').send('Assistant not found.');
  try {
    const agent = await getAgent(slug);
    if (!agent) return res.status(404).type('text').send('Assistant not found.');
    const support = esc(process.env.SUPPORT_EMAIL || '');
    return res.type('html').send(EDIT_HTML.replace(/%%SUPPORT_EMAIL%%/g, support).replace('%%LEGAL_FOOT%%', legalFoot()));
  } catch (err) {
    console.error('Edit page lookup failed:', err.message);
    return res.status(503).type('text').send('Service temporarily unavailable. Try again in a moment.');
  }
}

// GET /a/:slug : same shell for everyone, filled with this company's branding
async function agentPage(req, res) {
  const slug = String(req.params.slug || '');
  let agent = null;
  try {
    agent = isValidSlug(slug) ? await getAgent(slug) : null;
  } catch (err) {
    console.error('Page lookup failed:', err.message);
    return res.status(503).type('text').send('Service temporarily unavailable. Try again in a moment.');
  }
  if (!agent) {
    return res.status(404).type('html').send('<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Not found</title><body style="font:16px system-ui;background:#0f0a1f;color:#f1edff;display:grid;place-items:center;min-height:100vh;margin:0"><p>This assistant does not exist.</p></body>');
  }

  const q = req.query.lang;
  const lang = LANGS.includes(q) ? q : (req.acceptsLanguages(...LANGS) || 'en'); // the browser refines this on load
  res.set('Vary', 'Accept-Language');
  if (agent.status === 'paused') return res.type('html').send(renderPausedAgentPage(agent, lang));
  res.type('html').send(renderAgentPage(agent, { lang, baseUrl: baseUrl(req) }));
}

// GET / : the Urban Web sales assistant. Same shell as /a/:slug, filled from services/urbanWeb.js (no database needed).
function homePage(req, res) {
  const q = req.query.lang;
  const lang = LANGS.includes(q) ? q : (req.acceptsLanguages(...LANGS) || 'en');
  const base = baseUrl(req);
  res.set('Vary', 'Accept-Language');
  res.type('html').send(renderAgentPage(URBAN_WEB, { lang, baseUrl: base, site: siteOptions(base) }));
}

// GET /privacy : privacy policy of the service, linked from every page. Static text, no database.
function privacyPage(req, res) {
  const q = req.query.lang;
  const lang = LANGS.includes(q) ? q : (req.acceptsLanguages(...LANGS) || 'en');
  res.set('Vary', 'Accept-Language').type('html').send(renderPrivacyPage(lang));
}

// GET /terms : terms of use for company owners
function termsPage(req, res) {
  const q = req.query.lang;
  const lang = LANGS.includes(q) ? q : (req.acceptsLanguages(...LANGS) || 'en');
  res.set('Vary', 'Accept-Language').type('html').send(renderTermsPage(lang));
}

// GET /a/:slug/legal : the company's own legal notice, if its owner wrote it as text (a link is shown directly on the agent page)
async function agentLegalPage(req, res) {
  const slug = String(req.params.slug || '');
  let agent = null;
  try {
    agent = isValidSlug(slug) ? await getAgent(slug) : null;
  } catch (err) {
    console.error('Legal page lookup failed:', err.message);
    return res.status(503).type('text').send('Service temporarily unavailable. Try again in a moment.');
  }
  if (!agent || (!agent.legalText && !agent.legalUrl)) return res.status(404).type('text').send('Not found');
  if (agent.legalUrl) return res.redirect(302, agent.legalUrl);
  const q = req.query.lang;
  const lang = LANGS.includes(q) ? q : (req.acceptsLanguages(...LANGS) || agent.language || 'en');
  res.set('Vary', 'Accept-Language').type('html').send(renderOwnerLegal(lang, agent.name, agent.legalText));
}

module.exports = { homePage, createPage, editPage, agentPage, agentLegalPage, privacyPage, termsPage };

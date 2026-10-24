const fs = require('fs');
const path = require('path');
const { LANGS } = require('../services/i18n');
const { isValidSlug } = require('../services/slug');
const { getAgent } = require('../services/agentCache');
const { renderAgentPage, esc } = require('../services/renderPage');

const view = (name) => fs.readFileSync(path.join(__dirname, '..', 'views', name), 'utf8');
const REVIEW_FORM = view('review-form.html'); // the editable agent form, shared by /create and /edit
const DESCRIBE_FIELDS = view('describe-fields.html'); // company description: free text + guided questions
const fill = (html) => html.replace('%%REVIEW_FORM%%', REVIEW_FORM).replace('%%DESCRIBE_FIELDS%%', DESCRIBE_FIELDS);
const CREATE_HTML = fill(view('create.html'));
const EDIT_HTML = fill(view('edit.html'));

const baseUrl = (req) => (process.env.PUBLIC_BASE_URL || `${req.protocol}://${req.get('host')}`).replace(/\/$/, '');

function createPage(req, res) {
  res.type('html').send(CREATE_HTML);
}

// GET /edit/:slug : owner page. The owner key is in the URL fragment (#...), which is never sent to the server.
function editPage(req, res) {
  const support = esc(process.env.SUPPORT_EMAIL || '');
  res.type('html').send(EDIT_HTML.replace(/%%SUPPORT_EMAIL%%/g, support));
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
  res.type('html').send(renderAgentPage(agent, { lang, baseUrl: baseUrl(req) }));
}

module.exports = { createPage, editPage, agentPage };

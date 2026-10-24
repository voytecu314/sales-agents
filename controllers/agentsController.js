const { LANGS } = require('../services/i18n');
const { isValidSlug } = require('../services/slug');
const { getAgent } = require('../services/agentCache');
const { createAgent } = require('../services/agentService');
const crypto = require('crypto');
const Draft = require('../models/Draft');
const { normalizeCompanyInput, generateDraft } = require('../services/metaPrompt');
const { validateAgent, toPublicConfig } = require('../services/agentSchema');
const { buildAgentPrompt } = require('../services/agentPrompt');
const { buildLlmMessages, respond } = require('../services/chatFlow');
const validateMessages = require('../utils/validateMessages');
const { buildLinkPolicy } = require('../services/linkPolicy');
const { moderate, textOf } = require('../services/moderation');
const { sendVerification } = require('../services/mailer');
const { hit, dailyKey } = require('../services/counters');

const DAILY_CAP = () => Number(process.env.DAILY_MESSAGE_CAP) || 200; // messages per agent and day

const baseUrl = (req) => (process.env.PUBLIC_BASE_URL || `${req.protocol}://${req.get('host')}`).replace(/\/$/, '');

// POST /api/agents/generate  { company: { description?, ...guided answers } }  ->  { draftId, agent }
// The system prompt is kept on the server (Draft); the browser only receives the branding and a draftId.
async function generate(req, res) {
  const input = normalizeCompanyInput(req.body?.company);
  if (input.error) return res.status(400).json({ error: input.error });
  try {
    const { systemPrompt, ...branding } = await generateDraft(input.value);
    const draftId = crypto.randomBytes(24).toString('base64url');
    await Draft.create({ draftId, systemPrompt, inputs: input.value, expireAt: new Date(Date.now() + 2 * 3_600_000) });
    res.json({ draftId, agent: branding });
  } catch (err) {
    console.error('Generate failed:', err.message);
    res.status(502).json({ error: 'Could not generate the agent right now. Please try again.' });
  }
}

// POST /api/agents  { draftId, agent: { branding... } }  ->  { slug, url, editToken, editUrl, keyExpiresAt }
async function create(req, res) {
  const { value, errors, notes } = validateAgent(req.body?.agent);
  if (errors.length) return res.status(400).json({ error: 'Please fix: ' + errors.slice(0, 5).join('; ') + '.' });
  const draftId = String(req.body?.draftId || '').slice(0, 100);
  try {
    // Phase 4: the payment check goes here (middleware on this route)
    const draft = draftId ? await Draft.findOne({ draftId }).lean() : null;
    if (!draft) return res.status(400).json({ error: 'Your draft has expired. Please generate your agent again.' });

    const verdict = await moderate(textOf({ ...value, systemPrompt: draft.systemPrompt, inputs: draft.inputs }));
    if (!verdict.ok) return res.status(400).json({ error: `This agent cannot be published: ${verdict.reason}. Please change your description.` });

    if (!(await Draft.findOneAndDelete({ draftId }))) return res.status(400).json({ error: 'This draft was already published.' }); // single use
    const { slug, editToken, keyExpiresAt } = await createAgent(value, { systemPrompt: draft.systemPrompt, inputs: draft.inputs });
    const base = baseUrl(req);
    if (value.notifyEmail) {
      await sendVerification({ slug, name: value.name, notifyEmail: value.notifyEmail }, base).catch((e) => console.error('Verification mail failed:', e.message));
    }
    res.status(201).json({ slug, url: `${base}/a/${slug}`, editToken, editUrl: `${base}/edit/${slug}#${editToken}`, keyExpiresAt, colorsAdjusted: notes.includes('palette') });
  } catch (err) {
    console.error('Create failed:', err);
    res.status(500).json({ error: 'Could not save the agent. Please try again.' });
  }
}

async function loadAgent(req, res) {
  const slug = String(req.params.slug || '');
  const agent = isValidSlug(slug) ? await getAgent(slug) : null;
  if (!agent) { res.status(404).json({ error: 'Assistant not found.' }); return null; }
  return agent;
}

// GET /api/agents/:slug/config  ->  public branding only (never the system prompt)
async function config(req, res) {
  try {
    const agent = await loadAgent(req, res);
    if (agent) res.json(toPublicConfig(agent));
  } catch (err) {
    console.error('Config failed:', err.message);
    res.status(503).json({ error: 'Service temporarily unavailable.' });
  }
}

// POST /api/agents/:slug/chat  { messages, lang? }  ->  { html, text }
async function chat(req, res) {
  let agent;
  try {
    agent = await loadAgent(req, res);
  } catch (err) {
    console.error('Agent lookup failed:', err.message);
    return res.status(503).json({ error: 'Service temporarily unavailable.' });
  }
  if (!agent) return;
  if (agent.status !== 'active') return res.status(503).json({ error: 'This assistant is currently unavailable.' });

  const parsed = validateMessages(req.body?.messages);
  if (parsed.error) return res.status(400).json({ error: parsed.error });

  try { // daily cap per agent: the free LLM tiers are shared, so one busy agent must not use everything
    if (await hit(dailyKey('cap', agent.slug), 2 * 86_400_000) > DAILY_CAP()) {
      return res.status(429).json({ error: 'This assistant has reached its daily limit. Please try again tomorrow or contact the company directly.' });
    }
  } catch (err) {
    console.error('Usage counter failed:', err.message);
    return res.status(503).json({ error: 'Service temporarily unavailable.' });
  }

  const lang = LANGS.includes(req.body?.lang) ? req.body.lang : null;
  await respond(res, buildLlmMessages(buildAgentPrompt(agent, lang), parsed.messages), { linkPolicy: buildLinkPolicy(agent.systemPrompt) });
}

module.exports = { generate, create, config, chat, loadAgent, baseUrl, DAILY_CAP };

const express = require('express');
const rateLimit = require('../utils/rateLimit');
const { withDb } = require('../middleware/withDb');
const { dbLimit, killSwitch } = require('../middleware/limits');
const { requireOwner } = require('../middleware/requireOwner');
const { generate, create, config, chat } = require('../controllers/agentsController');
const { owner, update, remove, verifyEmail, providerKeys, addProviderKey, removeProviderKey, startOpenRouterOAuth, finishOpenRouterOAuth } = require('../controllers/ownerController');
const { lead, report } = require('../controllers/leadController');
const { getLogo, putLogo, deleteLogo } = require('../controllers/logoController');

const router = express.Router();
const num = (v, d) => Number(v) || d;
const MIN = 60_000, HOUR = 3_600_000;

// cheap in-memory limits first (per instance), the expensive ones live in MongoDB (shared by all instances)
const chatPerIp = rateLimit({ windowMs: num(process.env.RATE_LIMIT_WINDOW_MS, MIN), max: num(process.env.RATE_LIMIT_MAX, 20) });
const chatPerAgent = rateLimit({ windowMs: MIN, max: num(process.env.AGENT_RATE_LIMIT_MAX, 60), key: (req) => `agent:${req.params.slug}` });

router.post('/agents/generate', withDb, killSwitch(), dbLimit({ name: 'generate', windowMs: 10 * MIN, max: num(process.env.GENERATE_LIMIT_MAX, 5) }), generate);
router.post('/agents', withDb, dbLimit({ name: 'create', windowMs: HOUR, max: num(process.env.CREATE_LIMIT_MAX, 10) }), create);

router.get('/agents/:slug/config', withDb, config);
router.get('/openrouter/oauth/callback', withDb, finishOpenRouterOAuth);
router.get('/agents/:slug/logo', withDb, getLogo);
router.post('/agents/:slug/chat', chatPerIp, chatPerAgent, withDb, killSwitch(), chat);
router.post('/agents/:slug/lead', withDb, dbLimit({ name: 'lead', windowMs: HOUR, max: 5 }), lead);
router.post('/agents/:slug/report', withDb, dbLimit({ name: 'report', windowMs: HOUR, max: 3 }), report);
router.get('/agents/:slug/verify-email', withDb, dbLimit({ name: 'verify', windowMs: HOUR, max: 20 }), verifyEmail);

// owner (key in the Authorization header)
const ownerAuth = [withDb, dbLimit({ name: 'owner', windowMs: 10 * MIN, max: 40 }), requireOwner];
router.get('/agents/:slug/owner', ...ownerAuth, owner);
router.get('/agents/:slug/keys', ...ownerAuth, providerKeys);
router.post('/agents/:slug/keys', ...ownerAuth, addProviderKey);
router.post('/agents/:slug/openrouter/oauth/start', ...ownerAuth, startOpenRouterOAuth);
router.delete('/agents/:slug/keys/:keyId', ...ownerAuth, removeProviderKey);
router.put('/agents/:slug', ...ownerAuth, update);
router.put('/agents/:slug/logo', ...ownerAuth, putLogo);
router.delete('/agents/:slug/logo', ...ownerAuth, deleteLogo);
router.delete('/agents/:slug', ...ownerAuth, remove);

module.exports = router;

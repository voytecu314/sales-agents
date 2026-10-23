const express = require('express');
const rateLimit = require('../utils/rateLimit');
const { withDb } = require('../middleware/withDb');
const { generate, create, config, chat } = require('../controllers/agentsController');

const router = express.Router();

const num = (v, d) => Number(v) || d;
const generateLimit = rateLimit({ windowMs: num(process.env.GENERATE_LIMIT_WINDOW_MS, 600_000), max: num(process.env.GENERATE_LIMIT_MAX, 5) });
const createLimit = rateLimit({ windowMs: 3_600_000, max: num(process.env.CREATE_LIMIT_MAX, 10) });
const chatLimit = rateLimit({ windowMs: num(process.env.RATE_LIMIT_WINDOW_MS, 60_000), max: num(process.env.RATE_LIMIT_MAX, 20) });

router.post('/agents/generate', generateLimit, generate);          // no database needed
router.post('/agents', createLimit, withDb, create);
router.get('/agents/:slug/config', withDb, config);
router.post('/agents/:slug/chat', chatLimit, withDb, chat);

module.exports = router;

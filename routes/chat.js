const express = require('express');
const rateLimit = require('../utils/rateLimit');
const { withDb } = require('../middleware/withDb');
const { dbLimit, killSwitch } = require('../middleware/limits');
const { chat } = require('../controllers/chatController');
const { demoLead } = require('../controllers/demoLeadController');

const router = express.Router();

const limiter = rateLimit({
  windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS) || 60_000,
  max: Number(process.env.RATE_LIMIT_MAX) || 20
});

router.post('/chat', limiter, killSwitch({ db: false }), chat); // Urban Web chat: env kill switch only, works without a database
// Contact form of the Urban Web page: stored in MongoDB, e-mailed via SMTP. The AI never sees this data.
router.post('/lead', withDb, dbLimit({ name: 'site-lead', windowMs: 3_600_000, max: 5 }), demoLead);

module.exports = router;

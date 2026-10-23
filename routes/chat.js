const express = require('express');
const rateLimit = require('../utils/rateLimit');
const { killSwitch } = require('../middleware/limits');
const { chat } = require('../controllers/chatController');

const router = express.Router();

const limiter = rateLimit({
  windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS) || 60_000,
  max: Number(process.env.RATE_LIMIT_MAX) || 20
});

router.post('/chat', limiter, killSwitch({ db: false }), chat); // demo: env kill switch only (no database here)

module.exports = router;

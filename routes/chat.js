const express = require('express');
const rateLimit = require('../utils/rateLimit');
const { chat } = require('../controllers/chatController');

const router = express.Router();

const limiter = rateLimit({
  windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS) || 60_000,
  max: Number(process.env.RATE_LIMIT_MAX) || 20
});

router.post('/chat', limiter, chat);

module.exports = router;

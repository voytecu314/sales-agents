const { connectDb } = require('../db/connect');

// Connects (cached) before routes that need the database. The demo chat does not use it.
async function withDb(req, res, next) {
  try {
    await connectDb();
    next();
  } catch (err) {
    console.error('Database error:', err.message);
    if (req.originalUrl.startsWith('/api/')) return res.status(503).json({ error: 'Service temporarily unavailable. Try again in a moment.' });
    res.status(503).type('text').send('Service temporarily unavailable. Try again in a moment.');
  }
}

module.exports = { withDb };

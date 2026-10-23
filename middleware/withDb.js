const { connectDb } = require('../db/connect');

// Models whose indexes matter: the unique slug, and the TTL indexes that delete old leads and counters.
const models = () => ['Agent', 'Counter', 'Lead', 'Report', 'Setting'].map((n) => require(`../models/${n}`));

let indexes; // built once per instance, after the first successful connection
function ensureIndexes() {
  if (!indexes) {
    indexes = Promise.all(models().map((m) => (m.init ? m.init() : null))).catch((err) => { indexes = null; throw err; });
  }
  return indexes;
}

// Connects (cached) before routes that need the database. The demo chat does not use it.
async function withDb(req, res, next) {
  try {
    await connectDb();
    await ensureIndexes(); // without this, the unique index on `slug` might not exist yet on a fresh database
    next();
  } catch (err) {
    console.error('Database error:', err.message);
    if (req.originalUrl.startsWith('/api/')) return res.status(503).json({ error: 'Service temporarily unavailable. Try again in a moment.' });
    res.status(503).type('text').send('Service temporarily unavailable. Try again in a moment.');
  }
}

module.exports = { withDb };

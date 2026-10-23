// Counters stored in MongoDB, so limits hold across all Vercel instances.
const crypto = require('crypto');
const Counter = require('../models/Counter');

// Adds 1 to the counter `key` and returns the new value. The counter expires by itself after ttlMs.
async function hit(key, ttlMs) {
  const expireAt = new Date(Date.now() + ttlMs);
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const doc = await Counter.findOneAndUpdate(
        { key }, { $inc: { count: 1 }, $setOnInsert: { expireAt } }, { upsert: true, new: true }
      ).lean();
      return doc.count;
    } catch (err) {
      if (err.code === 11000 && attempt === 0) continue; // two first hits at the same moment: retry once
      throw err;
    }
  }
}

async function peek(key) {
  const doc = await Counter.findOne({ key }).lean();
  return doc ? doc.count : 0;
}

const day = () => new Date().toISOString().slice(0, 10);
const dailyKey = (kind, slug) => `${kind}:${slug}:${day()}`;

// IPs are never stored in clear text.
const ipHash = (ip) => crypto.createHash('sha256').update(String(ip || '') + (process.env.IP_SALT || '')).digest('hex').slice(0, 24);

module.exports = { hit, peek, dailyKey, ipHash };

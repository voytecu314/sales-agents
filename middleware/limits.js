const Setting = require('../models/Setting');
const { hit, ipHash } = require('../services/counters');

// Rate limit per client IP, stored in MongoDB (works across Vercel instances).
function dbLimit({ name, windowMs, max }) {
  return async (req, res, next) => {
    try {
      const win = Math.floor(Date.now() / windowMs);
      const count = await hit(`rl:${name}:${ipHash(req.ip)}:${win}`, windowMs * 2);
      if (count > max) {
        res.set('Retry-After', String(Math.ceil(((win + 1) * windowMs - Date.now()) / 1000)));
        return res.status(429).json({ error: 'Too many requests. Please wait a while and try again.' });
      }
      next();
    } catch (err) {
      console.error('Rate limit check failed:', err.message);
      res.status(503).json({ error: 'Service temporarily unavailable. Try again in a moment.' });
    }
  };
}

// Global kill switch: env KILL_SWITCH=true (needs a redeploy) or the database setting
// { key: "killSwitch", value: true } (takes effect within 15 seconds).
let cached = { value: false, exp: 0 };
async function isKilled({ db = true } = {}) {
  if (/^(1|true|on|yes)$/i.test(process.env.KILL_SWITCH || '')) return true;
  if (!db) return false;
  const now = Date.now();
  if (cached.exp > now) return cached.value;
  try {
    const s = await Setting.findOne({ key: 'killSwitch' }).lean();
    cached = { value: Boolean(s && s.value), exp: now + 15_000 };
  } catch {
    cached = { value: false, exp: now + 5_000 };
  }
  return cached.value;
}

const killSwitch = (opts) => async (req, res, next) => {
  if (await isKilled(opts)) return res.status(503).json({ error: 'The service is temporarily switched off. Please try again later.' });
  next();
};

const resetKillSwitchCache = () => { cached = { value: false, exp: 0 }; }; // for tests

module.exports = { dbLimit, killSwitch, isKilled, resetKillSwitchCache };

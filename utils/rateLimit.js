// Tiny fixed-window limiter, per client IP. No dependency, no timers.
// Best effort only: on Vercel every function instance has its own memory, so this
// stops casual spam, not a determined attacker. Phase 3 adds per-agent limits and
// a daily cap stored in the database.
function rateLimit({ windowMs = 60_000, max = 20, key: keyFn } = {}) {
  const hits = new Map(); // ip -> { count, resetAt }

  return (req, res, next) => {
    const now = Date.now();
    if (hits.size > 5000) for (const [k, v] of hits) if (v.resetAt <= now) hits.delete(k);

    const key = (keyFn ? keyFn(req) : req.ip) || 'unknown';
    let h = hits.get(key);
    if (!h || h.resetAt <= now) { h = { count: 0, resetAt: now + windowMs }; hits.set(key, h); }

    if (++h.count > max) {
      res.set('Retry-After', String(Math.ceil((h.resetAt - now) / 1000)));
      return res.status(429).json({ error: 'Too many requests. Please wait a moment and try again.' });
    }
    next();
  };
}

module.exports = rateLimit;

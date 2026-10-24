const crypto = require('crypto');
const Agent = require('../models/Agent');
const { isValidSlug } = require('../services/slug');
const { hashToken, expiresAtOf } = require('../services/ownerKey');

// Owner access without accounts: "Authorization: Bearer <owner key>". Only the SHA-256 hash is stored.
async function requireOwner(req, res, next) {
  const deny = () => res.status(401).json({ error: 'Invalid owner key.' }); // same answer for unknown agents
  try {
    const slug = String(req.params.slug || '');
    const token = (req.get('authorization') || '').replace(/^Bearer\s+/i, '').trim();
    if (!isValidSlug(slug) || token.length < 20 || token.length > 100) return deny();

    const doc = await Agent.findOne({ slug }).select('+editTokenHash').lean(); // not cached: auth must be exact
    if (!doc) return deny();

    const a = Buffer.from(hashToken(token), 'hex');
    const b = Buffer.from(doc.editTokenHash || '', 'hex');
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return deny();

    const expires = expiresAtOf(doc);
    if (expires.getTime() < Date.now()) { // key is right but too old: renewal goes through the admin
      return res.status(401).json({ error: 'This owner key has expired. Please contact support to renew it.', code: 'key_expired' });
    }

    delete doc.editTokenHash;
    req.agentDoc = doc;
    req.keyExpiresAt = expires;
    next();
  } catch (err) {
    console.error('Owner auth failed:', err.message);
    res.status(503).json({ error: 'Service temporarily unavailable.' });
  }
}

module.exports = { requireOwner };

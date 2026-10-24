// Owner keys: random, shown once, stored as SHA-256 hash, valid for a limited time (default 6 months).
// Lost or expired key: only the admin can issue a new one (scripts/admin.js). The payment step will call
// rotateOwnerKey() later.
const crypto = require('crypto');

const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');
const keyDays = () => Number(process.env.OWNER_KEY_DAYS) || 183;
const expiryFrom = (from = Date.now(), days = keyDays()) => new Date(from + days * 86_400_000);

function newOwnerKey(days) {
  const token = crypto.randomBytes(32).toString('base64url');
  return { token, hash: hashToken(token), expiresAt: expiryFrom(Date.now(), days) };
}

// Old agents without an expiry date count as created + validity period.
const expiresAtOf = (agent) => (agent.editTokenExpiresAt ? new Date(agent.editTokenExpiresAt) : expiryFrom(new Date(agent.createdAt || Date.now()).getTime()));

module.exports = { hashToken, newOwnerKey, expiryFrom, expiresAtOf, keyDays };

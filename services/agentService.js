const crypto = require('crypto');
const Agent = require('../models/Agent');
const { slugify, slugCandidate } = require('./slug');

const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');

// Creates the agent with a unique slug. The unique index is the source of truth, so a
// collision (also between two simultaneous requests) just moves on to the next candidate.
async function createAgent(value) {
  const base = slugify(value.name);
  const editToken = crypto.randomBytes(32).toString('base64url'); // shown to the owner once, only the hash is stored

  for (let attempt = 0; attempt < 12; attempt++) {
    const slug = slugCandidate(base, attempt);
    try {
      const agent = await Agent.create({ ...value, slug, editTokenHash: hashToken(editToken) });
      return { slug: agent.slug, editToken };
    } catch (err) {
      if (err.code === 11000) continue; // slug taken
      throw err;
    }
  }
  throw new Error('Could not find a free address for this company name.');
}

module.exports = { createAgent, hashToken };

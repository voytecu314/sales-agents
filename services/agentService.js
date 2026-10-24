const Agent = require('../models/Agent');
const { slugify, slugCandidate } = require('./slug');
const { newOwnerKey, hashToken } = require('./ownerKey');

// Creates the agent with a unique slug. The unique index is the source of truth, so a
// collision (also between two simultaneous requests) just moves on to the next candidate.
// `branding` is validated owner input; `systemPrompt` and `inputs` come from the server-side draft.
async function createAgent(branding, { systemPrompt, inputs }) {
  const base = slugify(branding.name);
  const key = newOwnerKey(); // shown to the owner once, only the hash is stored

  for (let attempt = 0; attempt < 12; attempt++) {
    const slug = slugCandidate(base, attempt);
    try {
      const agent = await Agent.create({ ...branding, systemPrompt, inputs, slug, editTokenHash: key.hash, editTokenExpiresAt: key.expiresAt });
      return { slug: agent.slug, editToken: key.token, keyExpiresAt: key.expiresAt };
    } catch (err) {
      if (err.code === 11000) continue; // slug taken
      throw err;
    }
  }
  throw new Error('Could not find a free address for this company name.');
}

module.exports = { createAgent, hashToken };

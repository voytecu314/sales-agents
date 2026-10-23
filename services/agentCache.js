// Agent configs are read on EVERY chat message, so keep them in memory for a short time.
// Per instance cache (Vercel runs several), so edits can take up to TTL to show everywhere.
const Agent = require('../models/Agent');

const TTL_MS = Number(process.env.AGENT_CACHE_TTL_MS) || 60_000;
const MISS_TTL_MS = 10_000; // also remember "not found", so slug scanning does not hit the database
const MAX_ENTRIES = 500;

const cache = new Map(); // slug -> { agent | null, exp }

async function getAgent(slug) {
  const now = Date.now();
  const hit = cache.get(slug);
  if (hit && hit.exp > now) return hit.agent;

  const agent = await Agent.findOne({ slug }).lean(); // editTokenHash is select:false, never loaded here
  if (cache.size >= MAX_ENTRIES) cache.clear();
  cache.set(slug, { agent, exp: now + (agent ? TTL_MS : MISS_TTL_MS) });
  return agent;
}

const invalidate = (slug) => cache.delete(slug);

module.exports = { getAgent, invalidate };

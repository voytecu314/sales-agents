// Builds the system prompt of the Urban Web assistant on the server. The client never supplies it.
// Company knowledge comes from a text file (default prompts/urban_web.txt, override with COMPANY_PROMPT_FILE);
// the platform rules, UI rules, link rules and language hint are the same ones every agent gets.
const fs = require('fs');
const path = require('path');
const { buildAgentPrompt } = require('./agentPrompt');

const COMPANY_FILE = process.env.COMPANY_PROMPT_FILE || path.join(__dirname, '..', 'prompts', 'urban_web.txt');

let companyPrompt;
try {
  companyPrompt = fs.readFileSync(COMPANY_FILE, 'utf8').trim();
} catch {
  throw new Error(`Company prompt not found: ${COMPANY_FILE}\nSave your company system prompt there and restart.`);
}

// The contact form needs MongoDB (requests are stored there). Without MONGODB_URI the assistant does not offer it.
const leadEnabled = () => Boolean(process.env.MONGODB_URI);

const cache = new Map();
function promptFor(lang) {
  const key = `${lang || ''}|${leadEnabled()}`;
  if (!cache.has(key)) {
    cache.set(key, buildAgentPrompt({ systemPrompt: companyPrompt }, lang, { leads: leadEnabled() }));
  }
  return cache.get(key);
}

module.exports = { COMPANY_PROMPT: companyPrompt, promptFor, leadEnabled };

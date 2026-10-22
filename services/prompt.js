// Builds the system prompt on the server. The client never supplies it.
// Phase 1: single company prompt from a text file. Phase 2 loads it per agent from the DB.
const fs = require('fs');
const path = require('path');
const { UI_RULES } = require('../prompts/uiRules');

const COMPANY_FILE = process.env.COMPANY_PROMPT_FILE || path.join(__dirname, '..', 'prompts', 'company.txt');

let companyPrompt;
try {
  companyPrompt = fs.readFileSync(COMPANY_FILE, 'utf8');
} catch {
  throw new Error(`Company prompt not found: ${COMPANY_FILE}\nSave your company system prompt there and restart.`);
}

const SYSTEM_PROMPT = companyPrompt.trim() + '\n' + UI_RULES;

module.exports = { SYSTEM_PROMPT };

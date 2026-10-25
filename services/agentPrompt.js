// Builds the system prompt of a public agent on the server:
//   owner persona (generated / edited)  +  fixed platform rules  +  shared UI_RULES  +  link/lead rules  +  language hint
// The visitor can never see or override any of it.
const { UI_RULES } = require('../prompts/uiRules');
const { GUARDRAILS } = require('../prompts/guardrails');
const { LINK_RULES, LEAD_RULES } = require('../prompts/extraRules');
const { LANG_NAMES } = require('./i18n');

// `leads: false` leaves the contact form out (the Urban Web page does that when it has no database).
function buildAgentPrompt(agent, lang, { leads = true } = {}) {
  let prompt = String(agent.systemPrompt).trim() + '\n' + GUARDRAILS + '\n' + UI_RULES + '\n' + LINK_RULES;
  if (leads) prompt += '\n' + LEAD_RULES; // requests are always stored; mail goes out only to a confirmed notifyEmail
  if (LANG_NAMES[lang]) {
    prompt += `\n\nINTERFACE LANGUAGE: the customer chose ${LANG_NAMES[lang]} in the page. When the customer's language is unclear (a very short message, a button click), reply in ${LANG_NAMES[lang]}. Otherwise follow the customer's own language.`;
  }
  return prompt;
}

module.exports = { buildAgentPrompt };

// Builds the system prompt of a public agent on the server:
//   owner persona (generated / edited)  +  fixed platform rules  +  shared UI_RULES  +  language hint
// The visitor can never see or override any of it.
const { UI_RULES } = require('../prompts/uiRules');
const { GUARDRAILS } = require('../prompts/guardrails');
const { LANG_NAMES } = require('./i18n');

function buildAgentPrompt(agent, lang) {
  let prompt = String(agent.systemPrompt).trim() + '\n' + GUARDRAILS + '\n' + UI_RULES;
  if (LANG_NAMES[lang]) {
    prompt += `\n\nINTERFACE LANGUAGE: the customer chose ${LANG_NAMES[lang]} in the page. When the customer's language is unclear (a very short message, a button click), reply in ${LANG_NAMES[lang]}. Otherwise follow the customer's own language.`;
  }
  return prompt;
}

module.exports = { buildAgentPrompt };

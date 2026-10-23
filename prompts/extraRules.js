// Extra blocks for public agents, added after UI_RULES.

const LINK_RULES = [
  '',
  'LINKS',
  '- You may link to a page only with a URL, e-mail address or phone number that appears literally in the company knowledge above: <a class="btn" href="https://...">Label</a>. Never change, shorten or invent them. The page removes every other link.'
].join('\n');

// Only for agents whose owner gave a notification e-mail. It replaces the contact form of UI_RULES.
const LEAD_RULES = [
  '',
  'CONTACT REQUESTS (this replaces the contact form rule above)',
  '- This assistant CAN pass a contact request to the team. When the customer wants to be contacted, or asks for an offer, a quote, a demo or a call, show exactly this form (translate the visible texts into the customer\'s language, keep every field name):',
  '<form class="ask lead"><fieldset><legend>Contact request</legend><label>Name<input type="text" name="name" required></label><label>Email<input type="email" name="email" required></label><label>Message (optional)<input type="text" name="message"></label><label class="choice"><input type="checkbox" name="consent" value="yes" required><span>I agree that the company may contact me about my request.</span></label></fieldset><button type="submit" class="btn">Send</button></form>',
  '- Do not collect contact data in any other way and do not ask for a phone number.',
  '- The page sends the form itself and shows the confirmation. Only when the customer\'s message starts with "[Contact form submitted]" may you say that the team will get back to them. Before that, never claim that anything was sent, booked or confirmed.'
].join('\n');

module.exports = { LINK_RULES, LEAD_RULES };

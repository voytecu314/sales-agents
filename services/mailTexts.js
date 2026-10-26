// Texts of everything an agent owner receives from the server: the e-mail confirmation mail, the page behind its link,
// and the contact-request notification. Language = the one the owner worked in (en, de, pl); anything else falls back to English.
const { LANGS } = require('./i18n');

const pick = (lang) => (LANGS.includes(lang) ? lang : 'en');

const VERIFICATION = {
  en: (n, link) => ({
    subject: `Confirm your e-mail for "${n}"`,
    text: `Someone (hopefully you) asked to receive contact requests of the AI sales agent "${n}" at this address.\n\nConfirm here:\n${link}\n\nIf this was not you, ignore this message. Nothing will be sent to you.`
  }),
  de: (n, link) => ({
    subject: `Bestätigen Sie Ihre E-Mail für „${n}“`,
    text: `Jemand (hoffentlich Sie) möchte unter dieser Adresse die Kontaktanfragen des KI-Verkaufsagenten „${n}“ erhalten.\n\nHier bestätigen:\n${link}\n\nWenn Sie das nicht waren, ignorieren Sie diese Nachricht. Es wird Ihnen nichts gesendet.`
  }),
  pl: (n, link) => ({
    subject: `Potwierdź swój e-mail dla „${n}”`,
    text: `Ktoś (mamy nadzieję, że Ty) poprosił o otrzymywanie zgłoszeń kontaktowych agenta sprzedaży AI „${n}” na ten adres.\n\nPotwierdź tutaj:\n${link}\n\nJeśli to nie Ty, zignoruj tę wiadomość. Nic więcej nie zostanie do Ciebie wysłane.`
  })
};

// Lead notification: the labels are in the owner's language; the visitor's language is named in it, too.
const LEAD = {
  en: {
    subject: (n) => `New contact request via ${n}`, intro: (n) => `New contact request from your AI sales agent "${n}".`,
    name: 'Name', email: 'Email', lang: "Visitor's language", message: 'Message', agent: 'Agent', convo: 'Conversation so far (latest messages)', visitor: 'Visitor', bot: 'Agent',
    footer: (to) => `You receive this because ${to} was confirmed as the contact address of this agent. The visitor agreed to be contacted.`,
    shared: 'The visitor also chose to share this conversation.',
    langs: { en: 'English', de: 'German', pl: 'Polish' }
  },
  de: {
    subject: (n) => `Neue Kontaktanfrage über ${n}`, intro: (n) => `Neue Kontaktanfrage von Ihrem KI-Verkaufsagenten „${n}“.`,
    name: 'Name', email: 'E-Mail', lang: 'Sprache des Besuchers', message: 'Nachricht', agent: 'Agent', convo: 'Bisheriges Gespräch (letzte Nachrichten)', visitor: 'Besucher', bot: 'Agent',
    footer: (to) => `Sie erhalten diese Nachricht, weil ${to} als Kontaktadresse dieses Agenten bestätigt wurde. Der Besucher hat zugestimmt, kontaktiert zu werden.`,
    shared: 'Der Besucher hat sich außerdem entschieden, dieses Gespräch weiterzugeben.',
    langs: { en: 'Englisch', de: 'Deutsch', pl: 'Polnisch' }
  },
  pl: {
    subject: (n) => `Nowe zgłoszenie kontaktowe przez ${n}`, intro: (n) => `Nowe zgłoszenie od Twojego agenta sprzedaży AI „${n}”.`,
    name: 'Imię i nazwisko', email: 'E-mail', lang: 'Język odwiedzającego', message: 'Wiadomość', agent: 'Agent', convo: 'Dotychczasowa rozmowa (ostatnie wiadomości)', visitor: 'Odwiedzający', bot: 'Agent',
    footer: (to) => `Otrzymujesz tę wiadomość, ponieważ ${to} został potwierdzony jako adres kontaktowy tego agenta. Odwiedzający wyraził zgodę na kontakt.`,
    shared: 'Odwiedzający zdecydował też o przekazaniu tej rozmowy.',
    langs: { en: 'angielski', de: 'niemiecki', pl: 'polski' }
  }
};

// "Polish (pl)" in the owner's language
const languageName = (lang, code) => `${LEAD[pick(lang)].langs[code] || code} (${code})`;

// "Visitor: ...\nAgent: ..." in the owner's language; '' when there is no conversation
function conversationText(lang, context) {
  const x = LEAD[pick(lang)];
  return (context || []).map((m) => `${m.role === 'user' ? x.visitor : x.bot}: ${m.text}`).join('\n');
}

function leadMail(lang, name, lead, agentUrl, to) {
  const x = LEAD[pick(lang)];
  const convo = conversationText(lang, lead.context);
  const text = [
    x.intro(name), '',
    `${x.name}: ${lead.name}`, `${x.email}: ${lead.email}`, `${x.lang}: ${languageName(lang, lead.lang)}`, `${x.message}: ${lead.message || '-'}`,
    ...(convo ? ['', `${x.convo}:`, convo] : []),
    '', `${x.agent}: ${agentUrl}`, '', x.footer(to) + (convo ? ' ' + x.shared : '')
  ].join('\n');
  return { subject: x.subject(name), text };
}

// Messages on the page that opens from the confirmation link
const VERIFY_PAGE = {
  en: { title: 'E-mail', ok: 'Thank you, your e-mail address is confirmed. Contact requests will now be sent to it.', invalid: 'This confirmation link is not valid.', gone: 'This address is no longer used by the agent.', unavailable: 'Service temporarily unavailable. Please try the link again in a moment.' },
  de: { title: 'E-Mail', ok: 'Vielen Dank, Ihre E-Mail-Adresse ist bestätigt. Kontaktanfragen werden jetzt an sie gesendet.', invalid: 'Dieser Bestätigungslink ist ungültig.', gone: 'Diese Adresse wird vom Agenten nicht mehr verwendet.', unavailable: 'Dienst vorübergehend nicht verfügbar. Bitte versuchen Sie den Link gleich noch einmal.' },
  pl: { title: 'E-mail', ok: 'Dziękujemy, Twój adres e-mail został potwierdzony. Zgłoszenia kontaktowe będą teraz na niego wysyłane.', invalid: 'Ten link potwierdzający jest nieprawidłowy.', gone: 'Ten adres nie jest już używany przez agenta.', unavailable: 'Usługa jest chwilowo niedostępna. Spróbuj ponownie za chwilę.' }
};

module.exports = {
  pick,
  verificationMail: (lang, name, link) => VERIFICATION[pick(lang)](name, link),
  leadMail, languageName, conversationText,
  verifyPageTexts: (lang) => VERIFY_PAGE[pick(lang)]
};

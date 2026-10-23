// Shell strings of the public agent page. Languages: detected in the browser, default English.
const LANGS = ['en', 'de', 'pl'];

const STRINGS = {
  en: {
    placeholder: 'Ask a question…',
    composerLabel: 'Your message',
    send: 'Send',
    newChat: 'New conversation',
    langLabel: 'Language',
    error: 'Something went wrong.',
    aiLabel: 'AI assistant',
    report: 'Report',
    reported: 'Thank you, we will look into it.',
    leadThanks: 'Thank you! Your request was sent. The team will get back to you.',
    leadError: 'Could not send your request.'
  },
  de: {
    placeholder: 'Stellen Sie eine Frage…',
    composerLabel: 'Ihre Nachricht',
    send: 'Senden',
    newChat: 'Neues Gespräch',
    langLabel: 'Sprache',
    error: 'Etwas ist schiefgelaufen.',
    aiLabel: 'KI-Assistent',
    report: 'Melden',
    reported: 'Danke, wir prüfen das.',
    leadThanks: 'Danke! Ihre Anfrage wurde gesendet. Das Team meldet sich bei Ihnen.',
    leadError: 'Ihre Anfrage konnte nicht gesendet werden.'
  },
  pl: {
    placeholder: 'Zadaj pytanie…',
    composerLabel: 'Twoja wiadomość',
    send: 'Wyślij',
    newChat: 'Nowa rozmowa',
    langLabel: 'Język',
    error: 'Coś poszło nie tak.',
    aiLabel: 'Asystent AI',
    report: 'Zgłoś',
    reported: 'Dziękujemy, sprawdzimy to.',
    leadThanks: 'Dziękujemy! Zgłoszenie zostało wysłane. Zespół się z Tobą skontaktuje.',
    leadError: 'Nie udało się wysłać zgłoszenia.'
  }
};

const LANG_NAMES = { en: 'English', de: 'German', pl: 'Polish' }; // used in the prompt

module.exports = { LANGS, STRINGS, LANG_NAMES };

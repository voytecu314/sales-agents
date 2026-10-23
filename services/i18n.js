// Shell strings of the public agent page. Languages: detected in the browser, default English.
const LANGS = ['en', 'de', 'pl'];

const STRINGS = {
  en: {
    placeholder: 'Ask a question…',
    composerLabel: 'Your message',
    send: 'Send',
    newChat: 'New conversation',
    langLabel: 'Language',
    error: 'Something went wrong.'
  },
  de: {
    placeholder: 'Stellen Sie eine Frage…',
    composerLabel: 'Ihre Nachricht',
    send: 'Senden',
    newChat: 'Neues Gespräch',
    langLabel: 'Sprache',
    error: 'Etwas ist schiefgelaufen.'
  },
  pl: {
    placeholder: 'Zadaj pytanie…',
    composerLabel: 'Twoja wiadomość',
    send: 'Wyślij',
    newChat: 'Nowa rozmowa',
    langLabel: 'Język',
    error: 'Coś poszło nie tak.'
  }
};

const LANG_NAMES = { en: 'English', de: 'German', pl: 'Polish' }; // used in the prompt

module.exports = { LANGS, STRINGS, LANG_NAMES };

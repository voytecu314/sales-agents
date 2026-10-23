// Shared by /create and /edit: interface language, texts and the editable agent form.
(function () {
  const LANGS = ['en', 'de', 'pl'];
  const PALETTE_KEYS = ['accent', 'accent2', 'accent3', 'bg', 'panel'];

const TEXT = {
  en: {
    copyEdit: 'Copy edit link', editLink: 'Edit page',
    rNotify: 'E-mail for contact requests (optional)', rNotifyHint: 'Visitors can ask your team to contact them. We first send a confirmation link to this address.',
    editTitle: 'Edit your AI sales agent', keyLabel: 'Owner key', keyGo: 'Open', eStatus: 'Status', sActive: 'Online', sPaused: 'Paused (visitors see "unavailable")',
    save: 'Save changes', saving: 'Saving…', saved: 'Saved.', delete: 'Delete agent', deleteConfirm: 'Delete this agent and all its contact requests? This cannot be undone.',
    leadsTitle: 'Contact requests', leadsHint: 'The last 50 requests. They are deleted automatically after 90 days.', noLeads: 'No requests yet.',
    usage: 'Messages today: {n} of {cap}', verifyPending: 'Not confirmed yet: open the link we sent to this address. Until then requests are only stored here, not e-mailed.',
    verifyOk: 'Address confirmed. New requests are e-mailed to it.', verifySent: 'Saved. We sent a confirmation link to the new address.', authError: 'This owner key is not valid.',
    title: 'Create your AI sales agent', subtitle: 'Describe your company. You get a sales agent on its own link.',
    fName: 'Company name *', fOffer: 'What do you sell? *', fPricing: 'Offer and prices', fAudience: 'Target audience',
    fTone: 'Tone of voice', phTone: 'friendly, professional, short answers…', fLanguage: 'Main language of your customers', auto: 'Detect automatically',
    fColors: 'Brand colors', phColors: 'e.g. navy blue and orange, or #1d4ed8',
    fFaqs: 'FAQs', fRules: 'Rules and limits (what the agent must never promise or say)', fContact: 'Contact options',
    generate: 'Generate my agent', generating: 'Generating… this can take up to a minute',
    reviewHint: 'Review everything. You can change all texts, colors and the instructions of your agent.',
    rName: 'Display name', rEmoji: 'Emoji', rColors: 'Colors', cBg: 'Background', cPanel: 'Panels',
    rTexts: 'Texts for visitors', rEditing: 'Language you are editing', rTagline: 'Tagline', rWelcome: 'Welcome message',
    qLabel: 'Button text', qSend: 'Message sent on click',
    rPrompt: 'Instructions of your agent (visitors never see this)', back: 'Back', publish: 'Publish my agent', publishing: 'Publishing…',
    doneTitle: 'Your agent is live', doneLink: 'Public link',
    doneKeyHint: 'This is your private owner key. It is shown only once and cannot be recovered. Save it now; you will need it to edit your agent.',
    copyUrl: 'Copy link', copyKey: 'Copy key', copied: 'Copied', open: 'Open agent', errGeneric: 'Something went wrong. Please try again.'
  },
  de: {
    copyEdit: 'Bearbeitungslink kopieren', editLink: 'Bearbeiten',
    rNotify: 'E-Mail für Kontaktanfragen (optional)', rNotifyHint: 'Besucher können Ihr Team um Kontakt bitten. An diese Adresse senden wir zuerst einen Bestätigungslink.',
    editTitle: 'KI-Verkaufsagenten bearbeiten', keyLabel: 'Besitzer-Schlüssel', keyGo: 'Öffnen', eStatus: 'Status', sActive: 'Online', sPaused: 'Pausiert (Besucher sehen „nicht verfügbar“)',
    save: 'Änderungen speichern', saving: 'Wird gespeichert…', saved: 'Gespeichert.', delete: 'Agenten löschen', deleteConfirm: 'Diesen Agenten und alle Kontaktanfragen löschen? Das lässt sich nicht rückgängig machen.',
    leadsTitle: 'Kontaktanfragen', leadsHint: 'Die letzten 50 Anfragen. Sie werden nach 90 Tagen automatisch gelöscht.', noLeads: 'Noch keine Anfragen.',
    usage: 'Nachrichten heute: {n} von {cap}', verifyPending: 'Noch nicht bestätigt: Öffnen Sie den Link, den wir an diese Adresse gesendet haben. Bis dahin werden Anfragen nur hier gespeichert, nicht per E-Mail verschickt.',
    verifyOk: 'Adresse bestätigt. Neue Anfragen werden per E-Mail an sie gesendet.', verifySent: 'Gespeichert. Wir haben einen Bestätigungslink an die neue Adresse gesendet.', authError: 'Dieser Besitzer-Schlüssel ist ungültig.',
    title: 'Erstellen Sie Ihren KI-Verkaufsagenten', subtitle: 'Beschreiben Sie Ihr Unternehmen. Sie erhalten einen Verkaufsagenten unter eigenem Link.',
    fName: 'Firmenname *', fOffer: 'Was verkaufen Sie? *', fPricing: 'Angebot und Preise', fAudience: 'Zielgruppe',
    fTone: 'Tonalität', phTone: 'freundlich, professionell, kurze Antworten…', fLanguage: 'Hauptsprache Ihrer Kunden', auto: 'Automatisch erkennen',
    fColors: 'Markenfarben', phColors: 'z. B. Marineblau und Orange oder #1d4ed8',
    fFaqs: 'FAQs', fRules: 'Regeln und Grenzen (was der Agent nie versprechen oder sagen darf)', fContact: 'Kontaktmöglichkeiten',
    generate: 'Meinen Agenten erstellen', generating: 'Wird erstellt… das kann bis zu einer Minute dauern',
    reviewHint: 'Prüfen Sie alles. Sie können alle Texte, Farben und die Anweisungen Ihres Agenten ändern.',
    rName: 'Anzeigename', rEmoji: 'Emoji', rColors: 'Farben', cBg: 'Hintergrund', cPanel: 'Flächen',
    rTexts: 'Texte für Besucher', rEditing: 'Sprache, die Sie bearbeiten', rTagline: 'Slogan', rWelcome: 'Begrüßung',
    qLabel: 'Button-Text', qSend: 'Nachricht beim Klick',
    rPrompt: 'Anweisungen Ihres Agenten (Besucher sehen diese nie)', back: 'Zurück', publish: 'Agenten veröffentlichen', publishing: 'Wird veröffentlicht…',
    doneTitle: 'Ihr Agent ist online', doneLink: 'Öffentlicher Link',
    doneKeyHint: 'Das ist Ihr privater Besitzer-Schlüssel. Er wird nur einmal angezeigt und kann nicht wiederhergestellt werden. Speichern Sie ihn jetzt; Sie brauchen ihn zum Bearbeiten.',
    copyUrl: 'Link kopieren', copyKey: 'Schlüssel kopieren', copied: 'Kopiert', open: 'Agenten öffnen', errGeneric: 'Etwas ist schiefgelaufen. Bitte versuchen Sie es erneut.'
  },
  pl: {
    copyEdit: 'Kopiuj link edycji', editLink: 'Strona edycji',
    rNotify: 'E-mail do zgłoszeń kontaktowych (opcjonalnie)', rNotifyHint: 'Odwiedzający mogą poprosić Twój zespół o kontakt. Najpierw wyślemy na ten adres link potwierdzający.',
    editTitle: 'Edytuj agenta sprzedaży AI', keyLabel: 'Klucz właściciela', keyGo: 'Otwórz', eStatus: 'Status', sActive: 'Online', sPaused: 'Wstrzymany (odwiedzający widzą „niedostępny”)',
    save: 'Zapisz zmiany', saving: 'Zapisywanie…', saved: 'Zapisano.', delete: 'Usuń agenta', deleteConfirm: 'Usunąć tego agenta i wszystkie zgłoszenia kontaktowe? Tego nie da się cofnąć.',
    leadsTitle: 'Zgłoszenia kontaktowe', leadsHint: 'Ostatnie 50 zgłoszeń. Po 90 dniach są usuwane automatycznie.', noLeads: 'Brak zgłoszeń.',
    usage: 'Wiadomości dzisiaj: {n} z {cap}', verifyPending: 'Jeszcze niepotwierdzony: otwórz link wysłany na ten adres. Do tego czasu zgłoszenia są tylko zapisywane tutaj, bez wysyłki e-mailem.',
    verifyOk: 'Adres potwierdzony. Nowe zgłoszenia są wysyłane na ten adres.', verifySent: 'Zapisano. Wysłaliśmy link potwierdzający na nowy adres.', authError: 'Ten klucz właściciela jest nieprawidłowy.',
    title: 'Stwórz swojego agenta sprzedaży AI', subtitle: 'Opisz swoją firmę. Dostaniesz agenta sprzedaży pod własnym linkiem.',
    fName: 'Nazwa firmy *', fOffer: 'Co sprzedajesz? *', fPricing: 'Oferta i ceny', fAudience: 'Grupa docelowa',
    fTone: 'Styl komunikacji', phTone: 'przyjazny, profesjonalny, krótkie odpowiedzi…', fLanguage: 'Główny język Twoich klientów', auto: 'Wykryj automatycznie',
    fColors: 'Kolory marki', phColors: 'np. granatowy i pomarańczowy lub #1d4ed8',
    fFaqs: 'FAQ', fRules: 'Zasady i ograniczenia (czego agent nigdy nie może obiecywać ani mówić)', fContact: 'Formy kontaktu',
    generate: 'Wygeneruj mojego agenta', generating: 'Generowanie… może potrwać do minuty',
    reviewHint: 'Sprawdź wszystko. Możesz zmienić wszystkie teksty, kolory i instrukcje agenta.',
    rName: 'Wyświetlana nazwa', rEmoji: 'Emoji', rColors: 'Kolory', cBg: 'Tło', cPanel: 'Panele',
    rTexts: 'Teksty dla odwiedzających', rEditing: 'Edytowany język', rTagline: 'Hasło', rWelcome: 'Wiadomość powitalna',
    qLabel: 'Tekst przycisku', qSend: 'Wiadomość wysyłana po kliknięciu',
    rPrompt: 'Instrukcje agenta (odwiedzający ich nie widzą)', back: 'Wstecz', publish: 'Opublikuj agenta', publishing: 'Publikowanie…',
    doneTitle: 'Twój agent jest online', doneLink: 'Publiczny link',
    doneKeyHint: 'To Twój prywatny klucz właściciela. Jest pokazany tylko raz i nie da się go odzyskać. Zapisz go teraz; będzie potrzebny do edycji agenta.',
    copyUrl: 'Kopiuj link', copyKey: 'Kopiuj klucz', copied: 'Skopiowano', open: 'Otwórz agenta', errGeneric: 'Coś poszło nie tak. Spróbuj ponownie.'
  }
};

  const $ = (id) => document.getElementById(id);
  let draft = null;
  let editing = 'en'; // locale currently shown in the form

  /* ---------- interface language: ?lang > saved > browser > English ---------- */
  function pickLang() {
    const q = new URLSearchParams(location.search).get('lang');
    if (LANGS.includes(q)) return q;
    try { const s = localStorage.getItem('sa_lang'); if (LANGS.includes(s)) return s; } catch { /* storage blocked */ }
    for (const l of navigator.languages || [navigator.language]) {
      const c = String(l || '').slice(0, 2).toLowerCase();
      if (LANGS.includes(c)) return c;
    }
    return 'en';
  }
  let ui = pickLang();
  const t = (k) => TEXT[ui][k] ?? TEXT.en[k];
  const listeners = [];

  function applyUi() {
    document.documentElement.lang = ui;
    document.title = t($('edit-form') ? 'editTitle' : 'title');
    document.querySelectorAll('[data-i18n]').forEach((el) => { el.textContent = t(el.dataset.i18n); });
    document.querySelectorAll('[data-i18n-ph]').forEach((el) => { el.placeholder = t(el.dataset.i18nPh); });
    $('ui-lang').value = ui;
    if (draft) renderQuickReplies();
    listeners.forEach((fn) => fn());
  }
  $('ui-lang').addEventListener('change', (e) => {
    if (!LANGS.includes(e.target.value)) return;
    ui = e.target.value;
    try { localStorage.setItem('sa_lang', ui); } catch { /* storage blocked */ }
    applyUi();
  });

  /* ---------- helpers ---------- */
  function showError(msg) { const b = $('error'); b.textContent = msg; b.hidden = !msg; }
  function showNotice(msg) { const b = $('notice'); if (b) { b.textContent = msg; b.hidden = !msg; } }
  async function request(method, url, body, headers = {}) {
    const res = await fetch(url, {
      method, headers: { 'Content-Type': 'application/json', ...headers }, body: body === undefined ? undefined : JSON.stringify(body)
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) { const err = new Error(data.error || t('errGeneric')); err.status = res.status; throw err; }
    return data;
  }

  /* ---------- the editable agent form ---------- */
  function fill(d) {
    draft = d;
    editing = LANGS.includes(ui) ? ui : 'en';
    $('r-name').value = d.name;
    $('r-emoji').value = d.emoji;
    $('r-notify').value = d.notifyEmail || '';
    for (const k of PALETTE_KEYS) $('c-' + k).value = d.palette[k];
    $('r-prompt').value = d.systemPrompt;
    $('r-locale').value = editing;
    loadLocale();
  }

  function loadLocale() {
    const loc = draft.locales[editing];
    $('r-tagline').value = loc.tagline;
    $('r-welcome').value = loc.welcome;
    renderQuickReplies();
  }

  function renderQuickReplies() {
    const box = $('r-qr');
    box.replaceChildren();
    draft.locales[editing].quickReplies.forEach((q, i) => {
      const row = document.createElement('div');
      row.className = 'two';
      for (const [field, labelKey, max] of [['label', 'qLabel', 40], ['send', 'qSend', 200]]) {
        const label = document.createElement('label');
        const span = document.createElement('span');
        span.textContent = t(labelKey);
        const input = document.createElement('input');
        input.type = 'text'; input.maxLength = max; input.value = q[field];
        input.dataset.i = i; input.dataset.field = field;
        label.append(span, input);
        row.append(label);
      }
      box.append(row);
    });
  }

  function collectLocale() {
    const loc = draft.locales[editing];
    loc.tagline = $('r-tagline').value;
    loc.welcome = $('r-welcome').value;
    $('r-qr').querySelectorAll('input').forEach((inp) => { loc.quickReplies[Number(inp.dataset.i)][inp.dataset.field] = inp.value; });
  }

  $('r-locale').addEventListener('change', (e) => {
    if (!LANGS.includes(e.target.value) || !draft) return;
    collectLocale();
    editing = e.target.value;
    loadLocale();
  });

  function collect() {
    collectLocale();
    draft.name = $('r-name').value;
    draft.emoji = $('r-emoji').value;
    draft.notifyEmail = $('r-notify').value;
    draft.systemPrompt = $('r-prompt').value;
    for (const k of PALETTE_KEYS) draft.palette[k] = $('c-' + k).value;
    return draft;
  }

  window.AgentForm = { t, $, fill, collect, applyUi, request, showError, showNotice, onUiChange: (fn) => listeners.push(fn) };
})();

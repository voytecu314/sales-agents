// Onboarding: describe company -> review generated agent -> publish.
const LANGS = ['en', 'de', 'pl'];
const PALETTE_KEYS = ['accent', 'accent2', 'accent3', 'bg', 'panel'];

const TEXT = {
  en: {
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
const errorBox = $('error');
let draft = null;
let editing = 'en'; // locale currently shown in the review form

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

function applyUi() {
  document.documentElement.lang = ui;
  document.title = t('title');
  document.querySelectorAll('[data-i18n]').forEach((el) => { el.textContent = t(el.dataset.i18n); });
  document.querySelectorAll('[data-i18n-ph]').forEach((el) => { el.placeholder = t(el.dataset.i18nPh); });
  $('ui-lang').value = ui;
  if (draft) renderQuickReplies(); // labels inside the review form
}
$('ui-lang').addEventListener('change', (e) => {
  if (!LANGS.includes(e.target.value)) return;
  ui = e.target.value;
  try { localStorage.setItem('sa_lang', ui); } catch { /* storage blocked */ }
  applyUi();
});

/* ---------- helpers ---------- */
function showError(msg) { errorBox.textContent = msg; errorBox.hidden = !msg; }
function show(step) {
  for (const id of ['step-describe', 'step-review', 'step-done']) $(id).hidden = id !== step;
  window.scrollTo({ top: 0, behavior: 'smooth' });
}
async function post(url, body) {
  const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || t('errGeneric'));
  return data;
}

/* ---------- step 1: generate ---------- */
$('step-describe').addEventListener('submit', async (e) => {
  e.preventDefault();
  showError('');
  const btn = $('generate');
  btn.disabled = true; btn.textContent = t('generating');
  try {
    const company = Object.fromEntries(new FormData(e.target).entries());
    const data = await post('/api/agents/generate', { company });
    draft = data.agent;
    editing = LANGS.includes(ui) ? ui : 'en';
    fillReview();
    show('step-review');
  } catch (err) {
    showError(err.message);
  } finally {
    btn.disabled = false; btn.textContent = t('generate');
  }
});

/* ---------- step 2: review ---------- */
function fillReview() {
  $('r-name').value = draft.name;
  $('r-emoji').value = draft.emoji;
  for (const k of PALETTE_KEYS) $('c-' + k).value = draft.palette[k];
  $('r-prompt').value = draft.systemPrompt;
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
  if (!LANGS.includes(e.target.value)) return;
  collectLocale();
  editing = e.target.value;
  loadLocale();
});

$('back').addEventListener('click', () => { showError(''); show('step-describe'); });

$('step-review').addEventListener('submit', async (e) => {
  e.preventDefault();
  showError('');
  collectLocale();
  draft.name = $('r-name').value;
  draft.emoji = $('r-emoji').value;
  draft.systemPrompt = $('r-prompt').value;
  for (const k of PALETTE_KEYS) draft.palette[k] = $('c-' + k).value;

  const btn = $('publish');
  btn.disabled = true; btn.textContent = t('publishing');
  try {
    const out = await post('/api/agents', { agent: draft });
    $('d-url').textContent = out.url;
    $('d-url').href = out.url;
    $('d-open').href = out.url;
    $('d-key').value = out.editToken;
    show('step-done');
  } catch (err) {
    showError(err.message);
  } finally {
    btn.disabled = false; btn.textContent = t('publish');
  }
});

/* ---------- step 3 ---------- */
async function copy(text, btn) {
  try {
    await navigator.clipboard.writeText(text);
    const old = btn.textContent;
    btn.textContent = t('copied');
    setTimeout(() => { btn.textContent = old; }, 1500);
  } catch { $('d-key').select(); }
}
$('copy-url').addEventListener('click', (e) => copy($('d-url').textContent, e.target));
$('copy-key').addEventListener('click', (e) => copy($('d-key').value, e.target));

applyUi();

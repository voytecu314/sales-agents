const feed = document.getElementById('feed');
const composer = document.getElementById('composer');
const input = document.getElementById('prompt');
const button = document.getElementById('send');

const REVEAL = '.hero, .bubble, .card, .price-card, .stat, .callout, .step, .progress, .donut, .quote, .table-wrap, details, svg.chart, form.ask, .quick-row, .row';

// The browser owns the conversation: it keeps the history and sends it with every request.
// The server keeps nothing. Assistant turns are stored as the compact text the server returns.
const MAX_HISTORY = 20;
let history = [];   // [{ role: 'user' | 'assistant', content: string }]
let epoch = 0;      // bumped on reset, so a reply that arrives after "new conversation" is not stored
let busy = false;

/* ---------- agent mode ----------
 * On /a/:slug the server embeds the agent's public config (name, colors, texts per language).
 * Without it (the demo page at /) everything behaves as before. */
const LANGS = ['en', 'de', 'pl'];
const cfgEl = document.getElementById('agent-config');
const AGENT = cfgEl ? JSON.parse(cfgEl.textContent) : null;
const CHAT_URL = AGENT ? `/api/agents/${encodeURIComponent(AGENT.slug)}/chat` : '/api/chat';
let lang = AGENT ? pickLang() : null;

// Language: ?lang=de  >  the visitor's earlier choice  >  browser language  >  English
function pickLang() {
  const q = new URLSearchParams(location.search).get('lang');
  if (LANGS.includes(q)) return q;
  try { const saved = localStorage.getItem('sa_lang'); if (LANGS.includes(saved)) return saved; } catch { /* storage blocked */ }
  for (const l of navigator.languages || [navigator.language]) {
    const code = String(l || '').slice(0, 2).toLowerCase();
    if (LANGS.includes(code)) return code;
  }
  return 'en';
}

const t = (key) => (AGENT ? (AGENT.strings[lang]?.[key] ?? AGENT.strings.en[key]) : 'Coś poszło nie tak.');

function applyLang() {
  const loc = AGENT.locales[lang] || AGENT.locales.en;
  document.documentElement.lang = lang;
  document.title = loc.tagline ? `${AGENT.name} | ${loc.tagline}` : AGENT.name;
  document.getElementById('tagline').textContent = loc.tagline;
  input.placeholder = t('placeholder');
  input.setAttribute('aria-label', t('composerLabel'));
  button.textContent = t('send');
  document.getElementById('reset').textContent = t('newChat');
  document.getElementById('lang').setAttribute('aria-label', t('langLabel'));
  document.getElementById('foot-ai').textContent = t('aiLabel');
  const rb = document.getElementById('report');
  rb.textContent = t(rb.dataset.sent ? 'reported' : 'report');
  document.getElementById('lang').value = lang;
  // swap the welcome message only while the conversation has not started
  if (!history.length && !feed.querySelector('.you')) { feed.innerHTML = ''; showWelcome(); }
}

if (AGENT) {
  document.getElementById('report').addEventListener('click', async (e) => {
    const b = e.currentTarget;
    if (b.dataset.sent) return;
    try {
      const res = await fetch(`/api/agents/${encodeURIComponent(AGENT.slug)}/report`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' });
      if (!res.ok) throw new Error();
      b.dataset.sent = '1';
      b.textContent = t('reported');
    } catch { /* try again later */ }
  });
  document.getElementById('lang').addEventListener('change', (e) => {
    if (!LANGS.includes(e.target.value)) return;
    lang = e.target.value;
    try { localStorage.setItem('sa_lang', lang); } catch { /* storage blocked */ }
    applyLang();
  });
  applyLang(); // also renders the welcome message
} else {
  showWelcome();
}

/* ---------- composer ---------- */
composer.addEventListener('submit', (e) => {
  e.preventDefault();
  const text = input.value.trim();
  if (!text) return;
  input.value = '';
  autosize();
  send(text);
});
// Enter sends, Shift+Enter adds a new line
input.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); composer.requestSubmit(); }
});
input.addEventListener('input', autosize);
function autosize() { input.style.height = 'auto'; input.style.height = Math.min(input.scrollHeight, 180) + 'px'; }

document.getElementById('reset').addEventListener('click', () => {
  history = [];
  epoch++;
  feed.innerHTML = '';
  showWelcome();
});

/* ---------- interactive elements inside AI replies (event delegation) ---------- */
// 1) forms the AI generated: radios, checkboxes, selects, text fields, sliders
document.addEventListener('submit', (e) => {
  const f = e.target.closest?.('form.ask');
  if (!f) return;
  e.preventDefault();
  if (AGENT && f.classList.contains('lead')) { sendLead(f); return; } // contact form: goes to the team, not to the AI
  if (busy || f.dataset.done) return;
  const text = describeForm(f);
  if (!text) return;
  lockForm(f, true);
  send(text, () => lockForm(f, false)); // unlock again if the request fails
});

// Contact request: the page posts it to the server itself. The AI never sees the contact data,
// and the confirmation below is only shown after the server really stored the request.
let pendingNote = ''; // tells the AI (in the next message) that the form was submitted
async function sendLead(f) {
  if (f.dataset.done || !f.reportValidity()) return;
  const fd = new FormData(f);
  const body = {
    name: fd.get('name') || '', email: fd.get('email') || '', message: fd.get('message') || '',
    consent: fd.get('consent') === 'yes', website: fd.get('website') || '', lang
  };
  f.nextElementSibling?.classList.contains('lead-error') && f.nextElementSibling.remove();
  lockForm(f, true);
  try {
    const res = await fetch(`/api/agents/${encodeURIComponent(AGENT.slug)}/lead`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body)
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || t('leadError'));
    const ok = document.createElement('div');
    ok.className = 'callout success';
    ok.textContent = t('leadThanks');
    f.replaceWith(ok);
    pendingNote = '[Contact form submitted] The customer sent the contact form to the team.';
  } catch (err) {
    lockForm(f, false);
    const box = document.createElement('div');
    box.className = 'callout danger lead-error';
    box.textContent = err.message || t('leadError');
    f.after(box);
  }
}

// Spam trap: a field real visitors never see. Bots that fill every input reveal themselves.
function addHoneypots(root) {
  root.querySelectorAll('form.lead:not([data-hp])').forEach((f) => {
    const hp = document.createElement('input');
    hp.type = 'text'; hp.name = 'website'; hp.className = 'hp'; hp.tabIndex = -1;
    hp.autocomplete = 'off'; hp.setAttribute('aria-hidden', 'true');
    f.append(hp);
    f.dataset.hp = '1';
  });
}

// 2) quick-reply buttons: send their data-send text as the customer's message
document.addEventListener('click', (e) => {
  const q = e.target.closest?.('[data-send]');
  if (!q || busy) return;
  send(q.dataset.send);
});

// "Team size: 5-10; Main goal: Leads, Support"
function describeForm(f) {
  const groups = new Map();
  for (const [name, value] of new FormData(f).entries()) {
    let v = String(value).trim();
    if (!v) continue;
    if (v === 'on') v = 'yes';
    if (!groups.has(name)) groups.set(name, []);
    groups.get(name).push(v);
  }
  return [...groups].map(([name, values]) => `${name}: ${values.join(', ')}`).join('; ');
}

function lockForm(f, locked) {
  f.classList.toggle('answered', locked);
  if (locked) f.dataset.done = '1'; else delete f.dataset.done;
  f.querySelectorAll('input, select, textarea, button').forEach((el) => { el.disabled = locked; });
}

/* ---------- sending ---------- */
async function send(prompt, onFail) {
  if (busy) return;
  busy = true;
  button.disabled = true;

  const turn = document.createElement('article');
  turn.className = 'turn';
  turn.innerHTML = '<p class="you"></p><div class="gen"><div class="sk"></div><div class="sk"></div></div>';
  turn.querySelector('.you').textContent = prompt; // textContent: never parsed as HTML
  feed.append(turn);
  turn.scrollIntoView({ behavior: 'smooth', block: 'start' });
  const gen = turn.querySelector('.gen');
  const myEpoch = epoch;
  const content = pendingNote ? `${pendingNote}\n${prompt}` : prompt; // what the AI receives; the bubble shows only `prompt`

  try {
    const res = await fetch(CHAT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: [...history.slice(-MAX_HISTORY), { role: 'user', content }], lang: lang || undefined })
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);

    // remember the exchange only after it succeeded, so a failed request leaves the history untouched
    if (myEpoch === epoch) {
      history.push({ role: 'user', content }, { role: 'assistant', content: data.text || '(visual reply)' });
      pendingNote = '';
      history = history.slice(-MAX_HISTORY);
    }

    gen.innerHTML = data.html; // AI-generated HTML goes in here
    enhance(gen);
  } catch (err) {
    gen.innerHTML = '';
    const box = document.createElement('div');
    box.className = 'callout danger';
    const strong = document.createElement('strong');
    strong.textContent = t('error');
    box.append(strong, ' ', err.message);
    gen.append(box);
    enhance(gen);
    onFail?.();
  } finally {
    busy = false;
    button.disabled = false;
    input.focus({ preventScroll: true });
  }
}

function showWelcome() {
  if (AGENT) return showAgentWelcome();
  const node = document.getElementById('welcome-tpl').content.cloneNode(true);
  feed.append(node);
  enhance(feed);
}

// Welcome bubble + quick replies of the agent. Built with textContent: owner text is never parsed as HTML.
function showAgentWelcome() {
  const loc = AGENT.locales[lang] || AGENT.locales.en;
  const turn = document.createElement('article');
  turn.className = 'turn';
  const gen = document.createElement('div');
  gen.className = 'gen';

  const bubble = document.createElement('div');
  bubble.className = 'bubble';
  const p = document.createElement('p');
  p.textContent = loc.welcome;
  bubble.append(p);
  gen.append(bubble);

  const row = document.createElement('div');
  row.className = 'quick-row';
  for (const q of loc.quickReplies) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'quick';
    b.dataset.send = q.send;
    b.textContent = q.label;
    row.append(b);
  }
  gen.append(row);
  turn.append(gen);
  feed.append(turn);
  enhance(feed);
}

/* ---------- staggered reveal, count-up numbers, bars, donuts, sliders ---------- */
function enhance(root) {
  addHoneypots(root);
  const io = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (!en.isIntersecting) return;
      en.target.classList.add('in');
      en.target.querySelectorAll('[data-count]').forEach(countUp);
      if (en.target.matches('[data-count]')) countUp(en.target);
      io.unobserve(en.target);
    });
  }, { threshold: 0.12 });

  root.querySelectorAll(REVEAL).forEach((el, i) => {
    if (el.classList.contains('rv')) return; // already handled
    el.classList.add('rv');
    el.style.setProperty('--i', Math.min(i, 8));
    io.observe(el);
  });

  // live value next to range sliders
  root.querySelectorAll('input[type=range]').forEach((r) => {
    let out = r.parentElement.querySelector('output');
    if (!out) out = r.insertAdjacentElement('afterend', document.createElement('output'));
    const update = () => { out.textContent = r.value; };
    r.addEventListener('input', update);
    update();
  });
}

function countUp(el) {
  if (el.dataset.done) return;
  el.dataset.done = '1';
  const target = parseFloat(el.dataset.count);
  if (Number.isNaN(target)) return;
  const decimals = parseInt(el.dataset.decimals || '0', 10);
  const prefix = el.dataset.prefix || '';
  const suffix = el.dataset.suffix || '';
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const start = performance.now(), duration = reduce ? 0 : 1300;

  (function tick(now) {
    const t = duration ? Math.min((now - start) / duration, 1) : 1;
    const eased = 1 - Math.pow(1 - t, 3);
    el.textContent = prefix + (target * eased).toLocaleString(undefined, {
      minimumFractionDigits: decimals, maximumFractionDigits: decimals
    }) + suffix;
    if (t < 1) requestAnimationFrame(tick);
  })(start);
}
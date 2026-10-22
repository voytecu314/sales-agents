const feed = document.getElementById('feed');
const composer = document.getElementById('composer');
const input = document.getElementById('prompt');
const button = document.getElementById('send');

const REVEAL = '.hero, .bubble, .card, .price-card, .stat, .callout, .step, .progress, .donut, .quote, .table-wrap, details, svg.chart, form.ask, .quick-row, .row';

let sessionId = crypto.randomUUID(); // a reload starts a fresh conversation (server memory is per session)
let busy = false;

showWelcome();

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
  fetch('/api/reset', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sessionId }) }).catch(() => {});
  sessionId = crypto.randomUUID();
  feed.innerHTML = '';
  showWelcome();
});

/* ---------- interactive elements inside AI replies (event delegation) ---------- */
// 1) forms the AI generated: radios, checkboxes, selects, text fields, sliders
document.addEventListener('submit', (e) => {
  const f = e.target.closest?.('form.ask');
  if (!f) return;
  e.preventDefault();
  if (busy || f.dataset.done) return;
  const text = describeForm(f);
  if (!text) return;
  lockForm(f, true);
  send(text, () => lockForm(f, false)); // unlock again if the request fails
});

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

  try {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, sessionId })
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);

    gen.innerHTML = data.html; // AI-generated HTML goes in here
    enhance(gen);
  } catch (err) {
    gen.innerHTML = '';
    const box = document.createElement('div');
    box.className = 'callout danger';
    box.innerHTML = '<strong>Coś poszło nie tak.</strong> ';
    box.append(err.message);
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
  const node = document.getElementById('welcome-tpl').content.cloneNode(true);
  feed.append(node);
  enhance(feed);
}

/* ---------- staggered reveal, count-up numbers, bars, donuts, sliders ---------- */
function enhance(root) {
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
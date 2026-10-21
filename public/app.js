const form = document.getElementById('composer');
const input = document.getElementById('prompt');
const button = document.getElementById('send');
const feed = document.getElementById('feed');

const REVEAL = '.hero, .card, .stat, .callout, .step, .progress, .donut, .quote, .table-wrap, details, svg.chart, .row';

form.addEventListener('submit', (e) => { e.preventDefault(); send(input.value.trim()); });

// Ctrl/Cmd + Enter sends, Enter alone adds a new line
input.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); send(input.value.trim()); }
});

document.getElementById('chips').addEventListener('click', (e) => {
  const prompt = e.target.dataset?.prompt;
  if (prompt) { input.value = prompt; send(prompt); }
});

async function send(prompt) {
  if (!prompt || button.disabled) return;
  button.disabled = true;
  input.value = '';

  const turn = document.createElement('article');
  turn.className = 'turn';
  turn.innerHTML = '<p class="you"></p><div class="gen"><div class="sk tall"></div><div class="sk"></div><div class="sk"></div></div>';
  turn.querySelector('.you').textContent = prompt; // textContent: user input is never parsed as HTML
  feed.prepend(turn);                              // newest answer on top
  const gen = turn.querySelector('.gen');

  try {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt })
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);

    gen.innerHTML = data.html;   // the AI-generated HTML goes in here
    enhance(gen);
  } catch (err) {
    gen.innerHTML = '';
    const box = document.createElement('div');
    box.className = 'callout danger';
    box.innerHTML = '<strong>Something went wrong.</strong> ';
    box.append(err.message);
    gen.append(box);
    enhance(gen);
  } finally {
    button.disabled = false;
    input.focus();
  }
}

/* Staggered reveal, count-up numbers, bars and donuts that fill when visible */
function enhance(root) {
  const io = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (!en.isIntersecting) return;
      en.target.classList.add('in');
      en.target.querySelectorAll('[data-count]').forEach(countUp);
      if (en.target.matches('[data-count]')) countUp(en.target);
      io.unobserve(en.target);
    });
  }, { threshold: 0.15 });

  root.querySelectorAll(REVEAL).forEach((el, i) => {
    el.classList.add('rv');
    el.style.setProperty('--i', Math.min(i, 10));
    io.observe(el);
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
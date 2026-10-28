// Owner page: /edit/:slug#<owner key>. The key is read from the URL fragment (never sent to the server
// in the address), moved to sessionStorage for this tab, and sent as a Bearer header.
const { t, getUi, $, fill, collect, applyUi, request, showError, showNotice, onUiChange, getInputs, setInputs, syncLogo, hasLogoChange } = window.AgentForm;

const slug = location.pathname.split('/')[2] || '';
const STORE_KEY = 'sa_owner_' + slug;
let token = '';
let data = null;

try {
  const fromUrl = decodeURIComponent(location.hash.slice(1));
  if (fromUrl) { sessionStorage.setItem(STORE_KEY, fromUrl); history.replaceState(null, '', location.pathname); }
  token = sessionStorage.getItem(STORE_KEY) || '';
} catch { token = decodeURIComponent(location.hash.slice(1)); }

const auth = () => ({ Authorization: 'Bearer ' + token });
const api = (method, body) => request(method, `/api/agents/${encodeURIComponent(slug)}` + (method === 'GET' ? '/owner' : ''), body, auth());

function renderMeta() {
  if (!data) return;
  $('e-usage').textContent = t('usage').replace('{n}', data.usage.today).replace('{cap}', data.usage.cap);
  const a = data.agent;
  $('e-verify').textContent = !a.notifyEmail ? '' : a.notifyEmailVerified ? t('verifyOk') : t('verifyPending');
  $('e-verify').hidden = !a.notifyEmail;
  $('e-expiry').textContent = t('expiresOn').replace('{date}', new Date(data.keyExpiresAt).toLocaleDateString());
  const note = $('support-note'), mail = note.dataset.support;
  note.textContent = mail ? t('supportNote').replace('{email}', mail) : t('supportNone');
}

function showSupport() {
  const mail = $('support-note').dataset.support;
  $('support-note').textContent = mail ? t('supportNote').replace('{email}', mail) : t('supportNone');
}

// link builder: <agent url>?ask=<topic>
function updateLink() {
  if (!data) return;
  const topic = $('l-topic').value.trim().slice(0, 300);
  $('l-url').value = topic ? `${data.url}?ask=${encodeURIComponent(topic)}` : data.url;
}
$('l-topic').addEventListener('input', updateLink);
$('l-copy').addEventListener('click', async (e) => {
  try { await navigator.clipboard.writeText($('l-url').value); const old = e.target.textContent; e.target.textContent = t('copied'); setTimeout(() => { e.target.textContent = old; }, 1500); }
  catch { $('l-url').select(); }
});

function renderLeads() {
  const box = $('leads');
  box.replaceChildren();
  if (!data.leads.length) { const p = document.createElement('p'); p.className = 'hint'; p.textContent = t('noLeads'); box.append(p); return; }
  for (const l of data.leads) { // textContent only: visitor input is never parsed as HTML
    const card = document.createElement('div');
    card.className = 'lead-item';
    const head = document.createElement('strong');
    head.textContent = `${l.name} · ${l.email}`;
    const when = document.createElement('small');
    when.textContent = new Date(l.createdAt).toLocaleString();
    const msg = document.createElement('p');
    msg.textContent = l.message || '';
    card.append(head, when, msg);
    if (l.context?.length) { // the chat before the request, as text only
      const d = document.createElement('details');
      const sum = document.createElement('summary');
      sum.textContent = t('leadConvo');
      const body = document.createElement('p');
      body.textContent = l.context.map((m) => `${m.role === 'user' ? t('leadVisitor') : t('leadAgent')}: ${m.text}`).join('\n');
      d.append(sum, body);
      card.append(d);
    }
    box.append(card);
  }
}

async function load() {
  showError('');
  try {
    data = await api('GET');
    fill(data.agent);
    setInputs($('inputs-box'), data.inputs);
    $('e-status').value = data.agent.status;
    $('visitor-daily-limit').value = data.agent.visitorDailyLimit ?? '';
    renderProviderKeys();
    if (providerResult === 'connected') showNotice(t('providerOAuthConnected'));
    else if (providerResult === 'cancelled') showNotice(t('providerOAuthCancelled'));
    else if (providerResult === 'failed') showError(t('providerOAuthFailed'));
    $('e-url').textContent = data.url;
    $('e-url').href = data.url;
    $('key-form').hidden = true;
    $('edit-form').hidden = false;
    $('leads-box').hidden = false;
    $('provider-keys-box').hidden = false;
    $('link-box').hidden = false;
    updateLink();
    renderMeta();
    renderLeads();
  } catch (err) {
    $('edit-form').hidden = true;
    $('leads-box').hidden = true;
    $('provider-keys-box').hidden = true;
    $('link-box').hidden = true;
    $('key-form').hidden = false;
    showSupport();
    try { sessionStorage.removeItem(STORE_KEY); } catch { /* storage blocked */ }
    showError(err.status === 401 && err.code !== 'key_expired' ? t('authError') : err.message);
  }
}

$('key-form').addEventListener('submit', (e) => {
  e.preventDefault();
  token = $('key-input').value.trim();
  try { sessionStorage.setItem(STORE_KEY, token); } catch { /* storage blocked */ }
  load();
});

function renderProviderHelp() {
  const chip = $('provider-key-help-chip');
  const tip = $('provider-key-help-tooltip');
  const connect = $('provider-openrouter-connect');
  const selected = $('provider-select')?.value || 'groq';
  if (!chip || !tip) return;
  chip.setAttribute('aria-label', t('providerApiKey') + ' — ' + (data?.providers?.find((p) => p.id === selected)?.name || selected));
  tip.replaceChildren();
  const line = (before, url, label, after) => {
    tip.append(document.createTextNode(before));
    const link = document.createElement('a'); link.href = url; link.target = '_blank'; link.rel = 'noopener noreferrer'; link.textContent = label; tip.append(link);
    tip.append(document.createTextNode(after));
  };
  if (selected === 'groq') {
    line(t('providerHelpGroqPrefix'), 'https://console.groq.com/', 'Groq Console', t('providerHelpGroqSuffix'));
  } else if (selected === 'requesty') {
    line(t('providerHelpRequestyPrefix'), 'https://requesty.ai/', 'Requesty', t('providerHelpRequestySuffix'));
  } else {
    tip.append(document.createTextNode(t('providerHelpOpenRouter')));
  }
  if (connect) connect.hidden = selected !== 'openrouter';
}

function renderProviderKeys() {
  const select = $('provider-select');
  if (select && data?.providers) {
    select.replaceChildren();
    for (const provider of data.providers) {
      const option = document.createElement('option'); option.value = provider.id; option.textContent = `${provider.name} — ${provider.model}`; select.append(option);
    }
  }
  renderProviderHelp();
  const list = $('provider-key-list');
  if (!list || !data) return;
  list.replaceChildren();
  if (!data.providerKeys?.length) {
    const p = document.createElement('p'); p.className = 'hint'; p.textContent = t('providerNoKeys'); list.append(p); return;
  }
  for (const key of data.providerKeys) {
    const row = document.createElement('div'); row.className = 'lead-item';
    const title = document.createElement('strong');
    const provider = data.providers.find((p) => p.id === key.provider);
    title.textContent = `${provider?.name || key.provider} · •••• ${key.last4}`;
    const status = document.createElement('p'); status.className = 'hint';
    status.textContent = key.status === 'invalid' ? t('providerKeyInvalid') : key.cooldownUntil && new Date(key.cooldownUntil) > new Date() ? t('providerKeyCooldown') : t('providerKeyActive');
    const remove = document.createElement('button'); remove.type = 'button'; remove.className = 'ghost'; remove.textContent = t('providerRemove');
    remove.addEventListener('click', async () => {
      if (!confirm(t('providerRemoveConfirm'))) return;
      remove.disabled = true;
      try { const out = await request('DELETE', `/api/agents/${encodeURIComponent(slug)}/keys/${encodeURIComponent(key.id)}`, null, auth()); data.providerKeys = out.keys; renderProviderKeys(); showNotice(t('providerRemoved')); }
      catch (err) { showError(err.message); remove.disabled = false; }
    });
    row.append(title, status, remove); list.append(row);
  }
}

$('provider-select').addEventListener('change', renderProviderHelp);

$('provider-openrouter-connect').addEventListener('click', async () => {
  const btn = $('provider-openrouter-connect');
  const note = $('provider-key-note');
  btn.disabled = true; note.textContent = '';
  try {
    const out = await request('POST', `/api/agents/${encodeURIComponent(slug)}/openrouter/oauth/start`, {}, auth());
    location.assign(out.url);
  } catch (err) { note.textContent = err.message; btn.disabled = false; }
});

$('provider-key-form').addEventListener('submit', async (e) => {
  e.preventDefault(); showError(''); $('provider-key-note').textContent = '';
  const btn = $('provider-key-save'); btn.disabled = true; btn.textContent = t('providerTesting');
  try {
    const out = await request('POST', `/api/agents/${encodeURIComponent(slug)}/keys`, { provider: $('provider-select').value, apiKey: $('provider-api-key').value }, auth());
    $('provider-api-key').value = ''; data.providerKeys = out.keys; renderProviderKeys(); $('provider-key-note').textContent = t('providerSaved');
  } catch (err) { $('provider-key-note').textContent = err.message; }
  finally { btn.disabled = false; btn.textContent = t('providerTestSave'); }
});

$('edit-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  showError(''); showNotice('');
  const btn = $('save');
  btn.disabled = true; btn.textContent = t('savingLong');
  try {
    const agent = collect();
    agent.status = $('e-status').value;
    const visitorLimit = $('visitor-daily-limit').value.trim();
    agent.visitorDailyLimit = visitorLimit ? Number(visitorLimit) : null;
    const out = await api('PUT', { agent, inputs: getInputs($('inputs-box')), lang: getUi() });
    if (hasLogoChange()) await syncLogo(slug, auth());
    await load();
    showNotice((out.emailVerificationSent ? t('verifySent') : out.instructionsRewritten ? t('rewritten') : t('saved')) + (out.colorsAdjusted ? ' ' + t('colorsAdjusted') : ''));
  } catch (err) {
    showError(err.status === 401 && err.code !== 'key_expired' ? t('authError') : err.message);
  } finally {
    btn.disabled = false; btn.textContent = t('save');
  }
});

$('delete').addEventListener('click', async () => {
  if (!confirm(t('deleteConfirm'))) return;
  try {
    await api('DELETE');
    try { sessionStorage.removeItem(STORE_KEY); } catch { /* storage blocked */ }
    location.href = '/create';
  } catch (err) { showError(err.message); }
});

onUiChange(() => { renderMeta(); updateLink(); showSupport(); renderProviderHelp(); });
const providerResult = new URLSearchParams(location.search).get('provider');
if (providerResult) history.replaceState(null, '', location.pathname);

applyUi();
if (token) load(); else { $('key-form').hidden = false; showSupport(); }

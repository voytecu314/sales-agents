// Onboarding: describe company -> review generated agent -> publish.
// Shared form logic and texts live in agent-form.js.
const { t, $, fill, collect, applyUi, request, showError, onUiChange, getInputs, syncLogo, logoSelected } = window.AgentForm;
let draftId = '';

function show(step) {
  for (const id of ['step-describe', 'step-review', 'step-done']) $(id).hidden = id !== step;
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

/* step 1: generate */
$('step-describe').addEventListener('submit', async (e) => {
  e.preventDefault();
  showError('');
  const btn = $('generate');
  btn.disabled = true; btn.textContent = t('generating');
  try {
    const data = await request('POST', '/api/agents/generate', { company: getInputs(e.target) });
    draftId = data.draftId; // the instructions stay on the server; the browser only holds this id
    fill(data.agent);
    $('r-notify-suggest').hidden = !data.suggestedNotifyEmail; // visible hint: the address was taken from the description
    show('step-review');
  } catch (err) {
    showError(err.message);
  } finally {
    btn.disabled = false; btn.textContent = t('generate');
  }
});

/* step 2: review and publish */
$('r-notify').addEventListener('input', () => { $('r-notify-suggest').hidden = true; });
$('back').addEventListener('click', () => { showError(''); show('step-describe'); });

$('step-review').addEventListener('submit', async (e) => {
  e.preventDefault();
  showError('');
  const btn = $('publish');
  btn.disabled = true; btn.textContent = t('publishing');
  try {
    const wantsLogo = logoSelected();
    const out = await request('POST', '/api/agents', { draftId, agent: collect() });
    $('d-logo-note').hidden = true;
    $('d-color-note').textContent = t('colorsAdjusted');
    $('d-color-note').hidden = !out.colorsAdjusted;
    if (wantsLogo) {
      try { await syncLogo(out.slug, { Authorization: 'Bearer ' + out.editToken }); }
      catch { $('d-logo-note').textContent = t('logoFailed'); $('d-logo-note').hidden = false; }
    }
    $('d-expiry').textContent = t('expiresOn').replace('{date}', new Date(out.keyExpiresAt).toLocaleDateString());
    $('d-url').textContent = out.url;
    $('d-url').href = out.url;
    $('d-open').href = out.url;
    $('d-edit').href = out.editUrl;
    $('d-key').value = out.editToken;
    show('step-done');
  } catch (err) {
    showError(err.message);
  } finally {
    btn.disabled = false; btn.textContent = t('publish');
  }
});

/* step 3 */
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
$('copy-edit').addEventListener('click', (e) => copy($('d-edit').href, e.target));

onUiChange(() => { /* nothing page specific to refresh */ });
applyUi();

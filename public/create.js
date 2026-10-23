// Onboarding: describe company -> review generated agent -> publish.
// Shared form logic and texts live in agent-form.js.
const { t, $, fill, collect, applyUi, request, showError, onUiChange } = window.AgentForm;

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
    const company = Object.fromEntries(new FormData(e.target).entries());
    const data = await request('POST', '/api/agents/generate', { company });
    fill(data.agent);
    show('step-review');
  } catch (err) {
    showError(err.message);
  } finally {
    btn.disabled = false; btn.textContent = t('generate');
  }
});

/* step 2: review and publish */
$('back').addEventListener('click', () => { showError(''); show('step-describe'); });

$('step-review').addEventListener('submit', async (e) => {
  e.preventDefault();
  showError('');
  const btn = $('publish');
  btn.disabled = true; btn.textContent = t('publishing');
  try {
    const out = await request('POST', '/api/agents', { agent: collect() });
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

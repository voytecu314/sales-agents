// Clean model output. Regex based, so NOT a real sanitizer (phase 3 replaces it
// with sanitize-html and an allowlist). Behavior unchanged from the old index.js.
const escapeHtml = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function cleanHtml(raw) {
  let html = String(raw || '');
  html = html.replace(/<think>[\s\S]*?<\/think>/gi, '');
  const fenced = html.match(/```(?:html)?\s*([\s\S]*?)```/i);
  html = fenced ? fenced[1] : html.replace(/^\s*```(?:html)?/i, '').replace(/```\s*$/, '');
  html = html
    .replace(/<!doctype[^>]*>/gi, '')
    .replace(/<\/?(html|head|body)[^>]*>/gi, '')
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<\/?(script|style|iframe|object|embed|link|meta|base)[^>]*>/gi, '')
    .replace(/\son\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '')
    .replace(/\s(formaction|action|target)\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '')
    .replace(/(href|src|xlink:href)\s*=\s*(["'])\s*javascript:[^"']*\2/gi, '$1="#"')
    .trim();
  if (html && !/<[a-z][\s\S]*>/i.test(html)) html = `<div class="bubble"><p>${escapeHtml(html)}</p></div>`; // model ignored the format
  return html;
}

module.exports = cleanHtml;

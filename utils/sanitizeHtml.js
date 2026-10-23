// Allowlist HTML sanitizer for model output that visitors will see.
//
// How it works: the input is tokenized by a strict tokenizer and the output is REBUILT from
// scratch. Only tags, attributes and classes from the lists below are written out; every value is
// decoded, validated and re-escaped, and all text is escaped. Anything the tokenizer does not
// recognise exactly is treated as plain text and escaped. So the browser never parses the model's
// raw markup. (Library alternatives: sanitize-html or DOMPurify; this one has no dependencies.)
//
// Not allowed at all: script, style, iframe, img, style="" attributes, id, on* handlers, form
// action, svg <use>/<image>/<a>/<foreignObject>/animations, css url(), javascript: links.

const MAX_INPUT = 60_000;
const MAX_TAGS = 2000;
const MAX_DEPTH = 24;

/* ---------- allowlists ---------- */
const CLASSES = new Set([
  'bubble', 'checks', 'pricing', 'price-card', 'featured', 'badge', 'good', 'warn', 'bad', 'price', 'grid', 'card',
  'violet', 'coral', 'mint', 'amber', 'rose', 'table-wrap', 'steps', 'step', 'callout', 'info', 'success', 'danger',
  'icon', 'pulse', 'float', 'ask', 'lead', 'choices', 'choice', 'btn', 'quick-row', 'quick'
]);

const VOID = new Set(['br', 'hr', 'input']);
const BOOLEAN = new Set(['required', 'checked', 'selected', 'open', 'multiple']);

const HTML_TAGS = ['div', 'span', 'p', 'strong', 'b', 'em', 'i', 'small', 'br', 'hr', 'code', 'blockquote',
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'li', 'table', 'thead', 'tbody', 'tfoot', 'tr', 'th', 'td', 'caption',
  'details', 'summary', 'form', 'fieldset', 'legend', 'label', 'select', 'option', 'textarea', 'button', 'input', 'a'];
const SVG_TAGS = ['svg', 'g', 'path', 'circle', 'ellipse', 'rect', 'line', 'polyline', 'polygon', 'text'];
const ALLOWED_TAGS = new Set([...HTML_TAGS, ...SVG_TAGS]);

// tags removed together with everything inside them
const DROP_WITH_CONTENT = new Set(['script', 'style', 'iframe', 'object', 'embed', 'noscript', 'template', 'title', 'head',
  'xmp', 'plaintext', 'math', 'noembed', 'noframes', 'applet', 'frameset']);

const GLOBAL_ATTRS = ['class', 'aria-label', 'aria-hidden', 'title'];
const SVG_PRESENTATION = ['fill', 'stroke', 'stroke-width', 'stroke-linecap', 'stroke-linejoin', 'stroke-dasharray', 'opacity', 'fill-rule', 'clip-rule', 'transform'];
const SHAPE = [...SVG_PRESENTATION, 'd', 'cx', 'cy', 'r', 'rx', 'ry', 'x', 'y', 'x1', 'y1', 'x2', 'y2', 'width', 'height', 'points'];

const TAG_ATTRS = {
  a: ['href'],
  input: ['type', 'name', 'value', 'placeholder', 'required', 'checked', 'min', 'max', 'step', 'maxlength'],
  textarea: ['name', 'placeholder', 'rows', 'required', 'maxlength'],
  select: ['name', 'required', 'multiple'],
  option: ['value', 'selected'],
  button: ['type', 'data-send'],
  details: ['open'],
  th: ['colspan', 'rowspan', 'scope'], td: ['colspan', 'rowspan'],
  svg: ['viewbox', 'width', 'height', 'fill', 'stroke', 'stroke-width', 'stroke-linecap', 'stroke-linejoin'],
  g: SVG_PRESENTATION, text: [...SVG_PRESENTATION, 'x', 'y', 'font-size', 'text-anchor']
};
for (const t of ['path', 'circle', 'ellipse', 'rect', 'line', 'polyline', 'polygon']) TAG_ATTRS[t] = SHAPE;

const INPUT_TYPES = new Set(['radio', 'checkbox', 'text', 'email', 'tel', 'range', 'number']);
const BUTTON_TYPES = new Set(['button', 'submit']);

/* ---------- value validators (they receive DECODED values) ---------- */
const NUM = /^-?\d{1,6}(\.\d{1,6})?%?$/;
const SVG_SAFE = /^[a-zA-Z0-9 ,.\-+#%()_]*$/;
const BAD_VALUE = /url\s*\(|javascript|expression|data:|&/i;
const clean = (v, max) => v.replace(/[\u0000-\u001F\u007F]/g, '').slice(0, max);

const VALIDATORS = {
  class: (v) => { const k = v.split(/\s+/).filter((c) => CLASSES.has(c)); return k.length ? [...new Set(k)].join(' ') : null; },
  'aria-label': (v) => clean(v, 200) || null,
  title: (v) => clean(v, 200) || null,
  'aria-hidden': (v) => (v === 'true' || v === 'false' ? v : null),
  name: (v) => clean(v, 80) || null,
  value: (v) => clean(v, 300),
  placeholder: (v) => clean(v, 120),
  'data-send': (v) => clean(v, 300) || null,
  type: null, // depends on the tag, handled below
  scope: (v) => (['row', 'col'].includes(v) ? v : null),
  viewbox: (v) => (/^[0-9 .,\-]{1,60}$/.test(v) ? v : null),
  d: (v) => (v.length <= 4000 && SVG_SAFE.test(v) && !BAD_VALUE.test(v) ? v : null),
  points: (v) => (v.length <= 2000 && SVG_SAFE.test(v) && !BAD_VALUE.test(v) ? v : null),
  'text-anchor': (v) => (['start', 'middle', 'end'].includes(v) ? v : null),
  'fill-rule': (v) => (['nonzero', 'evenodd'].includes(v) ? v : null),
  'clip-rule': (v) => (['nonzero', 'evenodd'].includes(v) ? v : null),
  'stroke-linecap': (v) => (['butt', 'round', 'square'].includes(v) ? v : null),
  'stroke-linejoin': (v) => (['miter', 'round', 'bevel'].includes(v) ? v : null)
};
const NUMERIC = new Set(['min', 'max', 'step', 'rows', 'maxlength', 'colspan', 'rowspan', 'width', 'height', 'cx', 'cy', 'r', 'rx', 'ry', 'x', 'y', 'x1', 'y1', 'x2', 'y2', 'stroke-width', 'opacity', 'font-size']);
const SVG_FREE = new Set(['fill', 'stroke', 'stroke-dasharray', 'transform']);

function validateValue(tag, name, value, policy) {
  if (BOOLEAN.has(name)) return '';
  if (name === 'href') return hrefValue(value, policy);
  if (name === 'type') {
    if (tag === 'input') return INPUT_TYPES.has(value.toLowerCase()) ? value.toLowerCase() : null;
    if (tag === 'button') return BUTTON_TYPES.has(value.toLowerCase()) ? value.toLowerCase() : null;
    return null;
  }
  if (NUMERIC.has(name)) return NUM.test(value) ? value : null;
  if (SVG_FREE.has(name)) return value.length <= 200 && SVG_SAFE.test(value) && !BAD_VALUE.test(value) ? value : null;
  const fn = VALIDATORS[name];
  return fn ? fn(value) : null;
}

/* ---------- links ---------- */
// Only links that the company itself provided (see services/linkPolicy.js) survive.
function hrefValue(raw, policy) {
  if (!policy) return null;
  const v = raw.trim();
  if (/^tel:/i.test(v)) { // phone numbers are often written with spaces, so check the digits only
    if (!/^tel:[+\d\s().-]{5,30}$/i.test(v)) return null;
    const digits = v.slice(4).replace(/[^\d+]/g, '');
    return policy.phones.has(digits) ? `tel:${digits}` : null;
  }
  if (/[\s\u0000-\u001F<>"'`\\]/.test(v) || v.length > 500) return null;
  const sameHost = (h) => policy.hosts.has(h) || policy.hosts.has(h.replace(/^www\./, '')) || policy.hosts.has('www.' + h);

  if (/^https?:\/\//i.test(v)) {
    let u;
    try { u = new URL(v); } catch { return null; }
    if (u.username || u.password || !sameHost(u.hostname.toLowerCase())) return null;
    return u.href;
  }
  if (/^mailto:/i.test(v)) {
    const addr = v.slice(7).split('?')[0].toLowerCase();
    return policy.emails.has(addr) ? `mailto:${addr}` : null;
  }
  return null;
}

/* ---------- entities & escaping ---------- */
const NAMED = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' };
function decodeEntities(s) {
  return s.replace(/&(?:#(\d{1,7});?|#[xX]([0-9a-fA-F]{1,6});?|([a-zA-Z]{2,6});)/g, (m, dec, hex, name) => {
    if (name) return Object.hasOwn(NAMED, name.toLowerCase()) ? NAMED[name.toLowerCase()] : m;
    const cp = dec ? parseInt(dec, 10) : parseInt(hex, 16);
    return cp > 0 && cp <= 0x10FFFF && !(cp >= 0xD800 && cp <= 0xDFFF) ? String.fromCodePoint(cp) : '';
  });
}
const escText = (s) => s.replace(/</g, '&lt;').replace(/>/g, '&gt;');
const escAttr = (s) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/* ---------- tokenizer ---------- */
const TAG_RE = /<(\/?)([a-zA-Z][a-zA-Z0-9]*)((?:\s+[^\s"'<>\/=]+(?:\s*=\s*(?:"[^"]*"|'[^']*'|[^\s"'=<>`]+))?)*)\s*(\/?)>/y;
const ATTR_RE = /([^\s"'<>\/=]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g;

function parseAttrs(src) {
  const attrs = new Map(); // first occurrence wins, like in browsers
  for (const m of src.matchAll(ATTR_RE)) {
    const name = m[1].toLowerCase();
    if (!attrs.has(name)) attrs.set(name, decodeEntities(m[2] ?? m[3] ?? m[4] ?? ''));
  }
  return attrs;
}

function sanitizeHtml(input, { linkPolicy = null } = {}) {
  const src = String(input ?? '').slice(0, MAX_INPUT);
  let out = '';
  const stack = [];
  let tags = 0;
  let i = 0;

  while (i < src.length) {
    const lt = src.indexOf('<', i);
    if (lt === -1) { out += escText(src.slice(i)); break; }
    out += escText(src.slice(i, lt));
    i = lt;

    if (src.startsWith('<!--', i)) { // comment: drop
      const end = src.indexOf('-->', i + 4);
      i = end === -1 ? src.length : end + 3;
      continue;
    }
    if (src[i + 1] === '!' || src[i + 1] === '?') { // doctype, CDATA, processing instruction: drop
      const end = src.indexOf('>', i);
      i = end === -1 ? src.length : end + 1;
      continue;
    }

    TAG_RE.lastIndex = i;
    const m = TAG_RE.exec(src);
    if (!m) { out += '&lt;'; i += 1; continue; } // not a well-formed tag: plain text

    i = TAG_RE.lastIndex;
    const closing = m[1] === '/';
    const tag = m[2].toLowerCase();

    if (DROP_WITH_CONTENT.has(tag) && !closing) { // skip to the matching end tag
      const end = src.toLowerCase().indexOf(`</${tag}`, i);
      if (end === -1) { i = src.length; } else { const gt = src.indexOf('>', end); i = gt === -1 ? src.length : gt + 1; }
      continue;
    }
    if (!ALLOWED_TAGS.has(tag)) continue; // unknown tag: drop the tag, keep its text

    if (closing) {
      const at = stack.lastIndexOf(tag);
      if (at === -1) continue; // stray end tag
      while (stack.length > at) out += `</${stack.pop()}>`;
      continue;
    }

    if (++tags > MAX_TAGS) break;
    const attrs = parseAttrs(m[3]);
    const allowed = new Set([...GLOBAL_ATTRS, ...(TAG_ATTRS[tag] || [])]);
    if (tag === 'form') for (const g of GLOBAL_ATTRS) if (g !== 'class') allowed.delete(g); // keep forms minimal
    let attrStr = '';
    let drop = false;

    for (const [name, raw] of attrs) {
      if (!allowed.has(name)) continue;
      const v = validateValue(tag, name, raw, linkPolicy);
      if (v === null) { if (name === 'type' && tag === 'input') drop = true; continue; } // input with unknown type: drop the whole field
      const outName = name === 'viewbox' ? 'viewBox' : name;
      attrStr += BOOLEAN.has(name) ? ` ${outName}` : ` ${outName}="${escAttr(v)}"`;
    }
    if (drop) continue;

    if (tag === 'a') {
      if (!attrStr.includes(' href=')) continue; // link not allowed: keep the text only
      attrStr += ' target="_blank" rel="noopener noreferrer nofollow"';
    }

    if (VOID.has(tag)) { out += `<${tag}${attrStr}>`; continue; }
    if (stack.length >= MAX_DEPTH) continue;
    out += `<${tag}${attrStr}>`;
    stack.push(tag);

    if (tag === 'textarea') { // RCDATA element: never carry content, just an empty field
      const end = src.toLowerCase().indexOf('</textarea', i);
      if (end === -1) i = src.length; else { const gt = src.indexOf('>', end); i = gt === -1 ? src.length : gt + 1; }
      out += '</textarea>';
      stack.pop();
    }
  }

  while (stack.length) out += `</${stack.pop()}>`;
  return out.trim();
}

module.exports = sanitizeHtml;
module.exports.CLASSES = CLASSES;

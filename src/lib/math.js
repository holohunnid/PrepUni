// Build-time KaTeX. The course fragments write math as $inline$ and $$display$$;
// this turns them into KaTeX markup when the site is built, so the browser gets
// finished HTML and never has to download or run KaTeX.
//
// It mirrors katex/contrib/auto-render exactly (same delimiters, same ignored
// tags, same splitting rules), so the output matches what the old client-side
// rendering produced — it just happens once, on the build machine.
import katex from 'katex';

const DELIMS = [
  { left: '$$', right: '$$', display: true },
  { left: '$', right: '$', display: false },
];
// auto-render's defaults: math inside these elements is left alone
const IGNORED = new Set(['script', 'noscript', 'style', 'textarea', 'pre', 'code', 'option']);
// elements whose content the HTML parser treats as raw text (no tags inside)
const RAWTEXT = new Set(['script', 'style', 'textarea']);

// ---------- text <-> HTML ----------
const NAMED = { lt: '<', gt: '>', amp: '&', quot: '"', apos: "'", nbsp: ' ' };
function decode(s) {
  return s.replace(/&(#[xX][0-9a-fA-F]+|#\d+|[a-zA-Z]+);?/g, (m, e) => {
    if (e[0] === '#') {
      const n = e[1] === 'x' || e[1] === 'X' ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10);
      return String.fromCodePoint(n);
    }
    return Object.hasOwn(NAMED, e) ? NAMED[e] : m;
  });
}
const escapeText = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/ /g, '&nbsp;');

// ---------- auto-render's delimiter splitter (ported verbatim) ----------
function findEndOfMath(delim, text, start) {
  let i = start, braces = 0;
  while (i < text.length) {
    const c = text[i];
    if (braces <= 0 && text.slice(i, i + delim.length) === delim) return i;
    if (c === '\\') i++;
    else if (c === '{') braces++;
    else if (c === '}') braces--;
    i++;
  }
  return -1;
}
const LEFT_RE = /(\$\$|\$)/;
function splitAtDelimiters(text) {
  const out = [];
  for (;;) {
    let i = text.search(LEFT_RE);
    if (i === -1) break;
    if (i > 0) { out.push({ type: 'text', data: text.slice(0, i) }); text = text.slice(i); }
    const d = DELIMS.find((x) => text.startsWith(x.left));
    i = findEndOfMath(d.right, text, d.left.length);
    if (i === -1) break;
    const raw = text.slice(0, i + d.right.length);
    const math = /^\\begin{/.test(raw) ? raw : text.slice(d.left.length, i);
    out.push({ type: 'math', data: math, raw, display: d.display });
    text = text.slice(i + d.right.length);
  }
  if (text !== '') out.push({ type: 'text', data: text });
  return out;
}

// ---------- one text node ----------
const cache = new Map();
function renderText(rawHtmlText, ctx) {
  if (!rawHtmlText.includes('$')) return rawHtmlText;
  const parts = splitAtDelimiters(decode(rawHtmlText));
  if (parts.length === 1 && parts[0].type === 'text') return rawHtmlText;
  let html = '';
  for (const p of parts) {
    if (p.type === 'text') { html += escapeText(p.data); continue; }
    const key = (p.display ? 'D' : 'I') + p.data;
    let r = cache.get(key);
    if (r === undefined) {
      try {
        r = '<span>' + katex.renderToString(p.data, { displayMode: p.display, throwOnError: false, strict: 'ignore', output: 'html' }) + '</span>';
      } catch (e) {
        // auto-render leaves unparsable math as plain text
        console.warn(`[math] ${ctx}: could not render \`${p.data}\`: ${e.message}`);
        r = escapeText(p.raw);
      }
      cache.set(key, r);
    }
    html += r;
  }
  return html;
}

// ---------- walk the HTML the way a browser would ----------
// Text runs between tags (and between comments) are what the browser's text
// nodes would be; tags and comments are copied through untouched.
export function renderMath(html, ctx = 'fragment') {
  let out = '', i = 0, text = '';
  const ignored = []; // stack of open ignored tag names
  const flush = () => { out += ignored.length ? text : renderText(text, ctx); text = ''; };

  while (i < html.length) {
    const lt = html.indexOf('<', i);
    if (lt === -1) { text += html.slice(i); break; }
    text += html.slice(i, lt);
    const next = html[lt + 1] || '';

    if (html.startsWith('<!--', lt)) {
      flush();
      const end = html.indexOf('-->', lt + 4);
      const stop = end === -1 ? html.length : end + 3;
      out += html.slice(lt, stop); i = stop; continue;
    }
    if (!/[a-zA-Z/!?]/.test(next)) { text += '<'; i = lt + 1; continue; } // a literal '<'

    // a tag: scan to the closing '>' while respecting quoted attribute values
    let j = lt + 1, q = null;
    for (; j < html.length; j++) {
      const c = html[j];
      if (q) { if (c === q) q = null; } else if (c === '"' || c === "'") q = c; else if (c === '>') break;
    }
    flush();
    const tag = html.slice(lt, j + 1);
    out += tag; i = j + 1;

    const m = /^<(\/?)([a-zA-Z][a-zA-Z0-9-]*)/.exec(tag);
    if (!m) continue;
    const name = m[2].toLowerCase(), closing = m[1] === '/', selfClosing = /\/>$/.test(tag);
    if (closing) {
      const k = ignored.lastIndexOf(name);
      if (k !== -1) ignored.length = k;
    } else if (!selfClosing) {
      if (IGNORED.has(name)) ignored.push(name);
      if (RAWTEXT.has(name)) {
        const end = html.toLowerCase().indexOf('</' + name, i);
        const stop = end === -1 ? html.length : end;
        out += html.slice(i, stop); i = stop;
      }
    }
  }
  flush();
  return out;
}

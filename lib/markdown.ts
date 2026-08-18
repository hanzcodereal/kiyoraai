export function esc(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function escInline(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export function inl(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/`([^`\n]+)`/g, '<code>$1</code>')
    .replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/__(.+?)__/g, '<strong>$1</strong>')
    .replace(/\*([^*\n]+)\*/g, '<em>$1</em>')
    .replace(/_([^_\n]+)_/g, '<em>$1</em>')
    .replace(/~~(.+?)~~/g, '<del>$1</del>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
}

export function parseMD(raw: string): string {
  const lines = raw.split('\n');
  let out = '';
  let inCode = false;
  let lang = '';
  let codeLines: string[] = [];
  let inUl = false;
  let inOl = false;
  let pLines: string[] = [];
  let inTbl = false;
  let tHdr: string[] = [];
  let tRows: string[][] = [];

  const fp = () => {
    if (pLines.length) {
      out += `<p>${pLines.map((l) => inl(l)).join('<br>')}</p>`;
      pLines = [];
    }
  };
  const cl = () => {
    if (inUl) {
      out += '</ul>';
      inUl = false;
    }
    if (inOl) {
      out += '</ol>';
      inOl = false;
    }
  };
  const ft = () => {
    if (!inTbl) return;
    out +=
      '<table><thead><tr>' +
      tHdr.map((h) => `<th>${inl(h.trim())}</th>`).join('') +
      '</tr></thead><tbody>' +
      tRows.map((r) => '<tr>' + r.map((c) => `<td>${inl(c.trim())}</td>`).join('') + '</tr>').join('') +
      '</tbody></table>';
    inTbl = false;
    tHdr = [];
    tRows = [];
  };

  for (let i = 0; i < lines.length; i++) {
    const ln = lines[i];
    if (/^```/.test(ln)) {
      if (!inCode) {
        fp();
        cl();
        ft();
        lang = ln.slice(3).trim() || 'plaintext';
        codeLines = [];
        inCode = true;
      } else {
        const hl = lang.toLowerCase();
        const valid =
          typeof window !== 'undefined' && window.hljs?.getLanguage(hl) ? 'language-' + hl : '';
        out += `<div class="cb"><div class="cb-top">
          <span class="cb-lang">${esc(lang)}</span>
          <div class="cb-acts"><button class="cb-copy" onclick="copyCode(this)"><svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>Copy code</button></div>
        </div><pre><code class="${valid}">${esc(codeLines.join('\n'))}</code></pre></div>`;
        inCode = false;
        lang = '';
        codeLines = [];
      }
      continue;
    }
    if (inCode) {
      codeLines.push(ln);
      continue;
    }
    if (/^#### /.test(ln)) {
      fp();
      cl();
      ft();
      out += `<h4>${inl(ln.slice(5))}</h4>`;
      continue;
    }
    if (/^### /.test(ln)) {
      fp();
      cl();
      ft();
      out += `<h3>${inl(ln.slice(4))}</h3>`;
      continue;
    }
    if (/^## /.test(ln)) {
      fp();
      cl();
      ft();
      out += `<h2>${inl(ln.slice(3))}</h2>`;
      continue;
    }
    if (/^# /.test(ln)) {
      fp();
      cl();
      ft();
      out += `<h1>${inl(ln.slice(2))}</h1>`;
      continue;
    }
    if (/^(---+|===+)$/.test(ln.trim())) {
      fp();
      cl();
      ft();
      out += '<hr>';
      continue;
    }
    if (/^> /.test(ln)) {
      fp();
      cl();
      ft();
      out += `<blockquote>${inl(ln.slice(2))}</blockquote>`;
      continue;
    }
    if (/^\|.+\|$/.test(ln)) {
      if (!inTbl) {
        fp();
        cl();
        tHdr = ln.slice(1, -1).split('|');
        inTbl = true;
        tRows = [];
      } else if (/^\|[-:\s|]+\|$/.test(ln)) {
      } else {
        tRows.push(ln.slice(1, -1).split('|'));
      }
      continue;
    } else {
      ft();
    }
    if (/^\s*[-*+] /.test(ln)) {
      fp();
      if (!inUl) {
        if (inOl) {
          out += '</ol>';
          inOl = false;
        }
        out += '<ul>';
        inUl = true;
      }
      out += `<li>${inl(ln.replace(/^\s*[-*+] /, ''))}</li>`;
      continue;
    }
    if (/^\d+\. /.test(ln)) {
      fp();
      if (!inOl) {
        if (inUl) {
          out += '</ul>';
          inUl = false;
        }
        out += '<ol>';
        inOl = true;
      }
      out += `<li>${inl(ln.replace(/^\d+\. /, ''))}</li>`;
      continue;
    }
    if (!ln.trim()) {
      fp();
      cl();
      ft();
      continue;
    }
    pLines.push(ln);
  }
  fp();
  cl();
  ft();
  if (inCode && codeLines.length) out += `<div class="cb"><pre><code>${esc(codeLines.join('\n'))}</code></pre></div>`;
  return out;
}

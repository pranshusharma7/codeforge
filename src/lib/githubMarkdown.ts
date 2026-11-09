/**
 * GitHub Flavored Markdown (GFM) Parser & Engine
 * Converts Markdown text into authentic GitHub-styled HTML.
 * Supports:
 * - GitHub Alerts (> [!NOTE], > [!TIP], > [!IMPORTANT], > [!WARNING], > [!CAUTION])
 * - GFM Task Lists (- [ ] and - [x])
 * - GFM Tables with alignments (| :--- | :---: | ---: |)
 * - Fenced code blocks with language badge and copy action
 * - Syntax highlighting simulation for code blocks
 * - GitHub Headings (H1 & H2 with borders)
 * - Blockquotes, inline code, badges, images, links, strikethrough
 */

export interface HeadingItem {
  level: number;
  text: string;
  id: string;
}

export function slugifyHeading(text: string): string {
  return text
    .toLowerCase()
    .replace(/<[^>]*>/g, '') // strip HTML tags
    .replace(/[^\w\s-]/g, '') // strip special punctuation
    .trim()
    .replace(/\s+/g, '-');
}

export function extractHeadings(md: string): HeadingItem[] {
  if (!md) return [];
  const lines = md.split('\n');
  const headings: HeadingItem[] = [];
  const counts: Record<string, number> = {};

  for (const line of lines) {
    const match = line.match(/^(#{1,6})\s+(.+)$/);
    if (match) {
      const level = match[1].length;
      const text = match[2].trim();
      let slug = slugifyHeading(text) || `heading-${level}`;
      if (counts[slug]) {
        const count = counts[slug]++;
        slug = `${slug}-${count}`;
      } else {
        counts[slug] = 1;
      }
      headings.push({ level, text, id: slug });
    }
  }
  return headings;
}

export function parseGitHubMarkdown(md: string): string {
  if (!md) return '';

  let html = md;

  // Normalize line endings
  html = html.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  // ── 1. Fenced Code Blocks (Extract and protect from inline parsing) ────────
  const codeBlocks: string[] = [];
  html = html.replace(/```(\w*)\n([\s\S]*?)```/g, (_match, lang, code) => {
    const placeholder = `%%CODE_BLOCK_${codeBlocks.length}%%`;
    const cleanLang = (lang || 'text').toLowerCase();
    const escapedCode = escapeHtml(code.trimEnd());
    const highlighted = highlightCodeSyntax(escapedCode, cleanLang);

    const blockHtml = `
      <div class="gh-code-block" data-lang="${cleanLang}">
        <div class="gh-code-header">
          <span class="gh-code-lang">${cleanLang}</span>
          <button class="gh-copy-code-btn" type="button" data-code="${encodeURIComponent(code.trimEnd())}" title="Copy code">
            <svg width="13" height="13" viewBox="0 0 16 16" fill="currentColor">
              <path d="M0 6.75C0 5.784.784 5 1.75 5h1.5a.75.75 0 0 1 0 1.5h-1.5a.25.25 0 0 0-.25.25v7.5c0 .138.112.25.25.25h7.5a.25.25 0 0 0 .25-.25v-1.5a.75.75 0 0 1 1.5 0v1.5A1.75 1.75 0 0 1 9.25 16h-7.5A1.75 1.75 0 0 1 0 14.25Z"></path>
              <path d="M5 1.75C5 .784 5.784 0 6.75 0h7.5C15.216 0 16 .784 16 1.75v7.5A1.75 1.75 0 0 1 14.25 11h-7.5A1.75 1.75 0 0 1 5 9.25Zm1.75-.25a.25.25 0 0 0-.25.25v7.5c0 .138.112.25.25.25h7.5a.25.25 0 0 0 .25-.25v-7.5a.25.25 0 0 0-.25-.25Z"></path>
            </svg>
            <span>Copy</span>
          </button>
        </div>
        <pre class="gh-pre"><code class="gh-code language-${cleanLang}">${highlighted}</code></pre>
      </div>
    `;
    codeBlocks.push(blockHtml);
    return placeholder;
  });

  // ── 2. GitHub Alerts / Callouts (> [!NOTE], > [!TIP], etc.) ───────────────
  const alertTypes: Record<string, { label: string; color: string; icon: string }> = {
    NOTE: {
      label: 'Note',
      color: 'note',
      icon: '<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M0 8a8 8 0 1 1 16 0A8 8 0 0 1 0 8Zm8-6.5a6.5 6.5 0 1 0 0 13 6.5 6.5 0 0 0 0-13ZM6.5 7.75A.75.75 0 0 1 7.25 7h1a.75.75 0 0 1 .75.75v2.75h.25a.75.75 0 0 1 0 1.5h-2a.75.75 0 0 1 0-1.5h.25v-2h-.25a.75.75 0 0 1-.75-.75ZM8 6a1 1 0 1 1 0-2 1 1 0 0 1 0 2Z"></path></svg>',
    },
    TIP: {
      label: 'Tip',
      color: 'tip',
      icon: '<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M8 1.5c-2.363 0-4 1.69-4 3.75 0 .984.424 1.625.984 2.304l.214.253c.223.264.47.556.673.848.284.411.537.896.621 1.49a.75.75 0 0 1-1.484.21c-.04-.282-.163-.52-.37-.819a4.84 4.84 0 0 0-.663-.836l-.216-.255C3.12 7.632 2.5 6.738 2.5 5.25 2.5 2.31 4.863 0 8 0s5.5 2.31 5.5 5.25c0 1.488-.62 2.382-1.239 3.119l-.216.255c-.218.259-.442.525-.663.836-.207.3-.33.537-.37.82a.75.75 0 0 1-1.484-.211c.084-.594.337-1.079.621-1.49.203-.292.45-.584.673-.848l.214-.253c.56-.679.984-1.32.984-2.304 0-2.06-1.637-3.75-4-3.75ZM6 11.25a.75.75 0 0 1 .75-.75h2.5a.75.75 0 0 1 0 1.5h-2.5a.75.75 0 0 1-.75-.75Zm.75 2.25a.75.75 0 0 0 0 1.5h2.5a.75.75 0 0 0 0-1.5h-2.5Z"></path></svg>',
    },
    IMPORTANT: {
      label: 'Important',
      color: 'important',
      icon: '<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M0 1.75C0 .784.784 0 1.75 0h12.5C15.216 0 16 .784 16 1.75v9.5A1.75 1.75 0 0 1 14.25 13H9.06l-2.573 2.573A1.458 1.458 0 0 1 4 14.543V13H1.75A1.75 1.75 0 0 1 0 11.25Zm1.75-.25a.25.25 0 0 0-.25.25v9.5c0 .138.112.25.25.25h3a.75.75 0 0 1 .75.75v2.19l2.72-2.72a.749.749 0 0 1 .53-.22h5.5a.25.25 0 0 0 .25-.25v-9.5a.25.25 0 0 0-.25-.25Zm6.5 3a.75.75 0 0 1 .75.75v2.5a.75.75 0 0 1-1.5 0v-2.5a.75.75 0 0 1 .75-.75Zm0 6a1 1 0 1 1 0-2 1 1 0 0 1 0 2Z"></path></svg>',
    },
    WARNING: {
      label: 'Warning',
      color: 'warning',
      icon: '<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M6.457 1.047c.659-1.234 2.427-1.234 3.086 0l6.082 11.378A1.75 1.75 0 0 1 14.082 15H1.918a1.75 1.75 0 0 1-1.543-2.575Zm1.763.707a.25.25 0 0 0-.44 0L1.698 13.132a.25.25 0 0 0 .22.368h12.164a.25.25 0 0 0 .22-.368Zm.53 3.996v2.5a.75.75 0 0 1-1.5 0v-2.5a.75.75 0 0 1 1.5 0ZM9 11a1 1 0 1 1-2 0 1 1 0 0 1 2 0Z"></path></svg>',
    },
    CAUTION: {
      label: 'Caution',
      color: 'caution',
      icon: '<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M8 0a8 8 0 1 1 0 16A8 8 0 0 1 8 0Zm0 1.5a6.5 6.5 0 1 0 0 13 6.5 6.5 0 0 0 0-13ZM4.47 4.47a.75.75 0 0 1 1.06 0L8 6.94l2.47-2.47a.75.75 0 1 1 1.06 1.06L9.06 8l2.47 2.47a.75.75 0 1 1-1.06 1.06L8 9.06l-2.47 2.47a.75.75 0 0 1-1.06-1.06L6.94 8 4.47 5.53a.75.75 0 0 1 0-1.06Z"></path></svg>',
    },
  };

  html = html.replace(/^>\s*\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]\s*\n((?:>.*(?:\n|$))*)/gim, (_, type, body) => {
    const key = type.toUpperCase();
    const alert = alertTypes[key] || alertTypes.NOTE;
    const cleanBody = body
      .split('\n')
      .map((line: string) => line.replace(/^>\s?/, ''))
      .join('\n')
      .trim();

    return `
      <div class="gh-alert gh-alert-${alert.color}">
        <div class="gh-alert-title">
          <span class="gh-alert-icon">${alert.icon}</span>
          <span>${alert.label}</span>
        </div>
        <div class="gh-alert-body">${cleanBody}</div>
      </div>\n
    `;
  });

  // ── 3. GFM Tables ─────────────────────────────────────────────────────────
  html = html.replace(
    /((?:^\|.+?\|(?:\r?\n|$))+)/gm,
    (tableBlock) => {
      const lines = tableBlock.trim().split('\n').map(l => l.trim()).filter(Boolean);
      if (lines.length < 2) return tableBlock;

      const isDelimiter = lines[1].match(/^\|(?:\s*:?-+:?\s*\|)+$/);
      if (!isDelimiter) return tableBlock;

      const headerCells = lines[0].split('|').slice(1, -1).map(c => c.trim());
      const alignCells = lines[1].split('|').slice(1, -1).map(c => {
        const text = c.trim();
        const left = text.startsWith(':');
        const right = text.endsWith(':');
        if (left && right) return 'center';
        if (right) return 'right';
        if (left) return 'left';
        return 'left';
      });

      let tableHtml = '<div class="gh-table-wrapper"><table class="gh-table"><thead><tr>';
      headerCells.forEach((h, i) => {
        const align = alignCells[i] || 'left';
        tableHtml += `<th style="text-align: ${align}">${h}</th>`;
      });
      tableHtml += '</tr></thead><tbody>';

      for (let i = 2; i < lines.length; i++) {
        const rowCells = lines[i].split('|').slice(1, -1).map(c => c.trim());
        tableHtml += '<tr>';
        rowCells.forEach((c, idx) => {
          const align = alignCells[idx] || 'left';
          tableHtml += `<td style="text-align: ${align}">${c}</td>`;
        });
        tableHtml += '</tr>';
      }

      tableHtml += '</tbody></table></div>';
      return tableHtml;
    }
  );

  // ── 4. Blockquotes ────────────────────────────────────────────────────────
  html = html.replace(/((?:^>.*(?:\n|$))+)/gm, (block) => {
    if (block.includes('class="gh-alert"')) return block;
    const content = block
      .split('\n')
      .map(l => l.replace(/^>\s?/, ''))
      .join('<br />')
      .trim();
    return `<blockquote class="gh-blockquote">${content}</blockquote>`;
  });

  // ── 5. Headings with Unique Anchor IDs & Icons ────────────────────────────
  const headingCounts: Record<string, number> = {};
  function makeHeadingHtml(level: number, text: string): string {
    let slug = slugifyHeading(text) || `heading-${level}`;
    if (headingCounts[slug]) {
      const count = headingCounts[slug]++;
      slug = `${slug}-${count}`;
    } else {
      headingCounts[slug] = 1;
    }
    const anchor = `<a class="gh-header-anchor" href="#${slug}" aria-hidden="true" title="Direct link to heading"><svg class="gh-octicon-link" viewBox="0 0 16 16" width="16" height="16" fill="currentColor"><path d="m7.775 3.275 1.25-1.25a3.5 3.5 0 1 1 4.95 4.95l-2.5 2.5a3.5 3.5 0 0 1-4.95 0 .751.751 0 0 1 .018-1.042.751.751 0 0 1 1.042-.018 1.998 1.998 0 0 0 2.83 0l2.5-2.5a2.002 2.002 0 0 0-2.83-2.83l-1.25 1.25a.751.751 0 0 1-1.042-.018.751.751 0 0 1-.018-1.042Zm-4.69 9.64a1.998 1.998 0 0 0 2.83 0l1.25-1.25a.751.751 0 0 1 1.042.018.751.751 0 0 1 .018 1.042l-1.25 1.25a3.5 3.5 0 1 1-4.95-4.95l2.5-2.5a3.5 3.5 0 0 1 4.95 0 .751.751 0 0 1-.018 1.042.751.751 0 0 1-1.042.018 1.998 1.998 0 0 0-2.83 0l-2.5 2.5a2.002 2.002 0 0 0 2.83 2.83Z"></path></svg></a>`;
    return `<h${level} id="${slug}" class="gh-h gh-h${level}">${anchor}<span class="gh-heading-text">${text}</span></h${level}>`;
  }

  html = html.replace(/^######\s+(.+)$/gm, (_, t) => makeHeadingHtml(6, t));
  html = html.replace(/^#####\s+(.+)$/gm, (_, t) => makeHeadingHtml(5, t));
  html = html.replace(/^####\s+(.+)$/gm, (_, t) => makeHeadingHtml(4, t));
  html = html.replace(/^###\s+(.+)$/gm, (_, t) => makeHeadingHtml(3, t));
  html = html.replace(/^##\s+(.+)$/gm, (_, t) => makeHeadingHtml(2, t));
  html = html.replace(/^#\s+(.+)$/gm, (_, t) => makeHeadingHtml(1, t));

  // ── 6. Horizontal Rules ───────────────────────────────────────────────────
  html = html.replace(/^(?:---|\*\*\*|___)\s*$/gm, '<hr class="gh-hr" />');

  // ── 7. Task Lists & Checkboxes ────────────────────────────────────────────
  html = html.replace(
    /^-\s+\[([ xX])\]\s+(.+)$/gm,
    (_, check, text) => {
      const isChecked = check.toLowerCase() === 'x';
      return `
        <li class="gh-task-item">
          <input type="checkbox" class="gh-task-checkbox" ${isChecked ? 'checked' : ''} disabled />
          <span class="${isChecked ? 'gh-task-checked' : ''}">${text}</span>
        </li>
      `;
    }
  );

  // Regular Lists
  html = html.replace(/^(?:-|\*|\+)\s+(.+)$/gm, '<li>$1</li>');
  html = html.replace(/(<li>.*<\/li>\n?)+/gs, (match) => {
    if (match.includes('gh-task-item')) {
      return `<ul class="gh-task-list">${match}</ul>`;
    }
    return `<ul class="gh-ul">${match}</ul>`;
  });

  // Numbered Lists
  html = html.replace(/^\d+\.\s+(.+)$/gm, '<li class="gh-ol-item">$1</li>');
  html = html.replace(/(<li class="gh-ol-item">.*<\/li>\n?)+/gs, '<ol class="gh-ol">$&</ol>');

  // ── 8. Images & Badges ────────────────────────────────────────────────────
  // Badges with link: [![alt](imgUrl)](linkUrl)
  html = html.replace(/\[!\[(.*?)\]\((.*?)\)\]\((.*?)\)/g, '<a href="$3" target="_blank" rel="noopener noreferrer" class="gh-badge-link"><img src="$2" alt="$1" class="gh-badge-img" /></a>');

  // Regular Images: ![alt](url)
  html = html.replace(/!\[(.*?)\]\((.*?)\)/g, '<img src="$2" alt="$1" class="gh-img" loading="lazy" />');

  // ── 9. Links ──────────────────────────────────────────────────────────────
  html = html.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="gh-link">$1</a>');

  // ── 10. Inline Formats ────────────────────────────────────────────────────
  // Strikethrough
  html = html.replace(/~~(.*?)~~/g, '<del class="gh-del">$1</del>');

  // Bold & Italic
  html = html.replace(/\*\*\*(.*?)\*\*\*/g, '<strong><em>$1</em></strong>');
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong class="gh-strong">$1</strong>');
  html = html.replace(/__(.*?)__/g, '<strong class="gh-strong">$1</strong>');
  html = html.replace(/\*(.*?)\*/g, '<em class="gh-em">$1</em>');
  html = html.replace(/_(.*?)_/g, '<em class="gh-em">$1</em>');

  // Inline Code
  html = html.replace(/`([^`]+)`/g, '<code class="gh-inline-code">$1</code>');

  // ── 11. Paragraphs & Line Breaks ──────────────────────────────────────────
  html = html.replace(/\n\n+/g, '</p><p class="gh-p">');
  html = `<p class="gh-p">${html}</p>`;

  // Clean up empty paragraphs or broken tags
  html = html.replace(/<p class="gh-p">\s*<\/p>/g, '');
  html = html.replace(/<p class="gh-p">(<(?:h[1-6]|div|table|ul|ol|blockquote|hr))/g, '$1');
  html = html.replace(/(<\/(?:h[1-6]|div|table|ul|ol|blockquote|hr)>)\s*<\/p>/g, '$1');

  // ── 12. Restore Fenced Code Blocks ────────────────────────────────────────
  codeBlocks.forEach((block, index) => {
    html = html.replace(`%%CODE_BLOCK_${index}%%`, block);
  });

  return html;
}

// ── Escape HTML helper ──────────────────────────────────────────────────────
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// ── High-Speed Syntax Highlighter ────────────────────────────────────────────
function highlightCodeSyntax(escapedCode: string, lang: string): string {
  if (!escapedCode) return '';

  const keywordsMap: Record<string, string[]> = {
    javascript: ['const', 'let', 'var', 'function', 'return', 'import', 'from', 'export', 'default', 'class', 'extends', 'if', 'else', 'for', 'while', 'switch', 'case', 'break', 'async', 'await', 'try', 'catch', 'finally', 'new', 'this', 'typeof'],
    typescript: ['const', 'let', 'var', 'function', 'return', 'import', 'from', 'export', 'default', 'class', 'extends', 'interface', 'type', 'enum', 'implements', 'if', 'else', 'for', 'while', 'switch', 'case', 'break', 'async', 'await', 'try', 'catch', 'finally', 'new', 'this', 'typeof', 'as', 'readonly', 'public', 'private', 'protected'],
    python: ['def', 'class', 'return', 'import', 'from', 'as', 'if', 'elif', 'else', 'for', 'while', 'try', 'except', 'finally', 'with', 'lambda', 'yield', 'pass', 'break', 'continue', 'in', 'is', 'not', 'and', 'or', 'True', 'False', 'None'],
    csharp: ['using', 'namespace', 'class', 'struct', 'interface', 'public', 'private', 'protected', 'internal', 'static', 'void', 'string', 'int', 'bool', 'var', 'new', 'return', 'if', 'else', 'for', 'foreach', 'while', 'switch', 'case', 'break', 'try', 'catch', 'finally', 'async', 'await', 'get', 'set'],
    cpp: ['#include', 'using', 'namespace', 'class', 'struct', 'public', 'private', 'protected', 'virtual', 'override', 'void', 'int', 'bool', 'auto', 'const', 'return', 'if', 'else', 'for', 'while', 'switch', 'case', 'break', 'template', 'typename', 'new', 'delete', 'std'],
    json: ['true', 'false', 'null'],
    bash: ['echo', 'cd', 'ls', 'mkdir', 'rm', 'cp', 'mv', 'cat', 'grep', 'git', 'npm', 'pnpm', 'node', 'export', 'if', 'then', 'else', 'fi', 'for', 'in', 'do', 'done'],
  };

  const keywords = keywordsMap[lang] || keywordsMap.javascript;
  let code = escapedCode;

  // Strings (quoted)
  code = code.replace(/(&quot;.*?&quot;|&#39;.*?&#39;|`.*?`)/g, '<span class="gh-token-string">$1</span>');

  // Single-line Comments
  code = code.replace(/(\/\/[^\n]*|#[^\n]*)/g, '<span class="gh-token-comment">$1</span>');

  // Keywords
  const kwRegex = new RegExp(`\\b(${keywords.join('|')})\\b`, 'g');
  code = code.replace(kwRegex, '<span class="gh-token-keyword">$1</span>');

  // Numbers
  code = code.replace(/\b(\d+)\b/g, '<span class="gh-token-number">$1</span>');

  return code;
}


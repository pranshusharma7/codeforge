import { parseGitHubMarkdown, extractHeadings, type HeadingItem } from './githubMarkdown';

export interface GitHubPageOptions {
  markdown: string;
  fileName?: string;
  repoName?: string;
  username?: string;
  avatarUrl?: string;
  branch?: string;
  initialTheme?: 'dark' | 'light' | 'dimmed';
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function generateGitHubWebpageHtml(options: GitHubPageOptions): string {
  const {
    markdown = '',
    fileName = 'README.md',
    initialTheme = 'dark',
  } = options;

  const parsedHtml = parseGitHubMarkdown(markdown);
  const headings: HeadingItem[] = extractHeadings(markdown);

  const lines = markdown ? markdown.split('\n').length : 0;
  const bytes = new Blob([markdown || '']).size;
  const kb = (bytes / 1024).toFixed(1);
  const words = markdown ? markdown.trim().split(/\s+/).filter(Boolean).length : 0;
  const readTime = Math.max(1, Math.ceil(words / 200));

  // Build Table of Contents list
  let tocItemsHtml = '';
  if (headings.length > 0) {
    tocItemsHtml = headings
      .map(h => {
        const indentClass = h.level === 1 ? 'toc-h1' : h.level === 2 ? 'toc-h2' : 'toc-h3';
        return `<a href="#${h.id}" class="toc-link ${indentClass}" onclick="closeToc()">
          <span class="toc-dot"></span>
          <span class="toc-text">${escapeHtml(h.text)}</span>
        </a>`;
      })
      .join('\n');
  } else {
    tocItemsHtml = '<div class="toc-empty">No headings found in this document.</div>';
  }

  const escapedRawMarkdown = escapeHtml(markdown);

  return `<!DOCTYPE html>
<html lang="en" data-theme="${initialTheme === 'light' ? 'light' : 'dark'}">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(fileName)} — Document Preview</title>
  <link rel="icon" type="image/svg+xml" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' width='24' height='24' fill='none' stroke='%238b5cf6' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z'%3E%3C/path%3E%3Cpolyline points='14 2 14 8 20 8'%3E%3C/polyline%3E%3Cline x1='16' y1='13' x2='8' y2='13'%3E%3C/line%3E%3Cline x1='16' y1='17' x2='8' y2='17'%3E%3C/line%3E%3Cpolyline points='10 9 9 9 8 9'%3E%3C/polyline%3E%3C/svg%3E" />
  
  <style>
    /* ── 1. Modern Design Tokens ─────────────────────────────────────────── */
    :root, [data-theme="dark"] {
      --bg-page: #0b0f17;
      --bg-card: #111827;
      --bg-surface: #1e293b;
      --bg-header: rgba(11, 15, 23, 0.85);
      --border-color: #1f293d;
      --border-subtle: #2d3748;
      --text-main: #f1f5f9;
      --text-muted: #94a3b8;
      --text-dim: #64748b;
      --accent: #8b5cf6;
      --accent-hover: #7c3aed;
      --accent-subtle: rgba(139, 92, 246, 0.12);
      --code-bg: #0f172a;
      --table-zebra: rgba(30, 41, 59, 0.4);
      --btn-bg: #1e293b;
      --btn-hover: #334155;
      --btn-border: #334155;
      --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.3);
      --shadow-md: 0 4px 16px rgba(0, 0, 0, 0.4);
    }

    [data-theme="light"] {
      --bg-page: #f8fafc;
      --bg-card: #ffffff;
      --bg-surface: #f1f5f9;
      --bg-header: rgba(255, 255, 255, 0.88);
      --border-color: #e2e8f0;
      --border-subtle: #cbd5e1;
      --text-main: #0f172a;
      --text-muted: #64748b;
      --text-dim: #94a3b8;
      --accent: #7c3aed;
      --accent-hover: #6d28d9;
      --accent-subtle: rgba(124, 58, 237, 0.08);
      --code-bg: #f1f5f9;
      --table-zebra: #f8fafc;
      --btn-bg: #ffffff;
      --btn-hover: #f1f5f9;
      --btn-border: #e2e8f0;
      --shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.05);
      --shadow-md: 0 4px 16px rgba(0, 0, 0, 0.08);
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      background-color: var(--bg-page);
      color: var(--text-main);
      font-family: -apple-system, BlinkMacSystemFont, "Inter", "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      font-size: 15px;
      line-height: 1.7;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      transition: background-color 0.2s ease, color 0.2s ease;
      -webkit-font-smoothing: antialiased;
    }

    a {
      color: var(--accent);
      text-decoration: none;
      transition: opacity 0.15s;
    }
    a:hover {
      text-decoration: underline;
    }

    /* ── 2. Top Scroll Reading Progress Bar ───────────────────────────────── */
    #progress-bar {
      position: fixed;
      top: 0;
      left: 0;
      width: 0%;
      height: 3px;
      background: linear-gradient(90deg, #8b5cf6, #3b82f6, #10b981);
      z-index: 9999;
      transition: width 0.08s ease-out;
    }

    /* ── 3. Clean Modern Sticky Header ────────────────────────────────────── */
    .top-header {
      position: sticky;
      top: 0;
      background: var(--bg-header);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      border-bottom: 1px solid var(--border-color);
      z-index: 100;
      padding: 10px 20px;
    }

    .header-inner {
      max-width: 960px;
      margin: 0 auto;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      flex-wrap: wrap;
    }

    .header-left {
      display: flex;
      align-items: center;
      gap: 12px;
      flex-wrap: wrap;
    }

    .brand-pill {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: var(--accent-subtle);
      border: 1px solid rgba(139, 92, 246, 0.25);
      color: var(--accent);
      font-weight: 700;
      font-size: 12px;
      padding: 3px 10px;
      border-radius: 20px;
    }

    .doc-title-group {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .doc-name {
      font-size: 14px;
      font-weight: 600;
      color: var(--text-main);
    }

    .doc-meta {
      font-size: 11px;
      color: var(--text-muted);
      background: var(--bg-surface);
      border: 1px solid var(--border-color);
      padding: 2px 8px;
      border-radius: 12px;
      display: none;
    }
    @media (min-width: 640px) {
      .doc-meta { display: inline-flex; }
    }

    .header-right {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-wrap: wrap;
    }

    .btn {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: var(--btn-bg);
      border: 1px solid var(--btn-border);
      color: var(--text-main);
      padding: 5px 11px;
      border-radius: 8px;
      font-size: 12px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.15s ease;
      box-shadow: var(--shadow-sm);
    }
    .btn:hover {
      background: var(--btn-hover);
    }
    .btn:active {
      transform: scale(0.97);
    }

    .btn-segmented {
      display: inline-flex;
      background: var(--bg-surface);
      border: 1px solid var(--border-color);
      border-radius: 8px;
      padding: 2px;
      gap: 2px;
    }
    .btn-segmented button {
      background: transparent;
      border: none;
      color: var(--text-muted);
      padding: 3px 9px;
      border-radius: 6px;
      font-size: 12px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.15s ease;
    }
    .btn-segmented button.active {
      background: var(--bg-card);
      color: var(--accent);
      box-shadow: var(--shadow-sm);
      font-weight: 600;
    }

    /* ── 4. Table of Contents Slideout / Dropdown ─────────────────────────── */
    .toc-container {
      position: relative;
    }
    .toc-dropdown {
      position: absolute;
      top: 100%;
      right: 0;
      margin-top: 8px;
      width: 290px;
      max-height: 380px;
      overflow-y: auto;
      background: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: 12px;
      box-shadow: var(--shadow-md);
      padding: 10px 0;
      z-index: 200;
      display: none;
    }
    .toc-dropdown.show {
      display: block;
    }
    .toc-header-label {
      padding: 4px 14px 8px;
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--text-dim);
      border-bottom: 1px solid var(--border-color);
    }
    .toc-link {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 6px 14px;
      font-size: 13px;
      color: var(--text-main);
      text-decoration: none;
      transition: background 0.15s ease;
    }
    .toc-link:hover {
      background: var(--bg-surface);
      color: var(--accent);
      text-decoration: none;
    }
    .toc-h1 { font-weight: 600; }
    .toc-h2 { padding-left: 26px; color: var(--text-muted); font-size: 12.5px; }
    .toc-h3 { padding-left: 38px; color: var(--text-dim); font-size: 12px; }
    .toc-dot {
      width: 5px;
      height: 5px;
      border-radius: 50%;
      background: var(--accent);
      flex-shrink: 0;
      opacity: 0.6;
    }
    .toc-empty {
      padding: 16px;
      color: var(--text-muted);
      font-size: 13px;
      text-align: center;
    }

    /* ── 5. Main Content Document Layout ──────────────────────────────────── */
    .doc-wrapper {
      max-width: 860px;
      width: 100%;
      margin: 28px auto 60px;
      padding: 0 20px;
      flex: 1;
    }

    .doc-card {
      background: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: 16px;
      box-shadow: var(--shadow-md);
      overflow: hidden;
      transition: border-color 0.2s ease;
    }

    /* Article Body Typography */
    .doc-content {
      padding: 40px 48px;
      word-break: break-word;
    }

    @media (max-width: 640px) {
      .doc-content {
        padding: 24px 20px;
      }
      .doc-wrapper {
        margin-top: 16px;
        padding: 0 12px;
      }
    }

    /* Headings */
    .gh-h {
      margin-top: 32px;
      margin-bottom: 16px;
      font-weight: 700;
      line-height: 1.3;
      color: var(--text-main);
      position: relative;
    }
    .gh-h1 {
      font-size: 2.1em;
      letter-spacing: -0.02em;
      margin-top: 0;
      padding-bottom: 12px;
      border-bottom: 1px solid var(--border-color);
    }
    .gh-h2 {
      font-size: 1.55em;
      letter-spacing: -0.015em;
      padding-bottom: 8px;
      border-bottom: 1px solid var(--border-color);
    }
    .gh-h3 { font-size: 1.28em; }
    .gh-h4 { font-size: 1.1em; }
    .gh-h5 { font-size: 0.95em; }
    .gh-h6 { font-size: 0.85em; color: var(--text-muted); text-transform: uppercase; }

    .gh-header-anchor {
      position: absolute;
      left: -22px;
      top: 0;
      bottom: 0;
      display: inline-flex;
      align-items: center;
      opacity: 0;
      color: var(--text-dim);
      text-decoration: none;
      transition: opacity 0.15s;
    }
    .gh-h:hover .gh-header-anchor {
      opacity: 1;
    }

    .gh-p {
      margin-top: 0;
      margin-bottom: 18px;
      color: var(--text-main);
      font-size: 15.5px;
      line-height: 1.75;
    }

    /* Blockquotes */
    .gh-blockquote {
      padding: 12px 18px;
      margin: 20px 0;
      background: var(--bg-surface);
      border-left: 4px solid var(--accent);
      border-radius: 0 8px 8px 0;
      color: var(--text-muted);
      font-style: italic;
    }

    /* Horizontal Rules */
    .gh-hr {
      height: 1px;
      background-color: var(--border-color);
      border: 0;
      margin: 32px 0;
    }

    /* Inline Code */
    .gh-inline-code {
      padding: 2px 6px;
      font-size: 85%;
      background-color: var(--code-bg);
      border: 1px solid var(--border-color);
      border-radius: 5px;
      font-family: ui-monospace, SFMono-Regular, "JetBrains Mono", Menlo, Consolas, monospace;
      color: var(--accent);
    }

    /* Callout Alerts */
    .gh-alert {
      padding: 14px 18px;
      margin: 20px 0;
      border-left: 4px solid;
      border-radius: 8px;
      background-color: var(--bg-surface);
      box-shadow: var(--shadow-sm);
    }
    .gh-alert-title {
      display: flex;
      align-items: center;
      gap: 8px;
      font-weight: 600;
      font-size: 13.5px;
      margin-bottom: 6px;
    }
    .gh-alert-body {
      font-size: 14px;
      color: var(--text-main);
      line-height: 1.6;
    }
    .gh-alert-note { border-left-color: #3b82f6; }
    .gh-alert-note .gh-alert-title { color: #3b82f6; }
    .gh-alert-tip { border-left-color: #10b981; }
    .gh-alert-tip .gh-alert-title { color: #10b981; }
    .gh-alert-important { border-left-color: #8b5cf6; }
    .gh-alert-important .gh-alert-title { color: #8b5cf6; }
    .gh-alert-warning { border-left-color: #f59e0b; }
    .gh-alert-warning .gh-alert-title { color: #f59e0b; }
    .gh-alert-caution { border-left-color: #ef4444; }
    .gh-alert-caution .gh-alert-title { color: #ef4444; }

    /* Tables */
    .gh-table-wrapper {
      width: 100%;
      overflow-x: auto;
      margin: 20px 0;
      border: 1px solid var(--border-color);
      border-radius: 10px;
    }
    .gh-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 14px;
      text-align: left;
    }
    .gh-table th, .gh-table td {
      padding: 10px 16px;
      border-bottom: 1px solid var(--border-color);
    }
    .gh-table th {
      font-weight: 600;
      background-color: var(--bg-surface);
      color: var(--text-main);
    }
    .gh-table tr:nth-child(even) {
      background-color: var(--table-zebra);
    }
    .gh-table tr:last-child td {
      border-bottom: none;
    }

    /* Lists & Task Items */
    .gh-ul, .gh-ol {
      padding-left: 24px;
      margin: 16px 0;
      color: var(--text-main);
    }
    .gh-ul li, .gh-ol li {
      margin-bottom: 6px;
    }
    .gh-task-list {
      list-style-type: none;
      padding-left: 0;
      margin: 16px 0;
    }
    .gh-task-item {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 8px;
    }
    .gh-task-checkbox {
      width: 16px;
      height: 16px;
      cursor: pointer;
      accent-color: var(--accent);
      border-radius: 4px;
    }
    .gh-task-checked {
      text-decoration: line-through;
      color: var(--text-muted);
    }

    /* Code Blocks */
    .gh-code-block {
      border: 1px solid var(--border-color);
      border-radius: 10px;
      background-color: var(--code-bg);
      margin: 20px 0;
      overflow: hidden;
      box-shadow: var(--shadow-sm);
    }
    .gh-code-header {
      background-color: var(--bg-surface);
      border-bottom: 1px solid var(--border-color);
      padding: 7px 14px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-size: 11px;
    }
    .gh-code-lang {
      font-family: ui-monospace, SFMono-Regular, "JetBrains Mono", Menlo, Consolas, monospace;
      color: var(--text-muted);
      text-transform: uppercase;
      font-weight: 600;
      letter-spacing: 0.05em;
    }
    .gh-copy-code-btn {
      background: var(--btn-bg);
      border: 1px solid var(--btn-border);
      color: var(--text-main);
      padding: 2px 9px;
      border-radius: 5px;
      font-size: 11px;
      display: inline-flex;
      align-items: center;
      gap: 4px;
      cursor: pointer;
      transition: all 0.15s;
    }
    .gh-copy-code-btn:hover {
      background: var(--btn-hover);
    }
    .gh-pre {
      padding: 16px 18px;
      overflow-x: auto;
      font-family: ui-monospace, SFMono-Regular, "JetBrains Mono", Menlo, Consolas, monospace;
      font-size: 13px;
      line-height: 1.65;
      margin: 0;
    }
    .gh-code {
      color: var(--text-main);
    }

    /* Badges & Images */
    .gh-badge-link {
      display: inline-block;
      margin-right: 6px;
      margin-bottom: 6px;
    }
    .gh-badge-img {
      vertical-align: middle;
      border-radius: 4px;
    }
    .gh-img {
      max-width: 100%;
      height: auto;
      border-radius: 8px;
      margin: 12px 0;
    }

    /* Syntax Tokens */
    .gh-token-keyword { color: #f43f5e; font-weight: 600; }
    .gh-token-string { color: #38bdf8; }
    .gh-token-comment { color: #64748b; font-style: italic; }
    .gh-token-number { color: #fbbf24; }

    [data-theme="light"] .gh-token-keyword { color: #e11d48; }
    [data-theme="light"] .gh-token-string { color: #0284c7; }
    [data-theme="light"] .gh-token-comment { color: #94a3b8; }
    [data-theme="light"] .gh-token-number { color: #d97706; }

    /* Raw Source View */
    #raw-view {
      display: none;
      padding: 24px 32px;
      background: var(--bg-card);
    }
    #raw-view pre {
      font-family: ui-monospace, SFMono-Regular, "JetBrains Mono", Menlo, Consolas, monospace;
      font-size: 13px;
      line-height: 1.65;
      white-space: pre-wrap;
      word-break: break-all;
      color: var(--text-main);
    }

    /* ── 6. Toast Notification ───────────────────────────────────────────── */
    #toast-msg {
      position: fixed;
      bottom: 24px;
      left: 50%;
      transform: translateX(-50%) translateY(100px);
      background: var(--text-main);
      color: var(--bg-card);
      padding: 9px 20px;
      border-radius: 30px;
      font-size: 13px;
      font-weight: 600;
      box-shadow: 0 6px 20px rgba(0,0,0,0.3);
      z-index: 99999;
      opacity: 0;
      pointer-events: none;
      transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
    }
    #toast-msg.show {
      transform: translateX(-50%) translateY(0);
      opacity: 1;
    }

    /* ── 7. Clean Minimal Footer ─────────────────────────────────────────── */
    .page-footer {
      border-top: 1px solid var(--border-color);
      padding: 28px 20px;
      margin-top: auto;
      text-align: center;
      font-size: 13px;
      color: var(--text-muted);
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 16px;
      flex-wrap: wrap;
    }
    .page-footer a {
      color: var(--text-muted);
    }
    .page-footer a:hover {
      color: var(--accent);
    }
  </style>
</head>
<body>

  <!-- Top Scroll Reading Progress Bar -->
  <div id="progress-bar"></div>

  <!-- ── 1. Clean Modern Top Header ────────────────────────────────────────── -->
  <header class="top-header">
    <div class="header-inner">
      <div class="header-left">
        <div class="brand-pill">
          <span>⚡</span>
          <span>CodeForge</span>
        </div>
        <div class="doc-title-group">
          <span class="doc-name">${escapeHtml(fileName)}</span>
          <span class="doc-meta">${lines} lines · ${words} words · ⏱️ ${readTime} min read</span>
        </div>
      </div>

      <div class="header-right">
        <!-- Table of Contents Outline Button -->
        <div class="toc-container">
          <button id="toc-btn" class="btn" onclick="toggleToc()" title="Table of Contents">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line></svg>
            <span>Outline</span>
          </button>

          <div id="toc-dropdown" class="toc-dropdown">
            <div class="toc-header-label">Document Outline</div>
            ${tocItemsHtml}
          </div>
        </div>

        <!-- Mode Toggle: Preview vs Raw -->
        <div class="btn-segmented">
          <button id="btn-mode-prev" class="active" onclick="switchView('preview')">Preview</button>
          <button id="btn-mode-code" onclick="switchView('raw')">Source</button>
        </div>

        <!-- Copy Markdown Button -->
        <button class="btn" onclick="copyDocument()" title="Copy Markdown to clipboard">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
          <span>Copy</span>
        </button>

        <!-- Download .md Button -->
        <button class="btn" onclick="downloadFile()" title="Download ${escapeHtml(fileName)}">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
          <span>Download</span>
        </button>

        <!-- Print Button -->
        <button class="btn" onclick="window.print()" title="Print / Save to PDF">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>
        </button>

        <!-- Theme Toggle Button -->
        <button id="theme-btn" class="btn" onclick="toggleTheme()" title="Toggle Dark/Light Mode">
          <span id="theme-icon">🌙</span>
        </button>

        <!-- Close Window Button -->
        <button class="btn" onclick="window.close()" title="Close this page">
          <span>✕</span>
        </button>
      </div>
    </div>
  </header>

  <!-- ── 2. Clean Centered Document Card ───────────────────────────────────── -->
  <main class="doc-wrapper">
    <div class="doc-card">
      <!-- Rendered Markdown View -->
      <article id="preview-view" class="doc-content">
        ${parsedHtml}
      </article>

      <!-- Raw Markdown Source Code -->
      <div id="raw-view">
        <pre><code>${escapedRawMarkdown}</code></pre>
      </div>
    </div>
  </main>

  <!-- ── 3. Toast Message ─────────────────────────────────────────────────── -->
  <div id="toast-msg">✓ Copied to clipboard!</div>

  <!-- ── 4. Minimal Clean Footer ───────────────────────────────────────────── -->
  <footer class="page-footer">
    <span>Document rendered with <strong>CodeForge</strong> · ${escapeHtml(fileName)}</span>
    <span>•</span>
    <a href="#" onclick="window.scrollTo({top: 0, behavior: 'smooth'}); return false;">Back to top ↑</a>
    <span>•</span>
    <a href="#" onclick="window.print(); return false;">Print</a>
  </footer>

  <!-- ── 5. Client-Side Interactive Scripts ────────────────────────────────── -->
  <script>
    const markdownSource = ${JSON.stringify(markdown)};
    const currentFileName = ${JSON.stringify(fileName)};

    // ── Theme Toggling with LocalStorage ───────────────────────────────────
    function applyTheme(theme) {
      document.documentElement.setAttribute('data-theme', theme);
      const icon = document.getElementById('theme-icon');
      if (icon) icon.textContent = theme === 'light' ? '☀️' : '🌙';
      try {
        localStorage.setItem('cf_preview_theme', theme);
      } catch (e) {}
    }

    function toggleTheme() {
      const current = document.documentElement.getAttribute('data-theme') || 'dark';
      const next = current === 'dark' ? 'light' : 'dark';
      applyTheme(next);
    }

    try {
      const savedTheme = localStorage.getItem('cf_preview_theme');
      if (savedTheme) applyTheme(savedTheme);
    } catch (e) {}

    // ── Reading Progress Bar ───────────────────────────────────────────────
    window.addEventListener('scroll', () => {
      const docHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      const progress = docHeight > 0 ? (window.scrollY / docHeight) * 100 : 0;
      const bar = document.getElementById('progress-bar');
      if (bar) bar.style.width = progress + '%';
    });

    // ── Table of Contents Toggle ───────────────────────────────────────────
    function toggleToc() {
      const dropdown = document.getElementById('toc-dropdown');
      if (dropdown) dropdown.classList.toggle('show');
    }

    function closeToc() {
      const dropdown = document.getElementById('toc-dropdown');
      if (dropdown) dropdown.classList.remove('show');
    }

    window.addEventListener('click', (e) => {
      const container = document.querySelector('.toc-container');
      if (container && !container.contains(e.target)) {
        closeToc();
      }
    });

    // ── Switch View: Preview vs Raw ────────────────────────────────────────
    function switchView(mode) {
      const prev = document.getElementById('preview-view');
      const raw = document.getElementById('raw-view');
      const btnPrev = document.getElementById('btn-mode-prev');
      const btnCode = document.getElementById('btn-mode-code');

      if (mode === 'preview') {
        if (prev) prev.style.display = 'block';
        if (raw) raw.style.display = 'none';
        if (btnPrev) btnPrev.classList.add('active');
        if (btnCode) btnCode.classList.remove('active');
      } else {
        if (prev) prev.style.display = 'none';
        if (raw) raw.style.display = 'block';
        if (btnPrev) btnPrev.classList.remove('active');
        if (btnCode) btnCode.classList.add('active');
      }
    }

    // ── Toast Notification ─────────────────────────────────────────────────
    function showToast(message) {
      const toast = document.getElementById('toast-msg');
      if (!toast) return;
      toast.textContent = message;
      toast.classList.add('show');
      setTimeout(() => {
        toast.classList.remove('show');
      }, 2200);
    }

    // ── Copy Markdown ──────────────────────────────────────────────────────
    async function copyDocument() {
      try {
        await navigator.clipboard.writeText(markdownSource);
        showToast('✓ Copied ' + currentFileName + ' to clipboard!');
      } catch (err) {
        showToast('Failed to copy');
      }
    }

    // ── Download Markdown File ─────────────────────────────────────────────
    function downloadFile() {
      const blob = new Blob([markdownSource], { type: 'text/markdown;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = currentFileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showToast('⬇️ Downloaded ' + currentFileName);
    }

    // ── Code Block Copy Button Listeners ───────────────────────────────────
    document.querySelectorAll('.gh-copy-code-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const rawCode = decodeURIComponent(btn.getAttribute('data-code') || '');
        if (!rawCode) return;
        try {
          await navigator.clipboard.writeText(rawCode);
          const orig = btn.innerHTML;
          btn.innerHTML = '<span>✓ Copied!</span>';
          setTimeout(() => { btn.innerHTML = orig; }, 2000);
          showToast('✓ Code snippet copied!');
        } catch (e) {
          showToast('Failed to copy code');
        }
      });
    });
  </script>
</body>
</html>`;
}

/**
 * Open the generated clean Webpage in a brand-new browser tab
 */
export function openGitHubWebpage(options: GitHubPageOptions): Window | null {
  const html = generateGitHubWebpageHtml(options);
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const win = window.open(url, '_blank');
  return win;
}

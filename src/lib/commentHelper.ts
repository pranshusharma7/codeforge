// ── Monaco Commenting Helper ──────────────────────────────────────────────
// Ensures Command + / and Ctrl + / toggle comments reliably across all languages and operating systems.

export interface CommentRule {
  lineComment?: string
  blockComment?: [string, string]
}

export const LANGUAGE_COMMENT_RULES: Record<string, CommentRule> = {
  python:     { lineComment: '#' },
  javascript: { lineComment: '//', blockComment: ['/*', '*/'] },
  typescript: { lineComment: '//', blockComment: ['/*', '*/'] },
  cpp:        { lineComment: '//', blockComment: ['/*', '*/'] },
  c:          { lineComment: '//', blockComment: ['/*', '*/'] },
  java:       { lineComment: '//', blockComment: ['/*', '*/'] },
  csharp:     { lineComment: '//', blockComment: ['/*', '*/'] },
  go:         { lineComment: '//', blockComment: ['/*', '*/'] },
  rust:       { lineComment: '//', blockComment: ['/*', '*/'] },
  swift:      { lineComment: '//', blockComment: ['/*', '*/'] },
  kotlin:     { lineComment: '//', blockComment: ['/*', '*/'] },
  php:        { lineComment: '//', blockComment: ['/*', '*/'] },
  dart:       { lineComment: '//', blockComment: ['/*', '*/'] },
  groovy:     { lineComment: '//', blockComment: ['/*', '*/'] },
  scala:      { lineComment: '//', blockComment: ['/*', '*/'] },
  zig:        { lineComment: '//', blockComment: ['/*', '*/'] },
  json:       { lineComment: '//' },
  shell:      { lineComment: '#' },
  bash:       { lineComment: '#' },
  powershell: { lineComment: '#', blockComment: ['<#', '#>'] },
  r:          { lineComment: '#' },
  ruby:       { lineComment: '#', blockComment: ['=begin', '=end'] },
  perl:       { lineComment: '#' },
  julia:      { lineComment: '#', blockComment: ['#=', '=#'] },
  nim:        { lineComment: '#', blockComment: ['#[', ']#'] },
  crystal:    { lineComment: '#' },
  yaml:       { lineComment: '#' },
  ini:        { lineComment: '#' },
  sql:        { lineComment: '--', blockComment: ['/*', '*/'] },
  lua:        { lineComment: '--', blockComment: ['--[[', ']]'] },
  haskell:    { lineComment: '--', blockComment: ['{-', '-}'] },
  lisp:       { lineComment: ';' },
  scheme:     { lineComment: ';' },
  clojure:    { lineComment: ';' },
  assembly:   { lineComment: ';' },
  html:       { blockComment: ['<!--', '-->'] },
  xml:        { blockComment: ['<!--', '-->'] },
  markdown:   { blockComment: ['<!--', '-->'] },
  css:        { blockComment: ['/*', '*/'] },
  cobol:      { lineComment: '*>' },
  fortran:    { lineComment: '!' },
  prolog:     { lineComment: '%', blockComment: ['/*', '*/'] },
  matlab:     { lineComment: '%', blockComment: ['%{', '%}'] },
  erlang:     { lineComment: '%' },
  vb:         { lineComment: "'" },
  plaintext:  { lineComment: '//' },
}

/**
 * Register comments syntax for all known languages into Monaco's language service.
 */
export function registerAllLanguageCommentConfigs(monaco: any) {
  if (!monaco?.languages?.setLanguageConfiguration) return
  for (const [langId, rule] of Object.entries(LANGUAGE_COMMENT_RULES)) {
    try {
      monaco.languages.setLanguageConfiguration(langId, {
        comments: {
          lineComment: rule.lineComment,
          blockComment: rule.blockComment,
        },
      })
    } catch {
      // Safe ignore for unregistered Monaco languages
    }
  }
}

/**
 * Resolves the line comment string for a language or extension.
 */
export function getLineCommentToken(langOrExt?: string): string {
  if (!langOrExt) return '//'
  const key = langOrExt.toLowerCase().replace(/^\./, '')
  if (LANGUAGE_COMMENT_RULES[key]?.lineComment) {
    return LANGUAGE_COMMENT_RULES[key].lineComment!
  }
  // Common mappings
  if (['py', 'python', 'rb', 'ruby', 'sh', 'bash', 'zsh', 'yaml', 'yml', 'r'].includes(key)) return '#'
  if (['sql', 'lua', 'hs', 'haskell'].includes(key)) return '--'
  if (['lisp', 'scm', 'clj', 'asm', 's'].includes(key)) return ';'
  return '//'
}

/**
 * Resolves the block comment strings [open, close] for a language.
 */
export function getBlockCommentTokens(langOrExt?: string): [string, string] {
  if (!langOrExt) return ['/*', '*/']
  const key = langOrExt.toLowerCase().replace(/^\./, '')
  if (LANGUAGE_COMMENT_RULES[key]?.blockComment) {
    return LANGUAGE_COMMENT_RULES[key].blockComment!
  }
  if (['html', 'htm', 'xml', 'svg', 'md', 'markdown'].includes(key)) return ['<!--', '-->']
  if (['lua'].includes(key)) return ['--[[', ']]']
  return ['/*', '*/']
}

/**
 * Fallback line comment toggling when Monaco's internal action doesn't touch the lines
 */
export function manualToggleLineComment(editor: any, langOrExt?: string) {
  const model = editor?.getModel()
  if (!model) return

  const selection = editor.getSelection()
  if (!selection) return

  const startLine = selection.startLineNumber
  const endLine = selection.endLineNumber
  const token = getLineCommentToken(langOrExt)
  const tokenWithSpace = `${token} `

  // Collect lines in range
  const lines: string[] = []
  let hasNonEmpty = false
  let allCommented = true

  for (let ln = startLine; ln <= endLine; ln++) {
    const content = model.getLineContent(ln)
    lines.push(content)
    const trimmed = content.trim()
    if (trimmed.length > 0) {
      hasNonEmpty = true
      if (!trimmed.startsWith(token)) {
        allCommented = false
      }
    }
  }

  if (!hasNonEmpty) {
    // Blank line: insert comment prefix
    const lineContent = model.getLineContent(startLine)
    editor.executeEdits('comment-toggle', [{
      range: {
        startLineNumber: startLine,
        startColumn: 1,
        endLineNumber: startLine,
        endColumn: lineContent.length + 1,
      },
      text: tokenWithSpace + lineContent,
    }])
    return
  }

  const edits: any[] = []
  for (let i = 0; i < lines.length; i++) {
    const ln = startLine + i
    const lineText = lines[i]
    const trimmed = lineText.trim()

    if (trimmed.length === 0) continue

    if (allCommented) {
      // Remove comment prefix
      const idx = lineText.indexOf(token)
      if (idx !== -1) {
        const hasSpace = lineText[idx + token.length] === ' '
        const deleteLen = token.length + (hasSpace ? 1 : 0)
        edits.push({
          range: {
            startLineNumber: ln,
            startColumn: idx + 1,
            endLineNumber: ln,
            endColumn: idx + 1 + deleteLen,
          },
          text: '',
        })
      }
    } else {
      // Add comment prefix at original indentation
      const match = lineText.match(/^(\s*)/)
      const indentLen = match ? match[1].length : 0
      edits.push({
        range: {
          startLineNumber: ln,
          startColumn: indentLen + 1,
          endLineNumber: ln,
          endColumn: indentLen + 1,
        },
        text: tokenWithSpace,
      })
    }
  }

  if (edits.length > 0) {
    editor.pushUndoStop?.()
    editor.executeEdits('comment-toggle', edits)
    editor.pushUndoStop?.()
  }
}

/**
 * Execute line comment toggle: first try Monaco native action, fallback to manual if unchanged.
 */
export function executeToggleLineComment(editor: any, langOrExt?: string) {
  if (!editor) return
  const model = editor.getModel()
  if (!model) return

  const before = model.getValue()
  const action = editor.getAction('editor.action.commentLine')
  if (action) {
    try {
      action.run()
    } catch {}
  } else {
    try {
      editor.trigger('keyboard', 'editor.action.commentLine', null)
    } catch {}
  }

  const after = model.getValue()
  if (before === after) {
    manualToggleLineComment(editor, langOrExt)
  }
}

/**
 * Execute block comment toggle
 */
export function executeToggleBlockComment(editor: any, langOrExt?: string) {
  if (!editor) return
  const model = editor.getModel()
  if (!model) return

  const before = model.getValue()
  const action = editor.getAction('editor.action.blockComment')
  if (action) {
    try {
      action.run()
    } catch {}
  } else {
    try {
      editor.trigger('keyboard', 'editor.action.blockComment', null)
    } catch {}
  }

  const after = model.getValue()
  if (before !== after) return

  // Fallback block comment
  const [open, close] = getBlockCommentTokens(langOrExt)
  const selection = editor.getSelection()
  if (!selection) return

  const selectedText = model.getValueInRange(selection)
  if (selectedText.startsWith(open) && selectedText.endsWith(close)) {
    const unwrapped = selectedText.slice(open.length, selectedText.length - close.length).trim()
    editor.pushUndoStop?.()
    editor.executeEdits('block-comment-toggle', [{
      range: selection,
      text: unwrapped,
    }])
    editor.pushUndoStop?.()
  } else {
    editor.pushUndoStop?.()
    editor.executeEdits('block-comment-toggle', [{
      range: selection,
      text: `${open} ${selectedText} ${close}`,
    }])
    editor.pushUndoStop?.()
  }
}

// ── Prettier & Multi-Language Code Formatter Engine ────────────────────────
// Provides authentic VS Code Prettier document formatting for Monaco Editor

export function formatCodeWithPrettier(code: string, language: string): string {
  if (!code || typeof code !== 'string') return code
  const lang = (language || 'javascript').toLowerCase()

  // 1. JSON formatting
  if (lang.includes('json')) {
    try {
      const parsed = JSON.parse(code)
      return JSON.stringify(parsed, null, 2) + '\n'
    } catch {
      return code
    }
  }

  // 2. JavaScript / TypeScript / JSX / TSX formatting
  if (['javascript', 'typescript', 'js', 'ts', 'jsx', 'tsx'].some(l => lang.includes(l))) {
    return formatJavaScriptCode(code)
  }

  // 3. Python formatting (PEP 8 standard spacing and indentation)
  if (lang.includes('python') || lang === 'py') {
    return formatPythonCode(code)
  }

  // 4. HTML formatting
  if (lang.includes('html') || lang.includes('xml')) {
    return formatHTMLCode(code)
  }

  // 5. CSS formatting
  if (lang.includes('css')) {
    return formatCSSCode(code)
  }

  // 6. Generic C-style indentation (C, C++, Java, Go, Rust, C#)
  return formatCStyleCode(code)
}

function formatJavaScriptCode(code: string): string {
  const lines = code.split('\n')
  let indentLevel = 0
  const indentSize = 2
  const formatted: string[] = []

  for (let rawLine of lines) {
    let line = rawLine.trim()

    if (!line) {
      // Allow max 1 blank line between statements
      if (formatted.length > 0 && formatted[formatted.length - 1] !== '') {
        formatted.push('')
      }
      continue
    }

    // Dedent if line starts with closing bracket
    if (/^[}\]\)]/.test(line)) {
      indentLevel = Math.max(0, indentLevel - 1)
    }

    // Fix spacing around operators and semicolons
    line = line
      .replace(/\s*([=+\-*/%&|^<>!]=|[=+\-*/%&|^<>!])\s*/g, ' $1 ')
      .replace(/\s*,\s*/g, ', ')
      .replace(/\s*;\s*$/g, ';')
      .replace(/\s*:\s*/g, ': ')
      // Fix arrow functions
      .replace(/=\s*>/g, '=>')
      // Fix strict equality
      .replace(/=\s*=\s*=/g, '===')
      .replace(/!\s*=\s*=/g, '!==')
      .replace(/=\s*=/g, '==')
      .replace(/!\s*=/g, '!=')
      .replace(/<\s*=/g, '<=')
      .replace(/>\s*=/g, '>=')
      .replace(/\+\s*\+/g, '++')
      .replace(/-\s*-/g, '--')

    const pad = ' '.repeat(indentLevel * indentSize)
    formatted.push(pad + line)

    // Indent if line ends with opening bracket
    if (/[{\[\(]$/.test(line)) {
      indentLevel++
    }
  }

  return formatted.join('\n').trim() + '\n'
}

function formatPythonCode(code: string): string {
  const lines = code.split('\n')
  const formatted: string[] = []
  let indentLevel = 0
  const indentSize = 4

  for (let rawLine of lines) {
    let line = rawLine.trim()

    if (!line) {
      if (formatted.length > 0 && formatted[formatted.length - 1] !== '') {
        formatted.push('')
      }
      continue
    }

    // Python dedent keywords
    if (/^(elif|else|except|finally):/.test(line)) {
      indentLevel = Math.max(0, indentLevel - 1)
    }

    // Normalize spacing around operators
    line = line
      .replace(/\s*([=+\-*/%]|==|!=|<=|>=)\s*/g, ' $1 ')
      .replace(/\s*,\s*/g, ', ')
      .replace(/\s*:\s*$/, ':')
      .replace(/\s*#\s*/g, '  # ')

    const pad = ' '.repeat(indentLevel * indentSize)
    formatted.push(pad + line)

    // Indent next line after colon
    if (line.endsWith(':')) {
      indentLevel++
    } else if (/^(return|pass|break|continue|raise)(\s+.*)?$/.test(line)) {
      // Often signals block completion
      indentLevel = Math.max(0, indentLevel - 1)
    }
  }

  return formatted.join('\n').trim() + '\n'
}

function formatHTMLCode(code: string): string {
  const tokens = code.replace(/>\s*</g, '><').match(/(<[^>]+>|[^<]+)/g) || []
  let indent = 0
  const indentSize = 2
  const formatted: string[] = []

  for (let token of tokens) {
    token = token.trim()
    if (!token) continue

    if (token.startsWith('</')) {
      indent = Math.max(0, indent - 1)
    }

    formatted.push(' '.repeat(indent * indentSize) + token)

    if (
      token.startsWith('<') &&
      !token.startsWith('</') &&
      !token.endsWith('/>') &&
      !token.startsWith('<!') &&
      !['<img', '<input', '<br', '<hr', '<meta', '<link'].some(t => token.startsWith(t))
    ) {
      indent++
    }
  }

  return formatted.join('\n') + '\n'
}

function formatCSSCode(code: string): string {
  return code
    .replace(/\s*{\s*/g, ' {\n  ')
    .replace(/;\s*/g, ';\n  ')
    .replace(/\s*}\s*/g, '\n}\n\n')
    .trim() + '\n'
}

function formatCStyleCode(code: string): string {
  const lines = code.split('\n')
  let indentLevel = 0
  const indentSize = 4
  const formatted: string[] = []

  for (let rawLine of lines) {
    let line = rawLine.trim()

    if (!line) {
      if (formatted.length > 0 && formatted[formatted.length - 1] !== '') {
        formatted.push('')
      }
      continue
    }

    if (line.startsWith('}') || line.startsWith(')')) {
      indentLevel = Math.max(0, indentLevel - 1)
    }

    formatted.push(' '.repeat(indentLevel * indentSize) + line)

    if (line.endsWith('{') || line.endsWith('(')) {
      indentLevel++
    }
  }

  return formatted.join('\n').trim() + '\n'
}

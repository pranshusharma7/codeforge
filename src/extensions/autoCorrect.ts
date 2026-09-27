import type { AutoCorrectResult, ExtensionLinterRule } from './types'

const COMMON_TYPOS: Record<string, string> = {
  'prnit': 'print',
  'fucntion': 'function',
  'funtion': 'function',
  'retrun': 'return',
  'cosnt': 'const',
  'whlie': 'while',
  'improt': 'import',
  'lenght': 'length',
  'consol.log': 'console.log',
  'consle.log': 'console.log',
  'flase': 'false',
  'ture': 'true',
  'undifined': 'undefined',
  'inlcude': 'include',
  'sturct': 'struct',
  'pubilc': 'public',
  'staic': 'static',
  'vodi': 'void'
}

/**
 * Scans and auto-corrects code errors, typos, and syntax mistakes
 */
export function runAutoCorrect(
  code: string,
  langId: string,
  customRules: ExtensionLinterRule[] = []
): AutoCorrectResult {
  const lines = code.split('\n')
  const fixes: string[] = []
  let changesCount = 0

  const isPython = langId.includes('python') || langId === 'py'

  const correctedLines = lines.map((line, idx) => {
    let modified = line
    const lineNum = idx + 1

    // 1. Check custom uploaded extension linter rules
    for (const rule of customRules) {
      if (rule.pattern && rule.replacement && modified.includes(rule.pattern)) {
        modified = modified.split(rule.pattern).join(rule.replacement)
        fixes.push(`Line ${lineNum}: ${rule.message || `Replaced '${rule.pattern}' with '${rule.replacement}'`}`)
        changesCount++
      }
    }

    // 2. Check common keyword typos
    for (const [typo, fix] of Object.entries(COMMON_TYPOS)) {
      const regex = new RegExp(`\\b${typo}\\b`, 'g')
      if (regex.test(modified)) {
        modified = modified.replace(regex, fix)
        fixes.push(`Line ${lineNum}: Fixed typo '${typo}' ➔ '${fix}'`)
        changesCount++
      }
    }

    // 3. Python specific auto-corrects: Missing colons
    if (isPython) {
      const trimmed = modified.trim()
      // Keywords that require a trailing colon in Python
      const needsColonRegex = /^(if\s+.+|elif\s+.+|else|for\s+.+|while\s+.+|def\s+.+|class\s+.+|try|except.*|finally|with\s+.+)$/
      if (needsColonRegex.test(trimmed) && !trimmed.endsWith(':') && !trimmed.endsWith('\\') && !trimmed.startsWith('#')) {
        modified = modified + ':'
        fixes.push(`Line ${lineNum}: Added missing colon ':' at end of '${trimmed}'`)
        changesCount++
      }
    }

    return modified
  })

  return {
    correctedCode: correctedLines.join('\n'),
    changesCount,
    fixes
  }
}

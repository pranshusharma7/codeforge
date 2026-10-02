// ── ESLint & Smart Auto-Correct Real-time Linter for Monaco ─────────────────
import type { ExtensionLinterRule } from './types'

export interface LintProblem {
  line: number
  startColumn: number
  endColumn: number
  message: string
  severity: 'error' | 'warning' | 'info'
  ruleId?: string
}

export function runRealTimeLint(
  code: string,
  language: string,
  isEslintEnabled: boolean,
  isAutoCorrectEnabled: boolean,
  customRules: ExtensionLinterRule[] = []
): LintProblem[] {
  const problems: LintProblem[] = []
  if (!code) return problems

  const lines = code.split('\n')
  const lang = (language || 'javascript').toLowerCase()
  const isJS = ['javascript', 'typescript', 'js', 'ts', 'jsx', 'tsx'].some(l => lang.includes(l))
  const isPython = lang.includes('python') || lang === 'py'

  // 1. Official ESLint Rules
  if (isEslintEnabled && isJS) {
    lines.forEach((line, index) => {
      const lineNum = index + 1
      const trimmed = line.trim()

      // Ignore comments
      if (trimmed.startsWith('//') || trimmed.startsWith('/*')) return

      // eqeqeq: == instead of ===
      const eqMatches = [...line.matchAll(/([^=!<>])(==)([^=])/g)]
      for (const m of eqMatches) {
        if (m.index !== undefined) {
          const col = m.index + m[1].length + 1
          problems.push({
            line: lineNum,
            startColumn: col,
            endColumn: col + 2,
            message: 'ESLint: Expected "===" and instead saw "==" (eqeqeq)',
            severity: 'warning',
            ruleId: 'eqeqeq'
          })
        }
      }

      // no-var: var instead of let/const
      const varMatches = [...line.matchAll(/\b(var)\s+/g)]
      for (const m of varMatches) {
        if (m.index !== undefined) {
          problems.push({
            line: lineNum,
            startColumn: m.index + 1,
            endColumn: m.index + 4,
            message: 'ESLint: Unexpected var, use let or const instead (no-var)',
            severity: 'warning',
            ruleId: 'no-var'
          })
        }
      }

      // no-debugger
      const debugMatch = line.indexOf('debugger')
      if (debugMatch !== -1) {
        problems.push({
          line: lineNum,
          startColumn: debugMatch + 1,
          endColumn: debugMatch + 9,
          message: "ESLint: Unexpected 'debugger' statement (no-debugger)",
          severity: 'warning',
          ruleId: 'no-debugger'
        })
      }

      // no-console
      const consoleMatch = line.indexOf('console.log')
      if (consoleMatch !== -1) {
        problems.push({
          line: lineNum,
          startColumn: consoleMatch + 1,
          endColumn: consoleMatch + 12,
          message: "ESLint: Unexpected console statement (no-console)",
          severity: 'info',
          ruleId: 'no-console'
        })
      }
    })
  }

  // 2. Smart Auto-Correct & Python Syntax Rules
  if (isAutoCorrectEnabled) {
    lines.forEach((line, index) => {
      const lineNum = index + 1
      const trimmed = line.trim()

      if (isPython) {
        // Python missing colon check
        if (
          /^(def\s+\w+\(.*\)|class\s+\w+(\(.*\))?|if\s+.+|elif\s+.+|else|for\s+.+\s+in\s+.+|while\s+.+|try|except.*|finally|with\s+.+)/.test(trimmed) &&
          !trimmed.endsWith(':') &&
          !trimmed.endsWith('\\') &&
          !trimmed.startsWith('#')
        ) {
          problems.push({
            line: lineNum,
            startColumn: line.length,
            endColumn: line.length + 1,
            message: 'SyntaxError: expected ":" at the end of block statement',
            severity: 'error',
            ruleId: 'python-missing-colon'
          })
        }

        // Common Python typos
        if (/\bprnit\b/.test(line)) {
          const col = line.indexOf('prnit') + 1
          problems.push({
            line: lineNum,
            startColumn: col,
            endColumn: col + 5,
            message: "Did you mean 'print'? (Typo auto-correct)",
            severity: 'warning',
            ruleId: 'typo-prnit'
          })
        }

        if (/\bfucntion\b/.test(line)) {
          const col = line.indexOf('fucntion') + 1
          problems.push({
            line: lineNum,
            startColumn: col,
            endColumn: col + 8,
            message: "In Python use 'def' to declare functions",
            severity: 'error',
            ruleId: 'python-def-keyword'
          })
        }
      }

      // Check custom extension rules
      for (const rule of customRules) {
        try {
          const regex = new RegExp(rule.pattern, 'g')
          const matches = [...line.matchAll(regex)]
          for (const m of matches) {
            if (m.index !== undefined) {
              problems.push({
                line: lineNum,
                startColumn: m.index + 1,
                endColumn: m.index + m[0].length + 1,
                message: rule.message || `Custom rule match: ${rule.pattern}`,
                severity: 'warning',
                ruleId: 'custom-extension'
              })
            }
          }
        } catch {}
      }
    })
  }

  return problems
}

export function updateMonacoMarkers(
  monacoInstance: any,
  model: any,
  problems: LintProblem[]
): void {
  if (!monacoInstance?.editor?.setModelMarkers || !model) return

  const markers = problems.map(p => {
    let monacoSeverity = monacoInstance.MarkerSeverity.Warning
    if (p.severity === 'error') monacoSeverity = monacoInstance.MarkerSeverity.Error
    if (p.severity === 'info') monacoSeverity = monacoInstance.MarkerSeverity.Info

    return {
      severity: monacoSeverity,
      startLineNumber: p.line,
      startColumn: p.startColumn,
      endLineNumber: p.line,
      endColumn: p.endColumn,
      message: p.message,
      source: p.ruleId ? `ESLint (${p.ruleId})` : 'CodeForge Linter'
    }
  })

  monacoInstance.editor.setModelMarkers(model, 'codeforge-linter', markers)
}

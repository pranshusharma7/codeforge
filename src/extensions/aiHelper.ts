import type { ExtensionCompletionRule, GhostTextSuggestion } from './types'

/**
 * AntiGravity AI Next-Line Code Predictor Engine
 * Analyzes code context, current line, and language semantics to predict
 * what code comes next. Pressing Tab accepts the suggestion.
 */
export function getAINextCodeSuggestion(
  code: string,
  lineNumber: number,
  column: number,
  langId: string,
  customCompletions: ExtensionCompletionRule[] = []
): GhostTextSuggestion | null {
  const lines = code.split('\n')
  const currentLine = lines[lineNumber - 1] || ''
  const linePrefix = currentLine.substring(0, column - 1)
  const trimmedPrefix = linePrefix.trim()

  if (!trimmedPrefix) return null

  // 1. Check custom uploaded extension completion rules first
  for (const rule of customCompletions) {
    if (trimmedPrefix.endsWith(rule.trigger)) {
      const remainingInsert = rule.code
      return {
        text: remainingInsert.split('\n')[0] + (remainingInsert.includes('\n') ? ' ...' : ''),
        insertText: remainingInsert,
        lineNumber,
        column,
        trigger: rule.trigger,
        sourceExtension: 'Custom Extension'
      }
    }
  }

  const isPython = langId.includes('python') || langId === 'py'
  const isJS = ['javascript', 'typescript', 'js', 'ts', 'jsx', 'tsx'].some(l => langId.includes(l))
  const isCpp = ['cpp', 'c', 'cplusplus'].some(l => langId.includes(l))
  const isJava = langId.includes('java') && !langId.includes('javascript')

  // Scan file for defined variable/function names to make suggestions super contextual
  const varMatches = code.match(/\b([a-zA-Z_]\w*)\b/g) || []
  const uniqueVars = Array.from(new Set(varMatches)).filter(v => v.length > 2)
  const arrayVar = uniqueVars.find(v => ['arr', 'nums', 'items', 'list', 'data', 'array'].some(k => v.toLowerCase().includes(k))) || 'arr'
  const countVar = uniqueVars.find(v => ['count', 'total', 'sum', 'res', 'ans'].some(k => v.toLowerCase().includes(k))) || 'count'

  // 2. Python Predictions
  if (isPython) {
    if (trimmedPrefix === 'for') {
      const suggestion = ` i in range(len(${arrayVar})):`
      return { text: suggestion, insertText: suggestion, lineNumber, column, trigger: 'for', sourceExtension: 'AntiGravity AI Copilot' }
    }
    if (trimmedPrefix.startsWith('for ') && !trimmedPrefix.includes(':')) {
      const rest = ` in ${arrayVar}:`
      return { text: rest, insertText: rest, lineNumber, column, trigger: 'for in', sourceExtension: 'AntiGravity AI Copilot' }
    }
    if (trimmedPrefix === 'if') {
      const suggestion = ` not ${arrayVar}:`
      return { text: suggestion, insertText: suggestion, lineNumber, column, trigger: 'if', sourceExtension: 'AntiGravity AI Copilot' }
    }
    if (trimmedPrefix === 'def') {
      const suggestion = ` solve(${arrayVar}):\n    ${countVar} = 0\n    return ${countVar}`
      return { text: ` solve(${arrayVar}):`, insertText: suggestion, lineNumber, column, trigger: 'def', sourceExtension: 'AntiGravity AI Copilot' }
    }
    if (trimmedPrefix === 'class') {
      const suggestion = ` Solution:\n    def solve(self, nums):\n        pass`
      return { text: ` Solution:`, insertText: suggestion, lineNumber, column, trigger: 'class', sourceExtension: 'AntiGravity AI Copilot' }
    }
    if (trimmedPrefix === 'while') {
      const suggestion = ` left <= right:`
      return { text: suggestion, insertText: suggestion, lineNumber, column, trigger: 'while', sourceExtension: 'AntiGravity AI Copilot' }
    }
    if (trimmedPrefix === 'return') {
      const suggestion = ` ${countVar}`
      return { text: suggestion, insertText: suggestion, lineNumber, column, trigger: 'return', sourceExtension: 'AntiGravity AI Copilot' }
    }
    if (trimmedPrefix === 'print(') {
      const suggestion = `f"Result: {${countVar}}")`
      return { text: suggestion, insertText: suggestion, lineNumber, column, trigger: 'print(', sourceExtension: 'AntiGravity AI Copilot' }
    }
    if (trimmedPrefix === 'if __name__') {
      const suggestion = ` == '__main__':\n    print(solve([1, 2, 3, 4]))`
      return { text: ` == '__main__':`, insertText: suggestion, lineNumber, column, trigger: 'if __name__', sourceExtension: 'AntiGravity AI Copilot' }
    }
    if (trimmedPrefix.endsWith('.append(')) {
      const suggestion = `item)`
      return { text: suggestion, insertText: suggestion, lineNumber, column, trigger: '.append(', sourceExtension: 'AntiGravity AI Copilot' }
    }
  }

  // 3. JavaScript / TypeScript Predictions
  if (isJS) {
    if (trimmedPrefix === 'const') {
      const suggestion = ` [${countVar}, set${countVar.charAt(0).toUpperCase() + countVar.slice(1)}] = useState(0)`
      return { text: suggestion, insertText: suggestion, lineNumber, column, trigger: 'const', sourceExtension: 'AntiGravity AI Copilot' }
    }
    if (trimmedPrefix === 'function') {
      const suggestion = ` handleCalculate(${arrayVar}) {\n  return ${arrayVar}.reduce((acc, curr) => acc + curr, 0);\n}`
      return { text: ` handleCalculate(${arrayVar}) { ... }`, insertText: suggestion, lineNumber, column, trigger: 'function', sourceExtension: 'AntiGravity AI Copilot' }
    }
    if (trimmedPrefix === 'console.') {
      const suggestion = `log('DEBUG [${countVar}]:', ${countVar});`
      return { text: suggestion, insertText: suggestion, lineNumber, column, trigger: 'console.', sourceExtension: 'AntiGravity AI Copilot' }
    }
    if (trimmedPrefix === 'try') {
      const suggestion = ` {\n  const res = await fetchData();\n} catch (err) {\n  console.error('Error:', err);\n}`
      return { text: ` { ... } catch (err) { ... }`, insertText: suggestion, lineNumber, column, trigger: 'try', sourceExtension: 'AntiGravity AI Copilot' }
    }
    if (trimmedPrefix.endsWith('.map(')) {
      const suggestion = `(item, index) => item * 2)`
      return { text: suggestion, insertText: suggestion, lineNumber, column, trigger: '.map(', sourceExtension: 'AntiGravity AI Copilot' }
    }
    if (trimmedPrefix.endsWith('.filter(')) {
      const suggestion = `(item) => Boolean(item))`
      return { text: suggestion, insertText: suggestion, lineNumber, column, trigger: '.filter(', sourceExtension: 'AntiGravity AI Copilot' }
    }
    if (trimmedPrefix === 'for') {
      const suggestion = ` (let i = 0; i < ${arrayVar}.length; i++) {\n  \n}`
      return { text: ` (let i = 0; i < ${arrayVar}.length; i++)`, insertText: suggestion, lineNumber, column, trigger: 'for', sourceExtension: 'AntiGravity AI Copilot' }
    }
    if (trimmedPrefix === 'return') {
      const suggestion = ` ${countVar};`
      return { text: suggestion, insertText: suggestion, lineNumber, column, trigger: 'return', sourceExtension: 'AntiGravity AI Copilot' }
    }
  }

  // 4. C++ Predictions
  if (isCpp) {
    if (trimmedPrefix === 'for') {
      const suggestion = ` (int i = 0; i < n; i++) {\n    \n}`
      return { text: ` (int i = 0; i < n; i++)`, insertText: suggestion, lineNumber, column, trigger: 'for', sourceExtension: 'AntiGravity AI Copilot' }
    }
    if (trimmedPrefix === 'std::') {
      const suggestion = `cout << "Result: " << ${countVar} << std::endl;`
      return { text: suggestion, insertText: suggestion, lineNumber, column, trigger: 'std::', sourceExtension: 'AntiGravity AI Copilot' }
    }
    if (trimmedPrefix === 'vector<') {
      const suggestion = `int> ${arrayVar};`
      return { text: suggestion, insertText: suggestion, lineNumber, column, trigger: 'vector<', sourceExtension: 'AntiGravity AI Copilot' }
    }
    if (trimmedPrefix === 'cin >>') {
      const suggestion = ` n;`
      return { text: suggestion, insertText: suggestion, lineNumber, column, trigger: 'cin >>', sourceExtension: 'AntiGravity AI Copilot' }
    }
    if (trimmedPrefix === 'cout <<') {
      const suggestion = ` ${countVar} << "\\n";`
      return { text: suggestion, insertText: suggestion, lineNumber, column, trigger: 'cout <<', sourceExtension: 'AntiGravity AI Copilot' }
    }
  }

  // 5. Java Predictions
  if (isJava) {
    if (trimmedPrefix === 'System.out.') {
      const suggestion = `println("Result: " + ${countVar});`
      return { text: suggestion, insertText: suggestion, lineNumber, column, trigger: 'System.out.', sourceExtension: 'AntiGravity AI Copilot' }
    }
    if (trimmedPrefix === 'public static void main') {
      const suggestion = `(String[] args) {\n    System.out.println("Hello World");\n}`
      return { text: `(String[] args) { ... }`, insertText: suggestion, lineNumber, column, trigger: 'main', sourceExtension: 'AntiGravity AI Copilot' }
    }
    if (trimmedPrefix === 'Scanner') {
      const suggestion = ` sc = new Scanner(System.in);`
      return { text: suggestion, insertText: suggestion, lineNumber, column, trigger: 'Scanner', sourceExtension: 'AntiGravity AI Copilot' }
    }
  }

  return null
}

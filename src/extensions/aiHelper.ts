import type { ExtensionCompletionRule, GhostTextSuggestion } from './types'

/**
 * AntiGravity AI Next-Line Code Predictor Engine (Advanced Copilot)
 * Automatically analyzes surrounding context, previous comments, open structures,
 * defined variables, and language semantics to predict what code comes next.
 * Renders as ghost text in Monaco editor — accepted when the user presses Tab.
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

  // Previous line context (crucial for comment-driven code generation & indented blocks)
  const prevLine = lineNumber > 1 ? lines[lineNumber - 2]?.trim() || '' : ''
  const lowerPrevLine = prevLine.toLowerCase()

  const normalizedLang = (langId || 'python').toLowerCase()
  const isPython = normalizedLang.includes('python') || normalizedLang === 'py'
  const isJS = ['javascript', 'typescript', 'js', 'ts', 'jsx', 'tsx'].some(l => normalizedLang.includes(l))
  const isCpp = ['cpp', 'c', 'cplusplus'].some(l => normalizedLang.includes(l))
  const isJava = normalizedLang.includes('java') && !normalizedLang.includes('javascript')
  const isGo = normalizedLang === 'go' || normalizedLang.includes('golang')
  const isRust = normalizedLang === 'rust' || normalizedLang.includes('rs')
  const isHTML = normalizedLang.includes('html') || normalizedLang.includes('xml')
  const isSQL = normalizedLang.includes('sql')

  // Scan document for variable names to make code contextually hyper-relevant
  const varMatches = code.match(/\b([a-zA-Z_]\w*)\b/g) || []
  const uniqueVars = Array.from(new Set(varMatches)).filter(v => v.length > 2 && !['def', 'function', 'class', 'import', 'return', 'const', 'let', 'var'].includes(v))
  const arrayVar = uniqueVars.find(v => ['arr', 'nums', 'items', 'list', 'data', 'array', 'values'].some(k => v.toLowerCase().includes(k))) || 'arr'
  const countVar = uniqueVars.find(v => ['count', 'total', 'sum', 'res', 'ans', 'result', 'output'].some(k => v.toLowerCase().includes(k))) || 'count'
  const targetVar = uniqueVars.find(v => ['target', 'key', 'val', 'valToFind'].some(k => v.toLowerCase().includes(k))) || 'target'

  // 1. Check custom user-uploaded / installed extension rules first
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

  // 2. Intelligent Comment-to-Code Predictions (Intent detection)
  if (prevLine.startsWith('//') || prevLine.startsWith('#') || prevLine.startsWith('/*')) {
    if (lowerPrevLine.includes('two sum') || lowerPrevLine.includes('twosum')) {
      if (isPython) {
        const suggestion = `seen = {}\nfor i, num in enumerate(${arrayVar}):\n    diff = ${targetVar} - num\n    if diff in seen:\n        return [seen[diff], i]\n    seen[num] = i\nreturn []`
        return { text: `seen = {} ... return indices`, insertText: suggestion, lineNumber, column, trigger: 'two sum', sourceExtension: 'CodeForge AI Helper' }
      }
      if (isJS) {
        const suggestion = `const map = new Map();\nfor (let i = 0; i < ${arrayVar}.length; i++) {\n  const diff = ${targetVar} - ${arrayVar}[i];\n  if (map.has(diff)) return [map.get(diff), i];\n  map.set(${arrayVar}[i], i);\n}\nreturn [];`
        return { text: `const map = new Map() ...`, insertText: suggestion, lineNumber, column, trigger: 'two sum', sourceExtension: 'CodeForge AI Helper' }
      }
    }

    if (lowerPrevLine.includes('prime') || lowerPrevLine.includes('is_prime')) {
      if (isPython) {
        const suggestion = `def is_prime(n: int) -> bool:\n    if n < 2:\n        return False\n    for i in range(2, int(n ** 0.5) + 1):\n        if n % i == 0:\n            return False\n    return True`
        return { text: `def is_prime(n): ...`, insertText: suggestion, lineNumber, column, trigger: 'prime', sourceExtension: 'CodeForge AI Helper' }
      }
      if (isJS) {
        const suggestion = `function isPrime(n) {\n  if (n < 2) return false;\n  for (let i = 2; i <= Math.sqrt(n); i++) {\n    if (n % i === 0) return false;\n  }\n  return true;\n}`
        return { text: `function isPrime(n) { ... }`, insertText: suggestion, lineNumber, column, trigger: 'prime', sourceExtension: 'CodeForge AI Helper' }
      }
    }

    if (lowerPrevLine.includes('binary search')) {
      if (isPython) {
        const suggestion = `left, right = 0, len(${arrayVar}) - 1\nwhile left <= right:\n    mid = (left + right) // 2\n    if ${arrayVar}[mid] == ${targetVar}:\n        return mid\n    elif ${arrayVar}[mid] < ${targetVar}:\n        left = mid + 1\n    else:\n        right = mid - 1\nreturn -1`
        return { text: `left, right = 0, len(${arrayVar}) - 1 ...`, insertText: suggestion, lineNumber, column, trigger: 'binary search', sourceExtension: 'CodeForge AI Helper' }
      }
      if (isJS || isCpp || isJava) {
        const suggestion = `let left = 0, right = ${arrayVar}.length - 1;\nwhile (left <= right) {\n  const mid = Math.floor((left + right) / 2);\n  if (${arrayVar}[mid] === ${targetVar}) return mid;\n  if (${arrayVar}[mid] < ${targetVar}) left = mid + 1;\n  else right = mid - 1;\n}\nreturn -1;`
        return { text: `let left = 0, right = ...`, insertText: suggestion, lineNumber, column, trigger: 'binary search', sourceExtension: 'CodeForge AI Helper' }
      }
    }

    if (lowerPrevLine.includes('reverse') && lowerPrevLine.includes('string')) {
      if (isPython) {
        const suggestion = `return s[::-1]`
        return { text: suggestion, insertText: suggestion, lineNumber, column, trigger: 'reverse', sourceExtension: 'CodeForge AI Helper' }
      }
      if (isJS) {
        const suggestion = `return str.split('').reverse().join('');`
        return { text: suggestion, insertText: suggestion, lineNumber, column, trigger: 'reverse', sourceExtension: 'CodeForge AI Helper' }
      }
    }

    if (lowerPrevLine.includes('fetch') || lowerPrevLine.includes('api')) {
      if (isJS) {
        const suggestion = `try {\n  const response = await fetch('https://api.example.com/data');\n  const data = await response.json();\n  console.log(data);\n} catch (error) {\n  console.error('Fetch error:', error);\n}`
        return { text: `try { const response = await fetch(...) }`, insertText: suggestion, lineNumber, column, trigger: 'fetch', sourceExtension: 'CodeForge AI Helper' }
      }
    }
  }

  if (!trimmedPrefix) return null

  // 3. Python Autocomplete Predictions
  if (isPython) {
    if (trimmedPrefix === 'def') {
      const suggestion = ` solve(${arrayVar}):\n    ${countVar} = 0\n    for item in ${arrayVar}:\n        ${countVar} += item\n    return ${countVar}`
      return { text: ` solve(${arrayVar}): ...`, insertText: suggestion, lineNumber, column, trigger: 'def', sourceExtension: 'CodeForge AI Helper' }
    }
    if (trimmedPrefix.startsWith('def ') && !trimmedPrefix.includes(':')) {
      const rest = `(${arrayVar}):\n    pass`
      return { text: rest, insertText: rest, lineNumber, column, trigger: 'def', sourceExtension: 'CodeForge AI Helper' }
    }
    if (trimmedPrefix === 'for') {
      const suggestion = ` i in range(len(${arrayVar})):`
      return { text: suggestion, insertText: suggestion, lineNumber, column, trigger: 'for', sourceExtension: 'CodeForge AI Helper' }
    }
    if (trimmedPrefix.startsWith('for ') && !trimmedPrefix.includes(':') && !trimmedPrefix.includes(' in ')) {
      const rest = ` in ${arrayVar}:`
      return { text: rest, insertText: rest, lineNumber, column, trigger: 'for in', sourceExtension: 'CodeForge AI Helper' }
    }
    if (trimmedPrefix === 'while') {
      const suggestion = ` left <= right:`
      return { text: suggestion, insertText: suggestion, lineNumber, column, trigger: 'while', sourceExtension: 'CodeForge AI Helper' }
    }
    if (trimmedPrefix === 'if') {
      const suggestion = ` not ${arrayVar}:`
      return { text: suggestion, insertText: suggestion, lineNumber, column, trigger: 'if', sourceExtension: 'CodeForge AI Helper' }
    }
    if (trimmedPrefix === 'class') {
      const suggestion = ` Solution:\n    def __init__(self):\n        self.${countVar} = 0\n\n    def execute(self, ${arrayVar}):\n        return ${arrayVar}`
      return { text: ` Solution: ...`, insertText: suggestion, lineNumber, column, trigger: 'class', sourceExtension: 'CodeForge AI Helper' }
    }
    if (trimmedPrefix === 'try:') {
      const suggestion = `\n    with open('data.txt', 'r') as f:\n        content = f.read()\nexcept Exception as e:\n    print(f"Error: {e}")`
      return { text: ` with open('data.txt') ... except:`, insertText: suggestion, lineNumber, column, trigger: 'try:', sourceExtension: 'CodeForge AI Helper' }
    }
    if (trimmedPrefix === 'with open(') {
      const suggestion = `'file.txt', 'r') as f:\n    lines = f.readlines()`
      return { text: suggestion, insertText: suggestion, lineNumber, column, trigger: 'with open(', sourceExtension: 'CodeForge AI Helper' }
    }
    if (trimmedPrefix === 'if __name__') {
      const suggestion = ` == '__main__':\n    print(solve([1, 2, 3, 4, 5]))`
      return { text: ` == '__main__':`, insertText: suggestion, lineNumber, column, trigger: 'if __name__', sourceExtension: 'CodeForge AI Helper' }
    }
    if (trimmedPrefix === 'print(') {
      const suggestion = `f"Result: {${countVar}}")`
      return { text: suggestion, insertText: suggestion, lineNumber, column, trigger: 'print(', sourceExtension: 'CodeForge AI Helper' }
    }
    if (trimmedPrefix === 'return') {
      const suggestion = ` ${countVar}`
      return { text: suggestion, insertText: suggestion, lineNumber, column, trigger: 'return', sourceExtension: 'CodeForge AI Helper' }
    }
    if (trimmedPrefix.endsWith('.append(')) {
      const suggestion = `item)`
      return { text: suggestion, insertText: suggestion, lineNumber, column, trigger: '.append(', sourceExtension: 'CodeForge AI Helper' }
    }
  }

  // 4. JavaScript / TypeScript Autocomplete Predictions
  if (isJS) {
    if (trimmedPrefix === 'const') {
      const suggestion = ` [${countVar}, set${countVar.charAt(0).toUpperCase() + countVar.slice(1)}] = useState(0);`
      return { text: suggestion, insertText: suggestion, lineNumber, column, trigger: 'const', sourceExtension: 'CodeForge AI Helper' }
    }
    if (trimmedPrefix === 'function') {
      const suggestion = ` calculateResult(${arrayVar}) {\n  return ${arrayVar}.reduce((acc, curr) => acc + curr, 0);\n}`
      return { text: ` calculateResult(${arrayVar}) { ... }`, insertText: suggestion, lineNumber, column, trigger: 'function', sourceExtension: 'CodeForge AI Helper' }
    }
    if (trimmedPrefix === 'useEffect(') {
      const suggestion = `() => {\n  // effect\n  return () => {};\n}, []);`
      return { text: `() => { ... }, []);`, insertText: suggestion, lineNumber, column, trigger: 'useEffect', sourceExtension: 'CodeForge AI Helper' }
    }
    if (trimmedPrefix === 'async function') {
      const suggestion = ` fetchData() {\n  const res = await fetch('/api/data');\n  return await res.json();\n}`
      return { text: ` fetchData() { ... }`, insertText: suggestion, lineNumber, column, trigger: 'async function', sourceExtension: 'CodeForge AI Helper' }
    }
    if (trimmedPrefix === 'for') {
      const suggestion = ` (let i = 0; i < ${arrayVar}.length; i++) {\n  \n}`
      return { text: ` (let i = 0; i < ${arrayVar}.length; i++)`, insertText: suggestion, lineNumber, column, trigger: 'for', sourceExtension: 'CodeForge AI Helper' }
    }
    if (trimmedPrefix === 'try') {
      const suggestion = ` {\n  const response = await fetch('/api/data');\n  const data = await response.json();\n} catch (error) {\n  console.error('Error occurred:', error);\n}`
      return { text: ` { ... } catch (error) { ... }`, insertText: suggestion, lineNumber, column, trigger: 'try', sourceExtension: 'CodeForge AI Helper' }
    }
    if (trimmedPrefix.endsWith('.map(')) {
      const suggestion = `(item, index) => ({\n  id: index,\n  ...item\n}))`
      return { text: `(item, index) => item`, insertText: suggestion, lineNumber, column, trigger: '.map(', sourceExtension: 'CodeForge AI Helper' }
    }
    if (trimmedPrefix.endsWith('.filter(')) {
      const suggestion = `(item) => Boolean(item))`
      return { text: suggestion, insertText: suggestion, lineNumber, column, trigger: '.filter(', sourceExtension: 'CodeForge AI Helper' }
    }
    if (trimmedPrefix.endsWith('.reduce(')) {
      const suggestion = `(accumulator, current) => accumulator + current, 0)`
      return { text: suggestion, insertText: suggestion, lineNumber, column, trigger: '.reduce(', sourceExtension: 'CodeForge AI Helper' }
    }
    if (trimmedPrefix === 'console.') {
      const suggestion = `log('DEBUG [${countVar}]:', ${countVar});`
      return { text: suggestion, insertText: suggestion, lineNumber, column, trigger: 'console.', sourceExtension: 'CodeForge AI Helper' }
    }
    if (trimmedPrefix === 'return') {
      const suggestion = ` ${countVar};`
      return { text: suggestion, insertText: suggestion, lineNumber, column, trigger: 'return', sourceExtension: 'CodeForge AI Helper' }
    }
  }

  // 5. C++ Autocomplete Predictions
  if (isCpp) {
    if (trimmedPrefix === 'for') {
      const suggestion = ` (int i = 0; i < n; i++) {\n    \n}`
      return { text: ` (int i = 0; i < n; i++)`, insertText: suggestion, lineNumber, column, trigger: 'for', sourceExtension: 'CodeForge AI Helper' }
    }
    if (trimmedPrefix === '#include') {
      const suggestion = ` <iostream>\n#include <vector>\n#include <algorithm>\nusing namespace std;\n\nint main() {\n    cout << "Hello, CodeForge!\\n";\n    return 0;\n}`
      return { text: ` <iostream> ... main()`, insertText: suggestion, lineNumber, column, trigger: '#include', sourceExtension: 'CodeForge AI Helper' }
    }
    if (trimmedPrefix === 'vector<') {
      const suggestion = `int> ${arrayVar}(n, 0);`
      return { text: suggestion, insertText: suggestion, lineNumber, column, trigger: 'vector<', sourceExtension: 'CodeForge AI Helper' }
    }
    if (trimmedPrefix === 'cout <<') {
      const suggestion = ` "Result: " << ${countVar} << "\\n";`
      return { text: suggestion, insertText: suggestion, lineNumber, column, trigger: 'cout <<', sourceExtension: 'CodeForge AI Helper' }
    }
    if (trimmedPrefix === 'cin >>') {
      const suggestion = ` n;`
      return { text: suggestion, insertText: suggestion, lineNumber, column, trigger: 'cin >>', sourceExtension: 'CodeForge AI Helper' }
    }
    if (trimmedPrefix === 'sort(') {
      const suggestion = `${arrayVar}.begin(), ${arrayVar}.end());`
      return { text: suggestion, insertText: suggestion, lineNumber, column, trigger: 'sort(', sourceExtension: 'CodeForge AI Helper' }
    }
  }

  // 6. Java Autocomplete Predictions
  if (isJava) {
    if (trimmedPrefix === 'public static void main') {
      const suggestion = `(String[] args) {\n    System.out.println("Hello, World!");\n}`
      return { text: `(String[] args) { ... }`, insertText: suggestion, lineNumber, column, trigger: 'main', sourceExtension: 'CodeForge AI Helper' }
    }
    if (trimmedPrefix === 'System.out.') {
      const suggestion = `println("Result: " + ${countVar});`
      return { text: suggestion, insertText: suggestion, lineNumber, column, trigger: 'System.out.', sourceExtension: 'CodeForge AI Helper' }
    }
    if (trimmedPrefix === 'for') {
      const suggestion = ` (int i = 0; i < ${arrayVar}.length; i++) {\n    \n}`
      return { text: ` (int i = 0; i < ...; i++)`, insertText: suggestion, lineNumber, column, trigger: 'for', sourceExtension: 'CodeForge AI Helper' }
    }
    if (trimmedPrefix === 'Scanner') {
      const suggestion = ` sc = new Scanner(System.in);`
      return { text: suggestion, insertText: suggestion, lineNumber, column, trigger: 'Scanner', sourceExtension: 'CodeForge AI Helper' }
    }
  }

  // 7. HTML Predictions
  if (isHTML) {
    if (trimmedPrefix === '<!DOCTYPE' || trimmedPrefix === '<!doctype') {
      const suggestion = ` html>\n<html lang="en">\n<head>\n  <meta charset="UTF-8">\n  <title>Document</title>\n</head>\n<body>\n  <div id="app"></div>\n</body>\n</html>`
      return { text: ` html> ... </html>`, insertText: suggestion, lineNumber, column, trigger: '<!DOCTYPE', sourceExtension: 'CodeForge AI Helper' }
    }
    if (trimmedPrefix === '<div') {
      const suggestion = ` className="container">\n  \n</div>`
      return { text: ` className="container">...</div>`, insertText: suggestion, lineNumber, column, trigger: '<div', sourceExtension: 'CodeForge AI Helper' }
    }
    if (trimmedPrefix === '<button') {
      const suggestion = ` type="button" className="btn btn-primary">Click Me</button>`
      return { text: suggestion, insertText: suggestion, lineNumber, column, trigger: '<button', sourceExtension: 'CodeForge AI Helper' }
    }
  }

  // 8. SQL Predictions
  if (isSQL) {
    if (trimmedPrefix === 'SELECT' || trimmedPrefix === 'select') {
      const suggestion = ` * FROM users WHERE active = true ORDER BY created_at DESC;`
      return { text: suggestion, insertText: suggestion, lineNumber, column, trigger: 'SELECT', sourceExtension: 'CodeForge AI Helper' }
    }
    if (trimmedPrefix === 'CREATE TABLE' || trimmedPrefix === 'create table') {
      const suggestion = ` users (\n  id SERIAL PRIMARY KEY,\n  username VARCHAR(50) NOT NULL,\n  email VARCHAR(100) UNIQUE NOT NULL,\n  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP\n);`
      return { text: ` users (id, username, email) ...`, insertText: suggestion, lineNumber, column, trigger: 'CREATE TABLE', sourceExtension: 'CodeForge AI Helper' }
    }
  }

  // 9. Go Predictions
  if (isGo) {
    if (trimmedPrefix === 'package') {
      const suggestion = ` main\n\nimport "fmt"\n\nfunc main() {\n    fmt.Println("Hello, Go!")\n}`
      return { text: ` main ... func main()`, insertText: suggestion, lineNumber, column, trigger: 'package', sourceExtension: 'CodeForge AI Helper' }
    }
    if (trimmedPrefix === 'if err != nil') {
      const suggestion = ` {\n    return err\n}`
      return { text: ` { return err }`, insertText: suggestion, lineNumber, column, trigger: 'if err != nil', sourceExtension: 'CodeForge AI Helper' }
    }
  }

  // 10. Rust Predictions
  if (isRust) {
    if (trimmedPrefix === 'fn main()') {
      const suggestion = ` {\n    println!("Hello, Rust!");\n}`
      return { text: ` { println!(...); }`, insertText: suggestion, lineNumber, column, trigger: 'fn main()', sourceExtension: 'CodeForge AI Helper' }
    }
  }

  return null
}

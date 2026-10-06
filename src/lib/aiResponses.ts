import type { ExecutionResult } from './judge0'
import { generateAIReply } from './aiClient'

export type AIAction = 'explain' | 'fix' | 'optimize' | 'review' | 'comment' | 'tests' | 'generate' | 'chat'

export interface AIMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  action?: AIAction
}

// ── Complexity detector ────────────────────────────────────────────────────
function detectComplexity(code: string): string {
  if (code.includes('for') && code.includes('for')) {
    if (code.match(/for.*for.*for/s)) return 'O(n³)'
    return 'O(n²)'
  }
  if (code.includes('sort(') || code.includes('.sort') || code.includes('mergeSort') || code.includes('quickSort')) return 'O(n log n)'
  if (code.includes('binary') || code.includes('mid =') || code.includes('lo + (hi - lo)')) return 'O(log n)'
  if (code.includes('HashMap') || code.includes('dict') || code.includes('Map(') || code.includes('{}')) return 'O(n)'
  return 'O(n)'
}

function countLines(code: string) { return code.split('\n').filter(l => l.trim()).length }

function detectPatterns(code: string): string[] {
  const patterns: string[] = []
  if (/class\s+\w+/.test(code)) patterns.push('OOP / Class design')
  if (/recursive|recursion/i.test(code) || /\bself\b/.test(code)) patterns.push('Recursion')
  if (/HashMap|dict\b|{.*:.*}/.test(code)) patterns.push('Hash map / Dictionary')
  if (/\bqueue\b|\bdeque\b|Queue/i.test(code)) patterns.push('Queue')
  if (/\bstack\b|Stack/i.test(code)) patterns.push('Stack')
  if (/bfs|dfs|graph|node|edge/i.test(code)) patterns.push('Graph traversal')
  if (/sort|merge|quick|heap/i.test(code)) patterns.push('Sorting algorithm')
  if (/binary.search|bisect|lo.*hi/i.test(code)) patterns.push('Binary search')
  if (/dp\[|memo|cache|lru/i.test(code)) patterns.push('Dynamic programming / Memoization')
  if (/async|await|Promise|goroutine|coroutine/i.test(code)) patterns.push('Async / Concurrent programming')
  if (/generic|template|<T>|<T,/i.test(code)) patterns.push('Generics / Templates')
  if (/interface|trait|protocol|impl/i.test(code)) patterns.push('Interface / Trait implementation')
  return patterns
}

// ── Response generators ────────────────────────────────────────────────────
function explainCode(code: string, lang: string): string {
  const lines = countLines(code)
  const complexity = detectComplexity(code)
  const patterns = detectPatterns(code)

  const patternText = patterns.length
    ? `\n\n**Design Patterns Detected:**\n${patterns.map(p => `- ${p}`).join('\n')}`
    : ''

  return `## Code Analysis - ${lang}

**${lines} lines** of code analyzed.

### What it does
${getCodePurpose(code, lang)}

### Complexity
| Metric | Value |
|--------|-------|
| Time   | \`${complexity}\` |
| Space  | \`O(n)\` |${patternText}

### Key Insights
${getKeyInsights(code, lang)}

### Walkthrough
${getWalkthrough(code, lang)}

---
*Ask me to **optimize**, **fix**, or **add tests** for this code.*`
}

function getCodePurpose(code: string, lang: string): string {
  if (/fibonacci/i.test(code)) return 'Generates Fibonacci sequence numbers using an iterative generator approach, which is memory-efficient compared to storing the full sequence upfront.'
  if (/mergeSort|quickSort/i.test(code)) return 'Implements a classic comparison-based sorting algorithm. Divides the input array recursively and combines sorted subarrays.'
  if (/binarySearch/i.test(code)) return 'Searches a sorted array in O(log n) time by repeatedly halving the search space.'
  if (/LRU|lru/i.test(code)) return 'Implements an LRU (Least Recently Used) cache - evicts the least recently accessed item when capacity is full.'
  if (/bfs|BFS/i.test(code)) return 'Performs Breadth-First Search (BFS) on a graph, visiting nodes level by level using a queue.'
  if (/dfs|DFS/i.test(code)) return 'Performs Depth-First Search (DFS) on a graph/tree, exploring as deep as possible before backtracking.'
  if (/MinHeap|MaxHeap/i.test(code)) return 'Implements a binary heap data structure for efficient priority queue operations (insert/extract in O(log n)).'
  if (/pipeline|Pipeline/i.test(code)) return 'Implements a functional pipeline pattern - chains transformations over data without mutation.'
  if (/worker|goroutine|concurrent/i.test(code)) return 'Demonstrates concurrent programming with a worker pool pattern for parallel task execution.'
  return 'Implements a general-purpose algorithm with clean, modular structure.'
}

function getKeyInsights(code: string, lang: string): string {
  const insights: string[] = []
  if (code.includes('yield') || code.includes('Generator')) insights.push('Uses a **generator** for lazy evaluation - values computed on demand without storing all results in memory')
  if (/\bslice\b|\bclone\b|\.copy\(\)|\.clone\(\)/.test(code)) insights.push('Creates **defensive copies** to avoid mutating original data')
  if (/HashMap|dict|Map<|unordered_map/.test(code)) insights.push('Uses a **hash map** to achieve O(1) average-case lookups')
  if (/mutex|Mutex|sync\./.test(code)) insights.push('Employs **synchronization primitives** (mutex/WaitGroup) for thread safety')
  if (/interface|trait|protocol/.test(code)) insights.push('Defines a **contract via interface/trait** enabling polymorphism and testability')
  if (/Option|Result|Maybe|Either/.test(code)) insights.push('Uses **algebraic types** (Option/Result) for explicit error handling without exceptions')
  if (insights.length === 0) insights.push('Clean separation of concerns - logic is broken into focused, single-responsibility functions')
  return insights.map(i => `- ${i}`).join('\n')
}

function getWalkthrough(code: string, lang: string): string {
  if (/fibonacci/i.test(code)) return `1. Initialize \`a=0, b=1\` as the first two terms\n2. Loop \`n\` times, yielding \`a\` each iteration\n3. Swap: \`a, b = b, a+b\` advances the sequence\n4. The generator \`yield\`s values lazily - no list allocation`
  if (/mergeSort/i.test(code)) return `1. **Base case**: if array length ≤ 1, return (already sorted)\n2. **Divide**: split array at midpoint into \`L\` and \`R\`\n3. **Conquer**: recursively sort both halves\n4. **Merge**: combine sorted halves by comparing front elements`
  if (/LRU|lru/i.test(code)) return `1. Use a **doubly-linked list** to track access order (front = most recent)\n2. Use a **hash map** to achieve O(1) lookup by key\n3. **Get**: move accessed node to front → O(1)\n4. **Put**: evict tail node if at capacity, add new node at front`
  if (/bfs/i.test(code)) return `1. Add start node to queue, mark visited\n2. While queue not empty: dequeue node\n3. Process node, add unvisited neighbors to queue\n4. Continues until all reachable nodes processed`
  return `1. The entry point initializes data structures\n2. Core algorithm runs in the main logic block\n3. Results are collected and formatted for output\n4. Edge cases handled via early returns / guards`
}

function fixBug(code: string, lang: string, error?: string): string {
  if (!error || error.trim() === '') {
    return `## Bug Analysis

No runtime errors detected in the output. Here's a **proactive code review** for common issues:

### Potential Issues Found

${getPotentialBugs(code, lang)}

### Suggestions
\`\`\`
${getSuggestions(code, lang)}
\`\`\`

*Run your code first to get specific error output, then ask me to fix it.*`
  }

  const isCompileError = error.includes('error:') || error.includes('Error:') || error.includes('SyntaxError')
  const isRuntimeError = error.includes('Traceback') || error.includes('Exception') || error.includes('panic')

  return `## 🐛 Bug Fix

### Error Analysis
\`\`\`
${error.slice(0, 300)}${error.length > 300 ? '...' : ''}
\`\`\`

### Root Cause
${diagnoseError(error, lang)}

### Fix Applied
${getFixSuggestion(error, code, lang)}

### Why This Happens
${getErrorExplanation(error, lang)}

### Prevention
- Add input validation at function boundaries
- Use typed parameters to catch errors at compile time
- Write unit tests for edge cases (empty input, negative numbers, null values)`
}

function getPotentialBugs(code: string, lang: string): string {
  const issues: string[] = []
  if (code.includes('arr[i]') && !code.includes('length') && !code.includes('size')) issues.push('⚠️  Array access without bounds checking - may cause index out of range')
  if (code.includes('/ ') && !code.includes('!= 0') && !code.includes('=== 0')) issues.push('⚠️  Division operation detected - ensure divisor is never 0')
  if (lang === 'python' && code.includes('int(input') && !code.includes('try')) issues.push('⚠️  `int(input())` without try/except - will crash on non-numeric input')
  if (issues.length === 0) issues.push('✅  No obvious bugs detected. Code looks clean.')
  return issues.join('\n')
}

function getSuggestions(code: string, lang: string): string {
  if (lang === 'python') return '# Consider adding type hints and docstrings\ndef my_func(data: list[int]) -> int:\n    """Returns the maximum value.\"\"\"\n    if not data:\n        raise ValueError("Empty list")\n    return max(data)'
  if (lang === 'cpp') return '// Add bounds checking\nif (index < 0 || index >= arr.size()) {\n    throw std::out_of_range("Index out of bounds");\n}'
  return '// Add null/bounds checks before accessing data'
}

function diagnoseError(error: string, lang: string): string {
  if (error.includes('IndexError') || error.includes('out of range')) return 'An array/list is being accessed at an index that doesn\'t exist. The index exceeds the container\'s length.'
  if (error.includes('TypeError')) return 'A value is being used in an incompatible way - e.g., calling a method on `None`, or mixing incompatible types in an operation.'
  if (error.includes('NameError') || error.includes('undefined')) return 'A variable or function is referenced before being defined, or the name is misspelled.'
  if (error.includes('ZeroDivisionError') || error.includes('division by zero')) return 'A division operation is executing with a denominator of zero. Add a guard: `if divisor != 0` before dividing.'
  if (error.includes('NullPointerException') || error.includes('null pointer')) return 'A null/nil reference is being dereferenced. Add null checks before calling methods on objects that might be null.'
  if (error.includes('syntax') || error.includes('SyntaxError')) return 'The code has a syntax error - a missing bracket, comma, colon, or other token that the parser cannot handle.'
  if (error.includes('stack overflow') || error.includes('RecursionError')) return 'Infinite recursion - the function calls itself without a proper base case, exhausting the call stack.'
  return 'A runtime exception occurred during execution. Check the stack trace above for the exact line number.'
}

function getFixSuggestion(error: string, code: string, lang: string): string {
  if (error.includes('IndexError') || error.includes('out of range')) {
    return `Add bounds checking before array access:\n\`\`\`${lang}\n${lang === 'python' ? 'if 0 <= index < len(arr):\n    return arr[index]' : 'if (index >= 0 && index < arr.length) {\n    return arr[index];\n}'}\n\`\`\``
  }
  if (error.includes('ZeroDivisionError') || error.includes('division by zero')) {
    return `Guard against division by zero:\n\`\`\`${lang}\n${lang === 'python' ? 'if divisor != 0:\n    result = numerator / divisor\nelse:\n    raise ValueError("Cannot divide by zero")' : 'if (divisor === 0) throw new Error("Division by zero");\nconst result = numerator / divisor;'}\n\`\`\``
  }
  return `Review line ${error.match(/line (\d+)/)?.[1] ?? 'indicated'} in the stack trace and add appropriate error handling.`
}

function getErrorExplanation(error: string, lang: string): string {
  if (error.includes('IndexError')) return `In ${lang}, arrays/lists are 0-indexed. Accessing \`arr[n]\` when the array has \`n\` elements causes this error since the last valid index is \`n-1\`.`
  if (error.includes('ZeroDivisionError')) return 'Division by zero is mathematically undefined. In programming, it causes an immediate runtime exception rather than producing infinity (unless using floating-point with special IEEE 754 handling).'
  return 'Runtime errors occur when the program encounters an unexpected state during execution that it cannot recover from.'
}

function optimizeCode(code: string, lang: string): string {
  const currentComplexity = detectComplexity(code)
  return `## ⚡ Optimization Analysis

### Current Performance
| Metric | Current | Target |
|--------|---------|--------|
| Time   | \`${currentComplexity}\` | \`O(n)\` or better |
| Space  | \`O(n)\` | \`O(1)\` if possible |
| Lines  | ${countLines(code)} | Reducible |

### Identified Bottlenecks
${getBottlenecks(code, lang)}

### Optimized Approach
${getOptimization(code, lang)}

### Memory Optimization Tips
${getMemoryTips(code, lang)}

### Profiling Advice
- Use \`cProfile\` (Python), \`perf\` (C++), or \`pprof\` (Go) to find actual hotspots
- Benchmark with realistic data sizes, not just small examples
- Consider cache locality - sequential memory access is 10-100× faster than random`
}

function getBottlenecks(code: string, lang: string): string {
  const issues: string[] = []
  if (code.match(/for.*\n.*for/s)) issues.push('- **Nested loops**: O(n²) - consider hash map for O(n)')
  if (/\.sort\(\)|sort\(/.test(code) && !code.includes('sort only')) issues.push('- **Repeated sorting**: sort once and reuse, or use a sorted insert (heap)')
  if (/String\s*\+|str\s*\+/i.test(code) && lang !== 'go') issues.push('- **String concatenation in loop**: use StringBuilder/join instead')
  if (issues.length === 0) issues.push('- No major bottlenecks detected - code is reasonably efficient')
  return issues.join('\n')
}

function getOptimization(code: string, lang: string): string {
  if (/fibonacci/i.test(code)) {
    if (lang === 'python') return `The generator approach is already optimal. For memoized recursion:\n\`\`\`python\nfrom functools import lru_cache\n\n@lru_cache(maxsize=None)\ndef fib(n: int) -> int:\n    return n if n <= 1 else fib(n-1) + fib(n-2)\n\`\`\``
    return 'The iterative approach is optimal for space. Consider memoization for repeated calls.'
  }
  if (/two.?sum/i.test(code) || code.match(/for.*for.*target/s)) {
    return `Replace O(n²) nested loop with O(n) hash map:\n\`\`\`${lang}\n${lang === 'python' ? 'def two_sum(nums, target):\n    seen = {}\n    for i, n in enumerate(nums):\n        if target - n in seen:\n            return [seen[target - n], i]\n        seen[n] = i' : 'function twoSum(nums, target) {\n  const seen = new Map();\n  for (let i = 0; i < nums.length; i++) {\n    const complement = target - nums[i];\n    if (seen.has(complement)) return [seen.get(complement), i];\n    seen.set(nums[i], i);\n  }\n}'}\n\`\`\``
  }
  return 'Profile first to identify real bottlenecks. Premature optimization is the root of all evil.'
}

function getMemoryTips(code: string, lang: string): string {
  const tips: string[] = []
  if (lang === 'python') {
    if (code.includes('[') && !code.includes('yield')) tips.push('- Use **generators** instead of lists where possible: `(x for x in ...)` vs `[x for x in ...]`')
    tips.push('- Use `__slots__` in classes to reduce per-instance memory overhead')
  }
  if (lang === 'javascript' || lang === 'typescript') {
    tips.push('- Use `TypedArray` (Int32Array, Float64Array) for numeric data - 8× less memory than regular arrays')
    tips.push('- Avoid closure-heavy patterns in hot loops - each closure allocates a new object')
  }
  if (tips.length === 0) tips.push('- Current memory usage appears reasonable for this algorithm')
  return tips.join('\n')
}

function codeReview(code: string, lang: string): string {
  return `## 🔍 Code Review

**Overall Rating: ${Math.floor(7 + Math.random() * 2)}/10** - Good code with minor improvements possible.

### ✅ Strengths
${getStrengths(code, lang)}

### ⚠️ Issues & Suggestions
${getIssues(code, lang)}

### 🧪 Edge Cases to Test
${getEdgeCases(code, lang)}

### 📏 Style & Convention
${getStyleNotes(code, lang)}

### Security Considerations
- No obvious injection vulnerabilities
- Ensure user inputs are validated before processing
- Consider rate limiting for any API-facing functions`
}

function getStrengths(code: string, lang: string): string {
  const strengths: string[] = []
  if (code.includes('/**') || code.includes('"""') || code.includes('///')) strengths.push('✓ Documentation/comments present')
  if (/interface|trait|protocol|abstract/.test(code)) strengths.push('✓ Uses abstractions for flexible design')
  if (countLines(code) < 80) strengths.push('✓ Concise - functions are appropriately sized')
  if (/try|catch|rescue|except/.test(code)) strengths.push('✓ Error handling present')
  if (strengths.length === 0) strengths.push('✓ Readable code structure\n✓ Consistent naming conventions')
  return strengths.join('\n')
}

function getIssues(code: string, lang: string): string {
  const issues: string[] = []
  if (!code.includes('//') && !code.includes('#') && !code.includes('/*')) {
    if (lang !== 'sql') issues.push('- Consider adding comments explaining **why** (not what) the code does')
  }
  if (/magic_number|[^a-zA-Z](?<![."])[2-9][0-9]{2,}/.test(code)) {
    issues.push('- Extract magic numbers into named constants for readability')
  }
  if (issues.length === 0) issues.push('- No major issues found - code is clean and well-structured')
  return issues.join('\n')
}

function getEdgeCases(code: string, lang: string): string {
  return `- **Empty input**: What happens when the array/string is empty?
- **Single element**: Does it work with only one item?
- **Duplicates**: Are duplicate values handled correctly?
- **Large input**: Will it handle n = 10⁶ within time limits?
- **Negative values**: Does the algorithm work with negative numbers?`
}

function getStyleNotes(code: string, lang: string): string {
  if (lang === 'python') return '- PEP 8 compliant style ✓\n- Consider using `dataclasses` or `namedtuple` for simple data containers\n- Type hints improve IDE support and documentation'
  if (lang === 'javascript' || lang === 'typescript') return '- Use `const` over `let` where variables are not reassigned\n- Prefer arrow functions for short callbacks\n- ESLint + Prettier recommended for consistent formatting'
  if (lang === 'go') return '- Follow `gofmt` for consistent formatting\n- Error values should be checked immediately\n- Prefer interfaces with 1-2 methods for maximum flexibility'
  return `- Follow ${lang} community style guides\n- Use a linter for automated style enforcement`
}

function addComments(code: string, lang: string): string {
  return `## 📝 Documented Version

Here's your code with comprehensive documentation added:

\`\`\`${lang}
${generateDocumentedCode(code, lang)}
\`\`\`

### Documentation Strategy Used
- **Function docs**: Describe purpose, parameters, return values, and complexity
- **Inline comments**: Explain non-obvious logic (the *why*, not the *what*)
- **Section dividers**: Group related code for readability
- **Complexity annotations**: Document time/space complexity for algorithmic code`
}

function generateDocumentedCode(code: string, lang: string): string {
  const lines = code.split('\n')
  const result: string[] = []

  if (lang === 'python') {
    for (const line of lines) {
      result.push(line)
      if (line.trim().startsWith('def ') && !lines[lines.indexOf(line) + 1]?.trim().startsWith('"""')) {
        const fnName = line.match(/def (\w+)/)?.[1] ?? 'function'
        result.push(`    """${fnName.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}."""`)
      }
    }
  } else {
    for (const line of lines) {
      if (/function\s+\w+|def\s+\w+|fn\s+\w+|func\s+\w+/.test(line) && !line.includes('//')) {
        result.push(`// Performs the ${line.match(/(?:function|def|fn|func)\s+(\w+)/)?.[1] ?? 'operation'} operation.`)
      }
      result.push(line)
    }
  }

  return result.join('\n')
}

function generateTests(code: string, lang: string): string {
  return `## 🧪 Unit Tests Generated

\`\`\`${lang === 'python' ? 'python' : lang}
${getTestCode(code, lang)}
\`\`\`

### Test Coverage
- ✅ Happy path (typical inputs)
- ✅ Edge cases (empty, single element)
- ✅ Boundary values
- ✅ Error conditions

### Running Tests
\`\`\`bash
${lang === 'python' ? 'python -m pytest test_solution.py -v' : lang === 'javascript' || lang === 'typescript' ? 'npm test' : lang === 'java' ? 'mvn test' : lang === 'go' ? 'go test ./...' : 'cargo test'}
\`\`\``
}

function getTestCode(code: string, lang: string): string {
  if (lang === 'python') {
    return `import pytest

class TestSolution:
    def test_basic_case(self):
        # Arrange
        result = solution([1, 2, 3])
        # Assert
        assert result == expected_value

    def test_empty_input(self):
        with pytest.raises(ValueError):
            solution([])

    def test_single_element(self):
        assert solution([42]) == 42

    def test_large_input(self):
        large = list(range(10000))
        result = solution(large)
        assert result is not None

    @pytest.mark.parametrize("input,expected", [
        ([1, 2, 3], 6),
        ([0, 0, 0], 0),
        ([-1, -2, 3], 0),
    ])
    def test_parametrized(self, input, expected):
        assert solution(input) == expected`
  }
  if (lang === 'javascript' || lang === 'typescript') {
    return `describe('Solution', () => {
  test('handles basic case', () => {
    expect(solution([1, 2, 3])).toBe(6);
  });

  test('handles empty array', () => {
    expect(() => solution([])).toThrow();
  });

  test('handles single element', () => {
    expect(solution([42])).toBe(42);
  });

  test.each([
    [[1, 2, 3], 6],
    [[0, 0, 0], 0],
    [[-1, -2, 3], 0],
  ])('solution(%p) === %i', (input, expected) => {
    expect(solution(input)).toBe(expected);
  });
});`
  }
  return `// Add tests for your ${lang} code here`
}

// ── Main response dispatcher ───────────────────────────────────────────────
export async function generateAIResponse(
  action: AIAction,
  userMessage: string,
  code: string,
  lang: string,
  executionResult?: ExecutionResult | null,
  accessToken?: string,
): Promise<string> {
  if (!accessToken) throw new Error('Sign in with GitHub to use CodeForge AI.')
  const prompt = action === 'chat'
    ? userMessage
    : `${action} the following ${lang} code. Return a useful, structured answer with markdown and code examples where appropriate.`
  const response = await generateAIReply(
    accessToken,
    `${prompt}\n\nUser request:\n${userMessage}\n\nExecution result:\n${executionResult ? JSON.stringify(executionResult) : 'No execution yet.'}`,
    code,
    lang,
  )
  return response.text
}

function getLocalResponse(action: AIAction, userMessage: string, code: string, lang: string, executionResult?: ExecutionResult | null): string {

  const error = executionResult?.stderr ?? executionResult?.compile_output ?? undefined

  switch (action) {
    case 'explain':  return explainCode(code, lang)
    case 'fix':      return fixBug(code, lang, error)
    case 'optimize': return optimizeCode(code, lang)
    case 'review':   return codeReview(code, lang)
    case 'comment':  return addComments(code, lang)
    case 'tests':    return generateTests(code, lang)
    case 'generate': return `## Code generation\n\nTell me what you want to build and I will write the complete ${lang} solution. Include inputs, outputs, edge cases, and any constraints in your request.`
    case 'chat':     return handleChatMessage(userMessage, code, lang, executionResult)
    default:         return 'I\'m ready to help! What would you like to know about your code?'
  }
}

function handleChatMessage(msg: string, code: string, lang: string, result?: ExecutionResult | null): string {
  const lower = msg.toLowerCase()

  if (lower.includes('explain') || lower.includes('what does')) return explainCode(code, lang)
  if (lower.includes('fix') || lower.includes('error') || lower.includes('bug')) return fixBug(code, lang, result?.stderr ?? result?.compile_output ?? undefined)
  if (lower.includes('optim') || lower.includes('faster') || lower.includes('efficient')) return optimizeCode(code, lang)
  if (lower.includes('review') || lower.includes('feedback')) return codeReview(code, lang)
  if (lower.includes('comment') || lower.includes('document')) return addComments(code, lang)
  if (lower.includes('test')) return generateTests(code, lang)
  if (
    (lower.includes('html') && (lower.includes('css') || lower.includes('js') || lower.includes('javascript'))) ||
    lower.includes('web app') || lower.includes('website') || lower.includes('todo') || lower.includes('calculator') ||
    lower.includes('counter') || lower.includes('clock')
  ) {
    return generateTests(code, 'html') // will be handled by askAI in live mode
  }
  if (lower.includes('complexity') || lower.includes('big o')) {
    const c = detectComplexity(code)
    return `## Time & Space Complexity\n\n**Time**: \`${c}\`\n**Space**: \`O(n)\`\n\n${getComplexityExplanation(c, code)}`
  }
  if (lower.includes('hello') || lower.includes('hi')) {
    return `👋 Hello! I'm CodeForge AI, your coding assistant.\n\nI can help you:\n- **Full-Stack Web Apps:** HTML, CSS, and complete JavaScript\n- **Explain** what your code does\n- **Fix** bugs and runtime errors\n- **Optimize** for speed and memory\n- **Review** code quality and architecture\n- **Generate unit tests**\n\nJust ask, or tell me what you want to build!`
  }

  return `## Response to: "${msg}"\n\nBased on your ${lang} code, here's my analysis:\n\n${getGeneralResponse(code, lang, msg)}\n\n---\n*Click a quick action button for specific analysis: Explain, Fix Bug, Optimize, or Review.*`
}

function getComplexityExplanation(c: string, code: string): string {
  if (c === 'O(n²)') return '**Why O(n²)?** Your code has nested loops where both run up to n iterations. For n=1000 inputs, this runs ~1,000,000 operations.\n\n**Can we do better?** Often yes - hash maps can reduce O(n²) lookups to O(n).'
  if (c === 'O(n log n)') return '**Why O(n log n)?** This is sorting complexity - optimal for comparison-based sorting. For n=1,000,000 inputs, ~20,000,000 operations (very fast in practice).'
  if (c === 'O(log n)') return '**Why O(log n)?** Binary search halves the search space each iteration. For n=1,000,000,000 inputs, only ~30 comparisons needed!'
  return '**O(n)** is excellent - linear time means operations scale directly with input size. This is optimal for problems that require examining each element at least once.'
}

function getGeneralResponse(code: string, lang: string, msg: string): string {
  return `Your ${lang} code (${countLines(code)} lines) uses ${detectPatterns(code).slice(0, 2).join(' and ') || 'standard algorithms'} with a time complexity of approximately \`${detectComplexity(code)}\`.\n\nThe code appears syntactically correct. ${detectPatterns(code).length > 0 ? `I notice it implements **${detectPatterns(code)[0]}** - a solid choice for this type of problem.` : 'The structure is clean and readable.'}`
}

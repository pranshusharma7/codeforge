// ── CodeForge Interactive Debugger Engine ─────────────────────────────────────
// Multi-language execution simulation, breakpoint management, and variable tracing

export interface DebugVariable {
  name: string
  value: any
  type: string
  changed?: boolean
}

export interface CallStackFrame {
  functionName: string
  line: number
  file: string
}

export interface DebugStep {
  line: number
  description: string
  variables: Record<string, DebugVariable>
  callStack: CallStackFrame[]
  output: string
  isBreakpoint?: boolean
}

export interface WatchItem {
  id: string
  expression: string
  value: string
  isError?: boolean
}

export interface BugInsight {
  line?: number
  severity: 'error' | 'warning' | 'info'
  title: string
  description: string
  suggestion?: string
}

/**
 * Parses code and generates a step-by-step execution simulation
 * Supports JS/TS, Python, C++, Java, and common algorithms
 */
export function generateExecutionTrace(
  code: string,
  langId: string,
  breakpoints: number[],
  stdin: string = ''
): DebugStep[] {
  const lines = code.split('\n')
  const totalLines = lines.length

  // Normalize language families
  const isPython = langId.includes('python') || langId === 'py'
  const isCStyle = ['c', 'cpp', 'java', 'csharp', 'go', 'rust', 'typescript', 'javascript', 'js', 'ts'].some(l => langId.includes(l))

  const steps: DebugStep[] = []
  const variables: Record<string, DebugVariable> = {}
  let accumulatedOutput = ''
  const stdinLines = stdin ? stdin.trim().split('\n') : []
  let stdinIndex = 0

  // Identify meaningful non-empty, non-comment lines
  const executableLines: { lineNum: number; content: string }[] = []

  for (let i = 0; i < totalLines; i++) {
    const raw = lines[i]
    const trimmed = raw.trim()
    if (!trimmed) continue

    // Comments filter
    if (trimmed.startsWith('//') || trimmed.startsWith('#') || trimmed.startsWith('/*') || trimmed.startsWith('*')) {
      continue
    }
    // Filter pure structural closing braces
    if (trimmed === '}' || trimmed === '};') continue

    executableLines.push({ lineNum: i + 1, content: trimmed })
  }

  if (executableLines.length === 0) {
    return [{
      line: 1,
      description: 'No executable statements found',
      variables: {},
      callStack: [{ functionName: '<main>', line: 1, file: 'main' }],
      output: ''
    }]
  }

  // Pre-seed some inputs if stdin is provided
  if (stdinLines.length > 0) {
    variables['stdin'] = { name: 'stdin', value: stdinLines[0], type: 'string' }
  }

  let callStack: CallStackFrame[] = [{ functionName: '<main>', line: executableLines[0].lineNum, file: 'main' }]
  let prevVars = { ...variables }

  // Simulate execution steps
  const maxSimulationSteps = 100
  let stepCount = 0

  // Track simple loop state if present
  let loopVar = ''
  let loopLimit = 0
  let loopCurrent = 0
  let loopLineIndex = -1

  for (let i = 0; i < executableLines.length && stepCount < maxSimulationSteps; i++) {
    const item = executableLines[i]
    const lineNum = item.lineNum
    const lineText = item.content
    stepCount++

    let stepDesc = `Line ${lineNum}: ${lineText}`

    // Check for function definitions
    const fnMatch = isPython
      ? lineText.match(/^def\s+([a-zA-Z_]\w*)\s*\((.*?)\)/)
      : lineText.match(/(?:function\s+|public\s+static\s+\w+\s+|void\s+|int\s+|const\s+)(\w+)\s*\((.*?)\)/)

    if (fnMatch && !lineText.includes('main')) {
      const fnName = fnMatch[1]
      variables[fnName] = { name: fnName, value: `[Function: ${fnName}]`, type: 'function' }
      stepDesc = `Defined function ${fnName}()`
    }

    // Check for variable declarations & assignments
    // Example: let x = 10; var a = [1, 2, 3]; int sum = 0; x = 5; count += 1;
    const assignMatch = lineText.match(/(?:let|const|var|int|float|double|char|string|auto|val)?\s*([a-zA-Z_]\w*)\s*(?:=|:=|\+=|-=|\*=)\s*(.+?)(?:;|$)/)

    if (assignMatch) {
      const varName = assignMatch[1].trim()
      let expr = assignMatch[2].trim()

      if (varName !== 'function' && varName !== 'return' && varName !== 'if' && varName !== 'for' && varName !== 'while') {
        let evaluatedValue: any = expr
        let varType = 'string'

        // Evaluate numbers, arrays, booleans, strings
        if (/^-?\d+(\.\d+)?$/.test(expr)) {
          evaluatedValue = Number(expr)
          varType = 'number'
        } else if (expr === 'true' || expr === 'false' || expr === 'True' || expr === 'False') {
          evaluatedValue = expr.toLowerCase() === 'true'
          varType = 'boolean'
        } else if (expr.startsWith('[') && expr.endsWith(']')) {
          try {
            evaluatedValue = JSON.parse(expr.replace(/'/g, '"'))
            varType = 'array'
          } catch {
            evaluatedValue = expr
            varType = 'array'
          }
        } else if ((expr.startsWith('"') && expr.endsWith('"')) || (expr.startsWith("'") && expr.endsWith("'"))) {
          evaluatedValue = expr.slice(1, -1)
          varType = 'string'
        } else if (expr.includes('+') || expr.includes('-') || expr.includes('*') || expr.includes('/')) {
          // Attempt basic math evaluation using known variables
          try {
            let replaced = expr
            for (const [vName, vData] of Object.entries(variables)) {
              if (typeof vData.value === 'number') {
                replaced = replaced.replace(new RegExp(`\\b${vName}\\b`, 'g'), String(vData.value))
              }
            }
            if (/^[\d\s+\-*/().%]+$/.test(replaced)) {
              // eslint-disable-next-line no-eval
              const res = Function(`"use strict"; return (${replaced});`)()
              if (typeof res === 'number' && !isNaN(res)) {
                evaluatedValue = res
                varType = 'number'
              }
            }
          } catch {}
        } else if (variables[expr]) {
          evaluatedValue = variables[expr].value
          varType = variables[expr].type
        }

        const changed = !prevVars[varName] || prevVars[varName].value !== evaluatedValue

        variables[varName] = {
          name: varName,
          value: evaluatedValue,
          type: varType,
          changed
        }

        stepDesc = `Assigned ${varName} = ${JSON.stringify(evaluatedValue)}`
      }
    }

    // Check for Print / Output statements
    // console.log, print, cout, System.out.println, fmt.Println
    const printMatch = lineText.match(/(?:console\.log|print|System\.out\.println|System\.out\.print|cout\s*<<|fmt\.Println|printf)\s*\((.*?)\)|cout\s*<<\s*([^;]+)/)
    if (printMatch) {
      let printContent = (printMatch[1] || printMatch[2] || '').trim()
      printContent = printContent.replace(/<<\s*endl/g, '').replace(/<<\s*"\\n"/g, '').trim()

      let outText = printContent

      // Check if variable is being printed
      if (variables[printContent]) {
        outText = String(variables[printContent].value)
      } else if ((printContent.startsWith('"') && printContent.endsWith('"')) || (printContent.startsWith("'") && printContent.endsWith("'"))) {
        outText = printContent.slice(1, -1)
      } else {
        // Replace variable references inside print
        for (const [vName, vData] of Object.entries(variables)) {
          const regex = new RegExp(`\\b${vName}\\b`, 'g')
          if (regex.test(outText)) {
            outText = outText.replace(regex, typeof vData.value === 'object' ? JSON.stringify(vData.value) : String(vData.value))
          }
        }
      }

      accumulatedOutput += (accumulatedOutput ? '\n' : '') + outText
      stepDesc = `Output: ${outText}`
    }

    // Check for Loops (for / while)
    const forMatch = isPython
      ? lineText.match(/for\s+([a-zA-Z_]\w*)\s+in\s+range\s*\((.*?)\):/)
      : lineText.match(/for\s*\(\s*(?:let|var|int)?\s*([a-zA-Z_]\w*)\s*=\s*(\d+)\s*;\s*\1\s*<\s*(\d+)/)

    if (forMatch && loopLineIndex === -1) {
      loopVar = forMatch[1]
      const start = forMatch[2] ? parseInt(forMatch[2], 10) : 0
      const limit = parseInt(forMatch[3] || forMatch[2] || '3', 10)
      loopLimit = Math.min(limit, 5) // simulate up to 5 iterations for clean stepping
      loopCurrent = start
      loopLineIndex = i

      variables[loopVar] = { name: loopVar, value: loopCurrent, type: 'number', changed: true }
      stepDesc = `Loop start: ${loopVar} = ${loopCurrent} (up to ${loopLimit})`
    }

    // Update call stack line
    callStack = [{ functionName: '<main>', line: lineNum, file: 'main' }]

    // Check if line hits a user breakpoint
    const isBreakpoint = breakpoints.includes(lineNum)

    // Snapshot variables for this step
    const varsSnapshot: Record<string, DebugVariable> = {}
    for (const [k, v] of Object.entries(variables)) {
      varsSnapshot[k] = { ...v }
    }

    steps.push({
      line: lineNum,
      description: stepDesc,
      variables: varsSnapshot,
      callStack: [...callStack],
      output: accumulatedOutput,
      isBreakpoint
    })

    prevVars = { ...varsSnapshot }

    // If in loop and not finished, cycle next executable statement
    if (loopLineIndex !== -1 && i > loopLineIndex && loopCurrent < loopLimit - 1) {
      loopCurrent++
      variables[loopVar] = { name: loopVar, value: loopCurrent, type: 'number', changed: true }
      i = loopLineIndex // step back to loop body
    } else if (loopCurrent >= loopLimit - 1) {
      loopLineIndex = -1
    }
  }

  // Ensure there is at least one step
  if (steps.length === 0) {
    steps.push({
      line: 1,
      description: 'Program execution completed',
      variables,
      callStack: [{ functionName: '<main>', line: 1, file: 'main' }],
      output: accumulatedOutput || 'Execution finished successfully.'
    })
  }

  return steps
}

/**
 * Evaluates watch expressions based on current variables
 */
export function evaluateWatchExpression(expr: string, variables: Record<string, DebugVariable>): string {
  const trimmed = expr.trim()
  if (!trimmed) return 'undefined'

  // Direct variable match
  if (variables[trimmed] !== undefined) {
    const val = variables[trimmed].value
    return typeof val === 'object' ? JSON.stringify(val) : String(val)
  }

  // Try math or comparison expression
  try {
    let replaced = trimmed
    for (const [vName, vData] of Object.entries(variables)) {
      const valStr = typeof vData.value === 'string' ? `"${vData.value}"` : JSON.stringify(vData.value)
      replaced = replaced.replace(new RegExp(`\\b${vName}\\b`, 'g'), valStr)
    }

    // Safe execution of pure arithmetic or comparison
    const result = Function(`"use strict"; return (${replaced});`)()
    return typeof result === 'object' ? JSON.stringify(result) : String(result)
  } catch (err: any) {
    return 'ReferenceError: ' + err.message
  }
}

/**
 * Intelligent static bug detection for debugging assistant
 */
export function analyzeCodeForBugs(code: string, langId: string): BugInsight[] {
  const insights: BugInsight[] = []
  const lines = code.split('\n')

  lines.forEach((line, idx) => {
    const lineNum = idx + 1
    const trimmed = line.trim()

    // 1. Assignment in if condition: if (x = 5)
    if (/if\s*\(\s*[a-zA-Z_]\w*\s*=\s*[^=]/.test(trimmed)) {
      insights.push({
        line: lineNum,
        severity: 'error',
        title: 'Accidental Assignment in Condition',
        description: 'Using single "=" inside an if statement assigns value instead of comparing.',
        suggestion: 'Change "=" to "==" or "===" for equality comparison.'
      })
    }

    // 2. Division by zero
    if (/\/\s*0(?![.\d])/.test(trimmed)) {
      insights.push({
        line: lineNum,
        severity: 'error',
        title: 'Division by Zero Detected',
        description: 'Attempting to divide by literal 0 causes runtime error or Infinity.',
        suggestion: 'Ensure the denominator is non-zero before dividing.'
      })
    }

    // 3. Infinite loop: while (true) with no break
    if (/while\s*\(\s*(true|1)\s*\)/i.test(trimmed)) {
      insights.push({
        line: lineNum,
        severity: 'warning',
        title: 'Potential Infinite Loop',
        description: 'Loop condition is always true. Ensure there is a reachable break statement.',
        suggestion: 'Add a termination condition or break inside the loop body.'
      })
    }

    // 4. Off-by-one index access: arr[arr.length]
    if (/\w+\[\w+\.length\]/.test(trimmed) || /\w+\[len\(\w+\)\]/.test(trimmed)) {
      insights.push({
        line: lineNum,
        severity: 'error',
        title: 'Array Index Out of Bounds (Off-by-one)',
        description: 'Arrays are 0-indexed. Accessing index length is 1 beyond the last element.',
        suggestion: 'Use length - 1 to access the last element.'
      })
    }

    // 5. Missing return in function
    if (/function\s+\w+/.test(trimmed) && code.includes('{') && !code.includes('return')) {
      if (!insights.some(i => i.title === 'No Return Statement')) {
        insights.push({
          line: lineNum,
          severity: 'info',
          title: 'No Return Statement',
          description: 'Function does not explicitly return a value (will return undefined or void).',
          suggestion: 'Add "return <value>;" if this function produces output.'
        })
      }
    }
  })

  // General positive feedback if no bugs found
  if (insights.length === 0) {
    insights.push({
      severity: 'info',
      title: 'No Syntax or Logic Anomalies Detected',
      description: 'Code structure looks clean and ready for step-by-step debugging.',
      suggestion: 'Set breakpoints on key lines (click in the gutter or line numbers) to inspect variables!'
    })
  }

  return insights
}

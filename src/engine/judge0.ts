/**
 * Judge0 execution engine.
 *
 * To wire real Judge0:
 *   1. Set VITE_JUDGE0_URL=https://judge0-ce.p.rapidapi.com  (or self-hosted)
 *   2. Set VITE_JUDGE0_KEY=<your-rapid-api-key>
 *   3. The submit/poll functions below will use those env vars.
 *
 * Without env vars, the engine falls back to realistic simulation.
 */

import type { ExecutionResult, ExecutionStatus, Language } from '../types'

const J0_URL = import.meta.env.VITE_JUDGE0_URL as string | undefined
const J0_KEY = import.meta.env.VITE_JUDGE0_KEY as string | undefined
const REAL = Boolean(J0_URL && J0_KEY)

// ── Real Judge0 ────────────────────────────────────────────────────────────
async function submitReal(lang: Language, code: string, stdin: string): Promise<ExecutionResult> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-RapidAPI-Host': 'judge0-ce.p.rapidapi.com',
    'X-RapidAPI-Key': J0_KEY!,
  }

  const body = JSON.stringify({
    language_id: lang.judge0Id,
    source_code: btoa(code),
    stdin: btoa(stdin),
    cpu_time_limit: 10,
    memory_limit: 131072, // 128 MB
  })

  // Submit
  const submitResp = await fetch(`${J0_URL}/submissions?base64_encoded=true&wait=false`, {
    method: 'POST', headers, body,
  })
  const { token } = await submitResp.json()

  // Poll until done (max 30s)
  for (let i = 0; i < 30; i++) {
    await new Promise(r => setTimeout(r, 1000))
    const pollResp = await fetch(`${J0_URL}/submissions/${token}?base64_encoded=true&fields=status,stdout,stderr,compile_output,time,memory,exit_code`, { headers })
    const data = await pollResp.json()

    if (data.status?.id <= 2) continue // queued/processing

    return mapJ0Result(data)
  }
  throw new Error('Execution timed out')
}

function mapJ0Result(data: any): ExecutionResult {
  const decode = (b64: string | null) => b64 ? atob(b64) : ''
  const statusMap: Record<number, ExecutionStatus> = {
    3: 'accepted', 4: 'wrong_answer', 5: 'time_limit',
    6: 'compile_error', 7: 'runtime_error', 8: 'runtime_error',
    9: 'runtime_error', 10: 'runtime_error', 11: 'runtime_error',
    12: 'runtime_error', 13: 'runtime_error', 14: 'memory_limit',
  }
  return {
    status: statusMap[data.status?.id] ?? 'runtime_error',
    stdout: decode(data.stdout),
    stderr: decode(data.stderr),
    compileOutput: decode(data.compile_output),
    timeMs: data.time ? Math.round(Number(data.time) * 1000) : null,
    memoryKb: data.memory ?? null,
    exitCode: data.exit_code ?? null,
  }
}

// ── Simulation ─────────────────────────────────────────────────────────────
const SAMPLE_OUTPUTS: Record<string, (stdin: string) => { stdout: string; timeMs: number; memKb: number }> = {
  cpp: (stdin) => {
    const nums = parseNums(stdin)
    const sorted = [...nums].sort((a, b) => a - b)
    return { stdout: `Sorted: ${sorted.join(' ')}\n`, timeMs: 12, memKb: 3856 }
  },
  python: (stdin) => {
    const lines = stdin.trim().split('\n')
    const nums = lines[1]?.split(' ').map(Number) ?? []
    const sorted = [...nums].sort((a, b) => a - b)
    return { stdout: `5 + ${sorted[sorted.length-1]} = ${5 + (sorted[sorted.length-1] ?? 0)}\n3 + ${sorted[sorted.length-2] ?? 0} = ${3 + (sorted[sorted.length-2] ?? 0)}\n`, timeMs: 38, memKb: 10240 }
  },
  javascript: (stdin) => {
    const nums = parseNums(stdin)
    const sorted = [...nums].sort((a, b) => a - b)
    return { stdout: `Sorted: ${sorted.join(' ')}\n`, timeMs: 58, memKb: 28672 }
  },
  java: (stdin) => {
    const nums = parseNums(stdin)
    const sorted = [...nums].sort((a, b) => a - b)
    return { stdout: `Sorted: ${sorted.join(' ')}\n`, timeMs: 142, memKb: 49152 }
  },
  go: (stdin) => {
    const nums = parseNums(stdin)
    const sorted = [...nums].sort((a, b) => a - b)
    return { stdout: `Sorted: ${sorted.join(' ')}\n`, timeMs: 8, memKb: 2048 }
  },
  rust: (stdin) => {
    const nums = parseNums(stdin)
    const sorted = [...nums].sort((a, b) => a - b)
    return { stdout: `Sorted: ${sorted.join(' ')}\n`, timeMs: 6, memKb: 1792 }
  },
  sql: () => ({
    stdout: [
      'department    | headcount | avg_salary | top_salary',
      '--------------|-----------|------------|----------',
      'Engineering   | 3         | 95000.00   | 102000',
      'Design        | 1         | 78000.00   | 78000',
      'Marketing     | 1         | 65000.00   | 65000',
    ].join('\n') + '\n',
    timeMs: 4, memKb: 1024,
  }),
  default: () => ({ stdout: 'Program executed successfully.\n', timeMs: 20, memKb: 4096 }),
}

function parseNums(stdin: string) {
  return (stdin.split('\n')[1] ?? stdin).trim().split(/\s+/).map(Number).filter(n => !isNaN(n))
}

async function simulateExec(lang: Language, code: string, stdin: string): Promise<ExecutionResult> {
  // Check for deliberate syntax errors
  const errPatterns: [RegExp, string][] = [
    [/print\s+[^(]/, "SyntaxError: Missing parentheses in call to 'print'. Did you mean print(...)?"],
    [/Console\.log\s*\(/, ''], // OK pattern, ignore
    [/System\.out\.println\s*\(/, ''], // OK
  ]
  for (const [re, msg] of errPatterns) {
    if (msg && re.test(code) && lang.id === 'python') {
      return { status: 'runtime_error', stdout: '', stderr: msg, compileOutput: '', timeMs: 0, memoryKb: 0, exitCode: 1 }
    }
  }

  await new Promise(r => setTimeout(r, 300 + Math.random() * 400))

  const fn = SAMPLE_OUTPUTS[lang.id] ?? SAMPLE_OUTPUTS.default
  const out = fn(stdin || '5\n3 1 4 1 5')
  return {
    status: 'accepted',
    stdout: out.stdout,
    stderr: '',
    compileOutput: '',
    timeMs: out.timeMs,
    memoryKb: out.memKb,
    exitCode: 0,
  }
}

// ── Public API ─────────────────────────────────────────────────────────────
export async function executeCode(lang: Language, code: string, stdin: string): Promise<ExecutionResult> {
  if (REAL) return submitReal(lang, code, stdin)
  return simulateExec(lang, code, stdin)
}

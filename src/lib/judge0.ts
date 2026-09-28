export interface ExecutionResult {
  stdout: string | null
  stderr: string | null
  compile_output: string | null
  status: { id: number; description: string }
  time: string | null
  memory: number | null
  exit_code: number | null
  message?: string | null
}

export const STATUS = {
  ACCEPTED: 3,
  WRONG_ANSWER: 4,
  TIME_LIMIT: 5,
  COMPILE_ERROR: 6,
  RUNTIME_ERROR_SIGSEGV: 7,
  RUNTIME_ERROR_SIGXFSZ: 8,
  RUNTIME_ERROR_SIGFPE: 9,
  RUNTIME_ERROR_SIGABRT: 10,
  RUNTIME_ERROR_NZEC: 11,
  RUNTIME_ERROR_OTHER: 12,
  INTERNAL_ERROR: 13,
}

// Judge0 public CE instance
const JUDGE0_URL = 'https://ce.judge0.com'

function sleep(ms: number) {
  return new Promise(r => setTimeout(r, ms))
}

/**
 * Unicode-safe base64 encoder
 */
function encodeB64(str: string): string {
  try {
    return btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, (_, p1) => String.fromCharCode(parseInt(p1, 16))))
  } catch {
    try {
      return btoa(unescape(encodeURIComponent(str)))
    } catch {
      return btoa(str)
    }
  }
}

/**
 * Unicode-safe base64 decoder
 */
function decodeB64(b64: string | null | undefined): string | null {
  if (!b64) return null
  try {
    const binary = atob(b64)
    const bytes = new Uint8Array(binary.length)
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i)
    }
    return new TextDecoder('utf-8').decode(bytes)
  } catch {
    try {
      return decodeURIComponent(escape(atob(b64)))
    } catch {
      return atob(b64)
    }
  }
}

export async function executeCode(params: {
  sourceCode: string
  languageId: number
  stdin?: string
}): Promise<ExecutionResult> {
  const startTime = performance.now()

  // 1. Submit code asynchronously to Judge0 with base64 encoding (avoids queue bottlenecks and character corruption)
  try {
    const subRes = await fetch(`${JUDGE0_URL}/submissions?base64_encoded=true&wait=false`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        source_code: encodeB64(params.sourceCode),
        language_id: params.languageId,
        stdin: encodeB64(params.stdin ?? ''),
        cpu_time_limit: 10,
        memory_limit: 256000,
      }),
    })

    if (subRes.ok) {
      const subData = await subRes.json()
      if (subData?.token) {
        const token = subData.token
        // Poll for completion (max 25 attempts, ~15 seconds total)
        for (let i = 0; i < 25; i++) {
          await sleep(i === 0 ? 500 : Math.min(800, 400 + i * 50))
          try {
            const pollRes = await fetch(
              `${JUDGE0_URL}/submissions/${token}?base64_encoded=true&fields=stdout,stderr,compile_output,status,time,memory,exit_code,message`,
            )
            if (pollRes.ok) {
              const resData = await pollRes.json()
              const statusId = resData?.status?.id ?? 0

              // status.id: 1 = In Queue, 2 = Processing, > 2 = Finished
              if (statusId > 2) {
                const stdout = decodeB64(resData.stdout)
                const stderr = decodeB64(resData.stderr)
                const compile_output = decodeB64(resData.compile_output) || (resData.message ? decodeB64(resData.message) : null)

                return {
                  stdout,
                  stderr,
                  compile_output,
                  status: resData.status || { id: 3, description: 'Accepted' },
                  time: resData.time || ((performance.now() - startTime) / 1000).toFixed(3),
                  memory: resData.memory ? Math.round(resData.memory) : null,
                  exit_code: resData.exit_code ?? 0,
                  message: resData.message ? decodeB64(resData.message) : null,
                }
              }
            }
          } catch (pollErr) {
            console.warn('Judge0 poll attempt failed, retrying...', pollErr)
          }
        }
      }
    }
  } catch (netErr) {
    console.warn('Judge0 submission error:', netErr)
  }

  // 2. Client-side execution for JavaScript & TypeScript (instant zero-network execution)
  if (params.languageId === 63 || params.languageId === 74) {
    return runBrowserJS(params.sourceCode, params.languageId, params.stdin, startTime)
  }

  // 3. Fallback when network is offline or Judge0 service is busy
  const elapsed = ((performance.now() - startTime) / 1000).toFixed(3)
  return {
    stdout: null,
    stderr: `⚠️ Execution service is currently busy or unreachable.\nPlease verify your internet connection and try running again in a few moments.`,
    compile_output: null,
    status: { id: 13, description: 'Service Unavailable' },
    time: elapsed,
    memory: null,
    exit_code: 1,
  }
}

/**
 * Isolated browser runner for JS & TS
 */
function runBrowserJS(code: string, langId: number, stdin?: string, startTime: number = performance.now()): ExecutionResult {
  const logs: string[] = []
  const originalLog = console.log
  const originalError = console.error
  const originalWarn = console.warn
  const originalInfo = console.info

  try {
    console.log = (...args: any[]) => {
      logs.push(args.map(a => (typeof a === 'object' ? JSON.stringify(a, null, 2) : String(a))).join(' '))
    }
    console.error = (...args: any[]) => {
      logs.push('[error] ' + args.map(a => String(a)).join(' '))
    }
    console.warn = (...args: any[]) => {
      logs.push('[warn] ' + args.map(a => String(a)).join(' '))
    }
    console.info = (...args: any[]) => {
      logs.push(args.map(a => String(a)).join(' '))
    }

    let executable = code
    if (langId === 74) {
      executable = code
        .replace(/:\s*(string|number|boolean|any|void|unknown|never|Record<.*?>|Array<.*?>|\w+\[\])/g, '')
        .replace(/interface\s+\w+\s*\{[\s\S]*?\}/g, '')
        .replace(/type\s+\w+\s*=[\s\S]*?;/g, '')
        .replace(/as\s+\w+/g, '')
    }

    const fn = new Function('stdin', executable)
    const res = fn(stdin || '')

    if (logs.length === 0 && res !== undefined) {
      logs.push(typeof res === 'object' ? JSON.stringify(res, null, 2) : String(res))
    }

    const time = ((performance.now() - startTime) / 1000).toFixed(3)
    return {
      stdout: logs.length > 0 ? logs.join('\n') + '\n' : '✓ Program finished with return code 0 (no output)\n',
      stderr: null,
      compile_output: null,
      status: { id: 3, description: 'Accepted' },
      time,
      memory: 2048,
      exit_code: 0,
    }
  } catch (err: any) {
    const time = ((performance.now() - startTime) / 1000).toFixed(3)
    return {
      stdout: logs.length > 0 ? logs.join('\n') + '\n' : null,
      stderr: `✕ Runtime Error: ${err?.message || err}`,
      compile_output: null,
      status: { id: 11, description: 'Runtime Error (NZEC)' },
      time,
      memory: 2048,
      exit_code: 1,
    }
  } finally {
    console.log = originalLog
    console.error = originalError
    console.warn = originalWarn
    console.info = originalInfo
  }
}

export function statusLabel(result: ExecutionResult): { label: string; color: string } {
  const id = result.status.id
  if (id === 3) return { label: 'Accepted', color: '#3fb950' }
  if (id === 4) return { label: 'Wrong Answer', color: '#f85149' }
  if (id === 5) return { label: 'Time Limit Exceeded', color: '#d29922' }
  if (id === 6) return { label: 'Compilation Error', color: '#f85149' }
  if (id >= 7 && id <= 12) return { label: 'Runtime Error', color: '#f85149' }
  return { label: 'Internal Error', color: '#f85149' }
}

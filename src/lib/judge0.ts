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

// Wandbox Free Online Compiler Mapping (No API key needed, zero-quota restrictions, CORS-enabled)
const WANDBOX_COMPILERS: Record<string, { compiler: string; options?: string }> = {
  python:     { compiler: 'cpython-3.12.7' },
  py:         { compiler: 'cpython-3.12.7' },
  cpp:        { compiler: 'gcc-13.2.0', options: 'warning,gnu++17' },
  'c++':      { compiler: 'gcc-13.2.0', options: 'warning,gnu++17' },
  c:          { compiler: 'gcc-13.2.0-c' },
  java:       { compiler: 'openjdk-jdk-21+35' },
  rust:       { compiler: 'rust-1.82.0' },
  rs:         { compiler: 'rust-1.82.0' },
  go:         { compiler: 'go-1.23.2' },
  csharp:     { compiler: 'mono-6.12.0.199' },
  cs:         { compiler: 'mono-6.12.0.199' },
  php:        { compiler: 'php-8.3.12' },
  ruby:       { compiler: 'ruby-3.3.11' },
  rb:         { compiler: 'ruby-3.3.11' },
  bash:       { compiler: 'bash' },
  sh:         { compiler: 'bash' },
  shell:      { compiler: 'bash' },
  perl:       { compiler: 'perl-5.40.0' },
  pl:         { compiler: 'perl-5.40.0' },
  lua:        { compiler: 'lua-5.4.7' },
  haskell:    { compiler: 'ghc-9.10.1' },
  hs:         { compiler: 'ghc-9.10.1' },
  elixir:     { compiler: 'elixir-1.17.3' },
  ex:         { compiler: 'elixir-1.17.3' },
  erlang:     { compiler: 'erlang-27.1' },
  erl:        { compiler: 'erlang-27.1' },
}

const JUDGE0_ID_TO_LANG: Record<number, string> = {
  71: 'python',
  54: 'cpp',
  76: 'cpp',
  105: 'cpp',
  50: 'c',
  48: 'c',
  49: 'c',
  62: 'java',
  63: 'javascript',
  74: 'typescript',
  60: 'go',
  73: 'rust',
  51: 'csharp',
  68: 'php',
  72: 'ruby',
  46: 'bash',
  85: 'perl',
  64: 'lua',
  61: 'haskell',
  57: 'elixir',
  58: 'erlang',
}

/**
 * Universal Code Execution Engine
 * Automatically routes to Wandbox (free Linux cloud compilers) or fast client-side browser runner
 */
export async function executeCode(
  paramsOrCode:
    | {
        sourceCode: string
        languageId?: number
        lang?: string
        stdin?: string
      }
    | string,
  maybeLangId?: number | string,
  maybeStdin?: string
): Promise<ExecutionResult> {
  const params =
    typeof paramsOrCode === 'string'
      ? {
          sourceCode: paramsOrCode,
          languageId: typeof maybeLangId === 'number' ? maybeLangId : undefined,
          lang: typeof maybeLangId === 'string' ? maybeLangId : undefined,
          stdin: maybeStdin,
        }
      : paramsOrCode
  const startTime = performance.now()
  const langKey = (params.lang || (params.languageId ? JUDGE0_ID_TO_LANG[params.languageId] : ''))?.toLowerCase().trim() || ''

  // 1. Client-side execution for JavaScript & TypeScript (Instant zero-network execution)
  if (langKey === 'javascript' || langKey === 'js' || params.languageId === 63 || langKey === 'typescript' || langKey === 'ts' || params.languageId === 74) {
    return runBrowserJS(params.sourceCode, langKey === 'typescript' || params.languageId === 74, params.stdin, startTime)
  }

  // 2. Client-side execution for JSON validation
  if (langKey === 'json') {
    try {
      const parsed = JSON.parse(params.sourceCode)
      const formatted = JSON.stringify(parsed, null, 2)
      return {
        stdout: `✓ Valid JSON Syntax!\n\n${formatted}\n`,
        stderr: null,
        compile_output: null,
        status: { id: 3, description: 'Accepted' },
        time: '0.001',
        memory: 1024,
        exit_code: 0,
      }
    } catch (err: any) {
      return {
        stdout: null,
        stderr: `✕ JSON Syntax Error:\n${err.message}`,
        compile_output: null,
        status: { id: 6, description: 'Compilation Error' },
        time: '0.001',
        memory: 1024,
        exit_code: 1,
      }
    }
  }

  // 3. Wandbox Remote Compilation (Python, C++, C, Java, Go, Rust, C#, PHP, Ruby, Bash, etc.)
  const wandboxConfig = WANDBOX_COMPILERS[langKey] || (params.languageId ? WANDBOX_COMPILERS[JUDGE0_ID_TO_LANG[params.languageId] || ''] : undefined)
  if (wandboxConfig) {
    try {
      let codeToSubmit = params.sourceCode

      // Java fix: Wandbox compiles Java as prog.java, so "public class Main" causes class mismatch error.
      // Changing "public class X" to "class X" allows seamless compilation and execution!
      if (langKey === 'java' || params.languageId === 62) {
        codeToSubmit = codeToSubmit.replace(/\bpublic\s+class\s+(\w+)/g, 'class $1')
      }

      const res = await fetch('https://wandbox.org/api/compile.json', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          compiler: wandboxConfig.compiler,
          code: codeToSubmit,
          stdin: params.stdin || '',
          options: wandboxConfig.options,
        }),
      })

      if (res.ok) {
        const data = await res.json()
        const elapsed = ((performance.now() - startTime) / 1000).toFixed(3)
        const exitCode = data.status !== undefined && data.status !== '' ? parseInt(data.status, 10) : 0
        const isSuccess = exitCode === 0 && !data.signal

        const stdout = data.program_output || null
        const stderr = data.program_error || null
        const compile_output = data.compiler_error || data.compiler_output || null

        let statusId = isSuccess ? 3 : 11
        let statusDesc = isSuccess ? 'Accepted' : 'Runtime Error'

        if (compile_output && !stdout && exitCode !== 0) {
          statusId = 6
          statusDesc = 'Compilation Error'
        } else if (!isSuccess && stderr) {
          statusId = 11
          statusDesc = 'Runtime Error'
        }

        return {
          stdout,
          stderr,
          compile_output,
          status: { id: statusId, description: statusDesc },
          time: elapsed,
          memory: 4096,
          exit_code: exitCode,
        }
      }
    } catch (wandboxErr) {
      console.warn('Wandbox compilation request failed, checking fallbacks...', wandboxErr)
    }
  }

  // 4. Fallback execution simulation if network is temporarily disconnected
  const elapsed = ((performance.now() - startTime) / 1000).toFixed(3)
  return {
    stdout: null,
    stderr: `⚠️ Unable to reach compiler server. Please check your internet connection and try running again.`,
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
function runBrowserJS(code: string, isTypeScript: boolean, stdin?: string, startTime: number = performance.now()): ExecutionResult {
  const logs: string[] = []
  const originalLog = console.log
  const originalError = console.error
  const originalWarn = console.warn
  const originalInfo = console.info

  try {
    console.log = (...args: any[]) => {
      logs.push(args.map(a => (typeof a === 'object' && a !== null ? JSON.stringify(a, null, 2) : String(a))).join(' '))
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
    if (isTypeScript) {
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

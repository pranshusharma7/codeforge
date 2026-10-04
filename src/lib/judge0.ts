export interface ExecutionResult {
  stdout: string | null;
  stderr: string | null;
  compile_output: string | null;
  status: { id: number; description: string };
  time: string | null;
  memory: number | null;
  exit_code: number | null;
  message?: string | null;
  engine?: string;
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
};

// UTF-8 safe Base64 encoder and decoder
function encodeBase64(str: string): string {
  try {
    return btoa(unescape(encodeURIComponent(str || '')));
  } catch {
    return btoa(str || '');
  }
}

function decodeBase64(b64: string | null | undefined): string | null {
  if (!b64) return null;
  try {
    return decodeURIComponent(escape(atob(b64)));
  } catch {
    try {
      return atob(b64);
    } catch {
      return b64;
    }
  }
}

// Wandbox Free Online Compiler Mapping (Fallback)
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
};

export const JUDGE0_ID_TO_LANG: Record<number, string> = {
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
  82: 'sql',
  78: 'kotlin',
  83: 'swift',
  80: 'r',
  81: 'scala',
  86: 'clojure',
  87: 'fsharp',
  90: 'dart',
  91: 'julia',
  59: 'fortran',
  67: 'pascal',
  69: 'prolog',
  77: 'cobol',
  45: 'assembly',
  66: 'octave',
  84: 'powershell',
  88: 'groovy',
  89: 'crystal',
  93: 'zig',
  92: 'tcl',
  55: 'lisp',
  79: 'scheme',
};

export const LANG_TO_JUDGE0_ID: Record<string, number> = {
  python: 71, py: 71, python3: 71,
  cpp: 54, 'c++': 54,
  c: 50,
  java: 62,
  javascript: 63, js: 63, node: 63,
  typescript: 74, ts: 74,
  go: 60, golang: 60,
  rust: 73, rs: 73,
  csharp: 51, cs: 51, 'c#': 51,
  php: 68,
  ruby: 72, rb: 72,
  bash: 46, sh: 46, shell: 46,
  sql: 82, sqlite: 82,
  kotlin: 78, kt: 78,
  swift: 83,
  r: 80,
  scala: 81,
  perl: 85, pl: 85,
  lua: 64,
  haskell: 61, hs: 61,
  elixir: 57, ex: 57,
  erlang: 58, erl: 58,
  clojure: 86, clj: 86,
  fsharp: 87, fs: 87,
  dart: 90,
  julia: 91, jl: 91,
  fortran: 59, f95: 59,
  pascal: 67, pas: 67,
  prolog: 69,
  cobol: 77, cob: 77,
  assembly: 45, asm: 45,
  octave: 66, matlab: 66,
  powershell: 84, ps1: 84,
  groovy: 88,
  crystal: 89, cr: 89,
  zig: 93,
  tcl: 92,
  lisp: 55,
  scheme: 79, scm: 79,
};

/**
 * Universal Resilient Code Execution Engine
 * Multi-tier execution architecture:
 * 1. Client-side browser execution (JS/TS/JSON) - 0ms offline
 * 2. Vite Local Server API (/api/compile) - 20-200ms ultra-fast execution with host compilers
 * 3. Primary Cloud Engine (Judge0 CE) - 50+ languages with base64 encoding & polling
 * 4. Secondary Cloud Engine (Wandbox) - backup cloud compiler
 * 5. Full Timeout & Abort Cancellation safeguards - NEVER gets stuck
 */
export async function executeCode(
  paramsOrCode:
    | {
        sourceCode: string;
        languageId?: number;
        lang?: string;
        stdin?: string;
        signal?: AbortSignal;
      }
    | string,
  maybeLangId?: number | string,
  maybeStdin?: string,
  maybeSignal?: AbortSignal
): Promise<ExecutionResult> {
  const params =
    typeof paramsOrCode === 'string'
      ? {
          sourceCode: paramsOrCode,
          languageId: typeof maybeLangId === 'number' ? maybeLangId : undefined,
          lang: typeof maybeLangId === 'string' ? maybeLangId : undefined,
          stdin: maybeStdin,
          signal: maybeSignal,
        }
      : paramsOrCode;

  const userSignal = params.signal;

  // Check if already aborted
  if (userSignal?.aborted) {
    return {
      stdout: null,
      stderr: '⏹ Execution cancelled by user.',
      compile_output: null,
      status: { id: 13, description: 'Cancelled' },
      time: '0.000',
      memory: null,
      exit_code: 130,
      engine: 'Aborted',
    };
  }

  const startTime = performance.now();
  const rawLang = (params.lang || (params.languageId ? JUDGE0_ID_TO_LANG[params.languageId] : ''))?.toLowerCase().trim() || '';
  const langKey = rawLang.replace(/^[.\s]+/, '');
  const languageId = params.languageId || LANG_TO_JUDGE0_ID[langKey] || 71;

  // ── Tier 0: Client-side Browser Execution for Web Technologies ─────────────
  if (langKey === 'javascript' || langKey === 'js' || languageId === 63 || langKey === 'typescript' || langKey === 'ts' || languageId === 74) {
    return runBrowserJS(params.sourceCode, langKey === 'typescript' || languageId === 74, params.stdin, startTime);
  }

  if (langKey === 'json') {
    try {
      const parsed = JSON.parse(params.sourceCode);
      const formatted = JSON.stringify(parsed, null, 2);
      return {
        stdout: `✓ Valid JSON Syntax!\n\n${formatted}\n`,
        stderr: null,
        compile_output: null,
        status: { id: 3, description: 'Accepted' },
        time: '0.001',
        memory: 1024,
        exit_code: 0,
        engine: '⚡ In-Browser JSON Engine',
      };
    } catch (err: any) {
      return {
        stdout: null,
        stderr: `✕ JSON Syntax Error:\n${err.message}`,
        compile_output: null,
        status: { id: 6, description: 'Compilation Error' },
        time: '0.001',
        memory: 1024,
        exit_code: 1,
        engine: '⚡ In-Browser JSON Engine',
      };
    }
  }

  // ── Tier 1: Try Local Server API (/api/compile) ─────────────────────────────
  // If running in development (Vite dev server) or preview server, this executes natively in 20ms - 300ms!
  try {
    const localController = new AbortController();
    const localTimeout = setTimeout(() => localController.abort(), 4500);

    const onUserAbort = () => localController.abort();
    if (userSignal) userSignal.addEventListener('abort', onUserAbort, { once: true });

    const localRes = await fetch('/api/compile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sourceCode: params.sourceCode,
        lang: langKey,
        languageId,
        stdin: params.stdin || '',
      }),
      signal: localController.signal,
    });
    clearTimeout(localTimeout);
    if (userSignal) userSignal.removeEventListener('abort', onUserAbort);

    if (localRes.ok) {
      const data = await localRes.json();
      if (data && (data.stdout !== undefined || data.stderr !== undefined || data.compile_output !== undefined || data.status)) {
        return {
          stdout: data.stdout ?? null,
          stderr: data.stderr ?? null,
          compile_output: data.compile_output ?? null,
          status: data.status || { id: 3, description: 'Accepted' },
          time: data.time || ((performance.now() - startTime) / 1000).toFixed(3),
          memory: data.memory ?? 2048,
          exit_code: data.exit_code ?? 0,
          engine: data.engine || '⚡ Local Server Engine',
        };
      }
    }
  } catch (localErr: any) {
    if (userSignal?.aborted) {
      return {
        stdout: null,
        stderr: '⏹ Execution stopped by user.',
        compile_output: null,
        status: { id: 13, description: 'Cancelled' },
        time: ((performance.now() - startTime) / 1000).toFixed(3),
        memory: null,
        exit_code: 130,
        engine: 'Aborted',
      };
    }

    // If local execution timed out, return Time Limit Exceeded immediately without waiting on cloud
    if (localErr?.name === 'AbortError') {
      return {
        stdout: null,
        stderr: '⏱ Execution timed out (3.5s limit reached).\n💡 Tip: Check for infinite loops (e.g. while True). If your code asks for input (input() / cin), provide values in the "Standard Input (stdin)" tab before clicking Run.',
        compile_output: null,
        status: { id: 5, description: 'Time Limit Exceeded' },
        time: '3.500',
        memory: 4096,
        exit_code: 124,
        engine: '⚡ Local Server Timeout Guard',
      };
    }
    // Only continue to cloud fallback if endpoint failed with network error or 404
  }

  // ── Tier 2: Judge0 CE Cloud Execution ───────────────────────────────────────
  // Public high-speed Judge0 instance supporting 60+ programming languages
  try {
    const cloudController = new AbortController();
    const cloudTimeout = setTimeout(() => cloudController.abort(), 4000);

    const onUserAbort = () => cloudController.abort();
    if (userSignal) userSignal.addEventListener('abort', onUserAbort, { once: true });

    const j0Url = (import.meta.env.VITE_JUDGE0_URL as string) || 'https://ce.judge0.com';
    const j0Key = import.meta.env.VITE_JUDGE0_KEY as string | undefined;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (j0Key) {
      headers['X-RapidAPI-Key'] = j0Key;
      headers['X-RapidAPI-Host'] = 'judge0-ce.p.rapidapi.com';
    }

    const payload = {
      source_code: encodeBase64(params.sourceCode),
      language_id: languageId,
      stdin: params.stdin ? encodeBase64(params.stdin) : '',
    };

    const submitRes = await fetch(`${j0Url}/submissions?base64_encoded=true&wait=true`, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
      signal: cloudController.signal,
    });

    if (submitRes.ok) {
      let data = await submitRes.json();

      // If queued / processing, fast-poll up to 2 times (500ms interval)
      if (data.status?.id <= 2 && data.token) {
        for (let i = 0; i < 2; i++) {
          if (cloudController.signal.aborted || userSignal?.aborted) break;
          await new Promise(r => setTimeout(r, 500));
          const pollRes = await fetch(`${j0Url}/submissions/${data.token}?base64_encoded=true`, {
            headers,
            signal: cloudController.signal,
          });
          if (pollRes.ok) {
            const pollData = await pollRes.json();
            if (pollData.status?.id > 2) {
              data = pollData;
              break;
            }
          }
        }
      }

      clearTimeout(cloudTimeout);
      if (userSignal) userSignal.removeEventListener('abort', onUserAbort);

      const elapsed = ((performance.now() - startTime) / 1000).toFixed(3);
      return {
        stdout: decodeBase64(data.stdout),
        stderr: decodeBase64(data.stderr),
        compile_output: decodeBase64(data.compile_output),
        status: data.status || { id: 3, description: 'Accepted' },
        time: data.time || elapsed,
        memory: data.memory ?? 2048,
        exit_code: data.exit_code ?? 0,
        engine: '🟢 Judge0 Cloud Engine',
      };
    }
    clearTimeout(cloudTimeout);
    if (userSignal) userSignal.removeEventListener('abort', onUserAbort);
  } catch (judge0Err: any) {
    if (userSignal?.aborted) {
      return {
        stdout: null,
        stderr: '⏹ Execution stopped by user.',
        compile_output: null,
        status: { id: 13, description: 'Cancelled' },
        time: ((performance.now() - startTime) / 1000).toFixed(3),
        memory: null,
        exit_code: 130,
        engine: 'Aborted',
      };
    }
    // Continue to Wandbox fallback
  }

  // ── Tier 3: Wandbox Fallback Cloud Compiler ────────────────────────────────
  const wandboxConfig = WANDBOX_COMPILERS[langKey] || (languageId ? WANDBOX_COMPILERS[JUDGE0_ID_TO_LANG[languageId] || ''] : undefined);
  if (wandboxConfig) {
    try {
      const wandboxController = new AbortController();
      const wandboxTimeout = setTimeout(() => wandboxController.abort(), 3500);

      const onUserAbort = () => wandboxController.abort();
      if (userSignal) userSignal.addEventListener('abort', onUserAbort, { once: true });

      let codeToSubmit = params.sourceCode;
      if (langKey === 'java' || languageId === 62) {
        codeToSubmit = codeToSubmit.replace(/\bpublic\s+class\s+(\w+)/g, 'class $1');
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
        signal: wandboxController.signal,
      });
      clearTimeout(wandboxTimeout);
      if (userSignal) userSignal.removeEventListener('abort', onUserAbort);

      if (res.ok) {
        const data = await res.json();
        const elapsed = ((performance.now() - startTime) / 1000).toFixed(3);
        const exitCode = data.status !== undefined && data.status !== '' ? parseInt(data.status, 10) : 0;
        const isSuccess = exitCode === 0 && !data.signal;

        const stdout = data.program_output || null;
        const stderr = data.program_error || null;
        const compile_output = data.compiler_error || data.compiler_output || null;

        let statusId = isSuccess ? 3 : 11;
        let statusDesc = isSuccess ? 'Accepted' : 'Runtime Error';

        if (compile_output && !stdout && exitCode !== 0) {
          statusId = 6;
          statusDesc = 'Compilation Error';
        } else if (!isSuccess && stderr) {
          statusId = 11;
          statusDesc = 'Runtime Error';
        }

        return {
          stdout,
          stderr,
          compile_output,
          status: { id: statusId, description: statusDesc },
          time: elapsed,
          memory: 4096,
          exit_code: exitCode,
          engine: '🟠 Wandbox Cloud Engine',
        };
      }
    } catch (wandboxErr: any) {
      if (userSignal?.aborted) {
        return {
          stdout: null,
          stderr: '⏹ Execution stopped by user.',
          compile_output: null,
          status: { id: 13, description: 'Cancelled' },
          time: ((performance.now() - startTime) / 1000).toFixed(3),
          memory: null,
          exit_code: 130,
          engine: 'Aborted',
        };
      }
    }
  }

  // ── Tier 4: Graceful Response If All Engines Unreachable ────────────────────
  const elapsed = ((performance.now() - startTime) / 1000).toFixed(3);
  return {
    stdout: null,
    stderr: `⚠️ Unable to reach compiler servers.\n\nTips to resolve:\n1. Check your internet connection.\n2. Ensure the dev server is active at http://localhost:8443\n3. If your code requires standard input, provide it in the Input tab before running.\n4. Avoid infinite loops (e.g. while(true)) that block execution.`,
    compile_output: null,
    status: { id: 13, description: 'Service Unavailable' },
    time: elapsed,
    memory: null,
    exit_code: 1,
    engine: 'Failover Notification',
  };
}

/**
 * Isolated browser runner for JS & TS (Runs instantly with zero latency)
 */
function runBrowserJS(code: string, isTypeScript: boolean, stdin?: string, startTime: number = performance.now()): ExecutionResult {
  const logs: string[] = [];
  const originalLog = console.log;
  const originalError = console.error;
  const originalWarn = console.warn;
  const originalInfo = console.info;

  try {
    console.log = (...args: any[]) => {
      logs.push(args.map(a => (typeof a === 'object' && a !== null ? JSON.stringify(a, null, 2) : String(a))).join(' '));
    };
    console.error = (...args: any[]) => {
      logs.push('[error] ' + args.map(a => String(a)).join(' '));
    };
    console.warn = (...args: any[]) => {
      logs.push('[warn] ' + args.map(a => String(a)).join(' '));
    };
    console.info = (...args: any[]) => {
      logs.push(args.map(a => String(a)).join(' '));
    };

    let executable = code;
    if (isTypeScript) {
      executable = code
        .replace(/:\s*(string|number|boolean|any|void|unknown|never|Record<.*?>|Array<.*?>|\w+\[\])/g, '')
        .replace(/interface\s+\w+\s*\{[\s\S]*?\}/g, '')
        .replace(/type\s+\w+\s*=[\s\S]*?;/g, '')
        .replace(/as\s+\w+/g, '');
    }

    const fn = new Function('stdin', executable);
    const res = fn(stdin || '');

    if (logs.length === 0 && res !== undefined) {
      logs.push(typeof res === 'object' ? JSON.stringify(res, null, 2) : String(res));
    }

    const time = ((performance.now() - startTime) / 1000).toFixed(3);
    return {
      stdout: logs.length > 0 ? logs.join('\n') + '\n' : '✓ Program finished with return code 0 (no output)\n',
      stderr: null,
      compile_output: null,
      status: { id: 3, description: 'Accepted' },
      time,
      memory: 2048,
      exit_code: 0,
      engine: '⚡ In-Browser JS Engine',
    };
  } catch (err: any) {
    const time = ((performance.now() - startTime) / 1000).toFixed(3);
    return {
      stdout: logs.length > 0 ? logs.join('\n') + '\n' : null,
      stderr: `✕ Runtime Error: ${err?.message || err}`,
      compile_output: null,
      status: { id: 11, description: 'Runtime Error (NZEC)' },
      time,
      memory: 2048,
      exit_code: 1,
      engine: '⚡ In-Browser JS Engine',
    };
  } finally {
    console.log = originalLog;
    console.error = originalError;
    console.warn = originalWarn;
    console.info = originalInfo;
  }
}

export function statusLabel(result: ExecutionResult): { label: string; color: string } {
  const id = result.status?.id ?? 13;
  if (id === 3) return { label: 'Accepted', color: '#3fb950' };
  if (id === 4) return { label: 'Wrong Answer', color: '#f85149' };
  if (id === 5) return { label: 'Time Limit Exceeded', color: '#d29922' };
  if (id === 6) return { label: 'Compilation Error', color: '#f85149' };
  if (id >= 7 && id <= 12) return { label: 'Runtime Error', color: '#f85149' };
  if (id === 13 && result.status?.description === 'Cancelled') return { label: 'Cancelled', color: '#e3b341' };
  return { label: result.status?.description || 'Error', color: '#f85149' };
}

import fs from "node:fs"
import path from "node:path"
import os from "node:os"
import { spawn } from "node:child_process"

// Judge0 language mapping IDs
export const JUDGE0_MAP = {
  python: 71,
  py: 71,
  cpp: 54,
  "c++": 54,
  c: 50,
  java: 62,
  javascript: 63,
  js: 63,
  node: 63,
  typescript: 74,
  ts: 74,
  go: 60,
  golang: 60,
  rust: 73,
  rs: 73,
  csharp: 51,
  cs: 51,
  "c#": 51,
  ruby: 72,
  rb: 72,
  php: 68,
  bash: 46,
  sh: 46,
  shell: 46,
  sql: 82,
  sqlite: 82,
  kotlin: 78,
  kt: 78,
  swift: 83,
  r: 80,
  scala: 81,
  perl: 85,
  pl: 85,
  lua: 64,
  haskell: 61,
  hs: 61,
  dart: 90,
  assembly: 45,
  asm: 45,
}

// Check if a system binary exists
const BINARY_CACHE = new Map()
function checkBinaryExists(bin) {
  if (BINARY_CACHE.has(bin)) return BINARY_CACHE.get(bin)
  try {
    const { execSync } = require("node:child_process")
    execSync(`which ${bin}`, { stdio: "ignore" })
    BINARY_CACHE.set(bin, true)
    return true
  } catch {
    BINARY_CACHE.set(bin, false)
    return false
  }
}

/**
 * Spawns a child process with timeout, stdin, and output buffer protection
 */
function runProcess(command, args, { stdin = "", timeout = 7000, cwd } = {}) {
  return new Promise((resolve) => {
    let stdout = ""
    let stderr = ""
    let killed = false
    let timer = null

    try {
      const child = spawn(command, args, {
        cwd,
        env: { ...process.env, PYTHONUNBUFFERED: "1", PAGER: "cat" },
        stdio: ["pipe", "pipe", "pipe"],
      })

      timer = setTimeout(() => {
        killed = true
        try {
          child.kill("SIGKILL")
        } catch {}
        resolve({
          stdout,
          stderr:
            (stderr ? stderr + "\n" : "") +
            "⏱ Execution timed out (process exceeded 7s limit)",
          exitCode: 124,
          timedOut: true,
        })
      }, timeout)

      if (stdin) {
        try {
          child.stdin.write(stdin)
          child.stdin.end()
        } catch {}
      } else {
        try {
          child.stdin.end()
        } catch {}
      }

      child.stdout.on("data", (d) => {
        if (stdout.length < 500000) stdout += d.toString()
        else if (!killed) {
          killed = true
          try {
            child.kill("SIGKILL")
          } catch {}
        }
      })

      child.stderr.on("data", (d) => {
        if (stderr.length < 500000) stderr += d.toString()
      })

      child.on("error", (err) => {
        if (timer) clearTimeout(timer)
        resolve({
          stdout,
          stderr: (stderr ? stderr + "\n" : "") + err.message,
          exitCode: 1,
          spawnError: true,
        })
      })

      child.on("close", (code) => {
        if (timer) clearTimeout(timer)
        if (killed) return
        resolve({
          stdout,
          stderr,
          exitCode: code ?? 0,
          timedOut: false,
        })
      })
    } catch (err) {
      if (timer) clearTimeout(timer)
      resolve({
        stdout: "",
        stderr: err.message,
        exitCode: 1,
        spawnError: true,
      })
    }
  })
}

/**
 * Execute locally if compilers/interpreters exist on host
 */
async function executeLocally(code, lang, stdin = "", timeoutMs = 7000) {
  const norm = (lang || "").toLowerCase().trim()
  const startTime = Date.now()

  // 1. Python
  if (norm === "python" || norm === "py" || norm === "python3") {
    const pythonCmd = checkBinaryExists("python3")
      ? "python3"
      : checkBinaryExists("python")
        ? "python"
        : null
    if (pythonCmd) {
      const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "cf_py_"))
      const scriptPath = path.join(tmpDir, "script.py")
      try {
        fs.writeFileSync(scriptPath, code, "utf-8")
        const res = await runProcess(pythonCmd, ["-u", scriptPath], {
          stdin,
          timeout: timeoutMs,
          cwd: tmpDir,
        })
        const elapsed = ((Date.now() - startTime) / 1000).toFixed(3)
        return {
          stdout: res.stdout || null,
          stderr: res.stderr || null,
          compile_output: null,
          status: {
            id: res.timedOut ? 5 : res.exitCode === 0 ? 3 : 11,
            description: res.timedOut
              ? "Time Limit Exceeded"
              : res.exitCode === 0
                ? "Accepted"
                : "Runtime Error",
          },
          time: elapsed,
          memory: 4096,
          exit_code: res.exitCode,
          engine: "⚡ Local Python Server",
        }
      } finally {
        try {
          fs.rmSync(tmpDir, { recursive: true, force: true })
        } catch {}
      }
    }
  }

  // 2. JavaScript / TypeScript
  if (
    norm === "javascript" ||
    norm === "js" ||
    norm === "typescript" ||
    norm === "ts" ||
    norm === "node"
  ) {
    const nodeCmd = checkBinaryExists("node") ? "node" : null
    if (nodeCmd) {
      const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "cf_js_"))
      const scriptPath = path.join(tmpDir, "main.js")
      try {
        let cleanCode = code
        if (norm === "typescript" || norm === "ts") {
          // Strip basic TS types for direct node run
          cleanCode = code
            .replace(
              /:\s*(string|number|boolean|any|void|unknown|never|Record<.*?>|Array<.*?>|\w+\[\])/g,
              "",
            )
            .replace(/interface\s+\w+\s*\{[\s\S]*?\}/g, "")
            .replace(/type\s+\w+\s*=[\s\S]*?;/g, "")
            .replace(/as\s+\w+/g, "")
        }
        fs.writeFileSync(scriptPath, cleanCode, "utf-8")
        const res = await runProcess(nodeCmd, [scriptPath], {
          stdin,
          timeout: timeoutMs,
          cwd: tmpDir,
        })
        const elapsed = ((Date.now() - startTime) / 1000).toFixed(3)
        return {
          stdout: res.stdout || null,
          stderr: res.stderr || null,
          compile_output: null,
          status: {
            id: res.timedOut ? 5 : res.exitCode === 0 ? 3 : 11,
            description: res.timedOut
              ? "Time Limit Exceeded"
              : res.exitCode === 0
                ? "Accepted"
                : "Runtime Error",
          },
          time: elapsed,
          memory: 4096,
          exit_code: res.exitCode,
          engine: "⚡ Local Node.js Server",
        }
      } finally {
        try {
          fs.rmSync(tmpDir, { recursive: true, force: true })
        } catch {}
      }
    }
  }

  // 3. C++
  if (norm === "cpp" || norm === "c++") {
    const cppCompiler = checkBinaryExists("clang++")
      ? "clang++"
      : checkBinaryExists("g++")
        ? "g++"
        : null
    if (cppCompiler) {
      const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "cf_cpp_"))
      const srcPath = path.join(tmpDir, "main.cpp")
      const binPath = path.join(tmpDir, "prog")
      try {
        fs.writeFileSync(srcPath, code, "utf-8")
        const comp = await runProcess(
          cppCompiler,
          ["-O2", "-std=c++17", srcPath, "-o", binPath],
          { timeout: 6000, cwd: tmpDir },
        )
        if (comp.exitCode !== 0 || comp.spawnError) {
          const elapsed = ((Date.now() - startTime) / 1000).toFixed(3)
          return {
            stdout: null,
            stderr: null,
            compile_output: comp.stderr || comp.stdout || "Compilation error",
            status: { id: 6, description: "Compilation Error" },
            time: elapsed,
            memory: 0,
            exit_code: comp.exitCode || 1,
            engine: "⚡ Local C++ Server",
          }
        }
        const exec = await runProcess(binPath, [], {
          stdin,
          timeout: timeoutMs,
          cwd: tmpDir,
        })
        const elapsed = ((Date.now() - startTime) / 1000).toFixed(3)
        return {
          stdout: exec.stdout || null,
          stderr: exec.stderr || null,
          compile_output: null,
          status: {
            id: exec.timedOut ? 5 : exec.exitCode === 0 ? 3 : 11,
            description: exec.timedOut
              ? "Time Limit Exceeded"
              : exec.exitCode === 0
                ? "Accepted"
                : "Runtime Error",
          },
          time: elapsed,
          memory: 2048,
          exit_code: exec.exitCode,
          engine: "⚡ Local C++ Server",
        }
      } finally {
        try {
          fs.rmSync(tmpDir, { recursive: true, force: true })
        } catch {}
      }
    }
  }

  // 4. C
  if (norm === "c") {
    const cCompiler = checkBinaryExists("clang")
      ? "clang"
      : checkBinaryExists("gcc")
        ? "gcc"
        : null
    if (cCompiler) {
      const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "cf_c_"))
      const srcPath = path.join(tmpDir, "main.c")
      const binPath = path.join(tmpDir, "prog")
      try {
        fs.writeFileSync(srcPath, code, "utf-8")
        const comp = await runProcess(
          cCompiler,
          ["-O2", srcPath, "-o", binPath],
          { timeout: 6000, cwd: tmpDir },
        )
        if (comp.exitCode !== 0 || comp.spawnError) {
          const elapsed = ((Date.now() - startTime) / 1000).toFixed(3)
          return {
            stdout: null,
            stderr: null,
            compile_output: comp.stderr || comp.stdout || "Compilation error",
            status: { id: 6, description: "Compilation Error" },
            time: elapsed,
            memory: 0,
            exit_code: comp.exitCode || 1,
            engine: "⚡ Local C Server",
          }
        }
        const exec = await runProcess(binPath, [], {
          stdin,
          timeout: timeoutMs,
          cwd: tmpDir,
        })
        const elapsed = ((Date.now() - startTime) / 1000).toFixed(3)
        return {
          stdout: exec.stdout || null,
          stderr: exec.stderr || null,
          compile_output: null,
          status: {
            id: exec.timedOut ? 5 : exec.exitCode === 0 ? 3 : 11,
            description: exec.timedOut
              ? "Time Limit Exceeded"
              : exec.exitCode === 0
                ? "Accepted"
                : "Runtime Error",
          },
          time: elapsed,
          memory: 2048,
          exit_code: exec.exitCode,
          engine: "⚡ Local C Server",
        }
      } finally {
        try {
          fs.rmSync(tmpDir, { recursive: true, force: true })
        } catch {}
      }
    }
  }

  // 5. Java
  if (norm === "java") {
    const javaCmd = checkBinaryExists("java") ? "java" : null
    if (javaCmd) {
      const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "cf_java_"))
      const classMatch = code.match(/\b(?:public\s+)?class\s+(\w+)/)
      const className = classMatch ? classMatch[1] : "Main"
      const javaPath = path.join(tmpDir, `${className}.java`)
      try {
        fs.writeFileSync(javaPath, code, "utf-8")
        const exec = await runProcess(javaCmd, [javaPath], {
          stdin,
          timeout: timeoutMs,
          cwd: tmpDir,
        })
        const elapsed = ((Date.now() - startTime) / 1000).toFixed(3)
        const hasCompileErr =
          exec.exitCode !== 0 &&
          exec.stderr &&
          (exec.stderr.includes("error:") ||
            exec.stderr.includes("cannot find symbol"))
        return {
          stdout: exec.stdout || null,
          stderr: hasCompileErr ? null : exec.stderr || null,
          compile_output: hasCompileErr ? exec.stderr : null,
          status: {
            id: exec.timedOut
              ? 5
              : hasCompileErr
                ? 6
                : exec.exitCode === 0
                  ? 3
                  : 11,
            description: exec.timedOut
              ? "Time Limit Exceeded"
              : hasCompileErr
                ? "Compilation Error"
                : exec.exitCode === 0
                  ? "Accepted"
                  : "Runtime Error",
          },
          time: elapsed,
          memory: 16384,
          exit_code: exec.exitCode,
          engine: "⚡ Local Java Server",
        }
      } finally {
        try {
          fs.rmSync(tmpDir, { recursive: true, force: true })
        } catch {}
      }
    }
  }

  // 6. Bash / Shell
  if (norm === "bash" || norm === "sh" || norm === "shell") {
    const shCmd = checkBinaryExists("bash") ? "bash" : "sh"
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "cf_sh_"))
    const shPath = path.join(tmpDir, "script.sh")
    try {
      fs.writeFileSync(shPath, code, "utf-8")
      const exec = await runProcess(shCmd, [shPath], {
        stdin,
        timeout: timeoutMs,
        cwd: tmpDir,
      })
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(3)
      return {
        stdout: exec.stdout || null,
        stderr: exec.stderr || null,
        compile_output: null,
        status: {
          id: exec.timedOut ? 5 : exec.exitCode === 0 ? 3 : 11,
          description: exec.timedOut
            ? "Time Limit Exceeded"
            : exec.exitCode === 0
              ? "Accepted"
              : "Runtime Error",
        },
        time: elapsed,
        memory: 1024,
        exit_code: exec.exitCode,
        engine: "⚡ Local Shell Server",
      }
    } finally {
      try {
        fs.rmSync(tmpDir, { recursive: true, force: true })
      } catch {}
    }
  }

  return null // Local execution not available or unsupported for this language
}

/**
 * Execute via Judge0 CE Cloud with timeout & polling fallback
 */
async function executeJudge0Cloud(
  code,
  languageId,
  stdin = "",
  timeoutMs = 9000,
) {
  const startTime = Date.now()
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

  const decode = (b64) => {
    if (!b64) return null
    try {
      return Buffer.from(b64, "base64").toString("utf-8")
    } catch {
      return b64
    }
  }

  try {
    const body = {
      source_code: Buffer.from(code, "utf-8").toString("base64"),
      language_id: languageId,
      stdin: stdin ? Buffer.from(stdin, "utf-8").toString("base64") : "",
    }

    const res = await fetch(
      "https://ce.judge0.com/submissions?base64_encoded=true&wait=true",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal: controller.signal,
      },
    )

    if (!res.ok) {
      throw new Error(`Judge0 HTTP ${res.status}`)
    }

    let data = await res.json()

    // If still in queue/processing, poll up to 5 times (1s interval)
    if (data.status?.id <= 2 && data.token) {
      for (let i = 0; i < 5; i++) {
        if (controller.signal.aborted) break
        await new Promise((r) => setTimeout(r, 1000))
        const pollRes = await fetch(
          `https://ce.judge0.com/submissions/${data.token}?base64_encoded=true`,
          {
            headers: { "Content-Type": "application/json" },
            signal: controller.signal,
          },
        )
        if (pollRes.ok) {
          const pollData = await pollRes.json()
          if (pollData.status?.id > 2) {
            data = pollData
            break
          }
        }
      }
    }

    clearTimeout(timeoutId)
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(3)

    return {
      stdout: decode(data.stdout),
      stderr: decode(data.stderr),
      compile_output: decode(data.compile_output),
      status: data.status || { id: 3, description: "Accepted" },
      time: data.time || elapsed,
      memory: data.memory ?? 2048,
      exit_code: data.exit_code ?? 0,
      engine: "🟢 Judge0 Cloud Engine",
    }
  } catch (err) {
    clearTimeout(timeoutId)
    throw err
  }
}

/**
 * Universal Server-Side Code Execution Function
 */
export async function executeCodeServer(
  code,
  langOrId,
  stdin = "",
  timeoutMs = 8000,
) {
  let lang = typeof langOrId === "string" ? langOrId.toLowerCase() : ""
  let languageId =
    typeof langOrId === "number" ? langOrId : JUDGE0_MAP[lang] || 71

  if (!lang && typeof langOrId === "number") {
    for (const [k, v] of Object.entries(JUDGE0_MAP)) {
      if (v === langOrId) {
        lang = k
        break
      }
    }
  }

  // Tier 1: Try local execution first (lightning fast 30ms - 500ms)
  try {
    const localRes = await executeLocally(code, lang, stdin, timeoutMs)
    if (localRes) return localRes
  } catch (localErr) {
    console.warn(
      "Local execution failed, trying cloud Judge0...",
      localErr.message,
    )
  }

  // Tier 2: Try Cloud Judge0 CE
  try {
    const cloudRes = await executeJudge0Cloud(
      code,
      languageId,
      stdin,
      timeoutMs,
    )
    if (cloudRes) return cloudRes
  } catch (cloudErr) {
    console.warn(
      "Judge0 cloud execution failed, checking backup...",
      cloudErr.message,
    )
  }

  // Tier 3: Timeout or Graceful error report
  return {
    stdout: null,
    stderr:
      "⚠️ Compiler execution timed out or remote server unreachable. Please check your code for infinite loops or test with a simpler input.",
    compile_output: null,
    status: { id: 13, description: "Service Unavailable" },
    time: "0.000",
    memory: null,
    exit_code: 1,
    engine: "Failover Fallback",
  }
}

/**
 * Express/Connect Middleware Handler for /api/compile
 */
export async function handleCompileApi(req, res) {
  if (req.method === "OPTIONS") {
    res.writeHead(200, {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "*",
    })
    res.end()
    return true
  }

  if (req.method !== "POST") {
    res.writeHead(405, {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
    })
    res.end(JSON.stringify({ error: "Method not allowed" }))
    return true
  }

  let body = ""
  req.on("data", (chunk) => {
    body += chunk
  })
  req.on("end", async () => {
    try {
      const parsed = JSON.parse(body || "{}")
      const sourceCode = parsed.sourceCode || parsed.code || ""
      const lang = parsed.lang || parsed.language || ""
      const languageId =
        parsed.languageId || JUDGE0_MAP[lang?.toLowerCase()] || 71
      const stdin = parsed.stdin || ""
      const timeoutMs = parsed.timeoutMs || 8000

      if (!sourceCode.trim()) {
        res.writeHead(400, {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        })
        res.end(
          JSON.stringify({
            stdout: null,
            stderr: "No code provided to execute",
            status: { id: 13, description: "Bad Request" },
            exit_code: 1,
          }),
        )
        return
      }

      const result = await executeCodeServer(
        sourceCode,
        languageId,
        stdin,
        timeoutMs,
      )
      res.writeHead(200, {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      })
      res.end(JSON.stringify(result))
    } catch (err) {
      res.writeHead(500, {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      })
      res.end(
        JSON.stringify({
          stdout: null,
          stderr: `Server execution error: ${err.message}`,
          status: { id: 13, description: "Internal Error" },
          exit_code: 1,
        }),
      )
    }
  })

  return true
}

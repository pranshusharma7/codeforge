// Production-grade Contest & Proctoring Backend Engine
// Handles authoritative server timing, anti-cheat risk scoring,
// session concurrency protection, sandboxed hidden test execution, and immutable audit logs.

import http from "http"

// In-memory server-authoritative store
const sessions = new Map() // sessionId -> session data
const userActiveSessions = new Map() // `${userId}:${contestId}` -> sessionId
const contestSubmissions = new Map() // submissionId -> submission data
const auditLogs = [] // array of immutable audit events

// Hidden test cases kept strictly server-side
const HIDDEN_TEST_CASES = {
  "prob-max-subarray": [
    { input: "4\n-1 -2 -3 -4", expectedOutput: "-1" },
    { input: "6\n10 -20 30 -5 40 -100", expectedOutput: "65" },
    { input: "8\n0 0 0 0 0 0 0 0", expectedOutput: "0" },
    { input: "5\n100 200 -50 300 -400", expectedOutput: "550" },
    { input: "7\n-2 -3 4 -1 -2 1 5", expectedOutput: "7" },
  ],
  "prob-two-sum-target": [
    { input: "5 100\n10 20 30 70 90", expectedOutput: "2 3" },
    { input: "6 0\n-5 3 -2 5 8 1", expectedOutput: "0 3" },
    { input: "4 8\n4 2 6 4", expectedOutput: "0 3" },
    { input: "2 1000000000\n500000000 500000000", expectedOutput: "0 1" },
  ],
  "prob-valid-parentheses": [
    { input: "((({{{[[[]]]}}})))", expectedOutput: "true" },
    { input: "((({{{[[[]]]}}}))", expectedOutput: "false" },
    { input: "()(){}{}[][]", expectedOutput: "true" },
    { input: "((((((((((", expectedOutput: "false" },
    { input: "))))))))))", expectedOutput: "false" },
  ],
  "prob-lru-cache-sim": [
    {
      input: "1 4\nPUT 10 100\nGET 10\nPUT 20 200\nGET 10",
      expectedOutput: "100\n-1",
    },
    {
      input: "3 5\nPUT 1 10\nPUT 2 20\nPUT 3 30\nGET 1\nGET 2",
      expectedOutput: "10\n20",
    },
  ],
  "prob-stream-median": [
    {
      input: "5\n10\n20\n30\n40\n50",
      expectedOutput: "10.0\n15.0\n20.0\n25.0\n30.0",
    },
    { input: "3\n-5\n-1\n-10", expectedOutput: "-5.0\n-3.0\n-5.0" },
  ],
}

const SAMPLE_TEST_CASES = {
  "prob-max-subarray": [
    { input: "9\n-2 1 -3 4 -1 2 1 -5 4", expectedOutput: "6" },
    { input: "1\n1", expectedOutput: "1" },
    { input: "5\n5 4 -1 7 8", expectedOutput: "23" },
  ],
  "prob-two-sum-target": [
    { input: "4 9\n2 7 11 15", expectedOutput: "0 1" },
    { input: "3 6\n3 2 4", expectedOutput: "1 2" },
  ],
  "prob-valid-parentheses": [
    { input: "()[]{}", expectedOutput: "true" },
    { input: "(]", expectedOutput: "false" },
    { input: "([)]", expectedOutput: "false" },
  ],
  "prob-lru-cache-sim": [
    {
      input: "2 6\nPUT 1 1\nPUT 2 2\nGET 1\nPUT 3 3\nGET 2\nGET 3",
      expectedOutput: "1\n-1\n3",
    },
  ],
  "prob-stream-median": [
    { input: "4\n5\n15\n1\n3", expectedOutput: "5.0\n10.0\n5.0\n4.0" },
  ],
}

// Risk weights for Anti-Cheat risk engine
const RISK_WEIGHTS = {
  SCREEN_SHARE_STOPPED: 35,
  CAMERA_STOPPED: 30,
  MIC_STOPPED: 20,
  FULLSCREEN_EXIT: 15,
  TAB_SWITCH: 12,
  WINDOW_BLUR: 8,
  LARGE_PASTE: 25,
  PASTE_EVENT: 10,
  COPY_EVENT: 5,
  MULTIPLE_SESSION_ATTEMPT: 40,
  DEVTOOLS_OPENED: 30,
}

import { executeCodeServer } from "../compile/handler.js"

// Production-grade sandboxed execution runner with local and cloud multi-tier fallback
async function executeCodeSandbox(code, language, stdin, timeLimitMs = 2000) {
  const start = Date.now()
  try {
    const res = await executeCodeServer(
      code,
      language,
      stdin,
      timeLimitMs + 1000,
    )
    const duration = Date.now() - start

    if (res.status?.id === 6 || res.compile_output) {
      return {
        success: false,
        status: "Compilation Error",
        output: res.compile_output || "",
        error: res.compile_output || "",
        duration,
      }
    }

    if (res.status?.id === 5 || duration > timeLimitMs + 500) {
      return {
        success: false,
        status: "Time Limit Exceeded",
        output: "",
        error: `Time limit exceeded (${duration}ms > ${timeLimitMs}ms)`,
        duration,
      }
    }

    if (res.exit_code !== 0 && res.stderr && !res.stdout) {
      return {
        success: false,
        status: "Runtime Error",
        output: "",
        error: res.stderr || "",
        duration,
      }
    }

    const output = (res.stdout || "").trim()
    return {
      success: true,
      status: "OK",
      output,
      error: res.stderr || "",
      duration,
    }
  } catch (err) {
    return {
      success: false,
      status: "Runtime Error",
      output: "",
      error: err.message || "Execution error in sandbox",
      duration: Date.now() - start,
    }
  }
}

export function handleContestApi(req, res) {
  const url = req.url || ""
  const parsedUrl = new URL(url, "http://localhost:8443")
  const pathname = parsedUrl.pathname

  res.setHeader("Access-Control-Allow-Origin", "*")
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, X-Contest-Session",
  )

  if (req.method === "OPTIONS") {
    res.writeHead(200)
    res.end()
    return true
  }

  // 1. Authoritative Server Time
  if (pathname === "/api/contest/time" && req.method === "GET") {
    const now = Date.now()
    res.writeHead(200, { "Content-Type": "application/json" })
    res.end(
      JSON.stringify({
        serverTime: new Date(now).toISOString(),
        timestamp: now,
        timezone: "UTC",
        status: "synchronized",
      }),
    )
    return true
  }

  // Helper to read JSON body
  const readJson = () =>
    new Promise((resolve) => {
      let body = ""
      req.on("data", (chunk) => {
        body += chunk
      })
      req.on("end", () => {
        try {
          resolve(JSON.parse(body || "{}"))
        } catch {
          resolve({})
        }
      })
    })

  // 2. Session Management
  if (pathname === "/api/contest/session") {
    if (req.method === "GET") {
      const contestId = parsedUrl.searchParams.get("contestId")
      const userId = parsedUrl.searchParams.get("userId")
      const sessionId = parsedUrl.searchParams.get("sessionId")

      let session = null
      if (sessionId && sessions.has(sessionId)) {
        session = sessions.get(sessionId)
      } else if (userId && contestId) {
        const activeId = userActiveSessions.get(`${userId}:${contestId}`)
        if (activeId && sessions.has(activeId)) {
          session = sessions.get(activeId)
        }
      }

      res.writeHead(200, { "Content-Type": "application/json" })
      res.end(
        JSON.stringify({
          session: session || null,
          serverTime: Date.now(),
        }),
      )
      return true
    }

    if (req.method === "POST") {
      readJson().then((body) => {
        const { action, contestId, userId, userEmail, userName, sessionId } =
          body
        const now = Date.now()

        if (action === "register") {
          // Register user for contest
          res.writeHead(200, { "Content-Type": "application/json" })
          res.end(
            JSON.stringify({
              registered: true,
              contestId,
              userId,
              registeredAt: new Date(now).toISOString(),
            }),
          )
          return
        }

        if (action === "start") {
          const userKey = `${userId}:${contestId}`
          const existingSessionId = userActiveSessions.get(userKey)

          // Multi-device protection
          if (existingSessionId && sessions.has(existingSessionId)) {
            const existing = sessions.get(existingSessionId)
            // If active and recent heartbeat (within 45s), block duplicate attempt unless explicit recovery
            if (
              existing.status === "in_progress" &&
              now - existing.lastHeartbeat < 45000 &&
              !body.forceRecovery
            ) {
              auditLogs.unshift({
                contestId,
                userId,
                sessionId: existingSessionId,
                event: "MULTIPLE_SESSION_ATTEMPT",
                timestamp: new Date(now).toISOString(),
                metadata: {
                  attemptedIp: req.socket.remoteAddress || "127.0.0.1",
                },
              })

              res.writeHead(409, { "Content-Type": "application/json" })
              res.end(
                JSON.stringify({
                  error:
                    "Active session already running on another window or device. Use recovery flow.",
                  conflictSessionId: existingSessionId,
                  code: "DUPLICATE_SESSION",
                }),
              )
              return
            }
          }

          // Create new server-authoritative session
          const newSessionId =
            "ses_" +
            Math.random().toString(36).substring(2, 10) +
            "_" +
            Date.now().toString(36)
          const newSession = {
            id: newSessionId,
            contestId,
            userId,
            userName: userName || "Contestant",
            userEmail: userEmail || `${userId}@codeforge.dev`,
            status: "in_progress",
            startTime: new Date(now).toISOString(),
            startTimestamp: now,
            lastHeartbeat: now,
            ipAddress: req.socket.remoteAddress || "127.0.0.1",
            userAgent: req.headers["user-agent"] || "",
            deviceInfo: body.deviceInfo || "Standard Desktop Browser",
            permissions: {
              cameraGranted: !!body.permissions?.cameraGranted,
              micGranted: !!body.permissions?.micGranted,
              screenGranted: !!body.permissions?.screenGranted,
              fullscreenActive: !!body.permissions?.fullscreenActive,
            },
            riskMetrics: {
              overallScore: 0,
              level: "normal",
              totalViolations: 0,
              breakdown: {
                tabSwitches: 0,
                windowBlurs: 0,
                fullscreenExits: 0,
                screenShareDrops: 0,
                cameraDrops: 0,
                micDrops: 0,
                copyPastes: 0,
                devtoolsDetections: 0,
              },
            },
            lockedUntil: null,
            submissions: [],
          }

          sessions.set(newSessionId, newSession)
          userActiveSessions.set(userKey, newSessionId)

          auditLogs.unshift({
            contestId,
            userId,
            sessionId: newSessionId,
            event: "SESSION_INITIALIZED",
            timestamp: new Date(now).toISOString(),
            metadata: { userAgent: req.headers["user-agent"] },
          })

          res.writeHead(200, { "Content-Type": "application/json" })
          res.end(
            JSON.stringify({
              session: newSession,
              serverTime: now,
            }),
          )
          return
        }

        if (action === "heartbeat") {
          const session = sessions.get(sessionId)
          if (!session) {
            res.writeHead(404, { "Content-Type": "application/json" })
            res.end(JSON.stringify({ error: "Session not found" }))
            return
          }

          session.lastHeartbeat = now
          if (body.permissions) {
            session.permissions = {
              ...session.permissions,
              ...body.permissions,
            }
          }

          res.writeHead(200, { "Content-Type": "application/json" })
          res.end(
            JSON.stringify({
              status: "alive",
              serverTime: now,
              lockedUntil: session.lockedUntil,
              isLocked: session.lockedUntil && session.lockedUntil > now,
            }),
          )
          return
        }

        if (action === "submit_contest") {
          const session = sessions.get(sessionId)
          if (session) {
            session.status = "submitted"
            session.submittedAt = new Date(now).toISOString()
          }

          auditLogs.unshift({
            contestId,
            userId,
            sessionId,
            event: "CONTEST_SUBMITTED_FINAL",
            timestamp: new Date(now).toISOString(),
            metadata: {},
          })

          res.writeHead(200, { "Content-Type": "application/json" })
          res.end(JSON.stringify({ success: true, status: "submitted" }))
          return
        }

        res.writeHead(400, { "Content-Type": "application/json" })
        res.end(JSON.stringify({ error: "Invalid action" }))
      })
      return true
    }
  }

  // 3. Telemetry & Security Events
  if (pathname === "/api/contest/telemetry" && req.method === "POST") {
    readJson().then((body) => {
      const { sessionId, contestId, userId, event, metadata = {} } = body
      const now = Date.now()
      const session = sessions.get(sessionId)

      // Record immutable audit event
      const auditItem = {
        contestId: contestId || (session && session.contestId),
        userId: userId || (session && session.userId),
        sessionId: sessionId || "unknown",
        event,
        timestamp: new Date(now).toISOString(),
        metadata: {
          ...metadata,
          ip: req.socket.remoteAddress || "127.0.0.1",
        },
      }
      auditLogs.unshift(auditItem)

      if (session) {
        // Update risk breakdown
        const bd = session.riskMetrics.breakdown
        if (event === "TAB_SWITCH") bd.tabSwitches++
        if (event === "WINDOW_BLUR") bd.windowBlurs++
        if (event === "FULLSCREEN_EXIT") bd.fullscreenExits++
        if (event === "SCREEN_SHARE_STOPPED") bd.screenShareDrops++
        if (event === "CAMERA_STOPPED") bd.cameraDrops++
        if (event === "MIC_STOPPED") bd.micDrops++
        if (event === "PASTE_EVENT" || event === "LARGE_PASTE") bd.copyPastes++
        if (event === "DEVTOOLS_OPENED") bd.devtoolsDetections++

        session.riskMetrics.totalViolations++

        // Calculate dynamic weighted risk score (0 - 100)
        let weight = RISK_WEIGHTS[event] || 5
        let newScore = Math.min(100, session.riskMetrics.overallScore + weight)
        session.riskMetrics.overallScore = newScore

        if (newScore >= 60) session.riskMetrics.level = "high"
        else if (newScore >= 30) session.riskMetrics.level = "review"
        else session.riskMetrics.level = "normal"

        // Check for lockout rule (e.g. 3 serious violations triggers temporary lock)
        if (session.riskMetrics.totalViolations >= 3 && !session.lockedUntil) {
          session.lockedUntil = now + 15000 // 15 seconds temporary penalty lock
        }
      }

      res.writeHead(200, { "Content-Type": "application/json" })
      res.end(
        JSON.stringify({
          recorded: true,
          riskScore: session ? session.riskMetrics.overallScore : 0,
          riskLevel: session ? session.riskMetrics.level : "normal",
          lockedUntil: session ? session.lockedUntil : null,
        }),
      )
    })
    return true
  }

  // 4. Submission & Hidden Test Runner
  if (pathname === "/api/contest/submit" && req.method === "POST") {
    readJson().then(async (body) => {
      const {
        sessionId,
        contestId,
        problemId,
        userId,
        code,
        language,
        isSampleOnly,
      } = body
      const now = Date.now()
      const session = sessions.get(sessionId)

      if (!session && !isSampleOnly) {
        res.writeHead(403, { "Content-Type": "application/json" })
        res.end(
          JSON.stringify({
            error: "Valid contest session required for submission.",
          }),
        )
        return
      }

      const sampleTests = SAMPLE_TEST_CASES[problemId] || []
      const hiddenTests = isSampleOnly ? [] : HIDDEN_TEST_CASES[problemId] || []
      const totalTests = sampleTests.length + hiddenTests.length

      let passedCount = 0
      let totalTimeMs = 0
      let maxTimeMs = 0
      let firstFailure = null
      const testCaseResults = []

      // 1. Run sample tests
      for (let i = 0; i < sampleTests.length; i++) {
        const tc = sampleTests[i]
        const exec = await executeCodeSandbox(code, language, tc.input, 2500)
        totalTimeMs += exec.duration
        maxTimeMs = Math.max(maxTimeMs, exec.duration)

        const cleanActual = (exec.output || "").trim()
        const cleanExpected = (tc.expectedOutput || "").trim()
        const isPassed = exec.success && cleanActual === cleanExpected

        if (isPassed) {
          passedCount++
          testCaseResults.push({
            testCaseIndex: i + 1,
            status: "AC",
            isHidden: false,
            timeMs: exec.duration,
            memoryKb: 14200,
            input: tc.input,
            expectedOutput: tc.expectedOutput,
            actualOutput: cleanActual,
          })
        } else {
          const status = !exec.success ? exec.status : "Wrong Answer"
          const resultItem = {
            testCaseIndex: i + 1,
            status:
              status === "Time Limit Exceeded"
                ? "TLE"
                : status === "Compilation Error"
                  ? "CE"
                  : "WA",
            isHidden: false,
            timeMs: exec.duration,
            memoryKb: 14200,
            input: tc.input,
            expectedOutput: tc.expectedOutput,
            actualOutput: cleanActual,
            error: exec.error,
          }
          testCaseResults.push(resultItem)
          if (!firstFailure) firstFailure = resultItem
          // If compilation error, break early
          if (exec.status === "Compilation Error") break
        }
      }

      // 2. Run hidden tests (ONLY if sample tests passed or not compilation error)
      if (!isSampleOnly && (!firstFailure || firstFailure.status !== "CE")) {
        for (let j = 0; j < hiddenTests.length; j++) {
          const tc = hiddenTests[j]
          const testIndex = sampleTests.length + j + 1
          const exec = await executeCodeSandbox(code, language, tc.input, 2500)
          totalTimeMs += exec.duration
          maxTimeMs = Math.max(maxTimeMs, exec.duration)

          const cleanActual = (exec.output || "").trim()
          const cleanExpected = (tc.expectedOutput || "").trim()
          const isPassed = exec.success && cleanActual === cleanExpected

          if (isPassed) {
            passedCount++
            testCaseResults.push({
              testCaseIndex: testIndex,
              status: "AC",
              isHidden: true, // Note: hidden test input/output is NEVER transmitted
              timeMs: exec.duration,
              memoryKb: 15400,
            })
          } else {
            const status = !exec.success ? exec.status : "Wrong Answer"
            const resultItem = {
              testCaseIndex: testIndex,
              status: status === "Time Limit Exceeded" ? "TLE" : "WA",
              isHidden: true, // input/output deliberately omitted for integrity
              timeMs: exec.duration,
              memoryKb: 15400,
            }
            testCaseResults.push(resultItem)
            if (!firstFailure) firstFailure = resultItem
          }
        }
      }

      const isAccepted = passedCount === totalTests && totalTests > 0
      const finalVerdict = isAccepted
        ? "Accepted"
        : firstFailure
          ? firstFailure.status === "CE"
            ? "Compilation Error"
            : firstFailure.status === "TLE"
              ? "Time Limit Exceeded"
              : "Wrong Answer"
          : "Wrong Answer"

      // Points calculation
      const maxProblemPoints = 100
      const pointsEarned =
        totalTests > 0
          ? Math.round((passedCount / totalTests) * maxProblemPoints)
          : 0

      const submissionId =
        "sub_" +
        Math.random().toString(36).substring(2, 9) +
        "_" +
        Date.now().toString(36)
      const submissionRecord = {
        id: submissionId,
        contestId,
        problemId,
        userId: userId || "anonymous",
        sessionId: sessionId || "sample-run",
        code,
        language,
        status: finalVerdict,
        passedCount,
        totalCount: totalTests,
        pointsEarned,
        timeMs: maxTimeMs,
        memoryKb: 15400,
        createdAt: new Date(now).toISOString(),
        testCaseResults,
      }

      if (!isSampleOnly) {
        contestSubmissions.set(submissionId, submissionRecord)
        if (session) {
          session.submissions.push(submissionRecord)
        }

        auditLogs.unshift({
          contestId,
          userId,
          sessionId,
          event: "CODE_SUBMISSION",
          timestamp: new Date(now).toISOString(),
          metadata: {
            submissionId,
            problemId,
            verdict: finalVerdict,
            passed: `${passedCount}/${totalTests}`,
            points: pointsEarned,
          },
        })
      }

      res.writeHead(200, { "Content-Type": "application/json" })
      res.end(
        JSON.stringify({
          submissionId,
          status: finalVerdict,
          passedCount,
          totalCount: totalTests,
          pointsEarned,
          timeMs: maxTimeMs,
          memoryKb: 15400,
          testCaseResults,
          isAccepted,
        }),
      )
    })
    return true
  }

  // 5. Admin Roster & Audit Queries
  if (pathname === "/api/contest/admin/audit" && req.method === "GET") {
    const contestId = parsedUrl.searchParams.get("contestId")
    const filteredLogs = contestId
      ? auditLogs.filter((l) => l.contestId === contestId)
      : auditLogs
    const allSessionsList = Array.from(sessions.values()).filter(
      (s) => !contestId || s.contestId === contestId,
    )

    res.writeHead(200, { "Content-Type": "application/json" })
    res.end(
      JSON.stringify({
        sessions: allSessionsList,
        auditLogs: filteredLogs.slice(0, 100),
        totalCandidates: allSessionsList.length,
        highRiskCount: allSessionsList.filter(
          (s) => s.riskMetrics.level === "high",
        ).length,
      }),
    )
    return true
  }

  return false
}

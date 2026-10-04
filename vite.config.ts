import { defineConfig, loadEnv, type Plugin } from "vite"
import react from "@vitejs/plugin-react"
import tailwindcss from "@tailwindcss/vite"
import path from "node:path"
import http from "node:http"
import fs from "node:fs"

// Helper to get environment variables reliably in dev server plugins
function getReliableEnv(): Record<string, string> {
  const result: Record<string, string> = {
    ...process.env as Record<string, string>,
  }
  try {
    const envPath = path.resolve(process.cwd(), ".env")
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, "utf-8")
      for (const line of content.split("\n")) {
        const trimmed = line.trim()
        if (trimmed && !trimmed.startsWith("#") && trimmed.includes("=")) {
          const idx = trimmed.indexOf("=")
          const key = trimmed.slice(0, idx).trim()
          const val = trimmed
            .slice(idx + 1)
            .trim()
            .replace(/^["']|["']$/g, "")
          if (key && val) {
            result[key] = val
          }
        }
      }
    }
  } catch {}
  return result
}

/**
 * CodeForge Live Server Plugin
 * Automatically starts an internal HTTP server for previewing HTML documents
 * on port 5500 with instant hot-reload support.
 */
function codeForgeLiveServerPlugin(): Plugin {
  let currentHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Live Server : 5500</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 40px 20px; background: #0f172a; color: #f8fafc; text-align: center; }
    .container { max-width: 600px; margin: 0 auto; background: #1e293b; padding: 32px; border-radius: 16px; border: 1px solid #334155; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5); }
    h1 { color: #38bdf8; font-size: 26px; margin-top: 0; display: flex; align-items: center; justify-content: center; gap: 8px; }
    p { color: #94a3b8; font-size: 15px; line-height: 1.6; }
    .badge { display: inline-flex; align-items: center; gap: 6px; background: rgba(52, 211, 153, 0.15); border: 1px solid rgba(52, 211, 153, 0.35); padding: 8px 16px; border-radius: 9999px; color: #34d399; font-family: monospace; font-size: 13px; font-weight: 600; margin: 16px 0; }
    .dot { width: 8px; height: 8px; border-radius: 50%; background: #34d399; box-shadow: 0 0 8px #34d399; }
  </style>
</head>
<body>
  <div class="container">
    <h1><span>📡</span> Live Server Running</h1>
    <div class="badge"><div class="dot"></div> http://127.0.0.1:5500/</div>
    <p>Switch to CodeForge editor and open or edit any <strong>HTML</strong> file. Your changes will automatically reflect here with instant hot reload!</p>
  </div>
</body>
</html>`
  let version = 1
  let serverInstance: http.Server | null = null

  const getInjectedHtml = (html: string) => {
    const liveReloadScript = `
<!-- CodeForge Live Server Hot Reload -->
<script>
(function() {
  var lastVer = ${version};
  setInterval(async function() {
    try {
      var res = await fetch('/__live_version__');
      var ver = await res.text();
      if (lastVer && ver && parseInt(ver) !== lastVer) {
        lastVer = parseInt(ver);
        console.log('[Live Server] Hot reloading due to CodeForge editor changes...');
        location.reload();
      }
    } catch(e) {}
  }, 750);
})();
</script>`
    if (html.includes("</body>")) {
      return html.replace("</body>", `${liveReloadScript}</body>`)
    }
    return `${html}${liveReloadScript}`
  }

  return {
    name: "codeforge-live-server",
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.method === "POST" && req.url === "/__update_live_html__") {
          let body = ""
          req.on("data", (chunk) => {
            body += chunk.toString()
          })
          req.on("end", () => {
            try {
              const data = JSON.parse(body)
              if (data && typeof data.html === "string") {
                currentHtml = data.html
                version++
              }
              res.writeHead(200, { "Content-Type": "application/json" })
              res.end(JSON.stringify({ ok: true, version }))
            } catch (err) {
              res.writeHead(400, { "Content-Type": "application/json" })
              res.end(JSON.stringify({ error: "Invalid JSON" }))
            }
          })
          return
        }

        if (req.url === "/__live_version__") {
          res.writeHead(200, {
            "Content-Type": "text/plain",
            "Access-Control-Allow-Origin": "*",
          })
          res.end(String(version))
          return
        }

        if (req.url === "/__live_html__") {
          res.writeHead(200, {
            "Content-Type": "text/html; charset=utf-8",
            "Access-Control-Allow-Origin": "*",
          })
          res.end(currentHtml)
          return
        }

        next()
      })
    },
  }
}

/**
 * CodeForge Dev Server API Plugin
 * Proxies GitHub Device Flow and Gemini AI requests directly from Node.js
 * to eliminate browser CORS restrictions in local development.
 */
function codeForgeApiServerPlugin(): Plugin {
  const apiMiddleware = async (req: any, res: any, next: any) => {
    const url = req.url || ""

    // CORS preflight for all /api/ endpoints
    if (url.startsWith("/api/") && req.method === "OPTIONS") {
      res.setHeader("Access-Control-Allow-Origin", "*")
      res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
      res.setHeader("Access-Control-Allow-Headers", "*")
      res.writeHead(200)
      res.end()
      return
    }

    // Compiler Execution API endpoint
    if (url.startsWith("/api/compile")) {
      try {
        const { handleCompileApi } = await import("./api/compile/handler.js")
        if (await handleCompileApi(req, res)) {
          return
        }
      } catch (err: any) {
        console.error("Compiler API error:", err)
        res.writeHead(500, { "Content-Type": "application/json" })
        res.end(
          JSON.stringify({
            error: err.message || "Compiler API handler failed",
          }),
        )
        return
      }
    }

    // Contest API endpoints
    if (url.startsWith("/api/contest/")) {
      try {
        // Dynamically require or import handler
        const { handleContestApi } = await import("./api/contest/handler.js")
        if (handleContestApi(req, res)) {
          return
        }
      } catch (err: any) {
        console.error("Contest API error:", err)
        res.writeHead(500, { "Content-Type": "application/json" })
        res.end(
          JSON.stringify({
            error: err.message || "Contest API handler failed",
          }),
        )
        return
      }
    }

    // GitHub OAuth Handler: Device Flow & Token Exchange (covers /api/github-device, /api/github-token, /api/github-oauth, /device/code, /access_token)
    if (
      req.method === "POST" &&
      (url.startsWith("/api/github-") ||
        url.includes("/device/code") ||
        url.includes("/access_token"))
    ) {
      let body = ""
      req.on("data", (chunk: any) => {
        body += chunk
      })
      req.on("end", async () => {
        try {
          let parsed: any = {}
          try {
            parsed = JSON.parse(body)
          } catch {}
          const clientId =
            parsed?.client_id ||
            process.env.VITE_GITHUB_CLIENT_ID ||
            "Ov23liOzK7Vzn4ZGcYzY"

          const isTokenExchange = Boolean(
            parsed?.device_code ||
              parsed?.grant_type ||
              url.includes("access_token") ||
              url.includes("github-token"),
          )

          const targetUrl = isTokenExchange
            ? "https://github.com/login/oauth/access_token"
            : "https://github.com/login/device/code"

          const payload = isTokenExchange
            ? {
                client_id: clientId,
                device_code: parsed?.device_code,
                grant_type:
                  parsed?.grant_type ||
                  "urn:ietf:params:oauth:grant-type:device_code",
              }
            : {
                client_id: clientId,
                scope: parsed?.scope || "read:user user:email repo workflow",
              }

          const ghRes = await fetch(targetUrl, {
            method: "POST",
            headers: {
              Accept: "application/json",
              "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
          })
          const data = await ghRes.json().catch(() => ({}))
          res.writeHead(ghRes.status, {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          })
          res.end(JSON.stringify(data))
        } catch (err: any) {
          res.writeHead(500, {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          })
          res.end(
            JSON.stringify({
              error: err.message || "GitHub OAuth proxy error",
            }),
          )
        }
      })
      return
    }

    // 3. Google Gemini AI Proxy: /api/ai/gemini
    if (req.method === "POST" && url.startsWith("/api/ai/gemini")) {
      let body = ""
      req.on("data", (chunk: any) => {
        body += chunk
      })
      req.on("end", async () => {
        try {
          let parsed: any = {}
          try {
            parsed = JSON.parse(body)
          } catch {}

          const env = getReliableEnv()
          const key = env.VITE_AI_KEY || process.env.VITE_AI_KEY || ""

          if (!key) {
            res.writeHead(500, {
              "Content-Type": "application/json",
              "Access-Control-Allow-Origin": "*",
            })
            res.end(
              JSON.stringify({
                ok: false,
                error: "VITE_AI_KEY is not configured",
              }),
            )
            return
          }

          const prompt = parsed?.prompt || ""
          const code = parsed?.code || ""
          const lang = parsed?.lang || "code"
          const history = parsed?.history || []

          const systemInstructionText = `You are CodeForge AI, an elite senior software architect and full-stack programmer acting with the full intelligence, depth, and helpfulness of Google Gemini and ChatGPT.

When a user asks for code, especially web development requests involving HTML, CSS, and JavaScript:
1. ALWAYS provide the COMPLETE code for EVERY requested technology. NEVER omit, truncate, or skip JavaScript, CSS, or HTML!
2. Structure your response cleanly using markdown with clear headings:
   - ### 1. HTML (Structure) inside a \`\`\`html code block
   - ### 2. CSS (Styling) inside a \`\`\`css code block (beautiful, modern styling with flexbox/grid, gradients, smooth transitions)
   - ### 3. JavaScript (Logic & Interactivity) inside a \`\`\`javascript code block (complete, fully functional logic with all event listeners, functions, and state management)
   - ### 4. All-in-One File (index.html) inside a \`\`\`html code block with embedded <style> and <script> so the user can copy/paste and run/preview it immediately with one click.
3. Provide a friendly, detailed walkthrough explaining how the code works, key features, and tips for customization, just like ChatGPT and Gemini.
4. For all other programming languages (Python, C++, Java, Rust, Go, SQL, etc.), always provide complete, production-ready, runnable solutions without any placeholders or TODOs, along with Big-O time and space complexity analysis.`

          const contents: any[] = []

          // Build conversation history ensuring valid alternating user/model roles
          if (Array.isArray(history) && history.length > 0) {
            let lastRole = ""
            for (const msg of history.slice(-6)) {
              const role = msg.role === "assistant" ? "model" : "user"
              if (
                role !== lastRole &&
                msg.content &&
                typeof msg.content === "string" &&
                msg.content.trim()
              ) {
                contents.push({
                  role,
                  parts: [{ text: msg.content.trim() }],
                })
                lastRole = role
              }
            }
          }

          // Append current user prompt
          const finalUserContent = code.trim()
            ? `Active Workspace File (${lang} - ${parsed?.fileName || "current"}):\n\`\`\`${lang}\n${code}\n\`\`\`\n\nUser Request: ${prompt}`
            : prompt

          if (
            contents.length > 0 &&
            contents[contents.length - 1].role === "user"
          ) {
            contents[contents.length - 1].parts[0].text +=
              `\n\n${finalUserContent}`
          } else {
            contents.push({
              role: "user",
              parts: [{ text: finalUserContent }],
            })
          }

          const candidateModels = [
            "gemini-2.5-flash",
            "gemini-2.0-flash",
            "gemini-1.5-flash",
          ]
          let text = ""
          let lastErr = ""

          for (const m of candidateModels) {
            try {
              const geminiRes = await fetch(
                `https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent?key=${encodeURIComponent(key)}`,
                {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    systemInstruction: {
                      parts: [{ text: systemInstructionText }],
                    },
                    contents,
                    generationConfig: {
                      temperature: 0.3,
                      maxOutputTokens: 8192,
                    },
                  }),
                },
              )

              if (geminiRes.ok) {
                const json = await geminiRes.json()
                text =
                  json.candidates?.[0]?.content?.parts
                    ?.map((p: any) => p.text || "")
                    .join("") || ""
                if (text.trim()) break
              } else {
                const errData = await geminiRes.json().catch(() => ({}))
                lastErr = errData.error?.message || `HTTP ${geminiRes.status}`
              }
            } catch (e: any) {
              lastErr = e.message
            }
          }

          if (text.trim()) {
            res.writeHead(200, {
              "Content-Type": "application/json",
              "Access-Control-Allow-Origin": "*",
            })
            res.end(JSON.stringify({ ok: true, text }))
            return
          }

          res.writeHead(500, {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          })
          res.end(
            JSON.stringify({
              ok: false,
              error: lastErr || "Failed to generate response",
            }),
          )
        } catch (err: any) {
          res.writeHead(500, {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          })
          res.end(
            JSON.stringify({
              ok: false,
              error: err.message || "Internal Gemini error",
            }),
          )
        }
      })
      return
    }

    next()
  }

  return {
    name: "codeforge-api-server",
    configureServer(server) {
      server.middlewares.use(apiMiddleware)
    },
    configurePreviewServer(server) {
      server.middlewares.use(apiMiddleware)
    },
  }
}

// Vite config - https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    codeForgeLiveServerPlugin(),
    codeForgeApiServerPlugin(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "./src"),
    },
  },
  server: {
    host: "0.0.0.0",
    port: parseInt(process.env.PORT || "8443"),
  },
  build: {
    outDir: "dist",
    sourcemap: false,
    chunkSizeWarningLimit: 3000,
  },
})

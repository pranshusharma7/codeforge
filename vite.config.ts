import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'node:path'
import http from 'node:http'

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
    if (html.includes('</body>')) {
      return html.replace('</body>', `${liveReloadScript}</body>`)
    }
    return `${html}${liveReloadScript}`
  }

  return {
    name: 'codeforge-live-server',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.method === 'POST' && req.url === '/__update_live_html__') {
          let body = ''
          req.on('data', chunk => {
            body += chunk.toString()
          })
          req.on('end', () => {
            try {
              const data = JSON.parse(body)
              if (data && typeof data.html === 'string') {
                currentHtml = data.html
                version++
              }
              res.writeHead(200, { 'Content-Type': 'application/json' })
              res.end(JSON.stringify({ ok: true, version }))
            } catch (err) {
              res.writeHead(400, { 'Content-Type': 'application/json' })
              res.end(JSON.stringify({ error: 'Invalid JSON' }))
            }
          })
          return
        }

        if (req.url === '/__live_version__') {
          res.writeHead(200, {
            'Content-Type': 'text/plain',
            'Access-Control-Allow-Origin': '*',
          })
          res.end(String(version))
          return
        }

        next()
      })

      // Start internal preview server on port 5500
      try {
        const liveServer = http.createServer((req, res) => {
          res.setHeader('Access-Control-Allow-Origin', '*')
          res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')

          if (req.url === '/__live_version__') {
            res.writeHead(200, { 'Content-Type': 'text/plain' })
            res.end(String(version))
            return
          }

          res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' })
          res.end(getInjectedHtml(currentHtml))
        })

        liveServer.on('error', (err: any) => {
          if (err.code === 'EADDRINUSE') {
            console.log('📡 Port 5500 already active')
          } else {
            console.warn('📡 Live Server notice:', err.message)
          }
        })

        liveServer.listen(5500, '127.0.0.1', () => {
          serverInstance = liveServer
          console.log('📡 CodeForge Live Server ready at http://127.0.0.1:5500/')
        })
      } catch (e) {
        console.warn('Failed to bind Live Server port 5500:', e)
      }
    },
    closeBundle() {
      if (serverInstance) {
        try { serverInstance.close() } catch {}
      }
    },
  }
}

/**
 * CodeForge Dev Server API Plugin
 * Proxies GitHub Device Flow and Gemini AI requests directly from Node.js
 * to eliminate browser CORS restrictions in local development.
 */
function codeForgeApiServerPlugin(): Plugin {
  return {
    name: 'codeforge-api-server',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = req.url || ''

        // CORS preflight for all /api/ endpoints
        if (url.startsWith('/api/') && req.method === 'OPTIONS') {
          res.setHeader('Access-Control-Allow-Origin', '*')
          res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
          res.setHeader('Access-Control-Allow-Headers', '*')
          res.writeHead(200)
          res.end()
          return
        }

        // 1. GitHub Device Flow: /api/github-device or /api/github-oauth/login/device/code
        if (
          req.method === 'POST' &&
          (url.startsWith('/api/github-device') || url.includes('/device/code'))
        ) {
          let body = ''
          req.on('data', chunk => {
            body += chunk
          })
          req.on('end', async () => {
            try {
              let parsed: any = {}
              try {
                parsed = JSON.parse(body)
              } catch {}
              const clientId = parsed?.client_id || process.env.VITE_GITHUB_CLIENT_ID || 'Ov23liOzK7Vzn4ZGcYzY'
              const scope = parsed?.scope || 'read:user user:email repo workflow'
              const ghRes = await fetch('https://github.com/login/device/code', {
                method: 'POST',
                headers: {
                  Accept: 'application/json',
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({ client_id: clientId, scope }),
              })
              const data = await ghRes.json().catch(() => ({}))
              res.writeHead(ghRes.status, {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
              })
              res.end(JSON.stringify(data))
            } catch (err: any) {
              res.writeHead(500, {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
              })
              res.end(JSON.stringify({ error: err.message || 'Internal device error' }))
            }
          })
          return
        }

        // 2. GitHub Token Exchange: /api/github-token or /api/github-oauth/login/oauth/access_token
        if (
          req.method === 'POST' &&
          (url.startsWith('/api/github-token') || url.includes('/access_token'))
        ) {
          let body = ''
          req.on('data', chunk => {
            body += chunk
          })
          req.on('end', async () => {
            try {
              let parsed: any = {}
              try {
                parsed = JSON.parse(body)
              } catch {}
              const clientId = parsed?.client_id || process.env.VITE_GITHUB_CLIENT_ID || 'Ov23liOzK7Vzn4ZGcYzY'
              const deviceCode = parsed?.device_code
              const grantType = parsed?.grant_type || 'urn:ietf:params:oauth:grant-type:device_code'
              const ghRes = await fetch('https://github.com/login/oauth/access_token', {
                method: 'POST',
                headers: {
                  Accept: 'application/json',
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  client_id: clientId,
                  device_code: deviceCode,
                  grant_type: grantType,
                }),
              })
              const data = await ghRes.json().catch(() => ({}))
              res.writeHead(ghRes.status, {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
              })
              res.end(JSON.stringify(data))
            } catch (err: any) {
              res.writeHead(500, {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
              })
              res.end(JSON.stringify({ error: err.message || 'Internal token error' }))
            }
          })
          return
        }

        // 3. Google Gemini AI Proxy: /api/ai/gemini
        if (req.method === 'POST' && url.startsWith('/api/ai/gemini')) {
          let body = ''
          req.on('data', chunk => {
            body += chunk
          })
          req.on('end', async () => {
            try {
              let parsed: any = {}
              try {
                parsed = JSON.parse(body)
              } catch {}
              const key = process.env.VITE_AI_KEY
              const model = process.env.VITE_AI_MODEL || 'gemini-3.8-flash'
              const prompt = parsed?.prompt || ''
              const code = parsed?.code || ''
              const lang = parsed?.lang || 'code'
              const history = parsed?.history || []

              const userPrompt = code.trim()
                ? `Active File (${lang}):\n\`\`\`${lang}\n${code}\n\`\`\`\n\nPrompt: ${prompt}`
                : prompt

              const contents = [
                {
                  role: 'user',
                  parts: [
                    {
                      text: 'You are CodeForge AI, an elite senior programming copilot inside an online compiler. Provide production-ready, complete code inside fenced markdown blocks, along with concise explanations and Big-O complexity analysis.',
                    },
                  ],
                },
                ...history.slice(-6).map((m: any) => ({
                  role: m.role === 'assistant' ? 'model' : 'user',
                  parts: [{ text: m.content }],
                })),
                {
                  role: 'user',
                  parts: [{ text: userPrompt }],
                },
              ]

              const candidateModels = [model, 'gemini-2.5-flash', 'gemini-2.5-pro'].filter(
                (m, idx, arr) => arr.indexOf(m) === idx
              )
              let text = ''
              let lastErr = ''

              for (const m of candidateModels) {
                try {
                  const geminiRes = await fetch(
                    `https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent?key=${encodeURIComponent(key)}`,
                    {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        contents,
                        generationConfig: { temperature: 0.2, maxOutputTokens: 3000 },
                      }),
                    }
                  )

                  if (geminiRes.ok) {
                    const json = await geminiRes.json()
                    text = json.candidates?.[0]?.content?.parts?.map((p: any) => p.text || '').join('') || ''
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
                  'Content-Type': 'application/json',
                  'Access-Control-Allow-Origin': '*',
                })
                res.end(JSON.stringify({ ok: true, text }))
                return
              }

              res.writeHead(500, {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
              })
              res.end(JSON.stringify({ ok: false, error: lastErr || 'Failed to generate response' }))
            } catch (err: any) {
              res.writeHead(500, {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
              })
              res.end(JSON.stringify({ ok: false, error: err.message || 'Internal Gemini error' }))
            }
          })
          return
        }

        next()
      })
    },
  }
}

// Vite config — https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    codeForgeLiveServerPlugin(),
    codeForgeApiServerPlugin(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
  server: {
    host: '0.0.0.0',
    port: parseInt(process.env.PORT || '8443'),
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    chunkSizeWarningLimit: 3000,
  },
})


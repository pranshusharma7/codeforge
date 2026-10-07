const MONTHLY_AI_LIMIT = 20
const GITHUB_USER_URL = 'https://api.github.com/user'

const READ_USAGE_SCRIPT = `
  return tonumber(redis.call('GET', KEYS[1]) or '0')
`

const RESERVE_USAGE_SCRIPT = `
  local current = tonumber(redis.call('GET', KEYS[1]) or '0')
  local limit = tonumber(ARGV[1])
  if current >= limit then
    return {0, current}
  end
  current = redis.call('INCR', KEYS[1])
  if current == 1 then
    redis.call('EXPIREAT', KEYS[1], tonumber(ARGV[2]))
  end
  return {1, current}
`

const RELEASE_USAGE_SCRIPT = `
  local current = tonumber(redis.call('GET', KEYS[1]) or '0')
  if current > 0 then
    return redis.call('DECR', KEYS[1])
  end
  return 0
`

function getMonthWindow(now = new Date()) {
  const year = now.getUTCFullYear()
  const monthIndex = now.getUTCMonth()
  const month = `${year}-${String(monthIndex + 1).padStart(2, '0')}`
  const nextMonth = Date.UTC(year, monthIndex + 1, 1)
  return { month, resetsAt: new Date(nextMonth).toISOString(), expiresAt: Math.floor(nextMonth / 1000) }
}

function sendError(res, status, error, usage) {
  return res.status(status).json({ ok: false, error, ...(usage ? { usage } : {}) })
}

async function readRequestBody(req) {
  if (req.body && typeof req.body === 'object') return req.body
  if (typeof req.body === 'string') {
    try {
      return JSON.parse(req.body)
    } catch {
      return null
    }
  }
  return null
}

async function authenticateGitHubUser(req) {
  const authorization = req.headers.authorization || ''
  const match = authorization.match(/^Bearer\s+(\S+)$/i)
  if (!match || match[1].length > 8192) return null

  const response = await fetch(GITHUB_USER_URL, {
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${match[1]}`,
      'X-GitHub-Api-Version': '2022-11-28',
    },
    signal: AbortSignal.timeout(10000),
  })
  if (!response.ok) return null

  const profile = await response.json()
  if (!Number.isSafeInteger(profile.id) || profile.id <= 0) return null
  return { id: String(profile.id), token: match[1] }
}

async function redisEval(script, key, args = []) {
  const url = process.env.UPSTASH_REDIS_REST_URL?.replace(/\/+$/, '')
  const token = process.env.UPSTASH_REDIS_REST_TOKEN
  if (!url || !token) {
    throw new Error('AI quota storage is not configured. Set the Upstash Redis environment variables.')
  }

  const command = ['EVAL', script, '1', key, ...args.map(String)]
  const response = await fetch(`${url}/pipeline`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify([command]),
    signal: AbortSignal.timeout(10000),
  })
  const results = await response.json().catch(() => null)
  if (!response.ok || !Array.isArray(results) || results[0]?.error) {
    throw new Error('Unable to access monthly AI quota storage.')
  }
  return results[0]?.result
}

function usageResponse(used, monthWindow) {
  const safeUsed = Math.max(0, Math.min(MONTHLY_AI_LIMIT, Number(used) || 0))
  return {
    used: safeUsed,
    limit: MONTHLY_AI_LIMIT,
    remaining: Math.max(0, MONTHLY_AI_LIMIT - safeUsed),
    month: monthWindow.month,
    resetsAt: monthWindow.resetsAt,
  }
}

function validatePayload(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return null
  if (typeof body.prompt !== 'string' || !body.prompt.trim() || body.prompt.length > 8000) return null
  if (typeof body.code !== 'string' || body.code.length > 50000) return null
  if (typeof body.lang !== 'string' || body.lang.length > 80) return null
  if (body.history !== undefined && !Array.isArray(body.history)) return null

  const history = (body.history || []).slice(-6)
  if (history.some(
    message =>
      !message ||
      !['user', 'assistant'].includes(message.role) ||
      typeof message.content !== 'string' ||
      message.content.length > 12000,
  )) {
    return null
  }
  return { prompt: body.prompt.trim(), code: body.code, lang: body.lang, history }
}

async function generateWithGemini({ prompt, code, lang, history }) {
  const key = process.env.AI_API_KEY
  if (!key) throw new Error('AI service is not configured. Set AI_API_KEY on the server.')

  const model = process.env.AI_MODEL || 'gemini-2.5-flash'
  const userPrompt = code.trim()
    ? `Active File (${lang}):\n\`\`\`${lang}\n${code}\n\`\`\`\n\nPrompt: ${prompt}`
    : prompt
  const contents = [
    ...history.map(message => ({
      role: message.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: message.content }],
    })),
    { role: 'user', parts: [{ text: userPrompt }] },
  ]

  let lastError = ''
  const candidates = [...new Set([model, 'gemini-2.5-flash', 'gemini-2.5-pro'])]
  const generationDeadline = Date.now() + 35000
  for (const candidate of candidates) {
    const remainingMs = generationDeadline - Date.now()
    if (remainingMs <= 0) break
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(candidate)}:generateContent?key=${encodeURIComponent(key)}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: {
            parts: [{
              text: 'You are CodeForge AI, a programming copilot. Give accurate, useful answers, complete runnable code when requested, and concise explanations.',
            }],
          },
          contents,
          generationConfig: { temperature: 0.2, maxOutputTokens: 3000 },
        }),
        signal: AbortSignal.timeout(Math.min(15000, remainingMs)),
      },
    )

    if (response.ok) {
      const data = await response.json()
      const text = data.candidates?.[0]?.content?.parts?.map(part => part.text || '').join('') || ''
      if (text.trim()) return text
      lastError = 'AI provider returned an empty response.'
    } else {
      const data = await response.json().catch(() => ({}))
      lastError = data.error?.message || `AI provider returned HTTP ${response.status}.`
    }
  }
  throw new Error(lastError || 'AI response generation failed.')
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store')
  res.setHeader('Vary', 'Authorization')
  res.setHeader('X-Content-Type-Options', 'nosniff')
  res.setHeader('X-Frame-Options', 'DENY')

  if (req.method !== 'GET' && req.method !== 'POST') {
    res.setHeader('Allow', 'GET, POST')
    return sendError(res, 405, 'Method not allowed.')
  }

  let user
  try {
    user = await authenticateGitHubUser(req)
  } catch {
    return sendError(res, 502, 'Unable to verify your GitHub account. Please try again.')
  }
  if (!user) return sendError(res, 401, 'Sign in with GitHub to use CodeForge AI.')

  const { month, resetsAt, expiresAt } = getMonthWindow()
  const quotaKey = `codeforge:ai:usage:${user.id}:${month}`
  const monthWindow = { month, resetsAt }

  try {
    if (req.method === 'GET') {
      const count = await redisEval(READ_USAGE_SCRIPT, quotaKey)
      return res.status(200).json({ ok: true, usage: usageResponse(count, monthWindow) })
    }

    const payload = validatePayload(await readRequestBody(req))
    if (!payload) {
      return sendError(res, 400, 'Invalid AI request. Check prompt, code, language, and conversation history.')
    }
    if (!process.env.AI_API_KEY) {
      return sendError(res, 503, 'CodeForge AI is not configured yet. Please try again later.')
    }

    const reservation = await redisEval(RESERVE_USAGE_SCRIPT, quotaKey, [MONTHLY_AI_LIMIT, expiresAt])
    if (!Array.isArray(reservation) || reservation.length < 2) {
      return sendError(res, 503, 'Unable to reserve your monthly AI request. Please try again.')
    }

    const [reserved, count] = reservation.map(Number)
    const usage = usageResponse(count, monthWindow)
    if (reserved !== 1) {
      return sendError(res, 429, 'You have used all 20 CodeForge AI requests for this month.', usage)
    }

    try {
      const text = await generateWithGemini(payload)
      return res.status(200).json({ ok: true, text, usage })
    } catch (error) {
      try {
        await redisEval(RELEASE_USAGE_SCRIPT, quotaKey)
      } catch (releaseError) {
        console.error('Failed to release AI quota after provider failure:', releaseError)
      }
      console.error('CodeForge AI provider request failed:', error)
      return sendError(res, 502, 'CodeForge AI could not generate a response. Your request was not counted.')
    }
  } catch (error) {
    console.error('CodeForge AI service error:', error)
    return sendError(res, 503, 'CodeForge AI is temporarily unavailable. Please try again.')
  }
}

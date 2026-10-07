async function getRequestBody(req) {
  if (req.body && typeof req.body === 'object') {
    return req.body
  }
  if (typeof req.body === 'string') {
    try {
      return JSON.parse(req.body)
    } catch {
      return {}
    }
  }
  if (!req.readable || req.readableEnded || req.complete) {
    return {}
  }
  return new Promise(resolve => {
    let raw = ''
    const timer = setTimeout(() => resolve({}), 1500)
    req.on('data', chunk => { raw += chunk })
    req.on('end', () => {
      clearTimeout(timer)
      try { resolve(JSON.parse(raw || '{}')) } catch { resolve({}) }
    })
    req.on('error', () => {
      clearTimeout(timer)
      resolve({})
    })
  })
}

export default async function handler(req, res) {
  const origin = req.headers.origin || '*'
  res.setHeader('Access-Control-Allow-Origin', origin)
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-Type, Date, Authorization'
  )
  res.setHeader('X-Content-Type-Options', 'nosniff')
  res.setHeader('X-Frame-Options', 'DENY')
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin')

  if (req.method === 'OPTIONS') {
    res.status(200).end()
    return
  }
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'method_not_allowed', error_description: 'Use POST for GitHub OAuth.' })
  }

  let timeout
  try {
    const body = await getRequestBody(req)
    const url = req.url || ''
    const isTokenExchange = Boolean(
      body?.device_code ||
      body?.grant_type ||
      url.includes('access_token') ||
      url.includes('token')
    )
    const targetUrl = isTokenExchange
      ? 'https://github.com/login/oauth/access_token'
      : 'https://github.com/login/device/code'

    const clientId = body?.client_id || process.env.VITE_GITHUB_CLIENT_ID || 'Ov23liOzK7Vzn4ZGcYzY'
    const payload = isTokenExchange
      ? {
          client_id: clientId,
          device_code: body?.device_code,
          grant_type: body?.grant_type || 'urn:ietf:params:oauth:grant-type:device_code',
        }
      : {
          client_id: clientId,
          scope: body?.scope || 'read:user user:email repo workflow',
        }

    const controller = new AbortController()
    timeout = setTimeout(() => controller.abort(), 20000)

    const ghRes = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'User-Agent': 'CodeForge-IDE',
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    })

    const data = await ghRes.json().catch(() => ({}))
    return res.status(ghRes.status).json(data)
  } catch (err) {
    const timedOut = err?.name === 'AbortError'
    return res.status(timedOut ? 504 : 502).json({
      error: timedOut ? 'github_timeout' : 'github_unavailable',
      error_description: timedOut
        ? 'GitHub did not respond in time. Please retry.'
        : 'The Vercel OAuth function could not reach GitHub.',
    })
  } finally {
    clearTimeout(timeout)
  }
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', 'true')
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT')
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  )

  if (req.method === 'OPTIONS') {
    res.status(200).end()
    return
  }
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'method_not_allowed', error_description: 'Use POST for GitHub OAuth.' })
  }

  let timeout
  try {
    let body = req.body
    if (!body && typeof req.on === 'function') {
      body = await new Promise(resolve => {
        let raw = ''
        req.on('data', chunk => { raw += chunk })
        req.on('end', () => {
          try { resolve(JSON.parse(raw)) } catch { resolve({}) }
        })
        req.on('error', () => resolve({}))
      })
    } else if (typeof body === 'string') {
      try {
        body = JSON.parse(body)
      } catch {}
    }

    const clientId = body?.client_id || process.env.VITE_GITHUB_CLIENT_ID || 'Ov23liOzK7Vzn4ZGcYzY'
    const deviceCode = body?.device_code
    const grantType = body?.grant_type || 'urn:ietf:params:oauth:grant-type:device_code'
    if (!deviceCode) {
      return res.status(400).json({ error: 'missing_device_code', error_description: 'GitHub device code is required.' })
    }

    const controller = new AbortController()
    timeout = setTimeout(() => controller.abort(), 25000)
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

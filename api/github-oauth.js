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
    const payload = { ...body, client_id: clientId }

    const ghRes = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })

    const data = await ghRes.json().catch(() => ({}))
    return res.status(ghRes.status).json(data)
  } catch (err) {
    return res.status(500).json({ error: err.message || 'GitHub OAuth proxy error' })
  }
}

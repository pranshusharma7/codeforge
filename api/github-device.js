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
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body)
      } catch {}
    }

    const clientId = body?.client_id || process.env.VITE_GITHUB_CLIENT_ID || 'Ov23liOzK7Vzn4ZGcYzY'
    const scope = body?.scope || 'read:user user:email repo workflow'

    const ghRes = await fetch('https://github.com/login/device/code', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ client_id: clientId, scope }),
    })

    const data = await ghRes.json().catch(() => ({}))
    return res.status(ghRes.status).json(data)
  } catch (err) {
    return res.status(500).json({ error: err.message || 'GitHub device code error' })
  }
}

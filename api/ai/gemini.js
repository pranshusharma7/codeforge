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
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    let body = req.body
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body)
      } catch {}
    }

    const key = process.env.VITE_AI_KEY
    const model = process.env.VITE_AI_MODEL || 'gemini-3.8-flash'
    const prompt = body?.prompt || ''
    const code = body?.code || ''
    const lang = body?.lang || 'code'
    const history = body?.history || []

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
      ...history.slice(-6).map(m => ({
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
          text = json.candidates?.[0]?.content?.parts?.map(p => p.text || '').join('') || ''
          if (text.trim()) break
        } else {
          const errData = await geminiRes.json().catch(() => ({}))
          lastErr = errData.error?.message || `HTTP ${geminiRes.status}`
        }
      } catch (e) {
        lastErr = e.message
      }
    }

    if (text.trim()) {
      return res.status(200).json({ ok: true, text })
    }

    return res.status(500).json({ ok: false, error: lastErr || 'Failed to generate response' })
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message || 'Internal Gemini error' })
  }
}

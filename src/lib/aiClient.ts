export interface AIUsage {
  used: number
  limit: number
  remaining: number
  month: string
  resetsAt: string
}

export class AIRequestError extends Error {
  status: number
  usage?: AIUsage

  constructor(message: string, status: number, usage?: AIUsage) {
    super(message)
    this.name = 'AIRequestError'
    this.status = status
    this.usage = usage
  }
}

async function requestAI(
  accessToken: string,
  method: 'GET' | 'POST',
  payload?: {
    prompt: string
    code: string
    lang: string
    history: { role: string; content: string }[]
  },
): Promise<{ text?: string; usage: AIUsage }> {
  const response = await fetch('/api/ai/gemini', {
    method,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      ...(payload ? { 'Content-Type': 'application/json' } : {}),
    },
    ...(payload ? { body: JSON.stringify(payload) } : {}),
  })

  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new AIRequestError(
      typeof data.error === 'string' ? data.error : 'CodeForge AI request failed.',
      response.status,
      data.usage,
    )
  }

  if (!data.usage || typeof data.usage.used !== 'number') {
    throw new AIRequestError('The AI service returned an invalid usage response.', 502)
  }

  return data
}

export async function getAIUsage(accessToken: string): Promise<AIUsage> {
  const data = await requestAI(accessToken, 'GET')
  return data.usage
}

export async function generateAIReply(
  accessToken: string,
  prompt: string,
  code: string,
  lang: string,
  history: { role: string; content: string }[] = [],
): Promise<{ text: string; usage: AIUsage }> {
  const data = await requestAI(accessToken, 'POST', { prompt, code, lang, history })
  if (typeof data.text !== 'string' || !data.text.trim()) {
    throw new AIRequestError('The AI service returned an empty response.', 502, data.usage)
  }
  return { text: data.text, usage: data.usage }
}

import assert from 'node:assert/strict'
import { after, before, beforeEach, test } from 'node:test'
import handler from '../api/ai/gemini.js'

const originalFetch = globalThis.fetch
const originalEnv = {
  AI_API_KEY: process.env.AI_API_KEY,
  AI_MODEL: process.env.AI_MODEL,
  UPSTASH_REDIS_REST_URL: process.env.UPSTASH_REDIS_REST_URL,
  UPSTASH_REDIS_REST_TOKEN: process.env.UPSTASH_REDIS_REST_TOKEN,
}
const counters = new Map()
let providerStatus = 200
let providerCalls = 0

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

before(() => {
  process.env.AI_API_KEY = 'test-server-key'
  process.env.AI_MODEL = 'gemini-test'
  process.env.UPSTASH_REDIS_REST_URL = 'https://redis.test'
  process.env.UPSTASH_REDIS_REST_TOKEN = 'test-redis-token'

  globalThis.fetch = async (input, init = {}) => {
    const url = String(input)
    if (url === 'https://api.github.com/user') {
      const token = init.headers.Authorization.split(' ').at(-1)
      const id = Number(token.replace('github-user-', ''))
      return jsonResponse({ id })
    }
    if (url === 'https://redis.test/pipeline') {
      const [[, script, , key, ...args]] = JSON.parse(init.body)
      let result
      if (script.includes('local limit = tonumber(ARGV[1])')) {
        const current = counters.get(key) || 0
        if (current >= Number(args[0])) {
          result = [0, current]
        } else {
          const next = current + 1
          counters.set(key, next)
          result = [1, next]
        }
      } else if (script.includes('redis.call(\'DECR\'')) {
        const current = Math.max(0, (counters.get(key) || 0) - 1)
        counters.set(key, current)
        result = current
      } else {
        result = counters.get(key) || 0
      }
      return jsonResponse([{ result }])
    }
    if (url.startsWith('https://generativelanguage.googleapis.com/')) {
      providerCalls += 1
      if (providerStatus !== 200) {
        return jsonResponse({ error: { message: 'test provider failure' } }, providerStatus)
      }
      return jsonResponse({
        candidates: [{ content: { parts: [{ text: 'Generated response' }] } }],
      })
    }
    throw new Error(`Unexpected fetch: ${url}`)
  }
})

after(() => {
  globalThis.fetch = originalFetch
  for (const [name, value] of Object.entries(originalEnv)) {
    if (value === undefined) delete process.env[name]
    else process.env[name] = value
  }
})

beforeEach(() => {
  counters.clear()
  providerStatus = 200
  providerCalls = 0
})

async function invoke({ method = 'POST', token, body } = {}) {
  const response = {
    statusCode: 200,
    headers: {},
    setHeader(name, value) { this.headers[name] = value },
    status(code) { this.statusCode = code; return this },
    json(data) { this.data = data; return this },
  }
  await handler({
    method,
    headers: token ? { authorization: `Bearer ${token}` } : {},
    body,
  }, response)
  return response
}

const validBody = {
  prompt: 'Explain this program',
  code: 'print("hello")',
  lang: 'python',
  history: [],
}

test('rejects AI usage without a GitHub token', async () => {
  const response = await invoke({ body: validBody })
  assert.equal(response.statusCode, 401)
  assert.equal(providerCalls, 0)
  assert.equal(counters.size, 0)
})

test('allows 20 successful requests per verified GitHub account each month', async () => {
  for (let request = 0; request < 20; request += 1) {
    const response = await invoke({ token: 'github-user-42', body: validBody })
    assert.equal(response.statusCode, 200)
    assert.equal(response.data.usage.used, request + 1)
  }

  const denied = await invoke({ token: 'github-user-42', body: validBody })
  assert.equal(denied.statusCode, 429)
  assert.equal(denied.data.usage.used, 20)
  assert.equal(providerCalls, 20)
})

test('enforces the monthly cap for concurrent requests', async () => {
  const responses = await Promise.all(
    Array.from({ length: 25 }, () => invoke({ token: 'github-user-42', body: validBody })),
  )
  assert.equal(responses.filter(response => response.statusCode === 200).length, 20)
  assert.equal(responses.filter(response => response.statusCode === 429).length, 5)
  assert.equal(counters.values().next().value, 20)
})

test('keeps monthly usage separate between GitHub accounts', async () => {
  await invoke({ token: 'github-user-42', body: validBody })
  const otherAccount = await invoke({ token: 'github-user-43', body: validBody })
  assert.equal(otherAccount.statusCode, 200)
  assert.equal(otherAccount.data.usage.used, 1)
})

test('does not charge quota for provider failures', async () => {
  providerStatus = 503
  const failed = await invoke({ token: 'github-user-42', body: validBody })
  assert.equal(failed.statusCode, 502)

  providerStatus = 200
  const retried = await invoke({ token: 'github-user-42', body: validBody })
  assert.equal(retried.statusCode, 200)
  assert.equal(retried.data.usage.used, 1)
})

test('returns current usage without consuming a request', async () => {
  await invoke({ token: 'github-user-42', body: validBody })
  const response = await invoke({ method: 'GET', token: 'github-user-42' })
  assert.equal(response.statusCode, 200)
  assert.equal(response.data.usage.used, 1)
})

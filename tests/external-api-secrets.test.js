import { test } from 'node:test'
import assert from 'node:assert/strict'
import path from 'node:path'
import fs from 'node:fs'
import { loadDotEnvFile, getSanitizedChildEnv, executeCodeServer } from '../api/compile/handler.js'

test('Secrets & .env: Loads environment variables from root .env', () => {
  const env = loadDotEnvFile(process.cwd())
  assert.ok(env.CODEFORGE_API_KEY, 'CODEFORGE_API_KEY must be present in .env')
  assert.ok(env.CODEFORGE_API_KEY.startsWith('cf_live_'), 'CODEFORGE_API_KEY must start with cf_live_')
})

test('Secrets & .env: Child environment includes .env secrets and custom variables', () => {
  const childEnv = getSanitizedChildEnv({ TEST_EXTERNAL_SECRET: 'hello_world_123' })
  assert.equal(childEnv.TEST_EXTERNAL_SECRET, 'hello_world_123')
  assert.ok(childEnv.CODEFORGE_API_KEY)
})

test('Secrets & .env: Python code execution can read .env secrets via os.environ', async () => {
  const code = `
import os
print("API_KEY:" + str(os.environ.get("CODEFORGE_API_KEY", "")))
print("CUSTOM:" + str(os.environ.get("MY_PROJECT_KEY", "")))
`
  const res = await executeCodeServer(code, 'python', '', 8000, { MY_PROJECT_KEY: 'secret_val_99' })
  assert.equal(res.exit_code, 0)
  assert.ok(res.stdout.includes('API_KEY:cf_live_'))
  assert.ok(res.stdout.includes('CUSTOM:secret_val_99'))
})

test('Secrets & .env: Node.js code execution can read .env secrets via process.env', async () => {
  const code = `
console.log("API_KEY:" + process.env.CODEFORGE_API_KEY);
console.log("NODE_SECRET:" + process.env.NODE_TEST_SECRET);
`
  const res = await executeCodeServer(code, 'javascript', '', 8000, { NODE_TEST_SECRET: 'super_secret_node' })
  assert.equal(res.exit_code, 0)
  assert.ok(res.stdout.includes('API_KEY:cf_live_'))
  assert.ok(res.stdout.includes('NODE_SECRET:super_secret_node'))
})

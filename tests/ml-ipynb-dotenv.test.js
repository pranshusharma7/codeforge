import test from 'node:test'
import assert from 'node:assert/strict'
import { LANGUAGES, getLangById } from '../src/lib/languages.ts'
import { executeCodeServer } from '../api/compile/handler.js'

test('ML & AI: Language list contains Python Machine Learning & AI', () => {
  const mlLang = getLangById('python_ml')
  assert.ok(mlLang, 'python_ml language should exist')
  assert.equal(mlLang.id, 'python_ml')
  assert.equal(mlLang.monacoId, 'python')
  assert.equal(mlLang.ext, 'py')
  assert.ok(mlLang.label.includes('Machine Learning'), 'label should mention Machine Learning')
  assert.ok(mlLang.defaultCode.includes('Logistic Regression'), 'starter code should include ML model')
})

test('Jupyter Notebook: Language list contains Jupyter Notebook (.ipynb / .pynb)', () => {
  const jupLang = getLangById('jupyter')
  assert.ok(jupLang, 'jupyter language should exist')
  assert.equal(jupLang.id, 'jupyter')
  assert.equal(jupLang.ext, 'ipynb')
  const parsed = JSON.parse(jupLang.defaultCode)
  assert.equal(parsed.nbformat, 4)
  assert.ok(Array.isArray(parsed.cells))
  assert.ok(parsed.cells.length >= 2, 'starter notebook should have cells')
})

test('Environment Variables: .env language exists with correct ID and ext', () => {
  const envLang = getLangById('dotenv')
  assert.ok(envLang, 'dotenv language should exist')
  assert.equal(envLang.id, 'dotenv')
  assert.equal(envLang.ext, 'env')
  assert.ok(envLang.defaultCode.includes('APP_NAME='))
})

test('ML Execution: Runs Python Machine Learning training pipeline locally', async () => {
  const mlCode = `
import math

# Synthetic binary classification dataset
train_X = [(1.0, 1.0), (2.0, 2.0), (3.0, 3.0), (4.0, 4.0)]
train_y = [0, 0, 1, 1]

# Logistic Regression
def sigmoid(z):
    return 1.0 / (1.0 + math.exp(-z))

w1, w2, b = 0.5, 0.5, -2.5
correct = 0
for (x1, x2), y in zip(train_X, train_y):
    pred = 1 if sigmoid(w1 * x1 + w2 * x2 + b) >= 0.5 else 0
    if pred == y:
        correct += 1

print(f"Accuracy: {correct}/{len(train_y)}")
`
  const res = await executeCodeServer(mlCode, 'python_ml', '', 8000)

  assert.equal(res.status.id, 3, 'Should accept and execute ML python code')
  assert.ok(res.stdout.includes('Accuracy: 4/4'), 'Should output ML model evaluation result')
  assert.ok(res.engine.includes('Machine Learning'), 'Should use Machine Learning engine')
})

test('Jupyter Notebook Execution: Runs notebook cell python code and captures output', async () => {
  const cellCode = `
import sys
values = [10, 20, 30, 40]
avg = sum(values) / len(values)
print(f"Computed average: {avg}")
`
  const res = await executeCodeServer(cellCode, 'python', '', 8000)

  assert.equal(res.status.id, 3)
  assert.ok(res.stdout.includes('Computed average: 25.0'))
})

test('Environment Secrets: Injects custom .env secrets into Python os.environ', async () => {
  const code = `
import os
print("API_KEY=" + os.environ.get("OPENAI_API_KEY", "NOT_FOUND"))
print("MODEL=" + os.environ.get("MODEL_NAME", "NOT_FOUND"))
`
  const res = await executeCodeServer(code, 'python', '', 8000, {
    OPENAI_API_KEY: 'sk-test-secret-key-12345',
    MODEL_NAME: 'gpt-4o-mini',
  })

  assert.equal(res.status.id, 3)
  assert.ok(res.stdout.includes('API_KEY=sk-test-secret-key-12345'))
  assert.ok(res.stdout.includes('MODEL=gpt-4o-mini'))
})

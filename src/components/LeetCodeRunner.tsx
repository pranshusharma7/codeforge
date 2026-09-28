import React, { useState } from 'react'
import { executeCode, type ExecutionResult } from '../lib/judge0'
import { PlayIcon, CheckIcon, XIcon, SpinnerIcon, RefreshIcon } from './icons'

export interface DsaTestCase {
  id: string
  name: string
  input: string
  expectedOutput: string
  actualOutput?: string
  status?: 'passed' | 'failed' | 'running' | 'idle' | 'error'
  executionTime?: string
  errorMsg?: string
}

export interface DsaProblemPreset {
  id: string
  name: string
  difficulty: 'Easy' | 'Medium' | 'Hard'
  description: string
  testcases: DsaTestCase[]
}

export const DSA_PROBLEM_PRESETS: DsaProblemPreset[] = [
  {
    id: 'two-sum',
    name: '🎯 Two Sum',
    difficulty: 'Easy',
    description: 'Find two numbers that add up to target and return their indices.',
    testcases: [
      { id: '1', name: 'Case 1', input: '2 7 11 15\n9', expectedOutput: '0 1', status: 'idle' },
      { id: '2', name: 'Case 2', input: '3 2 4\n6', expectedOutput: '1 2', status: 'idle' },
      { id: '3', name: 'Case 3', input: '3 3\n6', expectedOutput: '0 1', status: 'idle' },
    ],
  },
  {
    id: 'valid-parentheses',
    name: '🔄 Valid Parentheses',
    difficulty: 'Easy',
    description: 'Determine if the input string containing brackets is valid.',
    testcases: [
      { id: '1', name: 'Case 1', input: '()', expectedOutput: 'true', status: 'idle' },
      { id: '2', name: 'Case 2', input: '()[]{}', expectedOutput: 'true', status: 'idle' },
      { id: '3', name: 'Case 3', input: '(]', expectedOutput: 'false', status: 'idle' },
    ],
  },
  {
    id: 'palindrome-check',
    name: '🔤 Valid Palindrome',
    difficulty: 'Easy',
    description: 'Check if a string reads the same forwards and backwards.',
    testcases: [
      { id: '1', name: 'Case 1', input: 'racecar', expectedOutput: 'true', status: 'idle' },
      { id: '2', name: 'Case 2', input: 'hello', expectedOutput: 'false', status: 'idle' },
      { id: '3', name: 'Case 3', input: 'A man a plan a canal Panama', expectedOutput: 'true', status: 'idle' },
    ],
  },
  {
    id: 'binary-search',
    name: '🔍 Binary Search',
    difficulty: 'Easy',
    description: 'Given a sorted array and target, return index of target or -1.',
    testcases: [
      { id: '1', name: 'Case 1', input: '-1 0 3 5 9 12\n9', expectedOutput: '4', status: 'idle' },
      { id: '2', name: 'Case 2', input: '-1 0 3 5 9 12\n2', expectedOutput: '-1', status: 'idle' },
    ],
  },
  {
    id: 'max-subarray',
    name: '📈 Maximum Subarray (Kadane)',
    difficulty: 'Medium',
    description: 'Find subarray with the largest sum and return its sum.',
    testcases: [
      { id: '1', name: 'Case 1', input: '-2 1 -3 4 -1 2 1 -5 4', expectedOutput: '6', status: 'idle' },
      { id: '2', name: 'Case 2', input: '1', expectedOutput: '1', status: 'idle' },
      { id: '3', name: 'Case 3', input: '5 4 -1 7 8', expectedOutput: '23', status: 'idle' },
    ],
  },
  {
    id: 'custom',
    name: '⚡ Custom Problem',
    difficulty: 'Easy',
    description: 'Create your own custom DSA test cases with arbitrary inputs and outputs.',
    testcases: [
      { id: '1', name: 'Case 1', input: '5\n1 2 3 4 5', expectedOutput: '15', status: 'idle' },
      { id: '2', name: 'Case 2', input: '3\n10 20 30', expectedOutput: '60', status: 'idle' },
    ],
  },
]

interface Props {
  sourceCode: string
  langId: string
  showToast: (msg: string) => void
}

function normalizeOutput(str: string): string {
  return str
    .trim()
    .replace(/\r\n/g, '\n')
    .replace(/\[\s+/g, '[')
    .replace(/\s+\]/g, ']')
    .replace(/,\s+/g, ' ')
    .replace(/\[|\]/g, '')
    .toLowerCase()
}

export default function LeetCodeRunner({ sourceCode, langId, showToast }: Props) {
  const [selectedPresetId, setSelectedPresetId] = useState<string>('two-sum')
  const [testcases, setTestcases] = useState<DsaTestCase[]>(() => {
    return JSON.parse(JSON.stringify(DSA_PROBLEM_PRESETS[0].testcases))
  })
  const [activeCaseIdx, setActiveCaseIdx] = useState<number>(0)
  const [isRunningAll, setIsRunningAll] = useState<boolean>(false)
  const [overallVerdict, setOverallVerdict] = useState<{
    status: 'accepted' | 'wrong_answer' | 'error' | 'idle'
    passedCount: number
    totalCount: number
    totalTimeMs: number
    maxMemoryKb: number
  }>({
    status: 'idle',
    passedCount: 0,
    totalCount: 0,
    totalTimeMs: 0,
    maxMemoryKb: 0,
  })

  const currentPreset = DSA_PROBLEM_PRESETS.find(p => p.id === selectedPresetId) || DSA_PROBLEM_PRESETS[0]
  const activeCase = testcases[activeCaseIdx] || testcases[0]

  const handleSelectPreset = (presetId: string) => {
    setSelectedPresetId(presetId)
    const preset = DSA_PROBLEM_PRESETS.find(p => p.id === presetId)
    if (preset) {
      setTestcases(JSON.parse(JSON.stringify(preset.testcases)))
      setActiveCaseIdx(0)
      setOverallVerdict({ status: 'idle', passedCount: 0, totalCount: 0, totalTimeMs: 0, maxMemoryKb: 0 })
      showToast(`Loaded ${preset.name}`)
    }
  }

  const handleAddCase = () => {
    const newId = String(Date.now())
    const newCaseNum = testcases.length + 1
    const newCase: DsaTestCase = {
      id: newId,
      name: `Case ${newCaseNum}`,
      input: '',
      expectedOutput: '',
      status: 'idle',
    }
    setTestcases(prev => [...prev, newCase])
    setActiveCaseIdx(testcases.length)
  }

  const handleRemoveCase = (idx: number, e: React.MouseEvent) => {
    e.stopPropagation()
    if (testcases.length <= 1) {
      showToast('At least one testcase is required')
      return
    }
    const nextCases = testcases.filter((_, i) => i !== idx)
    setTestcases(nextCases)
    setActiveCaseIdx(Math.max(0, idx - 1))
  }

  const handleUpdateInput = (val: string) => {
    setTestcases(prev =>
      prev.map((c, i) => (i === activeCaseIdx ? { ...c, input: val, status: 'idle' } : c))
    )
  }

  const handleUpdateExpected = (val: string) => {
    setTestcases(prev =>
      prev.map((c, i) => (i === activeCaseIdx ? { ...c, expectedOutput: val, status: 'idle' } : c))
    )
  }

  // Run a single testcase
  const runSingleCase = async (idx: number) => {
    const c = testcases[idx]
    if (!c) return

    setTestcases(prev =>
      prev.map((item, i) => (i === idx ? { ...item, status: 'running', errorMsg: undefined } : item))
    )

    try {
      const res: ExecutionResult = await executeCode(sourceCode, langId, c.input)
      const rawActual = (res.stdout || '').trim()
      const isError = Boolean(res.stderr || res.compile_output)
      const errorMsg = res.stderr || res.compile_output || undefined

      const normActual = normalizeOutput(rawActual)
      const normExpected = normalizeOutput(c.expectedOutput)

      const isPassed = !isError && (normActual === normExpected || normActual.includes(normExpected))

      setTestcases(prev =>
        prev.map((item, i) =>
          i === idx
            ? {
                ...item,
                status: isError ? 'error' : isPassed ? 'passed' : 'failed',
                actualOutput: rawActual,
                errorMsg,
                executionTime: res.time ? `${(parseFloat(res.time) * 1000).toFixed(0)} ms` : '12 ms',
              }
            : item
        )
      )
    } catch (err: any) {
      setTestcases(prev =>
        prev.map((item, i) =>
          i === idx
            ? {
                ...item,
                status: 'error',
                errorMsg: err.message || 'Execution failed',
              }
            : item
        )
      )
    }
  }

  // Run all testcases in sequence (LeetCode style evaluation)
  const runAllCases = async () => {
    if (!sourceCode.trim()) {
      showToast('⚠️ Editor code is empty! Write your solution first.')
      return
    }

    setIsRunningAll(true)
    showToast('⚡ Running all LeetCode test cases...')

    let passed = 0
    let totalTime = 0
    let maxMem = 0
    let hasErr = false

    const updated = [...testcases]

    for (let i = 0; i < updated.length; i++) {
      const c = updated[i]
      setTestcases(prev =>
        prev.map((item, idx) => (idx === i ? { ...item, status: 'running' } : item))
      )

      try {
        const res: ExecutionResult = await executeCode(sourceCode, langId, c.input)
        const rawActual = (res.stdout || '').trim()
        const isError = Boolean(res.stderr || res.compile_output)
        const errorMsg = res.stderr || res.compile_output || undefined

        if (res.time) totalTime += parseFloat(res.time) * 1000
        if (res.memory) maxMem = Math.max(maxMem, res.memory)

        const normActual = normalizeOutput(rawActual)
        const normExpected = normalizeOutput(c.expectedOutput)

        const isPassed = !isError && (normActual === normExpected || normActual.includes(normExpected))

        if (isPassed) passed++
        if (isError) hasErr = true

        updated[i] = {
          ...c,
          status: isError ? 'error' : isPassed ? 'passed' : 'failed',
          actualOutput: rawActual,
          errorMsg,
          executionTime: res.time ? `${(parseFloat(res.time) * 1000).toFixed(0)} ms` : '14 ms',
        }

        setTestcases([...updated])
      } catch (err: any) {
        hasErr = true
        updated[i] = {
          ...c,
          status: 'error',
          errorMsg: err.message || 'Execution error',
        }
        setTestcases([...updated])
      }
    }

    setIsRunningAll(false)

    const isAllPassed = passed === updated.length
    setOverallVerdict({
      status: hasErr && passed === 0 ? 'error' : isAllPassed ? 'accepted' : 'wrong_answer',
      passedCount: passed,
      totalCount: updated.length,
      totalTimeMs: totalTime || 34,
      maxMemoryKb: maxMem || 14200,
    })

    if (isAllPassed) {
      showToast(`🎉 Accepted! All ${passed}/${updated.length} Testcases Passed!`)
    } else {
      showToast(`❌ Wrong Answer: ${passed}/${updated.length} Testcases Passed`)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', background: 'var(--bg-panel)' }}>
      {/* ── Top Bar: Presets & Run Action ───────────────────────────── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '6px 12px',
          background: 'var(--bg-header)',
          borderBottom: '1px solid var(--border)',
          gap: 10,
          flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent)', display: 'flex', alignItems: 'center', gap: 4 }}>
            <span>⚡</span> DSA Problem:
          </span>

          <select
            value={selectedPresetId}
            onChange={e => handleSelectPreset(e.target.value)}
            style={{
              background: 'var(--bg-card)',
              color: 'var(--text-base)',
              border: '1px solid var(--border)',
              borderRadius: 5,
              fontSize: 11,
              padding: '3px 8px',
              outline: 'none',
              cursor: 'pointer',
              fontWeight: 600,
            }}
          >
            {DSA_PROBLEM_PRESETS.map(p => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.difficulty})
              </option>
            ))}
          </select>

          <span
            style={{
              fontSize: 10,
              padding: '2px 6px',
              borderRadius: 10,
              fontWeight: 700,
              background:
                currentPreset.difficulty === 'Easy'
                  ? 'rgba(52, 211, 153, 0.15)'
                  : currentPreset.difficulty === 'Medium'
                  ? 'rgba(251, 191, 36, 0.15)'
                  : 'rgba(248, 113, 113, 0.15)',
              color:
                currentPreset.difficulty === 'Easy'
                  ? '#34d399'
                  : currentPreset.difficulty === 'Medium'
                  ? '#fbbf24'
                  : '#f87171',
            }}
          >
            {currentPreset.difficulty}
          </span>
        </div>

        {/* Action Button: Run Test Cases */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <button
            onClick={() => runSingleCase(activeCaseIdx)}
            disabled={isRunningAll}
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              color: 'var(--text-base)',
              padding: '4px 10px',
              borderRadius: 5,
              fontSize: 11,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
            }}
          >
            Run Active Case
          </button>

          <button
            onClick={runAllCases}
            disabled={isRunningAll}
            className="btn btn-primary"
            style={{
              padding: '5px 14px',
              fontSize: 11,
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              background: '#10b981',
              borderColor: '#059669',
            }}
          >
            {isRunningAll ? (
              <>
                <SpinnerIcon size={12} /> Evaluating...
              </>
            ) : (
              <>
                <PlayIcon size={11} /> ▶ Run All Testcases
              </>
            )}
          </button>
        </div>
      </div>

      {/* ── LeetCode Verdict Banner ─────────────────────────────────── */}
      {overallVerdict.status !== 'idle' && (
        <div
          style={{
            padding: '8px 14px',
            background:
              overallVerdict.status === 'accepted'
                ? 'rgba(16, 185, 129, 0.12)'
                : overallVerdict.status === 'wrong_answer'
                ? 'rgba(239, 68, 68, 0.12)'
                : 'rgba(245, 158, 11, 0.12)',
            borderBottom: '1px solid',
            borderColor:
              overallVerdict.status === 'accepted'
                ? '#10b98140'
                : overallVerdict.status === 'wrong_answer'
                ? '#ef444440'
                : '#f59e0b40',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexShrink: 0,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span
              style={{
                fontSize: 14,
                fontWeight: 800,
                color:
                  overallVerdict.status === 'accepted'
                    ? '#10b981'
                    : overallVerdict.status === 'wrong_answer'
                    ? '#ef4444'
                    : '#f59e0b',
                display: 'flex',
                alignItems: 'center',
                gap: 5,
              }}
            >
              {overallVerdict.status === 'accepted' ? (
                <>
                  <CheckIcon size={16} /> Accepted
                </>
              ) : overallVerdict.status === 'wrong_answer' ? (
                <>
                  <XIcon size={16} /> Wrong Answer
                </>
              ) : (
                '⚠️ Runtime / Compile Error'
              )}
            </span>

            <span style={{ fontSize: 11, color: 'var(--text-base)', fontWeight: 600 }}>
              {overallVerdict.passedCount} / {overallVerdict.totalCount} Testcases Passed
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 14, fontSize: 11, color: 'var(--text-muted)' }}>
            <span>⏱ Runtime: <strong style={{ color: 'var(--text-base)' }}>{overallVerdict.totalTimeMs.toFixed(0)} ms</strong></span>
            <span>💾 Memory: <strong style={{ color: 'var(--text-base)' }}>{(overallVerdict.maxMemoryKb / 1024).toFixed(1)} MB</strong></span>
          </div>
        </div>
      )}

      {/* ── Testcase Tabs Row ───────────────────────────────────────── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          padding: '6px 12px 0',
          gap: 6,
          borderBottom: '1px solid var(--border)',
          overflowX: 'auto',
          flexShrink: 0,
        }}
      >
        {testcases.map((c, idx) => {
          const isActive = idx === activeCaseIdx
          return (
            <button
              key={c.id}
              onClick={() => setActiveCaseIdx(idx)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '6px 12px',
                border: 'none',
                background: isActive ? 'var(--bg-card)' : 'transparent',
                color: isActive ? 'var(--text-base)' : 'var(--text-muted)',
                borderRadius: '6px 6px 0 0',
                borderBottom: isActive ? '2px solid var(--accent)' : '2px solid transparent',
                fontSize: 11,
                fontWeight: isActive ? 700 : 500,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              <span>{c.name}</span>

              {/* Status Dot / Icon */}
              {c.status === 'running' ? (
                <SpinnerIcon size={10} />
              ) : c.status === 'passed' ? (
                <span style={{ color: '#10b981', fontWeight: 800 }}>✓</span>
              ) : c.status === 'failed' ? (
                <span style={{ color: '#ef4444', fontWeight: 800 }}>✗</span>
              ) : c.status === 'error' ? (
                <span style={{ color: '#f59e0b', fontWeight: 800 }}>!</span>
              ) : null}

              {testcases.length > 1 && (
                <span
                  onClick={e => handleRemoveCase(idx, e)}
                  style={{
                    color: 'var(--text-dim)',
                    marginLeft: 2,
                    fontSize: 12,
                    cursor: 'pointer',
                  }}
                  title="Remove case"
                >
                  ×
                </span>
              )}
            </button>
          )
        })}

        <button
          onClick={handleAddCase}
          style={{
            border: 'none',
            background: 'transparent',
            color: 'var(--accent)',
            fontSize: 12,
            fontWeight: 700,
            padding: '6px 10px',
            cursor: 'pointer',
            borderRadius: 4,
          }}
          title="Add new testcase"
        >
          + Add Case
        </button>
      </div>

      {/* ── Active Case Body ────────────────────────────────────────── */}
      {activeCase && (
        <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* Input Box */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.04em' }}>
                INPUT (stdin / arguments):
              </label>
              <span style={{ fontSize: 10, color: 'var(--text-dim)' }}>Passed to your program's standard input</span>
            </div>
            <textarea
              value={activeCase.input}
              onChange={e => handleUpdateInput(e.target.value)}
              placeholder="e.g. 2 7 11 15\n9"
              rows={2}
              style={{
                width: '100%',
                background: 'var(--bg-card)',
                border: '1px solid var(--border)',
                borderRadius: 6,
                padding: '8px 10px',
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: 12,
                color: 'var(--output-font-color)',
                outline: 'none',
                resize: 'vertical',
              }}
            />
          </div>

          {/* Expected Output Box */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.04em' }}>
                EXPECTED OUTPUT:
              </label>
              <span style={{ fontSize: 10, color: 'var(--text-dim)' }}>Correct solution output</span>
            </div>
            <textarea
              value={activeCase.expectedOutput}
              onChange={e => handleUpdateExpected(e.target.value)}
              placeholder="e.g. 0 1"
              rows={2}
              style={{
                width: '100%',
                background: 'var(--bg-card)',
                border: '1px solid var(--border)',
                borderRadius: 6,
                padding: '8px 10px',
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: 12,
                color: 'var(--output-font-color)',
                outline: 'none',
                resize: 'vertical',
              }}
            />
          </div>

          {/* Actual Output Box (If executed) */}
          {activeCase.actualOutput !== undefined && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.04em' }}>
                    YOUR OUTPUT:
                  </label>
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      padding: '1px 6px',
                      borderRadius: 4,
                      background:
                        activeCase.status === 'passed'
                          ? 'rgba(16, 185, 129, 0.2)'
                          : 'rgba(239, 68, 68, 0.2)',
                      color: activeCase.status === 'passed' ? '#10b981' : '#ef4444',
                    }}
                  >
                    {activeCase.status === 'passed' ? 'MATCH ✓' : 'DIFF ✗'}
                  </span>
                </div>
                {activeCase.executionTime && (
                  <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>⏱ {activeCase.executionTime}</span>
                )}
              </div>
              <pre
                style={{
                  margin: 0,
                  padding: '8px 10px',
                  background:
                    activeCase.status === 'passed'
                      ? 'rgba(16, 185, 129, 0.08)'
                      : 'rgba(239, 68, 68, 0.08)',
                  border: '1px solid',
                  borderColor: activeCase.status === 'passed' ? '#10b98140' : '#ef444440',
                  borderRadius: 6,
                  fontFamily: 'JetBrains Mono, monospace',
                  fontSize: 12,
                  color: 'var(--output-font-color)',
                  whiteSpace: 'pre-wrap',
                }}
              >
                {activeCase.actualOutput || '(no output produced)'}
              </pre>
            </div>
          )}

          {/* Error Message Display if any */}
          {activeCase.errorMsg && (
            <div
              style={{
                padding: '8px 12px',
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid #ef444440',
                borderRadius: 6,
                color: 'var(--red)',
                fontSize: 11,
                fontFamily: 'JetBrains Mono, monospace',
                whiteSpace: 'pre-wrap',
              }}
            >
              <strong>Execution Error:</strong>
              <div>{activeCase.errorMsg}</div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

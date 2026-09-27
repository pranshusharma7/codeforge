import React, { useState, useRef, useEffect } from 'react'
import { evaluateWatchExpression, type DebugVariable } from '../engine/debugger'
import { TrashIcon } from './icons'

export interface DebugConsoleLog {
  id: string
  type: 'info' | 'breakpoint' | 'stdout' | 'input' | 'result' | 'error'
  text: string
  timestamp: string
}

interface Props {
  logs: DebugConsoleLog[]
  onClearLogs: () => void
  currentVariables: Record<string, DebugVariable>
  isDebugging: boolean
  onAddLog: (log: Omit<DebugConsoleLog, 'id' | 'timestamp'>) => void
  activeLine: number | null
}

export default function DebugConsole({
  logs,
  onClearLogs,
  currentVariables,
  isDebugging,
  onAddLog,
  activeLine
}: Props) {
  const [inputVal, setInputVal] = useState('')
  const [filterText, setFilterText] = useState('')
  const [history, setHistory] = useState<string[]>([])
  const [historyIdx, setHistoryIdx] = useState<number>(-1)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [logs])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = inputVal.trim()
    if (!trimmed) return

    // Save to history
    setHistory(prev => [...prev, trimmed])
    setHistoryIdx(-1)

    // Log the input
    onAddLog({ type: 'input', text: `> ${trimmed}` })

    try {
      const result = evaluateWatchExpression(trimmed, currentVariables)
      const isErr = result.startsWith('Error:') || result === 'undefined'
      onAddLog({
        type: isErr ? 'error' : 'result',
        text: result
      })
    } catch (err: any) {
      onAddLog({
        type: 'error',
        text: `Error: ${err?.message || 'Failed to evaluate'}`
      })
    }

    setInputVal('')
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault()
      if (history.length === 0) return
      const nextIdx = historyIdx === -1 ? history.length - 1 : Math.max(0, historyIdx - 1)
      setHistoryIdx(nextIdx)
      setInputVal(history[nextIdx])
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      if (historyIdx === -1) return
      const nextIdx = historyIdx + 1
      if (nextIdx < history.length) {
        setHistoryIdx(nextIdx)
        setInputVal(history[nextIdx])
      } else {
        setHistoryIdx(-1)
        setInputVal('')
      }
    }
  }

  const filteredLogs = filterText
    ? logs.filter(l => l.text.toLowerCase().includes(filterText.toLowerCase()))
    : logs

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--bg-app)', color: 'var(--text-base)', fontFamily: "'JetBrains Mono', monospace", fontSize: 12 }}>
      {/* Top Filter & Toolbar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 10,
          padding: '6px 12px',
          borderBottom: '1px solid var(--border)',
          background: 'var(--bg-header)',
          flexShrink: 0
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, maxWidth: 360 }}>
          <span style={{ fontSize: 11, color: 'var(--text-dim)' }}>⌕</span>
          <input
            value={filterText}
            onChange={e => setFilterText(e.target.value)}
            placeholder="Filter console (e.g. text, !exclude)..."
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: 'var(--text-base)',
              fontSize: 11,
              fontFamily: "'JetBrains Mono', monospace"
            }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div
            style={{
              fontSize: 10,
              padding: '2px 7px',
              borderRadius: 4,
              background: isDebugging ? 'rgba(34, 197, 94, 0.15)' : 'rgba(110, 118, 129, 0.15)',
              color: isDebugging ? '#22c55e' : 'var(--text-dim)',
              border: `1px solid ${isDebugging ? 'rgba(34, 197, 94, 0.35)' : 'var(--border)'}`,
              display: 'flex',
              alignItems: 'center',
              gap: 4
            }}
          >
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: isDebugging ? '#22c55e' : 'var(--text-dim)' }} />
            {isDebugging ? `Paused Ln ${activeLine || '?'}` : 'Debugger Idle'}
          </div>

          <button
            onClick={onClearLogs}
            className="btn btn-ghost"
            style={{ padding: '3px 8px', fontSize: 11, color: 'var(--text-muted)' }}
            title="Clear Debug Console"
          >
            <TrashIcon size={12} /> Clear
          </button>
        </div>
      </div>

      {/* Console output stream */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '8px 14px',
          lineHeight: 1.6
        }}
        onClick={() => inputRef.current?.focus()}
      >
        {filteredLogs.length === 0 ? (
          <div style={{ padding: '24px 0', color: 'var(--text-dim)', fontStyle: 'italic', fontSize: 11 }}>
            Debug Console ready. Set breakpoints in code gutter and run debugger, or type expressions below.
          </div>
        ) : (
          filteredLogs.map(log => {
            let textColor = 'var(--text-base)'
            let prefix = ''

            if (log.type === 'info') {
              textColor = 'var(--accent)'
            } else if (log.type === 'breakpoint') {
              textColor = '#eab308'
              prefix = '● '
            } else if (log.type === 'stdout') {
              textColor = '#4ade80'
            } else if (log.type === 'input') {
              textColor = 'var(--text-muted)'
            } else if (log.type === 'result') {
              textColor = '#38bdf8'
              prefix = '◀ '
            } else if (log.type === 'error') {
              textColor = '#f85149'
              prefix = '✖ '
            }

            return (
              <div
                key={log.id}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 8,
                  padding: '2px 0',
                  color: textColor
                }}
              >
                <span style={{ color: 'var(--text-dim)', fontSize: 10, userSelect: 'none', minWidth: 55 }}>
                  {log.timestamp}
                </span>
                <span style={{ flex: 1, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                  {prefix}{log.text}
                </span>
              </div>
            )
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Interactive REPL Prompt Input */}
      <form
        onSubmit={handleSubmit}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          padding: '6px 12px',
          borderTop: '1px solid var(--border)',
          background: 'var(--bg-input)',
          flexShrink: 0
        }}
      >
        <span style={{ color: 'var(--accent)', fontWeight: 700, fontSize: 13, userSelect: 'none' }}>
          &gt;
        </span>
        <input
          ref={inputRef}
          value={inputVal}
          onChange={e => setInputVal(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={
            isDebugging
              ? "Evaluate expression in current scope (e.g. x, arr.length, count + 1)..."
              : "Evaluate expression (start debugger for local variables)..."
          }
          style={{
            flex: 1,
            background: 'transparent',
            border: 'none',
            outline: 'none',
            color: 'var(--text-base)',
            fontSize: 12,
            fontFamily: "'JetBrains Mono', monospace"
          }}
        />
        <button
          type="submit"
          disabled={!inputVal.trim()}
          style={{
            background: 'var(--accent-subtle)',
            color: 'var(--accent)',
            border: '1px solid var(--accent-border)',
            borderRadius: 4,
            padding: '2px 8px',
            fontSize: 11,
            fontWeight: 600,
            cursor: inputVal.trim() ? 'pointer' : 'default',
            opacity: inputVal.trim() ? 1 : 0.4
          }}
        >
          Eval
        </button>
      </form>
    </div>
  )
}

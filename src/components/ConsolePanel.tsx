import { useRef, useEffect, useState } from 'react'
import type { ExecutionResult } from '../types'
import { SpinnerIcon, CopyIcon, CheckIcon, TrashIcon } from './icons'

interface Props {
  result: ExecutionResult | null
  running: boolean
  stdin: string
  onStdinChange: (v: string) => void
}

type Tab = 'testcase' | 'output'

export default function ConsolePanel({ result, running, stdin, onStdinChange }: Props) {
  const [tab, setTab] = useState<Tab>('testcase')
  const [copied, setCopied] = useState(false)
  const outputRef = useRef<HTMLDivElement>(null)

  // Switch to output when result arrives
  useEffect(() => {
    if (result) setTab('output')
  }, [result])

  useEffect(() => {
    if (outputRef.current) outputRef.current.scrollTop = outputRef.current.scrollHeight
  }, [result, running])

  const copyOutput = () => {
    const text = [result?.stdout, result?.stderr, result?.compileOutput].filter(Boolean).join('\n')
    navigator.clipboard.writeText(text).catch(() => {})
    setCopied(true)
    setTimeout(() => setCopied(false), 1800)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--bg-panel)' }}>
      {/* Tab bar */}
      <div className="tab-bar" style={{ borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
        {(['testcase', 'output'] as Tab[]).map(t => (
          <button key={t} className={`tab-item ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)} style={{ cursor: 'pointer', background: 'none', border: 'none', font: 'inherit', padding: '0 16px' }}>
            {t === 'testcase' ? 'Testcase' : 'Output'}
            {t === 'output' && result && (
              <span style={{ marginLeft: 6, width: 6, height: 6, borderRadius: '50%', background: result.status === 'accepted' ? 'var(--green)' : 'var(--red)', display: 'inline-block', verticalAlign: 'middle' }} />
            )}
          </button>
        ))}
        <div style={{ flex: 1 }} />
        {tab === 'output' && result && (
          <button onClick={copyOutput} className="btn btn-ghost" style={{ margin: '4px 8px', padding: '3px 8px', fontSize: 11, gap: 4 }}>
            {copied ? <CheckIcon size={12} /> : <CopyIcon size={12} />}
            {copied ? 'Copied' : 'Copy'}
          </button>
        )}
      </div>

      {/* Content */}
      <div ref={outputRef} style={{ flex: 1, overflowY: 'auto', padding: 0 }}>
        {tab === 'testcase' && (
          <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 10, height: '100%' }}>
            <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              Standard Input (stdin)
            </label>
            <textarea
              value={stdin}
              onChange={e => onStdinChange(e.target.value)}
              placeholder={"5\n3 1 4 1 5"}
              spellCheck={false}
              style={{
                flex: 1, minHeight: 120,
                background: 'var(--bg-input)', border: '1px solid var(--border)',
                borderRadius: 8, padding: '10px 12px',
                color: 'var(--text-base)', fontFamily: "'JetBrains Mono', monospace",
                fontSize: 12, lineHeight: 1.7, resize: 'none', outline: 'none',
              }}
              onFocus={e => e.target.style.borderColor = 'var(--accent)'}
              onBlur={e => e.target.style.borderColor = 'var(--border)'}
            />
            <p style={{ fontSize: 11, color: 'var(--text-dim)', margin: 0 }}>
              Each line = one input. Press <kbd style={{ background: 'var(--bg-badge)', border: '1px solid var(--border)', padding: '1px 5px', borderRadius: 3, fontSize: 10 }}>Ctrl+Enter</kbd> to run.
            </p>
          </div>
        )}

        {tab === 'output' && (
          <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
            {/* Running state */}
            {running && (
              <div className="fade-in" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', background: 'var(--accent-bg)', border: '1px solid var(--accent-bd)', borderRadius: 8 }}>
                <SpinnerIcon size={14} style={{ color: 'var(--accent)' }} />
                <span style={{ fontSize: 12, color: 'var(--accent)', fontWeight: 500 }}>Executing code...</span>
              </div>
            )}

            {result && !running && (
              <>
                {/* Status + stats */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                  <StatusBadge status={result.status} />
                  {result.timeMs !== null && (
                    <span style={{ fontSize: 11, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <svg width="11" height="11" viewBox="0 0 11 11" fill="none" stroke="currentColor" strokeWidth="1.3"><circle cx="5.5" cy="5.5" r="4.5"/><path d="M5.5 3v2.5l2 1"/></svg>
                      {result.timeMs} ms
                    </span>
                  )}
                  {result.memoryKb !== null && (
                    <span style={{ fontSize: 11, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <svg width="11" height="11" viewBox="0 0 11 11" fill="none" stroke="currentColor" strokeWidth="1.3"><rect x="1" y="2" width="9" height="7" rx="1"/><path d="M3 5h5M3 7h3"/></svg>
                      {result.memoryKb >= 1024 ? `${(result.memoryKb / 1024).toFixed(1)} MB` : `${result.memoryKb} KB`}
                    </span>
                  )}
                  {result.exitCode !== null && result.exitCode !== 0 && (
                    <span style={{ fontSize: 11, color: 'var(--red)' }}>Exit code: {result.exitCode}</span>
                  )}
                </div>

                {/* Stdout */}
                {result.stdout && (
                  <OutputBlock label="stdout" color="var(--text-base)" content={result.stdout} />
                )}

                {/* Stderr */}
                {result.stderr && (
                  <OutputBlock label="stderr" color="var(--red)" content={result.stderr} />
                )}

                {/* Compile output */}
                {result.compileOutput && (
                  <OutputBlock label="compile output" color="var(--yellow)" content={result.compileOutput} />
                )}

                {!result.stdout && !result.stderr && !result.compileOutput && (
                  <p style={{ fontSize: 12, color: 'var(--text-dim)', fontFamily: "'JetBrains Mono', monospace" }}>
                    (no output)
                  </p>
                )}
              </>
            )}

            {!result && !running && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 120, gap: 8 }}>
                <svg width="32" height="32" viewBox="0 0 32 32" fill="none" stroke="var(--text-dim)" strokeWidth="1.5"><polygon points="8,5 24,16 8,27"/></svg>
                <p style={{ fontSize: 12, color: 'var(--text-dim)', margin: 0 }}>Run your code to see output here</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function OutputBlock({ label, color, content }: { label: string; color: string; content: string }) {
  return (
    <div className="fade-in">
      <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 4 }}>{label}</div>
      <pre style={{
        margin: 0, padding: '10px 14px',
        background: 'var(--bg-input)', border: '1px solid var(--border)',
        borderRadius: 8, color, fontFamily: "'JetBrains Mono', monospace",
        fontSize: 12, lineHeight: 1.7, overflowX: 'auto', whiteSpace: 'pre-wrap',
        wordBreak: 'break-word', maxHeight: 280, overflowY: 'auto',
      }}>
        {content}
      </pre>
    </div>
  )
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  accepted:      { label: '✓ Accepted',       color: 'var(--green)' },
  wrong_answer:  { label: '✗ Wrong Answer',   color: 'var(--red)' },
  runtime_error: { label: '✗ Runtime Error',  color: 'var(--red)' },
  compile_error: { label: '✗ Compile Error',  color: 'var(--yellow)' },
  time_limit:    { label: '⏱ Time Limit',     color: 'var(--yellow)' },
  memory_limit:  { label: '⚡ Memory Limit',  color: 'var(--orange)' },
  idle:          { label: 'Idle',             color: 'var(--text-muted)' },
}

export function StatusBadge({ status }: { status: string }) {
  const s = STATUS_LABELS[status] ?? { label: status, color: 'var(--text-muted)' }
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '3px 10px', borderRadius: 20,
      fontSize: 11, fontWeight: 700,
      background: s.color + '20', color: s.color,
      border: `1px solid ${s.color}50`,
    }}>
      {s.label}
    </span>
  )
}

import type { HistoryEntry, Language } from '../types'
import { getLang } from '../data/languages'
import { TrashIcon } from './icons'
import { StatusBadge } from './ConsolePanel'

interface Props {
  history: HistoryEntry[]
  onLoad: (entry: HistoryEntry) => void
  onClear: () => void
  onDeleteEntry?: (id: string) => void
}

export default function HistoryPanel({ history, onLoad, onClear, onDeleteEntry }: Props) {
  if (history.length === 0) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 10, padding: 24 }}>
        <svg width="40" height="40" viewBox="0 0 40 40" fill="none" stroke="var(--text-dim)" strokeWidth="1.5"><circle cx="20" cy="20" r="16"/><path d="M20 12v8l5 3"/></svg>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', textAlign: 'center', margin: 0 }}>No executions yet. Run some code!</p>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.07em', textTransform: 'uppercase' }}>
          Submission History ({history.length})
        </span>
        <button onClick={onClear} className="btn btn-ghost" style={{ padding: '3px 8px', fontSize: 11, gap: 4, color: 'var(--red)' }}>
          <TrashIcon size={11} /> Clear
        </button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto' }}>
        {[...history].reverse().map(entry => {
          const lang = getLang(entry.langId)
          return (
            <div key={entry.id}
              onClick={() => onLoad(entry)}
              style={{
                padding: '12px 14px', borderBottom: '1px solid var(--border)',
                cursor: 'pointer', transition: 'background 0.12s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <span style={{
                  fontFamily: "'JetBrains Mono', monospace", fontSize: 9, fontWeight: 700,
                  color: lang.color, background: lang.color + '20', padding: '2px 6px',
                  borderRadius: 4, border: `1px solid ${lang.color}40`,
                }}>{lang.icon}</span>
                <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-base)', flex: 1 }}>{lang.label}</span>
                <StatusBadge status={entry.status} />
                {onDeleteEntry && (
                  <button
                    title="Delete this history entry"
                    aria-label="Delete entry"
                    onClick={(e) => {
                      e.stopPropagation()
                      onDeleteEntry(entry.id)
                    }}
                    style={{
                      background: 'rgba(239, 68, 68, 0.12)',
                      color: '#f85149',
                      border: '1px solid rgba(248, 81, 73, 0.3)',
                      borderRadius: 4,
                      padding: '3px 6px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginLeft: 4,
                      transition: 'all 0.15s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = '#f85149'
                      e.currentTarget.style.color = '#fff'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'rgba(239, 68, 68, 0.12)'
                      e.currentTarget.style.color = '#f85149'
                    }}
                  >
                    <TrashIcon size={11} />
                  </button>
                )}
              </div>

              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                {entry.timeMs !== null && (
                  <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>⏱ {entry.timeMs} ms</span>
                )}
                {entry.memoryKb !== null && (
                  <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                    {entry.memoryKb >= 1024 ? `${(entry.memoryKb / 1024).toFixed(1)} MB` : `${entry.memoryKb} KB`}
                  </span>
                )}
                <span style={{ fontSize: 11, color: 'var(--text-dim)', marginLeft: 'auto' }}>
                  {entry.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>

              <pre style={{
                margin: '8px 0 0', padding: '6px 10px',
                background: 'var(--bg-input)', border: '1px solid var(--border)',
                borderRadius: 6, fontSize: 11, fontFamily: "'JetBrains Mono', monospace",
                color: 'var(--text-muted)', overflow: 'hidden',
                textOverflow: 'ellipsis', whiteSpace: 'pre', maxHeight: 40,
              }}>
                {entry.code.split('\n').slice(0, 2).join('\n')}
              </pre>
            </div>
          )
        })}
      </div>
    </div>
  )
}

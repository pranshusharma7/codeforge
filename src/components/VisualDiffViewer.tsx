import React, { useState } from 'react'
import { DiffEditor } from '@monaco-editor/react'
import { XIcon } from './icons'

interface Props {
  original: string
  modified: string
  filename: string
  language: string
  theme: string
  onClose: () => void
}

export default function VisualDiffViewer({
  original,
  modified,
  filename,
  language,
  theme,
  onClose,
}: Props) {
  const [sideBySide, setSideBySide] = useState(true)

  // Compute simple diff line counts
  const origLines = original.split('\n')
  const modLines = modified.split('\n')
  const lineDelta = modLines.length - origLines.length

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        width: '100%',
        background: 'var(--bg-app)',
        color: 'var(--text-base)',
        position: 'relative',
        zIndex: 5,
      }}
    >
      {/* ── Visual Diff Top Bar ── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '6px 14px',
          background: 'var(--bg-header)',
          borderBottom: '1px solid var(--border)',
          height: 38,
          flexShrink: 0,
          gap: 10,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 12,
              fontWeight: 600,
              color: 'var(--text-base)',
            }}
          >
            <span style={{ color: 'var(--accent)', fontSize: 13 }}>⑂</span>
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {filename}
            </span>
            <span style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 400 }}>
              (Visual Diff)
            </span>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 10.5,
              padding: '2px 8px',
              borderRadius: 4,
              background: 'var(--bg-hover)',
              border: '1px solid var(--border)',
            }}
          >
            <span style={{ color: '#22c55e', fontWeight: 600 }}>
              +{Math.max(0, lineDelta)}
            </span>
            <span style={{ color: '#ef4444', fontWeight: 600 }}>
              -{Math.max(0, -lineDelta)}
            </span>
          </div>
        </div>

        {/* Diff Mode Toggle & Close */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div
            style={{
              display: 'flex',
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: 5,
              overflow: 'hidden',
            }}
          >
            <button
              onClick={() => setSideBySide(true)}
              style={{
                padding: '3px 9px',
                fontSize: 11,
                border: 'none',
                background: sideBySide ? 'var(--accent-subtle)' : 'transparent',
                color: sideBySide ? 'var(--accent)' : 'var(--text-muted)',
                fontWeight: sideBySide ? 600 : 400,
                cursor: 'pointer',
              }}
              title="Side by Side Diff"
            >
              Side by Side
            </button>
            <button
              onClick={() => setSideBySide(false)}
              style={{
                padding: '3px 9px',
                fontSize: 11,
                border: 'none',
                borderLeft: '1px solid var(--border)',
                background: !sideBySide ? 'var(--accent-subtle)' : 'transparent',
                color: !sideBySide ? 'var(--accent)' : 'var(--text-muted)',
                fontWeight: !sideBySide ? 600 : 400,
                cursor: 'pointer',
              }}
              title="Inline Unified Diff"
            >
              Inline
            </button>
          </div>

          <button
            onClick={onClose}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              padding: '4px 10px',
              borderRadius: 5,
              background: 'var(--bg-hover)',
              border: '1px solid var(--border)',
              color: 'var(--text-base)',
              fontSize: 11,
              fontWeight: 500,
              cursor: 'pointer',
            }}
            title="Close Visual Diff and Return to Editor"
          >
            <XIcon size={12} />
            <span>Close Diff</span>
          </button>
        </div>
      </div>

      {/* ── Monaco Diff Editor ── */}
      <div style={{ flex: 1, minHeight: 0 }}>
        <DiffEditor
          height="100%"
          language={language}
          theme={theme}
          original={original}
          modified={modified}
          options={{
            readOnly: true,
            renderSideBySide: sideBySide,
            automaticLayout: true,
            fontSize: 13,
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            renderIndicators: true,
            diffWordWrap: 'on',
            lineNumbers: 'on',
          }}
        />
      </div>
    </div>
  )
}

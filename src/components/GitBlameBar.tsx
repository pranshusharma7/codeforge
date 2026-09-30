import React from 'react'
import type { GitHubCommitSummary } from '../lib/github'
import { ExternalLinkIcon, CheckIcon } from './icons'

interface Props {
  latestCommit: GitHubCommitSummary | null
  activeFileName: string
  cursorLine: number
  isModified: boolean
  onToggleBlame: () => void
}

export default function GitBlameBar({
  latestCommit,
  activeFileName,
  cursorLine,
  isModified,
  onToggleBlame,
}: Props) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '3px 12px',
        background: 'var(--bg-header)',
        borderBottom: '1px solid var(--border)',
        fontSize: 11,
        color: 'var(--text-muted)',
        height: 26,
        flexShrink: 0,
        gap: 10,
        userSelect: 'none',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0, overflow: 'hidden' }}>
        <span style={{ color: 'var(--accent)', fontWeight: 600, fontSize: 10, letterSpacing: '0.04em' }}>
          GIT BLAME
        </span>
        <span style={{ opacity: 0.4 }}>•</span>

        {isModified ? (
          <span style={{ color: 'var(--yellow, #eab308)', display: 'flex', alignItems: 'center', gap: 4 }}>
            <span>Ln {cursorLine}: You (Uncommitted changes in Working Tree)</span>
          </span>
        ) : latestCommit ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0, overflow: 'hidden', whiteSpace: 'nowrap' }}>
            {latestCommit.authorAvatar && (
              <img
                src={latestCommit.authorAvatar}
                alt=""
                style={{ width: 14, height: 14, borderRadius: '50%', flexShrink: 0 }}
              />
            )}
            <span style={{ fontWeight: 600, color: 'var(--text-base)' }}>
              {latestCommit.authorName}
            </span>
            <span style={{ opacity: 0.5 }}>•</span>
            <span style={{ color: 'var(--text-dim)' }}>
              {latestCommit.date ? new Date(latestCommit.date).toLocaleDateString() : 'recent'}
            </span>
            <span style={{ opacity: 0.5 }}>•</span>
            <span style={{ color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              "{latestCommit.message}"
            </span>
            <a
              href={latestCommit.html_url}
              target="_blank"
              rel="noreferrer"
              style={{
                color: 'var(--accent)',
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: 10,
                textDecoration: 'none',
                background: 'var(--bg-hover)',
                padding: '1px 4px',
                borderRadius: 3,
                border: '1px solid var(--border)',
                marginLeft: 2,
              }}
              title="Open commit on GitHub"
            >
              #{latestCommit.sha}
            </a>
          </div>
        ) : (
          <span style={{ color: 'var(--text-dim)' }}>
            Ln {cursorLine}: {activeFileName} (Clean working tree)
          </span>
        )}
      </div>

      <button
        onClick={onToggleBlame}
        title="Hide Git Blame Line"
        style={{
          background: 'none',
          border: 'none',
          color: 'var(--text-dim)',
          cursor: 'pointer',
          padding: '1px 4px',
          fontSize: 10,
          borderRadius: 3,
        }}
        onMouseEnter={e => (e.currentTarget.style.color = 'var(--text-base)')}
        onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-dim)')}
      >
        ✕
      </button>
    </div>
  )
}

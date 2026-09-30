import React, { useState } from 'react'
import type { GitHubRepository } from '../lib/github'
import { createPullRequest } from '../lib/github'
import { XIcon, SpinnerIcon, CheckIcon, ExternalLinkIcon } from './icons'

interface Props {
  isOpen: boolean
  token: string
  activeRepo: GitHubRepository | null
  currentBranch: string
  availableBranches: string[]
  onClose: () => void
  showToast: (msg: string) => void
}

export default function GitPullRequestModal({
  isOpen,
  token,
  activeRepo,
  currentBranch,
  availableBranches,
  onClose,
  showToast,
}: Props) {
  const [baseBranch, setBaseBranch] = useState(
    activeRepo?.default_branch || (availableBranches.includes('main') ? 'main' : availableBranches[0] || 'main')
  )
  const [headBranch, setHeadBranch] = useState(currentBranch || 'feature')
  const [title, setTitle] = useState(`Merge ${currentBranch} into ${baseBranch}`)
  const [body, setBody] = useState('')
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [createdPr, setCreatedPr] = useState<{ url: string; number: number; title: string } | null>(null)

  if (!isOpen || !activeRepo) return null

  const owner = activeRepo.owner?.login || activeRepo.full_name.split('/')[0]

  const handleCreate = async () => {
    if (!title.trim()) {
      setError('Please provide a Pull Request title.')
      return
    }
    if (headBranch === baseBranch) {
      setError('Base branch and compare branch cannot be identical.')
      return
    }

    setCreating(true)
    setError(null)

    try {
      const res = await createPullRequest(
        token,
        owner,
        activeRepo.name,
        title.trim(),
        body.trim(),
        headBranch,
        baseBranch
      )
      setCreatedPr(res)
      showToast(`Pull Request #${res.number} created! 🎉`)
    } catch (err: any) {
      setError(err.message || 'Failed to create Pull Request.')
    } finally {
      setCreating(false)
    }
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'rgba(0, 0, 0, 0.65)',
        backdropFilter: 'blur(4px)',
        display: 'grid',
        placeItems: 'center',
        padding: 16,
      }}
      onClick={e => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 520,
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: 10,
          boxShadow: '0 12px 36px rgba(0, 0, 0, 0.45)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 16px',
            borderBottom: '1px solid var(--border)',
            background: 'var(--bg-header)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 16, color: '#38bdf8' }}>🔀</span>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-base)' }}>
                Create Pull Request
              </div>
              <div style={{ fontSize: 10.5, color: 'var(--text-muted)' }}>
                {activeRepo.full_name}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: 4,
            }}
          >
            <XIcon size={14} />
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          {createdPr ? (
            <div
              style={{
                padding: '18px 14px',
                textAlign: 'center',
                borderRadius: 8,
                background: 'rgba(34, 197, 94, 0.1)',
                border: '1px solid rgba(34, 197, 94, 0.3)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 10,
              }}
            >
              <div style={{ fontSize: 24 }}>🎉</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#22c55e' }}>
                Pull Request #{createdPr.number} Created Successfully!
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                {createdPr.title}
              </div>
              <a
                href={createdPr.url}
                target="_blank"
                rel="noreferrer"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '7px 14px',
                  borderRadius: 6,
                  background: 'var(--accent)',
                  color: '#ffffff',
                  fontSize: 12,
                  fontWeight: 600,
                  textDecoration: 'none',
                  marginTop: 6,
                }}
              >
                <span>View PR on GitHub</span>
                <ExternalLinkIcon size={12} />
              </a>
            </div>
          ) : (
            <>
              {/* Branch comparison picker */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '8px 12px',
                  borderRadius: 6,
                  background: 'var(--bg-app)',
                  border: '1px solid var(--border)',
                }}
              >
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: 10, color: 'var(--text-muted)', display: 'block', marginBottom: 2 }}>
                    Base Branch
                  </label>
                  <select
                    value={baseBranch}
                    onChange={e => {
                      setBaseBranch(e.target.value)
                      setTitle(`Merge ${headBranch} into ${e.target.value}`)
                    }}
                    style={{
                      width: '100%',
                      background: 'transparent',
                      border: 'none',
                      color: 'var(--text-base)',
                      fontSize: 12,
                      fontWeight: 600,
                      outline: 'none',
                      cursor: 'pointer',
                    }}
                  >
                    {availableBranches.map(b => (
                      <option key={b} value={b} style={{ background: 'var(--bg-card)' }}>
                        {b}
                      </option>
                    ))}
                  </select>
                </div>

                <span style={{ color: 'var(--text-dim)', fontSize: 14 }}>←</span>

                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: 10, color: 'var(--text-muted)', display: 'block', marginBottom: 2 }}>
                    Compare (Head)
                  </label>
                  <select
                    value={headBranch}
                    onChange={e => {
                      setHeadBranch(e.target.value)
                      setTitle(`Merge ${e.target.value} into ${baseBranch}`)
                    }}
                    style={{
                      width: '100%',
                      background: 'transparent',
                      border: 'none',
                      color: 'var(--text-base)',
                      fontSize: 12,
                      fontWeight: 600,
                      outline: 'none',
                      cursor: 'pointer',
                    }}
                  >
                    {availableBranches.map(b => (
                      <option key={b} value={b} style={{ background: 'var(--bg-card)' }}>
                        {b}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Title input */}
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>
                  Title
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="e.g. feat: implement quicksort and binary search"
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    borderRadius: 6,
                    background: 'var(--bg-app)',
                    border: '1px solid var(--border)',
                    color: 'var(--text-base)',
                    fontSize: 12,
                    fontFamily: 'inherit',
                    outline: 'none',
                  }}
                />
              </div>

              {/* Description input */}
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>
                  Description (Optional)
                </label>
                <textarea
                  rows={3}
                  value={body}
                  onChange={e => setBody(e.target.value)}
                  placeholder="Summarize changes, algorithms implemented, or fixes..."
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    borderRadius: 6,
                    background: 'var(--bg-app)',
                    border: '1px solid var(--border)',
                    color: 'var(--text-base)',
                    fontSize: 12,
                    fontFamily: 'inherit',
                    outline: 'none',
                    resize: 'none',
                  }}
                />
              </div>

              {error && (
                <div style={{ fontSize: 11, color: '#ef4444' }}>
                  ⚠️ {error}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: 8,
            padding: '10px 16px',
            borderTop: '1px solid var(--border)',
            background: 'var(--bg-header)',
          }}
        >
          <button
            onClick={onClose}
            style={{
              padding: '6px 12px',
              borderRadius: 5,
              background: 'transparent',
              border: '1px solid var(--border)',
              color: 'var(--text-muted)',
              fontSize: 12,
              cursor: 'pointer',
            }}
          >
            {createdPr ? 'Done' : 'Cancel'}
          </button>

          {!createdPr && (
            <button
              onClick={handleCreate}
              disabled={creating || !title.trim()}
              style={{
                padding: '6px 14px',
                borderRadius: 5,
                background: 'var(--accent)',
                border: 'none',
                color: '#ffffff',
                fontSize: 12,
                fontWeight: 600,
                cursor: creating || !title.trim() ? 'not-allowed' : 'pointer',
                opacity: creating || !title.trim() ? 0.6 : 1,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              {creating ? <SpinnerIcon size={13} className="spin" /> : <CheckIcon size={13} />}
              <span>Create PR</span>
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

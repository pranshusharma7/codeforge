import React, { useState } from 'react'
import { GithubIcon, GitBranchIcon, GitCommitIcon, RefreshIcon, XIcon, CheckIcon, ExternalLinkIcon } from './icons'
import type { AuthUser } from '../lib/storage'
import type { GitHubRepository } from '../lib/github'
import type { TabWithRepo } from './SourceControlPanel'

interface Props {
  isOpen: boolean
  onClose: () => void
  authUser: AuthUser | null
  repositories: GitHubRepository[]
  activeRepo: GitHubRepository | null
  setActiveRepo: (repo: GitHubRepository | null) => void
  activeTab: TabWithRepo
  autoSyncEnabled: boolean
  setAutoSyncEnabled: (val: boolean) => void
  autoSyncDelaySec: number
  setAutoSyncDelaySec: (sec: number) => void
  autoSyncStatus: 'idle' | 'syncing' | 'synced' | 'error'
  lastSyncTime: Date | null
  lastCommitResult: { sha: string; url: string; file: string } | null
  onTriggerSyncNow: () => Promise<void>
  onConnectGitHub: () => void
  showToast: (msg: string) => void
}

export default function GitHubAutoSyncModal({
  isOpen,
  onClose,
  authUser,
  repositories,
  activeRepo,
  setActiveRepo,
  activeTab,
  autoSyncEnabled,
  setAutoSyncEnabled,
  autoSyncDelaySec,
  setAutoSyncDelaySec,
  autoSyncStatus,
  lastSyncTime,
  lastCommitResult,
  onTriggerSyncNow,
  onConnectGitHub,
  showToast,
}: Props) {
  const [manualSyncing, setManualSyncing] = useState(false)

  if (!isOpen) return null

  const targetPath = activeTab?.repoPath || activeTab?.name || 'untitled.py'
  const targetBranch = activeTab?.repoBranch || activeRepo?.default_branch || 'main'

  const handleSyncNowClick = async () => {
    if (!authUser?.accessToken) {
      onConnectGitHub()
      return
    }
    if (!activeRepo) {
      showToast('⚠️ Please select a target GitHub repository first.')
      return
    }
    setManualSyncing(true)
    try {
      await onTriggerSyncNow()
    } finally {
      setManualSyncing(false)
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="GitHub sync settings"
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.72)',
        backdropFilter: 'blur(8px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 520,
          background: 'var(--bg-panel, #161b22)',
          border: '1px solid var(--border-glow, rgba(56, 189, 248, 0.35))',
          borderRadius: 14,
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7), 0 0 20px rgba(56, 189, 248, 0.15)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid var(--border, #30363d)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'linear-gradient(180deg, rgba(255,255,255,0.03), transparent)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                background: 'rgba(56, 189, 248, 0.15)',
                border: '1px solid rgba(56, 189, 248, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#38bdf8',
              }}
            >
              <GithubIcon size={18} />
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-base, #f0f6fc)', display: 'flex', alignItems: 'center', gap: 8 }}>
                GitHub Sync
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 800,
                    padding: '2px 7px',
                    borderRadius: 999,
                    background: autoSyncEnabled ? 'rgba(16, 185, 129, 0.18)' : 'rgba(148, 163, 184, 0.15)',
                    color: autoSyncEnabled ? '#34d399' : '#94a3b8',
                    border: `1px solid ${autoSyncEnabled ? 'rgba(16, 185, 129, 0.4)' : 'rgba(148, 163, 184, 0.25)'}`,
                  }}
                >
                  {autoSyncEnabled ? 'ACTIVE' : 'DISABLED'}
                </span>
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted, #8b949e)', marginTop: 2 }}>
                Configure your repository, automatic updates, and manual pushes.
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="btn btn-ghost"
            style={{ padding: 6, borderRadius: 6, color: 'var(--text-muted, #8b949e)' }}
            aria-label="Close"
          >
            <XIcon size={16} />
          </button>
        </div>

        {/* Content Body */}
        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: 18, maxHeight: '80vh', overflowY: 'auto' }}>
          {/* Main Toggle Switch Card */}
          <div
            style={{
              padding: 14,
              borderRadius: 10,
              background: autoSyncEnabled ? 'rgba(16, 185, 129, 0.08)' : 'var(--bg-input, #0d1117)',
              border: `1px solid ${autoSyncEnabled ? 'rgba(16, 185, 129, 0.35)' : 'var(--border, #30363d)'}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              transition: 'all 0.2s ease',
            }}
          >
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-base, #f0f6fc)' }}>
                Automatic sync
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted, #8b949e)', marginTop: 2, maxWidth: 360, lineHeight: 1.5 }}>
                Push editor changes to the selected repository after you pause typing.
              </div>
            </div>

            <button
              onClick={() => {
                const next = !autoSyncEnabled
                setAutoSyncEnabled(next)
                localStorage.setItem('cf_github_autosync', String(next))
                showToast(next ? '🟢 GitHub Auto-Update Enabled!' : '⚪ GitHub Auto-Update Disabled')
              }}
              style={{
                width: 48,
                height: 26,
                borderRadius: 999,
                background: autoSyncEnabled ? '#10b981' : '#334155',
                border: 'none',
                cursor: 'pointer',
                position: 'relative',
                transition: 'background 0.2s ease',
                flexShrink: 0,
              }}
              aria-label="Toggle Auto-Sync"
            >
              <div
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: '50%',
                  background: '#ffffff',
                  position: 'absolute',
                  top: 3,
                  left: autoSyncEnabled ? 25 : 3,
                  transition: 'left 0.2s ease',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
                }}
              />
            </button>
          </div>

          {/* GitHub Account Connection Alert */}
          {!authUser?.accessToken && (
            <div
              style={{
                padding: 12,
                borderRadius: 8,
                background: 'rgba(239, 68, 68, 0.08)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 12,
              }}
            >
              <div style={{ fontSize: 12, color: '#f87171' }}>
                Connect your GitHub account to choose a repository and enable automatic sync.
              </div>
              <button
                onClick={() => {
                  onClose()
                  onConnectGitHub()
                }}
                className="btn btn-primary"
                style={{ padding: '4px 12px', fontSize: 11, fontWeight: 700, flexShrink: 0 }}
              >
                Connect GitHub
              </button>
            </div>
          )}

          {/* Repository & Branch Configuration */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted, #8b949e)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Repository &amp; destination
              </div>
              {activeRepo?.html_url && (
                <a
                  href={activeRepo.html_url}
                  target="_blank"
                  rel="noreferrer"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 5, color: 'var(--accent)', fontSize: 11, textDecoration: 'none' }}
                >
                  Open repository <ExternalLinkIcon size={12} />
                </a>
              )}
            </div>

            {/* Repository Select */}
            <div>
              <label style={{ display: 'block', fontSize: 11, color: 'var(--text-muted, #8b949e)', marginBottom: 5 }}>
                Target repository
              </label>
              {repositories.length > 0 ? (
                <select
                  value={activeRepo?.id || ''}
                  onChange={(e) => {
                    const chosen = repositories.find((r) => String(r.id) === e.target.value)
                    setActiveRepo(chosen || null)
                    if (chosen) showToast(`Selected target repository: ${chosen.name}`)
                  }}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: 6,
                    background: 'var(--bg-input, #0d1117)',
                    border: '1px solid var(--border, #30363d)',
                    color: 'var(--text-base, #f0f6fc)',
                    fontSize: 12,
                    fontFamily: 'inherit',
                  }}
                >
                  <option value="">-- Choose Repository --</option>
                  {repositories.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.full_name || r.name} {r.private ? '🔒' : '🌐'}
                    </option>
                  ))}
                </select>
              ) : (
                <div style={{ fontSize: 12, color: 'var(--text-muted, #8b949e)', background: 'var(--bg-input, #0d1117)', padding: '10px 12px', borderRadius: 6, border: '1px solid var(--border, #30363d)' }}>
                  No repositories found. Connect GitHub to load your repositories.
                </div>
              )}
            </div>

            {/* Target File & Branch */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div>
                <label style={{ display: 'block', fontSize: 11, color: 'var(--text-muted, #8b949e)', marginBottom: 5 }}>
                  Destination file
                </label>
                <div
                  style={{
                    padding: '8px 10px',
                    background: 'var(--bg-input, #0d1117)',
                    border: '1px solid var(--border, #30363d)',
                    borderRadius: 6,
                    fontSize: 12,
                    fontFamily: "'JetBrains Mono', monospace",
                    color: '#38bdf8',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                  title={targetPath}
                >
                  📄 {targetPath}
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 11, color: 'var(--text-muted, #8b949e)', marginBottom: 5 }}>
                  Target branch
                </label>
                <div
                  style={{
                    padding: '8px 10px',
                    background: 'var(--bg-input, #0d1117)',
                    border: '1px solid var(--border, #30363d)',
                    borderRadius: 6,
                    fontSize: 12,
                    fontFamily: "'JetBrains Mono', monospace",
                    color: 'var(--text-base, #f0f6fc)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  <GitBranchIcon size={12} /> {targetBranch}
                </div>
              </div>
            </div>

            {/* Debounce Interval Selection */}
            <div>
              <label style={{ display: 'block', fontSize: 11, color: 'var(--text-muted, #8b949e)', marginBottom: 5 }}>
                Sync delay after typing
              </label>
              <div style={{ display: 'flex', gap: 8 }}>
                {[
                  { sec: 2, label: '2s (Fast)' },
                  { sec: 3, label: '3s (Default)' },
                  { sec: 5, label: '5s (Relaxed)' },
                  { sec: 10, label: '10s' },
                ].map((item) => (
                  <button
                    key={item.sec}
                    onClick={() => {
                      setAutoSyncDelaySec(item.sec)
                      localStorage.setItem('cf_github_autosync_delay', String(item.sec))
                      showToast(`Sync delay set to ${item.sec}s`)
                    }}
                    style={{
                      flex: 1,
                      padding: '6px 8px',
                      fontSize: 11,
                      fontWeight: 600,
                      borderRadius: 6,
                      background: autoSyncDelaySec === item.sec ? 'rgba(56, 189, 248, 0.15)' : 'var(--bg-input, #0d1117)',
                      color: autoSyncDelaySec === item.sec ? '#38bdf8' : 'var(--text-muted, #8b949e)',
                      border: `1px solid ${autoSyncDelaySec === item.sec ? 'rgba(56, 189, 248, 0.4)' : 'var(--border, #30363d)'}`,
                      cursor: 'pointer',
                    }}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Live Sync Status Card */}
          <div
            style={{
              padding: 12,
              borderRadius: 8,
              background: 'rgba(0, 0, 0, 0.25)',
              border: '1px solid var(--border, #30363d)',
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
              fontSize: 11,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted, #8b949e)' }}>Sync status</span>
              <span style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
                {autoSyncStatus === 'syncing' ? (
                  <>
                    <div className="spin" style={{ width: 10, height: 10, borderRadius: '50%', border: '2px solid #38bdf8', borderTopColor: 'transparent' }} />
                    <span style={{ color: '#38bdf8' }}>Syncing to GitHub…</span>
                  </>
                ) : autoSyncStatus === 'synced' ? (
                  <>
                    <CheckIcon size={12} style={{ color: '#10b981' }} />
                    <span style={{ color: '#10b981' }}>In Sync with GitHub</span>
                  </>
                ) : autoSyncStatus === 'error' ? (
                  <span style={{ color: '#ef4444' }}>⚠️ Last sync failed</span>
                ) : (
                  <span style={{ color: 'var(--text-muted, #8b949e)' }}>Idle / Ready</span>
                )}
              </span>
            </div>

            {lastSyncTime && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'var(--text-muted, #8b949e)' }}>
                <span>Last synced</span>
                <span>{lastSyncTime.toLocaleTimeString()}</span>
              </div>
            )}

            {lastCommitResult && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted, #8b949e)' }}>Last Commit:</span>
                <a
                  href={lastCommitResult.url}
                  target="_blank"
                  rel="noreferrer"
                  style={{ color: '#38bdf8', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4, fontFamily: 'monospace' }}
                >
                  <GitCommitIcon size={12} /> {lastCommitResult.sha} ↗
                </a>
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div
          style={{
            padding: '12px 20px',
            borderTop: '1px solid var(--border, #30363d)',
            background: 'var(--bg-input, #0d1117)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ fontSize: 11, color: 'var(--text-muted, #8b949e)' }}>
            {activeRepo ? `Target: ${activeRepo.full_name || activeRepo.name}` : 'Select a repository to start syncing'}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button onClick={onClose} className="btn btn-ghost" style={{ padding: '6px 12px', fontSize: 12 }}>
              Close
            </button>
            <button
              onClick={handleSyncNowClick}
              disabled={manualSyncing || autoSyncStatus === 'syncing'}
              className="btn btn-primary"
              style={{
                padding: '6px 14px',
                fontSize: 12,
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                background: 'linear-gradient(135deg, #0284c7, #2563eb)',
              }}
            >
              {manualSyncing || autoSyncStatus === 'syncing' ? (
                <>
                  <div className="spin" style={{ width: 10, height: 10, borderRadius: '50%', border: '2px solid #fff', borderTopColor: 'transparent' }} />
                  Pushing…
                </>
              ) : (
                <>
                  <RefreshIcon size={13} />
                  Push current file
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

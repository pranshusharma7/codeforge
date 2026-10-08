import { useState, useEffect } from 'react'
import type { AuthUser } from '../lib/storage'
import {
  type GitHubRepository,
  type RepoTreeItem,
  type GitHubCommitSummary,
  getRepoTree,
  getRepoFileContent,
  commitOrUpdateRepoFile,
  commitMultipleRepoFiles,
  type BatchCommitItem,
  getRepoCommits,
  getRepoBranches,
} from '../lib/github'
import {
  GitBranchIcon,
  GitCommitIcon,
  RefreshIcon,
  ExternalLinkIcon,
  FolderIcon,
  SpinnerIcon,
  CheckIcon,
} from './icons'
import GitHubRepoBrowser from './GitHubRepoBrowser'

export interface TabWithRepo {
  id: string
  name: string
  lang: string
  code: string
  modified?: boolean
  repoOwner?: string
  repoName?: string
  repoPath?: string
  repoSha?: string
  repoBranch?: string
  fileHandle?: FileSystemFileHandle
  isLocalDisk?: boolean
  localPath?: string
}

interface Props {
  authUser: AuthUser | null
  repositories: GitHubRepository[]
  activeRepo: GitHubRepository | null
  setActiveRepo: (repo: GitHubRepository | null) => void
  activeTab: TabWithRepo
  allTabs: TabWithRepo[]
  onOpenFileFromRepo: (
    repo: GitHubRepository,
    path: string,
    content: string,
    sha: string,
    branch: string
  ) => void
  onImportMultipleFiles?: (
    repo: GitHubRepository,
    files: { path: string; name: string; content: string; sha: string; branch: string }[]
  ) => void
  onCommitSuccess: (tabId: string, newSha: string, commitUrl: string, commitSha: string) => void
  onConnectGitHub: () => void
  onSignOut?: () => void
  onRefreshRepos: () => void
  showToast: (msg: string) => void
  autoSyncEnabled?: boolean
  setAutoSyncEnabled?: (val: boolean) => void
  autoSyncStatus?: 'idle' | 'syncing' | 'synced' | 'error'
  lastSyncResult?: { sha: string; url: string; file: string } | null
  onOpenAutoSyncModal?: () => void
}

export default function SourceControlPanel({
  authUser,
  repositories,
  activeRepo,
  setActiveRepo,
  activeTab,
  allTabs,
  onOpenFileFromRepo,
  onImportMultipleFiles,
  onCommitSuccess,
  onConnectGitHub,
  onSignOut,
  onRefreshRepos,
  showToast,
  autoSyncEnabled,
  setAutoSyncEnabled,
  autoSyncStatus,
  lastSyncResult,
  onOpenAutoSyncModal,
}: Props) {
  // Commit form state
  const [commitMessage, setCommitMessage] = useState('')
  const [targetPath, setTargetPath] = useState('')
  const [targetBranch, setTargetBranch] = useState('')
  const [branches, setBranches] = useState<string[]>([])
  const [committing, setCommitting] = useState(false)
  const [lastCommitResult, setLastCommitResult] = useState<{
    sha: string
    url: string
    file: string
  } | null>(null)

  // Batch commit state
  const [commitScope, setCommitScope] = useState<'single' | 'all'>('single')
  const [selectedTabIds, setSelectedTabIds] = useState<Set<string>>(new Set(allTabs.map(t => t.id)))
  const [batchCommitting, setBatchCommitting] = useState(false)
  const [batchProgress, setBatchProgress] = useState<{ current: number; total: number; file: string } | null>(null)

  // Sync selectedTabIds when new tabs are opened
  useEffect(() => {
    setSelectedTabIds(new Set(allTabs.map(t => t.id)))
  }, [allTabs.length])

  // File tree browsing state
  const [showFileTree, setShowFileTree] = useState(false)
  const [treeLoading, setTreeLoading] = useState(false)
  const [treeItems, setTreeItems] = useState<RepoTreeItem[]>([])
  const [treeFilter, setTreeFilter] = useState('')
  const [loadingFilePath, setLoadingFilePath] = useState<string | null>(null)

  // Recent commits
  const [commits, setCommits] = useState<GitHubCommitSummary[]>([])
  const [commitsLoading, setCommitsLoading] = useState(false)
  const [showCommits, setShowCommits] = useState(false)

  // When active tab changes or active repo changes, initialize commit fields
  useEffect(() => {
    if (activeTab.repoPath) {
      setTargetPath(activeTab.repoPath)
    } else {
      setTargetPath(activeTab.name)
    }

    if (activeTab.repoBranch) {
      setTargetBranch(activeTab.repoBranch)
    } else if (activeRepo?.default_branch) {
      setTargetBranch(activeRepo.default_branch)
    } else {
      setTargetBranch('main')
    }
  }, [activeTab.id, activeTab.repoPath, activeTab.repoBranch, activeTab.name, activeRepo])

  // If active tab has a repo linked, auto-select that repo
  useEffect(() => {
    if (activeTab.repoOwner && activeTab.repoName) {
      const match = repositories.find(
        r =>
          r.name.toLowerCase() === activeTab.repoName?.toLowerCase() &&
          r.owner?.login.toLowerCase() === activeTab.repoOwner?.toLowerCase()
      )
      if (match && match.id !== activeRepo?.id) {
        setActiveRepo(match)
      }
    }
  }, [activeTab.repoOwner, activeTab.repoName, repositories])

  // Load branches & recent commits when activeRepo or targetBranch changes
  useEffect(() => {
    if (!authUser?.accessToken || !activeRepo) return
    const owner = activeRepo.owner?.login || authUser.login || authUser.name

    getRepoBranches(authUser.accessToken, owner, activeRepo.name)
      .then(bList => {
        setBranches(bList)
        if (!targetBranch || !bList.includes(targetBranch)) {
          setTargetBranch(activeRepo.default_branch || bList[0] || 'main')
        }
      })
      .catch(() => {})
  }, [activeRepo?.id, authUser?.accessToken])

  // Fetch commits
  const loadCommits = async () => {
    if (!authUser?.accessToken || !activeRepo) return
    setCommitsLoading(true)
    try {
      const owner = activeRepo.owner?.login || authUser.login || authUser.name
      const list = await getRepoCommits(authUser.accessToken, owner, activeRepo.name, targetBranch || 'main', 8)
      setCommits(list)
    } catch {
      // ignore
    } finally {
      setCommitsLoading(false)
    }
  }

  // Fetch file tree
  const loadTree = async () => {
    if (!authUser?.accessToken || !activeRepo) return
    setTreeLoading(true)
    try {
      const owner = activeRepo.owner?.login || authUser.login || authUser.name
      const branch = targetBranch || activeRepo.default_branch || 'main'
      const items = await getRepoTree(authUser.accessToken, owner, activeRepo.name, branch)
      setTreeItems(items)
      setShowFileTree(true)
    } catch (err: any) {
      showToast(err.message || 'Could not load repository files')
    } finally {
      setTreeLoading(false)
    }
  }

  // Load file into editor
  const handleOpenFile = async (item: RepoTreeItem) => {
    if (!authUser?.accessToken || !activeRepo || item.type === 'tree') return
    setLoadingFilePath(item.path)
    try {
      const owner = activeRepo.owner?.login || authUser.login || authUser.name
      const branch = targetBranch || activeRepo.default_branch || 'main'
      const fileData = await getRepoFileContent(authUser.accessToken, owner, activeRepo.name, item.path, branch)
      onOpenFileFromRepo(activeRepo, fileData.path, fileData.content, fileData.sha, branch)
      showToast(`Loaded ${fileData.name} from ${activeRepo.name}`)
    } catch (err: any) {
      showToast(err.message || 'Failed to load file content')
    } finally {
      setLoadingFilePath(null)
    }
  }

  // Commit & Push handler
  const handleCommit = async () => {
    if (!authUser?.accessToken) {
      onConnectGitHub()
      return
    }
    if (!activeRepo) {
      showToast('Please select a target repository')
      return
    }
    if (!targetPath.trim()) {
      showToast('Please enter a target file path')
      return
    }

    const msg = commitMessage.trim() || `Update ${targetPath}`
    const branch = targetBranch.trim() || activeRepo.default_branch || 'main'
    const owner = activeRepo.owner?.login || authUser.login || authUser.name

    setCommitting(true)
    try {
      // Determine sha to use: if active tab matches targetPath and repo, use its sha
      const isSameFile =
        activeTab.repoPath === targetPath &&
        activeTab.repoName?.toLowerCase() === activeRepo.name.toLowerCase()
      const shaToUse = isSameFile ? activeTab.repoSha : undefined

      const result = await commitOrUpdateRepoFile(
        authUser.accessToken,
        owner,
        activeRepo.name,
        targetPath,
        activeTab.code,
        msg,
        branch,
        shaToUse
      )

      onCommitSuccess(activeTab.id, result.fileSha, result.commitUrl, result.commitSha)
      setLastCommitResult({
        sha: result.commitSha.slice(0, 7),
        url: result.commitUrl,
        file: targetPath,
      })
      setCommitMessage('')
      showToast(`Committed & pushed to ${activeRepo.name}/${branch}!`)

      // Refresh commit history
      loadCommits()
    } catch (err: any) {
      showToast(err.message || 'Commit failed. Check branch permissions.')
    } finally {
      setCommitting(false)
    }
  }

  const handleBatchCommit = async () => {
    if (!authUser?.accessToken || !activeRepo) {
      showToast('Please connect GitHub and select a repository')
      return
    }

    const filesToCommit = allTabs.filter(t => selectedTabIds.has(t.id))
    if (filesToCommit.length === 0) {
      showToast('Please select at least one file to commit')
      return
    }

    const branch = targetBranch.trim() || activeRepo.default_branch || 'main'
    const owner = activeRepo.owner?.login || authUser.login || authUser.name
    const msg = commitMessage.trim() || `Update ${filesToCommit.length} files in workspace`

    setBatchCommitting(true)
    setBatchProgress({ current: 0, total: filesToCommit.length, file: filesToCommit[0].name })

    try {
      const batchItems: BatchCommitItem[] = filesToCommit.map(t => ({
        id: t.id,
        path: t.repoPath || t.name,
        content: t.code,
        existingSha: t.repoSha,
      }))

      const result = await commitMultipleRepoFiles(
        authUser.accessToken,
        owner,
        activeRepo.name,
        batchItems,
        msg,
        branch,
        (current, total, path) => {
          setBatchProgress({ current, total, file: path })
        }
      )

      for (const cf of result.committedFiles) {
        if (cf.tabId) {
          onCommitSuccess(cf.tabId, cf.fileSha, result.lastCommitUrl || '', result.lastCommitSha || '')
        }
      }

      if (result.lastCommitSha && result.lastCommitUrl) {
        setLastCommitResult({
          sha: result.lastCommitSha.slice(0, 7),
          url: result.lastCommitUrl,
          file: `${result.succeeded} workspace file(s)`,
        })
      }

      loadCommits()
      setCommitMessage('')

      if (result.failed === 0) {
        showToast(`🎉 All ${result.succeeded} files committed & pushed to GitHub (${branch})!`)
      } else {
        showToast(`Committed ${result.succeeded}/${result.total} files. ${result.failed} failed.`)
      }
    } catch (err: any) {
      showToast(`Batch commit failed: ${err.message}`)
    } finally {
      setBatchCommitting(false)
      setBatchProgress(null)
    }
  }

  if (!authUser || !authUser.accessToken) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
          padding: '24px 14px',
          textAlign: 'center',
          overflowY: 'auto',
        }}
      >
        <div
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: 12,
            padding: '26px 18px',
            width: '100%',
            maxWidth: 340,
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.2)',
          }}
        >
          {/* GitHub Octocat Icon */}
          <div
            style={{
              width: 54,
              height: 54,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, rgba(35, 134, 54, 0.2) 0%, rgba(56, 189, 248, 0.15) 100%)',
              border: '1px solid rgba(35, 134, 54, 0.4)',
              color: 'var(--text-base)',
              display: 'grid',
              placeItems: 'center',
              margin: '0 auto 14px',
            }}
          >
            <svg width="28" height="28" viewBox="0 0 16 16" fill="currentColor">
              <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0 0 16 8c0-4.42-3.58-8-8-8z" />
            </svg>
          </div>

          <div style={{ color: 'var(--text-base)', fontWeight: 700, fontSize: 16, marginBottom: 6 }}>
            Connect GitHub
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: 12, lineHeight: 1.5, marginBottom: 18 }}>
            Connect your GitHub account to access your repositories, browse source code, and commit directly from CodeForge.
          </p>

          {/* Feature checklist */}
          <div
            style={{
              background: 'var(--bg-app)',
              border: '1px solid var(--border)',
              borderRadius: 8,
              padding: '10px 12px',
              textAlign: 'left',
              marginBottom: 18,
              fontSize: 11,
              display: 'flex',
              flexDirection: 'column',
              gap: 7,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, color: 'var(--text-base)' }}>
              <span style={{ color: '#2ea043', fontSize: 13, fontWeight: 700 }}>✓</span>
              <span>Load your private & public repositories</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, color: 'var(--text-base)' }}>
              <span style={{ color: '#2ea043', fontSize: 13, fontWeight: 700 }}>✓</span>
              <span>Commit & push code directly</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, color: 'var(--text-base)' }}>
              <span style={{ color: '#2ea043', fontSize: 13, fontWeight: 700 }}>✓</span>
              <span>Live background code synchronization</span>
            </div>
          </div>

          <button
            onClick={onConnectGitHub}
            className="btn btn-primary"
            style={{
              width: '100%',
              justifyContent: 'center',
              fontSize: 13,
              fontWeight: 600,
              padding: '9px 14px',
              background: 'linear-gradient(135deg, #238636 0%, #2ea043 100%)',
              boxShadow: '0 4px 14px rgba(35, 134, 54, 0.3)',
              gap: 8,
              cursor: 'pointer',
            }}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0 0 16 8c0-4.42-3.58-8-8-8z" />
            </svg>
            Connect GitHub
          </button>
        </div>
      </div>
    )
  }

  const isCurrentFileLinked = Boolean(activeTab.repoPath && activeTab.repoName)
  const isModified = activeTab.modified

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflowY: 'auto', padding: '10px 12px' }}>
      {/* ── Connected User Account Status Bar ────────────────────────────── */}
      <div
        style={{
          background: 'rgba(35, 134, 54, 0.08)',
          border: '1px solid rgba(35, 134, 54, 0.28)',
          borderRadius: 8,
          padding: '8px 10px',
          marginBottom: 12,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: 11,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
          {authUser.avatarUrl ? (
            <img
              src={authUser.avatarUrl}
              alt=""
              style={{ width: 22, height: 22, borderRadius: '50%', flexShrink: 0, border: '1px solid var(--border)' }}
            />
          ) : (
            <div
              style={{
                width: 22,
                height: 22,
                borderRadius: '50%',
                background: '#238636',
                color: '#fff',
                fontSize: 10,
                fontWeight: 700,
                display: 'grid',
                placeItems: 'center',
                flexShrink: 0,
              }}
            >
              {authUser.initials || 'GH'}
            </div>
          )}
          <div style={{ minWidth: 0 }}>
            <div
              style={{
                fontWeight: 600,
                color: 'var(--text-base)',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                fontSize: 12,
              }}
            >
              @{authUser.login || authUser.name}
            </div>
            <div style={{ fontSize: 9.5, color: '#2ea043', display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#2ea043', display: 'inline-block' }}></span>
              Connected
            </div>
          </div>
        </div>

        {onSignOut && (
          <button
            onClick={onSignOut}
            title="Disconnect GitHub account"
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              fontSize: 10,
              padding: '2px 6px',
              textDecoration: 'underline',
            }}
          >
            Disconnect
          </button>
        )}
      </div>

      {/* ── Active Repository Selector ─────────────────────────────────── */}
      <div style={{ marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 5 }}>
          <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', color: 'var(--text-muted)' }}>
            REPOSITORY
          </span>
          <div style={{ display: 'flex', gap: 6 }}>
            <button
              onClick={onRefreshRepos}
              title="Refresh repositories"
              style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 2 }}
            >
              <RefreshIcon size={12} />
            </button>
            {activeRepo && (
              <a
                href={activeRepo.html_url}
                target="_blank"
                rel="noreferrer"
                title="Open on GitHub"
                style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}
              >
                <ExternalLinkIcon size={12} />
              </a>
            )}
          </div>
        </div>

        {repositories.length === 0 ? (
          <div
            style={{
              background: 'var(--bg-card)',
              border: '1px dashed var(--border)',
              borderRadius: 8,
              padding: '12px 10px',
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-base)', marginBottom: 3 }}>
              No repositories found
            </div>
            <p style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 6, lineHeight: 1.4 }}>
              No repositories found on @{authUser.login || authUser.name}.
            </p>
            <button
              onClick={onRefreshRepos}
              className="btn btn-ghost"
              style={{ fontSize: 10, padding: '3px 8px', gap: 4, margin: '0 auto' }}
            >
              <RefreshIcon size={11} /> Refresh
            </button>
          </div>
        ) : (
          <select
            value={activeRepo?.id || ''}
            onChange={e => {
              const chosen = repositories.find(r => r.id === Number(e.target.value))
              setActiveRepo(chosen || null)
              setTreeItems([])
              setShowFileTree(false)
            }}
            className="ide-input"
            style={{ width: '100%', fontSize: 11, padding: '6px 8px', cursor: 'pointer' }}
          >
            <option value="">Select a repository ({repositories.length} available)...</option>
            {repositories.map(r => (
              <option key={r.id} value={r.id}>
                {r.name} {r.private ? '(Private)' : ''}
              </option>
            ))}
          </select>
        )}
      </div>

      {!activeRepo && repositories.length > 0 && (
        <div
          style={{
            background: 'var(--bg-card)',
            border: '1px dashed var(--border)',
            borderRadius: 8,
            padding: '14px 12px',
            textAlign: 'center',
            marginBottom: 12,
          }}
        >
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-base)', marginBottom: 3 }}>
            Select a Repository
          </div>
          <p style={{ fontSize: 10.5, color: 'var(--text-muted)', lineHeight: 1.4 }}>
            Choose a repository above to explore branches, browse files, and commit changes.
          </p>
        </div>
      )}

      {activeRepo && (
        <>
          {/* ── Auto-Update / Auto-Sync to GitHub Card ─────────────────────────── */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: autoSyncEnabled ? 'rgba(16, 185, 129, 0.09)' : 'var(--bg-card)',
              border: `1px solid ${autoSyncEnabled ? 'rgba(16, 185, 129, 0.35)' : 'var(--border)'}`,
              borderRadius: 6,
              padding: '8px 10px',
              marginBottom: 10,
              fontSize: 11,
              transition: 'all 0.2s ease',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 13 }}>☁️</span>
              <div>
                <div style={{ fontWeight: 700, color: 'var(--text-base)', display: 'flex', alignItems: 'center', gap: 6 }}>
                  Auto-Update to GitHub
                  {autoSyncStatus === 'syncing' && (
                    <span style={{ color: '#38bdf8', fontSize: 10, fontWeight: 600 }}>Syncing…</span>
                  )}
                  {autoSyncStatus === 'synced' && (
                    <span style={{ color: '#10b981', fontSize: 10, fontWeight: 600 }}>✓ Synced</span>
                  )}
                </div>
                <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                  {autoSyncEnabled ? 'Pushes live code updates automatically' : 'Enable to push live edits to GitHub'}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              {onOpenAutoSyncModal && (
                <button
                  onClick={onOpenAutoSyncModal}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--accent)',
                    cursor: 'pointer',
                    fontSize: 10,
                    textDecoration: 'underline',
                    padding: '2px 4px',
                  }}
                  title="Configure sync delays & target"
                >
                  Configure
                </button>
              )}
              {setAutoSyncEnabled && (
                <button
                  onClick={() => {
                    const next = !autoSyncEnabled
                    setAutoSyncEnabled(next)
                    localStorage.setItem('cf_github_autosync', String(next))
                    showToast(next ? '🟢 GitHub Auto-Update Enabled!' : '⚪ GitHub Auto-Update Disabled')
                  }}
                  style={{
                    width: 38,
                    height: 20,
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
                      width: 14,
                      height: 14,
                      borderRadius: '50%',
                      background: '#ffffff',
                      position: 'absolute',
                      top: 3,
                      left: autoSyncEnabled ? 21 : 3,
                      transition: 'left 0.2s ease',
                    }}
                  />
                </button>
              )}
            </div>
          </div>

          {/* ── Branch and File Tree Quick Bar ──────────────────────────── */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: 6,
              padding: '6px 8px',
              marginBottom: 10,
              fontSize: 11,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-base)', minWidth: 0 }}>
              <GitBranchIcon size={13} style={{ color: 'var(--accent)', flexShrink: 0 }} />
              <select
                value={targetBranch}
                onChange={e => setTargetBranch(e.target.value)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-base)',
                  fontSize: 11,
                  fontFamily: 'JetBrains Mono',
                  cursor: 'pointer',
                  outline: 'none',
                  maxWidth: 110,
                }}
              >
                {branches.map(b => (
                  <option key={b} value={b} style={{ background: 'var(--bg-card)', color: 'var(--text-base)' }}>
                    {b}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <button
                onClick={() => setShowFileTree(prev => !prev)}
                style={{
                  background: showFileTree ? 'var(--bg-hover)' : 'transparent',
                  border: '1px solid var(--border)',
                  borderRadius: 4,
                  color: showFileTree ? 'var(--accent)' : 'var(--text-base)',
                  fontSize: 10,
                  padding: '3px 7px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  fontWeight: showFileTree ? 600 : 400,
                }}
              >
                <FolderIcon size={11} />
                {showFileTree ? 'Hide Files' : 'Browse Files'}
              </button>
            </div>
          </div>

          {/* ── True GitHub File & Folder Explorer (if toggled) ─────── */}
          {showFileTree && activeRepo && authUser && (
            <div style={{ marginBottom: 14 }}>
              <GitHubRepoBrowser
                accessToken={authUser.accessToken}
                repository={activeRepo}
                currentBranch={targetBranch || activeRepo.default_branch || 'main'}
                onOpenFile={fileData => {
                  onOpenFileFromRepo(activeRepo, fileData.path, fileData.content, fileData.sha, fileData.branch)
                }}
                onImportMultipleFiles={
                  onImportMultipleFiles
                    ? files => {
                        onImportMultipleFiles(activeRepo, files)
                      }
                    : undefined
                }
              />
            </div>
          )}

          {/* ── Commit Scope Switcher (Single File vs All Changed Files) ── */}
          <div style={{ borderTop: '1px solid var(--border)', paddingTop: 10, marginBottom: 12 }}>
            <div style={{ display: 'flex', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 6, padding: 2, marginBottom: 10 }}>
              <button
                onClick={() => setCommitScope('single')}
                style={{
                  flex: 1,
                  padding: '5px 8px',
                  fontSize: 10,
                  fontWeight: commitScope === 'single' ? 700 : 500,
                  background: commitScope === 'single' ? 'var(--bg-hover)' : 'transparent',
                  color: commitScope === 'single' ? 'var(--text-base)' : 'var(--text-muted)',
                  border: 'none',
                  borderRadius: 4,
                  cursor: 'pointer',
                }}
              >
                📄 Active File ({activeTab.name})
              </button>

              <button
                onClick={() => setCommitScope('all')}
                style={{
                  flex: 1,
                  padding: '5px 8px',
                  fontSize: 10,
                  fontWeight: commitScope === 'all' ? 700 : 500,
                  background: commitScope === 'all' ? 'var(--bg-hover)' : 'transparent',
                  color: commitScope === 'all' ? 'var(--accent)' : 'var(--text-muted)',
                  border: 'none',
                  borderRadius: 4,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 5,
                }}
              >
                <span>📦 Commit All Files</span>
                <span
                  style={{
                    background: 'var(--accent)',
                    color: '#ffffff',
                    fontSize: 9,
                    padding: '1px 5px',
                    borderRadius: 8,
                    fontWeight: 700,
                  }}
                >
                  {allTabs.length}
                </span>
              </button>
            </div>

            {/* ── Mode 1: Single Active File ── */}
            {commitScope === 'single' ? (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', color: 'var(--text-muted)' }}>
                    ACTIVE FILE TO COMMIT
                  </span>
                  <span style={{ fontSize: 10, color: isModified ? '#d29922' : '#3fb950', fontWeight: 600 }}>
                    {isModified ? '1 modified' : 'Up to date'}
                  </span>
                </div>

                <div
                  style={{
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border)',
                    borderRadius: 6,
                    padding: '8px 10px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    marginBottom: 12,
                  }}
                >
                  <div
                    style={{
                      width: 18,
                      height: 18,
                      borderRadius: 4,
                      background: isModified ? '#d2992220' : '#3fb95020',
                      color: isModified ? '#d29922' : '#3fb950',
                      display: 'grid',
                      placeItems: 'center',
                      fontSize: 10,
                      fontWeight: 700,
                      flexShrink: 0,
                    }}
                  >
                    {isModified ? 'M' : isCurrentFileLinked ? '✓' : 'U'}
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: 11,
                        fontWeight: 600,
                        color: 'var(--text-base)',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {targetPath || activeTab.name}
                    </div>
                    <div style={{ fontSize: 9, color: 'var(--text-muted)' }}>
                      {isCurrentFileLinked ? `Linked to ${activeRepo.name}` : `Will be committed to ${activeRepo.name}`}
                    </div>
                  </div>
                </div>

                <label style={{ fontSize: 10, color: 'var(--text-muted)', display: 'block', marginBottom: 3 }}>
                  Target File Path in Repo:
                </label>
                <input
                  value={targetPath}
                  onChange={e => setTargetPath(e.target.value)}
                  placeholder="e.g. src/index.js or solution.py"
                  className="ide-input"
                  style={{ width: '100%', fontSize: 11, fontFamily: 'JetBrains Mono', marginBottom: 8, padding: '6px 8px' }}
                />

                <label style={{ fontSize: 10, color: 'var(--text-muted)', display: 'block', marginBottom: 3 }}>
                  Commit Message:
                </label>
                <textarea
                  value={commitMessage}
                  onChange={e => setCommitMessage(e.target.value)}
                  placeholder={`Message (e.g. update ${targetPath || activeTab.name})`}
                  onKeyDown={e => {
                    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                      e.preventDefault()
                      handleCommit()
                    }
                  }}
                  style={{
                    width: '100%',
                    height: 58,
                    background: 'var(--bg-input)',
                    border: '1px solid var(--border)',
                    borderRadius: 6,
                    color: 'var(--text-base)',
                    fontSize: 11,
                    padding: '6px 8px',
                    outline: 'none',
                    resize: 'none',
                    marginBottom: 8,
                  }}
                />

                <button
                  onClick={handleCommit}
                  disabled={committing || !targetPath.trim()}
                  className="btn btn-primary"
                  style={{
                    width: '100%',
                    justifyContent: 'center',
                    padding: '8px 12px',
                    fontSize: 11,
                    fontWeight: 600,
                    gap: 6,
                  }}
                >
                  {committing ? (
                    <>
                      <SpinnerIcon size={12} /> Pushing to GitHub...
                    </>
                  ) : (
                    <>
                      <CheckIcon size={12} /> Commit & Push to {targetBranch || 'main'}
                    </>
                  )}
                </button>
              </>
            ) : (
              /* ── Mode 2: Batch Commit All Workspace Files ── */
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', color: 'var(--text-muted)' }}>
                    FILES TO COMMIT ({selectedTabIds.size}/{allTabs.length} SELECTED)
                  </span>

                  <button
                    onClick={() => {
                      if (selectedTabIds.size === allTabs.length) {
                        setSelectedTabIds(new Set())
                      } else {
                        setSelectedTabIds(new Set(allTabs.map(t => t.id)))
                      }
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--accent)',
                      fontSize: 10,
                      cursor: 'pointer',
                      padding: 0,
                    }}
                  >
                    {selectedTabIds.size === allTabs.length ? 'Deselect All' : 'Select All'}
                  </button>
                </div>

                {/* All Workspace Files List with checkboxes */}
                <div
                  style={{
                    maxHeight: 180,
                    overflowY: 'auto',
                    border: '1px solid var(--border)',
                    borderRadius: 6,
                    background: 'var(--bg-card)',
                    marginBottom: 10,
                  }}
                >
                  {allTabs.map(tab => {
                    const isSelected = selectedTabIds.has(tab.id)
                    const tabModified = tab.modified || !tab.repoSha
                    return (
                      <div
                        key={tab.id}
                        onClick={() => {
                          const next = new Set(selectedTabIds)
                          if (next.has(tab.id)) next.delete(tab.id)
                          else next.add(tab.id)
                          setSelectedTabIds(next)
                        }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 8,
                          padding: '6px 10px',
                          borderBottom: '1px solid var(--border-subtle)',
                          cursor: 'pointer',
                          background: isSelected ? 'var(--bg-hover)' : 'transparent',
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => {}} // handled by row click
                          style={{ cursor: 'pointer' }}
                        />

                        <div
                          style={{
                            width: 16,
                            height: 16,
                            borderRadius: 3,
                            background: tabModified ? '#d2992220' : '#3fb95020',
                            color: tabModified ? '#d29922' : '#3fb950',
                            display: 'grid',
                            placeItems: 'center',
                            fontSize: 9,
                            fontWeight: 700,
                            flexShrink: 0,
                          }}
                        >
                          {tabModified ? 'M' : '✓'}
                        </div>

                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 11, color: 'var(--text-base)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {tab.repoPath || tab.name}
                          </div>
                          <div style={{ fontSize: 9, color: 'var(--text-muted)' }}>
                            {tab.code.split('\n').length} lines • {tab.lang}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>

                <label style={{ fontSize: 10, color: 'var(--text-muted)', display: 'block', marginBottom: 3 }}>
                  Batch Commit Message:
                </label>
                <textarea
                  value={commitMessage}
                  onChange={e => setCommitMessage(e.target.value)}
                  placeholder={`e.g. feat: update ${selectedTabIds.size} workspace files`}
                  style={{
                    width: '100%',
                    height: 52,
                    background: 'var(--bg-input)',
                    border: '1px solid var(--border)',
                    borderRadius: 6,
                    color: 'var(--text-base)',
                    fontSize: 11,
                    padding: '6px 8px',
                    outline: 'none',
                    resize: 'none',
                    marginBottom: 8,
                  }}
                />

                {batchProgress && (
                  <div style={{ marginBottom: 8, padding: '6px 8px', background: 'var(--accent-subtle)', borderRadius: 5, fontSize: 10, color: 'var(--accent)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                      <SpinnerIcon size={10} />
                      <span>Committing {batchProgress.current} / {batchProgress.total}: <strong>{batchProgress.file}</strong></span>
                    </div>
                  </div>
                )}

                <button
                  onClick={handleBatchCommit}
                  disabled={batchCommitting || selectedTabIds.size === 0}
                  className="btn btn-primary"
                  style={{
                    width: '100%',
                    justifyContent: 'center',
                    padding: '9px 12px',
                    fontSize: 11,
                    fontWeight: 700,
                    gap: 6,
                    background: '#2563eb',
                  }}
                >
                  {batchCommitting ? (
                    <>
                      <SpinnerIcon size={12} /> Committing {batchProgress?.current || 0}/{selectedTabIds.size} Files...
                    </>
                  ) : (
                    <>
                      <span>🚀</span> Commit All ({selectedTabIds.size} Files) to {targetBranch || 'main'}
                    </>
                  )}
                </button>
              </div>
            )}

            <div style={{ fontSize: 9, color: 'var(--text-dim)', textAlign: 'center', marginTop: 5 }}>
              Pushes directly to branch <strong>{targetBranch || 'main'}</strong> of {activeRepo.name}
            </div>
          </div>

          {/* ── Last Commit Notification Card ─────────────────────────── */}
          {lastCommitResult && (
            <div
              style={{
                background: '#0f2d1e',
                border: '1px solid #238636',
                borderRadius: 6,
                padding: '8px 10px',
                marginBottom: 12,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#3fb950', fontSize: 11, fontWeight: 600 }}>
                <CheckIcon size={12} /> Commit successfully pushed!
              </div>
              <div style={{ fontSize: 10, color: '#8b949e', marginTop: 3 }}>
                SHA: <code style={{ color: '#58a6ff' }}>{lastCommitResult.sha}</code>
              </div>
              <a
                href={lastCommitResult.url}
                target="_blank"
                rel="noreferrer"
                style={{
                  color: '#58a6ff',
                  fontSize: 10,
                  marginTop: 4,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  textDecoration: 'none',
                }}
              >
                View commit on GitHub <ExternalLinkIcon size={10} />
              </a>
            </div>
          )}

          {/* ── Recent Commits Accordion ───────────────────────────────── */}
          <div style={{ borderTop: '1px solid var(--border)', paddingTop: 10 }}>
            <div
              onClick={() => {
                if (!showCommits) loadCommits()
                setShowCommits(!showCommits)
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                cursor: 'pointer',
                padding: '4px 0',
              }}
            >
              <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', color: 'var(--text-muted)' }}>
                RECENT COMMITS ({commits.length})
              </span>
              <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{showCommits ? '▲' : '▼'}</span>
            </div>

            {showCommits && (
              <div style={{ marginTop: 6 }}>
                {commitsLoading ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)', fontSize: 11, padding: 8 }}>
                    <SpinnerIcon size={12} /> Loading commits...
                  </div>
                ) : commits.length === 0 ? (
                  <div style={{ color: 'var(--text-dim)', fontSize: 11, padding: '4px 0' }}>No commits found.</div>
                ) : (
                  commits.map(c => (
                    <div
                      key={c.fullSha}
                      style={{
                        padding: '6px 8px',
                        background: 'var(--bg-card)',
                        border: '1px solid var(--border)',
                        borderRadius: 5,
                        marginBottom: 4,
                        fontSize: 11,
                      }}
                    >
                      <div
                        style={{
                          color: 'var(--text-base)',
                          fontWeight: 500,
                          fontSize: 11,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {c.message}
                      </div>
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          color: 'var(--text-muted)',
                          fontSize: 9,
                          marginTop: 3,
                        }}
                      >
                        <span>{c.authorName}</span>
                        <a
                          href={c.html_url}
                          target="_blank"
                          rel="noreferrer"
                          style={{ color: 'var(--accent)', fontFamily: 'JetBrains Mono', textDecoration: 'none' }}
                        >
                          {c.sha}
                        </a>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}

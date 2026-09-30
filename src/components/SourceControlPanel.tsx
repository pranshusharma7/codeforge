import React, { useState, useEffect } from 'react'
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
  createRepoBranch,
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
  originalCode?: string
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
  onRefreshRepos: () => void
  onOpenVisualDiff: (original: string, modified: string, filename: string) => void
  onOpenCloneModal: () => void
  onOpenPrModal: (currentBranch: string, branches: string[]) => void
  showToast: (msg: string) => void
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
  onRefreshRepos,
  onOpenVisualDiff,
  onOpenCloneModal,
  onOpenPrModal,
  showToast,
}: Props) {
  // Main View Mode: Changes vs History
  const [activeView, setActiveView] = useState<'changes' | 'history'>('changes')

  // Commit form state
  const [commitMessage, setCommitMessage] = useState('')
  const [targetPath, setTargetPath] = useState('')
  const [targetBranch, setTargetBranch] = useState('')
  const [branches, setBranches] = useState<string[]>([])
  const [committing, setCommitting] = useState(false)
  const [generatingAiMsg, setGeneratingAiMsg] = useState(false)
  const [lastCommitResult, setLastCommitResult] = useState<{
    sha: string
    url: string
    file: string
  } | null>(null)

  // Branch creation state
  const [showNewBranchInput, setShowNewBranchInput] = useState(false)
  const [newBranchName, setNewBranchName] = useState('')
  const [creatingBranch, setCreatingBranch] = useState(false)

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

  // Recent commits
  const [commits, setCommits] = useState<GitHubCommitSummary[]>([])
  const [commitsLoading, setCommitsLoading] = useState(false)
  const [commitFilter, setCommitFilter] = useState('')

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

  // Load branches & recent commits when activeRepo changes
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
      const list = await getRepoCommits(authUser.accessToken, owner, activeRepo.name, targetBranch || 'main', 20)
      setCommits(list)
    } catch {
      // ignore
    } finally {
      setCommitsLoading(false)
    }
  }

  // Load commits when switching to history tab
  useEffect(() => {
    if (activeView === 'history' && activeRepo && authUser?.accessToken) {
      loadCommits()
    }
  }, [activeView, activeRepo?.id, targetBranch])

  // Create new branch
  const handleCreateBranch = async () => {
    const raw = newBranchName.trim().replace(/\s+/g, '-').toLowerCase()
    if (!raw) {
      showToast('Please enter a branch name')
      return
    }
    if (!authUser?.accessToken || !activeRepo) return

    setCreatingBranch(true)
    const owner = activeRepo.owner?.login || authUser.login || authUser.name

    try {
      const baseBranch = targetBranch || activeRepo.default_branch || 'main'
      const created = await createRepoBranch(authUser.accessToken, owner, activeRepo.name, raw, baseBranch)
      setBranches(prev => [...prev, created])
      setTargetBranch(created)
      setShowNewBranchInput(false)
      setNewBranchName('')
      showToast(`Branch "${created}" created and activated! 🌿`)
    } catch (err: any) {
      showToast(err.message || 'Failed to create branch')
    } finally {
      setCreatingBranch(false)
    }
  }

  // AI Commit message generator
  const handleGenerateAiCommitMsg = () => {
    setGeneratingAiMsg(true)
    try {
      const fname = targetPath || activeTab.name || 'code'
      const isNew = !activeTab.repoSha
      const ext = fname.split('.').pop() || ''
      let msg = ''

      if (isNew) {
        msg = `feat: add initial ${fname} implementation`
      } else {
        const lineCount = activeTab.code.split('\n').length
        if (fname.includes('test')) {
          msg = `test: update unit tests in ${fname}`
        } else if (ext === 'py' || ext === 'java' || ext === 'cpp' || ext === 'c') {
          msg = `refactor: optimize solution logic in ${fname}`
        } else {
          msg = `feat: update ${fname} (${lineCount} lines)`
        }
      }
      setCommitMessage(msg)
      showToast('Generated commit message with CodeForge AI ✨')
    } finally {
      setGeneratingAiMsg(false)
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

  if (!authUser) {
    return (
      <div style={{ padding: '16px 12px', flex: 1, overflowY: 'auto' }}>
        <div
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: 8,
            padding: '16px 14px',
            textAlign: 'center',
          }}
        >
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: '50%',
              background: 'var(--bg-hover)',
              color: 'var(--accent)',
              display: 'grid',
              placeItems: 'center',
              margin: '0 auto 10px',
            }}
          >
            <GitCommitIcon size={20} />
          </div>
          <div style={{ color: 'var(--text-base)', fontWeight: 600, fontSize: 13, marginBottom: 4 }}>
            Source Control & GitHub
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: 11, lineHeight: 1.5, marginBottom: 14 }}>
            Sign in with GitHub to view your repositories, visual diffs, branches, and commit changes like in VS Code.
          </p>
          <button
            onClick={onConnectGitHub}
            className="btn btn-primary"
            style={{ width: '100%', justifyContent: 'center', fontSize: 12, padding: '7px 12px' }}
          >
            Connect GitHub
          </button>

          <div style={{ margin: '14px 0 10px', height: 1, background: 'var(--border)' }} />

          {/* Option to Clone/Import public repo without sign in */}
          <button
            onClick={onOpenCloneModal}
            className="btn btn-ghost"
            style={{ width: '100%', justifyContent: 'center', fontSize: 11, padding: '6px 10px', gap: 6 }}
          >
            <span>📥 Clone / Import Public Repo</span>
          </button>
        </div>
      </div>
    )
  }

  const isCurrentFileLinked = Boolean(activeTab.repoPath && activeTab.repoName)
  const isModified = activeTab.modified || (activeTab.originalCode !== undefined && activeTab.code !== activeTab.originalCode)

  const filteredCommits = commitFilter.trim()
    ? commits.filter(c =>
        c.message.toLowerCase().includes(commitFilter.toLowerCase()) ||
        c.authorName.toLowerCase().includes(commitFilter.toLowerCase()) ||
        c.sha.toLowerCase().includes(commitFilter.toLowerCase())
      )
    : commits

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflowY: 'auto', padding: '10px 12px', background: 'var(--bg-panel)' }}>
      {/* ── Top Header Actions ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', color: 'var(--text-muted)' }}>
          SOURCE CONTROL
        </span>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <button
            onClick={onOpenCloneModal}
            title="Clone / Import GitHub Repo by URL"
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: 4,
              color: 'var(--text-base)',
              fontSize: 10,
              padding: '2px 7px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
            }}
          >
            <span>📥 Clone</span>
          </button>

          {activeRepo && (
            <button
              onClick={() => onOpenPrModal(targetBranch || 'main', branches)}
              title="Create Pull Request on GitHub"
              style={{
                background: 'var(--accent-subtle)',
                border: '1px solid var(--accent-border)',
                borderRadius: 4,
                color: 'var(--accent)',
                fontSize: 10,
                fontWeight: 600,
                padding: '2px 7px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 4,
              }}
            >
              <span>🔀 PR</span>
            </button>
          )}

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

      {/* ── Repository Selector ── */}
      <div style={{ marginBottom: 10 }}>
        <select
          value={activeRepo?.id || ''}
          onChange={e => {
            const chosen = repositories.find(r => r.id === Number(e.target.value))
            setActiveRepo(chosen || null)
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
      </div>

      {activeRepo && (
        <>
          {/* ── Branch Selector & Creation Bar ── */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 6,
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: 6,
              padding: '6px 8px',
              marginBottom: 10,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 11 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-base)', minWidth: 0, flex: 1 }}>
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
                    maxWidth: 130,
                  }}
                >
                  {branches.map(b => (
                    <option key={b} value={b} style={{ background: 'var(--bg-card)' }}>
                      {b}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <button
                  onClick={() => setShowNewBranchInput(p => !p)}
                  style={{
                    background: showNewBranchInput ? 'var(--accent-subtle)' : 'var(--bg-hover)',
                    border: '1px solid var(--border)',
                    borderRadius: 4,
                    color: showNewBranchInput ? 'var(--accent)' : 'var(--text-muted)',
                    fontSize: 10,
                    padding: '2px 6px',
                    cursor: 'pointer',
                    fontWeight: 600,
                  }}
                  title="Create new branch from active branch"
                >
                  + Branch
                </button>

                <button
                  onClick={() => setShowFileTree(prev => !prev)}
                  style={{
                    background: showFileTree ? 'var(--bg-hover)' : 'transparent',
                    border: '1px solid var(--border)',
                    borderRadius: 4,
                    color: showFileTree ? 'var(--accent)' : 'var(--text-muted)',
                    fontSize: 10,
                    padding: '2px 6px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 3,
                  }}
                  title="Browse repository files"
                >
                  <FolderIcon size={11} />
                  <span>{showFileTree ? 'Hide' : 'Files'}</span>
                </button>
              </div>
            </div>

            {/* Inline New Branch Creator */}
            {showNewBranchInput && (
              <div style={{ display: 'flex', gap: 4, paddingTop: 4, borderTop: '1px solid var(--border)' }}>
                <input
                  type="text"
                  value={newBranchName}
                  onChange={e => setNewBranchName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleCreateBranch()}
                  placeholder="new-branch-name"
                  style={{
                    flex: 1,
                    background: 'var(--bg-app)',
                    border: '1px solid var(--border)',
                    borderRadius: 4,
                    color: 'var(--text-base)',
                    fontSize: 10.5,
                    fontFamily: 'JetBrains Mono',
                    padding: '3px 6px',
                    outline: 'none',
                  }}
                />
                <button
                  onClick={handleCreateBranch}
                  disabled={creatingBranch || !newBranchName.trim()}
                  style={{
                    background: 'var(--accent)',
                    border: 'none',
                    borderRadius: 4,
                    color: '#ffffff',
                    fontSize: 10,
                    fontWeight: 600,
                    padding: '3px 8px',
                    cursor: creatingBranch || !newBranchName.trim() ? 'not-allowed' : 'pointer',
                  }}
                >
                  {creatingBranch ? '...' : 'Create'}
                </button>
                <button
                  onClick={() => {
                    setShowNewBranchInput(false)
                    setNewBranchName('')
                  }}
                  style={{
                    background: 'transparent',
                    border: '1px solid var(--border)',
                    borderRadius: 4,
                    color: 'var(--text-muted)',
                    fontSize: 10,
                    padding: '3px 6px',
                    cursor: 'pointer',
                  }}
                >
                  ✕
                </button>
              </div>
            )}
          </div>

          {/* ── File Explorer Modal (if toggled) ── */}
          {showFileTree && activeRepo && authUser && (
            <div style={{ marginBottom: 12 }}>
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

          {/* ── Mode Switcher: Changes vs History ── */}
          <div
            style={{
              display: 'flex',
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: 6,
              padding: 2,
              marginBottom: 10,
            }}
          >
            <button
              onClick={() => setActiveView('changes')}
              style={{
                flex: 1,
                padding: '5px 8px',
                fontSize: 11,
                fontWeight: activeView === 'changes' ? 700 : 500,
                background: activeView === 'changes' ? 'var(--bg-hover)' : 'transparent',
                color: activeView === 'changes' ? 'var(--text-base)' : 'var(--text-muted)',
                border: 'none',
                borderRadius: 4,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 5,
              }}
            >
              <span>⑂ Changes</span>
              {isModified && (
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#eab308' }} />
              )}
            </button>

            <button
              onClick={() => setActiveView('history')}
              style={{
                flex: 1,
                padding: '5px 8px',
                fontSize: 11,
                fontWeight: activeView === 'history' ? 700 : 500,
                background: activeView === 'history' ? 'var(--bg-hover)' : 'transparent',
                color: activeView === 'history' ? 'var(--text-base)' : 'var(--text-muted)',
                border: 'none',
                borderRadius: 4,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 5,
              }}
            >
              <span>🕒 History</span>
              {commits.length > 0 && (
                <span style={{ fontSize: 9, opacity: 0.7 }}>({commits.length})</span>
              )}
            </button>
          </div>

          {/* ═════════ VIEW 1: CHANGES ═════════ */}
          {activeView === 'changes' && (
            <div>
              {/* Single File vs Batch Switcher */}
              <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
                <button
                  onClick={() => setCommitScope('single')}
                  style={{
                    flex: 1,
                    padding: '4px 8px',
                    fontSize: 10.5,
                    fontWeight: commitScope === 'single' ? 600 : 400,
                    background: commitScope === 'single' ? 'var(--accent-subtle)' : 'var(--bg-card)',
                    color: commitScope === 'single' ? 'var(--accent)' : 'var(--text-muted)',
                    border: `1px solid ${commitScope === 'single' ? 'var(--accent-border)' : 'var(--border)'}`,
                    borderRadius: 5,
                    cursor: 'pointer',
                  }}
                >
                  Active File
                </button>

                <button
                  onClick={() => setCommitScope('all')}
                  style={{
                    flex: 1,
                    padding: '4px 8px',
                    fontSize: 10.5,
                    fontWeight: commitScope === 'all' ? 600 : 400,
                    background: commitScope === 'all' ? 'var(--accent-subtle)' : 'var(--bg-card)',
                    color: commitScope === 'all' ? 'var(--accent)' : 'var(--text-muted)',
                    border: `1px solid ${commitScope === 'all' ? 'var(--accent-border)' : 'var(--border)'}`,
                    borderRadius: 5,
                    cursor: 'pointer',
                  }}
                >
                  All Files ({allTabs.length})
                </button>
              </div>

              {commitScope === 'single' ? (
                <>
                  {/* File card with Visual Diff button */}
                  <div
                    style={{
                      background: 'var(--bg-card)',
                      border: '1px solid var(--border)',
                      borderRadius: 6,
                      padding: '8px 10px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 8,
                      marginBottom: 10,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                      <div
                        style={{
                          width: 18,
                          height: 18,
                          borderRadius: 4,
                          background: isModified ? 'rgba(234, 179, 8, 0.15)' : 'rgba(34, 197, 94, 0.15)',
                          color: isModified ? '#eab308' : '#22c55e',
                          display: 'grid',
                          placeItems: 'center',
                          fontSize: 10,
                          fontWeight: 700,
                          flexShrink: 0,
                        }}
                      >
                        {isModified ? 'M' : isCurrentFileLinked ? '✓' : 'U'}
                      </div>

                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-base)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {targetPath || activeTab.name}
                        </div>
                        <div style={{ fontSize: 9.5, color: 'var(--text-muted)' }}>
                          {isModified ? 'Modified • Changes not committed' : 'Working tree clean'}
                        </div>
                      </div>
                    </div>

                    {/* Open Visual Diff button */}
                    <button
                      onClick={() => onOpenVisualDiff(activeTab.originalCode || '', activeTab.code, activeTab.name)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                        padding: '3px 8px',
                        borderRadius: 4,
                        background: 'var(--bg-hover)',
                        border: '1px solid var(--border)',
                        color: 'var(--accent)',
                        fontSize: 10,
                        fontWeight: 600,
                        cursor: 'pointer',
                        flexShrink: 0,
                      }}
                      title="Open Side-by-Side Visual Diff"
                    >
                      <span>⑂ Diff</span>
                    </button>
                  </div>

                  <label style={{ fontSize: 10, color: 'var(--text-muted)', display: 'block', marginBottom: 3 }}>
                    Target File Path:
                  </label>
                  <input
                    value={targetPath}
                    onChange={e => setTargetPath(e.target.value)}
                    placeholder="e.g. src/index.js or solution.py"
                    className="ide-input"
                    style={{ width: '100%', fontSize: 11, fontFamily: 'JetBrains Mono', marginBottom: 8, padding: '6px 8px' }}
                  />

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 3 }}>
                    <label style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                      Commit Message:
                    </label>
                    <button
                      onClick={handleGenerateAiCommitMsg}
                      disabled={generatingAiMsg}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--accent)',
                        fontSize: 10,
                        fontWeight: 600,
                        cursor: 'pointer',
                        padding: 0,
                      }}
                      title="Generate commit message with CodeForge AI"
                    >
                      {generatingAiMsg ? 'Thinking...' : '✨ AI Message'}
                    </button>
                  </div>

                  <textarea
                    value={commitMessage}
                    onChange={e => setCommitMessage(e.target.value)}
                    placeholder={`e.g. feat: update ${targetPath || activeTab.name}`}
                    onKeyDown={e => {
                      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                        e.preventDefault()
                        handleCommit()
                      }
                    }}
                    style={{
                      width: '100%',
                      height: 54,
                      background: 'var(--bg-app)',
                      border: '1px solid var(--border)',
                      borderRadius: 6,
                      color: 'var(--text-base)',
                      fontSize: 11,
                      padding: '6px 8px',
                      outline: 'none',
                      resize: 'none',
                      marginBottom: 8,
                      fontFamily: 'inherit',
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
                        <SpinnerIcon size={12} className="spin" /> Pushing to GitHub...
                      </>
                    ) : (
                      <>
                        <CheckIcon size={12} /> Commit & Push to {targetBranch || 'main'}
                      </>
                    )}
                  </button>
                </>
              ) : (
                /* Batch commit all files */
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-muted)' }}>
                      Selected ({selectedTabIds.size}/{allTabs.length})
                    </span>
                    <button
                      onClick={() => {
                        if (selectedTabIds.size === allTabs.length) setSelectedTabIds(new Set())
                        else setSelectedTabIds(new Set(allTabs.map(t => t.id)))
                      }}
                      style={{ background: 'none', border: 'none', color: 'var(--accent)', fontSize: 10, cursor: 'pointer', padding: 0 }}
                    >
                      {selectedTabIds.size === allTabs.length ? 'Deselect All' : 'Select All'}
                    </button>
                  </div>

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
                      const tabMod = tab.modified || (tab.originalCode !== undefined && tab.code !== tab.originalCode)
                      return (
                        <div
                          key={tab.id}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '6px 8px',
                            borderBottom: '1px solid var(--border-subtle)',
                            background: isSelected ? 'var(--bg-hover)' : 'transparent',
                          }}
                        >
                          <div
                            onClick={() => {
                              const next = new Set(selectedTabIds)
                              if (next.has(tab.id)) next.delete(tab.id)
                              else next.add(tab.id)
                              setSelectedTabIds(next)
                            }}
                            style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', minWidth: 0, flex: 1 }}
                          >
                            <input type="checkbox" checked={isSelected} onChange={() => {}} style={{ cursor: 'pointer' }} />
                            <span style={{ fontSize: 11, color: 'var(--text-base)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {tab.name}
                            </span>
                            {tabMod && (
                              <span style={{ fontSize: 9, color: '#eab308', fontWeight: 700 }}>M</span>
                            )}
                          </div>

                          <button
                            onClick={() => onOpenVisualDiff(tab.originalCode || '', tab.code, tab.name)}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: 'var(--accent)',
                              fontSize: 10,
                              cursor: 'pointer',
                              padding: '2px 4px',
                            }}
                            title="Open Visual Diff"
                          >
                            Diff
                          </button>
                        </div>
                      )
                    })}
                  </div>

                  <textarea
                    value={commitMessage}
                    onChange={e => setCommitMessage(e.target.value)}
                    placeholder={`e.g. feat: update ${selectedTabIds.size} workspace files`}
                    style={{
                      width: '100%',
                      height: 50,
                      background: 'var(--bg-app)',
                      border: '1px solid var(--border)',
                      borderRadius: 6,
                      color: 'var(--text-base)',
                      fontSize: 11,
                      padding: '6px 8px',
                      outline: 'none',
                      resize: 'none',
                      marginBottom: 8,
                      fontFamily: 'inherit',
                    }}
                  />

                  <button
                    onClick={handleBatchCommit}
                    disabled={batchCommitting || selectedTabIds.size === 0}
                    className="btn btn-primary"
                    style={{ width: '100%', justifyContent: 'center', padding: '8px 12px', fontSize: 11, fontWeight: 600 }}
                  >
                    {batchCommitting ? (
                      <>
                        <SpinnerIcon size={12} className="spin" /> Pushing {batchProgress?.current || 0}/{batchProgress?.total || 0}...
                      </>
                    ) : (
                      <>
                        <CheckIcon size={12} /> Commit & Push ({selectedTabIds.size} files)
                      </>
                    )}
                  </button>
                </div>
              )}

              {/* Notification card for last commit */}
              {lastCommitResult && (
                <div
                  style={{
                    background: 'rgba(34, 197, 94, 0.1)',
                    border: '1px solid rgba(34, 197, 94, 0.3)',
                    borderRadius: 6,
                    padding: '8px 10px',
                    marginTop: 10,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#22c55e', fontSize: 11, fontWeight: 600 }}>
                    <CheckIcon size={12} /> Pushed to GitHub!
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>
                    SHA: <code style={{ color: 'var(--accent)' }}>{lastCommitResult.sha}</code>
                  </div>
                  <a
                    href={lastCommitResult.url}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      color: 'var(--accent)',
                      fontSize: 10,
                      marginTop: 4,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                      textDecoration: 'none',
                    }}
                  >
                    View on GitHub <ExternalLinkIcon size={10} />
                  </a>
                </div>
              )}
            </div>
          )}

          {/* ═════════ VIEW 2: COMMIT HISTORY ═════════ */}
          {activeView === 'history' && (
            <div>
              <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
                <input
                  type="text"
                  value={commitFilter}
                  onChange={e => setCommitFilter(e.target.value)}
                  placeholder="Filter commits by message or author..."
                  style={{
                    flex: 1,
                    background: 'var(--bg-app)',
                    border: '1px solid var(--border)',
                    borderRadius: 5,
                    color: 'var(--text-base)',
                    fontSize: 11,
                    padding: '5px 8px',
                    outline: 'none',
                  }}
                />
                <button
                  onClick={loadCommits}
                  disabled={commitsLoading}
                  style={{
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border)',
                    borderRadius: 5,
                    color: 'var(--text-muted)',
                    padding: '0 8px',
                    cursor: 'pointer',
                  }}
                  title="Reload commit log"
                >
                  <RefreshIcon size={12} />
                </button>
              </div>

              {commitsLoading ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)', fontSize: 11, padding: 12 }}>
                  <SpinnerIcon size={13} className="spin" />
                  <span>Loading commit history...</span>
                </div>
              ) : filteredCommits.length === 0 ? (
                <div style={{ color: 'var(--text-dim)', fontSize: 11, padding: '16px 0', textAlign: 'center' }}>
                  No commits found for branch "{targetBranch}".
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {filteredCommits.map(c => (
                    <div
                      key={c.fullSha}
                      style={{
                        padding: '8px 10px',
                        background: 'var(--bg-card)',
                        border: '1px solid var(--border)',
                        borderRadius: 6,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 4,
                      }}
                    >
                      <div style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--text-base)', lineHeight: 1.4 }}>
                        {c.message}
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 10, color: 'var(--text-muted)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                          {c.authorAvatar && (
                            <img
                              src={c.authorAvatar}
                              alt=""
                              style={{ width: 14, height: 14, borderRadius: '50%' }}
                            />
                          )}
                          <span>{c.authorName}</span>
                          <span>•</span>
                          <span>{c.date ? new Date(c.date).toLocaleDateString() : ''}</span>
                        </div>

                        <a
                          href={c.html_url}
                          target="_blank"
                          rel="noreferrer"
                          style={{
                            color: 'var(--accent)',
                            fontFamily: 'JetBrains Mono',
                            textDecoration: 'none',
                            background: 'var(--bg-hover)',
                            border: '1px solid var(--border)',
                            padding: '1px 5px',
                            borderRadius: 3,
                            fontSize: 9.5,
                          }}
                          title="Open commit on GitHub"
                        >
                          #{c.sha}
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}

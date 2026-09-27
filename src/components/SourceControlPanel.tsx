import { useState, useEffect } from 'react'
import type { AuthUser } from '../lib/storage'
import {
  type GitHubRepository,
  type RepoTreeItem,
  type GitHubCommitSummary,
  getRepoTree,
  getRepoFileContent,
  commitOrUpdateRepoFile,
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
  onCommitSuccess: (tabId: string, newSha: string, commitUrl: string, commitSha: string) => void
  onConnectGitHub: () => void
  onRefreshRepos: () => void
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
  onCommitSuccess,
  onConnectGitHub,
  onRefreshRepos,
  showToast,
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

  if (!authUser) {
    return (
      <div style={{ padding: '16px 12px', flex: 1, overflowY: 'auto' }}>
        <div
          style={{
            background: 'linear-gradient(180deg, #1c2128 0%, #161b22 100%)',
            border: '1px solid #30363d',
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
              background: '#21262d',
              color: '#e6edf3',
              display: 'grid',
              placeItems: 'center',
              margin: '0 auto 10px',
            }}
          >
            <GitCommitIcon size={20} />
          </div>
          <div style={{ color: '#e6edf3', fontWeight: 600, fontSize: 13, marginBottom: 4 }}>
            Source Control & GitHub
          </div>
          <p style={{ color: '#7d8590', fontSize: 11, lineHeight: 1.5, marginBottom: 14 }}>
            Sign in with GitHub to view your repositories, edit repository code, and commit changes just like in VS Code.
          </p>
          <button
            onClick={onConnectGitHub}
            className="btn btn-primary"
            style={{ width: '100%', justifyContent: 'center', fontSize: 12, padding: '7px 12px' }}
          >
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
      {/* ── Active Repository Selector ─────────────────────────────────── */}
      <div style={{ marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 5 }}>
          <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', color: '#7d8590' }}>
            REPOSITORY
          </span>
          <div style={{ display: 'flex', gap: 6 }}>
            <button
              onClick={onRefreshRepos}
              title="Refresh repositories"
              style={{ background: 'none', border: 'none', color: '#7d8590', cursor: 'pointer', padding: 2 }}
            >
              <RefreshIcon size={12} />
            </button>
            {activeRepo && (
              <a
                href={activeRepo.html_url}
                target="_blank"
                rel="noreferrer"
                title="Open on GitHub"
                style={{ color: '#7d8590', display: 'flex', alignItems: 'center' }}
              >
                <ExternalLinkIcon size={12} />
              </a>
            )}
          </div>
        </div>

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
      </div>

      {activeRepo && (
        <>
          {/* ── Branch and File Tree Quick Bar ──────────────────────────── */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: '#0d1117',
              border: '1px solid #21262d',
              borderRadius: 6,
              padding: '6px 8px',
              marginBottom: 10,
              fontSize: 11,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#c9d1d9', minWidth: 0 }}>
              <GitBranchIcon size={13} style={{ color: '#a78bfa', flexShrink: 0 }} />
              <select
                value={targetBranch}
                onChange={e => setTargetBranch(e.target.value)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#e6edf3',
                  fontSize: 11,
                  fontFamily: 'JetBrains Mono',
                  cursor: 'pointer',
                  outline: 'none',
                  maxWidth: 110,
                }}
              >
                {branches.map(b => (
                  <option key={b} value={b} style={{ background: '#161b22' }}>
                    {b}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={() => {
                if (showFileTree) {
                  setShowFileTree(false)
                } else {
                  loadTree()
                }
              }}
              style={{
                background: showFileTree ? '#21262d' : 'transparent',
                border: '1px solid #30363d',
                borderRadius: 4,
                color: '#c9d1d9',
                fontSize: 10,
                padding: '3px 7px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 4,
              }}
            >
              {treeLoading ? <SpinnerIcon size={10} /> : <FolderIcon size={11} />}
              {showFileTree ? 'Hide Files' : 'Browse Files'}
            </button>
          </div>

          {/* ── File Tree Viewer (if toggled) ────────────────────────── */}
          {showFileTree && (
            <div
              style={{
                background: '#0d1117',
                border: '1px solid #30363d',
                borderRadius: 6,
                padding: '8px',
                marginBottom: 12,
                maxHeight: 200,
                overflowY: 'auto',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: 10, fontWeight: 700, color: '#7d8590' }}>
                  FILES IN REPO ({treeItems.filter(i => i.type === 'blob').length})
                </span>
                <input
                  value={treeFilter}
                  onChange={e => setTreeFilter(e.target.value)}
                  placeholder="Filter files..."
                  style={{
                    background: '#161b22',
                    border: '1px solid #21262d',
                    borderRadius: 4,
                    color: '#c9d1d9',
                    fontSize: 10,
                    padding: '2px 6px',
                    width: 90,
                    outline: 'none',
                  }}
                />
              </div>

              {treeLoading ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#7d8590', fontSize: 11, padding: 8 }}>
                  <SpinnerIcon size={13} /> Loading repository tree...
                </div>
              ) : treeItems.length === 0 ? (
                <div style={{ color: '#484f58', fontSize: 11, padding: '6px 4px' }}>No files found in this branch.</div>
              ) : (
                treeItems
                  .filter(item => item.type === 'blob')
                  .filter(item => (!treeFilter ? true : item.path.toLowerCase().includes(treeFilter.toLowerCase())))
                  .slice(0, 50)
                  .map(item => (
                    <div
                      key={item.sha}
                      onClick={() => handleOpenFile(item)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '4px 6px',
                        borderRadius: 4,
                        cursor: 'pointer',
                        fontSize: 11,
                        color: activeTab.repoPath === item.path ? '#a78bfa' : '#c9d1d9',
                        background: activeTab.repoPath === item.path ? '#7c3aed15' : 'transparent',
                      }}
                      onMouseEnter={e => {
                        if (activeTab.repoPath !== item.path) e.currentTarget.style.background = '#161b22'
                      }}
                      onMouseLeave={e => {
                        if (activeTab.repoPath !== item.path) e.currentTarget.style.background = 'transparent'
                      }}
                    >
                      <span
                        style={{
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          fontFamily: 'JetBrains Mono',
                          fontSize: 10,
                        }}
                      >
                        {item.path}
                      </span>
                      {loadingFilePath === item.path ? (
                        <SpinnerIcon size={10} />
                      ) : (
                        <span style={{ fontSize: 9, color: '#7d8590' }}>Open</span>
                      )}
                    </div>
                  ))
              )}
            </div>
          )}

          {/* ── Working Tree Changes (VS Code style) ────────────────────── */}
          <div style={{ borderTop: '1px solid #21262d', paddingTop: 10, marginBottom: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', color: '#7d8590' }}>
                CHANGES TO COMMIT
              </span>
              <span style={{ fontSize: 10, color: isModified ? '#d29922' : '#3fb950', fontWeight: 600 }}>
                {isModified ? '1 modified' : 'Up to date'}
              </span>
            </div>

            {/* Active file card */}
            <div
              style={{
                background: '#0d1117',
                border: '1px solid #21262d',
                borderRadius: 6,
                padding: '8px 10px',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
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
                    color: '#e6edf3',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {targetPath || activeTab.name}
                </div>
                <div style={{ fontSize: 9, color: '#7d8590' }}>
                  {isCurrentFileLinked ? `Linked to ${activeRepo.name}` : `Will be committed to ${activeRepo.name}`}
                </div>
              </div>
            </div>
          </div>

          {/* ── Commit Message and Push Box (VS Code style) ─────────────── */}
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', color: '#7d8590', marginBottom: 6 }}>
              COMMIT & PUSH
            </div>

            <label style={{ fontSize: 10, color: '#7d8590', display: 'block', marginBottom: 3 }}>
              Target File Path in Repo:
            </label>
            <input
              value={targetPath}
              onChange={e => setTargetPath(e.target.value)}
              placeholder="e.g. src/index.js or solution.py"
              className="ide-input"
              style={{ width: '100%', fontSize: 11, fontFamily: 'JetBrains Mono', marginBottom: 8, padding: '6px 8px' }}
            />

            <label style={{ fontSize: 10, color: '#7d8590', display: 'block', marginBottom: 3 }}>
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
                background: '#0d1117',
                border: '1px solid #30363d',
                borderRadius: 6,
                color: '#e6edf3',
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
            <div style={{ fontSize: 9, color: '#484f58', textAlign: 'center', marginTop: 4 }}>
              Shortcut: <kbd style={{ background: '#21262d', padding: '1px 4px', borderRadius: 3 }}>⌘↵</kbd> or <kbd style={{ background: '#21262d', padding: '1px 4px', borderRadius: 3 }}>Ctrl+Enter</kbd>
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
          <div style={{ borderTop: '1px solid #21262d', paddingTop: 10 }}>
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
              <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', color: '#7d8590' }}>
                RECENT COMMITS ({commits.length})
              </span>
              <span style={{ fontSize: 10, color: '#7d8590' }}>{showCommits ? '▲' : '▼'}</span>
            </div>

            {showCommits && (
              <div style={{ marginTop: 6 }}>
                {commitsLoading ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#7d8590', fontSize: 11, padding: 8 }}>
                    <SpinnerIcon size={12} /> Loading commits...
                  </div>
                ) : commits.length === 0 ? (
                  <div style={{ color: '#484f58', fontSize: 11, padding: '4px 0' }}>No commits found.</div>
                ) : (
                  commits.map(c => (
                    <div
                      key={c.fullSha}
                      style={{
                        padding: '6px 8px',
                        background: '#0d1117',
                        border: '1px solid #21262d',
                        borderRadius: 5,
                        marginBottom: 4,
                        fontSize: 11,
                      }}
                    >
                      <div
                        style={{
                          color: '#e6edf3',
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
                          color: '#7d8590',
                          fontSize: 9,
                          marginTop: 3,
                        }}
                      >
                        <span>{c.authorName}</span>
                        <a
                          href={c.html_url}
                          target="_blank"
                          rel="noreferrer"
                          style={{ color: '#7c3aed', fontFamily: 'JetBrains Mono', textDecoration: 'none' }}
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

import { useState } from 'react'
import type { AuthUser } from '../lib/storage'
import {
  type GitHubRepository,
  type RepoTreeItem,
  createGitHubRepository,
  getRepoTree,
  getRepoFileContent,
} from '../lib/github'
import {
  GitBranchIcon,
  RepoIcon,
  RefreshIcon,
  ExternalLinkIcon,
  FolderIcon,
  SpinnerIcon,
  PlusIcon,
} from './icons'
import type { TabWithRepo } from './SourceControlPanel'
import GitHubRepoBrowser from './GitHubRepoBrowser'

interface Props {
  authUser: AuthUser | null
  repositories: GitHubRepository[]
  activeTab: TabWithRepo
  onConnectGitHub: () => void
  onRefreshRepos: () => void
  onSelectRepoForCommit: (repo: GitHubRepository) => void
  onOpenFileFromRepo: (
    repo: GitHubRepository,
    path: string,
    content: string,
    sha: string,
    branch: string
  ) => void
  showToast: (msg: string) => void
}

export default function GitHubSettingsTab({
  authUser,
  repositories,
  activeTab,
  onConnectGitHub,
  onRefreshRepos,
  onSelectRepoForCommit,
  onOpenFileFromRepo,
  showToast,
}: Props) {
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState<'all' | 'public' | 'private'>('all')

  // Create repo state
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newRepoName, setNewRepoName] = useState('')
  const [newRepoDesc, setNewRepoDesc] = useState('')
  const [newRepoPrivate, setNewRepoPrivate] = useState(false)
  const [creatingRepo, setCreatingRepo] = useState(false)
  const [createError, setCreateError] = useState('')

  // In-modal repo file exploration
  const [expandedRepoId, setExpandedRepoId] = useState<number | null>(null)
  const [repoTree, setRepoTree] = useState<RepoTreeItem[]>([])
  const [treeLoading, setTreeLoading] = useState(false)
  const [loadingFilePath, setLoadingFilePath] = useState<string | null>(null)

  // Filter repositories
  const filteredRepos = repositories.filter(repo => {
    const matchesSearch =
      repo.name.toLowerCase().includes(search.toLowerCase()) ||
      (repo.description && repo.description.toLowerCase().includes(search.toLowerCase()))
    const matchesType =
      filterType === 'all' ? true : filterType === 'private' ? repo.private : !repo.private
    return matchesSearch && matchesType
  })

  // Handle repository creation
  const handleCreateRepo = async () => {
    if (!authUser?.accessToken || !newRepoName.trim()) return
    setCreatingRepo(true)
    setCreateError('')
    try {
      const created = await createGitHubRepository(
        authUser.accessToken,
        newRepoName.trim(),
        newRepoDesc.trim(),
        newRepoPrivate
      )
      showToast(`Repository ${created.name} created!`)
      setNewRepoName('')
      setNewRepoDesc('')
      setNewRepoPrivate(false)
      setShowCreateModal(false)
      setCreateError('')
      onRefreshRepos()
    } catch (err: any) {
      const msg = err.message || 'Failed to create repository'
      setCreateError(msg)
      showToast(msg)
    } finally {
      setCreatingRepo(false)
    }
  }

  // Handle expanding file tree of a repo
  const handleToggleExplore = async (repo: GitHubRepository) => {
    if (expandedRepoId === repo.id) {
      setExpandedRepoId(null)
      setRepoTree([])
      return
    }

    if (!authUser?.accessToken) return
    setExpandedRepoId(repo.id)
    setTreeLoading(true)
    try {
      const owner = repo.owner?.login || authUser.login || authUser.name
      const branch = repo.default_branch || 'main'
      const items = await getRepoTree(authUser.accessToken, owner, repo.name, branch)
      setRepoTree(items)
    } catch (err: any) {
      showToast(err.message || 'Failed to load repository files')
      setExpandedRepoId(null)
    } finally {
      setTreeLoading(false)
    }
  }

  // Handle loading a file from the explorer into the editor
  const handleLoadFile = async (repo: GitHubRepository, item: RepoTreeItem) => {
    if (!authUser?.accessToken || item.type === 'tree') return
    setLoadingFilePath(item.path)
    try {
      const owner = repo.owner?.login || authUser.login || authUser.name
      const branch = repo.default_branch || 'main'
      const fileData = await getRepoFileContent(authUser.accessToken, owner, repo.name, item.path, branch)
      onOpenFileFromRepo(repo, fileData.path, fileData.content, fileData.sha, branch)
      showToast(`Opened ${fileData.name} in editor`)
    } catch (err: any) {
      showToast(err.message || 'Failed to load file')
    } finally {
      setLoadingFilePath(null)
    }
  }

  if (!authUser) {
    return (
      <div style={{ padding: '24px 16px', textAlign: 'center' }}>
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: '50%',
            background: 'var(--bg-hover)',
            display: 'grid',
            placeItems: 'center',
            margin: '0 auto 14px',
            color: 'var(--accent)',
          }}
        >
          <RepoIcon size={24} />
        </div>
        <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-base)', marginBottom: 6 }}>
          GitHub Repositories
        </div>
        <p style={{ color: 'var(--text-muted)', fontSize: 13, maxWidth: 360, margin: '0 auto 20px', lineHeight: 1.6 }}>
          Connect your GitHub account to access all your public and private repositories, explore code files, and commit directly from CodeForge.
        </p>
        <button onClick={onConnectGitHub} className="btn btn-primary" style={{ padding: '8px 22px', fontSize: 13 }}>
          Connect GitHub Account
        </button>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* ── Top Bar: Search, Filters & Action ──────────────────────── */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 10,
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 14,
        }}
      >
        <div style={{ display: 'flex', gap: 8, flex: 1, minWidth: 220 }}>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search repositories..."
            className="ide-input"
            style={{ flex: 1, fontSize: 12, padding: '6px 10px' }}
          />
          <select
            value={filterType}
            onChange={e => setFilterType(e.target.value as any)}
            className="ide-input"
            style={{ fontSize: 12, padding: '6px 8px', cursor: 'pointer', width: 90 }}
          >
            <option value="all">All</option>
            <option value="public">Public</option>
            <option value="private">Private</option>
          </select>
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={onRefreshRepos}
            title="Refresh repository list"
            className="btn btn-ghost"
            style={{ padding: '6px 10px', fontSize: 12, gap: 5 }}
          >
            <RefreshIcon size={13} /> Refresh
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn btn-primary"
            style={{ padding: '6px 12px', fontSize: 12, gap: 5 }}
          >
            <PlusIcon size={13} /> New Repo
          </button>
        </div>
      </div>

      {/* ── Scope Warning Banner ────────────────────────────────────── */}
      {authUser?.scopes && !authUser.scopes.includes('repo') && (
        <div
          style={{
            background: 'rgba(210, 153, 34, 0.12)',
            border: '1px solid rgba(210, 153, 34, 0.35)',
            borderRadius: 8,
            padding: '10px 14px',
            marginBottom: 14,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
          }}
        >
          <div style={{ fontSize: 12, color: 'var(--yellow, #d29922)', lineHeight: 1.5 }}>
            <strong>⚠️ Repository Access Needed:</strong> Your current GitHub connection is Read-Only. To create new repositories or commit code, please re-authorize with repository write permissions.
          </div>
          <button
            onClick={onConnectGitHub}
            className="btn btn-primary"
            style={{ padding: '5px 12px', fontSize: 11, whiteSpace: 'nowrap', flexShrink: 0 }}
          >
            Grant Repo Access
          </button>
        </div>
      )}

      {/* ── Create Repo Modal/Drawer ─────────────────────────────────── */}
      {showCreateModal && (
        <div
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: 8,
            padding: 14,
            marginBottom: 14,
          }}
        >
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-base)', marginBottom: 8 }}>
            Create New GitHub Repository
          </div>

          {createError && (
            <div
              style={{
                background: 'rgba(248, 81, 73, 0.1)',
                border: '1px solid rgba(248, 81, 73, 0.35)',
                borderRadius: 6,
                padding: '8px 12px',
                color: '#ff7b72',
                fontSize: 12,
                marginBottom: 10,
                lineHeight: 1.5,
              }}
            >
              <div style={{ fontWeight: 600, marginBottom: 2 }}>⚠️ Could Not Create Repository</div>
              <div>{createError}</div>
              {(createError.includes('Permission') || createError.includes('Sign In') || createError.includes('repo')) && (
                <button
                  onClick={onConnectGitHub}
                  className="btn btn-primary"
                  style={{ marginTop: 8, padding: '4px 12px', fontSize: 11 }}
                >
                  Re-authorize GitHub with Repo Permissions
                </button>
              )}
            </div>
          )}

          <input
            value={newRepoName}
            onChange={e => {
              setNewRepoName(e.target.value)
              if (createError) setCreateError('')
            }}
            placeholder="Repository name (e.g. my-awesome-app)"
            className="ide-input"
            style={{ width: '100%', marginBottom: newRepoName.includes(' ') ? 4 : 8, fontSize: 12 }}
          />

          {newRepoName.trim() && newRepoName.includes(' ') && (
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 8 }}>
              💡 Will be created as: <code style={{ color: 'var(--accent)' }}>{newRepoName.trim().replace(/\s+/g, '-')}</code>
            </div>
          )}

          <input
            value={newRepoDesc}
            onChange={e => setNewRepoDesc(e.target.value)}
            placeholder="Description (optional)"
            className="ide-input"
            style={{ width: '100%', marginBottom: 8, fontSize: 12 }}
          />
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-base)', fontSize: 12, cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={newRepoPrivate}
                onChange={e => setNewRepoPrivate(e.target.checked)}
              />
              Private repository
            </label>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={() => {
                  setShowCreateModal(false)
                  setCreateError('')
                }}
                className="btn btn-ghost"
                style={{ padding: '5px 12px', fontSize: 11 }}
              >
                Cancel
              </button>
              <button
                onClick={handleCreateRepo}
                disabled={creatingRepo || !newRepoName.trim()}
                className="btn btn-primary"
                style={{ padding: '5px 14px', fontSize: 11, gap: 5 }}
              >
                {creatingRepo ? <SpinnerIcon size={12} /> : null} Create Repo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Repository List ─────────────────────────────────────────── */}
      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8, paddingRight: 4 }}>
        {filteredRepos.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '30px 10px', color: 'var(--text-muted)', fontSize: 13 }}>
            {repositories.length === 0 ? 'No repositories found.' : 'No repositories match your search.'}
          </div>
        ) : (
          filteredRepos.map(repo => {
            const isExpanded = expandedRepoId === repo.id
            return (
              <div
                key={repo.id}
                style={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border)',
                  borderRadius: 8,
                  padding: '12px 14px',
                  transition: 'border-color 0.15s, background 0.15s',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <span style={{ color: 'var(--accent)', fontWeight: 600, fontSize: 13 }}>{repo.name}</span>
                      <span
                        style={{
                          fontSize: 9,
                          padding: '1px 6px',
                          borderRadius: 10,
                          border: '1px solid var(--border)',
                          color: repo.private ? 'var(--yellow)' : 'var(--text-muted)',
                          background: repo.private ? 'rgba(210, 153, 34, 0.12)' : 'var(--bg-hover)',
                        }}
                      >
                        {repo.private ? 'Private' : 'Public'}
                      </span>
                      {repo.language && (
                        <span style={{ fontSize: 10, color: 'var(--accent)' }}>• {repo.language}</span>
                      )}
                      <span style={{ fontSize: 10, color: 'var(--text-muted)', display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                        <GitBranchIcon size={11} /> {repo.default_branch || 'main'}
                      </span>
                    </div>

                    {repo.description && (
                      <div
                        style={{
                          color: 'var(--text-muted)',
                          fontSize: 11,
                          marginTop: 4,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {repo.description}
                      </div>
                    )}
                  </div>

                  <a
                    href={repo.html_url}
                    target="_blank"
                    rel="noreferrer"
                    title="View on GitHub"
                    style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', padding: 4 }}
                  >
                    <ExternalLinkIcon size={13} />
                  </a>
                </div>

                {/* ── Action Buttons for this Repo ────────────────────── */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
                  <button
                    onClick={() => handleToggleExplore(repo)}
                    className="btn btn-ghost"
                    style={{
                      padding: '4px 9px',
                      fontSize: 11,
                      gap: 5,
                      background: isExpanded ? 'var(--bg-hover)' : undefined,
                    }}
                  >
                    {isExpanded && treeLoading ? (
                      <SpinnerIcon size={11} />
                    ) : (
                      <FolderIcon size={12} />
                    )}
                    {isExpanded ? 'Close Files' : 'Explore Files'}
                  </button>

                  <button
                    onClick={() => onSelectRepoForCommit(repo)}
                    className="btn btn-primary"
                    style={{ padding: '4px 10px', fontSize: 11, gap: 5 }}
                    title={`Commit code from active tab (${activeTab.name}) into this repo`}
                  >
                    ⚡ Commit Code Here
                  </button>

                  <div style={{ marginLeft: 'auto', fontSize: 10, color: 'var(--text-muted)' }}>
                    Updated {new Date(repo.updated_at).toLocaleDateString()}
                  </div>
                </div>

                {/* ── True GitHub File & Folder Explorer (when expanded) ─────────── */}
                {isExpanded && authUser?.accessToken && (
                  <div style={{ marginTop: 12 }}>
                    <GitHubRepoBrowser
                      accessToken={authUser.accessToken}
                      repository={repo}
                      currentBranch={repo.default_branch || 'main'}
                      onOpenFile={(fileData) => {
                        onOpenFileFromRepo(repo, fileData.path, fileData.content, fileData.sha, fileData.branch)
                        showToast(`Opened ${fileData.name} in editor`)
                      }}
                    />
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

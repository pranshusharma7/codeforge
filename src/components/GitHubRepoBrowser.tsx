import React, { useState, useEffect, useMemo } from 'react'
import {
  type RepoTreeItem,
  type GitHubRepository,
  getRepoTree,
  getRepoBranches,
  getRepoFileContent,
} from '../lib/github'
import FileIcon from './FileIcon'
import { FolderIcon, GitBranchIcon, SpinnerIcon, RefreshIcon, XIcon } from './icons'

interface Props {
  accessToken?: string
  repository: GitHubRepository
  currentBranch?: string
  onOpenFile: (fileData: { path: string; name: string; content: string; sha: string; branch: string }) => void
  onImportMultipleFiles?: (files: { path: string; name: string; content: string; sha: string; branch: string }[]) => void
  onClose?: () => void
  isModal?: boolean
}

function formatBytes(bytes?: number): string {
  if (bytes === undefined || bytes === null || bytes === 0) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export default function GitHubRepoBrowser({
  accessToken,
  repository,
  currentBranch: initialBranch,
  onOpenFile,
  onImportMultipleFiles,
  onClose,
  isModal = false,
}: Props) {
  const [branch, setBranch] = useState(initialBranch || repository.default_branch || 'main')
  const [branches, setBranches] = useState<string[]>([])
  const [treeItems, setTreeItems] = useState<RepoTreeItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentPath, setCurrentPath] = useState<string>('')
  const [filterQuery, setFilterQuery] = useState('')
  const [loadingPath, setLoadingPath] = useState<string | null>(null)
  const [importingAll, setImportingAll] = useState(false)
  const [importProgress, setImportProgress] = useState<{ current: number; total: number } | null>(null)

  const owner = repository.owner?.login || repository.full_name?.split('/')[0] || ''
  const repoName = repository.name

  // Load branches
  useEffect(() => {
    let cancelled = false
    async function loadBranches() {
      if (!accessToken) return
      try {
        const list = await getRepoBranches(accessToken, owner, repoName)
        if (!cancelled && list.length > 0) {
          setBranches(list)
          if (!list.includes(branch)) {
            setBranch(list[0])
          }
        }
      } catch {
        if (!cancelled) setBranches(['main', 'master'])
      }
    }
    loadBranches()
    return () => { cancelled = true }
  }, [accessToken, owner, repoName])

  // Load tree when branch changes
  const fetchTree = async () => {
    if (!accessToken) return
    setLoading(true)
    setError(null)
    try {
      const items = await getRepoTree(accessToken, owner, repoName, branch)
      setTreeItems(items)
    } catch (err: any) {
      setError(err.message || 'Failed to load repository files')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTree()
    setCurrentPath('')
  }, [accessToken, owner, repoName, branch])

  // Breadcrumbs segments
  const breadcrumbSegments = useMemo(() => {
    if (!currentPath) return []
    return currentPath.split('/').filter(Boolean)
  }, [currentPath])

  // Navigate to breadcrumb
  const navigateToBreadcrumb = (index: number) => {
    if (index === -1) {
      setCurrentPath('')
    } else {
      const newPath = breadcrumbSegments.slice(0, index + 1).join('/')
      setCurrentPath(newPath)
    }
  }

  // Go up one level
  const navigateUp = () => {
    if (!currentPath) return
    const segs = currentPath.split('/')
    segs.pop()
    setCurrentPath(segs.join('/'))
  }

  // Current directory items (folders and files)
  const { currentFolders, currentFiles, filteredAllFiles } = useMemo(() => {
    if (filterQuery.trim()) {
      const q = filterQuery.toLowerCase().trim()
      const filtered = treeItems
        .filter(i => i.type === 'blob' && i.path.toLowerCase().includes(q))
        .slice(0, 100)
      return { currentFolders: [], currentFiles: [], filteredAllFiles: filtered }
    }

    const prefix = currentPath ? `${currentPath}/` : ''
    const folderMap = new Map<string, number>()
    const files: RepoTreeItem[] = []

    for (const item of treeItems) {
      if (currentPath) {
        if (!item.path.startsWith(prefix)) continue
        const sub = item.path.slice(prefix.length)
        if (sub.includes('/')) {
          const topFolder = sub.split('/')[0]
          folderMap.set(topFolder, (folderMap.get(topFolder) || 0) + 1)
        } else {
          if (item.type === 'blob') files.push(item)
          else if (item.type === 'tree') folderMap.set(sub, folderMap.get(sub) || 0)
        }
      } else {
        // Root directory
        if (item.path.includes('/')) {
          const topFolder = item.path.split('/')[0]
          folderMap.set(topFolder, (folderMap.get(topFolder) || 0) + 1)
        } else {
          if (item.type === 'blob') files.push(item)
          else if (item.type === 'tree') folderMap.set(item.path, folderMap.get(item.path) || 0)
        }
      }
    }

    const folders = Array.from(folderMap.entries())
      .map(([name, count]) => ({
        name,
        count,
        fullPath: currentPath ? `${currentPath}/${name}` : name,
      }))
      .sort((a, b) => a.name.localeCompare(b.name))

    files.sort((a, b) => a.path.localeCompare(b.path))

    return { currentFolders: folders, currentFiles: files, filteredAllFiles: [] }
  }, [treeItems, currentPath, filterQuery])

  // Open single file
  const handleFileClick = async (item: RepoTreeItem) => {
    if (loadingPath || !accessToken) return
    setLoadingPath(item.path)
    try {
      const data = await getRepoFileContent(accessToken, owner, repoName, item.path, branch)
      onOpenFile({
        path: data.path,
        name: data.name,
        content: data.content,
        sha: data.sha,
        branch,
      })
    } catch (err: any) {
      alert(`Could not open file: ${err.message}`)
    } finally {
      setLoadingPath(null)
    }
  }

  // Import all files in the current folder or a specific directory
  const handleImportDirectory = async (folderPathPrefix?: string) => {
    if (!onImportMultipleFiles || importingAll || !accessToken) return
    const targetPath = folderPathPrefix !== undefined ? folderPathPrefix : currentPath
    const targetBlobs = targetPath
      ? treeItems.filter(i => i.type === 'blob' && (i.path === targetPath || i.path.startsWith(`${targetPath}/`)))
      : treeItems.filter(i => i.type === 'blob')

    if (targetBlobs.length === 0) {
      alert('No files found to import in this folder.')
      return
    }

    // Skip large binaries, images, archives, lockfiles, and git internals
    const validBlobs = targetBlobs.filter(item => {
      const p = item.path.toLowerCase()
      if (p.includes('/.git/') || p.startsWith('.git/')) return false
      if (p.includes('/node_modules/') || p.startsWith('node_modules/')) return false
      if (
        p.endsWith('.png') || p.endsWith('.jpg') || p.endsWith('.jpeg') ||
        p.endsWith('.gif') || p.endsWith('.ico') || p.endsWith('.webp') ||
        p.endsWith('.pdf') || p.endsWith('.zip') || p.endsWith('.tar') ||
        p.endsWith('.gz') || p.endsWith('.exe') || p.endsWith('.wasm') ||
        p.endsWith('.mp4') || p.endsWith('.mp3')
      ) return false
      if (item.size && item.size > 1024 * 1024) return false
      return true
    })

    if (validBlobs.length === 0) {
      alert('No text or code files found to import in this folder.')
      return
    }

    setImportingAll(true)
    setImportProgress({ current: 0, total: validBlobs.length })
    const imported: { path: string; name: string; content: string; sha: string; branch: string }[] = []

    try {
      const BATCH_SIZE = 8
      for (let i = 0; i < validBlobs.length; i += BATCH_SIZE) {
        const batch = validBlobs.slice(i, i + BATCH_SIZE)
        const settled = await Promise.allSettled(
          batch.map(item => getRepoFileContent(accessToken, owner, repoName, item.path, branch))
        )
        for (const res of settled) {
          if (res.status === 'fulfilled' && res.value) {
            imported.push({
              path: res.value.path,
              name: res.value.name,
              content: res.value.content,
              sha: res.value.sha,
              branch,
            })
          }
        }
        setImportProgress({ current: Math.min(i + batch.length, validBlobs.length), total: validBlobs.length })
      }

      if (imported.length > 0) {
        onImportMultipleFiles(imported)
      } else {
        alert('Could not import files from GitHub. Please check your network or repository permissions.')
      }
    } catch (err: any) {
      console.error('Failed to import directory:', err)
      alert(`Import failed: ${err.message}`)
    } finally {
      setImportingAll(false)
      setImportProgress(null)
    }
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        minHeight: isModal ? 540 : 380,
        maxHeight: isModal ? '85vh' : 580,
        background: 'var(--bg-app)',
        color: 'var(--text-base)',
        fontFamily: 'Inter, -apple-system, sans-serif',
        fontSize: 12,
        borderRadius: 8,
        overflow: 'hidden',
        border: '1px solid var(--border)',
      }}
    >
      {/* ── Top GitHub Header ────────────────────────────────────────── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 14px',
          background: 'var(--bg-card)',
          borderBottom: '1px solid var(--border)',
          gap: 12,
          flexWrap: 'wrap',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
          <span style={{ fontSize: 16 }}>🐙</span>
          <span style={{ fontWeight: 600, color: 'var(--text-base)', fontSize: 13 }}>
            <span style={{ color: 'var(--text-muted)' }}>{owner}/</span>
            <span style={{ color: 'var(--accent)' }}>{repoName}</span>
          </span>
          <span
            style={{
              fontSize: 10,
              padding: '1px 6px',
              borderRadius: 10,
              border: '1px solid var(--border)',
              color: repository.private ? 'var(--yellow)' : 'var(--text-muted)',
              background: repository.private ? 'rgba(210, 153, 34, 0.12)' : 'var(--bg-hover)',
            }}
          >
            {repository.private ? 'Private' : 'Public'}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {/* Branch Switcher */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              background: 'var(--bg-input, var(--bg-app))',
              border: '1px solid var(--border)',
              borderRadius: 6,
              padding: '2px 8px',
            }}
          >
            <GitBranchIcon size={12} style={{ color: 'var(--accent)' }} />
            <select
              value={branch}
              onChange={e => setBranch(e.target.value)}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-base)',
                fontSize: 11,
                fontWeight: 600,
                outline: 'none',
                cursor: 'pointer',
              }}
            >
              {branches.map(b => (
                <option key={b} value={b} style={{ background: 'var(--bg-card)', color: 'var(--text-base)' }}>
                  {b}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={fetchTree}
            title="Refresh repository tree"
            style={{
              background: 'transparent',
              border: '1px solid var(--border)',
              borderRadius: 6,
              color: 'var(--text-muted)',
              padding: '4px 6px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <RefreshIcon size={12} />
          </button>

          {isModal && onClose && (
            <button
              onClick={onClose}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                padding: 4,
              }}
            >
              <XIcon size={14} />
            </button>
          )}
        </div>
      </div>

      {/* ── Breadcrumb & Search Bar ──────────────────────────────────── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '8px 14px',
          background: 'var(--bg-app)',
          borderBottom: '1px solid var(--border)',
          gap: 10,
          flexWrap: 'wrap',
        }}
      >
        {/* GitHub Breadcrumbs */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap', fontSize: 12 }}>
          <button
            onClick={() => navigateToBreadcrumb(-1)}
            style={{
              background: 'none',
              border: 'none',
              color: currentPath ? 'var(--accent)' : 'var(--text-base)',
              fontWeight: currentPath ? 600 : 700,
              cursor: 'pointer',
              padding: '2px 4px',
              borderRadius: 4,
            }}
            onMouseEnter={e => (e.currentTarget.style.textDecoration = 'underline')}
            onMouseLeave={e => (e.currentTarget.style.textDecoration = 'none')}
          >
            {repoName}
          </button>

          {breadcrumbSegments.map((seg, idx) => (
            <React.Fragment key={idx}>
              <span style={{ color: 'var(--text-muted)' }}>/</span>
              <button
                onClick={() => navigateToBreadcrumb(idx)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: idx === breadcrumbSegments.length - 1 ? 'var(--text-base)' : 'var(--accent)',
                  fontWeight: idx === breadcrumbSegments.length - 1 ? 700 : 600,
                  cursor: 'pointer',
                  padding: '2px 4px',
                  borderRadius: 4,
                }}
                onMouseEnter={e => (e.currentTarget.style.textDecoration = 'underline')}
                onMouseLeave={e => (e.currentTarget.style.textDecoration = 'none')}
              >
                {seg}
              </button>
            </React.Fragment>
          ))}
        </div>

        {/* Search input & Import All */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ position: 'relative' }}>
            <input
              type="text"
              placeholder="🔍 Go to file..."
              value={filterQuery}
              onChange={e => setFilterQuery(e.target.value)}
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border)',
                borderRadius: 6,
                padding: '4px 8px',
                fontSize: 11,
                color: 'var(--text-base)',
                outline: 'none',
                width: 140,
              }}
            />
            {filterQuery && (
              <button
                onClick={() => setFilterQuery('')}
                style={{
                  position: 'absolute',
                  right: 4,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  fontSize: 11,
                }}
              >
                ✕
              </button>
            )}
          </div>

          {onImportMultipleFiles && (
            <button
              onClick={() => handleImportDirectory()}
              disabled={importingAll || loading}
              className="btn btn-primary"
              style={{
                padding: '4px 10px',
                fontSize: 11,
                fontWeight: 600,
                cursor: importingAll ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 5,
              }}
              title="Import all files in this directory into CodeForge editor tabs"
            >
              {importingAll ? <SpinnerIcon size={11} /> : '📥'}
              {importingAll
                ? importProgress
                  ? `Importing (${importProgress.current}/${importProgress.total})...`
                  : 'Importing...'
                : currentPath
                ? 'Import Folder'
                : 'Import All'}
            </button>
          )}
        </div>
      </div>

      {/* ── File Explorer Body (GitHub Table View) ───────────────────── */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {loading ? (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 40,
              color: 'var(--text-muted)',
              gap: 10,
            }}
          >
            <SpinnerIcon size={24} />
            <span>Fetching repository structure from GitHub...</span>
          </div>
        ) : error ? (
          <div
            style={{
              padding: 24,
              textAlign: 'center',
              color: 'var(--red)',
              background: 'rgba(248, 81, 73, 0.1)',
              border: '1px solid rgba(248, 81, 73, 0.3)',
              margin: 14,
              borderRadius: 6,
            }}
          >
            <div>⚠️ {error}</div>
            <button
              onClick={fetchTree}
              style={{
                marginTop: 10,
                background: 'var(--bg-card)',
                border: '1px solid var(--border)',
                color: 'var(--text-base)',
                borderRadius: 6,
                padding: '4px 12px',
                cursor: 'pointer',
                fontSize: 11,
              }}
            >
              Retry
            </button>
          </div>
        ) : filterQuery.trim() ? (
          /* Search Results */
          <div>
            <div
              style={{
                padding: '6px 14px',
                background: 'var(--bg-card)',
                borderBottom: '1px solid var(--border)',
                fontSize: 11,
                color: 'var(--text-muted)',
              }}
            >
              Search results for "{filterQuery}" ({filteredAllFiles.length} matches)
            </div>
            {filteredAllFiles.length === 0 ? (
              <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)' }}>No files match "{filterQuery}".</div>
            ) : (
              filteredAllFiles.map(file => (
                <div
                  key={file.sha}
                  onClick={() => handleFileClick(file)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 14px',
                    borderBottom: '1px solid var(--border)',
                    cursor: 'pointer',
                    transition: 'background 0.1s',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-hover)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                    <FileIcon fileName={file.path} size={15} />
                    <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: 'var(--text-base)' }}>
                      {file.path}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{formatBytes(file.size)}</span>
                    {loadingPath === file.path ? (
                      <SpinnerIcon size={12} />
                    ) : (
                      <span style={{ fontSize: 10, color: 'var(--accent)', fontWeight: 600, background: 'var(--accent-subtle)', padding: '2px 6px', borderRadius: 4 }}>Open ↗</span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        ) : (
          /* Normal GitHub Directory View */
          <div>
            {/* Parent directory row */}
            {currentPath && (
              <div
                onClick={navigateUp}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '8px 14px',
                  borderBottom: '1px solid var(--border)',
                  cursor: 'pointer',
                  color: 'var(--accent)',
                  fontWeight: 600,
                  fontSize: 11,
                  background: 'var(--bg-app)',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-hover)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                <FolderIcon size={15} />
                <span>.. (Parent directory)</span>
              </div>
            )}

            {/* Folders */}
            {currentFolders.map(folder => (
              <div
                key={folder.name}
                onClick={() => setCurrentPath(folder.fullPath)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '7px 14px',
                  borderBottom: '1px solid var(--border)',
                  cursor: 'pointer',
                  transition: 'background 0.1s',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-hover)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ color: 'var(--accent)', display: 'flex', alignItems: 'center' }}>
                    <FolderIcon size={15} />
                  </span>
                  <span style={{ color: 'var(--accent)', fontWeight: 600, fontSize: 11 }}>{folder.name}/</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  {onImportMultipleFiles && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleImportDirectory(folder.fullPath)
                      }}
                      disabled={importingAll}
                      title={`Import all files in "${folder.name}" into editor tabs`}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 3,
                        fontSize: 10,
                        fontWeight: 600,
                        padding: '2px 7px',
                        borderRadius: 4,
                        border: '1px solid var(--border)',
                        background: 'var(--bg-card)',
                        color: 'var(--accent)',
                        cursor: importingAll ? 'not-allowed' : 'pointer',
                        transition: 'all 0.15s',
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.background = 'var(--accent)'
                        e.currentTarget.style.color = '#fff'
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.background = 'var(--bg-card)'
                        e.currentTarget.style.color = 'var(--accent)'
                      }}
                    >
                      📥 Import
                    </button>
                  )}
                  <span
                    style={{
                      fontSize: 10,
                      color: 'var(--text-muted)',
                      background: 'var(--bg-hover)',
                      padding: '1px 6px',
                      borderRadius: 4,
                    }}
                  >
                    {folder.count} {folder.count === 1 ? 'item' : 'items'}
                  </span>
                  <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>➔</span>
                </div>
              </div>
            ))}

            {/* Files */}
            {currentFiles.map(file => {
              const fileName = file.path.split('/').pop() || file.path
              return (
                <div
                  key={file.sha}
                  onClick={() => handleFileClick(file)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '7px 14px',
                    borderBottom: '1px solid var(--border)',
                    cursor: 'pointer',
                    transition: 'background 0.1s',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-hover)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <FileIcon fileName={fileName} size={15} />
                    <span
                      style={{
                        fontFamily: 'JetBrains Mono, monospace',
                        fontSize: 11,
                        color: 'var(--text-base)',
                      }}
                    >
                      {fileName}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{formatBytes(file.size)}</span>
                    {loadingPath === file.path ? (
                      <SpinnerIcon size={12} />
                    ) : (
                      <span
                        style={{
                          fontSize: 10,
                          color: 'var(--accent)',
                          fontWeight: 600,
                          background: 'var(--accent-subtle)',
                          padding: '2px 6px',
                          borderRadius: 4,
                        }}
                      >
                        Open ⚡
                      </span>
                    )}
                  </div>
                </div>
              )
            })}

            {currentFolders.length === 0 && currentFiles.length === 0 && (
              <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)' }}>
                This directory is empty on branch {branch}.
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── GitHub Footer Status ─────────────────────────────────────── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '6px 14px',
          background: 'var(--bg-card)',
          borderTop: '1px solid var(--border)',
          fontSize: 10,
          color: 'var(--text-muted)',
        }}
      >
        <span>
          Showing {currentFolders.length} folders, {currentFiles.length} files
          {currentPath ? ` in /${currentPath}` : ' (root)'}
        </span>
        <a
          href={`${repository.html_url}/tree/${branch}${currentPath ? `/${currentPath}` : ''}`}
          target="_blank"
          rel="noreferrer"
          style={{ color: 'var(--accent)', textDecoration: 'none' }}
          onMouseEnter={e => (e.currentTarget.style.textDecoration = 'underline')}
          onMouseLeave={e => (e.currentTarget.style.textDecoration = 'none')}
        >
          View on GitHub ↗
        </a>
      </div>
    </div>
  )
}

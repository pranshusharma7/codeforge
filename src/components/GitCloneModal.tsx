import React, { useState } from 'react'
import type { GitHubRepository, RepoTreeItem } from '../lib/github'
import { fetchPublicRepo, getRepoFileContent } from '../lib/github'
import { XIcon, SpinnerIcon, CheckIcon, FolderIcon } from './icons'

interface Props {
  isOpen: boolean
  token?: string
  onClose: () => void
  onImportFiles: (
    repo: GitHubRepository,
    files: { path: string; name: string; content: string; sha: string; branch: string }[]
  ) => void
  showToast: (msg: string) => void
}

export default function GitCloneModal({
  isOpen,
  token,
  onClose,
  onImportFiles,
  showToast,
}: Props) {
  const [repoInput, setRepoInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [importing, setImporting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [repoData, setRepoData] = useState<GitHubRepository | null>(null)
  const [treeItems, setTreeItems] = useState<RepoTreeItem[]>([])
  const [selectedPaths, setSelectedPaths] = useState<Set<string>>(new Set())

  if (!isOpen) return null

  const handleFetch = async () => {
    const raw = repoInput.trim()
    if (!raw) {
      setError('Please enter a GitHub repository URL or owner/repo')
      return
    }

    setLoading(true)
    setError(null)
    setRepoData(null)
    setTreeItems([])

    try {
      const { repo, tree } = await fetchPublicRepo(raw, token)
      setRepoData(repo)
      // Filter out files (blobs)
      const codeFiles = tree.filter(t => t.type === 'blob')
      setTreeItems(codeFiles)
      // Auto select first 6 files or all if <= 6
      const initial = new Set(codeFiles.slice(0, 6).map(f => f.path))
      setSelectedPaths(initial)
      showToast(`Loaded ${repo.full_name} (${codeFiles.length} files)`)
    } catch (err: any) {
      setError(err.message || 'Could not fetch repository. Please check URL.')
    } finally {
      setLoading(false)
    }
  }

  const handleImport = async () => {
    if (!repoData || selectedPaths.size === 0) return
    setImporting(true)
    setError(null)

    try {
      const filesToFetch = treeItems.filter(f => selectedPaths.has(f.path))
      const branch = repoData.default_branch || 'main'
      const owner = repoData.owner?.login || repoData.full_name.split('/')[0]

      const fetchedFiles: { path: string; name: string; content: string; sha: string; branch: string }[] = []

      for (const item of filesToFetch) {
        try {
          const res = await getRepoFileContent(token || '', owner, repoData.name, item.path, branch)
          fetchedFiles.push({
            path: res.path,
            name: res.name,
            content: res.content,
            sha: res.sha,
            branch,
          })
        } catch {}
      }

      if (fetchedFiles.length === 0) {
        throw new Error('Could not download selected files.')
      }

      onImportFiles(repoData, fetchedFiles)
      showToast(`Imported ${fetchedFiles.length} files from ${repoData.name}! 🚀`)
      onClose()
    } catch (err: any) {
      setError(err.message || 'Failed to import files.')
    } finally {
      setImporting(false)
    }
  }

  const toggleSelect = (path: string) => {
    setSelectedPaths(prev => {
      const next = new Set(prev)
      if (next.has(path)) next.delete(path)
      else next.add(path)
      return next
    })
  }

  const toggleSelectAll = () => {
    if (selectedPaths.size === treeItems.length) {
      setSelectedPaths(new Set())
    } else {
      setSelectedPaths(new Set(treeItems.map(f => f.path)))
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
          maxWidth: 540,
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: 10,
          boxShadow: '0 12px 36px rgba(0, 0, 0, 0.45)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '90vh',
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
            <span style={{ fontSize: 16, color: 'var(--accent)' }}>📥</span>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-base)' }}>
                Clone / Import GitHub Repository
              </div>
              <div style={{ fontSize: 10.5, color: 'var(--text-muted)' }}>
                Open any public or private repo directly in CodeForge
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

        {/* Input Bar */}
        <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              type="text"
              value={repoInput}
              onChange={e => setRepoInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleFetch()}
              placeholder="e.g. https://github.com/torvalds/linux or facebook/react"
              style={{
                flex: 1,
                padding: '8px 12px',
                borderRadius: 6,
                background: 'var(--bg-app)',
                border: '1px solid var(--border)',
                color: 'var(--text-base)',
                fontSize: 12,
                fontFamily: 'inherit',
                outline: 'none',
              }}
            />
            <button
              onClick={handleFetch}
              disabled={loading || !repoInput.trim()}
              style={{
                padding: '8px 14px',
                borderRadius: 6,
                background: 'var(--accent)',
                color: '#ffffff',
                border: 'none',
                fontSize: 12,
                fontWeight: 600,
                cursor: loading || !repoInput.trim() ? 'not-allowed' : 'pointer',
                opacity: loading || !repoInput.trim() ? 0.6 : 1,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                flexShrink: 0,
              }}
            >
              {loading ? <SpinnerIcon size={13} className="spin" /> : 'Inspect Repo'}
            </button>
          </div>

          {error && (
            <div style={{ marginTop: 8, fontSize: 11, color: '#ef4444' }}>
              ⚠️ {error}
            </div>
          )}
        </div>

        {/* Repository details and file picker */}
        {repoData && (
          <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
            {/* Repo Summary Card */}
            <div
              style={{
                padding: '10px 12px',
                borderRadius: 7,
                background: 'var(--bg-app)',
                border: '1px solid var(--border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                {repoData.owner?.avatar_url && (
                  <img
                    src={repoData.owner.avatar_url}
                    alt=""
                    style={{ width: 32, height: 32, borderRadius: '50%', flexShrink: 0 }}
                  />
                )}
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--text-base)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {repoData.full_name}
                  </div>
                  <div style={{ fontSize: 10.5, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {repoData.description || 'No description provided'}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0, fontSize: 11, color: 'var(--text-muted)' }}>
                <span>⭐ {repoData.stargazers_count ?? 0}</span>
                <span>🌿 {repoData.default_branch || 'main'}</span>
              </div>
            </div>

            {/* File List Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 11 }}>
              <span style={{ fontWeight: 600, color: 'var(--text-muted)' }}>
                Files ({selectedPaths.size}/{treeItems.length} selected)
              </span>
              <button
                onClick={toggleSelectAll}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--accent)',
                  cursor: 'pointer',
                  fontSize: 11,
                  padding: 0,
                }}
              >
                {selectedPaths.size === treeItems.length ? 'Deselect All' : 'Select All'}
              </button>
            </div>

            {/* Tree Items List */}
            <div
              style={{
                maxHeight: 220,
                overflowY: 'auto',
                border: '1px solid var(--border)',
                borderRadius: 6,
                background: 'var(--bg-app)',
              }}
            >
              {treeItems.map(item => {
                const isSelected = selectedPaths.has(item.path)
                return (
                  <div
                    key={item.path}
                    onClick={() => toggleSelect(item.path)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '6px 10px',
                      fontSize: 11.5,
                      cursor: 'pointer',
                      borderBottom: '1px solid var(--border-subtle)',
                      background: isSelected ? 'var(--accent-subtle)' : 'transparent',
                      color: isSelected ? 'var(--text-base)' : 'var(--text-muted)',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => {}}
                      style={{ cursor: 'pointer' }}
                    />
                    <FolderIcon size={12} style={{ color: 'var(--accent)', flexShrink: 0 }} />
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {item.path}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Footer Actions */}
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
            Cancel
          </button>

          {repoData && (
            <button
              onClick={handleImport}
              disabled={importing || selectedPaths.size === 0}
              style={{
                padding: '6px 14px',
                borderRadius: 5,
                background: 'var(--accent)',
                border: 'none',
                color: '#ffffff',
                fontSize: 12,
                fontWeight: 600,
                cursor: importing || selectedPaths.size === 0 ? 'not-allowed' : 'pointer',
                opacity: importing || selectedPaths.size === 0 ? 0.6 : 1,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              {importing ? <SpinnerIcon size={13} className="spin" /> : <CheckIcon size={13} />}
              <span>Import Selected ({selectedPaths.size})</span>
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

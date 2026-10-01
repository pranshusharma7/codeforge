import { useState, useEffect, useMemo } from 'react'
import type { AuthUser } from '../lib/storage'
import type { GitHubRepository } from '../lib/github'
import type { TabWithRepo } from './SourceControlPanel'
import GitHubSettingsTab from './GitHubSettingsTab'
import ThemeGalleryTab from './ThemeGalleryTab'
import { SettingsIcon, RepoIcon, GithubIcon, PaletteIcon } from './icons'
import { EDITOR_FONTS, getEditorFontById } from '../lib/fonts'

interface Props {
  isOpen: boolean
  onClose: () => void
  initialTab?: 'editor' | 'themes' | 'repos' | 'profile'
  currentThemeId: string
  onThemeChange: (themeId: string) => void
  currentFontColor?: string
  onFontColorChange?: (color: string) => void
  currentFontId: string
  onFontChange: (fontId: string) => void
  fontLigatures?: boolean
  onFontLigaturesToggle?: () => void
  fontSize: number
  wordWrap: 'on' | 'off'
  showMini: boolean
  aiOpen: boolean
  onFontSizeChange: (n: number | ((p: number) => number)) => void
  onWordWrapChange: (w: 'on' | 'off') => void
  onMiniChange: (m: boolean) => void
  onAiToggle: () => void
  authUser: AuthUser | null
  repositories: GitHubRepository[]
  activeTab: TabWithRepo
  onConnectGitHub: () => void
  onSignOut: () => void
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

export default function SettingsModal({
  isOpen,
  onClose,
  initialTab = 'editor',
  currentThemeId,
  onThemeChange,
  currentFontColor,
  onFontColorChange,
  currentFontId,
  onFontChange,
  fontLigatures = true,
  onFontLigaturesToggle,
  fontSize,
  wordWrap,
  showMini,
  aiOpen,
  onFontSizeChange,
  onWordWrapChange,
  onMiniChange,
  onAiToggle,
  authUser,
  repositories,
  activeTab,
  onConnectGitHub,
  onSignOut,
  onRefreshRepos,
  onSelectRepoForCommit,
  onOpenFileFromRepo,
  showToast,
}: Props) {
  const [activeTabName, setActiveTabName] = useState<'editor' | 'themes' | 'repos' | 'profile'>('editor')
  const [fontCategory, setFontCategory] = useState<'All' | 'Popular' | 'Ligatures' | 'Modern' | 'Classic'>('All')
  const [fontSearch, setFontSearch] = useState('')

  const currentFont = getEditorFontById(currentFontId || 'jetbrains-mono')
  const filteredFonts = useMemo(() => {
    return EDITOR_FONTS.filter(f => {
      const matchCat = fontCategory === 'All' || f.category === fontCategory
      const matchSearch = !fontSearch.trim() ||
        f.name.toLowerCase().includes(fontSearch.toLowerCase()) ||
        f.author.toLowerCase().includes(fontSearch.toLowerCase()) ||
        f.description.toLowerCase().includes(fontSearch.toLowerCase())
      return matchCat && matchSearch
    })
  }, [fontCategory, fontSearch])

  useEffect(() => {
    if (initialTab) {
      setActiveTabName(initialTab)
    }
  }, [initialTab, isOpen])

  if (!isOpen) return null

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-box"
        style={{
          width: 760,
          maxWidth: '94vw',
          height: 580,
          maxHeight: '88vh',
          display: 'flex',
          flexDirection: 'column',
          padding: 0,
          overflow: 'hidden',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '14px 20px',
            borderBottom: '1px solid var(--border)',
            flexShrink: 0,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-base)' }}>Settings</span>
            <span style={{ color: 'var(--text-dim)', fontSize: 13 }}>•</span>
            <span style={{ color: 'var(--accent)', fontSize: 13, fontWeight: 600 }}>
              {activeTabName === 'editor'
                ? 'Editor Preferences'
                : activeTabName === 'themes'
                ? 'VS Code Themes'
                : activeTabName === 'repos'
                ? 'GitHub Repositories'
                : 'Profile & Account'}
            </span>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 16 }}
          >
            ✕
          </button>
        </div>

        {/* Body: Left tab list + Right content */}
        <div style={{ display: 'flex', flex: 1, minHeight: 0 }}>
          {/* Left Navigation */}
          <div
            style={{
              width: 190,
              background: 'var(--bg-sidebar)',
              borderRight: '1px solid var(--border)',
              padding: '12px 8px',
              display: 'flex',
              flexDirection: 'column',
              gap: 4,
              flexShrink: 0,
            }}
          >
            <button
              onClick={() => setActiveTabName('editor')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '8px 12px',
                borderRadius: 6,
                border: 'none',
                background: activeTabName === 'editor' ? 'var(--bg-hover)' : 'transparent',
                color: activeTabName === 'editor' ? 'var(--text-base)' : 'var(--text-muted)',
                fontWeight: activeTabName === 'editor' ? 600 : 400,
                fontSize: 12,
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              <SettingsIcon size={14} />
              Editor
            </button>

            <button
              onClick={() => setActiveTabName('themes')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '8px 12px',
                borderRadius: 6,
                border: 'none',
                background: activeTabName === 'themes' ? 'var(--bg-hover)' : 'transparent',
                color: activeTabName === 'themes' ? 'var(--text-base)' : 'var(--text-muted)',
                fontWeight: activeTabName === 'themes' ? 600 : 400,
                fontSize: 12,
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              <PaletteIcon size={14} />
              VS Code Themes
              <span
                style={{
                  marginLeft: 'auto',
                  background: 'var(--accent-subtle)',
                  color: 'var(--accent)',
                  fontSize: 10,
                  padding: '1px 6px',
                  borderRadius: 10,
                  fontWeight: 700,
                }}
              >
                15
              </span>
            </button>

            <button
              onClick={() => setActiveTabName('repos')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '8px 12px',
                borderRadius: 6,
                border: 'none',
                background: activeTabName === 'repos' ? 'var(--bg-hover)' : 'transparent',
                color: activeTabName === 'repos' ? 'var(--text-base)' : 'var(--text-muted)',
                fontWeight: activeTabName === 'repos' ? 600 : 400,
                fontSize: 12,
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              <RepoIcon size={14} />
              Repositories
              {repositories.length > 0 && (
                <span
                  style={{
                    marginLeft: 'auto',
                    background: 'var(--accent-subtle)',
                    color: 'var(--accent)',
                    fontSize: 10,
                    padding: '1px 5px',
                    borderRadius: 10,
                    fontWeight: 700,
                  }}
                >
                  {repositories.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTabName('profile')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '8px 12px',
                borderRadius: 6,
                border: 'none',
                background: activeTabName === 'profile' ? 'var(--bg-hover)' : 'transparent',
                color: activeTabName === 'profile' ? 'var(--text-base)' : 'var(--text-muted)',
                fontWeight: activeTabName === 'profile' ? 600 : 400,
                fontSize: 12,
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              <GithubIcon size={14} />
              Profile & Auth
            </button>
          </div>

          {/* Right Panel Content */}
          <div style={{ flex: 1, padding: '18px 20px', overflowY: 'auto' }}>
            {/* ── Tab 1: Editor Preferences ── */}
            {activeTabName === 'editor' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', color: '#7d8590', textTransform: 'uppercase' }}>
                  EDITOR PREFERENCES
                </div>

                {/* ── Top Coding Fonts Selection ── */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12, paddingBottom: 16, borderBottom: '1px solid #21262d' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 13, color: '#c9d1d9', fontWeight: 600 }}>Editor Font Family</span>
                        <span style={{
                          background: 'rgba(124, 58, 237, 0.2)',
                          color: '#c084fc',
                          fontSize: 10,
                          fontWeight: 700,
                          padding: '2px 7px',
                          borderRadius: 12,
                          border: '1px solid rgba(124, 58, 237, 0.35)'
                        }}>
                          {EDITOR_FONTS.length} Premier Fonts
                        </span>
                      </div>
                      <div style={{ fontSize: 11, color: '#7d8590', marginTop: 2 }}>
                        Top developer fonts with crisp glyphs and programming ligatures
                      </div>
                    </div>

                    {/* Programming Ligatures Toggle */}
                    {onFontLigaturesToggle && (
                      <button
                        onClick={onFontLigaturesToggle}
                        className={`btn ${fontLigatures ? 'btn-primary' : 'btn-ghost'}`}
                        style={{ padding: '4px 12px', fontSize: 11, gap: 5, flexShrink: 0 }}
                        title="Toggle Programming Ligatures (e.g. != => <=)"
                      >
                        <span>⚡</span> Ligatures: {fontLigatures ? 'On' : 'Off'}
                      </button>
                    )}
                  </div>

                  {/* Active Font Showcase Card */}
                  <div style={{
                    background: 'linear-gradient(135deg, rgba(124, 58, 237, 0.1) 0%, rgba(56, 189, 248, 0.08) 100%)',
                    border: '1px solid rgba(124, 58, 237, 0.35)',
                    borderRadius: 8,
                    padding: '12px 14px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 8
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 15, fontWeight: 700, color: '#f0f6fc' }}>{currentFont.name}</span>
                        {currentFont.badge && (
                          <span style={{
                            fontSize: 10,
                            fontWeight: 600,
                            background: 'rgba(56, 189, 248, 0.15)',
                            color: '#38bdf8',
                            border: '1px solid rgba(56, 189, 248, 0.3)',
                            padding: '1px 6px',
                            borderRadius: 4
                          }}>
                            {currentFont.badge}
                          </span>
                        )}
                        <span style={{ fontSize: 11, color: '#8b949e' }}>by {currentFont.author}</span>
                      </div>
                      <span style={{
                        fontSize: 11,
                        fontWeight: 600,
                        color: currentFont.hasLigatures ? (fontLigatures ? '#3fb950' : '#d29922') : '#8b949e',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4
                      }}>
                        {currentFont.hasLigatures
                          ? (fontLigatures ? '⚡ Ligatures Active' : '⚡ Ligatures (Disabled in Settings)')
                          : 'Standard Monospace'}
                      </span>
                    </div>

                    <div style={{ fontSize: 11, color: '#8b949e', lineHeight: 1.4 }}>
                      {currentFont.description}
                    </div>

                    {/* Live Font Interactive Preview */}
                    <div style={{
                      fontFamily: currentFont.fontFamily,
                      fontSize: Math.max(12, fontSize - 1),
                      background: '#090d13',
                      border: '1px solid #30363d',
                      borderRadius: 6,
                      padding: '8px 12px',
                      color: '#58a6ff',
                      lineHeight: 1.6,
                      overflowX: 'auto',
                      whiteSpace: 'pre',
                      letterSpacing: 'normal'
                    }}>
                      {currentFont.previewText}
                    </div>
                  </div>

                  {/* Filter Tabs & Search */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                    <div style={{ display: 'flex', gap: 4, overflowX: 'auto', flexWrap: 'wrap' }}>
                      {(['All', 'Popular', 'Ligatures', 'Modern', 'Classic'] as const).map(cat => (
                        <button
                          key={cat}
                          onClick={() => setFontCategory(cat)}
                          style={{
                            background: fontCategory === cat ? '#7c3aed' : 'rgba(255,255,255,0.05)',
                            color: fontCategory === cat ? '#ffffff' : '#8b949e',
                            border: fontCategory === cat ? '1px solid #7c3aed' : '1px solid #30363d',
                            borderRadius: 14,
                            padding: '2px 10px',
                            fontSize: 11,
                            fontWeight: 500,
                            cursor: 'pointer',
                            transition: 'all .15s'
                          }}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>
                    <input
                      type="text"
                      placeholder="Search fonts…"
                      value={fontSearch}
                      onChange={e => setFontSearch(e.target.value)}
                      style={{
                        background: 'var(--bg-input, var(--bg-card))',
                        border: '1px solid var(--border)',
                        borderRadius: 6,
                        padding: '4px 8px',
                        fontSize: 11,
                        color: 'var(--text-base)',
                        outline: 'none',
                        width: 120
                      }}
                    />
                  </div>

                  {/* Font Cards Grid */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
                    gap: 8,
                    maxHeight: 220,
                    overflowY: 'auto',
                    paddingRight: 4
                  }}>
                    {filteredFonts.map(f => {
                      const isSelected = f.id === currentFont.id
                      return (
                        <div
                          key={f.id}
                          onClick={() => {
                            onFontChange(f.id)
                            showToast(`Applied ${f.name} font to editor!`)
                          }}
                          style={{
                            background: isSelected ? 'rgba(124, 58, 237, 0.16)' : 'rgba(255, 255, 255, 0.02)',
                            border: isSelected ? '1.5px solid #a855f7' : '1px solid #21262d',
                            borderRadius: 7,
                            padding: '9px 11px',
                            cursor: 'pointer',
                            transition: 'all .15s',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 5
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <span style={{ fontSize: 12, fontWeight: 700, color: isSelected ? '#c084fc' : '#e6edf3' }}>
                                {f.name}
                              </span>
                              {f.hasLigatures && (
                                <span title="Supports Programming Ligatures" style={{ fontSize: 10, color: '#38bdf8' }}>⚡</span>
                              )}
                            </div>
                            {isSelected ? (
                              <span style={{ color: '#c084fc', fontSize: 10, fontWeight: 700, background: 'rgba(168, 85, 247, 0.2)', padding: '1px 5px', borderRadius: 4 }}>
                                ✓ Active
                              </span>
                            ) : (
                              <span style={{ fontSize: 9, color: '#7d8590' }}>{f.category}</span>
                            )}
                          </div>
                          <div style={{
                            fontFamily: f.fontFamily,
                            fontSize: 11,
                            color: isSelected ? '#f0f6fc' : '#8b949e',
                            lineHeight: 1.4,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            background: 'rgba(0,0,0,0.25)',
                            padding: '3px 6px',
                            borderRadius: 4
                          }}>
                            {f.previewText}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 12, borderBottom: '1px solid #21262d' }}>
                  <div>
                    <div style={{ fontSize: 13, color: '#c9d1d9', fontWeight: 500 }}>Font Size</div>
                    <div style={{ fontSize: 11, color: '#7d8590' }}>Adjust Monaco editor text size in pixels</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <button
                      onClick={() => onFontSizeChange(p => Math.max(10, (p as number) - 1))}
                      className="btn btn-ghost"
                      style={{ padding: '3px 10px' }}
                    >
                      −
                    </button>
                    <span style={{ fontFamily: 'JetBrains Mono', fontSize: 13, minWidth: 28, textAlign: 'center', color: '#e6edf3' }}>
                      {fontSize}px
                    </span>
                    <button
                      onClick={() => onFontSizeChange(p => Math.min(24, (p as number) + 1))}
                      className="btn btn-ghost"
                      style={{ padding: '3px 10px' }}
                    >
                      +
                    </button>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 12, borderBottom: '1px solid #21262d' }}>
                  <div>
                    <div style={{ fontSize: 13, color: '#c9d1d9', fontWeight: 500 }}>Word Wrap</div>
                    <div style={{ fontSize: 11, color: '#7d8590' }}>Wrap long lines to fit the editor width</div>
                  </div>
                  <button
                    onClick={() => onWordWrapChange(wordWrap === 'on' ? 'off' : 'on')}
                    className={`btn ${wordWrap === 'on' ? 'btn-primary' : 'btn-ghost'}`}
                    style={{ padding: '4px 18px' }}
                  >
                    {wordWrap === 'on' ? 'Enabled' : 'Disabled'}
                  </button>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 12, borderBottom: '1px solid #21262d' }}>
                  <div>
                    <div style={{ fontSize: 13, color: '#c9d1d9', fontWeight: 500 }}>Minimap</div>
                    <div style={{ fontSize: 11, color: '#7d8590' }}>Show mini code overview sidebar</div>
                  </div>
                  <button
                    onClick={() => onMiniChange(!showMini)}
                    className={`btn ${showMini ? 'btn-primary' : 'btn-ghost'}`}
                    style={{ padding: '4px 18px' }}
                  >
                    {showMini ? 'Shown' : 'Hidden'}
                  </button>
                </div>

              </div>
            )}

            {/* ── Tab 2: VS Code Themes (Requested Feature) ── */}
            {activeTabName === 'themes' && (
              <ThemeGalleryTab
                currentThemeId={currentThemeId}
                onSelectTheme={onThemeChange}
                currentFontColor={currentFontColor}
                onSelectFontColor={onFontColorChange}
                showToast={showToast}
              />
            )}

            {/* ── Tab 3: Repositories ── */}
            {activeTabName === 'repos' && (
              <GitHubSettingsTab
                authUser={authUser}
                repositories={repositories}
                activeTab={activeTab}
                onConnectGitHub={onConnectGitHub}
                onRefreshRepos={onRefreshRepos}
                onSelectRepoForCommit={repo => {
                  onSelectRepoForCommit(repo)
                  onClose()
                }}
                onOpenFileFromRepo={(repo, path, content, sha, branch) => {
                  onOpenFileFromRepo(repo, path, content, sha, branch)
                  onClose()
                }}
                showToast={showToast}
              />
            )}

            {/* ── Tab 4: Profile & Authentication ── */}
            {activeTabName === 'profile' && (
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', color: 'var(--text-dim)', textTransform: 'uppercase', marginBottom: 14 }}>
                  ACCOUNT DETAILS
                </div>

                {authUser ? (
                  <div
                    style={{
                      background: 'var(--bg-card)',
                      border: '1px solid var(--border)',
                      borderRadius: 8,
                      padding: 16,
                      marginBottom: 16,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                      <span className="profile-avatar" style={{ width: 44, height: 44, fontSize: 16 }}>
                        {authUser.avatarUrl ? <img src={authUser.avatarUrl} alt="" /> : authUser.initials}
                      </span>
                      <div>
                        <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-base)' }}>{authUser.name}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>@{authUser.login || authUser.name}</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--green)', marginTop: 3 }}>
                          <span className="secure-dot" /> Connected to GitHub
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10, marginTop: 12 }}>
                      <div style={{ background: 'var(--bg-app)', border: '1px solid var(--border)', padding: 10, borderRadius: 6 }}>
                        <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>REPOSITORIES SYNCED</div>
                        <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-base)', marginTop: 2 }}>{repositories.length}</div>
                      </div>
                      <div style={{ background: 'var(--bg-app)', border: '1px solid var(--border)', padding: 10, borderRadius: 6 }}>
                        <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>PROVIDER</div>
                        <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--accent)', marginTop: 2 }}>GitHub API</div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
                      <button onClick={onConnectGitHub} className="btn btn-ghost" style={{ flex: 1, fontSize: 12 }}>
                        Switch Account / Reconnect
                      </button>
                      <button
                        onClick={() => {
                          onSignOut()
                          showToast('Signed out from GitHub')
                        }}
                        className="btn btn-ghost"
                        style={{ color: 'var(--red)', borderColor: 'rgba(239, 68, 68, 0.4)', fontSize: 12 }}
                      >
                        Disconnect
                      </button>
                    </div>
                  </div>
                ) : (
                  <div
                    style={{
                      background: 'var(--bg-card)',
                      border: '1px solid var(--border)',
                      borderRadius: 8,
                      padding: 20,
                      textAlign: 'center',
                    }}
                  >
                    <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-base)', marginBottom: 6 }}>
                      No GitHub Account Connected
                    </div>
                    <p style={{ color: 'var(--text-muted)', fontSize: 12, marginBottom: 14, maxWidth: 360, margin: '0 auto 16px' }}>
                      Connect your GitHub account to access all your repositories, save snippets, and commit code directly.
                    </p>
                    <button onClick={onConnectGitHub} className="btn btn-primary" style={{ padding: '7px 20px', fontSize: 12 }}>
                      Connect GitHub
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '10px 20px',
            borderTop: '1px solid var(--border)',
            display: 'flex',
            justifyContent: 'flex-end',
            background: 'var(--bg-header)',
            flexShrink: 0,
          }}
        >
          <button onClick={onClose} className="btn btn-primary" style={{ padding: '6px 18px', fontSize: 12 }}>
            Done
          </button>
        </div>
      </div>
    </div>
  )
}

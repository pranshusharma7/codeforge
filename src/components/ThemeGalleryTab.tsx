import { useState } from 'react'
import {
  getAllThemes,
  VSCODE_THEMES,
  EDITOR_FONT_COLORS,
  type ThemeDefinition,
  type FontColorOption,
  parseAnyColorToHex,
} from '../lib/themes'
import { CheckIcon } from './icons'

interface Props {
  currentThemeId: string
  onSelectTheme: (themeId: string) => void
  currentFontColor?: string
  onSelectFontColor?: (color: string) => void
  currentCommentColor?: string
  onSelectCommentColor?: (color: string) => void
  showToast: (msg: string) => void
}

const CINEMATIC_THEMES = [
  {
    id: 'source-cybernetic',
    name: 'Source Cybernetic (Edge Dark)',
    label: '⚡ Source Edge',
    subtitle: 'Obsidian slate, matrix hairlines & vivid cyber-mint accents (Video 1 Edition)',
    badge: '⚡ Video 1 Edition',
    badgeColor: '#00e575',
    cardBg: 'linear-gradient(135deg, #111517 0%, #090b0c 100%)',
    borderColor: '#00e575',
    textColor: '#eef2f3',
    subTextColor: '#8fa3a8',
    pillBg: '#00e575',
    pillColor: '#090b0c',
    dots: ['#090b0c', '#00e575', '#38bdf8', '#1f292d'],
  },
  {
    id: 'alvor-forest',
    name: 'Alvor Forest (Botanical Sage)',
    label: '🌲 Alvor Bio-Sage',
    subtitle: 'British racing green pine, forest glass & biometric waveform glow (Video 2 Edition)',
    badge: '🌲 Video 2 Edition',
    badgeColor: '#4ade80',
    cardBg: 'linear-gradient(135deg, #132b1d 0%, #0a170f 100%)',
    borderColor: '#4ade80',
    textColor: '#f0fdf4',
    subTextColor: '#86efac',
    pillBg: '#4ade80',
    pillColor: '#08130c',
    dots: ['#0a170f', '#4ade80', '#1c3d28', '#f0fdf4'],
  },
  {
    id: 'omni-agent',
    name: 'OmniAgent Lime (AI Studio)',
    label: '🔋 OmniAgent Lime',
    subtitle: 'Velvet noir canvas, electric chartreuse & creator studio cards (Video 3 Edition)',
    badge: '🔋 Video 3 Edition',
    badgeColor: '#c8f135',
    cardBg: 'linear-gradient(135deg, #151b11 0%, #0a0c08 100%)',
    borderColor: '#c8f135',
    textColor: '#f7fee7',
    subTextColor: '#d9f99d',
    pillBg: '#c8f135',
    pillColor: '#060805',
    dots: ['#0a0c08', '#c8f135', '#202a18', '#f7fee7'],
  },
  {
    id: 'alvor-titanium',
    name: 'Alvor Titanium (Luxury Minimal)',
    label: '💍 Alvor Titanium',
    subtitle: 'Frosted ivory glass, titanium silver & laser diode emerald pulse (Flagship Ring Edition)',
    badge: '💍 Flagship Edition',
    badgeColor: '#059669',
    cardBg: 'linear-gradient(135deg, rgba(255, 255, 255, 0.96), rgba(245, 245, 243, 0.90))',
    borderColor: '#059669',
    textColor: '#111815',
    subTextColor: '#575b54',
    pillBg: '#111815',
    pillColor: '#ffffff',
    dots: ['#f5f5f3', '#059669', '#111815', '#78716c'],
  },
  {
    id: 'revenue-x',
    name: 'RevenueX (Champagne Sunset)',
    label: '🌅 RevenueX Sunset',
    subtitle: 'Warm champagne silk ivory, glowing honey amber, sunset violet & obsidian pill (Editorial Luxury)',
    badge: '🌅 RevenueX Edition',
    badgeColor: '#f59e0b',
    cardBg: 'linear-gradient(135deg, rgba(255, 255, 255, 0.98), #f8f6f0 60%, #fef3c7 100%)',
    borderColor: '#f59e0b',
    textColor: '#18181b',
    subTextColor: '#78716c',
    pillBg: '#111827',
    pillColor: '#ffffff',
    dots: ['#f6f4ee', '#f59e0b', '#7c3aed', '#111827'],
  },
  {
    id: 'apitex-fintech',
    name: 'Apitex (Peach Champagne & Midnight)',
    label: '💳 Apitex Fintech',
    subtitle: 'Warm champagne peach silk, apricot platinum card glow, midnight capsule dock & coral rose',
    badge: '💳 Apitex Fintech Edition',
    badgeColor: '#fb7185',
    cardBg: 'linear-gradient(135deg, rgba(255, 255, 255, 0.98), #fff7ed 50%, #fed7aa 100%)',
    borderColor: '#fb7185',
    textColor: '#0f172a',
    subTextColor: '#64748b',
    pillBg: '#0f172a',
    pillColor: '#ffffff',
    dots: ['#fdf6f0', '#fb7185', '#0f172a', '#fed7aa'],
  },
  {
    id: 'revenue-x-noir',
    name: 'RevenueX Noir (Desert Midnight)',
    label: '🌌 RevenueX Noir',
    subtitle: 'Deep desert obsidian dunes, glowing honey amber, violet aurora & laser emerald indicators',
    badge: '🌌 RevenueX Noir Edition',
    badgeColor: '#f59e0b',
    cardBg: 'linear-gradient(135deg, #131622 0%, #0c0d12 100%)',
    borderColor: '#f59e0b',
    textColor: '#f4f4f5',
    subTextColor: '#a1a1aa',
    pillBg: '#f59e0b',
    pillColor: '#0c0d12',
    dots: ['#0c0d12', '#f59e0b', '#a855f7', '#f4f4f5'],
  },
  {
    id: 'apitex-noir',
    name: 'Apitex Noir (Swiss Midnight Gold)',
    label: '✨ Apitex Noir',
    subtitle: 'Deep Swiss obsidian noir, warm apricot champagne glow, coral rose lasers & platinum highlights',
    badge: '✨ Apitex Noir Edition',
    badgeColor: '#fb7185',
    cardBg: 'linear-gradient(135deg, #111625 0%, #080a10 100%)',
    borderColor: '#fb7185',
    textColor: '#f1f5f9',
    subTextColor: '#94a3b8',
    pillBg: '#fb7185',
    pillColor: '#080a10',
    dots: ['#080a10', '#fb7185', '#fb923c', '#f1f5f9'],
  },
]

export default function ThemeGalleryTab({
  currentThemeId,
  onSelectTheme,
  currentFontColor = 'default',
  onSelectFontColor,
  currentCommentColor = 'default',
  onSelectCommentColor,
  showToast,
}: Props) {
  const [search, setSearch] = useState('')
  const [filterCategory, setFilterCategory] = useState<'all' | 'dark' | 'light' | 'extensions'>('all')
  const [selectedCinematicId, setSelectedCinematicId] = useState<string>(() => {
    return CINEMATIC_THEMES.some(c => c.id === currentThemeId) ? currentThemeId : 'source-cybernetic'
  })
  const [customHex, setCustomHex] = useState(currentFontColor.startsWith('#') ? currentFontColor : '#00f0ff')
  const [customCommentHex, setCustomCommentHex] = useState(
    currentCommentColor.startsWith('#') ? currentCommentColor : '#6a9955'
  )

  const allThemes = getAllThemes()
  const totalThemes = allThemes.length
  const darkThemesCount = allThemes.filter(t => t.category === 'dark').length
  const lightThemesCount = allThemes.filter(t => t.category === 'light').length
  const extensionThemesCount = allThemes.filter(t => t.isExtensionTheme).length

  const filteredThemes = allThemes.filter(theme => {
    const matchesSearch =
      theme.name.toLowerCase().includes(search.toLowerCase()) ||
      theme.author.toLowerCase().includes(search.toLowerCase()) ||
      theme.description.toLowerCase().includes(search.toLowerCase())

    if (filterCategory === 'extensions') {
      return matchesSearch && theme.isExtensionTheme
    }
    const matchesCategory =
      filterCategory === 'all' ? true : theme.category === filterCategory
    return matchesSearch && matchesCategory
  })

  const handlePickTheme = (theme: ThemeDefinition) => {
    onSelectTheme(theme.id)
    showToast(`Switched to "${theme.name}"`)
  }

  const handlePickFontColor = (option: FontColorOption) => {
    if (onSelectFontColor) {
      onSelectFontColor(option.color)
      if (option.color.startsWith('#')) {
        setCustomHex(option.color)
      }
      showToast(`🎨 Font Color: ${option.name}`)
    }
  }

  const handleApplyCustomHex = (rawColor: string) => {
    setCustomHex(rawColor)
    const validHex = parseAnyColorToHex(rawColor)
    if (validHex && onSelectFontColor) {
      onSelectFontColor(validHex)
      showToast(`🎨 Font Color: ${validHex}`)
    }
  }

  const handleApplyCustomCommentHex = (rawColor: string) => {
    setCustomCommentHex(rawColor)
    const validHex = parseAnyColorToHex(rawColor)
    if (validHex && onSelectCommentColor) {
      onSelectCommentColor(validHex)
      showToast(`💬 Comment Color: ${validHex}`)
    }
  }

  const activeTheme = VSCODE_THEMES.find(t => t.id === currentThemeId) || VSCODE_THEMES[0]
  const previewTextColor =
    currentFontColor === 'default'
      ? activeTheme.previewColors[2]
      : currentFontColor

  const defaultCommentForeground = activeTheme.monacoTheme.rules.find(r => r.token === 'comment')?.foreground
  const activeThemeCommentColor = defaultCommentForeground ? `#${defaultCommentForeground}` : '#6a9955'
  const previewCommentColor =
    currentCommentColor === 'default' || !currentCommentColor
      ? activeThemeCommentColor
      : currentCommentColor

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflowY: 'auto', paddingRight: 4 }}>
      {/* ── Header: Search & Filter ──────────────────────────────────── */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 10,
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 16,
          flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', gap: 8, flex: 1, minWidth: 200 }}>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search VS Code themes (e.g. Cyberpunk, Dracula, Rosé Pine, Tokyo Night, Gruvbox)..."
            className="ide-input"
            style={{ flex: 1, fontSize: 12, padding: '7px 10px' }}
          />
        </div>

        {/* Category Pills */}
        <div
          style={{
            display: 'flex',
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: 6,
            padding: 2,
          }}
        >
          {(['all', 'dark', 'light', 'extensions'] as const).map(cat => (
            <button
              key={cat}
              onClick={() => setFilterCategory(cat)}
              style={{
                border: 'none',
                background: filterCategory === cat ? 'var(--bg-hover)' : 'transparent',
                color: filterCategory === cat ? 'var(--text-base)' : 'var(--text-muted)',
                padding: '4px 9px',
                borderRadius: 4,
                fontSize: 11,
                cursor: 'pointer',
                fontWeight: filterCategory === cat ? 600 : 400,
                textTransform: 'capitalize',
                whiteSpace: 'nowrap',
              }}
            >
              {cat === 'all'
                ? `All (${totalThemes})`
                : cat === 'dark'
                ? `Dark (${darkThemesCount})`
                : cat === 'light'
                ? `Light (${lightThemesCount})`
                : `Extensions 🧩 (${extensionThemesCount})`}
            </button>
          ))}
        </div>
      </div>

      {/* ── Featured Flagship Themes: Cinematic Video Editions Showcase ── */}
      {!search && (
        <div style={{ marginBottom: 18 }}>
          {/* Top Pill Switcher for 4 Cinematic Video Themes */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              marginBottom: 10,
              overflowX: 'auto',
              paddingBottom: 2,
            }}
          >
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: 'var(--text-muted)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                whiteSpace: 'nowrap',
                display: 'flex',
                alignItems: 'center',
                gap: 4,
              }}
            >
              🎬 Video Editions:
            </span>
            {CINEMATIC_THEMES.map(ct => {
              const isSelected = selectedCinematicId === ct.id
              const isThemeActive = currentThemeId === ct.id
              return (
                <button
                  key={ct.id}
                  onClick={() => setSelectedCinematicId(ct.id)}
                  style={{
                    background: isSelected ? 'var(--bg-hover)' : 'var(--bg-card)',
                    border: '1px solid',
                    borderColor: isSelected ? ct.borderColor : 'var(--border)',
                    color: isSelected ? 'var(--text-base)' : 'var(--text-muted)',
                    borderRadius: 9999,
                    padding: '4px 10px',
                    fontSize: 11,
                    fontWeight: isSelected ? 700 : 500,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 5,
                    whiteSpace: 'nowrap',
                    transition: 'all 0.15s ease',
                    boxShadow: isSelected ? `0 0 10px ${ct.borderColor}33` : 'none',
                  }}
                >
                  <span>{ct.label}</span>
                  {isThemeActive && (
                    <span
                      style={{
                        width: 6,
                        height: 6,
                        borderRadius: '50%',
                        background: ct.borderColor,
                        boxShadow: `0 0 6px ${ct.borderColor}`,
                      }}
                    />
                  )}
                </button>
              )
            })}
          </div>

          {/* Active Featured Showcase Card */}
          {(() => {
            const featured =
              CINEMATIC_THEMES.find(c => c.id === selectedCinematicId) || CINEMATIC_THEMES[0]
            const targetTheme = allThemes.find(t => t.id === featured.id)
            const isCurrentlyActive = currentThemeId === featured.id

            return (
              <div
                onClick={() => {
                  if (targetTheme) handlePickTheme(targetTheme)
                }}
                style={{
                  background: featured.cardBg,
                  border: `2px solid ${isCurrentlyActive ? featured.borderColor : 'var(--border)'}`,
                  borderRadius: 14,
                  padding: '16px 20px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 16,
                  boxShadow: isCurrentlyActive
                    ? `0 12px 36px -6px ${featured.borderColor}33, 0 0 0 1px ${featured.borderColor}`
                    : '0 4px 20px -2px rgba(0, 0, 0, 0.15)',
                  position: 'relative',
                  overflow: 'hidden',
                  transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, zIndex: 1 }}>
                  <div
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 12,
                      background: 'rgba(0, 0, 0, 0.35)',
                      border: `1.5px solid ${featured.borderColor}66`,
                      boxShadow: `0 0 16px ${featured.borderColor}33`,
                      display: 'grid',
                      placeItems: 'center',
                      fontSize: 22,
                      flexShrink: 0,
                    }}
                  >
                    {featured.label.split(' ')[0]}
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 14, fontWeight: 700, color: featured.textColor }}>
                        {featured.name}
                      </span>
                      <span
                        style={{
                          fontSize: 9,
                          fontWeight: 700,
                          background: `${featured.badgeColor}22`,
                          color: featured.badgeColor,
                          border: `1px solid ${featured.badgeColor}55`,
                          padding: '2px 8px',
                          borderRadius: 9999,
                          letterSpacing: '0.04em',
                          textTransform: 'uppercase',
                        }}
                      >
                        {featured.badge}
                      </span>
                    </div>
                    <div style={{ fontSize: 11.5, color: featured.subTextColor, marginTop: 3 }}>
                      {featured.subtitle}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0, zIndex: 1 }}>
                  <div
                    style={{
                      display: 'flex',
                      gap: 6,
                      padding: '5px 9px',
                      background: 'rgba(0,0,0,0.3)',
                      borderRadius: 20,
                      border: '1px solid rgba(255,255,255,0.08)',
                    }}
                  >
                    {featured.dots.map((dot, idx) => (
                      <div
                        key={idx}
                        style={{
                          width: 10,
                          height: 10,
                          borderRadius: '50%',
                          background: dot,
                          border: '1px solid rgba(255,255,255,0.2)',
                          boxShadow: idx === 1 ? `0 0 8px ${dot}` : 'none',
                        }}
                      />
                    ))}
                  </div>

                  {isCurrentlyActive ? (
                    <span
                      style={{
                        background: featured.badgeColor,
                        color: featured.pillColor,
                        fontSize: 11,
                        fontWeight: 700,
                        padding: '5px 12px',
                        borderRadius: 9999,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 5,
                        boxShadow: `0 2px 12px ${featured.badgeColor}66`,
                      }}
                    >
                      <CheckIcon size={12} /> Active
                    </span>
                  ) : (
                    <span
                      style={{
                        background: featured.pillBg,
                        color: featured.pillColor,
                        borderRadius: 9999,
                        padding: '5px 14px',
                        fontSize: 11,
                        fontWeight: 700,
                        boxShadow: `0 2px 10px ${featured.borderColor}44`,
                      }}
                    >
                      Apply Theme
                    </span>
                  )}
                </div>
              </div>
            )
          })()}
        </div>
      )}

      {/* ── Themes Grid ─────────────────────────────────────────────── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
          gap: 12,
          marginBottom: 24,
        }}
      >
        {filteredThemes.map(theme => {
          const isActive = currentThemeId === theme.id
          const [bgColor, accentColor, textColor, secondaryColor] = theme.previewColors

          return (
            <div
              key={theme.id}
              onClick={() => handlePickTheme(theme)}
              style={{
                background: 'var(--bg-card)',
                border: '1px solid',
                borderColor: isActive ? 'var(--accent)' : 'var(--border)',
                borderRadius: 8,
                padding: 12,
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                transition: 'all 0.15s ease',
                boxShadow: isActive ? '0 0 12px var(--accent-subtle)' : 'none',
                position: 'relative',
              }}
              onMouseEnter={e => {
                if (!isActive) e.currentTarget.style.borderColor = 'var(--accent)'
              }}
              onMouseLeave={e => {
                if (!isActive) e.currentTarget.style.borderColor = 'var(--border)'
              }}
            >
              <div>
                {/* Title and Active Badge */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 6 }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-base)' }}>
                        {theme.name}
                      </span>
                      {theme.isExtensionTheme && (
                        <span
                          style={{
                            fontSize: 8.5,
                            fontWeight: 700,
                            background: 'rgba(59, 130, 246, 0.15)',
                            color: '#38bdf8',
                            border: '1px solid rgba(59, 130, 246, 0.35)',
                            padding: '1px 5px',
                            borderRadius: 4,
                          }}
                        >
                          🧩 Extension
                        </span>
                      )}
                      {theme.id === 'alvor-titanium' && (
                        <span
                          style={{
                            fontSize: 8.5,
                            fontWeight: 700,
                            background: 'linear-gradient(135deg, rgba(5, 150, 105, 0.15), rgba(16, 185, 129, 0.25))',
                            color: '#059669',
                            border: '1px solid rgba(5, 150, 105, 0.4)',
                            padding: '1px 6px',
                            borderRadius: 4,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 3,
                          }}
                        >
                          💍 Alvor Video Edition
                        </span>
                      )}
                      {theme.id === 'source-cybernetic' && (
                        <span
                          style={{
                            fontSize: 8.5,
                            fontWeight: 700,
                            background: 'rgba(0, 229, 117, 0.15)',
                            color: '#00e575',
                            border: '1px solid rgba(0, 229, 117, 0.4)',
                            padding: '1px 6px',
                            borderRadius: 4,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 3,
                          }}
                        >
                          ⚡ Source Video Edition
                        </span>
                      )}
                      {theme.id === 'alvor-forest' && (
                        <span
                          style={{
                            fontSize: 8.5,
                            fontWeight: 700,
                            background: 'rgba(74, 222, 128, 0.15)',
                            color: '#4ade80',
                            border: '1px solid rgba(74, 222, 128, 0.4)',
                            padding: '1px 6px',
                            borderRadius: 4,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 3,
                          }}
                        >
                          🌲 Alvor Bio-Sage Edition
                        </span>
                      )}
                      {theme.id === 'omni-agent' && (
                        <span
                          style={{
                            fontSize: 8.5,
                            fontWeight: 700,
                            background: 'rgba(200, 241, 53, 0.15)',
                            color: '#c8f135',
                            border: '1px solid rgba(200, 241, 53, 0.4)',
                            padding: '1px 6px',
                            borderRadius: 4,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 3,
                          }}
                        >
                          🔋 OmniAgent Studio Edition
                        </span>
                      )}
                      {theme.id === 'revenue-x' && (
                        <span
                          style={{
                            fontSize: 8.5,
                            fontWeight: 700,
                            background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.15), rgba(217, 119, 6, 0.25))',
                            color: '#d97706',
                            border: '1px solid rgba(245, 158, 11, 0.45)',
                            padding: '1px 6px',
                            borderRadius: 4,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 3,
                          }}
                        >
                          🌅 RevenueX Sunset Edition
                        </span>
                      )}
                      {theme.id === 'apitex-fintech' && (
                        <span
                          style={{
                            fontSize: 8.5,
                            fontWeight: 700,
                            background: 'linear-gradient(135deg, rgba(251, 113, 133, 0.15), rgba(244, 63, 94, 0.25))',
                            color: '#f43f5e',
                            border: '1px solid rgba(251, 113, 133, 0.45)',
                            padding: '1px 6px',
                            borderRadius: 4,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 3,
                          }}
                        >
                          💳 Apitex Fintech Edition
                        </span>
                      )}
                      {theme.id === 'revenue-x-noir' && (
                        <span
                          style={{
                            fontSize: 8.5,
                            fontWeight: 700,
                            background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.2), rgba(168, 85, 247, 0.25))',
                            color: '#fbbf24',
                            border: '1px solid rgba(245, 158, 11, 0.5)',
                            padding: '1px 6px',
                            borderRadius: 4,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 3,
                          }}
                        >
                          🌌 RevenueX Noir Edition
                        </span>
                      )}
                      {theme.id === 'apitex-noir' && (
                        <span
                          style={{
                            fontSize: 8.5,
                            fontWeight: 700,
                            background: 'linear-gradient(135deg, rgba(251, 113, 133, 0.2), rgba(251, 146, 60, 0.25))',
                            color: '#fb7185',
                            border: '1px solid rgba(251, 113, 133, 0.5)',
                            padding: '1px 6px',
                            borderRadius: 4,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 3,
                          }}
                        >
                          ✨ Apitex Noir Edition
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 1 }}>
                      by {theme.author}
                    </div>
                  </div>

                  {isActive && (
                    <span
                      style={{
                        background: 'var(--accent-subtle)',
                        border: '1px solid var(--accent)',
                        color: 'var(--accent)',
                        fontSize: 9,
                        fontWeight: 700,
                        padding: '2px 6px',
                        borderRadius: 10,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 3,
                      }}
                    >
                      <CheckIcon size={10} /> Active
                    </span>
                  )}
                </div>

                {/* Description */}
                <p
                  style={{
                    fontSize: 11,
                    color: 'var(--text-muted)',
                    lineHeight: 1.4,
                    marginTop: 8,
                    marginBottom: 12,
                    minHeight: 28,
                  }}
                >
                  {theme.description}
                </p>
              </div>

              {/* ── Theme Color Swatches Preview ── */}
              <div>
                <div
                  style={{
                    height: 28,
                    background: bgColor,
                    border: '1px solid var(--border)',
                    borderRadius: 5,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0 8px',
                  }}
                >
                  <span
                    style={{
                      fontFamily: 'JetBrains Mono',
                      fontSize: 10,
                      fontWeight: 600,
                      color: textColor,
                    }}
                  >
                    code
                  </span>

                  <div style={{ display: 'flex', gap: 5 }}>
                    <div
                      style={{
                        width: 10,
                        height: 10,
                        borderRadius: '50%',
                        background: accentColor,
                        border: '1px solid rgba(0,0,0,0.2)',
                      }}
                      title="Accent"
                    />
                    <div
                      style={{
                        width: 10,
                        height: 10,
                        borderRadius: '50%',
                        background: secondaryColor,
                        border: '1px solid rgba(0,0,0,0.2)',
                      }}
                      title="Secondary"
                    />
                    <div
                      style={{
                        width: 10,
                        height: 10,
                        borderRadius: '50%',
                        background: textColor,
                        border: '1px solid rgba(0,0,0,0.2)',
                      }}
                      title="Foreground"
                    />
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* ── Section: Editor Font Colors (Requested Feature) ─────────── */}
      <div
        style={{
          borderTop: '1px solid var(--border)',
          paddingTop: 18,
          marginTop: 6,
          marginBottom: 18,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-base)' }}>
              🎨 Editor Code Font & Syntax Colors
            </span>
            <span
              style={{
                fontSize: 10,
                background: 'var(--accent-subtle)',
                color: 'var(--accent)',
                padding: '2px 8px',
                borderRadius: 12,
                fontWeight: 600,
              }}
            >
              Independent Override
            </span>
          </div>

          {currentFontColor !== 'default' && (
            <button
              onClick={() => onSelectFontColor && onSelectFontColor('default')}
              style={{
                background: 'transparent',
                border: '1px solid var(--border)',
                color: 'var(--text-muted)',
                fontSize: 11,
                padding: '3px 8px',
                borderRadius: 4,
                cursor: 'pointer',
              }}
            >
              Reset to Theme Default
            </button>
          )}
        </div>

        <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: '0 0 10px' }}>
          Instantly transform your code text colors - choose from glowing Cyberpunk neons, retro hacker emerald, luxury gold, or soothing pastels.
        </p>

        {/* Font Color Presets Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))',
            gap: 8,
            marginBottom: 14,
          }}
        >
          {EDITOR_FONT_COLORS.map(fc => {
            const isSelected =
              currentFontColor === fc.color ||
              (fc.color === 'default' && (!currentFontColor || currentFontColor === 'default'))

            return (
              <button
                key={fc.id}
                onClick={() => handlePickFontColor(fc)}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 8,
                  padding: '8px 10px',
                  background: isSelected ? 'var(--bg-hover)' : 'var(--bg-card)',
                  border: '1px solid',
                  borderColor: isSelected ? 'var(--accent)' : 'var(--border)',
                  borderRadius: 6,
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.15s ease',
                  boxShadow: isSelected ? `0 0 10px ${fc.glow || 'var(--accent-subtle)'}` : 'none',
                }}
              >
                <div
                  style={{
                    width: 14,
                    height: 14,
                    borderRadius: '50%',
                    background:
                      fc.color === 'default'
                        ? 'conic-gradient(#ff0000, #ffff00, #00ff00, #00ffff, #0000ff, #ff00ff, #ff0000)'
                        : fc.color,
                    border: '1px solid rgba(0,0,0,0.25)',
                    flexShrink: 0,
                    marginTop: 2,
                    boxShadow: fc.glow ? `0 0 6px ${fc.glow}` : 'none',
                  }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: 11,
                      fontWeight: isSelected ? 700 : 500,
                      color: isSelected ? 'var(--text-base)' : 'var(--text-muted)',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {fc.name}
                  </div>
                  {fc.description && (
                    <div style={{ fontSize: 9, color: 'var(--text-dim)', marginTop: 1, lineHeight: 1.2 }}>
                      {fc.description}
                    </div>
                  )}
                </div>
                {isSelected && <CheckIcon size={12} />}
              </button>
            )
          })}
        </div>

        {/* Custom Color Input & Picker */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: 8,
            padding: '10px 12px',
            marginBottom: 16,
          }}
        >
          <input
            type="color"
            value={parseAnyColorToHex(customHex) || '#00f0ff'}
            onChange={e => handleApplyCustomHex(e.target.value)}
            style={{
              width: 32,
              height: 32,
              padding: 0,
              border: 'none',
              borderRadius: 6,
              cursor: 'pointer',
              background: 'transparent',
            }}
            title="Choose custom font color"
          />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-base)' }}>
              Custom Code Color (All Formats Supported)
            </div>
            <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>
              Hex (#00f0ff), RGB (rgb(0,240,255)), HSL, ya Name (cyan, gold, lime) daalein
            </div>
          </div>
          <input
            type="text"
            value={customHex}
            onChange={e => handleApplyCustomHex(e.target.value)}
            placeholder="#00f0ff / cyan / rgb(...)"
            style={{
              width: 140,
              padding: '5px 8px',
              fontSize: 11,
              fontFamily: 'JetBrains Mono',
              borderRadius: 4,
              border: '1px solid var(--border)',
              background: 'var(--bg-input)',
              color: 'var(--text-base)',
              outline: 'none',
            }}
          />
        </div>

        {/* ── Section: Comment Words Color (Requested Feature) ─────────── */}
        <div
          style={{
            borderTop: '1px solid var(--border)',
            paddingTop: 18,
            marginTop: 6,
            marginBottom: 18,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-base)' }}>
                💬 Comment Words & Syntax Color
              </span>
              <span
                style={{
                  fontSize: 10,
                  background: 'rgba(106, 153, 85, 0.2)',
                  color: '#6a9955',
                  border: '1px solid rgba(106, 153, 85, 0.4)',
                  padding: '2px 8px',
                  borderRadius: 12,
                  fontWeight: 600,
                }}
              >
                Comments Override
              </span>
            </div>
          </div>

          <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: '0 0 12px' }}>
            Comments (<code>//</code>, <code>/* */</code>, <code>#</code>) ke words ka colour By Default theme color rakhein ya custom colour code enter karke badlein.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
            {/* 1. By Default Option */}
            <button
              type="button"
              onClick={() => {
                if (onSelectCommentColor) onSelectCommentColor('default')
                setCustomCommentHex('#6a9955')
                showToast('💬 Comments: By Default Theme Color')
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 14px',
                background: (!currentCommentColor || currentCommentColor === 'default') ? 'var(--bg-hover)' : 'var(--bg-card)',
                border: '1px solid',
                borderColor: (!currentCommentColor || currentCommentColor === 'default') ? 'var(--accent)' : 'var(--border)',
                borderRadius: 8,
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.15s ease',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div
                  style={{
                    width: 16,
                    height: 16,
                    borderRadius: '50%',
                    background: defaultCommentForeground ? `#${defaultCommentForeground}` : '#6a9955',
                    border: '1px solid rgba(0,0,0,0.25)',
                    flexShrink: 0,
                  }}
                />
                <div>
                  <div style={{ fontSize: 12, fontWeight: (!currentCommentColor || currentCommentColor === 'default') ? 700 : 500, color: 'var(--text-base)' }}>
                    By Default (Theme Color)
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 1 }}>
                    Active theme ka default comment color ({activeTheme.name})
                  </div>
                </div>
              </div>
              {(!currentCommentColor || currentCommentColor === 'default') && (
                <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 700, color: 'var(--accent)' }}>
                  <CheckIcon size={12} /> Active
                </span>
              )}
            </button>

            {/* 2. Colour Code Dalke Change Karne Ka Option */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                background: (currentCommentColor && currentCommentColor !== 'default') ? 'var(--bg-hover)' : 'var(--bg-card)',
                border: '1px solid',
                borderColor: (currentCommentColor && currentCommentColor !== 'default') ? 'var(--accent)' : 'var(--border)',
                borderRadius: 8,
                padding: '10px 14px',
                transition: 'all 0.15s ease',
              }}
            >
              <input
                type="color"
                value={parseAnyColorToHex(customCommentHex) || '#6a9955'}
                onChange={e => handleApplyCustomCommentHex(e.target.value)}
                style={{
                  width: 34,
                  height: 34,
                  padding: 0,
                  border: 'none',
                  borderRadius: 6,
                  cursor: 'pointer',
                  background: 'transparent',
                }}
                title="Choose comment color"
              />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, fontWeight: (currentCommentColor && currentCommentColor !== 'default') ? 700 : 500, color: 'var(--text-base)' }}>
                  Colour Code Dalkar Change Karein (All Formats)
                </div>
                <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                  Hex (#6a9955), RGB (rgb(0,255,100)), HSL, ya Name (lime, cyan, coral) daalein
                </div>
              </div>
              <input
                type="text"
                value={customCommentHex}
                onChange={e => handleApplyCustomCommentHex(e.target.value)}
                placeholder="#6a9955 / lime / rgb(...)"
                style={{
                  width: 140,
                  padding: '6px 10px',
                  fontSize: 11,
                  fontFamily: 'JetBrains Mono',
                  borderRadius: 6,
                  border: '1px solid var(--border)',
                  background: 'var(--bg-input)',
                  color: 'var(--text-base)',
                  outline: 'none',
                }}
              />
            </div>
          </div>
        </div>

        {/* Live Code Preview Box */}
        <div
          style={{
            background: activeTheme.previewColors[0],
            border: '1px solid var(--border)',
            borderRadius: 8,
            padding: '12px 16px',
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: 12,
            lineHeight: 1.6,
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 8,
              borderBottom: '1px solid rgba(255,255,255,0.08)',
              paddingBottom: 6,
              flexWrap: 'wrap',
              gap: 8,
            }}
          >
            <span style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600 }}>
              LIVE PREVIEW: {activeTheme.name}
            </span>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <span
                style={{
                  fontSize: 10,
                  color: previewTextColor,
                  fontWeight: 600,
                }}
              >
                Code Font: {currentFontColor === 'default' ? 'Theme Default' : currentFontColor}
              </span>
              <span
                style={{
                  fontSize: 10,
                  color: previewCommentColor,
                  fontWeight: 600,
                }}
              >
                Comments: {currentCommentColor === 'default' || !currentCommentColor ? 'Theme Default' : currentCommentColor}
              </span>
            </div>
          </div>
          <div>
            <span style={{ color: activeTheme.previewColors[1], fontWeight: 600 }}>function</span>{' '}
            <span style={{ color: previewTextColor, fontWeight: 700 }}>calculateSpeed</span>
            <span style={{ color: previewTextColor }}>(</span>
            <span style={{ color: previewTextColor }}>distance</span>
            <span style={{ color: previewTextColor }}>, </span>
            <span style={{ color: previewTextColor }}>time</span>
            <span style={{ color: previewTextColor }}>) {'{'}</span>
          </div>
          <div style={{ paddingLeft: 18 }}>
            <span style={{ color: previewCommentColor, fontStyle: 'italic' }}>
              // Real-time custom comment color: {previewCommentColor}
            </span>
          </div>
          <div style={{ paddingLeft: 18 }}>
            <span style={{ color: activeTheme.previewColors[1] }}>const</span>{' '}
            <span style={{ color: previewTextColor }}>speed</span>{' '}
            <span style={{ color: previewTextColor }}>=</span>{' '}
            <span style={{ color: previewTextColor }}>distance</span>{' '}
            <span style={{ color: previewTextColor }}>/</span>{' '}
            <span style={{ color: previewTextColor }}>time</span>
            <span style={{ color: previewTextColor }}>;</span>
          </div>
          <div style={{ paddingLeft: 18 }}>
            <span style={{ color: activeTheme.previewColors[1] }}>return</span>{' '}
            <span style={{ color: previewTextColor }}>speed</span>
            <span style={{ color: previewTextColor }}>;</span>
          </div>
          <div>
            <span style={{ color: previewTextColor }}>{'}'}</span>
          </div>
        </div>
      </div>
    </div>
  )
}


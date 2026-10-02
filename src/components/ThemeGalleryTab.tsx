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


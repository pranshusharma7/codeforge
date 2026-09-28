import { useState } from 'react'
import { VSCODE_THEMES, EDITOR_FONT_COLORS, type ThemeDefinition, type FontColorOption } from '../lib/themes'
import { CheckIcon } from './icons'

interface Props {
  currentThemeId: string
  onSelectTheme: (themeId: string) => void
  currentFontColor?: string
  onSelectFontColor?: (color: string) => void
  showToast: (msg: string) => void
}

export default function ThemeGalleryTab({
  currentThemeId,
  onSelectTheme,
  currentFontColor = 'default',
  onSelectFontColor,
  showToast,
}: Props) {
  const [search, setSearch] = useState('')
  const [filterCategory, setFilterCategory] = useState<'all' | 'dark' | 'light'>('all')
  const [customHex, setCustomHex] = useState(currentFontColor.startsWith('#') ? currentFontColor : '#00f0ff')

  const totalThemes = VSCODE_THEMES.length
  const darkThemesCount = VSCODE_THEMES.filter(t => t.category === 'dark').length
  const lightThemesCount = VSCODE_THEMES.filter(t => t.category === 'light').length

  const filteredThemes = VSCODE_THEMES.filter(theme => {
    const matchesSearch =
      theme.name.toLowerCase().includes(search.toLowerCase()) ||
      theme.author.toLowerCase().includes(search.toLowerCase()) ||
      theme.description.toLowerCase().includes(search.toLowerCase())
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
      showToast(`🎨 Font Color: ${option.name}`)
    }
  }

  const handleApplyCustomHex = (hex: string) => {
    setCustomHex(hex)
    if (onSelectFontColor && /^#[0-9A-Fa-f]{6}$/.test(hex)) {
      onSelectFontColor(hex)
      showToast(`🎨 Custom Font Color: ${hex}`)
    }
  }

  const activeTheme = VSCODE_THEMES.find(t => t.id === currentThemeId) || VSCODE_THEMES[0]
  const previewTextColor =
    currentFontColor === 'default'
      ? activeTheme.previewColors[2]
      : currentFontColor

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
          {(['all', 'dark', 'light'] as const).map(cat => (
            <button
              key={cat}
              onClick={() => setFilterCategory(cat)}
              style={{
                border: 'none',
                background: filterCategory === cat ? 'var(--bg-hover)' : 'transparent',
                color: filterCategory === cat ? 'var(--text-base)' : 'var(--text-muted)',
                padding: '4px 10px',
                borderRadius: 4,
                fontSize: 11,
                cursor: 'pointer',
                fontWeight: filterCategory === cat ? 600 : 400,
                textTransform: 'capitalize',
              }}
            >
              {cat === 'all'
                ? `All (${totalThemes})`
                : cat === 'dark'
                ? `Dark (${darkThemesCount})`
                : `Light (${lightThemesCount})`}
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
                    <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-base)' }}>
                      {theme.name}
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
          Instantly transform your code text colors — choose from glowing Cyberpunk neons, retro hacker emerald, luxury gold, or soothing pastels.
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
            value={customHex.startsWith('#') ? customHex : '#00f0ff'}
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
              Custom Hex Color
            </div>
            <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>
              Pick any custom color for your code editor
            </div>
          </div>
          <input
            type="text"
            value={customHex}
            onChange={e => handleApplyCustomHex(e.target.value)}
            placeholder="#00f0ff"
            style={{
              width: 90,
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
            }}
          >
            <span style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600 }}>
              LIVE PREVIEW: {activeTheme.name}
            </span>
            <span
              style={{
                fontSize: 10,
                color: previewTextColor,
                fontWeight: 600,
              }}
            >
              Font Color: {currentFontColor === 'default' ? 'Theme Default' : currentFontColor}
            </span>
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
            <span style={{ color: activeTheme.previewColors[3], fontStyle: 'italic' }}>
              // Real-time custom font color preview
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


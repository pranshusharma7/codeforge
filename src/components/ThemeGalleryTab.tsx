import { useState } from 'react'
import { VSCODE_THEMES, type ThemeDefinition } from '../lib/themes'
import { CheckIcon } from './icons'

interface Props {
  currentThemeId: string
  onSelectTheme: (themeId: string) => void
  showToast: (msg: string) => void
}

export default function ThemeGalleryTab({ currentThemeId, onSelectTheme, showToast }: Props) {
  const [search, setSearch] = useState('')
  const [filterCategory, setFilterCategory] = useState<'all' | 'dark' | 'light'>('all')

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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* ── Header: Search & Filter ──────────────────────────────────── */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 10,
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 16,
        }}
      >
        <div style={{ display: 'flex', gap: 8, flex: 1, minWidth: 200 }}>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search VS Code themes (e.g. Dracula, Monokai, Nord)..."
            className="ide-input"
            style={{ flex: 1, fontSize: 12, padding: '7px 10px' }}
          />
        </div>

        {/* Category Pills */}
        <div
          style={{
            display: 'flex',
            background: '#0d1117',
            border: '1px solid #21262d',
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
                background: filterCategory === cat ? '#21262d' : 'transparent',
                color: filterCategory === cat ? '#e6edf3' : '#7d8590',
                padding: '4px 10px',
                borderRadius: 4,
                fontSize: 11,
                cursor: 'pointer',
                fontWeight: filterCategory === cat ? 600 : 400,
                textTransform: 'capitalize',
              }}
            >
              {cat === 'all' ? 'All (15)' : cat === 'dark' ? 'Dark (13)' : 'Light (2)'}
            </button>
          ))}
        </div>
      </div>

      {/* ── Themes Grid ─────────────────────────────────────────────── */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))',
          gap: 12,
          paddingRight: 4,
          paddingBottom: 8,
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
                background: '#0d1117',
                border: '1px solid',
                borderColor: isActive ? '#a78bfa' : '#21262d',
                borderRadius: 8,
                padding: 12,
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                transition: 'all 0.15s ease',
                boxShadow: isActive ? '0 0 12px rgba(167, 139, 250, 0.18)' : 'none',
                position: 'relative',
              }}
              onMouseEnter={e => {
                if (!isActive) e.currentTarget.style.borderColor = '#388bfd'
              }}
              onMouseLeave={e => {
                if (!isActive) e.currentTarget.style.borderColor = '#21262d'
              }}
            >
              <div>
                {/* Title and Active Badge */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 6 }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#e6edf3' }}>
                      {theme.name}
                    </div>
                    <div style={{ fontSize: 10, color: '#7d8590', marginTop: 1 }}>
                      by {theme.author}
                    </div>
                  </div>

                  {isActive && (
                    <span
                      style={{
                        background: '#7c3aed25',
                        border: '1px solid #7c3aed',
                        color: '#a78bfa',
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
                    color: '#7d8590',
                    lineHeight: 1.4,
                    marginTop: 8,
                    marginBottom: 12,
                    minHeight: 30,
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
                    border: '1px solid #30363d',
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
    </div>
  )
}

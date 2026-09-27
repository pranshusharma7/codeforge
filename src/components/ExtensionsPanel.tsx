import React, { useState, useRef } from 'react'
import type { Extension, ExtensionCategory } from '../extensions/types'
import {
  toggleExtensionState,
  addCustomExtension,
  removeExtension,
  generateSampleExtensionJSON
} from '../extensions/registry'
import { TrashIcon, CheckIcon, SparklesIcon, PlusIcon } from './icons'

interface Props {
  extensions: Extension[]
  onExtensionsChange: (exts: Extension[]) => void
  showToast: (msg: string) => void
}

export default function ExtensionsPanel({
  extensions,
  onExtensionsChange,
  showToast
}: Props) {
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState<'all' | 'installed' | ExtensionCategory>('all')
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [customName, setCustomName] = useState('')
  const [customDesc, setCustomDesc] = useState('')
  const [customTrigger, setCustomTrigger] = useState('')
  const [customCode, setCustomCode] = useState('')
  const [customIcon, setCustomIcon] = useState('⚡')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleToggle = (id: string, name: string) => {
    const updated = toggleExtensionState(id)
    onExtensionsChange(updated)
    const target = updated.find(e => e.id === id)
    showToast(`${name} is now ${target?.enabled ? 'Enabled' : 'Disabled'}`)
  }

  const handleDeleteCustom = (id: string, name: string, e: React.MouseEvent) => {
    e.stopPropagation()
    const updated = removeExtension(id)
    onExtensionsChange(updated)
    showToast(`Uninstalled custom extension '${name}'`)
  }

  // Handle JSON file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (evt) => {
      try {
        const content = evt.target?.result as string
        const parsed = JSON.parse(content)
        if (!parsed.name) {
          showToast('Invalid extension JSON: missing name property')
          return
        }
        const updated = addCustomExtension(parsed)
        onExtensionsChange(updated)
        showToast(`Installed extension: ${parsed.name} 🧩`)
        setShowUploadModal(false)
      } catch (err) {
        showToast('Failed to parse extension JSON file')
      }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  // Handle manual custom extension creation
  const handleCreateCustom = (e: React.FormEvent) => {
    e.preventDefault()
    if (!customName.trim()) return

    const newExtData: Partial<Extension> = {
      name: customName.trim(),
      description: customDesc.trim() || 'Custom code helper extension',
      icon: customIcon || '⚡',
      category: 'custom',
      tags: ['custom', 'user-upload'],
      completions: customTrigger.trim() && customCode.trim() ? [
        {
          trigger: customTrigger.trim(),
          code: customCode,
          description: `Custom autocomplete for '${customTrigger.trim()}'`
        }
      ] : []
    }

    const updated = addCustomExtension(newExtData)
    onExtensionsChange(updated)
    showToast(`Custom extension '${customName}' installed!`)
    setShowUploadModal(false)
    setCustomName('')
    setCustomDesc('')
    setCustomTrigger('')
    setCustomCode('')
  }

  const handleDownloadTemplate = () => {
    const jsonStr = generateSampleExtensionJSON()
    const blob = new Blob([jsonStr], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'sample-extension.json'
    a.click()
    URL.revokeObjectURL(url)
    showToast('Downloaded sample-extension.json template')
  }

  // Filter extensions
  const filtered = extensions.filter(ext => {
    const matchesSearch =
      ext.name.toLowerCase().includes(search.toLowerCase()) ||
      ext.description.toLowerCase().includes(search.toLowerCase()) ||
      ext.author.toLowerCase().includes(search.toLowerCase()) ||
      ext.tags.some(t => t.toLowerCase().includes(search.toLowerCase()))

    if (!matchesSearch) return false

    if (activeCategory === 'installed') return ext.enabled
    if (activeCategory === 'all') return true
    return ext.category === activeCategory
  })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--bg-sidebar)', color: 'var(--text-base)', fontSize: 12 }}>
      
      {/* ── Top Header & Search ───────────────────────────────────────── */}
      <div style={{ padding: '10px 12px 6px', borderBottom: '1px solid var(--border)', background: 'var(--bg-header)', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
            Extensions Marketplace
          </span>
          <button
            onClick={() => setShowUploadModal(true)}
            className="btn btn-ghost"
            style={{ padding: '2px 7px', fontSize: 11, color: 'var(--accent)', gap: 4 }}
            title="Upload or create a custom extension"
          >
            <PlusIcon size={12} /> Add Extension
          </button>
        </div>

        {/* Search input */}
        <div style={{ position: 'relative', marginBottom: 8 }}>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search extensions (e.g. copilot, linter, snippets)..."
            className="ide-input"
            style={{ width: '100%', fontSize: 11, padding: '6px 8px 6px 26px', boxSizing: 'border-box' }}
          />
          <span style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)', fontSize: 11 }}>
            ⌕
          </span>
        </div>

        {/* Filter categories pills */}
        <div style={{ display: 'flex', gap: 4, overflowX: 'auto', paddingBottom: 2 }}>
          {([
            { id: 'all', label: 'All' },
            { id: 'installed', label: 'Installed' },
            { id: 'ai', label: 'AI Copilot' },
            { id: 'linter', label: 'Linter' },
            { id: 'snippets', label: 'Snippets' },
            { id: 'custom', label: 'Custom' }
          ] as const).map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveCategory(tab.id as any)}
              style={{
                background: activeCategory === tab.id ? 'var(--accent-subtle)' : 'transparent',
                color: activeCategory === tab.id ? 'var(--accent)' : 'var(--text-muted)',
                border: `1px solid ${activeCategory === tab.id ? 'var(--accent-border)' : 'var(--border)'}`,
                borderRadius: 4,
                padding: '2px 8px',
                fontSize: 10,
                fontWeight: activeCategory === tab.id ? 600 : 400,
                cursor: 'pointer',
                whiteSpace: 'nowrap'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Extension List ───────────────────────────────────────────── */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '6px 8px' }}>
        {filtered.length === 0 ? (
          <div style={{ padding: '28px 14px', textAlign: 'center', color: 'var(--text-dim)', fontSize: 11 }}>
            No matching extensions found.<br/>
            Click <b>Add Extension</b> to upload your custom plugin!
          </div>
        ) : (
          filtered.map(ext => (
            <div
              key={ext.id}
              style={{
                background: 'var(--bg-card)',
                border: '1px solid',
                borderColor: ext.enabled ? 'var(--accent-border)' : 'var(--border)',
                borderRadius: 8,
                padding: 10,
                marginBottom: 8,
                display: 'flex',
                flexDirection: 'column',
                gap: 6,
                transition: 'all 0.15s ease'
              }}
            >
              {/* Header: Icon, Title, Author, Toggle */}
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0, flex: 1 }}>
                  {/* Extension Logo/Icon */}
                  <div
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 6,
                      background: ext.category === 'ai' ? 'linear-gradient(135deg,#7c3aed,#a78bfa)' : 'var(--bg-header)',
                      color: ext.category === 'ai' ? '#fff' : 'var(--accent)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 13,
                      flexShrink: 0,
                      border: '1px solid var(--border)'
                    }}
                  >
                    {ext.icon}
                  </div>

                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-base)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {ext.name}
                      </span>
                      <span style={{ fontSize: 9, color: 'var(--text-dim)', padding: '1px 4px', background: 'var(--bg-app)', borderRadius: 3, border: '1px solid var(--border)' }}>
                        v{ext.version}
                      </span>
                    </div>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 1 }}>
                      by {ext.author}
                    </div>
                  </div>
                </div>

                {/* Enable/Disable Toggle Switch */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  {!ext.isBuiltIn && (
                    <button
                      onClick={(e) => handleDeleteCustom(ext.id, ext.name, e)}
                      title="Uninstall custom extension"
                      style={{ background: 'transparent', border: 'none', color: 'var(--red)', cursor: 'pointer', padding: 2, opacity: 0.7 }}
                    >
                      <TrashIcon size={12} />
                    </button>
                  )}

                  <label
                    style={{
                      position: 'relative',
                      display: 'inline-block',
                      width: 32,
                      height: 18,
                      cursor: 'pointer'
                    }}
                    title={ext.enabled ? 'Click to Disable' : 'Click to Enable'}
                  >
                    <input
                      type="checkbox"
                      checked={ext.enabled}
                      onChange={() => handleToggle(ext.id, ext.name)}
                      style={{ opacity: 0, width: 0, height: 0 }}
                    />
                    <span
                      style={{
                        position: 'absolute',
                        inset: 0,
                        backgroundColor: ext.enabled ? '#22c55e' : 'var(--border)',
                        borderRadius: 18,
                        transition: 'background-color 0.2s'
                      }}
                    />
                    <span
                      style={{
                        position: 'absolute',
                        left: ext.enabled ? 16 : 2,
                        top: 2,
                        width: 14,
                        height: 14,
                        backgroundColor: '#ffffff',
                        borderRadius: '50%',
                        transition: 'left 0.2s',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.3)'
                      }}
                    />
                  </label>
                </div>
              </div>

              {/* Description */}
              <div style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.4 }}>
                {ext.description}
              </div>

              {/* Badges / Tags */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 2, fontSize: 10, color: 'var(--text-dim)' }}>
                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                  {ext.tags.slice(0, 3).map(tag => (
                    <span key={tag} style={{ background: 'var(--bg-app)', border: '1px solid var(--border)', borderRadius: 3, padding: '1px 5px', fontSize: 9 }}>
                      #{tag}
                    </span>
                  ))}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  {ext.enabled ? (
                    <span style={{ color: '#22c55e', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 3 }}>
                      <CheckIcon size={10} /> Active
                    </span>
                  ) : (
                    <span style={{ color: 'var(--text-dim)' }}>Disabled</span>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* ── Upload & Create Extension Modal ──────────────────────────── */}
      {showUploadModal && (
        <div className="modal-backdrop" onClick={() => setShowUploadModal(false)}>
          <div
            className="modal-box"
            style={{ width: 480, maxWidth: '92vw', padding: 20 }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 16 }}>🧩</span>
                <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-base)' }}>
                  Add / Upload Extension
                </span>
              </div>
              <button
                onClick={() => setShowUploadModal(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer', fontSize: 16 }}
              >
                ✕
              </button>
            </div>

            {/* Upload JSON Option */}
            <div style={{ padding: '12px', background: 'var(--bg-header)', border: '1px dashed var(--border)', borderRadius: 8, marginBottom: 16, textAlign: 'center' }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-base)', marginBottom: 4 }}>
                Option 1: Upload Extension JSON File
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 10 }}>
                Upload any custom extension or plugin package (.json).
              </div>
              <div style={{ display: 'flex', justifyContent: 'center', gap: 8 }}>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept=".json"
                  style={{ display: 'none' }}
                  onChange={handleFileUpload}
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="btn btn-primary"
                  style={{ fontSize: 11, padding: '5px 12px' }}
                >
                  Choose .json File
                </button>
                <button
                  type="button"
                  onClick={handleDownloadTemplate}
                  className="btn btn-ghost"
                  style={{ fontSize: 11, padding: '5px 10px', color: 'var(--accent)' }}
                >
                  Download Template
                </button>
              </div>
            </div>

            {/* Quick Create Custom Form */}
            <form onSubmit={handleCreateCustom} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-base)' }}>
                Option 2: Create Custom Snippet / Auto-Complete Plugin
              </div>

              <div>
                <label style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', marginBottom: 3 }}>
                  Extension Name:
                </label>
                <input
                  required
                  value={customName}
                  onChange={e => setCustomName(e.target.value)}
                  placeholder="e.g. My Fast Algorithms Helper"
                  className="ide-input"
                  style={{ width: '100%', fontSize: 12, padding: '6px 8px', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px', gap: 8 }}>
                <div>
                  <label style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', marginBottom: 3 }}>
                    Trigger Keyword (what user types):
                  </label>
                  <input
                    value={customTrigger}
                    onChange={e => setCustomTrigger(e.target.value)}
                    placeholder="e.g. dfs or log or quicksort"
                    className="ide-input"
                    style={{ width: '100%', fontSize: 12, padding: '6px 8px', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', marginBottom: 3 }}>
                    Icon Emoji:
                  </label>
                  <input
                    value={customIcon}
                    onChange={e => setCustomIcon(e.target.value)}
                    placeholder="⚡"
                    className="ide-input"
                    style={{ width: '100%', fontSize: 12, padding: '6px 8px', textAlign: 'center', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', marginBottom: 3 }}>
                  Code to Insert (auto-suggested on trigger, applied with Tab):
                </label>
                <textarea
                  rows={4}
                  value={customCode}
                  onChange={e => setCustomCode(e.target.value)}
                  placeholder="def dfs(node, visited):\n    if not node: return\n    ..."
                  style={{
                    width: '100%',
                    background: 'var(--bg-input)',
                    border: '1px solid var(--border)',
                    borderRadius: 6,
                    color: 'var(--text-base)',
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: 11,
                    padding: '6px 8px',
                    boxSizing: 'border-box',
                    outline: 'none',
                    resize: 'vertical'
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 4 }}>
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="btn btn-ghost"
                  style={{ fontSize: 12, padding: '6px 14px' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ fontSize: 12, padding: '6px 16px' }}
                >
                  Install Extension
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  )
}

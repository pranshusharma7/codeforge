import React, { useState, useEffect, useRef } from 'react'
import type { Extension, ExtensionCategory } from '../extensions/types'
import {
  toggleExtensionState,
  addCustomExtension,
  removeExtension,
  installExtension,
  generateSampleExtensionJSON
} from '../extensions/registry'
import {
  searchVSCodeMarketplace,
  parseVsixPackage,
  OFFICIAL_VSCODE_CATALOG
} from '../extensions/vscodeMarketplace'
import { TrashIcon, CheckIcon, PlusIcon, DownloadIcon, SpinnerIcon, ExternalLinkIcon, SettingsIcon } from './icons'

interface Props {
  extensions: Extension[]
  onExtensionsChange: (exts: Extension[]) => void
  showToast: (msg: string) => void
}

type FilterTab = 'all' | 'installed' | 'official' | 'ai' | 'linter' | 'formatter' | 'tools' | 'snippets' | 'custom'

export default function ExtensionsPanel({
  extensions,
  onExtensionsChange,
  showToast
}: Props) {
  const [search, setSearch] = useState('')
  const [activeTab, setActiveTab] = useState<FilterTab>('all')
  const [marketplaceResults, setMarketplaceResults] = useState<Extension[]>(OFFICIAL_VSCODE_CATALOG)
  const [isSearchingMarketplace, setIsSearchingMarketplace] = useState(false)
  const [installingIds, setInstallingIds] = useState<Record<string, boolean>>({})

  // Modals
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [showIdInstallModal, setShowIdInstallModal] = useState(false)
  const [customExtensionId, setCustomExtensionId] = useState('')
  const [selectedExtension, setSelectedExtension] = useState<Extension | null>(null)

  // Custom extension form state
  const [customName, setCustomName] = useState('')
  const [customDesc, setCustomDesc] = useState('')
  const [customTrigger, setCustomTrigger] = useState('')
  const [customCode, setCustomCode] = useState('')
  const [customIcon, setCustomIcon] = useState('⚡')

  const vsixInputRef = useRef<HTMLInputElement>(null)
  const jsonInputRef = useRef<HTMLInputElement>(null)

  // Debounced search over official VS Code marketplace
  useEffect(() => {
    let active = true
    setIsSearchingMarketplace(true)
    const timer = setTimeout(async () => {
      try {
        const results = await searchVSCodeMarketplace(search)
        if (active) {
          setMarketplaceResults(results)
        }
      } catch (e) {
        console.error('Marketplace search error:', e)
      } finally {
        if (active) setIsSearchingMarketplace(false)
      }
    }, 280)

    return () => {
      active = false
      clearTimeout(timer)
    }
  }, [search])

  const installedMap = new Map(extensions.map(e => [e.id, e]))

  // Toggle extension enable/disable
  const handleToggle = (id: string, name: string) => {
    const updated = toggleExtensionState(id)
    onExtensionsChange(updated)
    const target = updated.find(e => e.id === id)
    showToast(`${name} is now ${target?.enabled ? 'Enabled' : 'Disabled'}`)
  }

  // Install extension from marketplace
  const handleInstallFromMarketplace = async (ext: Extension) => {
    setInstallingIds(prev => ({ ...prev, [ext.id]: true }))
    try {
      const updated = installExtension(ext)
      onExtensionsChange(updated)
      showToast(`Installed ${ext.displayName || ext.name} successfully! 🧩`)
    } catch (e: any) {
      showToast(`Install failed: ${e.message || 'Unknown error'}`)
    } finally {
      setInstallingIds(prev => ({ ...prev, [ext.id]: false }))
    }
  }

  // Uninstall extension
  const handleUninstall = (id: string, name: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation()
    const updated = removeExtension(id)
    onExtensionsChange(updated)
    showToast(`Uninstalled '${name}'`)
    if (selectedExtension?.id === id) {
      setSelectedExtension(null)
    }
  }

  // Handle .vsix file upload & extraction
  const handleVsixUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    showToast(`Unpacking official VS Code extension: ${file.name}...`)
    try {
      const parsedExt = await parseVsixPackage(file)
      const updated = installExtension(parsedExt)
      onExtensionsChange(updated)
      showToast(`Installed VS Code extension '${parsedExt.displayName || parsedExt.name}' (v${parsedExt.version})! 🎉`)
      setShowUploadModal(false)
    } catch (err: any) {
      console.error('VSIX parse error:', err)
      showToast(`Failed to parse .VSIX: ${err.message || 'Invalid format'}`)
    } finally {
      e.target.value = ''
    }
  }

  // Handle custom JSON file upload
  const handleJsonUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
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
        showToast(`Installed custom extension: ${parsed.name} 🧩`)
        setShowUploadModal(false)
      } catch (err) {
        showToast('Failed to parse extension JSON file')
      }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  // Install by VS Code Extension ID (e.g. ms-python.python)
  const handleInstallById = async (e: React.FormEvent) => {
    e.preventDefault()
    const targetId = customExtensionId.trim()
    if (!targetId) return

    showToast(`Searching VS Code registry for '${targetId}'...`)
    try {
      const results = await searchVSCodeMarketplace(targetId)
      const match = results.find(r => r.id.toLowerCase() === targetId.toLowerCase()) || results[0]
      if (match) {
        const updated = installExtension(match)
        onExtensionsChange(updated)
        showToast(`Installed '${match.displayName || match.name}' from VS Code Marketplace! 🚀`)
        setShowIdInstallModal(false)
        setCustomExtensionId('')
      } else {
        showToast(`Could not find extension '${targetId}' on VS Code registry`)
      }
    } catch (err: any) {
      showToast(`Error fetching extension: ${err.message || 'Network error'}`)
    }
  }

  // Handle manual custom snippet extension creation
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

  // Merge installed extensions and marketplace results for display
  const allMergedList: Extension[] = (() => {
    if (activeTab === 'installed') {
      return extensions.filter(e => {
        const matchesSearch = !search ||
          e.name.toLowerCase().includes(search.toLowerCase()) ||
          e.description.toLowerCase().includes(search.toLowerCase()) ||
          e.author.toLowerCase().includes(search.toLowerCase()) ||
          e.tags.some(t => t.toLowerCase().includes(search.toLowerCase()))
        return matchesSearch
      })
    }

    // Combine installed extensions and marketplace catalog without duplicate IDs
    const combined: Extension[] = [...extensions]
    const seen = new Set(extensions.map(e => e.id))

    for (const item of marketplaceResults) {
      if (!seen.has(item.id)) {
        combined.push(item)
        seen.add(item.id)
      }
    }

    return combined.filter(ext => {
      const matchesSearch = !search ||
        ext.name.toLowerCase().includes(search.toLowerCase()) ||
        (ext.displayName && ext.displayName.toLowerCase().includes(search.toLowerCase())) ||
        ext.description.toLowerCase().includes(search.toLowerCase()) ||
        ext.author.toLowerCase().includes(search.toLowerCase()) ||
        ext.tags.some(t => t.toLowerCase().includes(search.toLowerCase()))

      if (!matchesSearch) return false

      if (activeTab === 'all') return true
      if (activeTab === 'official') return ext.isVSCodeOfficial
      if (activeTab === 'ai') return ext.category === 'ai'
      if (activeTab === 'linter') return ext.category === 'linter'
      if (activeTab === 'formatter') return ext.category === 'formatter'
      if (activeTab === 'tools') return ext.category === 'tools'
      if (activeTab === 'snippets') return ext.category === 'snippets'
      if (activeTab === 'custom') return ext.category === 'custom'
      return true
    })
  })()

  // Find CodeForge AI Helper
  const aiHelperExt = extensions.find(e => e.id === 'codeforge-ai-helper' || e.id === 'antigravity-ai-copilot')
  const isAiHelperActive = aiHelperExt?.enabled ?? false

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--bg-sidebar)', color: 'var(--text-base)', fontSize: 12 }}>
      
      {/* ── Top Header & Actions ───────────────────────────────────────── */}
      <div style={{ padding: '12px 14px 8px', borderBottom: '1px solid var(--border)', background: 'var(--bg-header)', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, flexWrap: 'wrap', gap: 6 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 15 }}>🧩</span>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.04em', color: 'var(--text-base)', textTransform: 'uppercase' }}>
                Extensions & Marketplace
              </div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                Official VS Code Extensions, AI Helpers & Plugins
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {/* Install from .VSIX file */}
            <input
              type="file"
              ref={vsixInputRef}
              onChange={handleVsixUpload}
              accept=".vsix"
              style={{ display: 'none' }}
            />
            <button
              onClick={() => vsixInputRef.current?.click()}
              className="btn btn-ghost"
              style={{
                padding: '4px 8px',
                fontSize: 11,
                color: 'var(--accent)',
                gap: 4,
                border: '1px solid var(--border)',
                borderRadius: 5,
                background: 'var(--bg-app)'
              }}
              title="Install official VS Code extension from .vsix file"
            >
              <DownloadIcon size={12} /> Install .VSIX
            </button>

            {/* Install by Extension ID */}
            <button
              onClick={() => setShowIdInstallModal(true)}
              className="btn btn-ghost"
              style={{
                padding: '4px 8px',
                fontSize: 11,
                color: 'var(--text-base)',
                gap: 4,
                border: '1px solid var(--border)',
                borderRadius: 5,
                background: 'var(--bg-app)'
              }}
              title="Install by official VS Code ID (e.g. ms-python.python)"
            >
              🔍 Install by ID
            </button>

            {/* Add Custom / Upload JSON */}
            <button
              onClick={() => setShowUploadModal(true)}
              className="btn btn-ghost"
              style={{
                padding: '4px 8px',
                fontSize: 11,
                color: 'var(--accent)',
                gap: 4,
                border: '1px solid var(--accent-border)',
                borderRadius: 5,
                background: 'var(--accent-subtle)'
              }}
              title="Upload or create a custom extension"
            >
              <PlusIcon size={12} /> Custom
            </button>
          </div>
        </div>

        {/* Search input with loading spinner */}
        <div style={{ position: 'relative', marginBottom: 8 }}>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search VS Code Marketplace & installed extensions (e.g. python, prettier, eslint, dracula)..."
            className="ide-input"
            style={{ width: '100%', fontSize: 11.5, padding: '7px 30px 7px 28px', boxSizing: 'border-box', borderRadius: 6 }}
          />
          <span style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)', fontSize: 12 }}>
            ⌕
          </span>
          {isSearchingMarketplace ? (
            <span style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--accent)' }}>
              <SpinnerIcon size={12} />
            </span>
          ) : search ? (
            <button
              onClick={() => setSearch('')}
              style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', color: 'var(--text-dim)', cursor: 'pointer', fontSize: 13 }}
            >
              ✕
            </button>
          ) : null}
        </div>

        {/* Filter categories pills */}
        <div style={{ display: 'flex', gap: 4, overflowX: 'auto', paddingBottom: 2, scrollbarWidth: 'none' }}>
          {([
            { id: 'all', label: 'All Marketplace' },
            { id: 'installed', label: `Installed (${extensions.length})` },
            { id: 'official', label: 'VS Code Official 🛡️' },
            { id: 'ai', label: 'AI & Copilot ✨' },
            { id: 'linter', label: 'Linters' },
            { id: 'formatter', label: 'Formatters' },
            { id: 'tools', label: 'Themes & Tools' },
            { id: 'snippets', label: 'Snippets' },
            { id: 'custom', label: 'Custom' }
          ] as const).map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                background: activeTab === tab.id ? 'var(--accent-subtle)' : 'transparent',
                color: activeTab === tab.id ? 'var(--accent)' : 'var(--text-muted)',
                border: `1px solid ${activeTab === tab.id ? 'var(--accent-border)' : 'var(--border)'}`,
                borderRadius: 4,
                padding: '3px 8px',
                fontSize: 10.5,
                fontWeight: activeTab === tab.id ? 600 : 400,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s ease'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Scrollable Extensions Feed ─────────────────────────────────── */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 14px' }}>

        {/* ── Featured Hero: CodeForge AI Helper (Next-Code Ghost Text) ── */}
        {aiHelperExt && (activeTab === 'all' || activeTab === 'ai' || activeTab === 'installed') && (
          <div
            style={{
              marginBottom: 16,
              padding: '16px 18px',
              borderRadius: 12,
              background: isAiHelperActive
                ? 'linear-gradient(135deg, rgba(124, 58, 237, 0.14) 0%, rgba(59, 130, 246, 0.1) 100%)'
                : 'var(--bg-card)',
              border: isAiHelperActive ? '1.5px solid rgba(139, 92, 246, 0.5)' : '1px solid var(--border)',
              boxShadow: isAiHelperActive ? '0 4px 20px rgba(124, 58, 237, 0.15)' : 'none',
              position: 'relative',
              overflow: 'hidden',
              transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)'
            }}
          >
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: 10,
                    background: 'linear-gradient(135deg, #7c3aed, #2563eb)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 18,
                    color: '#ffffff',
                    boxShadow: '0 3px 10px rgba(124, 58, 237, 0.4)',
                    flexShrink: 0
                  }}
                >
                  ✨
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-base)', letterSpacing: '-0.01em' }}>
                      CodeForge AI Helper
                    </span>
                    <span
                      style={{
                        fontSize: 9,
                        fontWeight: 700,
                        padding: '2px 6px',
                        borderRadius: 4,
                        background: 'rgba(124, 58, 237, 0.2)',
                        color: '#c084fc',
                        border: '1px solid rgba(139, 92, 246, 0.4)',
                        textTransform: 'uppercase'
                      }}
                    >
                      Official Built-in
                    </span>
                    <span
                      style={{
                        fontSize: 9,
                        fontWeight: 700,
                        padding: '2px 6px',
                        borderRadius: 4,
                        background: isAiHelperActive ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.12)',
                        color: isAiHelperActive ? '#22c55e' : 'var(--text-dim)',
                        border: `1px solid ${isAiHelperActive ? 'rgba(34, 197, 94, 0.3)' : 'var(--border)'}`,
                        textTransform: 'uppercase'
                      }}
                    >
                      {isAiHelperActive ? '● Active' : '○ Off'}
                    </span>
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                    Real-time Next-Line Code Predictor with <kbd style={{ padding: '1px 5px', borderRadius: 3, background: 'var(--bg-app)', border: '1px solid var(--border)', fontSize: 10, fontWeight: 700, color: 'var(--accent)' }}>Tab</kbd> acceptance
                  </div>
                </div>
              </div>

              {/* Main ON / OFF Switch */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: isAiHelperActive ? '#22c55e' : 'var(--text-dim)' }}>
                  {isAiHelperActive ? 'ON' : 'OFF'}
                </span>
                <label
                  style={{
                    position: 'relative',
                    display: 'inline-block',
                    width: 42,
                    height: 24,
                    cursor: 'pointer'
                  }}
                  title={isAiHelperActive ? 'Click to Disable CodeForge AI Helper' : 'Click to Enable CodeForge AI Helper'}
                >
                  <input
                    type="checkbox"
                    checked={isAiHelperActive}
                    onChange={() => handleToggle(aiHelperExt.id, 'CodeForge AI Helper')}
                    style={{ opacity: 0, width: 0, height: 0 }}
                  />
                  <span
                    style={{
                      position: 'absolute',
                      inset: 0,
                      backgroundColor: isAiHelperActive ? '#7c3aed' : 'var(--border)',
                      borderRadius: 24,
                      transition: 'background-color 0.2s',
                      boxShadow: isAiHelperActive ? '0 0 12px rgba(124, 58, 237, 0.4)' : 'none'
                    }}
                  />
                  <span
                    style={{
                      position: 'absolute',
                      left: isAiHelperActive ? 20 : 3,
                      top: 3,
                      width: 18,
                      height: 18,
                      backgroundColor: '#ffffff',
                      borderRadius: '50%',
                      transition: 'left 0.2s',
                      boxShadow: '0 1px 4px rgba(0,0,0,0.35)'
                    }}
                  />
                </label>
              </div>
            </div>

            {/* Description */}
            <div style={{ fontSize: 11.5, lineHeight: 1.55, color: 'var(--text-base)', marginBottom: 12, opacity: 0.9 }}>
              Editor mein aapke code aur comments ko khud analyse karta hai aur aage ka code <b>highlighted ghost text</b> mein predict karta hai. <span style={{ color: 'var(--accent)', fontWeight: 600 }}>Jab tak aap Tab button press na karein, ye code mein insert nahi hoga!</span>
            </div>

            {/* 4 Feature Pills */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 8 }}>
              <div style={{ padding: '8px 10px', borderRadius: 7, background: 'var(--bg-app)', border: '1px solid var(--border)', fontSize: 10.5 }}>
                <div style={{ fontWeight: 600, color: 'var(--text-base)', marginBottom: 2 }}>🧠 Context & Algorithm Aware</div>
                <div style={{ color: 'var(--text-dim)', fontSize: 10 }}>DSA patterns, function signatures aur comments ko auto-detect karta hai.</div>
              </div>
              <div style={{ padding: '8px 10px', borderRadius: 7, background: 'var(--bg-app)', border: '1px solid var(--border)', fontSize: 10.5 }}>
                <div style={{ fontWeight: 600, color: 'var(--text-base)', marginBottom: 2 }}>👻 Zero-Pollution Buffer</div>
                <div style={{ color: 'var(--text-dim)', fontSize: 10 }}>File clean rehti hai, sirf visual guide ki tarah highlight hota hai.</div>
              </div>
              <div style={{ padding: '8px 10px', borderRadius: 7, background: 'var(--bg-app)', border: '1px solid var(--border)', fontSize: 10.5 }}>
                <div style={{ fontWeight: 600, color: 'var(--text-base)', marginBottom: 2 }}>⌨️ Tab to Insert</div>
                <div style={{ color: 'var(--text-dim)', fontSize: 10 }}>Accept karne ke liye <kbd style={{ padding: '0 4px', borderRadius: 3, background: 'var(--bg-header)', border: '1px solid var(--border)' }}>Tab</kbd> press karein, ya dismiss karne ke liye type karte rahein.</div>
              </div>
              <div style={{ padding: '8px 10px', borderRadius: 7, background: 'var(--bg-app)', border: '1px solid var(--border)', fontSize: 10.5 }}>
                <div style={{ fontWeight: 600, color: 'var(--text-base)', marginBottom: 2 }}>⚡ Multi-Language Engine</div>
                <div style={{ color: 'var(--text-dim)', fontSize: 10 }}>Python, JS/TS, C++, Java, Go, Rust, HTML aur SQL par instant suggestions.</div>
              </div>
            </div>
          </div>
        )}

        {/* Section title */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, padding: '0 2px' }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {activeTab === 'installed' ? 'Installed Extensions' : activeTab === 'official' ? 'Official VS Code Marketplace' : 'Available Extensions'} ({allMergedList.length})
          </span>
          <span style={{ fontSize: 10.5, color: 'var(--text-dim)' }}>
            Official VS Code Extensions & Plugins
          </span>
        </div>

        {/* Empty state */}
        {allMergedList.length === 0 ? (
          <div style={{ padding: '36px 16px', textAlign: 'center', color: 'var(--text-dim)', background: 'var(--bg-card)', borderRadius: 10, border: '1px dashed var(--border)' }}>
            <div style={{ fontSize: 24, marginBottom: 8 }}>🔍</div>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-base)', marginBottom: 4 }}>No matching extensions found</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 12 }}>
              Try searching for another keyword or install directly via .VSIX or Extension ID.
            </div>
            <button
              onClick={() => vsixInputRef.current?.click()}
              className="btn btn-primary"
              style={{ fontSize: 11, padding: '6px 12px' }}
            >
              Install from .VSIX File
            </button>
          </div>
        ) : (
          allMergedList.map(ext => {
            const isInstalled = installedMap.has(ext.id)
            const installedData = installedMap.get(ext.id)
            const isEnabled = isInstalled ? installedData?.enabled : false
            const isInstalling = installingIds[ext.id]

            return (
              <div
                key={ext.id}
                onClick={() => setSelectedExtension(installedData || ext)}
                style={{
                  background: 'var(--bg-card)',
                  border: '1px solid',
                  borderColor: isInstalled && isEnabled ? 'rgba(59, 130, 246, 0.4)' : 'var(--border)',
                  borderRadius: 10,
                  padding: '12px 14px',
                  marginBottom: 10,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
                className="hover:border-accent"
              >
                {/* Header row: Icon, Details, Actions */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0, flex: 1 }}>
                    {/* Icon: image URL if available, else emoji badge */}
                    {ext.iconUrl ? (
                      <img
                        src={ext.iconUrl}
                        alt={ext.name}
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: 8,
                          objectFit: 'contain',
                          background: 'var(--bg-app)',
                          border: '1px solid var(--border)',
                          flexShrink: 0
                        }}
                        onError={(e) => {
                          // Fallback to text icon if image fails
                          (e.target as HTMLElement).style.display = 'none'
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: 8,
                          background: ext.isVSCodeOfficial ? 'rgba(0, 122, 204, 0.15)' : 'var(--bg-header)',
                          color: ext.isVSCodeOfficial ? '#007acc' : 'var(--accent)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 16,
                          flexShrink: 0,
                          border: '1px solid var(--border)'
                        }}
                      >
                        {ext.icon}
                      </div>
                    )}

                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-base)' }}>
                          {ext.displayName || ext.name}
                        </span>
                        {ext.isVSCodeOfficial && (
                          <span
                            style={{
                              fontSize: 9,
                              fontWeight: 700,
                              color: '#007acc',
                              background: 'rgba(0, 122, 204, 0.12)',
                              padding: '1px 5px',
                              borderRadius: 3,
                              border: '1px solid rgba(0, 122, 204, 0.3)',
                              display: 'flex',
                              alignItems: 'center',
                              gap: 2
                            }}
                            title="Official VS Code Extension"
                          >
                            🛡️ VS Code Official
                          </span>
                        )}
                        <span style={{ fontSize: 9.5, color: 'var(--text-dim)', padding: '1px 5px', background: 'var(--bg-app)', borderRadius: 3, border: '1px solid var(--border)' }}>
                          v{ext.version}
                        </span>
                      </div>

                      <div style={{ fontSize: 10.5, color: 'var(--text-muted)', marginTop: 2, display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span>by <b>{ext.publisher || ext.author}</b></span>
                        {ext.id && <span style={{ opacity: 0.6, fontFamily: 'monospace', fontSize: 10 }}>({ext.id})</span>}
                      </div>
                    </div>
                  </div>

                  {/* Actions: Install or Enable/Disable Toggle */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }} onClick={e => e.stopPropagation()}>
                    {!isInstalled ? (
                      <button
                        onClick={() => handleInstallFromMarketplace(ext)}
                        disabled={isInstalling}
                        className="btn btn-primary"
                        style={{
                          padding: '4px 12px',
                          fontSize: 11,
                          fontWeight: 600,
                          gap: 4,
                          borderRadius: 6
                        }}
                      >
                        {isInstalling ? (
                          <>
                            <SpinnerIcon size={11} /> Installing...
                          </>
                        ) : (
                          <>
                            <DownloadIcon size={11} /> Install
                          </>
                        )}
                      </button>
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        {/* Toggle On/Off Switch */}
                        <label
                          style={{
                            position: 'relative',
                            display: 'inline-block',
                            width: 34,
                            height: 19,
                            cursor: 'pointer'
                          }}
                          title={isEnabled ? 'Click to Disable' : 'Click to Enable'}
                        >
                          <input
                            type="checkbox"
                            checked={isEnabled}
                            onChange={() => handleToggle(ext.id, ext.displayName || ext.name)}
                            style={{ opacity: 0, width: 0, height: 0 }}
                          />
                          <span
                            style={{
                              position: 'absolute',
                              inset: 0,
                              backgroundColor: isEnabled ? '#22c55e' : 'var(--border)',
                              borderRadius: 19,
                              transition: 'background-color 0.2s'
                            }}
                          />
                          <span
                            style={{
                              position: 'absolute',
                              left: isEnabled ? 17 : 2,
                              top: 2,
                              width: 15,
                              height: 15,
                              backgroundColor: '#ffffff',
                              borderRadius: '50%',
                              transition: 'left 0.2s',
                              boxShadow: '0 1px 3px rgba(0,0,0,0.3)'
                            }}
                          />
                        </label>

                        {/* Uninstall button (except built-in core helper) */}
                        {ext.id !== 'codeforge-ai-helper' && (
                          <button
                            onClick={(e) => handleUninstall(ext.id, ext.displayName || ext.name, e)}
                            title="Uninstall extension"
                            style={{
                              background: 'transparent',
                              border: 'none',
                              color: 'var(--red)',
                              cursor: 'pointer',
                              padding: 4,
                              opacity: 0.75
                            }}
                          >
                            <TrashIcon size={12} />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Description */}
                <div style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.45 }}>
                  {ext.description}
                </div>

                {/* Meta details footer: Downloads, Rating, Tags, Status */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 2, fontSize: 10, color: 'var(--text-dim)', flexWrap: 'wrap', gap: 6 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    {ext.downloads ? (
                      <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                        <DownloadIcon size={10} /> {(ext.downloads > 1000000 ? `${(ext.downloads / 1000000).toFixed(1)}M` : `${(ext.downloads / 1000).toFixed(0)}k`)}
                      </span>
                    ) : null}

                    {ext.rating ? (
                      <span style={{ display: 'flex', alignItems: 'center', gap: 2, color: '#eab308' }}>
                        ★ {ext.rating.toFixed(1)}
                      </span>
                    ) : null}

                    <div style={{ display: 'flex', gap: 4 }}>
                      {ext.tags.slice(0, 3).map(tag => (
                        <span key={tag} style={{ background: 'var(--bg-app)', border: '1px solid var(--border)', borderRadius: 3, padding: '1px 5px', fontSize: 9 }}>
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    {isInstalled ? (
                      isEnabled ? (
                        <span style={{ color: '#22c55e', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 3 }}>
                          <CheckIcon size={10} /> Active
                        </span>
                      ) : (
                        <span style={{ color: 'var(--text-dim)' }}>Disabled</span>
                      )
                    ) : (
                      <span style={{ color: 'var(--accent)', fontSize: 10 }}>Click to preview</span>
                    )}
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* ── Extension Details Modal (VS Code Style) ────────────────────── */}
      {selectedExtension && (
        <div className="modal-backdrop" onClick={() => setSelectedExtension(null)}>
          <div
            className="modal-box"
            style={{ width: 560, maxWidth: '94vw', maxHeight: '86vh', display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden' }}
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', background: 'var(--bg-header)', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                {selectedExtension.iconUrl ? (
                  <img
                    src={selectedExtension.iconUrl}
                    alt={selectedExtension.name}
                    style={{ width: 48, height: 48, borderRadius: 10, objectFit: 'contain', background: 'var(--bg-app)', border: '1px solid var(--border)' }}
                  />
                ) : (
                  <div style={{ width: 48, height: 48, borderRadius: 10, background: 'var(--bg-card)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>
                    {selectedExtension.icon}
                  </div>
                )}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-base)' }}>
                      {selectedExtension.displayName || selectedExtension.name}
                    </span>
                    {selectedExtension.isVSCodeOfficial && (
                      <span style={{ fontSize: 10, color: '#007acc', background: 'rgba(0,122,204,0.12)', border: '1px solid rgba(0,122,204,0.3)', padding: '1px 6px', borderRadius: 4 }}>
                        🛡️ Official
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2, fontFamily: 'monospace' }}>
                    {selectedExtension.id} • v{selectedExtension.version} • by {selectedExtension.publisher || selectedExtension.author}
                  </div>
                </div>
              </div>

              <button
                onClick={() => setSelectedExtension(null)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-dim)', fontSize: 16, cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '16px 20px', flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-base)', marginBottom: 4 }}>
                  Description
                </div>
                <div style={{ fontSize: 11.5, color: 'var(--text-muted)', lineHeight: 1.55 }}>
                  {selectedExtension.description}
                </div>
              </div>

              {/* Contributed Snippets (if any) */}
              {selectedExtension.completions && selectedExtension.completions.length > 0 && (
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-base)', marginBottom: 6 }}>
                    Contributed Snippets & Autocompletions ({selectedExtension.completions.length})
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {selectedExtension.completions.map((c, i) => (
                      <div key={i} style={{ background: 'var(--bg-app)', border: '1px solid var(--border)', borderRadius: 6, padding: '8px 10px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                          <code style={{ color: 'var(--accent)', fontWeight: 600, fontSize: 11 }}>
                            Trigger: "{c.trigger}"
                          </code>
                          <span style={{ fontSize: 10, color: 'var(--text-dim)' }}>
                            {c.description}
                          </span>
                        </div>
                        <pre style={{ margin: 0, fontSize: 10.5, fontFamily: 'JetBrains Mono, monospace', background: 'var(--bg-card)', padding: '6px 8px', borderRadius: 4, overflowX: 'auto' }}>
                          {c.code}
                        </pre>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tags & Categories */}
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-base)', marginBottom: 4 }}>
                  Tags & Category
                </div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {selectedExtension.tags.map(t => (
                    <span key={t} style={{ background: 'var(--bg-app)', border: '1px solid var(--border)', borderRadius: 4, padding: '2px 7px', fontSize: 10, color: 'var(--text-dim)' }}>
                      #{t}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Modal Footer Actions */}
            <div style={{ padding: '12px 20px', borderTop: '1px solid var(--border)', background: 'var(--bg-header)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                {installedMap.has(selectedExtension.id) ? (
                  <span style={{ color: '#22c55e', fontSize: 11, fontWeight: 600 }}>
                    ✓ Installed in CodeForge
                  </span>
                ) : (
                  <span style={{ color: 'var(--text-dim)', fontSize: 11 }}>
                    Available on VS Code Marketplace
                  </span>
                )}
              </div>

              <div style={{ display: 'flex', gap: 8 }}>
                {!installedMap.has(selectedExtension.id) ? (
                  <button
                    onClick={() => {
                      handleInstallFromMarketplace(selectedExtension)
                      setSelectedExtension(null)
                    }}
                    className="btn btn-primary"
                    style={{ fontSize: 11, padding: '6px 14px' }}
                  >
                    Install Extension
                  </button>
                ) : (
                  <>
                    <button
                      onClick={() => {
                        handleToggle(selectedExtension.id, selectedExtension.name)
                        setSelectedExtension(null)
                      }}
                      className="btn btn-ghost"
                      style={{ fontSize: 11, padding: '6px 12px', border: '1px solid var(--border)' }}
                    >
                      {installedMap.get(selectedExtension.id)?.enabled ? 'Disable' : 'Enable'}
                    </button>
                    {selectedExtension.id !== 'codeforge-ai-helper' && (
                      <button
                        onClick={() => {
                          handleUninstall(selectedExtension.id, selectedExtension.name)
                          setSelectedExtension(null)
                        }}
                        className="btn btn-danger"
                        style={{ fontSize: 11, padding: '6px 12px' }}
                      >
                        Uninstall
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Install by Official VS Code Extension ID Modal ───────────── */}
      {showIdInstallModal && (
        <div className="modal-backdrop" onClick={() => setShowIdInstallModal(false)}>
          <div
            className="modal-box"
            style={{ width: 440, maxWidth: '92vw', padding: 20 }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 16 }}>🔍</span>
                <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-base)' }}>
                  Install from VS Code Marketplace by ID
                </span>
              </div>
              <button onClick={() => setShowIdInstallModal(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-dim)', cursor: 'pointer' }}>
                ✕
              </button>
            </div>

            <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 14, lineHeight: 1.5 }}>
              Enter any official VS Code extension identifier (format: <code>publisher.extension-name</code>) to fetch and install it directly:
            </p>

            <form onSubmit={handleInstallById} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <input
                value={customExtensionId}
                onChange={e => setCustomExtensionId(e.target.value)}
                placeholder="e.g. ms-python.python, esbenp.prettier-vscode, dbaeumer.vscode-eslint"
                className="ide-input"
                style={{ width: '100%', fontSize: 12, padding: '8px 10px', boxSizing: 'border-box' }}
                autoFocus
              />

              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 10, color: 'var(--text-dim)' }}>Popular:</span>
                {['ms-python.python', 'esbenp.prettier-vscode', 'dracula-theme.theme-dracula', 'pkief.material-icon-theme'].map(exId => (
                  <button
                    key={exId}
                    type="button"
                    onClick={() => setCustomExtensionId(exId)}
                    style={{
                      background: 'var(--bg-app)',
                      border: '1px solid var(--border)',
                      borderRadius: 4,
                      padding: '1px 6px',
                      fontSize: 9.5,
                      color: 'var(--accent)',
                      cursor: 'pointer'
                    }}
                  >
                    {exId}
                  </button>
                ))}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 8 }}>
                <button
                  type="button"
                  onClick={() => setShowIdInstallModal(false)}
                  className="btn btn-ghost"
                  style={{ fontSize: 11, padding: '6px 12px' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!customExtensionId.trim()}
                  className="btn btn-primary"
                  style={{ fontSize: 11, padding: '6px 14px' }}
                >
                  Fetch & Install
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Custom Extension & Upload Modal ──────────────────────────── */}
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
                <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-base)' }}>
                  Custom Extension / Upload
                </span>
              </div>
              <button onClick={() => setShowUploadModal(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-dim)', cursor: 'pointer' }}>
                ✕
              </button>
            </div>

            {/* Quick Upload Options */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
              <button
                onClick={() => vsixInputRef.current?.click()}
                className="btn btn-ghost"
                style={{
                  padding: '12px 10px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 6,
                  border: '1px solid var(--border)',
                  borderRadius: 8,
                  background: 'var(--bg-app)'
                }}
              >
                <span style={{ fontSize: 20 }}>📦</span>
                <span style={{ fontWeight: 600, fontSize: 11 }}>Upload .VSIX File</span>
                <span style={{ fontSize: 9.5, color: 'var(--text-dim)', textAlign: 'center' }}>Official VS Code extension bundle</span>
              </button>

              <button
                onClick={() => jsonInputRef.current?.click()}
                className="btn btn-ghost"
                style={{
                  padding: '12px 10px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 6,
                  border: '1px solid var(--border)',
                  borderRadius: 8,
                  background: 'var(--bg-app)'
                }}
              >
                <input
                  type="file"
                  ref={jsonInputRef}
                  onChange={handleJsonUpload}
                  accept=".json"
                  style={{ display: 'none' }}
                />
                <span style={{ fontSize: 20 }}>📄</span>
                <span style={{ fontWeight: 600, fontSize: 11 }}>Upload JSON Plugin</span>
                <span style={{ fontSize: 9.5, color: 'var(--text-dim)', textAlign: 'center' }}>Custom schema manifest file</span>
              </button>
            </div>

            <div style={{ textAlign: 'center', margin: '8px 0', position: 'relative' }}>
              <hr style={{ border: 'none', borderTop: '1px solid var(--border)' }} />
              <span style={{ position: 'absolute', top: -8, left: '50%', transform: 'translateX(-50%)', background: 'var(--bg-card)', padding: '0 8px', fontSize: 10, color: 'var(--text-dim)' }}>
                OR CREATE CUSTOM SNIPPET HELPER
              </span>
            </div>

            {/* Manual Form */}
            <form onSubmit={handleCreateCustom} style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 12 }}>
              <div style={{ display: 'flex', gap: 8 }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: 10.5, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 3 }}>
                    Extension Name
                  </label>
                  <input
                    value={customName}
                    onChange={e => setCustomName(e.target.value)}
                    placeholder="e.g. My Fast React Snippets"
                    className="ide-input"
                    style={{ width: '100%', fontSize: 11, padding: '6px 8px', boxSizing: 'border-box' }}
                  />
                </div>
                <div style={{ width: 64 }}>
                  <label style={{ display: 'block', fontSize: 10.5, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 3 }}>
                    Icon
                  </label>
                  <input
                    value={customIcon}
                    onChange={e => setCustomIcon(e.target.value)}
                    placeholder="⚡"
                    className="ide-input"
                    style={{ width: '100%', fontSize: 11, padding: '6px 8px', textAlign: 'center', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 10.5, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 3 }}>
                  Trigger Keyword (Autocomplete)
                </label>
                <input
                  value={customTrigger}
                  onChange={e => setCustomTrigger(e.target.value)}
                  placeholder="e.g. usestate, clg, rfc"
                  className="ide-input"
                  style={{ width: '100%', fontSize: 11, padding: '6px 8px', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 10.5, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 3 }}>
                  Code Body
                </label>
                <textarea
                  value={customCode}
                  onChange={e => setCustomCode(e.target.value)}
                  placeholder="const [state, setState] = useState(initialState);"
                  className="ide-input"
                  rows={3}
                  style={{ width: '100%', fontSize: 11, padding: '6px 8px', fontFamily: 'JetBrains Mono, monospace', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 }}>
                <button
                  type="button"
                  onClick={handleDownloadTemplate}
                  className="btn btn-ghost"
                  style={{ fontSize: 10.5, color: 'var(--accent)', padding: '4px 6px', gap: 4 }}
                >
                  <DownloadIcon size={11} /> Download JSON Sample
                </button>

                <div style={{ display: 'flex', gap: 6 }}>
                  <button
                    type="button"
                    onClick={() => setShowUploadModal(false)}
                    className="btn btn-ghost"
                    style={{ fontSize: 11, padding: '5px 10px' }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!customName.trim()}
                    className="btn btn-primary"
                    style={{ fontSize: 11, padding: '5px 14px' }}
                  >
                    Save Extension
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  )
}

import { useState, useEffect } from 'react'
import {
  AI_PROVIDERS,
  getUserAIConfig,
  saveUserAIConfig,
  testAIConnection,
  type AIProviderId,
  type UserAIConfig,
} from '../lib/aiConfig'
import { SpinnerIcon } from './icons'

interface Props {
  showToast: (msg: string) => void
  onOpenConnectModal?: () => void
}

export default function AIProvidersSettingsTab({ showToast }: Props) {
  const [config, setConfig] = useState<UserAIConfig>(getUserAIConfig())
  const [selectedProviderId, setSelectedProviderId] = useState<AIProviderId>(config.activeProvider)
  const [apiKey, setApiKey] = useState('')
  const [selectedModel, setSelectedModel] = useState('')
  const [customEndpoint, setCustomEndpoint] = useState('')
  const [showKey, setShowKey] = useState(false)
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<{ success: boolean; latencyMs: number; error?: string } | null>(null)

  useEffect(() => {
    const current = getUserAIConfig()
    setConfig(current)
    const p = current.activeProvider
    setSelectedProviderId(p)
    const creds = current.providers[p]
    const pDef = AI_PROVIDERS[p]
    setApiKey(creds?.apiKey || '')
    setSelectedModel(creds?.selectedModel || pDef.defaultModel)
    setCustomEndpoint(creds?.customEndpoint || pDef.defaultEndpoint || '')
  }, [])

  const handleSelectProvider = (pId: AIProviderId) => {
    setSelectedProviderId(pId)
    const creds = config.providers[pId]
    const pDef = AI_PROVIDERS[pId]
    setApiKey(creds?.apiKey || '')
    setSelectedModel(creds?.selectedModel || pDef.defaultModel)
    setCustomEndpoint(creds?.customEndpoint || pDef.defaultEndpoint || '')
    setTestResult(null)
    setShowKey(false)
  }

  const pDef = AI_PROVIDERS[selectedProviderId]
  const isCurrentlyActive = config.activeProvider === selectedProviderId

  const handleTest = async () => {
    setTesting(true)
    setTestResult(null)
    const res = await testAIConnection(selectedProviderId, apiKey, selectedModel, customEndpoint)
    setTesting(false)
    setTestResult(res)
    if (res.success) {
      showToast(`✓ ${pDef.name} connected successfully (${res.latencyMs}ms)!`)
    } else {
      showToast(`⚠️ Connection test failed: ${res.error}`)
    }
  }

  const handleSave = () => {
    if (selectedProviderId !== 'builtin' && !apiKey.trim()) {
      showToast('⚠️ Please enter an API key or token')
      return
    }

    const updated: UserAIConfig = {
      ...config,
      activeProvider: selectedProviderId,
      providers: {
        ...config.providers,
        [selectedProviderId]: {
          ...config.providers[selectedProviderId],
          apiKey: apiKey.trim(),
          selectedModel: selectedModel || pDef.defaultModel,
          customEndpoint: customEndpoint.trim() || pDef.defaultEndpoint,
          lastVerified: Date.now(),
        },
      },
    }

    saveUserAIConfig(updated)
    setConfig(updated)
    showToast(`Active AI set to ${pDef.name} (${selectedModel})`)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Header Info */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', color: '#7d8590', textTransform: 'uppercase' }}>
            BRING YOUR OWN AI (BYOK)
          </div>
          <div style={{ fontSize: 13, color: '#c9d1d9', marginTop: 3 }}>
            Connect personal Gemini, ChatGPT, Claude, or GitHub Copilot accounts with zero token host limits.
          </div>
        </div>
        <span
          style={{
            background: 'rgba(56, 189, 248, 0.15)',
            border: '1px solid rgba(56, 189, 248, 0.3)',
            color: '#38bdf8',
            fontSize: 10,
            fontWeight: 700,
            padding: '3px 8px',
            borderRadius: 12,
          }}
        >
          🔒 100% Client-Side Private
        </span>
      </div>

      {/* Provider Selector Tabs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 8 }}>
        {(['gemini', 'openai', 'claude', 'copilot', 'custom', 'builtin'] as AIProviderId[]).map(pId => {
          const p = AI_PROVIDERS[pId]
          const isSelected = selectedProviderId === pId
          const isActive = config.activeProvider === pId
          const hasKey = Boolean(config.providers[pId]?.apiKey)

          return (
            <button
              key={pId}
              onClick={() => handleSelectProvider(pId)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
                gap: 4,
                padding: '10px 12px',
                borderRadius: 8,
                background: isSelected ? 'rgba(124, 58, 237, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                border: isSelected ? `1.5px solid ${p.accentColor}` : '1px solid #21262d',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all .15s',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                <span style={{ fontSize: 18 }}>{p.icon}</span>
                {isActive && (
                  <span style={{ fontSize: 9, fontWeight: 700, color: '#34d399', background: 'rgba(52, 211, 153, 0.15)', padding: '1px 4px', borderRadius: 4 }}>
                    ACTIVE
                  </span>
                )}
              </div>
              <div style={{ fontSize: 12, fontWeight: 700, color: isSelected ? '#f0f6fc' : '#c9d1d9', marginTop: 2 }}>
                {p.name.split(' / ')[0]}
              </div>
              <div style={{ fontSize: 10, color: hasKey ? '#38bdf8' : '#7d8590' }}>
                {hasKey ? 'Key Saved' : p.freeTierAvailable ? 'Free Tier' : 'Needs Key'}
              </div>
            </button>
          )
        })}
      </div>

      {/* Selected Provider Details Box */}
      <div style={{ background: '#0d1117', border: '1px solid #21262d', borderRadius: 10, padding: 16, display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 20 }}>{pDef.icon}</span>
            <span style={{ fontSize: 15, fontWeight: 700, color: '#f0f6fc' }}>{pDef.name}</span>
            <span style={{ fontSize: 11, color: '#8b949e' }}>by {pDef.company}</span>
          </div>
          {pDef.keyDocUrl && (
            <a
              href={pDef.keyDocUrl}
              target="_blank"
              rel="noreferrer"
              style={{ fontSize: 11, color: pDef.accentColor, textDecoration: 'none' }}
            >
              {pDef.keyDocLabel} ↗
            </a>
          )}
        </div>

        <p style={{ fontSize: 11, color: '#8b949e', margin: 0, lineHeight: 1.5 }}>
          {pDef.description}
        </p>

        {selectedProviderId !== 'builtin' && (
          <>
            <div>
              <label style={{ fontSize: 12, color: '#c9d1d9', fontWeight: 600, display: 'block', marginBottom: 4 }}>
                {selectedProviderId === 'copilot' ? 'GitHub Personal Access Token (PAT) / Copilot Token' : `${pDef.name} API Key`}
              </label>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <input
                  type={showKey ? 'text' : 'password'}
                  value={apiKey}
                  onChange={e => setApiKey(e.target.value)}
                  placeholder={pDef.keyPlaceholder}
                  className="ide-input"
                  style={{ width: '100%', fontFamily: 'JetBrains Mono, monospace', fontSize: 12, paddingRight: 60 }}
                />
                <button
                  type="button"
                  onClick={() => setShowKey(p => !p)}
                  style={{ position: 'absolute', right: 8, background: 'none', border: 'none', color: '#8b949e', fontSize: 11, cursor: 'pointer' }}
                >
                  {showKey ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>

            <div>
              <label style={{ fontSize: 12, color: '#c9d1d9', fontWeight: 600, display: 'block', marginBottom: 4 }}>
                Model
              </label>
              <select
                value={selectedModel}
                onChange={e => setSelectedModel(e.target.value)}
                className="ide-select"
                style={{ width: '100%', fontSize: 12, padding: '7px 10px' }}
              >
                {pDef.models.map(m => (
                  <option key={m.id} value={m.id}>
                    {m.name} {m.badge ? `[${m.badge}]` : ''} — {m.description}
                  </option>
                ))}
              </select>
            </div>

            {(pDef.supportsCustomEndpoint || selectedProviderId === 'copilot') && (
              <div>
                <label style={{ fontSize: 12, color: '#c9d1d9', fontWeight: 600, display: 'block', marginBottom: 4 }}>
                  API Endpoint URL (Optional)
                </label>
                <input
                  type="text"
                  value={customEndpoint}
                  onChange={e => setCustomEndpoint(e.target.value)}
                  placeholder={pDef.defaultEndpoint || 'https://...'}
                  className="ide-input"
                  style={{ width: '100%', fontFamily: 'JetBrains Mono', fontSize: 12 }}
                />
              </div>
            )}

            {testResult && (
              <div
                style={{
                  padding: '8px 12px',
                  borderRadius: 6,
                  background: testResult.success ? 'rgba(52, 211, 153, 0.12)' : 'rgba(239, 68, 68, 0.12)',
                  border: `1px solid ${testResult.success ? 'rgba(52, 211, 153, 0.35)' : 'rgba(239, 68, 68, 0.35)'}`,
                  fontSize: 11,
                  color: testResult.success ? '#34d399' : '#f87171',
                }}
              >
                {testResult.success ? `✓ Connection Verified (${testResult.latencyMs}ms)` : `✕ ${testResult.error}`}
              </div>
            )}

            <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
              <button
                type="button"
                onClick={handleTest}
                disabled={testing || !apiKey.trim()}
                className="btn btn-ghost"
                style={{ flex: 1, fontSize: 12, justifyContent: 'center' }}
              >
                {testing ? <><SpinnerIcon size={12} /> Testing...</> : '⚡ Test Connection'}
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={!apiKey.trim()}
                className="btn btn-primary"
                style={{ flex: 2, fontSize: 12, fontWeight: 700, justifyContent: 'center' }}
              >
                {isCurrentlyActive ? 'Update Credentials' : `Activate ${pDef.name.split(' ')[0]}`}
              </button>
            </div>
          </>
        )}

        {selectedProviderId === 'builtin' && (
          <div>
            <button
              onClick={() => {
                const updated: UserAIConfig = { ...config, activeProvider: 'builtin' }
                saveUserAIConfig(updated)
                setConfig(updated)
                showToast('Switched to CodeForge Companion')
              }}
              className={`btn ${config.activeProvider === 'builtin' ? 'btn-ghost' : 'btn-primary'}`}
              style={{ fontSize: 12 }}
            >
              {config.activeProvider === 'builtin' ? 'Currently Active' : 'Activate Companion'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

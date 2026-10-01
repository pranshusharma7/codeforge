import { useState, useEffect } from 'react'
import {
  AI_PROVIDERS,
  getUserAIConfig,
  saveUserAIConfig,
  getAIAccountSessions,
  getActiveAIAccount,
  saveAIAccountSession,
  removeAIAccountSession,
  switchActiveAIAccount,
  type AIProviderId,
  type AIAccountSession,
} from '../lib/aiConfig'
import { CheckIcon, XIcon } from './icons'
const GoogleGeminiLogo = ({ size = 18 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path
      d="M12 0C12 6.627 6.627 12 0 12C6.627 12 12 17.373 12 24C12 17.373 17.373 12 24 12C17.373 12 12 6.627 12 0Z"
      fill="#38bdf8"
    />
  </svg>
)

const ChatGPTLogo = ({ size = 18 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="11" fill="#10a37f" />
    <path
      d="M17.6 10.7c-.2-1.3-1.1-2.4-2.3-2.8-.4-.1-.7-.1-1.1-.1V7.5c0-.8-.6-1.5-1.4-1.5-.3 0-.5.1-.7.2-1.1-.6-2.5-.5-3.5.3-.6.5-1 1.2-1.1 2-.4.2-.7.5-.9.9-.7 1.1-.6 2.5.2 3.5-.2.7-.1 1.5.3 2.1.6 1.1 1.8 1.8 3.1 1.8.3 0 .7-.1 1-.2v.3c0 .8.6 1.5 1.4 1.5.3 0 .6-.1.8-.2 1.1.6 2.5.5 3.5-.3.6-.5 1-1.2 1.1-2 .4-.2.8-.5 1-.9.7-1.1.6-2.5-.2-3.5.2-.6.2-1.3-.2-1.9z"
      fill="#ffffff"
    />
  </svg>
)

const ClaudeLogo = ({ size = 18 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="11" fill="#cc785c" />
    <path d="M12 4.5l1.6 5 5 1.6-5 1.6-1.6 5-1.6-5-5-1.6 5-1.6 1.6-5z" fill="#ffffff" />
  </svg>
)

const CopilotLogo = ({ size = 18 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <rect width="24" height="24" rx="6" fill="#6e40c9" />
    <circle cx="9" cy="11.5" r="1.5" fill="#fff" />
    <circle cx="15" cy="11.5" r="1.5" fill="#fff" />
  </svg>
)

function getProviderBrandIcon(id: AIProviderId, size = 18) {
  switch (id) {
    case 'gemini': return <GoogleGeminiLogo size={size} />
    case 'openai': return <ChatGPTLogo size={size} />
    case 'claude': return <ClaudeLogo size={size} />
    case 'copilot': return <CopilotLogo size={size} />
    default: return <span style={{ fontSize: size }}>✨</span>
  }
}

interface Props {
  isOpen: boolean
  onClose: () => void
  showToast: (msg: string) => void
  initialProvider?: AIProviderId
}

export default function AIConnectModal({ isOpen, onClose, showToast, initialProvider }: Props) {
  const [sessions, setSessions] = useState<AIAccountSession[]>(getAIAccountSessions())
  const [selectedProviderId, setSelectedProviderId] = useState<AIProviderId>(initialProvider || 'gemini')
  const [emailInput, setEmailInput] = useState('')
  const [tierInput, setTierInput] = useState('')
  const [modelInput, setModelInput] = useState('')

  useEffect(() => {
    if (!isOpen) return
    const currentSessions = getAIAccountSessions()
    setSessions(currentSessions)
    const active = getActiveAIAccount()
    const target = initialProvider || (active ? active.providerId : 'gemini')
    setSelectedProviderId(target)

    const existingSession = currentSessions.find(s => s.providerId === target)
    const pDef = AI_PROVIDERS[target]
    setEmailInput(existingSession?.email || '')
    setTierInput(existingSession?.tier || pDef.tierName || 'Pro')
    setModelInput(existingSession?.selectedModel || pDef.defaultModel)
  }, [isOpen, initialProvider])

  const handleSelectTab = (pId: AIProviderId) => {
    setSelectedProviderId(pId)
    const existing = sessions.find(s => s.providerId === pId)
    const pDef = AI_PROVIDERS[pId]
    setEmailInput(existing?.email || '')
    setTierInput(existing?.tier || pDef.tierName || 'Pro')
    setModelInput(existing?.selectedModel || pDef.defaultModel)
  }

  if (!isOpen) return null

  const activeDef = AI_PROVIDERS[selectedProviderId] || AI_PROVIDERS.gemini
  const connectedSession = sessions.find(s => s.providerId === selectedProviderId)
  const isConnected = Boolean(connectedSession)
  const isActive = connectedSession?.isActive

  const handleLogin = (customEmail?: string) => {
    const email = (customEmail || emailInput || `user_${selectedProviderId}@codeforge.dev`).trim()
    const displayName = email.split('@')[0]
    const tier = tierInput || activeDef.tierName || 'Pro'
    const selectedModel = modelInput || activeDef.defaultModel

    const session: AIAccountSession = {
      providerId: selectedProviderId,
      email,
      displayName,
      tier,
      selectedModel,
      connectedAt: Date.now(),
      isActive: true,
      webAppUrl: activeDef.webAppUrl,
    }

    saveAIAccountSession(session)
    setSessions(getAIAccountSessions())
    showToast(`✓ Connected ${activeDef.name} as ${email} 🎉`)
    onClose()
  }

  const handleDisconnect = () => {
    removeAIAccountSession(selectedProviderId)
    setSessions(getAIAccountSessions())
    showToast(`Disconnected ${activeDef.name}`)
  }

  const handleMakeActive = () => {
    switchActiveAIAccount(selectedProviderId)
    setSessions(getAIAccountSessions())
    showToast(`Switched active AI to ${activeDef.name}`)
    onClose()
  }

  return (
    <div className="modal-backdrop" onClick={onClose} style={{ zIndex: 10000 }}>
      <div
        className="modal-box animate-scale-in"
        style={{
          width: 740,
          maxWidth: '94vw',
          height: 560,
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          padding: 0,
          overflow: 'hidden',
          borderRadius: 14,
          background: 'var(--bg-panel, #18181b)',
          border: '1px solid var(--border)',
          boxShadow: '0 25px 60px rgba(0,0,0,0.65)',
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
            background: 'var(--bg-app)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.2) 0%, rgba(168, 85, 247, 0.2) 100%)',
                border: '1px solid rgba(129, 140, 248, 0.4)',
                display: 'grid',
                placeItems: 'center',
              }}
            >
              <GoogleGeminiLogo size={18} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: 'var(--text-base)' }}>
                Connect AI Accounts
              </h3>
              <p style={{ margin: 0, fontSize: 11, color: 'var(--text-muted)' }}>
                Sign in with Gemini, ChatGPT, Claude or Copilot - Zero API keys required
              </p>
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
            <XIcon size={16} />
          </button>
        </div>

        {/* Body: Left Provider List & Right Auth Detail */}
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
          {/* Left Provider Selector */}
          <div
            style={{
              width: 250,
              background: 'var(--bg-sidebar)',
              borderRight: '1px solid var(--border)',
              display: 'flex',
              flexDirection: 'column',
              padding: '12px 8px',
              gap: 4,
              overflowY: 'auto',
            }}
          >
            <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-dim)', padding: '4px 10px 6px' }}>
              Available AI Providers
            </div>

            {(['gemini', 'openai', 'claude', 'copilot'] as AIProviderId[]).map(pId => {
              const p = AI_PROVIDERS[pId]
              const sess = sessions.find(s => s.providerId === pId)
              const isSelected = selectedProviderId === pId

              return (
                <button
                  key={pId}
                  onClick={() => handleSelectTab(pId)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '10px 12px',
                    borderRadius: 8,
                    background: isSelected ? 'rgba(255,255,255,0.06)' : 'transparent',
                    border: `1px solid ${isSelected ? 'var(--border)' : 'transparent'}`,
                    cursor: 'pointer',
                    textAlign: 'left',
                    width: '100%',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <div style={{ flexShrink: 0 }}>{getProviderBrandIcon(pId, 20)}</div>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ fontSize: 12, fontWeight: isSelected ? 700 : 500, color: 'var(--text-base)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span>{p.name.split('/')[0].trim()}</span>
                      {sess && (
                        <span style={{ fontSize: 9, color: '#34d399', background: 'rgba(52, 211, 153, 0.15)', padding: '1px 5px', borderRadius: 6 }}>
                          Connected
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: 10, color: 'var(--text-dim)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: 1 }}>
                      {sess ? sess.email : p.company}
                    </div>
                  </div>
                </button>
              )
            })}
          </div>

          {/* Right Provider Details / Login Panel */}
          <div style={{ flex: 1, padding: '24px 28px', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
              {getProviderBrandIcon(selectedProviderId, 32)}
              <div>
                <h4 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: 'var(--text-base)' }}>
                  {activeDef.name}
                </h4>
                <p style={{ margin: '2px 0 0', fontSize: 11, color: activeDef.accentColor, fontWeight: 600 }}>
                  {activeDef.company} · {activeDef.tierName}
                </p>
              </div>
            </div>

            <p style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.6, margin: '0 0 20px' }}>
              {activeDef.description}
            </p>

            {/* If Connected */}
            {isConnected ? (
              <div
                style={{
                  background: 'rgba(52, 211, 153, 0.06)',
                  border: '1px solid rgba(52, 211, 153, 0.25)',
                  borderRadius: 10,
                  padding: '16px 18px',
                  marginBottom: 20,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#34d399', fontSize: 13, fontWeight: 700, marginBottom: 8 }}>
                  <CheckIcon size={16} /> Account Connected
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-base)', marginBottom: 4 }}>
                  Signed in as: <strong>{connectedSession?.email}</strong>
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                  Tier: <span style={{ color: activeDef.accentColor, fontWeight: 600 }}>{connectedSession?.tier}</span> · Status: {isActive ? '🟢 Active in Workspace' : 'Standby'}
                </div>

                <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
                  {!isActive && (
                    <button
                      onClick={handleMakeActive}
                      className="btn btn-primary"
                      style={{ fontSize: 11, padding: '6px 12px' }}
                    >
                      Set as Active AI
                    </button>
                  )}
                  {activeDef.webAppUrl && (
                    <a
                      href={activeDef.webAppUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-ghost"
                      style={{ fontSize: 11, padding: '6px 12px', textDecoration: 'none' }}
                    >
                      Open Official Web App ↗
                    </a>
                  )}
                  <button
                    onClick={handleDisconnect}
                    className="btn btn-ghost"
                    style={{ fontSize: 11, padding: '6px 12px', color: '#f87171' }}
                  >
                    Disconnect
                  </button>
                </div>
              </div>
            ) : (
              /* If Not Connected - Continue with Button & Input */
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--text-base)', marginBottom: 6 }}>
                    Your Account Email (or Gmail / GitHub handle)
                  </label>
                  <input
                    type="email"
                    placeholder={`e.g. coder@${selectedProviderId === 'gemini' ? 'gmail.com' : 'example.com'}`}
                    value={emailInput}
                    onChange={e => setEmailInput(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: 7,
                      background: 'var(--bg-app)',
                      border: '1px solid var(--border)',
                      color: 'var(--text-base)',
                      fontSize: 12,
                      outline: 'none',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--text-base)', marginBottom: 6 }}>
                    Subscription Plan
                  </label>
                  <select
                    value={tierInput}
                    onChange={e => setTierInput(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: 7,
                      background: 'var(--bg-app)',
                      border: '1px solid var(--border)',
                      color: 'var(--text-base)',
                      fontSize: 12,
                      outline: 'none',
                    }}
                  >
                    <option value={activeDef.tierName}>{activeDef.tierName} (Unlimited)</option>
                    <option value="Pro / Plus Subscriber">Pro / Plus Subscriber</option>
                    <option value="Enterprise / Team Plan">Enterprise / Team Plan</option>
                    <option value="Free Tier Account">Free Tier Account</option>
                  </select>
                </div>

                {/* Big SSO Continue Button */}
                <button
                  onClick={() => handleLogin()}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 10,
                    padding: '12px 18px',
                    borderRadius: 8,
                    background: activeDef.accentColor,
                    color: '#ffffff',
                    border: 'none',
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: 'pointer',
                    boxShadow: '0 4px 14px rgba(0,0,0,0.3)',
                    marginTop: 6,
                  }}
                >
                  {getProviderBrandIcon(selectedProviderId, 18)}
                  <span>{activeDef.loginBrand}</span>
                </button>

                <div style={{ textAlign: 'center', marginTop: 4 }}>
                  <button
                    onClick={() => handleLogin(`coder_${selectedProviderId}@google.com`)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--text-dim)',
                      fontSize: 11,
                      textDecoration: 'underline',
                      cursor: 'pointer',
                    }}
                  >
                    ⚡ Quick 1-Click Guest Sign-In
                  </button>
                </div>
              </div>
            )}

            {/* Feature Highlights */}
            <div
              style={{
                marginTop: 'auto',
                paddingTop: 16,
                borderTop: '1px solid var(--border)',
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: 10,
              }}
            >
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                <span style={{ color: '#34d399', fontWeight: 700 }}>✓</span> Zero API key configuration
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                <span style={{ color: '#34d399', fontWeight: 700 }}>✓</span> Chats saved to your account ID
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                <span style={{ color: '#34d399', fontWeight: 700 }}>✓</span> Switch providers with 1 click
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                <span style={{ color: '#34d399', fontWeight: 700 }}>✓</span> Direct editor code integration
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

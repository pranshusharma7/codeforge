import { useState } from 'react'
import type { AuthUser } from '../lib/storage'
import {
  type DeviceCodeResponse,
  type GitHubRepository,
  startGitHubDeviceFlow,
  waitForGitHubToken,
  getGitHubUser,
  getGitHubRepositories,
  authenticateWithToken,
  createGuestDevUser,
  SAMPLE_DEV_REPOSITORIES,
} from '../lib/github'
import { SpinnerIcon, ExternalLinkIcon, CheckIcon, KeyIcon } from './icons'

interface Props {
  isOpen: boolean
  onClose: () => void
  onSuccess: (user: AuthUser, repos: GitHubRepository[]) => void
  showToast: (msg: string) => void
}

type AuthTab = 'token' | 'device' | 'guest'

export default function GitHubAuthModal({ isOpen, onClose, onSuccess, showToast }: Props) {
  const [activeTab, setActiveTab] = useState<AuthTab>('token')
  const [busy, setBusy] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  // PAT Token State
  const [patToken, setPatToken] = useState('')
  const [showTokenText, setShowTokenText] = useState(false)

  // Device Code State
  const [deviceData, setDeviceData] = useState<DeviceCodeResponse | null>(null)
  const [copiedCode, setCopiedCode] = useState(false)

  // Guest State
  const [guestName, setGuestName] = useState('Developer')

  if (!isOpen) return null

  // ── 1. PAT Token Authentication (100% Reliable, direct API, no proxy needed) ──
  const handleTokenAuth = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    const clean = patToken.trim()
    if (!clean) {
      setErrorMsg('Please paste your GitHub Personal Access Token (starts with ghp_ or github_pat_).')
      return
    }

    setBusy(true)
    setErrorMsg('')
    try {
      const { user, repos } = await authenticateWithToken(clean)
      showToast(`✓ Welcome @${user.login || user.name}! GitHub connected successfully.`)
      onSuccess(user, repos)
      onClose()
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to authenticate with GitHub token. Please verify token permissions.')
    } finally {
      setBusy(false)
    }
  }

  // ── 2. GitHub Device Code Flow ──────────────────────────────────────────────
  const handleStartDeviceFlow = async () => {
    setBusy(true)
    setErrorMsg('')
    try {
      const device = await startGitHubDeviceFlow()
      setDeviceData(device)

      // Try opening verification page; if popup blocker blocks it, user can click the button
      try {
        window.open(device.verification_uri, '_blank', 'noopener,noreferrer')
      } catch {}

      // Wait for user to authorize code on GitHub
      const accessToken = await waitForGitHubToken(device)
      const profile = await getGitHubUser(accessToken)
      const repos = await getGitHubRepositories(accessToken).catch(() => [])

      const authUser: AuthUser = {
        id: `github-${profile.id}`,
        name: profile.name ?? profile.login,
        email: profile.email ?? '',
        initials: profile.login.slice(0, 2).toUpperCase(),
        provider: 'github',
        login: profile.login,
        avatarUrl: profile.avatar_url,
        accessToken,
        scopes: profile.scopes,
      }

      showToast(`Welcome @${profile.login}! GitHub connected.`)
      onSuccess(authUser, repos)
      onClose()
    } catch (err: any) {
      const raw = err?.message || ''
      if (raw.toLowerCase().includes('load failed') || raw.toLowerCase().includes('failed to fetch')) {
        setErrorMsg('Direct browser connection to GitHub OAuth was blocked by browser CORS security. Please use the "Personal Access Token" tab or "1-Click Dev Mode" to connect instantly.')
      } else {
        setErrorMsg(raw || 'GitHub authorization failed or timed out.')
      }
      setDeviceData(null)
    } finally {
      setBusy(false)
    }
  }

  const handleCopyCode = () => {
    if (deviceData?.user_code) {
      navigator.clipboard.writeText(deviceData.user_code).catch(() => {})
      setCopiedCode(true)
      setTimeout(() => setCopiedCode(false), 2000)
    }
  }

  // ── 3. 1-Click Instant Guest / Local Developer Mode ────────────────────────
  const handleContinueAsGuest = () => {
    const user = createGuestDevUser(guestName)
    showToast(`✓ Welcome @${user.login}! Ready to code.`)
    onSuccess(user, SAMPLE_DEV_REPOSITORIES)
    onClose()
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-box auth-modal"
        style={{ width: 480, maxWidth: '95vw', padding: 24, textAlign: 'left', position: 'relative' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: 14,
            right: 16,
            background: 'none',
            border: 'none',
            color: '#7d8590',
            cursor: 'pointer',
            fontSize: 18,
            padding: 4,
          }}
          title="Close modal"
        >
          ✕
        </button>

        {/* Modal Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <div
            style={{
              width: 42,
              height: 42,
              borderRadius: '50%',
              background: '#24292f',
              color: '#ffffff',
              display: 'grid',
              placeItems: 'center',
              flexShrink: 0,
            }}
          >
            <svg width="22" height="22" viewBox="0 0 16 16" fill="currentColor">
              <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0 0 16 8c0-4.42-3.58-8-8-8z" />
            </svg>
          </div>
          <div>
            <div style={{ fontSize: 17, fontWeight: 700, color: '#e6edf3' }}>
              Connect GitHub & Developer Account
            </div>
            <div style={{ fontSize: 12, color: '#8b949e', marginTop: 2 }}>
              Choose your preferred method — completely error-free & secure.
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div
          style={{
            display: 'flex',
            borderBottom: '1px solid #30363d',
            marginBottom: 16,
            gap: 4,
          }}
        >
          <button
            onClick={() => {
              setActiveTab('token')
              setErrorMsg('')
            }}
            style={{
              background: 'none',
              border: 'none',
              borderBottom: activeTab === 'token' ? '2px solid #58a6ff' : '2px solid transparent',
              color: activeTab === 'token' ? '#58a6ff' : '#8b949e',
              padding: '8px 12px',
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <span>Personal Access Token</span>
            <span
              style={{
                background: 'rgba(56, 189, 248, 0.15)',
                color: '#38bdf8',
                borderRadius: 4,
                padding: '1px 5px',
                fontSize: 9,
                fontWeight: 700,
              }}
            >
              Recommended
            </span>
          </button>

          <button
            onClick={() => {
              setActiveTab('device')
              setErrorMsg('')
            }}
            style={{
              background: 'none',
              border: 'none',
              borderBottom: activeTab === 'device' ? '2px solid #58a6ff' : '2px solid transparent',
              color: activeTab === 'device' ? '#58a6ff' : '#8b949e',
              padding: '8px 12px',
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            OAuth Device Code
          </button>

          <button
            onClick={() => {
              setActiveTab('guest')
              setErrorMsg('')
            }}
            style={{
              background: 'none',
              border: 'none',
              borderBottom: activeTab === 'guest' ? '2px solid #58a6ff' : '2px solid transparent',
              color: activeTab === 'guest' ? '#58a6ff' : '#8b949e',
              padding: '8px 12px',
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            1-Click Dev Mode
          </button>
        </div>

        {/* ── TAB 1: Personal Access Token ─────────────────────────── */}
        {activeTab === 'token' && (
          <form onSubmit={handleTokenAuth}>
            <div
              style={{
                background: 'rgba(35, 134, 54, 0.1)',
                border: '1px solid rgba(46, 160, 67, 0.3)',
                borderRadius: 6,
                padding: '10px 12px',
                fontSize: 11,
                color: '#3fb950',
                lineHeight: 1.5,
                marginBottom: 14,
              }}
            >
              <strong>⚡ 100% Reliable (Never Fails):</strong> Connects directly to GitHub REST API with zero CORS issues, perfect for Localhost, Vercel & Render.
            </div>

            <div style={{ marginBottom: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#c9d1d9' }}>
                  GitHub Personal Access Token:
                </label>
                <a
                  href="https://github.com/settings/tokens/new?scopes=repo,read:user,user:email&description=CodeForge%20IDE"
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    fontSize: 11,
                    color: '#58a6ff',
                    textDecoration: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                  }}
                >
                  Generate Token on GitHub <ExternalLinkIcon size={11} />
                </a>
              </div>

              <div style={{ position: 'relative' }}>
                <input
                  type={showTokenText ? 'text' : 'password'}
                  placeholder="ghp_... or github_pat_..."
                  value={patToken}
                  onChange={e => setPatToken(e.target.value)}
                  className="ide-input"
                  style={{
                    width: '100%',
                    padding: '9px 40px 9px 10px',
                    fontSize: 12,
                    fontFamily: 'monospace',
                    background: '#0d1117',
                    border: '1px solid #30363d',
                    borderRadius: 6,
                    color: '#f0f6fc',
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowTokenText(!showTokenText)}
                  style={{
                    position: 'absolute',
                    right: 8,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: '#8b949e',
                    cursor: 'pointer',
                    fontSize: 12,
                    padding: 4,
                  }}
                  title={showTokenText ? 'Hide token' : 'Show token'}
                >
                  {showTokenText ? '🙈' : '👁️'}
                </button>
              </div>
              <div style={{ fontSize: 11, color: '#8b949e', marginTop: 6, lineHeight: 1.4 }}>
                Recommended scopes: <code>repo</code> (for commit & branch sync) and <code>read:user</code>. Stored locally in your browser only.
              </div>
            </div>

            <button
              type="submit"
              disabled={busy || !patToken.trim()}
              className="btn btn-primary"
              style={{
                width: '100%',
                justifyContent: 'center',
                padding: '9px 14px',
                fontSize: 13,
                fontWeight: 600,
                gap: 8,
              }}
            >
              {busy ? (
                <>
                  <SpinnerIcon size={14} /> Verifying & Connecting...
                </>
              ) : (
                <>
                  <KeyIcon size={14} /> Connect GitHub with Token
                </>
              )}
            </button>
          </form>
        )}

        {/* ── TAB 2: OAuth Device Code ─────────────────────────────── */}
        {activeTab === 'device' && (
          <div>
            {!deviceData ? (
              <div>
                <p style={{ color: '#8b949e', fontSize: 12, lineHeight: 1.6, marginBottom: 14 }}>
                  Connect your GitHub account using the 8-character verification code shown on GitHub.
                </p>

                <button
                  onClick={handleStartDeviceFlow}
                  disabled={busy}
                  className="btn btn-primary"
                  style={{
                    width: '100%',
                    justifyContent: 'center',
                    padding: '10px 16px',
                    fontSize: 13,
                    fontWeight: 600,
                    gap: 8,
                  }}
                >
                  {busy ? (
                    <>
                      <SpinnerIcon size={14} /> Contacting GitHub OAuth...
                    </>
                  ) : (
                    <>
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                        <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0 0 16 8c0-4.42-3.58-8-8-8z" />
                      </svg>
                      Start GitHub Device Flow
                    </>
                  )}
                </button>
              </div>
            ) : (
              <div
                style={{
                  background: '#0d1117',
                  border: '1px solid #30363d',
                  borderRadius: 8,
                  padding: '16px 14px',
                  textAlign: 'center',
                }}
              >
                <div style={{ fontSize: 11, color: '#7d8590', marginBottom: 8 }}>
                  Enter this code on the GitHub authorization page:
                </div>

                <div
                  style={{
                    fontFamily: 'JetBrains Mono',
                    fontSize: 24,
                    fontWeight: 700,
                    letterSpacing: '0.12em',
                    color: '#a78bfa',
                    background: '#161b22',
                    border: '1px solid #30363d',
                    borderRadius: 6,
                    padding: '10px 14px',
                    display: 'inline-block',
                    marginBottom: 12,
                  }}
                >
                  {deviceData.user_code}
                </div>

                <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginBottom: 14 }}>
                  <button
                    onClick={handleCopyCode}
                    className="btn btn-ghost"
                    style={{ fontSize: 11, padding: '5px 12px', gap: 5 }}
                  >
                    {copiedCode ? <CheckIcon size={12} /> : null}
                    {copiedCode ? 'Code Copied!' : 'Copy Code'}
                  </button>
                  <a
                    href={deviceData.verification_uri}
                    target="_blank"
                    rel="noreferrer"
                    className="btn btn-primary"
                    style={{ fontSize: 11, padding: '5px 14px', textDecoration: 'none', gap: 5 }}
                  >
                    Open GitHub Page <ExternalLinkIcon size={11} />
                  </a>
                </div>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                    color: '#7d8590',
                    fontSize: 11,
                  }}
                >
                  <SpinnerIcon size={12} /> Waiting for you to confirm on GitHub...
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── TAB 3: 1-Click Instant Dev Mode ──────────────────────── */}
        {activeTab === 'guest' && (
          <div>
            <p style={{ color: '#8b949e', fontSize: 12, lineHeight: 1.6, marginBottom: 14 }}>
              Continue immediately as a Local Developer! No tokens or GitHub account required. All IDE features, code compilation, and Google Gemini AI work right away.
            </p>

            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#c9d1d9', display: 'block', marginBottom: 6 }}>
                Developer Display Name:
              </label>
              <input
                type="text"
                value={guestName}
                onChange={e => setGuestName(e.target.value)}
                placeholder="Developer"
                className="ide-input"
                style={{
                  width: '100%',
                  padding: '9px 10px',
                  fontSize: 12,
                  background: '#0d1117',
                  border: '1px solid #30363d',
                  borderRadius: 6,
                  color: '#f0f6fc',
                }}
              />
            </div>

            <button
              onClick={handleContinueAsGuest}
              className="btn btn-primary"
              style={{
                width: '100%',
                justifyContent: 'center',
                padding: '9px 14px',
                fontSize: 13,
                fontWeight: 600,
                gap: 8,
                background: 'linear-gradient(135deg, #238636 0%, #2ea043 100%)',
              }}
            >
              🚀 Continue as @{guestName.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '_') || 'developer'}
            </button>
          </div>
        )}

        {/* Error Notification */}
        {errorMsg && (
          <div
            style={{
              background: '#2d1b20',
              border: '1px solid #6e2a32',
              color: '#ffa198',
              borderRadius: 6,
              padding: '10px 12px',
              fontSize: 11,
              marginTop: 14,
              lineHeight: 1.5,
            }}
          >
            <div>{errorMsg}</div>
            {activeTab === 'device' && (
              <button
                type="button"
                onClick={() => {
                  setActiveTab('token')
                  setErrorMsg('')
                }}
                style={{
                  marginTop: 6,
                  background: 'none',
                  border: 'none',
                  color: '#58a6ff',
                  cursor: 'pointer',
                  fontSize: 11,
                  textDecoration: 'underline',
                  padding: 0,
                  display: 'block',
                }}
              >
                👉 Switch to Personal Access Token (PAT) for 100% reliable connection
              </button>
            )}
          </div>
        )}

        {/* Footer info & Instant Skip Action */}
        <div
          style={{
            marginTop: 20,
            paddingTop: 12,
            borderTop: '1px solid #21262d',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: 11,
            color: '#7d8590',
          }}
        >
          <button
            type="button"
            onClick={handleContinueAsGuest}
            style={{
              background: 'none',
              border: 'none',
              color: '#8b949e',
              cursor: 'pointer',
              fontSize: 11,
              padding: 0,
              textDecoration: 'underline',
            }}
          >
            ⚡ Skip login & continue as Guest
          </button>
          <span>🔒 Tokens stored locally only</span>
        </div>
      </div>
    </div>
  )
}

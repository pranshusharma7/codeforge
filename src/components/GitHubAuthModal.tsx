import { useState, useEffect, useRef } from 'react'
import type { AuthUser } from '../lib/storage'
import {
  type DeviceCodeResponse,
  type GitHubRepository,
  startGitHubDeviceFlow,
  waitForGitHubToken,
  getGitHubUser,
  getGitHubRepositories,
} from '../lib/github'
import { SpinnerIcon, ExternalLinkIcon, CheckIcon } from './icons'

interface Props {
  isOpen: boolean
  onClose: () => void
  onSuccess: (user: AuthUser, repos: GitHubRepository[]) => void
  showToast: (msg: string) => void
}

type AuthTab = 'token' | 'username' | 'device'

export default function GitHubAuthModal({ isOpen, onClose, onSuccess, showToast }: Props) {
  const [activeTab, setActiveTab] = useState<AuthTab>('token')
  const [busy, setBusy] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  // PAT Token state
  const [tokenInput, setTokenInput] = useState('')

  // Public Username Explorer state
  const [usernameInput, setUsernameInput] = useState('pranshusharma7')

  // Device Code Flow State
  const [deviceData, setDeviceData] = useState<DeviceCodeResponse | null>(null)
  const [copiedCode, setCopiedCode] = useState(false)
  const [pollStatus, setPollStatus] = useState<string>('')
  const abortControllerRef = useRef<boolean>(false)

  // Reset state when opening/closing
  useEffect(() => {
    if (!isOpen) {
      abortControllerRef.current = true
      setBusy(false)
      setDeviceData(null)
      setErrorMsg('')
      setPollStatus('')
    } else {
      abortControllerRef.current = false
    }
  }, [isOpen])

  if (!isOpen) return null

  // ── 1. Personal Access Token (PAT) ─────────────────────────────────────────
  const handleConnectWithToken = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    const clean = tokenInput.trim()
    if (!clean) {
      setErrorMsg('Please enter a GitHub Personal Access Token (PAT).')
      return
    }

    setBusy(true)
    setErrorMsg('')
    try {
      const profile = await getGitHubUser(clean)
      const repos = await getGitHubRepositories(clean, profile.login).catch(() => [])

      const authUser: AuthUser = {
        id: `github-${profile.id}`,
        name: profile.name ?? profile.login,
        email: profile.email ?? '',
        initials: profile.login.slice(0, 2).toUpperCase(),
        provider: 'github',
        login: profile.login,
        avatarUrl: profile.avatar_url,
        accessToken: clean,
        scopes: profile.scopes || ['repo'],
      }

      showToast(`✓ Welcome @${profile.login}! Found ${repos.length} repositories.`)
      onSuccess(authUser, repos)
      onClose()
    } catch (err: any) {
      setErrorMsg(
        err?.message ||
          'Failed to verify token. Please ensure your Personal Access Token is active and has "repo" scope.'
      )
    } finally {
      setBusy(false)
    }
  }

  // ── 2. Public Username Explorer ────────────────────────────────────────────
  const handleConnectWithUsername = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    const clean = usernameInput.trim()
    if (!clean) {
      setErrorMsg('Please enter a valid GitHub username.')
      return
    }

    setBusy(true)
    setErrorMsg('')
    try {
      const repos = await getGitHubRepositories(undefined, clean)
      const authUser: AuthUser = {
        id: `github-user-${clean}`,
        name: clean,
        email: '',
        initials: clean.slice(0, 2).toUpperCase(),
        provider: 'github',
        login: clean,
        avatarUrl: `https://github.com/${clean}.png`,
        accessToken: '',
        scopes: ['public_repo'],
      }

      showToast(`✓ Loaded ${repos.length} repositories for @${clean}!`)
      onSuccess(authUser, repos)
      onClose()
    } catch (err: any) {
      setErrorMsg(err?.message || `Could not fetch public repositories for @${clean}.`)
    } finally {
      setBusy(false)
    }
  }

  // ── 3. GitHub OAuth Device Flow ───────────────────────────────────────────
  const handleStartOAuth = async () => {
    abortControllerRef.current = false
    setBusy(true)
    setErrorMsg('')
    setPollStatus('Contacting GitHub OAuth server...')

    try {
      const device = await startGitHubDeviceFlow()
      if (abortControllerRef.current) return

      setDeviceData(device)
      setPollStatus('Waiting for authorization on GitHub...')

      try {
        window.open(device.verification_uri, '_blank', 'noopener,noreferrer')
      } catch {}

      const accessToken = await waitForGitHubToken(device)
      if (abortControllerRef.current) return

      setPollStatus('Fetching your GitHub profile...')
      const profile = await getGitHubUser(accessToken)
      const repos = await getGitHubRepositories(accessToken, profile.login).catch(() => [])

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

      showToast(`✓ Welcome @${profile.login}! GitHub connected successfully.`)
      onSuccess(authUser, repos)
      onClose()
    } catch (err: any) {
      if (abortControllerRef.current) return
      const raw = err?.message || ''
      if (raw.toLowerCase().includes('device_flow_disabled')) {
        setErrorMsg('GitHub Device Flow is not enabled for this OAuth App. Please use a Personal Access Token (PAT) or Username instead.')
      } else if (raw.toLowerCase().includes('timed out')) {
        setErrorMsg(raw)
      } else {
        setErrorMsg(raw || 'GitHub authorization failed or timed out. Please try Token or Username method.')
      }
      setDeviceData(null)
    } finally {
      if (!abortControllerRef.current) {
        setBusy(false)
      }
    }
  }

  const handleCopyCode = () => {
    if (deviceData?.user_code) {
      navigator.clipboard.writeText(deviceData.user_code).catch(() => {})
      setCopiedCode(true)
      setTimeout(() => setCopiedCode(false), 2500)
    }
  }

  const handleCancelOAuth = () => {
    abortControllerRef.current = true
    setBusy(false)
    setDeviceData(null)
    setErrorMsg('')
    setPollStatus('')
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-box auth-modal"
        style={{
          width: 500,
          maxWidth: '92vw',
          padding: 24,
          textAlign: 'center',
          position: 'relative',
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: 14,
          boxShadow: '0 24px 60px rgba(0, 0, 0, 0.4)',
        }}
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
            color: 'var(--text-muted)',
            cursor: 'pointer',
            fontSize: 18,
            padding: 4,
            lineHeight: 1,
          }}
          title="Close modal"
        >
          ✕
        </button>

        {/* Brand Octocat Icon */}
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: '50%',
            background: 'var(--bg-hover)',
            color: 'var(--text-base)',
            display: 'grid',
            placeItems: 'center',
            margin: '0 auto 12px',
            border: '1px solid var(--border)',
          }}
        >
          <svg width="26" height="26" viewBox="0 0 16 16" fill="currentColor">
            <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0 0 16 8c0-4.42-3.58-8-8-8z" />
          </svg>
        </div>

        {/* Modal Header */}
        <div style={{ fontSize: 19, fontWeight: 700, color: 'var(--text-base)', marginBottom: 4 }}>
          Connect GitHub Repositories
        </div>
        <p style={{ color: 'var(--text-muted)', fontSize: 13, lineHeight: 1.5, marginBottom: 16 }}>
          Sync repositories, live auto-update code, and commit directly from CodeForge.
        </p>

        {/* Auth Method Navigation Tabs */}
        <div
          style={{
            display: 'flex',
            gap: 6,
            background: 'var(--bg-app)',
            padding: 4,
            borderRadius: 8,
            border: '1px solid var(--border)',
            marginBottom: 16,
          }}
        >
          <button
            onClick={() => { setActiveTab('token'); setErrorMsg('') }}
            style={{
              flex: 1,
              padding: '6px 10px',
              fontSize: 12,
              fontWeight: activeTab === 'token' ? 600 : 400,
              background: activeTab === 'token' ? 'var(--bg-card)' : 'transparent',
              color: activeTab === 'token' ? 'var(--accent)' : 'var(--text-muted)',
              border: activeTab === 'token' ? '1px solid var(--border)' : 'none',
              borderRadius: 6,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            Personal Access Token
          </button>
          <button
            onClick={() => { setActiveTab('username'); setErrorMsg('') }}
            style={{
              flex: 1,
              padding: '6px 10px',
              fontSize: 12,
              fontWeight: activeTab === 'username' ? 600 : 400,
              background: activeTab === 'username' ? 'var(--bg-card)' : 'transparent',
              color: activeTab === 'username' ? 'var(--accent)' : 'var(--text-muted)',
              border: activeTab === 'username' ? '1px solid var(--border)' : 'none',
              borderRadius: 6,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            Public Username
          </button>
          <button
            onClick={() => { setActiveTab('device'); setErrorMsg('') }}
            style={{
              flex: 1,
              padding: '6px 10px',
              fontSize: 12,
              fontWeight: activeTab === 'device' ? 600 : 400,
              background: activeTab === 'device' ? 'var(--bg-card)' : 'transparent',
              color: activeTab === 'device' ? 'var(--accent)' : 'var(--text-muted)',
              border: activeTab === 'device' ? '1px solid var(--border)' : 'none',
              borderRadius: 6,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            OAuth Device Code
          </button>
        </div>

        {/* ── TAB 1: Personal Access Token (PAT) ─────────────────────────── */}
        {activeTab === 'token' && (
          <form onSubmit={handleConnectWithToken} style={{ textAlign: 'left' }}>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8, lineHeight: 1.5 }}>
              Enter a GitHub Personal Access Token (classic or fine-grained) with <code>repo</code> permissions:
            </div>
            <input
              type="password"
              className="ide-input"
              value={tokenInput}
              onChange={e => setTokenInput(e.target.value)}
              placeholder="ghp_xxxxxxxxxxxxxxxxxxxx or github_pat_..."
              style={{
                width: '100%',
                padding: '9px 12px',
                fontSize: 13,
                fontFamily: 'JetBrains Mono, monospace',
                marginBottom: 12,
                borderRadius: 6,
              }}
              autoFocus
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <a
                href="https://github.com/settings/tokens/new?scopes=repo,read:user,user:email&description=CodeForge+Editor"
                target="_blank"
                rel="noreferrer"
                style={{ fontSize: 11, color: 'var(--accent)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}
              >
                Generate Token on GitHub <ExternalLinkIcon size={11} />
              </a>
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Required scope: <strong>repo</strong></span>
            </div>
            <button
              type="submit"
              disabled={busy || !tokenInput.trim()}
              className="btn btn-primary"
              style={{
                width: '100%',
                justifyContent: 'center',
                padding: '10px 16px',
                fontSize: 13,
                fontWeight: 600,
                background: 'linear-gradient(135deg, #238636 0%, #2ea043 100%)',
              }}
            >
              {busy ? <SpinnerIcon size={14} /> : null}
              {busy ? 'Validating Token & Loading Repos...' : 'Connect & Load Repositories'}
            </button>
          </form>
        )}

        {/* ── TAB 2: Public Username Explorer ───────────────────────────── */}
        {activeTab === 'username' && (
          <form onSubmit={handleConnectWithUsername} style={{ textAlign: 'left' }}>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8, lineHeight: 1.5 }}>
              Browse and load public repositories without logging in:
            </div>
            <input
              type="text"
              className="ide-input"
              value={usernameInput}
              onChange={e => setUsernameInput(e.target.value)}
              placeholder="e.g. pranshusharma7"
              style={{
                width: '100%',
                padding: '9px 12px',
                fontSize: 13,
                marginBottom: 14,
                borderRadius: 6,
              }}
              autoFocus
            />
            <button
              type="submit"
              disabled={busy || !usernameInput.trim()}
              className="btn btn-primary"
              style={{
                width: '100%',
                justifyContent: 'center',
                padding: '10px 16px',
                fontSize: 13,
                fontWeight: 600,
                background: 'linear-gradient(135deg, #238636 0%, #2ea043 100%)',
              }}
            >
              {busy ? <SpinnerIcon size={14} /> : null}
              {busy ? 'Loading Repositories...' : `Explore @${usernameInput || 'user'} Repositories`}
            </button>
          </form>
        )}

        {/* ── TAB 3: Device Code Flow ───────────────────────────────────── */}
        {activeTab === 'device' && (
          <div>
            {!deviceData ? (
              <div>
                <div
                  style={{
                    background: 'var(--bg-app)',
                    border: '1px solid var(--border)',
                    borderRadius: 8,
                    padding: '12px 14px',
                    textAlign: 'left',
                    marginBottom: 16,
                    fontSize: 12,
                    color: 'var(--text-base)',
                    lineHeight: 1.6,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    <span style={{ color: 'var(--green)', fontSize: 14 }}>✓</span>
                    <span>1-Click official GitHub OAuth 2.0 Device Code</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    <span style={{ color: 'var(--green)', fontSize: 14 }}>✓</span>
                    <span>Direct branch switching, commit, and repo syncing</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ color: 'var(--green)', fontSize: 14 }}>✓</span>
                    <span>Automatic authentication without pasting any token</span>
                  </div>
                </div>

                <button
                  onClick={handleStartOAuth}
                  disabled={busy}
                  className="btn btn-primary"
                  style={{
                    width: '100%',
                    justifyContent: 'center',
                    padding: '11px 16px',
                    fontSize: 14,
                    fontWeight: 600,
                    gap: 9,
                    background: 'linear-gradient(135deg, #238636 0%, #2ea043 100%)',
                    boxShadow: '0 4px 12px rgba(35, 134, 54, 0.3)',
                  }}
                >
                  {busy ? (
                    <>
                      <SpinnerIcon size={15} /> Contacting GitHub OAuth...
                    </>
                  ) : (
                    <>
                      <svg width="18" height="18" viewBox="0 0 16 16" fill="currentColor">
                        <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0 0 16 8c0-4.42-3.58-8-8-8z" />
                      </svg>
                      Authorize with GitHub
                    </>
                  )}
                </button>
              </div>
            ) : (
              <div
                style={{
                  background: 'var(--bg-app)',
                  border: '1px solid var(--border)',
                  borderRadius: 10,
                  padding: '18px 16px',
                  textAlign: 'center',
                }}
              >
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 10 }}>
                  Enter this verification code on the GitHub authorization page:
                </div>

                <div
                  style={{
                    fontFamily: 'JetBrains Mono, monospace',
                    fontSize: 26,
                    fontWeight: 700,
                    letterSpacing: '0.14em',
                    color: 'var(--accent)',
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border)',
                    borderRadius: 8,
                    padding: '10px 18px',
                    display: 'inline-block',
                    marginBottom: 14,
                    userSelect: 'all',
                  }}
                >
                  {deviceData.user_code}
                </div>

                <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginBottom: 14 }}>
                  <button
                    onClick={handleCopyCode}
                    className="btn btn-ghost"
                    style={{
                      fontSize: 12,
                      padding: '7px 14px',
                      gap: 6,
                      border: '1px solid var(--border)',
                      color: copiedCode ? 'var(--green)' : 'var(--text-base)',
                    }}
                  >
                    {copiedCode ? <CheckIcon size={14} /> : null}
                    {copiedCode ? 'Code Copied!' : 'Copy Code'}
                  </button>
                  <a
                    href={deviceData.verification_uri}
                    target="_blank"
                    rel="noreferrer"
                    className="btn btn-primary"
                    style={{
                      fontSize: 12,
                      padding: '7px 16px',
                      textDecoration: 'none',
                      gap: 6,
                      background: 'linear-gradient(135deg, #238636 0%, #2ea043 100%)',
                    }}
                  >
                    Open GitHub Page <ExternalLinkIcon size={12} />
                  </a>
                </div>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    color: 'var(--text-muted)',
                    fontSize: 12,
                    marginBottom: 10,
                  }}
                >
                  <SpinnerIcon size={13} /> {pollStatus || 'Waiting for confirmation on GitHub...'}
                </div>

                <button
                  onClick={handleCancelOAuth}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    fontSize: 11,
                    textDecoration: 'underline',
                    padding: 4,
                  }}
                >
                  Cancel / Start Over
                </button>
              </div>
            )}
          </div>
        )}

        {/* Error notification */}
        {errorMsg && (
          <div
            style={{
              background: 'rgba(248, 81, 73, 0.1)',
              border: '1px solid rgba(248, 81, 73, 0.3)',
              color: 'var(--red)',
              borderRadius: 8,
              padding: '12px 14px',
              fontSize: 12,
              marginTop: 14,
              lineHeight: 1.5,
              textAlign: 'left',
            }}
          >
            <div style={{ fontWeight: 600, marginBottom: 4 }}>Notice:</div>
            <div>{errorMsg}</div>
          </div>
        )}

        {/* Footer note */}
        <div
          style={{
            marginTop: 18,
            paddingTop: 12,
            borderTop: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 11,
            color: 'var(--text-muted)',
          }}
        >
          <span>Direct GitHub REST API & OAuth Integration</span>
        </div>
      </div>
    </div>
  )
}

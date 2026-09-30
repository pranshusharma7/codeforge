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

export default function GitHubAuthModal({ isOpen, onClose, onSuccess, showToast }: Props) {
  const [busy, setBusy] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

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

  // ── 1. GitHub OAuth Device Flow ───────────────────────────────────────────
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

      // Attempt to open the verification page automatically in a new tab
      try {
        window.open(device.verification_uri, '_blank', 'noopener,noreferrer')
      } catch {}

      // Wait for user to authorize code on GitHub
      const accessToken = await waitForGitHubToken(device)
      if (abortControllerRef.current) return

      setPollStatus('Fetching your GitHub profile...')
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

      showToast(`✓ Welcome @${profile.login}! GitHub connected successfully.`)
      onSuccess(authUser, repos)
      onClose()
    } catch (err: any) {
      if (abortControllerRef.current) return
      const raw = err?.message || ''
      if (raw.toLowerCase().includes('device_flow_disabled')) {
        setErrorMsg('GitHub Device Flow is not enabled for this OAuth App. Enable it in the GitHub OAuth App settings and try again.')
      } else if (raw.toLowerCase().includes('load failed') || raw.toLowerCase().includes('failed to fetch')) {
        setErrorMsg('Could not reach GitHub OAuth. Check your network and OAuth API configuration, then try again.')
      } else {
        setErrorMsg(raw || 'GitHub authorization failed or timed out. Please try again.')
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
          width: 480,
          maxWidth: '92vw',
          padding: 24,
          textAlign: 'center',
          position: 'relative',
          background: '#0d1117',
          border: '1px solid #30363d',
          borderRadius: 14,
          boxShadow: '0 24px 60px rgba(0, 0, 0, 0.8)',
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
            color: '#7d8590',
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
            background: '#24292f',
            color: '#ffffff',
            display: 'grid',
            placeItems: 'center',
            margin: '0 auto 12px',
            border: '1px solid #30363d',
            boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
          }}
        >
          <svg width="26" height="26" viewBox="0 0 16 16" fill="currentColor">
            <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0 0 16 8c0-4.42-3.58-8-8-8z" />
          </svg>
        </div>

        {/* Modal Header */}
        <div style={{ fontSize: 19, fontWeight: 700, color: '#f0f6fc', marginBottom: 4 }}>
          Connect GitHub Account
        </div>
        <p style={{ color: '#8b949e', fontSize: 13, lineHeight: 1.5, marginBottom: 16 }}>
          Sync repositories, edit files, and commit directly from CodeForge.
        </p>

        {/* ── TAB 1: OAuth Device Code Flow ──────────────────────────── */}
        <div>
            {!deviceData ? (
              <div>
                <div
                  style={{
                    background: '#161b22',
                    border: '1px solid #30363d',
                    borderRadius: 8,
                    padding: '12px 14px',
                    textAlign: 'left',
                    marginBottom: 16,
                    fontSize: 12,
                    color: '#c9d1d9',
                    lineHeight: 1.6,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    <span style={{ color: '#3fb950', fontSize: 14 }}>✓</span>
                    <span>1-Click official GitHub OAuth 2.0 Device Code</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    <span style={{ color: '#3fb950', fontSize: 14 }}>✓</span>
                    <span>Direct branch switching, commit, and repo syncing</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ color: '#3fb950', fontSize: 14 }}>✓</span>
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
                  background: '#161b22',
                  border: '1px solid #30363d',
                  borderRadius: 10,
                  padding: '18px 16px',
                  textAlign: 'center',
                }}
              >
                <div style={{ fontSize: 12, color: '#8b949e', marginBottom: 10 }}>
                  Enter this verification code on the GitHub authorization page:
                </div>

                <div
                  style={{
                    fontFamily: 'JetBrains Mono, monospace',
                    fontSize: 26,
                    fontWeight: 700,
                    letterSpacing: '0.14em',
                    color: '#58a6ff',
                    background: '#0d1117',
                    border: '1px solid #30363d',
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
                      border: '1px solid #30363d',
                      color: copiedCode ? '#3fb950' : '#c9d1d9',
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
                    color: '#8b949e',
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
                    color: '#7d8590',
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

        {/* OAuth error and retry action */}
        {errorMsg && (
          <div
            style={{
              background: '#2d1b20',
              border: '1px solid #6e2a32',
              color: '#ffa198',
              borderRadius: 8,
              padding: '12px 14px',
              fontSize: 12,
              marginTop: 14,
              lineHeight: 1.5,
              textAlign: 'left',
            }}
          >
            <div style={{ fontWeight: 600, marginBottom: 4 }}>Connection Notice:</div>
            <div>{errorMsg}</div>

            <div style={{ marginTop: 10, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button
                onClick={handleStartOAuth}
                style={{
                  background: '#30363d',
                  border: '1px solid #484f58',
                  borderRadius: 4,
                  color: '#f0f6fc',
                  fontSize: 11,
                  padding: '4px 10px',
                  cursor: 'pointer',
                  fontWeight: 600,
                }}
              >
                Try Again
              </button>
            </div>
          </div>
        )}

        {/* OAuth security note */}
        <div
          style={{
            marginTop: 18,
            paddingTop: 12,
            borderTop: '1px solid #21262d',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 11,
            color: '#7d8590',
          }}
        >
          <span>GitHub OAuth authorization</span>
        </div>
      </div>
    </div>
  )
}

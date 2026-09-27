import { useState } from 'react'
import type { AuthUser } from '../lib/storage'
import {
  type DeviceCodeResponse,
  type GitHubRepository,
  startGitHubDeviceFlow,
  waitForGitHubToken,
  getGitHubUser,
  getGitHubRepositories,
  isGitHubConfigured,
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
  const [deviceData, setDeviceData] = useState<DeviceCodeResponse | null>(null)
  const [copiedCode, setCopiedCode] = useState(false)

  if (!isOpen) return null

  // ── GitHub Device Code Flow ────────────────────────────────────────────────
  const handleStartDeviceFlow = async () => {
    setBusy(true)
    setErrorMsg('')
    try {
      const device = await startGitHubDeviceFlow()
      setDeviceData(device)

      // Open verification page automatically in a new window/tab
      window.open(device.verification_uri, '_blank', 'noopener,noreferrer')

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
      setErrorMsg(err.message || 'GitHub authorization failed or timed out.')
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

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-box auth-modal"
        style={{ width: 440, padding: 26, textAlign: 'center' }}
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
            fontSize: 16,
          }}
        >
          ✕
        </button>

        {/* Brand Icon */}
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
          }}
        >
          <svg width="26" height="26" viewBox="0 0 16 16" fill="currentColor">
            <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0 0 16 8c0-4.42-3.58-8-8-8z" />
          </svg>
        </div>

        <div style={{ fontSize: 18, fontWeight: 700, color: '#e6edf3', marginBottom: 6 }}>
          Connect with GitHub
        </div>
        <p style={{ color: '#7d8590', fontSize: 12, lineHeight: 1.6, marginBottom: 20 }}>
          Sign in to sync your repositories, load files into the editor, and commit changes directly just like in VS Code.
        </p>

        {/* If flow not started yet */}
        {!deviceData ? (
          <div>
            {!isGitHubConfigured() && (
              <div
                style={{
                  background: '#2d1b20',
                  border: '1px solid #6e2a32',
                  color: '#ffa198',
                  borderRadius: 6,
                  padding: '10px 12px',
                  fontSize: 11,
                  lineHeight: 1.5,
                  marginBottom: 14,
                  textAlign: 'left',
                }}
              >
                ⚠️ <code>VITE_GITHUB_CLIENT_ID</code> is missing in <code>.env</code>.
              </div>
            )}

            <button
              onClick={handleStartDeviceFlow}
              disabled={busy || !isGitHubConfigured()}
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
                  <SpinnerIcon size={14} /> Initializing GitHub Authorization...
                </>
              ) : (
                <>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                    <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0 0 16 8c0-4.42-3.58-8-8-8z" />
                  </svg>
                  Authorize with GitHub
                </>
              )}
            </button>
          </div>
        ) : (
          /* Active device code display */
          <div
            style={{
              background: '#0d1117',
              border: '1px solid #30363d',
              borderRadius: 8,
              padding: '16px 14px',
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

        {/* Error Notification */}
        {errorMsg && (
          <div
            style={{
              background: '#2d1b20',
              border: '1px solid #6e2a32',
              color: '#ffa198',
              borderRadius: 6,
              padding: '8px 10px',
              fontSize: 11,
              marginTop: 14,
              textAlign: 'left',
            }}
          >
            {errorMsg}
          </div>
        )}

        {/* Footer info */}
        <div
          style={{
            marginTop: 20,
            paddingTop: 12,
            borderTop: '1px solid #21262d',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: 10,
            color: '#7d8590',
          }}
        >
          <span>🔒 Tokens are stored locally only</span>
          <span>GitHub OAuth Device Flow</span>
        </div>
      </div>
    </div>
  )
}

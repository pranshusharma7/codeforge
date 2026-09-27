import { useState } from 'react'
import type { Language } from '../types'
import { CopyIcon, CheckIcon, DownloadIcon, XIcon } from './icons'

interface Props {
  code: string
  language: Language
  onClose: () => void
}

function b64url(str: string) {
  try { return btoa(encodeURIComponent(str)) } catch { return '' }
}

export default function ShareModal({ code, language, onClose }: Props) {
  const encoded = b64url(code)
  const shareLink = `${location.origin}?lang=${language.id}&code=${encoded}`
  const shortLink = `https://codeforge.dev/s/${Math.random().toString(36).slice(2, 9)}`

  const [copiedLink, setCopiedLink] = useState(false)
  const [copiedCode, setCopiedCode] = useState(false)

  const copy = (text: string, which: 'link' | 'code') => {
    navigator.clipboard.writeText(text).catch(() => {})
    if (which === 'link') { setCopiedLink(true); setTimeout(() => setCopiedLink(false), 1800) }
    else { setCopiedCode(true); setTimeout(() => setCopiedCode(false), 1800) }
  }

  const download = () => {
    const blob = new Blob([code], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `code.${language.ext}`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ width: 480, padding: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 22 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--accent-bg)', border: '1px solid var(--accent-bd)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="2.5" r="1.5"/><circle cx="3" cy="7.5" r="1.5"/><circle cx="11" cy="12.5" r="1.5"/><path d="M4.5 6.5l5-3M4.5 8.5l5 3"/></svg>
          </div>
          <div>
            <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--text-base)' }}>Share Code</h2>
            <p style={{ margin: 0, fontSize: 12, color: 'var(--text-muted)' }}>{language.label} · {code.split('\n').length} lines</p>
          </div>
          <button onClick={onClose} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 4, borderRadius: 6 }}>
            <XIcon size={14} />
          </button>
        </div>

        {/* Short link */}
        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.07em', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>Shareable Link</label>
          <div style={{ display: 'flex', gap: 8 }}>
            <div style={{ flex: 1, background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: 8, padding: '9px 12px', fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: 'var(--accent)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {shortLink}
            </div>
            <button onClick={() => copy(shortLink, 'link')} className="btn btn-accent" style={{ padding: '8px 14px', fontSize: 12, gap: 5 }}>
              {copiedLink ? <CheckIcon size={13} /> : <CopyIcon size={13} />}
              {copiedLink ? 'Copied!' : 'Copy'}
            </button>
          </div>
        </div>

        {/* Code preview */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
            <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.07em', textTransform: 'uppercase' }}>Code Preview</label>
            <button onClick={() => copy(code, 'code')} className="btn btn-ghost" style={{ padding: '3px 8px', fontSize: 11, gap: 4 }}>
              {copiedCode ? <CheckIcon size={11} /> : <CopyIcon size={11} />} {copiedCode ? 'Copied!' : 'Copy Code'}
            </button>
          </div>
          <pre style={{
            margin: 0, padding: '12px 14px', background: 'var(--bg-input)', border: '1px solid var(--border)',
            borderRadius: 8, fontFamily: "'JetBrains Mono', monospace", fontSize: 11,
            lineHeight: 1.65, color: 'var(--text-muted)', maxHeight: 160, overflow: 'auto',
            whiteSpace: 'pre', overflowX: 'auto',
          }}>
            {code.slice(0, 800)}{code.length > 800 ? '\n...' : ''}
          </pre>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={download} className="btn btn-ghost" style={{ flex: 1, padding: '9px', fontSize: 13, gap: 6 }}>
            <DownloadIcon size={14} /> Download .{language.ext}
          </button>
          <button onClick={onClose} className="btn btn-accent" style={{ flex: 1, padding: '9px', fontSize: 13 }}>
            Done
          </button>
        </div>
      </div>
    </div>
  )
}

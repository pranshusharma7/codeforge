import React, { useState, useEffect } from 'react'
import { XIcon, RefreshIcon, CheckIcon } from './icons'

interface Props {
  isOpen: boolean
  onClose: () => void
  htmlContent: string
  activeFileName: string
  showToast: (msg: string) => void
}

export default function LiveServerModal({
  isOpen,
  onClose,
  htmlContent,
  activeFileName,
  showToast,
}: Props) {
  const [device, setDevice] = useState<'desktop' | 'tablet' | 'mobile'>('desktop')
  const [key, setKey] = useState(0)
  const [copiedUrl, setCopiedUrl] = useState(false)

  const serverUrl = `http://127.0.0.1:5500/${activeFileName.endsWith('.html') ? activeFileName : 'index.html'}`

  if (!isOpen) return null

  // Ensure HTML boilerplate if user wrote partial HTML
  const finalSrcDoc = htmlContent.includes('<html') || htmlContent.includes('<!DOCTYPE')
    ? htmlContent
    : `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${activeFileName}</title>
  <style>body { font-family: system-ui, sans-serif; padding: 20px; line-height: 1.6; color: #24292e; }</style>
</head>
<body>
  ${htmlContent}
</body>
</html>`

  const handleOpenExternal = () => {
    const blob = new Blob([finalSrcDoc], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    window.open(url, '_blank')
    showToast('Opened Live Server in new tab 🚀')
  }

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(serverUrl).catch(() => {})
    setCopiedUrl(true)
    setTimeout(() => setCopiedUrl(false), 2000)
    showToast('Copied Live Server URL: ' + serverUrl)
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(6px)',
        zIndex: 10000,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '92vw',
          maxWidth: device === 'mobile' ? 420 : device === 'tablet' ? 820 : 1100,
          height: '88vh',
          background: '#18181b',
          border: '1px solid rgba(255,255,255,0.15)',
          borderRadius: 12,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          boxShadow: '0 25px 60px rgba(0,0,0,0.8)',
          transition: 'max-width 0.25s ease',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* ── Top Browser Address Bar Chrome ─────────────────────────────────── */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '8px 14px',
            background: 'rgba(255,255,255,0.04)',
            borderBottom: '1px solid rgba(255,255,255,0.08)',
            gap: 12,
            flexShrink: 0,
          }}
        >
          {/* Traffic lights / Status */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ display: 'flex', gap: 6 }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#f87171' }} />
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#fbbf24' }} />
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#34d399' }} />
            </div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                padding: '2px 8px',
                borderRadius: 12,
                background: 'rgba(52, 211, 153, 0.15)',
                border: '1px solid rgba(52, 211, 153, 0.3)',
                color: '#34d399',
                fontSize: 10,
                fontWeight: 700,
              }}
            >
              <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#34d399' }} />
              <span>LIVE SERVER : 5500</span>
            </div>
          </div>

          {/* Address URL pill */}
          <div
            style={{
              flex: 1,
              maxWidth: 480,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: '#090d16',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 6,
              padding: '4px 10px',
              fontSize: 11,
              fontFamily: 'monospace',
              color: '#38bdf8',
            }}
          >
            <span>{serverUrl}</span>
            <button
              onClick={handleCopyUrl}
              style={{ background: 'none', border: 'none', color: copiedUrl ? '#34d399' : 'var(--text-dim)', cursor: 'pointer', fontSize: 10 }}
              title="Copy URL"
            >
              {copiedUrl ? 'Copied!' : 'Copy'}
            </button>
          </div>

          {/* Device Controls & Actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {/* Refresh */}
            <button
              onClick={() => {
                setKey(k => k + 1)
                showToast('Reloaded Live Server preview 🔄')
              }}
              title="Reload preview"
              style={{
                background: 'none',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 4,
                padding: '4px 7px',
                color: 'var(--text-muted)',
                cursor: 'pointer',
              }}
            >
              <RefreshIcon size={12} />
            </button>

            {/* Responsive switcher */}
            <div style={{ display: 'flex', background: 'rgba(255,255,255,0.06)', borderRadius: 6, padding: 2 }}>
              {(['desktop', 'tablet', 'mobile'] as const).map(d => (
                <button
                  key={d}
                  onClick={() => setDevice(d)}
                  style={{
                    padding: '3px 8px',
                    borderRadius: 4,
                    background: device === d ? 'rgba(56, 189, 248, 0.2)' : 'transparent',
                    border: 'none',
                    color: device === d ? '#38bdf8' : 'var(--text-muted)',
                    fontSize: 10,
                    fontWeight: 600,
                    cursor: 'pointer',
                    textTransform: 'capitalize',
                  }}
                >
                  {d === 'desktop' ? '🖥️ Desktop' : d === 'tablet' ? '📱 Tablet' : '📱 Mobile'}
                </button>
              ))}
            </div>

            {/* Open in new tab */}
            <button
              onClick={handleOpenExternal}
              className="btn btn-ghost"
              style={{ padding: '4px 8px', fontSize: 11, gap: 4 }}
              title="Open full page in browser"
            >
              <span>↗ Popout</span>
            </button>

            {/* Close */}
            <button
              onClick={onClose}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-muted)',
                padding: 4,
                cursor: 'pointer',
              }}
            >
              <XIcon size={14} />
            </button>
          </div>
        </div>

        {/* ── IFrame Browser Viewport ────────────────────────────────────────── */}
        <div style={{ flex: 1, background: '#ffffff', overflow: 'hidden', position: 'relative' }}>
          <iframe
            key={key}
            srcDoc={finalSrcDoc}
            title="Live Server Preview"
            sandbox="allow-scripts allow-modals allow-forms allow-same-origin"
            style={{
              width: '100%',
              height: '100%',
              border: 'none',
              background: '#ffffff',
            }}
          />
        </div>
      </div>
    </div>
  )
}

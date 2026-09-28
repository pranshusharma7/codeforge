import React, { useState, useEffect, useRef, useMemo } from 'react'
import { XIcon, RefreshIcon, ExternalLinkIcon } from './icons'

export interface TabFile {
  id: string
  name: string
  lang: string
  code: string
}

interface WebPreviewPanelProps {
  activeTab: TabFile
  allTabs: TabFile[]
  onClose: () => void
}

interface ConsoleMsg {
  id: string
  level: 'log' | 'warn' | 'error' | 'info'
  text: string
  time: string
}

export default function WebPreviewPanel({ activeTab, allTabs, onClose }: WebPreviewPanelProps) {
  const [deviceMode, setDeviceMode] = useState<'responsive' | 'desktop' | 'tablet' | 'mobile'>('responsive')
  const [refreshKey, setRefreshKey] = useState<number>(0)
  const [consoleOpen, setConsoleOpen] = useState<boolean>(false)
  const [consoleLogs, setConsoleLogs] = useState<ConsoleMsg[]>([])
  const iframeRef = useRef<HTMLIFrameElement>(null)

  // Listen to console messages from the sandboxed iframe
  useEffect(() => {
    const handleMessage = (e: MessageEvent) => {
      if (e.data && e.data.type === 'codeforge-web-log') {
        const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
        setConsoleLogs(prev => [
          ...prev.slice(-150),
          {
            id: crypto.randomUUID(),
            level: e.data.level || 'log',
            text: e.data.text || '',
            time: timeStr,
          },
        ])
      }
    }
    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [])

  // Clear logs on reload
  const handleRefresh = () => {
    setConsoleLogs([])
    setRefreshKey(p => p + 1)
  }

  // Construct combined HTML with resolved CSS and JS tabs
  const assembledHtml = useMemo(() => {
    let rawHtml = activeTab.code || ''

    // Helper: look up file by name (exact or lowercase match)
    const findTab = (filename: string) => {
      const clean = filename.replace(/^(\.\/|\/)/, '').toLowerCase().trim()
      return allTabs.find(t => t.name.toLowerCase().trim() === clean || t.name.toLowerCase().endsWith('/' + clean))
    }

    // 1. Replace <link rel="stylesheet" href="..."> with inline <style>
    const linkRegex = /<link\s+[^>]*href=["']([^"']+\.css)["'][^>]*>/gi
    const matchedCssFiles = new Set<string>()

    rawHtml = rawHtml.replace(linkRegex, (fullMatch, href) => {
      const matched = findTab(href)
      if (matched) {
        matchedCssFiles.add(matched.name.toLowerCase())
        return `<style data-source="${matched.name}">\n/* Inlined from ${matched.name} */\n${matched.code}\n</style>`
      }
      return fullMatch
    })

    // 2. Replace <script src="..."> with inline <script>
    const scriptSrcRegex = /<script\s+[^>]*src=["']([^"']+\.js)["'][^>]*>\s*<\/script>/gi
    const matchedJsFiles = new Set<string>()

    rawHtml = rawHtml.replace(scriptSrcRegex, (fullMatch, src) => {
      const matched = findTab(src)
      if (matched) {
        matchedJsFiles.add(matched.name.toLowerCase())
        return `<script data-source="${matched.name}">\n/* Inlined from ${matched.name} */\n${matched.code}\n</script>`
      }
      return fullMatch
    })

    // 3. Inject any remaining .css workspace files not explicitly linked
    const otherCssTabs = allTabs.filter(t => (t.lang === 'css' || t.name.toLowerCase().endsWith('.css')) && !matchedCssFiles.has(t.name.toLowerCase()))
    let extraStyles = ''
    if (otherCssTabs.length > 0) {
      extraStyles = otherCssTabs
        .map(t => `<style data-auto-injected="${t.name}">\n/* Auto-linked from workspace: ${t.name} */\n${t.code}\n</style>`)
        .join('\n')
    }

    // 4. Inject console hook script to capture console.log & uncaught errors
    const consoleHookScript = `
<script>
(function() {
  function sendLog(level, args) {
    try {
      var text = Array.from(args).map(function(item) {
        if (typeof item === 'object' && item !== null) {
          try { return JSON.stringify(item, null, 2); } catch(e) { return String(item); }
        }
        return String(item);
      }).join(' ');
      window.parent.postMessage({ type: 'codeforge-web-log', level: level, text: text }, '*');
    } catch(err) {}
  }
  var _log = console.log, _warn = console.warn, _error = console.error, _info = console.info;
  console.log = function() { sendLog('log', arguments); _log.apply(console, arguments); };
  console.warn = function() { sendLog('warn', arguments); _warn.apply(console, arguments); };
  console.error = function() { sendLog('error', arguments); _error.apply(console, arguments); };
  console.info = function() { sendLog('info', arguments); _info.apply(console, arguments); };
  window.addEventListener('error', function(e) {
    sendLog('error', ['Uncaught Error: ' + e.message + (e.filename ? ' at ' + e.filename + ':' + e.lineno : '')]);
  });
})();
</script>
`

    // Inject into <head> or prepend
    if (rawHtml.includes('</head>')) {
      rawHtml = rawHtml.replace('</head>', `${extraStyles}\n${consoleHookScript}\n</head>`)
    } else if (rawHtml.includes('<body')) {
      rawHtml = rawHtml.replace('<body', `${extraStyles}\n${consoleHookScript}\n<body`)
    } else {
      rawHtml = `<!DOCTYPE html>\n<html>\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1.0">\n${extraStyles}\n${consoleHookScript}\n</head>\n<body>\n${rawHtml}\n</body>\n</html>`
    }

    return rawHtml
  }, [activeTab, allTabs, refreshKey])

  // Open in real browser tab via Blob URL
  const openInNewTab = () => {
    try {
      const blob = new Blob([assembledHtml], { type: 'text/html' })
      const url = URL.createObjectURL(blob)
      window.open(url, '_blank')
    } catch (err) {
      console.error('Failed to open in new tab:', err)
    }
  }

  // Viewport widths
  const viewportWidth = deviceMode === 'tablet' ? '768px' : deviceMode === 'mobile' ? '375px' : '100%'

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        width: '100%',
        background: 'var(--bg-app)',
        borderLeft: '1px solid var(--border)',
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      {/* ── Top Browser Navigation Chrome ────────────────────────────────────────── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '6px 10px',
          background: 'var(--bg-header)',
          borderBottom: '1px solid var(--border)',
          flexShrink: 0,
          minHeight: 40,
        }}
      >
        {/* Live Badge */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 5,
            padding: '3px 8px',
            borderRadius: 12,
            background: 'rgba(52, 211, 153, 0.12)',
            border: '1px solid rgba(52, 211, 153, 0.3)',
            color: '#10b981',
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
            flexShrink: 0,
          }}
        >
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981', boxShadow: '0 0 6px #10b981' }} />
          Web Output
        </div>

        {/* URL Bar */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: 6,
            padding: '3px 10px',
            fontSize: 11,
            color: 'var(--text-muted)',
            fontFamily: "'JetBrains Mono', monospace",
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
          title={`http://localhost:3000/${activeTab.name}`}
        >
          <span style={{ color: '#10b981', fontSize: 10 }}>🔒</span>
          <span style={{ color: 'var(--text-base)' }}>http://localhost:3000/</span>
          <span style={{ color: 'var(--accent)', fontWeight: 600 }}>{activeTab.name}</span>
        </div>

        {/* Device Mode Switchers */}
        <div style={{ display: 'flex', alignItems: 'center', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 6, padding: 1, gap: 1 }}>
          <button
            onClick={() => setDeviceMode('responsive')}
            title="Full Width"
            style={{
              background: deviceMode === 'responsive' ? 'var(--bg-hover)' : 'transparent',
              color: deviceMode === 'responsive' ? 'var(--text-base)' : 'var(--text-dim)',
              border: 'none',
              borderRadius: 4,
              padding: '3px 6px',
              fontSize: 11,
              cursor: 'pointer',
            }}
          >
            🖥
          </button>
          <button
            onClick={() => setDeviceMode('tablet')}
            title="Tablet (768px)"
            style={{
              background: deviceMode === 'tablet' ? 'var(--bg-hover)' : 'transparent',
              color: deviceMode === 'tablet' ? 'var(--text-base)' : 'var(--text-dim)',
              border: 'none',
              borderRadius: 4,
              padding: '3px 6px',
              fontSize: 11,
              cursor: 'pointer',
            }}
          >
            📱
          </button>
          <button
            onClick={() => setDeviceMode('mobile')}
            title="Mobile (375px)"
            style={{
              background: deviceMode === 'mobile' ? 'var(--bg-hover)' : 'transparent',
              color: deviceMode === 'mobile' ? 'var(--text-base)' : 'var(--text-dim)',
              border: 'none',
              borderRadius: 4,
              padding: '3px 6px',
              fontSize: 11,
              cursor: 'pointer',
            }}
          >
            📲
          </button>
        </div>

        {/* Reload button */}
        <button
          onClick={handleRefresh}
          title="Reload Preview"
          style={{
            background: 'transparent',
            border: '1px solid var(--border)',
            borderRadius: 6,
            color: 'var(--text-muted)',
            padding: '4px 7px',
            display: 'flex',
            alignItems: 'center',
            cursor: 'pointer',
            transition: 'all 0.12s',
          }}
          onMouseEnter={e => { e.currentTarget.style.color = 'var(--text-base)'; e.currentTarget.style.background = 'var(--bg-hover)' }}
          onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.background = 'transparent' }}
        >
          <RefreshIcon size={12} />
        </button>

        {/* Open In New Tab */}
        <button
          onClick={openInNewTab}
          title="Open Preview in New Tab"
          style={{
            background: 'transparent',
            border: '1px solid var(--border)',
            borderRadius: 6,
            color: 'var(--text-muted)',
            padding: '4px 7px',
            display: 'flex',
            alignItems: 'center',
            cursor: 'pointer',
            transition: 'all 0.12s',
          }}
          onMouseEnter={e => { e.currentTarget.style.color = 'var(--text-base)'; e.currentTarget.style.background = 'var(--bg-hover)' }}
          onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.background = 'transparent' }}
        >
          <ExternalLinkIcon size={12} />
        </button>

        {/* Toggle Web Console */}
        <button
          onClick={() => setConsoleOpen(p => !p)}
          title="Toggle Web Console"
          style={{
            background: consoleOpen ? 'var(--accent-subtle)' : 'transparent',
            border: `1px solid ${consoleOpen ? 'var(--accent)' : 'var(--border)'}`,
            borderRadius: 6,
            color: consoleOpen ? 'var(--accent)' : 'var(--text-muted)',
            padding: '3px 8px',
            fontSize: 11,
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            cursor: 'pointer',
            fontWeight: 600,
          }}
        >
          <span>Console</span>
          {consoleLogs.length > 0 && (
            <span
              style={{
                fontSize: 9,
                padding: '1px 5px',
                borderRadius: 10,
                background: consoleLogs.some(l => l.level === 'error') ? 'var(--red)' : 'var(--accent)',
                color: '#fff',
              }}
            >
              {consoleLogs.length}
            </span>
          )}
        </button>

        {/* Close Button */}
        <button
          onClick={onClose}
          title="Close Web Preview"
          style={{
            background: 'transparent',
            border: 'none',
            borderRadius: 4,
            color: 'var(--text-muted)',
            padding: 4,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
          }}
          onMouseEnter={e => { e.currentTarget.style.color = 'var(--red)'; e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)' }}
          onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.background = 'transparent' }}
        >
          <XIcon size={14} />
        </button>
      </div>

      {/* ── Main Iframe Sandbox Canvas ───────────────────────────────────────────── */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'stretch',
          background: deviceMode === 'responsive' ? '#ffffff' : 'var(--bg-app)',
          overflow: 'hidden',
          padding: deviceMode === 'responsive' ? 0 : 12,
        }}
      >
        <div
          style={{
            width: viewportWidth,
            height: '100%',
            background: '#ffffff',
            boxShadow: deviceMode === 'responsive' ? 'none' : '0 8px 30px rgba(0,0,0,0.3)',
            borderRadius: deviceMode === 'responsive' ? 0 : 8,
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            transition: 'width 0.2s ease',
          }}
        >
          <iframe
            key={refreshKey}
            ref={iframeRef}
            srcDoc={assembledHtml}
            title="Website Live Output"
            sandbox="allow-scripts allow-modals allow-forms allow-same-origin allow-popups"
            style={{
              width: '100%',
              height: '100%',
              border: 'none',
              background: '#ffffff',
            }}
          />
        </div>
      </div>

      {/* ── Optional Collapsible Web Console Drawer ─────────────────────────────── */}
      {consoleOpen && (
        <div
          style={{
            height: 180,
            display: 'flex',
            flexDirection: 'column',
            background: 'var(--bg-panel)',
            borderTop: '1px solid var(--border)',
            flexShrink: 0,
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 11,
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '4px 10px',
              background: 'var(--bg-header)',
              borderBottom: '1px solid var(--border)',
              color: 'var(--text-muted)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600 }}>
              <span>🖥 Web Console Logs</span>
              <span style={{ fontSize: 10, color: 'var(--text-dim)' }}>({consoleLogs.length} messages)</span>
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <button
                onClick={() => setConsoleLogs([])}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 11 }}
                title="Clear Logs"
              >
                Clear
              </button>
              <button
                onClick={() => setConsoleOpen(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 11 }}
                title="Hide Console"
              >
                ✕
              </button>
            </div>
          </div>
          <div style={{ flex: 1, overflowY: 'auto', padding: '6px 10px', display: 'flex', flexDirection: 'column', gap: 4 }}>
            {consoleLogs.length === 0 ? (
              <div style={{ color: 'var(--text-dim)', fontStyle: 'italic', padding: 8 }}>
                No console messages logged yet. Use <code>console.log()</code> in your JavaScript to see output here.
              </div>
            ) : (
              consoleLogs.map(log => {
                let color = 'var(--text-base)'
                let bg = 'transparent'
                if (log.level === 'error') {
                  color = 'var(--red)'
                  bg = 'rgba(239, 68, 68, 0.08)'
                } else if (log.level === 'warn') {
                  color = 'var(--yellow)'
                  bg = 'rgba(234, 179, 8, 0.08)'
                }
                return (
                  <div
                    key={log.id}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 8,
                      padding: '2px 6px',
                      borderRadius: 4,
                      background: bg,
                      color,
                      lineHeight: 1.5,
                      wordBreak: 'break-word',
                    }}
                  >
                    <span style={{ color: 'var(--text-dim)', fontSize: 10, flexShrink: 0 }}>{log.time}</span>
                    <span style={{ flex: 1 }}>{log.text}</span>
                  </div>
                )
              })
            )}
          </div>
        </div>
      )}
    </div>
  )
}

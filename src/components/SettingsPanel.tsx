import type { Theme } from '../types'
import { SunIcon, MoonIcon } from './icons'

interface Props {
  theme: Theme
  fontSize: number
  wordWrap: boolean
  onTheme: (t: Theme) => void
  onFontSize: (n: number) => void
  onWordWrap: (v: boolean) => void
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
      <span style={{ fontSize: 13, color: 'var(--text-base)', fontWeight: 500 }}>{label}</span>
      {children}
    </div>
  )
}

export default function SettingsPanel({ theme, fontSize, wordWrap, onTheme, onFontSize, onWordWrap }: Props) {
  return (
    <div style={{ padding: '14px 16px' }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 12 }}>Editor Settings</div>

      <Row label="Theme">
        <div style={{ display: 'flex', gap: 6 }}>
          {(['dark', 'light'] as Theme[]).map(t => (
            <button key={t} onClick={() => onTheme(t)} className="btn btn-ghost"
              style={{ padding: '5px 10px', fontSize: 12, gap: 5, background: theme === t ? 'var(--accent-bg)' : undefined, borderColor: theme === t ? 'var(--accent-bd)' : undefined, color: theme === t ? 'var(--accent)' : undefined }}>
              {t === 'dark' ? <MoonIcon size={13} /> : <SunIcon size={13} />}
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>
      </Row>

      <Row label="Font Size">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button onClick={() => onFontSize(Math.max(10, fontSize - 1))} className="btn btn-ghost" style={{ padding: '4px 10px', fontSize: 14, fontWeight: 700 }}>−</button>
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, color: 'var(--accent)', minWidth: 28, textAlign: 'center' }}>{fontSize}</span>
          <button onClick={() => onFontSize(Math.min(22, fontSize + 1))} className="btn btn-ghost" style={{ padding: '4px 10px', fontSize: 14, fontWeight: 700 }}>+</button>
        </div>
      </Row>

      <Row label="Word Wrap">
        <button onClick={() => onWordWrap(!wordWrap)}
          style={{ width: 40, height: 22, borderRadius: 11, background: wordWrap ? 'var(--accent)' : 'var(--bg-hover)', border: '1px solid var(--border)', cursor: 'pointer', position: 'relative', transition: 'background 0.2s', padding: 0 }}>
          <div style={{ position: 'absolute', top: 2, left: wordWrap ? 20 : 2, width: 16, height: 16, borderRadius: '50%', background: wordWrap ? '#1e1e2e' : 'var(--text-muted)', transition: 'left 0.2s' }} />
        </button>
      </Row>

      <div style={{ marginTop: 20, padding: 12, background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: 8 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 8 }}>Keyboard Shortcuts</div>
        {[
          ['Ctrl+Enter', 'Run code'],
          ['Ctrl+S', 'Save code'],
          ['Ctrl+/', 'Toggle comment'],
          ['Alt+Shift+F', 'Format code'],
          ['Ctrl+Z', 'Undo'],
          ['Ctrl+Shift+Z', 'Redo'],
          ['Ctrl+D', 'Select next occurrence'],
          ['Ctrl+G', 'Go to line'],
        ].map(([key, label]) => (
          <div key={key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 0' }}>
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{label}</span>
            <kbd style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, background: 'var(--bg-panel)', border: '1px solid var(--border)', padding: '2px 6px', borderRadius: 4, color: 'var(--accent)' }}>{key}</kbd>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 16, padding: 12, background: 'var(--accent-bg)', border: '1px solid var(--accent-bd)', borderRadius: 8 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent)', marginBottom: 6 }}>Judge0 API</div>
        <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0, lineHeight: 1.5 }}>
          Set <code style={{ fontFamily: "'JetBrains Mono'", fontSize: 11, color: 'var(--accent)' }}>VITE_JUDGE0_URL</code> and <code style={{ fontFamily: "'JetBrains Mono'", fontSize: 11, color: 'var(--accent)' }}>VITE_JUDGE0_KEY</code> in your <code style={{ fontFamily: "'JetBrains Mono'", fontSize: 11 }}>.env</code> to enable real sandboxed execution.
        </p>
      </div>
      <div style={{ marginTop: 8, padding: 12, background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: 8 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 6 }}>AI Providers & BYOK</div>
        <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0, lineHeight: 1.5 }}>
          CodeForge supports Bring Your Own Key (BYOK) for Google Gemini, OpenAI ChatGPT, Anthropic Claude, and GitHub Copilot/Models. Connect your personal key in the AI Assistant header or Settings modal to enjoy 100% free unlimited queries without consuming host tokens.
        </p>
      </div>
    </div>
  )
}

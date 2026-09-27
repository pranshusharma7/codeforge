import { useState, useRef, useEffect } from 'react'
import type { AIMessage, ExecutionResult, Language } from '../types'
import { askAI, fixBug, reviewCode } from '../engine/ai'
import { SendIcon, BugIcon, ReviewIcon, SpinnerIcon, CopyIcon, CheckIcon, XIcon } from './icons'

interface Props {
  code: string
  language: Language
  lastResult: ExecutionResult | null
  onClose: () => void
}

function renderContent(text: string) {
  // Simple markdown renderer: code blocks and inline code
  const parts = text.split(/(```[\s\S]*?```|`[^`]+`)/g)
  return parts.map((part, i) => {
    if (part.startsWith('```')) {
      const lines = part.slice(3, -3).split('\n')
      const lang = lines[0].trim()
      const code = lines.slice(1).join('\n')
      return (
        <pre key={i} className="ai-code-block">
          {lang && <span style={{ color: 'var(--text-muted)', fontSize: 10, display: 'block', marginBottom: 4 }}>{lang}</span>}
          {code}
        </pre>
      )
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return <code key={i} style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.9em', background: 'var(--bg-panel)', padding: '1px 5px', borderRadius: 4, border: '1px solid var(--border)' }}>{part.slice(1, -1)}</code>
    }
    // Bold
    const boldParts = part.split(/(\*\*[^*]+\*\*)/g)
    return (
      <span key={i}>
        {boldParts.map((bp, j) =>
          bp.startsWith('**') ? <strong key={j} style={{ color: 'var(--text-base)', fontWeight: 600 }}>{bp.slice(2, -2)}</strong> : <span key={j}>{bp}</span>
        )}
      </span>
    )
  })
}

function Message({ msg }: { msg: AIMessage }) {
  const [copied, setCopied] = useState(false)

  const copyMsg = () => {
    navigator.clipboard.writeText(msg.content).catch(() => {})
    setCopied(true)
    setTimeout(() => setCopied(false), 1800)
  }

  return (
    <div className={`fade-in ${msg.role === 'user' ? 'ai-bubble-user' : 'ai-bubble-ai'}`}>
      {msg.role === 'assistant' && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
          <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--accent)', letterSpacing: '0.06em' }}>CODEFORGE AI</span>
          <button onClick={copyMsg} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-dim)', padding: 2, borderRadius: 3, display: 'flex', alignItems: 'center' }}>
            {copied ? <CheckIcon size={11} /> : <CopyIcon size={11} />}
          </button>
        </div>
      )}
      <div style={{ lineHeight: 1.65, fontSize: 13 }}>
        {renderContent(msg.content)}
      </div>
      <div style={{ fontSize: 10, color: 'var(--text-dim)', marginTop: 6, textAlign: msg.role === 'user' ? 'right' : 'left' }}>
        {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
      </div>
    </div>
  )
}

const QUICK_PROMPTS = [
  'Explain this code',
  'Optimize for performance',
  'Add comments',
  'Find edge cases',
  'Suggest improvements',
]

export default function AIPanel({ code, language, lastResult, onClose }: Props) {
  const [messages, setMessages] = useState<AIMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: `Hi! I'm **CodeForge AI**. I can help you with your ${language.label} code.\n\nTry asking me to:\n- \`Explain this code\`\n- \`Optimize for performance\`\n- \`Fix this bug\`\n- \`Review before submission\``,
      type: 'text',
      timestamp: new Date(),
    },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const historyRef = useRef<{ role: string; content: string }[]>([])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  const addMessage = (msg: AIMessage) => {
    setMessages(prev => [...prev, msg])
    if (msg.role === 'user') historyRef.current.push({ role: 'user', content: msg.content })
    else historyRef.current.push({ role: 'assistant', content: msg.content })
  }

  const send = async (prompt: string) => {
    if (!prompt.trim() || loading) return
    setInput('')

    addMessage({ id: `u_${Date.now()}`, role: 'user', content: prompt, timestamp: new Date() })
    setLoading(true)

    try {
      const reply = await askAI(prompt, code, language.label, historyRef.current)
      addMessage({ id: `a_${Date.now()}`, role: 'assistant', content: reply, timestamp: new Date() })
    } finally {
      setLoading(false)
    }
  }

  const handleFixBug = async () => {
    if (!lastResult || loading) return
    addMessage({ id: `u_${Date.now()}`, role: 'user', content: `Fix the bug — error output:\n\`\`\`\n${lastResult.stderr || lastResult.compileOutput}\n\`\`\``, timestamp: new Date() })
    setLoading(true)
    try {
      const reply = await fixBug(code, lastResult, language.label)
      addMessage({ id: `a_${Date.now()}`, role: 'assistant', content: reply, type: 'diff', timestamp: new Date() })
    } finally {
      setLoading(false)
    }
  }

  const handleReview = async () => {
    if (loading) return
    addMessage({ id: `u_${Date.now()}`, role: 'user', content: 'Review my code before submission.', timestamp: new Date() })
    setLoading(true)
    try {
      const reply = await reviewCode(code, language.label)
      addMessage({ id: `a_${Date.now()}`, role: 'assistant', content: reply, type: 'review', timestamp: new Date() })
    } finally {
      setLoading(false)
    }
  }

  const clearHistory = () => {
    setMessages([{
      id: `clear_${Date.now()}`, role: 'assistant',
      content: 'Chat cleared. How can I help you?',
      timestamp: new Date(),
    }])
    historyRef.current = []
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--bg-panel)' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
        <div style={{ width: 24, height: 24, borderRadius: 6, background: 'var(--accent-bg)', border: '1px solid var(--accent-bd)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M7 1.5a3.5 3.5 0 0 1 0 7H6L4 11V8.5H3a3.5 3.5 0 0 1 0-7h4z"/></svg>
        </div>
        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-base)', flex: 1 }}>AI Assistant</span>
        <button onClick={clearHistory} title="Clear chat" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-dim)', padding: 3, borderRadius: 4 }}>
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"><path d="M2 3h9m-7 0V2h5v1M4 3v7a1 1 0 0 0 1 1h3a1 1 0 0 0 1-1V3"/></svg>
        </button>
        <button onClick={onClose} title="Close" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-dim)', padding: 3, borderRadius: 4 }}>
          <XIcon size={13} />
        </button>
      </div>

      {/* Quick actions */}
      <div style={{ display: 'flex', gap: 6, padding: '8px 12px', borderBottom: '1px solid var(--border)', flexWrap: 'wrap', flexShrink: 0 }}>
        <button onClick={handleFixBug} disabled={!lastResult || loading}
          className="btn btn-ghost" style={{ padding: '4px 10px', fontSize: 11, gap: 5 }}>
          <BugIcon size={11} /> Fix Bug
        </button>
        <button onClick={handleReview} disabled={loading}
          className="btn btn-ghost" style={{ padding: '4px 10px', fontSize: 11, gap: 5 }}>
          <ReviewIcon size={11} /> Code Review
        </button>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 12px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {messages.map(msg => <Message key={msg.id} msg={msg} />)}

        {loading && (
          <div className="ai-bubble-ai fade-in" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <SpinnerIcon size={13} style={{ color: 'var(--accent)' }} />
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Thinking...</span>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Quick prompts */}
      <div style={{ display: 'flex', gap: 5, padding: '0 12px 8px', overflowX: 'auto', flexShrink: 0 }}>
        {QUICK_PROMPTS.map(p => (
          <button key={p} onClick={() => send(p)} disabled={loading}
            style={{ flexShrink: 0, fontSize: 11, padding: '3px 9px', borderRadius: 20, background: 'var(--bg-hover)', border: '1px solid var(--border)', color: 'var(--text-muted)', cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 0.12s' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.color = 'var(--accent)' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-muted)' }}>
            {p}
          </button>
        ))}
      </div>

      {/* Input */}
      <div style={{ padding: '0 12px 12px', flexShrink: 0 }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: 10, padding: '8px 10px', transition: 'border-color 0.15s' }}
          onFocusCapture={e => e.currentTarget.style.borderColor = 'var(--accent)'}
          onBlurCapture={e => e.currentTarget.style.borderColor = 'var(--border)'}>
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(input) } }}
            placeholder="Ask anything about your code... (Enter to send)"
            rows={1}
            style={{
              flex: 1, background: 'none', border: 'none', outline: 'none',
              color: 'var(--text-base)', fontSize: 13, fontFamily: 'Inter, sans-serif',
              resize: 'none', lineHeight: 1.5, maxHeight: 96, overflowY: 'auto',
            }}
            onInput={e => {
              const el = e.currentTarget
              el.style.height = 'auto'
              el.style.height = Math.min(el.scrollHeight, 96) + 'px'
            }}
          />
          <button onClick={() => send(input)} disabled={!input.trim() || loading}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: input.trim() && !loading ? 'var(--accent)' : 'var(--text-dim)', padding: 2, flexShrink: 0, transition: 'color 0.12s' }}>
            {loading ? <SpinnerIcon size={16} style={{ color: 'var(--accent)' }} /> : <SendIcon size={16} />}
          </button>
        </div>
        <p style={{ fontSize: 10, color: 'var(--text-dim)', margin: '5px 2px 0', lineHeight: 1.4 }}>
          AI reads your current code + last execution output. Shift+Enter for new line.
        </p>
      </div>
    </div>
  )
}

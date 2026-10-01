import React, { useState, useEffect, useRef } from 'react'
import type { AuthUser } from '../lib/storage'
import { askAI } from '../engine/ai'
import logoImg from '../assets/logo.png'
import {
  SendIcon,
  BugIcon,
  ReviewIcon,
  SpinnerIcon,
  CopyIcon,
  CheckIcon,
  XIcon,
  TrashIcon,
} from './icons'

export interface AIMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: number
  isGemini?: boolean
}

interface Props {
  authUser: AuthUser | null
  onOpenGitHubAuth: () => void
  aiUsage: number
  setAiUsage: React.Dispatch<React.SetStateAction<number>>
  maxFreeAI?: number
  isPro?: boolean
  onUpgradePro: () => void
  getActiveCode: () => string
  curTab: { name: string; lang: string }
  onInsertCodeToEditor?: (snippet: string) => void
  onClose: () => void
  showToast: (msg: string) => void
}

export default function AIAppPanel({
  authUser,
  onOpenGitHubAuth,
  aiUsage,
  setAiUsage,
  maxFreeAI = 20,
  isPro = false,
  onUpgradePro,
  getActiveCode,
  curTab,
  onInsertCodeToEditor,
  onClose,
  showToast,
}: Props) {
  const geminiApiKey =
    (import.meta.env.VITE_AI_KEY as string) || localStorage.getItem('cf_gemini_api_key') || ''
  const effectiveUserId = authUser?.id || 'cf_guest_developer'
  const effectiveDisplayName = authUser?.login || authUser?.name || 'developer'

  const [messages, setMessages] = useState<AIMessage[]>(() => {
    try {
      const saved = localStorage.getItem(`cf_ai_chat_${effectiveUserId}`)
      if (saved) return JSON.parse(saved)
    } catch {}
    return [
      {
        id: 'welcome',
        role: 'assistant',
        content: `### ✦ CodeForge AI Online\n\nWelcome **@${effectiveDisplayName}**! I'm your pair programming assistant powered by **CodeForge AI**.\n\nI have active context of \`${curTab.name || 'main.py'}\`. How can I assist you today?\n\n- **Fix Bugs:** Automatically pinpoint syntax and runtime issues\n- **Deep Code Review:** High-standard architectural and Big-O assessment\n- **Optimize Execution:** Speed, algorithmic complexity, and memory efficiency\n- **Generate Unit Tests:** Comprehensive edge cases and test runners`,
        timestamp: Date.now(),
      },
    ]
  })

  const [inputPrompt, setInputPrompt] = useState('')
  const [isThinking, setIsThinking] = useState(false)
  const [copiedCodeIdx, setCopiedCodeIdx] = useState<string | null>(null)
  const [activeTabContext, setActiveTabContext] = useState(true)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  // Reload chats when user changes
  useEffect(() => {
    try {
      const saved = localStorage.getItem(`cf_ai_chat_${effectiveUserId}`)
      if (saved) {
        setMessages(JSON.parse(saved))
        return
      }
    } catch {}
    setMessages([
      {
        id: 'welcome',
        role: 'assistant',
        content: `### ✦ CodeForge AI Online\n\nWelcome **@${effectiveDisplayName}**! I'm your pair programming assistant powered by **CodeForge AI**.\n\nI have active context of \`${curTab.name || 'main.py'}\`. How can I assist you today?\n\n- **Fix Bugs:** Automatically pinpoint syntax and runtime issues\n- **Deep Code Review:** High-standard architectural and Big-O assessment\n- **Optimize Execution:** Speed, algorithmic complexity, and memory efficiency\n- **Generate Unit Tests:** Comprehensive edge cases and test runners`,
        timestamp: Date.now(),
      },
    ])
  }, [effectiveUserId, effectiveDisplayName])

  // Persist messages
  useEffect(() => {
    if (messages.length > 0) {
      try {
        localStorage.setItem(`cf_ai_chat_${effectiveUserId}`, JSON.stringify(messages))
      } catch {}
    }
  }, [messages, effectiveUserId])

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isThinking])

  const isQuotaExceeded = !isPro && aiUsage >= maxFreeAI
  const remainingQueries = isPro ? 'Unlimited' : Math.max(0, maxFreeAI - aiUsage)

  // Direct backend / Gemini API caller
  const callGeminiAPI = async (
    prompt: string,
    code: string,
    lang: string,
    history: { role: string; content: string }[]
  ) => {
    // 1. Try server proxy first (reliable, key kept on backend)
    try {
      const controller = new AbortController()
      const timer = setTimeout(() => controller.abort(), 35000)
      const srvRes = await fetch('/api/ai/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, code, lang, history }),
        signal: controller.signal,
      }).finally(() => clearTimeout(timer))

      if (srvRes.ok) {
        const srvData = await srvRes.json()
        if (srvData.ok && srvData.text) {
          return srvData.text
        }
      }
    } catch (e) {
      console.warn('Backend /api/ai/gemini fetch error:', e)
    }

    // 2. Direct browser fetch to Google Generative AI
    const key = geminiApiKey.trim() || (import.meta.env.VITE_AI_KEY as string) || ''
    if (!key) throw new Error('No Gemini key')

    const userPrompt = code.trim()
      ? `Active Context (${lang || 'code'} - ${curTab.name}):\n\`\`\`${lang || 'text'}\n${code}\n\`\`\`\n\nPrompt: ${prompt}`
      : prompt

    const systemInstructionText =
      'You are CodeForge AI, an elite senior software architect and full-stack programmer acting with the depth and helpfulness of Google Gemini and ChatGPT. When asked for code, especially web development (HTML, CSS, JS), always provide COMPLETE code for all 3 technologies (HTML, CSS, JS) without placeholders or omissions, plus an all-in-one index.html runnable version, followed by a friendly explanation.'

    const contents: any[] = []
    if (Array.isArray(history) && history.length > 0) {
      let lastRole = ''
      for (const msg of history.slice(-6)) {
        const role = msg.role === 'assistant' ? 'model' : 'user'
        if (role !== lastRole && msg.content && typeof msg.content === 'string' && msg.content.trim()) {
          contents.push({ role, parts: [{ text: msg.content.trim() }] })
          lastRole = role
        }
      }
    }

    if (contents.length > 0 && contents[contents.length - 1].role === 'user') {
      contents[contents.length - 1].parts[0].text += `\n\n${userPrompt}`
    } else {
      contents.push({ role: 'user', parts: [{ text: userPrompt }] })
    }

    const candidateModels = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash']
    let lastErr = ''

    for (const model of candidateModels) {
      try {
        const geminiRes = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(key)}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              systemInstruction: { parts: [{ text: systemInstructionText }] },
              contents,
              generationConfig: {
                temperature: 0.3,
                maxOutputTokens: 8192,
                thinkingConfig: { thinkingBudget: 0 },
              },
            }),
          }
        )

        if (geminiRes.ok) {
          const json = await geminiRes.json()
          const text =
            json.candidates?.[0]?.content?.parts?.map((p: any) => p.text || '').join('') || ''
          if (text.trim()) return text
        } else {
          const errData = await geminiRes.json().catch(() => ({}))
          lastErr = errData.error?.message || `HTTP ${geminiRes.status}`
        }
      } catch (e: any) {
        lastErr = e.message
      }
    }

    throw new Error(lastErr || 'Gemini response unavailable')
  }

  const handleSendMessage = async (customPrompt?: string) => {
    const raw = (customPrompt || inputPrompt).trim()
    if (!raw || isThinking) return

    if (isQuotaExceeded) {
      onUpgradePro()
      return
    }

    if (!isPro) {
      setAiUsage(prev => prev + 1)
      try {
        const curCount = parseInt(localStorage.getItem(`cf_ai_usage_${effectiveUserId}`) || '0')
        localStorage.setItem(`cf_ai_usage_${effectiveUserId}`, String(curCount + 1))
      } catch {}
    }

    const activeCode = activeTabContext ? getActiveCode() : ''
    const userMsg: AIMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: raw,
      timestamp: Date.now(),
    }

    setInputPrompt('')
    const updatedMessages = [...messages, userMsg]
    setMessages(updatedMessages)
    setIsThinking(true)

    try {
      const historyContext = updatedMessages.map(m => ({ role: m.role, content: m.content }))
      let reply = ''
      let isLiveGemini = false

      try {
        reply = await callGeminiAPI(raw, activeCode, curTab.lang, historyContext)
        isLiveGemini = true
      } catch (geminiErr: any) {
        console.warn('callGeminiAPI failed, falling back to askAI engine:', geminiErr)
        reply = await askAI(raw, activeCode, curTab.lang, historyContext)
      }

      const assistantMsg: AIMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: reply,
        timestamp: Date.now(),
        isGemini: isLiveGemini,
      }

      setMessages(prev => [...prev, assistantMsg])
    } catch (err: any) {
      const errorMsg: AIMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: `⚠️ Failed to get AI response: ${err?.message || 'Please check your connection and try again.'}`,
        timestamp: Date.now(),
      }
      setMessages(prev => [...prev, errorMsg])
    } finally {
      setIsThinking(false)
    }
  }

  const handleCopyCode = (text: string, id: string) => {
    navigator.clipboard.writeText(text).catch(() => {})
    setCopiedCodeIdx(id)
    setTimeout(() => setCopiedCodeIdx(null), 2000)
    showToast('Code copied to clipboard! 📋')
  }

  const handleClearChat = () => {
    const welcome: AIMessage = {
      id: crypto.randomUUID(),
      role: 'assistant',
      content: `### ✦ Chat Cleared\n\nActive context refreshed for \`${curTab.name || 'code'}\`. What would you like to build or inspect?`,
      timestamp: Date.now(),
    }
    setMessages([welcome])
    localStorage.removeItem(`cf_ai_chat_${effectiveUserId}`)
    showToast('Chat history cleared')
  }

  // Render message markdown & theme-aligned code blocks
  const renderMessageContent = (text: string, msgId: string) => {
    const parts = text.split(/(```[\s\S]*?```)/g)

    return (
      <div style={{ lineHeight: 1.6, fontSize: 12.5, color: 'var(--text-base)' }}>
        {parts.map((part, idx) => {
          if (part.startsWith('```') && part.endsWith('```')) {
            const rawContent = part.slice(3, -3)
            const firstNewline = rawContent.indexOf('\n')
            const lang = firstNewline !== -1 ? rawContent.substring(0, firstNewline).trim() : ''
            const codeBlock = firstNewline !== -1 ? rawContent.substring(firstNewline + 1) : rawContent
            const blockKey = `${msgId}_code_${idx}`
            const lineCount = codeBlock.trim().split('\n').length

            return (
              <div
                key={blockKey}
                className="ai-code-block"
                style={{
                  margin: '10px 0',
                  borderRadius: 8,
                  border: '1px solid var(--border)',
                  overflow: 'hidden',
                  background: 'var(--bg-app)',
                  boxShadow: '0 4px 16px rgba(0, 0, 0, 0.15)',
                }}
              >
                {/* Code Block Header */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '6px 12px',
                    background: 'var(--bg-card)',
                    borderBottom: '1px solid var(--border)',
                    fontSize: 11,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ display: 'flex', gap: 5 }}>
                      <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#ef4444', opacity: 0.75 }} />
                      <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#f59e0b', opacity: 0.75 }} />
                      <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#22c55e', opacity: 0.75 }} />
                    </div>
                    <span style={{ fontWeight: 600, color: 'var(--accent)', textTransform: 'lowercase', fontFamily: 'JetBrains Mono, monospace' }}>
                      {lang || curTab.lang || 'code'}
                    </span>
                    <span style={{ color: 'var(--text-muted)', fontSize: 10 }}>• {lineCount} lines</span>
                  </div>

                  <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                    <button
                      onClick={() => handleCopyCode(codeBlock, blockKey)}
                      style={{
                        background: 'var(--bg-hover)',
                        border: '1px solid var(--border)',
                        borderRadius: 4,
                        cursor: 'pointer',
                        color: copiedCodeIdx === blockKey ? 'var(--green, #22c55e)' : 'var(--text-base)',
                        fontSize: 10,
                        padding: '3px 8px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                        transition: 'all 0.15s ease',
                      }}
                      title="Copy code"
                    >
                      {copiedCodeIdx === blockKey ? <CheckIcon size={11} /> : <CopyIcon size={11} />}
                      <span>{copiedCodeIdx === blockKey ? 'Copied' : 'Copy'}</span>
                    </button>

                    {onInsertCodeToEditor && (
                      <button
                        onClick={() => {
                          onInsertCodeToEditor(codeBlock)
                          showToast(`Inserted into ${curTab.name} ⚡`)
                        }}
                        style={{
                          background: 'var(--accent-subtle)',
                          border: '1px solid var(--accent-border)',
                          borderRadius: 4,
                          cursor: 'pointer',
                          color: 'var(--accent)',
                          fontSize: 10,
                          fontWeight: 600,
                          padding: '3px 9px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 4,
                          transition: 'all 0.15s ease',
                        }}
                        title="Insert into active editor"
                      >
                        <span>⚡ Insert</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Pre / Code Area */}
                <pre
                  style={{
                    padding: '10px 14px',
                    margin: 0,
                    fontSize: 11.5,
                    fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                    overflowX: 'auto',
                    color: 'var(--text-base)',
                    lineHeight: 1.55,
                  }}
                >
                  <code>{codeBlock}</code>
                </pre>
              </div>
            )
          }

          // Markdown lines
          const lines = part.split('\n')
          return (
            <div key={idx} style={{ marginBottom: 6 }}>
              {lines.map((line, lIdx) => {
                // Heading 3 / Section
                if (line.startsWith('### ')) {
                  return (
                    <div
                      key={lIdx}
                      style={{
                        fontSize: 13,
                        fontWeight: 700,
                        color: 'var(--text-base)',
                        marginTop: 10,
                        marginBottom: 6,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                      }}
                    >
                      <span style={{ width: 3, height: 13, background: 'var(--accent)', borderRadius: 2 }} />
                      <span>{line.replace('### ', '')}</span>
                    </div>
                  )
                }

                // Blockquote
                if (line.startsWith('> ')) {
                  return (
                    <div
                      key={lIdx}
                      style={{
                        borderLeft: '2px solid var(--accent)',
                        padding: '4px 10px',
                        margin: '6px 0',
                        color: 'var(--text-muted)',
                        fontSize: 11.5,
                        background: 'var(--accent-subtle)',
                        borderRadius: '0 6px 6px 0',
                      }}
                    >
                      {line.replace('> ', '')}
                    </div>
                  )
                }

                // Bullet points
                const isBullet = line.trim().startsWith('- ') || line.trim().startsWith('* ')
                const cleanLine = isBullet ? line.trim().substring(2) : line

                const inlineParts = cleanLine.split(/(`[^`]+`)/g)
                return (
                  <div
                    key={lIdx}
                    style={{
                      minHeight: line.trim() ? undefined : '0.5em',
                      display: isBullet ? 'flex' : 'block',
                      alignItems: 'baseline',
                      gap: 6,
                      marginBottom: 3,
                    }}
                  >
                    {isBullet && (
                      <span style={{ color: 'var(--accent)', fontSize: 10, flexShrink: 0 }}>✦</span>
                    )}
                    <div>
                      {inlineParts.map((sub, sIdx) => {
                        if (sub.startsWith('`') && sub.endsWith('`')) {
                          return (
                            <code
                              key={sIdx}
                              style={{
                                fontFamily: "'JetBrains Mono', monospace",
                                fontSize: '0.88em',
                                background: 'var(--bg-hover)',
                                padding: '1px 6px',
                                borderRadius: 4,
                                border: '1px solid var(--border)',
                                color: 'var(--accent)',
                              }}
                            >
                              {sub.slice(1, -1)}
                            </code>
                          )
                        }
                        const boldParts = sub.split(/(\*\*[^*]+\*\*)/g)
                        return (
                          <span key={sIdx}>
                            {boldParts.map((bp, bIdx) =>
                              bp.startsWith('**') ? (
                                <strong key={bIdx} style={{ color: 'var(--text-base)', fontWeight: 600 }}>
                                  {bp.slice(2, -2)}
                                </strong>
                              ) : (
                                <span key={bIdx}>{bp}</span>
                              )
                            )}
                          </span>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
          )
        })}
      </div>
    )
  }

  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        overflow: 'hidden',
        background: 'var(--bg-panel)',
        color: 'var(--text-base)',
        position: 'relative',
      }}
    >
      {/* ── Top Header: CodeForge AI Branding ───────────────── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 14px',
          borderBottom: '1px solid var(--border)',
          background: 'var(--bg-header)',
          flexShrink: 0,
          gap: 8,
          zIndex: 10,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
          {/* CodeForge Logo Image */}
          <div
            className="ai-glow-orb"
            style={{
              width: 30,
              height: 30,
              borderRadius: 6,
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              display: 'grid',
              placeItems: 'center',
              flexShrink: 0,
              padding: 4,
            }}
          >
            <img
              src={logoImg}
              alt="CodeForge AI"
              style={{ width: '100%', height: '100%', objectFit: 'contain' }}
            />
          </div>

          <div style={{ minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 13, fontWeight: 700, letterSpacing: '0.01em', color: 'var(--text-base)' }}>
                CodeForge AI
              </span>
              <span
                style={{
                  fontSize: 9,
                  fontWeight: 700,
                  padding: '1px 6px',
                  borderRadius: 999,
                  background: isPro
                    ? 'var(--accent-subtle)'
                    : isQuotaExceeded
                    ? 'rgba(239, 68, 68, 0.15)'
                    : 'var(--bg-hover)',
                  color: isPro ? 'var(--accent)' : isQuotaExceeded ? '#ef4444' : 'var(--text-muted)',
                  border: `1px solid ${
                    isPro
                      ? 'var(--accent-border)'
                      : isQuotaExceeded
                      ? 'rgba(239, 68, 68, 0.3)'
                      : 'var(--border)'
                  }`,
                }}
              >
                {isPro ? '✦ PRO' : `${aiUsage}/${maxFreeAI}`}
              </span>
            </div>

            <div style={{ fontSize: 10, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6, marginTop: 1 }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <span
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    background: '#22c55e',
                    boxShadow: '0 0 6px rgba(34, 197, 94, 0.6)',
                  }}
                />
                <span style={{ color: 'var(--accent)', fontWeight: 600 }}>Gemini 3.8 Flash</span>
              </span>
              <span>•</span>
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                @{effectiveDisplayName}
              </span>
              {!authUser && (
                <button
                  onClick={onOpenGitHubAuth}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--accent)',
                    cursor: 'pointer',
                    fontSize: 10,
                    textDecoration: 'underline',
                    padding: 0,
                  }}
                >
                  (Sync GitHub)
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Right Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0 }}>
          <button
            onClick={handleClearChat}
            title="Reset Conversation"
            style={{
              padding: '5px 8px',
              borderRadius: 6,
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              fontSize: 11,
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.color = 'var(--text-base)'
              e.currentTarget.style.background = 'var(--bg-hover)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.color = 'var(--text-muted)'
              e.currentTarget.style.background = 'var(--bg-card)'
            }}
          >
            <TrashIcon size={12} />
          </button>

          <button
            onClick={onClose}
            title="Close CodeForge AI"
            style={{
              padding: '5px 8px',
              borderRadius: 6,
              background: 'none',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              display: 'grid',
              placeItems: 'center',
              transition: 'color 0.15s ease',
            }}
            onMouseEnter={e => (e.currentTarget.style.color = 'var(--text-base)')}
            onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}
          >
            <XIcon size={13} />
          </button>
        </div>
      </div>

      {/* ── Quota Alert Banner ──────────────────────────────────────────────── */}
      {isQuotaExceeded && (
        <div
          style={{
            padding: '8px 14px',
            background: 'rgba(239, 68, 68, 0.12)',
            borderBottom: '1px solid rgba(239, 68, 68, 0.25)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: 11.5,
            color: '#ef4444',
          }}
        >
          <span>Free quota reached ({maxFreeAI}/{maxFreeAI}). Upgrade for unlimited requests.</span>
          <button
            onClick={onUpgradePro}
            style={{
              padding: '3px 9px',
              borderRadius: 5,
              background: '#ef4444',
              border: 'none',
              color: '#ffffff',
              fontSize: 10,
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            Upgrade Pro 🚀
          </button>
        </div>
      )}

      {/* ── Quick Action Command Bar ────────────────────────────────────────── */}
      <div
        style={{
          display: 'flex',
          gap: 6,
          padding: '7px 12px',
          borderBottom: '1px solid var(--border)',
          background: 'var(--bg-app)',
          overflowX: 'auto',
          flexShrink: 0,
        }}
      >
        {[
          { label: '/fix', desc: 'Fix Bugs', icon: <BugIcon size={12} />, prompt: `Analyze and fix all errors, syntax bugs, and runtime exceptions in ${curTab.name}. Provide the complete corrected code.` },
          { label: '/review', desc: 'Review Code', icon: <ReviewIcon size={12} />, prompt: `Perform a thorough, senior-level code review of ${curTab.name}. Evaluate code quality, logic errors, architectural patterns, and performance.` },
          { label: '/optimize', desc: 'Optimize Big-O', icon: <span>⚡</span>, prompt: `Optimize the algorithmic Time and Space complexity of ${curTab.name}. State Big-O before and after, with a complete optimized implementation.` },
          { label: '/tests', desc: 'Write Tests', icon: <span>🧪</span>, prompt: `Write comprehensive unit tests with edge cases and happy paths for ${curTab.name}.` },
          { label: '/explain', desc: 'Deep Dive', icon: <span>💡</span>, prompt: `Explain step-by-step how ${curTab.name} works, its control flow, and edge cases in clear detail.` },
        ].map(item => (
          <button
            key={item.label}
            className="ai-quick-chip"
            disabled={isThinking || isQuotaExceeded}
            onClick={() => handleSendMessage(item.prompt)}
            style={{
              padding: '4px 9px',
              borderRadius: 6,
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              color: 'var(--text-base)',
              fontSize: 11,
              fontWeight: 500,
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              whiteSpace: 'nowrap',
              cursor: isThinking || isQuotaExceeded ? 'not-allowed' : 'pointer',
              flexShrink: 0,
            }}
          >
            <span style={{ color: 'var(--accent)' }}>{item.icon}</span>
            <span>{item.desc}</span>
          </button>
        ))}
      </div>

      {/* ── Chat Messages Stream ───────────────────────────────────────────── */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '14px 16px',
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
          background: 'var(--bg-app)',
        }}
      >
        {messages.map(msg => {
          const isUser = msg.role === 'user'
          return (
            <div
              key={msg.id}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: isUser ? 'flex-end' : 'flex-start',
                width: '100%',
              }}
            >
              {/* Message Header (Logo/Badge + Timestamp) */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  fontSize: 10.5,
                  color: 'var(--text-dim)',
                  marginBottom: 4,
                  padding: '0 4px',
                }}
              >
                {!isUser ? (
                  <>
                    <img
                      src={logoImg}
                      alt="CodeForge AI"
                      style={{ width: 13, height: 13, objectFit: 'contain' }}
                    />
                    <span style={{ fontWeight: 600, color: 'var(--accent)' }}>
                      CodeForge AI
                    </span>
                  </>
                ) : (
                  <span style={{ fontWeight: 600, color: 'var(--text-muted)' }}>@{effectiveDisplayName}</span>
                )}
                <span>•</span>
                <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </div>

              {/* Message Bubble Card */}
              <div
                style={{
                  maxWidth: isUser ? '88%' : '100%',
                  width: isUser ? 'auto' : '100%',
                  padding: isUser ? '10px 14px' : '12px 14px',
                  borderRadius: isUser ? '14px 14px 2px 14px' : '10px',
                  background: isUser ? 'var(--accent-subtle)' : 'var(--bg-card)',
                  border: isUser ? '1px solid var(--accent-border)' : '1px solid var(--border)',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
                }}
              >
                {renderMessageContent(msg.content, msg.id)}
              </div>
            </div>
          )
        })}

        {/* Thinking / Synthesizing State */}
        {isThinking && (
          <div
            style={{
              padding: '12px 14px',
              borderRadius: 10,
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
            }}
          >
            <SpinnerIcon size={16} className="text-sky-400" />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--accent)', display: 'flex', alignItems: 'center', gap: 6 }}>
                <span>Synthesizing code solution...</span>
              </div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                Analyzing context in {curTab.name} • Gemini 3.8 Flash
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* ── Composer Box ──────────────────────────────────────────────────── */}
      <div
        style={{
          padding: '10px 14px 14px',
          borderTop: '1px solid var(--border)',
          background: 'var(--bg-header)',
          flexShrink: 0,
        }}
      >
        <div
          className="ai-composer-box"
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: 10,
            padding: '10px 12px',
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
          }}
        >
          {/* Active Context Chip Bar */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 11 }}>
            <button
              onClick={() => setActiveTabContext(p => !p)}
              style={{
                background: activeTabContext ? 'var(--accent-subtle)' : 'var(--bg-hover)',
                border: `1px solid ${activeTabContext ? 'var(--accent-border)' : 'var(--border)'}`,
                borderRadius: 5,
                color: activeTabContext ? 'var(--accent)' : 'var(--text-muted)',
                padding: '2px 8px',
                fontSize: 10.5,
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                cursor: 'pointer',
              }}
              title="Toggle active file context"
            >
              <span>📄 #{curTab.name || 'main.py'}</span>
              <span style={{ fontSize: 9, opacity: 0.8 }}>({activeTabContext ? 'Active' : 'Muted'})</span>
            </button>

            <span style={{ fontSize: 10, color: 'var(--text-dim)' }}>
              {remainingQueries} queries left
            </span>
          </div>

          {/* Smooth Textarea */}
          <textarea
            ref={inputRef}
            rows={2}
            value={inputPrompt}
            placeholder={
              isQuotaExceeded
                ? 'Monthly quota reached. Upgrade to Pro...'
                : 'Ask CodeForge AI anything, /fix, /optimize, /explain...'
            }
            disabled={isQuotaExceeded}
            onChange={e => setInputPrompt(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                handleSendMessage()
              }
            }}
            style={{
              width: '100%',
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: 'var(--text-base)',
              fontSize: 12.5,
              fontFamily: 'inherit',
              lineHeight: 1.5,
              resize: 'none',
              padding: 0,
            }}
          />

          {/* Composer Footer Actions */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 4 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 10, color: 'var(--text-dim)' }}>
              <span style={{ padding: '1px 5px', borderRadius: 4, background: 'var(--bg-hover)', border: '1px solid var(--border)' }}>
                ↵ Enter to send
              </span>
              <span style={{ padding: '1px 5px', borderRadius: 4, background: 'var(--bg-hover)', border: '1px solid var(--border)' }}>
                Shift+↵ New line
              </span>
            </div>

            <button
              disabled={!inputPrompt.trim() || isThinking || isQuotaExceeded}
              onClick={() => handleSendMessage()}
              style={{
                width: 32,
                height: 32,
                borderRadius: '50%',
                background:
                  inputPrompt.trim() && !isThinking && !isQuotaExceeded
                    ? 'var(--accent)'
                    : 'var(--bg-hover)',
                color: inputPrompt.trim() && !isThinking && !isQuotaExceeded ? '#ffffff' : 'var(--text-dim)',
                border: 'none',
                cursor: inputPrompt.trim() && !isThinking && !isQuotaExceeded ? 'pointer' : 'not-allowed',
                display: 'grid',
                placeItems: 'center',
                boxShadow:
                  inputPrompt.trim() && !isThinking && !isQuotaExceeded
                    ? '0 0 10px var(--accent-subtle)'
                    : 'none',
                transition: 'all 0.15s ease',
              }}
              title="Send to CodeForge AI"
            >
              <SendIcon size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

import React, { useState, useEffect, useRef } from 'react'
import type { AuthUser } from '../lib/storage'
import { askAI } from '../engine/ai'
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

// Antigravity & Copilot Modern AI Icon
const AntigravitySparkleIcon = ({ size = 18 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path
      d="M12 2L14.4 9.6L22 12L14.4 14.4L12 22L9.6 14.4L2 12L9.6 9.6L12 2Z"
      fill="url(#ag-grad-primary)"
    />
    <path
      d="M19 3L20.2 6.8L24 8L20.2 9.2L19 13L17.8 9.2L14 8L17.8 6.8L19 3Z"
      fill="url(#ag-grad-secondary)"
      opacity="0.85"
    />
    <defs>
      <linearGradient id="ag-grad-primary" x1="2" y1="2" x2="22" y2="22" gradientUnits="userSpaceOnUse">
        <stop stopColor="#38bdf8" />
        <stop offset="0.5" stopColor="#818cf8" />
        <stop offset="1" stopColor="#c084fc" />
      </linearGradient>
      <linearGradient id="ag-grad-secondary" x1="14" y1="3" x2="24" y2="13" gradientUnits="userSpaceOnUse">
        <stop stopColor="#38bdf8" />
        <stop offset="1" stopColor="#f472b6" />
      </linearGradient>
    </defs>
  </svg>
)

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
        content: `### ✦ Antigravity Copilot Online\n\nWelcome **@${effectiveDisplayName}**! I'm your pair programming assistant powered by **Google Gemini 3.8 Flash**.\n\nI have active context of \`${curTab.name || 'main.py'}\`. How can I assist you today?\n\n- **Fix Bugs:** Automatically pinpoint syntax and runtime issues\n- **Deep Code Review:** High-standard architectural and Big-O assessment\n- **Optimize Execution:** Speed, algorithmic complexity, and memory efficiency\n- **Generate Unit Tests:** Comprehensive edge cases and test runners`,
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
        content: `### ✦ Antigravity Copilot Online\n\nWelcome **@${effectiveDisplayName}**! I'm your pair programming assistant powered by **Google Gemini 3.8 Flash**.\n\nI have active context of \`${curTab.name || 'main.py'}\`. How can I assist you today?\n\n- **Fix Bugs:** Automatically pinpoint syntax and runtime issues\n- **Deep Code Review:** High-standard architectural and Big-O assessment\n- **Optimize Execution:** Speed, algorithmic complexity, and memory efficiency\n- **Generate Unit Tests:** Comprehensive edge cases and test runners`,
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
    try {
      const srvRes = await fetch('/api/ai/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, code, lang, history }),
      })
      if (srvRes.ok) {
        const srvData = await srvRes.json()
        if (srvData.ok && srvData.text) {
          return srvData.text
        }
      }
    } catch {}

    const key = geminiApiKey.trim() || (import.meta.env.VITE_AI_KEY as string) || ''
    if (!key) throw new Error('No Gemini key')

    const userPrompt = code.trim()
      ? `Active Context (${lang || 'code'} - ${curTab.name}):\n\`\`\`${lang || 'text'}\n${code}\n\`\`\`\n\nPrompt: ${prompt}`
      : prompt

    const contents = [
      {
        role: 'user',
        parts: [
          {
            text: 'You are CodeForge Copilot, an elite senior software architect and AI pair programmer. Provide high-quality, production-ready code in fenced markdown blocks with language tags, followed by concise explanations, Big-O complexity analysis, and edge cases.',
          },
        ],
      },
      ...history.slice(-6).map(m => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }],
      })),
      {
        role: 'user',
        parts: [{ text: userPrompt }],
      },
    ]

    const candidateModels = ['gemini-3.8-flash', 'gemini-2.5-flash', 'gemini-2.5-pro']
    let lastErr = ''

    for (const model of candidateModels) {
      try {
        const geminiRes = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(key)}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents,
              generationConfig: { temperature: 0.2, maxOutputTokens: 3000 },
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

      if (geminiApiKey.trim()) {
        try {
          reply = await callGeminiAPI(raw, activeCode, curTab.lang, historyContext)
          isLiveGemini = true
        } catch {
          reply = await askAI(raw, activeCode, curTab.lang, historyContext)
        }
      } else {
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

  // Render message markdown & VS Code Copilot style code blocks
  const renderMessageContent = (text: string, msgId: string) => {
    const parts = text.split(/(```[\s\S]*?```)/g)

    return (
      <div style={{ lineHeight: 1.6, fontSize: 12.5, color: '#e2e8f0' }}>
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
                  borderRadius: 10,
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  overflow: 'hidden',
                  background: '#070a12',
                  boxShadow: '0 8px 24px rgba(0, 0, 0, 0.45)',
                }}
              >
                {/* Code Block Header (Mac/VS Code style) */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '6px 12px',
                    background: 'rgba(255, 255, 255, 0.03)',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.07)',
                    fontSize: 11,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ display: 'flex', gap: 5 }}>
                      <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'rgba(239, 68, 68, 0.6)' }} />
                      <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'rgba(245, 158, 11, 0.6)' }} />
                      <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'rgba(34, 197, 94, 0.6)' }} />
                    </div>
                    <span style={{ fontWeight: 600, color: '#38bdf8', textTransform: 'lowercase', fontFamily: 'JetBrains Mono, monospace' }}>
                      {lang || curTab.lang || 'code'}
                    </span>
                    <span style={{ color: '#64748b', fontSize: 10 }}>• {lineCount} lines</span>
                  </div>

                  <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                    <button
                      onClick={() => handleCopyCode(codeBlock, blockKey)}
                      style={{
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: 5,
                        cursor: 'pointer',
                        color: copiedCodeIdx === blockKey ? '#34d399' : '#cbd5e1',
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
                          background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.2) 0%, rgba(129, 140, 248, 0.25) 100%)',
                          border: '1px solid rgba(56, 189, 248, 0.4)',
                          borderRadius: 5,
                          cursor: 'pointer',
                          color: '#38bdf8',
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
                    color: '#e2e8f0',
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
                        color: '#f8fafc',
                        marginTop: 10,
                        marginBottom: 6,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                      }}
                    >
                      <span style={{ width: 3, height: 13, background: '#38bdf8', borderRadius: 2 }} />
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
                        borderLeft: '2px solid #818cf8',
                        padding: '4px 10px',
                        margin: '6px 0',
                        color: '#94a3b8',
                        fontSize: 11.5,
                        background: 'rgba(129, 140, 248, 0.06)',
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
                      <span style={{ color: '#38bdf8', fontSize: 10, flexShrink: 0 }}>✦</span>
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
                                background: 'rgba(255, 255, 255, 0.08)',
                                padding: '1px 6px',
                                borderRadius: 4,
                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                color: '#38bdf8',
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
                                <strong key={bIdx} style={{ color: '#f1f5f9', fontWeight: 600 }}>
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
        background: '#090d16',
        position: 'relative',
        backgroundImage:
          'radial-gradient(ellipse at 85% 10%, rgba(56, 189, 248, 0.06), transparent 50%), radial-gradient(ellipse at 15% 85%, rgba(168, 85, 247, 0.05), transparent 50%)',
      }}
    >
      {/* ── Top Header: Google Antigravity & Copilot Branding ───────────────── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 14px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          background: 'rgba(13, 17, 23, 0.85)',
          backdropFilter: 'blur(16px)',
          flexShrink: 0,
          gap: 8,
          zIndex: 10,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
          {/* Glowing Orb Sparkle */}
          <div
            className="ai-glow-orb"
            style={{
              width: 30,
              height: 30,
              borderRadius: 8,
              background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.15) 0%, rgba(168, 85, 247, 0.2) 100%)',
              border: '1px solid rgba(56, 189, 248, 0.4)',
              display: 'grid',
              placeItems: 'center',
              flexShrink: 0,
            }}
          >
            <AntigravitySparkleIcon size={16} />
          </div>

          <div style={{ minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span className="ai-gradient-text" style={{ fontSize: 13, fontWeight: 700, letterSpacing: '0.01em' }}>
                CodeForge Copilot
              </span>
              <span
                style={{
                  fontSize: 9,
                  fontWeight: 700,
                  padding: '1px 6px',
                  borderRadius: 999,
                  background: isPro
                    ? 'linear-gradient(135deg, rgba(168, 85, 247, 0.2), rgba(236, 72, 153, 0.2))'
                    : isQuotaExceeded
                    ? 'rgba(239, 68, 68, 0.15)'
                    : 'rgba(56, 189, 248, 0.12)',
                  color: isPro ? '#c084fc' : isQuotaExceeded ? '#f87171' : '#38bdf8',
                  border: `1px solid ${
                    isPro
                      ? 'rgba(168, 85, 247, 0.4)'
                      : isQuotaExceeded
                      ? 'rgba(239, 68, 68, 0.3)'
                      : 'rgba(56, 189, 248, 0.3)'
                  }`,
                }}
              >
                {isPro ? '✦ PRO' : `${aiUsage}/${maxFreeAI}`}
              </span>
            </div>

            <div style={{ fontSize: 10, color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 6, marginTop: 1 }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <span
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    background: '#34d399',
                    boxShadow: '0 0 6px #34d399',
                  }}
                />
                <span style={{ color: '#38bdf8', fontWeight: 600 }}>Gemini 3.8 Flash</span>
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
                    color: '#818cf8',
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
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              color: '#94a3b8',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              fontSize: 11,
              transition: 'all 0.15s ease',
            }}
          >
            <TrashIcon size={12} />
          </button>

          <button
            onClick={onClose}
            title="Close Copilot Panel"
            style={{
              padding: '5px 8px',
              borderRadius: 6,
              background: 'none',
              border: 'none',
              color: '#94a3b8',
              cursor: 'pointer',
              display: 'grid',
              placeItems: 'center',
            }}
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
            background: 'linear-gradient(90deg, rgba(239, 68, 68, 0.15) 0%, rgba(220, 38, 38, 0.2) 100%)',
            borderBottom: '1px solid rgba(239, 68, 68, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: 11.5,
            color: '#fca5a5',
          }}
        >
          <span>Free quota reached ({maxFreeAI}/{maxFreeAI}). Upgrade for unlimited requests.</span>
          <button
            onClick={onUpgradePro}
            style={{
              padding: '3px 9px',
              borderRadius: 5,
              background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
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

      {/* ── Copilot Quick Action Command Bar ───────────────────────────────── */}
      <div
        style={{
          display: 'flex',
          gap: 6,
          padding: '7px 12px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
          background: 'rgba(0, 0, 0, 0.25)',
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
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              color: '#cbd5e1',
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
            <span style={{ color: '#38bdf8' }}>{item.icon}</span>
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
              {/* Message Header (Badge + Timestamp) */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  fontSize: 10.5,
                  color: '#64748b',
                  marginBottom: 4,
                  padding: '0 4px',
                }}
              >
                {!isUser ? (
                  <>
                    <AntigravitySparkleIcon size={13} />
                    <span style={{ fontWeight: 600, color: '#38bdf8' }}>
                      Antigravity Copilot
                    </span>
                  </>
                ) : (
                  <span style={{ fontWeight: 600, color: '#94a3b8' }}>@{effectiveDisplayName}</span>
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
                  background: isUser
                    ? 'linear-gradient(135deg, rgba(30, 41, 59, 0.9) 0%, rgba(15, 23, 42, 0.95) 100%)'
                    : 'rgba(15, 23, 42, 0.55)',
                  border: isUser
                    ? '1px solid rgba(56, 189, 248, 0.35)'
                    : '1px solid rgba(255, 255, 255, 0.07)',
                  boxShadow: isUser
                    ? '0 4px 14px rgba(0, 0, 0, 0.35)'
                    : '0 4px 20px rgba(0, 0, 0, 0.25)',
                }}
              >
                {renderMessageContent(msg.content, msg.id)}
              </div>
            </div>
          )
        })}

        {/* Thinking / Synthesizing State (Google Antigravity & Copilot style) */}
        {isThinking && (
          <div
            style={{
              padding: '12px 14px',
              borderRadius: 10,
              background: 'rgba(15, 23, 42, 0.65)',
              border: '1px solid rgba(56, 189, 248, 0.2)',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
            }}
          >
            <SpinnerIcon size={16} className="text-sky-400" />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#38bdf8', display: 'flex', alignItems: 'center', gap: 6 }}>
                <span>Synthesizing code solution...</span>
              </div>
              <div style={{ fontSize: 10, color: '#94a3b8' }}>
                Analyzing context in {curTab.name} • Gemini 3.8 Flash
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* ── Floating Modern Composer Box (Cursor / Copilot style) ─────────────── */}
      <div
        style={{
          padding: '10px 14px 14px',
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          background: 'rgba(13, 17, 23, 0.85)',
          backdropFilter: 'blur(16px)',
          flexShrink: 0,
        }}
      >
        <div
          className="ai-composer-box"
          style={{
            background: 'rgba(15, 23, 42, 0.95)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            borderRadius: 12,
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
                background: activeTabContext ? 'rgba(56, 189, 248, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                border: `1px solid ${activeTabContext ? 'rgba(56, 189, 248, 0.4)' : 'rgba(255, 255, 255, 0.1)'}`,
                borderRadius: 6,
                color: activeTabContext ? '#38bdf8' : '#94a3b8',
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

            <span style={{ fontSize: 10, color: '#64748b' }}>
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
                : 'Ask Copilot anything, /fix, /optimize, /explain...'
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
              color: '#f8fafc',
              fontSize: 12.5,
              fontFamily: 'inherit',
              lineHeight: 1.5,
              resize: 'none',
              padding: 0,
            }}
          />

          {/* Composer Footer Actions */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 4 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 10, color: '#64748b' }}>
              <span style={{ padding: '1px 5px', borderRadius: 4, background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                ↵ Enter to send
              </span>
              <span style={{ padding: '1px 5px', borderRadius: 4, background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
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
                    ? 'linear-gradient(135deg, #38bdf8 0%, #818cf8 100%)'
                    : 'rgba(255, 255, 255, 0.08)',
                color: '#ffffff',
                border: 'none',
                cursor: inputPrompt.trim() && !isThinking && !isQuotaExceeded ? 'pointer' : 'not-allowed',
                display: 'grid',
                placeItems: 'center',
                boxShadow:
                  inputPrompt.trim() && !isThinking && !isQuotaExceeded
                    ? '0 0 12px rgba(56, 189, 248, 0.4)'
                    : 'none',
                transition: 'all 0.15s ease',
              }}
              title="Send to Copilot"
            >
              <SendIcon size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

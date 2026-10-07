import React, { useState, useEffect, useRef } from 'react'
import type { AuthUser } from '../lib/storage'
import { AIRequestError, generateAIReply, getAIUsage } from '../lib/aiClient'
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
  GithubIcon,
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
  getActiveCode,
  curTab,
  onInsertCodeToEditor,
  onClose,
  showToast,
}: Props) {
  const effectiveUserId = authUser?.id || 'cf_guest_developer'
  const effectiveDisplayName = authUser?.login || authUser?.name || 'developer'
  const [usageLoading, setUsageLoading] = useState(false)
  const [usageError, setUsageError] = useState('')

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

  useEffect(() => {
    const accessToken = authUser?.provider === 'github' ? authUser.accessToken : undefined
    if (!accessToken) {
      setAiUsage(0)
      setUsageError('')
      return
    }

    let active = true
    setUsageLoading(true)
    setUsageError('')
    getAIUsage(accessToken)
      .then(usage => {
        if (active) setAiUsage(usage.used)
      })
      .catch(error => {
        if (active) {
          setUsageError(error instanceof Error ? error.message : 'Unable to load your monthly AI usage.')
        }
      })
      .finally(() => {
        if (active) setUsageLoading(false)
      })
    return () => { active = false }
  }, [authUser?.provider, authUser?.accessToken, setAiUsage])

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

  const isSignedIn = authUser?.provider === 'github' && Boolean(authUser.accessToken)
  const isQuotaExceeded = aiUsage >= maxFreeAI
  const remainingQueries = Math.max(0, maxFreeAI - aiUsage)

  const handleSendMessage = async (customPrompt?: string) => {
    const raw = (customPrompt || inputPrompt).trim()
    if (!raw || isThinking) return

    if (!isSignedIn || !authUser?.accessToken) {
      onOpenGitHubAuth()
      return
    }

    if (isQuotaExceeded) {
      showToast(`You have used all ${maxFreeAI} CodeForge AI requests for this month.`)
      return
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

      const response = await generateAIReply(authUser.accessToken, raw, activeCode, curTab.lang, historyContext.slice(0, -1))
      reply = response.text
      setAiUsage(response.usage.used)
      isLiveGemini = true

      const assistantMsg: AIMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: reply,
        timestamp: Date.now(),
        isGemini: isLiveGemini,
      }

      setMessages(prev => [...prev, assistantMsg])
    } catch (err: unknown) {
      const error = err instanceof Error ? err.message : 'Please check your connection and try again.'
      if (err instanceof AIRequestError && err.usage) {
        setAiUsage(err.usage.used)
      }
      const errorMsg: AIMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: `⚠️ Failed to get AI response: ${error}`,
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
                  background: isQuotaExceeded
                    ? 'rgba(239, 68, 68, 0.15)'
                    : 'var(--bg-hover)',
                  color: isQuotaExceeded ? '#ef4444' : 'var(--text-muted)',
                  border: `1px solid ${
                    isQuotaExceeded
                      ? 'rgba(239, 68, 68, 0.3)'
                      : 'var(--border)'
                  }`,
                }}
              >
                {usageLoading ? '…' : `${aiUsage}/${maxFreeAI}`}
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
                <span style={{ color: 'var(--accent)', fontWeight: 600 }}>Gemini 2.5 Flash</span>
              </span>
              <span>•</span>
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {isSignedIn ? `@${effectiveDisplayName}` : 'Sign in to continue'}
              </span>
            </div>
          </div>
        </div>

        {/* Right Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0 }}>
          {isSignedIn && (
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
          )}

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

      {!isSignedIn ? (
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '32px 20px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            background: 'var(--bg-app)',
          }}
        >
          {/* Visual Logo / Badge */}
          <div
            style={{
              position: 'relative',
              marginBottom: 18,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <div
              style={{
                width: 72,
                height: 72,
                borderRadius: '50%',
                background: 'var(--accent)',
                opacity: 0.18,
                position: 'absolute',
                filter: 'blur(16px)',
              }}
            />
            <div
              style={{
                width: 58,
                height: 58,
                borderRadius: 14,
                background: 'var(--bg-card)',
                border: '1px solid var(--border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 8px 24px rgba(0, 0, 0, 0.25)',
                position: 'relative',
              }}
            >
              <img
                src={logoImg}
                alt="CodeForge AI"
                style={{ width: 28, height: 28, objectFit: 'contain' }}
              />
              <div
                style={{
                  position: 'absolute',
                  bottom: -6,
                  right: -6,
                  width: 22,
                  height: 22,
                  borderRadius: '50%',
                  background: '#24292f',
                  border: '2px solid var(--bg-card)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                }}
              >
                <GithubIcon size={12} />
              </div>
            </div>
          </div>

          <h3
            style={{
              fontSize: 16,
              fontWeight: 700,
              color: 'var(--text-base)',
              marginBottom: 6,
              letterSpacing: '-0.01em',
            }}
          >
            Unlock CodeForge AI
          </h3>

          <p
            style={{
              fontSize: 12,
              lineHeight: 1.55,
              color: 'var(--text-muted)',
              maxWidth: 290,
              marginBottom: 18,
            }}
          >
            Sign in with your GitHub account to access AI code generation, bug fixing, and real-time pair programming.
          </p>

          {/* Quota Feature Card */}
          <div
            style={{
              width: '100%',
              maxWidth: 300,
              padding: '10px 14px',
              borderRadius: 8,
              background: 'var(--accent-subtle)',
              border: '1px solid var(--accent-border)',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              marginBottom: 20,
              textAlign: 'left',
            }}
          >
            <div style={{ fontSize: 18, lineHeight: 1 }}>🎁</div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-base)' }}>
                {maxFreeAI} Free AI Requests / Month
              </div>
              <div style={{ fontSize: 10.5, color: 'var(--text-muted)', marginTop: 2 }}>
                Quota is tracked per GitHub account and resets on the 1st of every month.
              </div>
            </div>
          </div>

          {/* Continue with GitHub Button */}
          <button
            className="btn btn-primary"
            onClick={onOpenGitHubAuth}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              padding: '10px 22px',
              fontSize: 13,
              fontWeight: 600,
              borderRadius: 8,
              width: '100%',
              maxWidth: 300,
              cursor: 'pointer',
              boxShadow: '0 4px 14px var(--accent-subtle)',
              marginBottom: 20,
            }}
          >
            <GithubIcon size={16} />
            <span>Continue with GitHub</span>
          </button>

          {/* Feature Highlights Grid */}
          <div
            style={{
              width: '100%',
              maxWidth: 300,
              display: 'flex',
              flexDirection: 'column',
              gap: 7,
              textAlign: 'left',
            }}
          >
            {[
              { icon: '🐛', title: 'Fix Code & Syntax Bugs', desc: 'Pinpoint runtime errors and fix code in 1-click' },
              { icon: '⚡', title: 'Optimize Complexity', desc: 'Improve algorithmic Big-O time and space' },
              { icon: '🔍', title: 'Senior Code Review', desc: 'Architecture, clean code standards, and patterns' },
              { icon: '🧪', title: 'Unit Test Generation', desc: 'Auto-generate comprehensive test suites' },
            ].map(f => (
              <div
                key={f.title}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 8,
                  padding: '7px 10px',
                  borderRadius: 6,
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border)',
                  fontSize: 11,
                }}
              >
                <span style={{ fontSize: 13, flexShrink: 0 }}>{f.icon}</span>
                <div>
                  <span style={{ fontWeight: 600, color: 'var(--text-base)' }}>{f.title}: </span>
                  <span style={{ color: 'var(--text-muted)' }}>{f.desc}</span>
                </div>
              </div>
            ))}
          </div>

          <div
            style={{
              fontSize: 10,
              color: 'var(--text-dim)',
              marginTop: 18,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 3,
            }}
          >
            <span>🔒 Secure GitHub Device Flow. No passwords stored.</span>
            <span style={{ color: 'var(--accent)', fontSize: 9.5 }}>🛡️ 256-Bit AES-GCM Encrypted Storage Active</span>
          </div>
        </div>
      ) : (
        <>
          {usageError && (
            <div style={{ padding: '8px 14px', color: '#fca5a5', background: 'rgba(239, 68, 68, 0.1)', fontSize: 11 }}>
              {usageError}
            </div>
          )}

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
              <span>Monthly limit reached ({maxFreeAI}/{maxFreeAI}). Your requests reset next month.</span>
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
                disabled={isThinking || isQuotaExceeded || usageLoading || Boolean(usageError)}
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
                  cursor: isThinking || isQuotaExceeded || usageLoading || Boolean(usageError) ? 'not-allowed' : 'pointer',
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
                    Analyzing context in {curTab.name} • Gemini 2.5 Flash
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
                  {usageLoading ? 'Checking usage…' : `${remainingQueries} requests left this month`}
                </span>
              </div>

              {/* Smooth Textarea */}
              <textarea
                ref={inputRef}
                rows={2}
                value={inputPrompt}
                placeholder={
                  isQuotaExceeded
                    ? 'Monthly request limit reached. Resets next month.'
                    : usageError
                    ? 'AI usage is unavailable right now.'
                    : 'Ask CodeForge AI anything, /fix, /optimize, /explain...'
                }
                disabled={isQuotaExceeded || usageLoading || Boolean(usageError)}
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
                  disabled={!inputPrompt.trim() || isThinking || isQuotaExceeded || usageLoading || Boolean(usageError)}
                  onClick={() => handleSendMessage()}
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    background:
                      inputPrompt.trim() && !isThinking && !isQuotaExceeded && !usageLoading && !usageError
                        ? 'var(--accent)'
                        : 'var(--bg-hover)',
                    color: inputPrompt.trim() && !isThinking && !isQuotaExceeded && !usageLoading && !usageError ? '#ffffff' : 'var(--text-dim)',
                    border: 'none',
                    cursor: inputPrompt.trim() && !isThinking && !isQuotaExceeded && !usageLoading && !usageError ? 'pointer' : 'not-allowed',
                    display: 'grid',
                    placeItems: 'center',
                    boxShadow:
                      inputPrompt.trim() && !isThinking && !isQuotaExceeded && !usageLoading && !usageError
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
        </>
      )}
    </div>
  )
}

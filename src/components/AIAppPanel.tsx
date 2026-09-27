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

function getCurrentMonthKey() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

// GitHub Octocat Icon
const GitHubOctocatIcon = ({ size = 20 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
    />
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
  // Gemini API Key loaded securely from environment or user settings
  const geminiApiKey = (import.meta.env.VITE_AI_KEY as string) || localStorage.getItem('cf_gemini_api_key') || ''

  // Messages state
  const [messages, setMessages] = useState<AIMessage[]>(() => {
    if (!authUser) return []
    try {
      const saved = localStorage.getItem(`cf_ai_chat_${authUser.id}`)
      if (saved) return JSON.parse(saved)
    } catch {}
    return [
      {
        id: 'welcome',
        role: 'assistant',
        content: `👋 Welcome, **@${authUser.login || authUser.name}**! I'm **CodeForge AI** powered by Google Gemini.\n\nI can help you analyze, debug, explain, and optimize your **${curTab.name || 'code'}**.\n\n**Monthly Limit:** 20 queries/month for your GitHub account. Ask anything below!`,
        timestamp: Date.now(),
      },
    ]
  })

  const [inputPrompt, setInputPrompt] = useState('')
  const [isThinking, setIsThinking] = useState(false)
  const [copiedCodeIdx, setCopiedCodeIdx] = useState<string | null>(null)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  // Reload chats when authUser changes
  useEffect(() => {
    if (authUser) {
      try {
        const saved = localStorage.getItem(`cf_ai_chat_${authUser.id}`)
        if (saved) {
          setMessages(JSON.parse(saved))
          return
        }
      } catch {}
      setMessages([
        {
          id: 'welcome',
          role: 'assistant',
          content: `👋 Welcome, **@${authUser.login || authUser.name}**! I'm **CodeForge AI** powered by Google Gemini.\n\nI can help you analyze, debug, explain, and optimize your **${curTab.name || 'code'}**.\n\n**Monthly Limit:** 20 queries/month for your GitHub account. Ask anything below!`,
          timestamp: Date.now(),
        },
      ])
    }
  }, [authUser?.id])

  // Persist messages to localStorage
  useEffect(() => {
    if (authUser && messages.length > 0) {
      try {
        localStorage.setItem(`cf_ai_chat_${authUser.id}`, JSON.stringify(messages))
      } catch {}
    }
  }, [messages, authUser?.id])

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isThinking])

  // Quota check
  const isQuotaExceeded = !isPro && aiUsage >= maxFreeAI
  const remainingQueries = isPro ? 'Unlimited' : Math.max(0, maxFreeAI - aiUsage)



  // Live Gemini Direct API Call (Gemini 3.8 Flash)
  const callGeminiAPI = async (prompt: string, code: string, lang: string, history: { role: string; content: string }[]) => {
    // 1. First attempt via CodeForge backend middleware (guarantees zero CORS and automatic 3.8 -> 3.7 fallback)
    try {
      const srvRes = await fetch('/api/ai/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, code, lang, history })
      })
      if (srvRes.ok) {
        const srvData = await srvRes.json()
        if (srvData.ok && srvData.text) {
          return srvData.text
        }
      }
    } catch {
      // Fall through to direct Google Gemini 3.8 Flash
    }

    // 2. Direct call to Google Gemini 3.8 Flash
    const key = geminiApiKey.trim() || (import.meta.env.VITE_AI_KEY as string) || ''
    if (!key) throw new Error('No Gemini key')

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent?key=${encodeURIComponent(key)}`
    const userPrompt = code.trim()
      ? `Active File (${lang || 'code'}):\n\`\`\`${lang || 'text'}\n${code}\n\`\`\`\n\nPrompt: ${prompt}`
      : prompt

    const contents = [
      {
        role: 'user',
        parts: [{ text: 'You are CodeForge AI, an elite senior programming copilot inside an online compiler. Provide production-ready, complete code inside fenced markdown blocks, along with concise explanations and Big-O complexity analysis.' }]
      },
      ...history.slice(-6).map(m => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }]
      })),
      {
        role: 'user',
        parts: [{ text: userPrompt }]
      }
    ]

    const resp = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents,
        generationConfig: { temperature: 0.2, maxOutputTokens: 3000 }
      })
    })

    if (!resp.ok) {
      const data = await resp.json().catch(() => ({}))
      throw new Error(data.error?.message || `Gemini API HTTP ${resp.status}`)
    }

    const json = await resp.json()
    const text = json.candidates?.[0]?.content?.parts?.map((p: any) => p.text || '').join('') || ''
    if (!text.trim()) throw new Error('Empty response from Gemini')
    return text
  }

  // Send message handler
  const handleSendMessage = async (textToSend?: string) => {
    if (!authUser) {
      onOpenGitHubAuth()
      showToast('🔒 Please sign in with GitHub to use CodeForge AI')
      return
    }

    if (isQuotaExceeded) {
      onUpgradePro()
      showToast(`⚠️ Monthly free limit reached (${maxFreeAI}/${maxFreeAI}). Upgrade to Pro!`)
      return
    }

    const raw = (textToSend ?? inputPrompt).trim()
    if (!raw || isThinking) return

    setInputPrompt('')
    const activeCode = getActiveCode()

    // Deduct usage (1 query per user request)
    if (!isPro) {
      const nextUsage = aiUsage + 1
      const monthKey = getCurrentMonthKey()
      localStorage.setItem(`cf_ai_usage_${authUser.id}_${monthKey}`, String(nextUsage))
      setAiUsage(nextUsage)
    }

    const userMsg: AIMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: raw,
      timestamp: Date.now(),
    }

    const updatedMessages = [...messages, userMsg]
    setMessages(updatedMessages)
    setIsThinking(true)

    try {
      const historyContext = updatedMessages.map(m => ({ role: m.role, content: m.content }))
      let reply = ''
      let isLiveGemini = false

      // Try calling live Google Gemini API with the configured key
      if (geminiApiKey.trim()) {
        try {
          reply = await callGeminiAPI(raw, activeCode, curTab.lang, historyContext)
          isLiveGemini = true
        } catch (geminiErr: any) {
          console.warn('Gemini API call failed, falling back to smart companion:', geminiErr)
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

  // Quick fix bug action
  const handleQuickFixBug = () => {
    const code = getActiveCode()
    if (!code.trim()) {
      showToast('No code in active editor to analyze')
      return
    }
    handleSendMessage(`Find any bugs, syntax mistakes, or runtime crashes in this ${curTab.lang || 'code'}, explain the root cause, and provide the complete fixed version.`)
  }

  // Quick code review
  const handleQuickReview = () => {
    const code = getActiveCode()
    if (!code.trim()) {
      showToast('No code in active editor to review')
      return
    }
    handleSendMessage(`Perform a professional code review on this ${curTab.lang || 'code'}: assess readability, time/space complexity, modularity, and suggest improvements.`)
  }

  // Clear chat
  const handleClearChat = () => {
    if (!authUser) return
    const welcome: AIMessage = {
      id: crypto.randomUUID(),
      role: 'assistant',
      content: `Chat cleared. How can I help you with **${curTab.name || 'code'}**?`,
      timestamp: Date.now(),
    }
    setMessages([welcome])
    localStorage.removeItem(`cf_ai_chat_${authUser.id}`)
    showToast('Chat history cleared')
  }

  // Copy code snippet
  const handleCopyCode = (text: string, id: string) => {
    navigator.clipboard.writeText(text).catch(() => {})
    setCopiedCodeIdx(id)
    setTimeout(() => setCopiedCodeIdx(null), 2000)
    showToast('Code copied to clipboard! 📋')
  }

  // Attach editor code to prompt
  const handleAttachCode = () => {
    const code = getActiveCode()
    if (!code.trim()) {
      showToast('No active code in editor')
      return
    }
    const snippet = `\n\`\`\`${curTab.lang || 'code'}\n// File: ${curTab.name}\n${code}\n\`\`\`\n`
    setInputPrompt(prev => (prev ? `${prev}\n${snippet}` : snippet))
    showToast(`Attached ${curTab.name} to message 📎`)
    inputRef.current?.focus()
  }

  // Render markdown message content with code blocks & insert buttons
  const renderMessageContent = (text: string, msgId: string) => {
    const parts = text.split(/(```[\s\S]*?```)/g)

    return (
      <div style={{ lineHeight: 1.6, fontSize: 12 }}>
        {parts.map((part, idx) => {
          if (part.startsWith('```') && part.endsWith('```')) {
            const rawContent = part.slice(3, -3)
            const firstNewline = rawContent.indexOf('\n')
            const lang = firstNewline !== -1 ? rawContent.substring(0, firstNewline).trim() : ''
            const codeBlock = firstNewline !== -1 ? rawContent.substring(firstNewline + 1) : rawContent
            const blockKey = `${msgId}_code_${idx}`

            return (
              <div
                key={blockKey}
                style={{
                  margin: '8px 0',
                  borderRadius: 8,
                  border: '1px solid var(--border)',
                  overflow: 'hidden',
                  background: '#090d16',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '4px 10px',
                    background: 'rgba(255,255,255,0.04)',
                    borderBottom: '1px solid rgba(255,255,255,0.06)',
                    fontSize: 10,
                    color: 'var(--text-muted)',
                  }}
                >
                  <span style={{ fontWeight: 600, color: 'var(--accent, #38bdf8)' }}>
                    {lang || curTab.lang || 'code'}
                  </span>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button
                      onClick={() => handleCopyCode(codeBlock, blockKey)}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: 'var(--text-dim)',
                        fontSize: 10,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 3,
                      }}
                      title="Copy code to clipboard"
                    >
                      {copiedCodeIdx === blockKey ? <CheckIcon size={11} /> : <CopyIcon size={11} />}
                      <span>{copiedCodeIdx === blockKey ? 'Copied' : 'Copy'}</span>
                    </button>
                    {onInsertCodeToEditor && (
                      <button
                        onClick={() => {
                          onInsertCodeToEditor(codeBlock)
                          showToast(`Inserted into ${curTab.name} ✨`)
                        }}
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          color: 'var(--accent, #38bdf8)',
                          fontSize: 10,
                          fontWeight: 700,
                        }}
                        title="Insert directly into active file"
                      >
                        ⚡ Insert
                      </button>
                    )}
                  </div>
                </div>
                <pre
                  style={{
                    padding: '8px 10px',
                    margin: 0,
                    fontSize: 11,
                    fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                    overflowX: 'auto',
                    color: '#e6edf3',
                    lineHeight: 1.5,
                  }}
                >
                  <code>{codeBlock}</code>
                </pre>
              </div>
            )
          }

          // Plain text lines
          const lines = part.split('\n')
          return (
            <div key={idx} style={{ marginBottom: 4 }}>
              {lines.map((line, lIdx) => {
                if (line.startsWith('> ')) {
                  return (
                    <div
                      key={lIdx}
                      style={{
                        borderLeft: '3px solid var(--accent, #38bdf8)',
                        paddingLeft: 8,
                        margin: '4px 0',
                        color: 'var(--text-muted)',
                        fontSize: 11,
                        background: 'rgba(56, 189, 248, 0.05)',
                        padding: '4px 8px',
                        borderRadius: 4,
                      }}
                    >
                      {line.replace('> ', '')}
                    </div>
                  )
                }

                const inlineParts = line.split(/(`[^`]+`)/g)
                return (
                  <div key={lIdx} style={{ minHeight: line.trim() ? undefined : '0.5em' }}>
                    {inlineParts.map((sub, sIdx) => {
                      if (sub.startsWith('`') && sub.endsWith('`')) {
                        return (
                          <code
                            key={sIdx}
                            style={{
                              fontFamily: "'JetBrains Mono', monospace",
                              fontSize: '0.9em',
                              background: 'rgba(255, 255, 255, 0.08)',
                              padding: '1px 5px',
                              borderRadius: 4,
                              border: '1px solid var(--border)',
                              color: 'var(--accent, #38bdf8)',
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
                              <strong key={bIdx} style={{ color: 'var(--text-base)', fontWeight: 700 }}>
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
                )
              })}
            </div>
          )
        })}
      </div>
    )
  }

  // ── Case 1: User is NOT Signed in with GitHub ───────────────────────────────
  if (!authUser) {
    return (
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          overflow: 'hidden',
          background: 'var(--bg-app)',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '10px 14px',
            borderBottom: '1px solid var(--border)',
            background: 'var(--bg-panel)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <img src={logoImg} alt="CodeForge" style={{ width: 22, height: 22, objectFit: 'contain' }} />
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-base)' }}>CodeForge AI</span>
          </div>
          <button
            onClick={onClose}
            title="Close"
            style={{ background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer', padding: 3 }}
          >
            <XIcon size={13} />
          </button>
        </div>

        {/* GitHub Login Hero Card */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px 20px',
            textAlign: 'center',
            overflowY: 'auto',
          }}
        >
          <div style={{ marginBottom: 16 }}>
            <img
              src={logoImg}
              alt="CodeForge AI"
              style={{
                width: 54,
                height: 54,
                objectFit: 'contain',
                filter: 'drop-shadow(0 6px 20px rgba(56, 189, 248, 0.35))',
              }}
            />
          </div>

          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
              padding: '3px 10px',
              borderRadius: 20,
              background: 'rgba(56, 189, 248, 0.1)',
              border: '1px solid rgba(56, 189, 248, 0.25)',
              color: '#38bdf8',
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              marginBottom: 12,
            }}
          >
            <span>🔒 Authentication Required</span>
          </div>

          <h3 style={{ margin: '0 0 8px', fontSize: 16, fontWeight: 700, color: 'var(--text-base)' }}>
            Sign in with GitHub
          </h3>
          <p style={{ margin: '0 0 20px', fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5, maxWidth: 280 }}>
            Connect your GitHub account to access AI code assistance and track your monthly free quota.
          </p>

          {/* Feature highlights */}
          <div
            style={{
              width: '100%',
              maxWidth: 290,
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid var(--border)',
              borderRadius: 10,
              padding: '12px 14px',
              marginBottom: 20,
              textAlign: 'left',
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
              fontSize: 11,
              color: 'var(--text-muted)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ color: '#34d399' }}>✓</span>
              <span><strong>20 Free AI queries</strong> every month per user</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ color: '#38bdf8' }}>✓</span>
              <span>Powered by <strong>Google Gemini API</strong></span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ color: '#a78bfa' }}>✓</span>
              <span>Saves conversation history to your account</span>
            </div>
          </div>

          {/* Sign In Button */}
          <button
            onClick={onOpenGitHubAuth}
            style={{
              width: '100%',
              maxWidth: 290,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 10,
              padding: '11px 16px',
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 700,
              background: '#24292e',
              border: '1px solid rgba(255,255,255,0.18)',
              color: '#ffffff',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              boxShadow: '0 4px 14px rgba(0,0,0,0.3)',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = '#2f363d'
              e.currentTarget.style.transform = 'translateY(-1px)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = '#24292e'
              e.currentTarget.style.transform = 'translateY(0)'
            }}
          >
            <GitHubOctocatIcon size={18} />
            <span>Continue with GitHub</span>
          </button>
        </div>
      </div>
    )
  }

  // ── Case 2: User IS Signed in with GitHub ──────────────────────────────────
  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        overflow: 'hidden',
        background: 'var(--bg-app)',
        position: 'relative',
      }}
    >
      {/* ── Top Header ──────────────────────────────────────────────────────────── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '8px 12px',
          borderBottom: '1px solid var(--border)',
          background: 'var(--bg-panel)',
          flexShrink: 0,
          gap: 6,
        }}
      >
        {/* Left: CodeForge Logo + Title + User Profile */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
          <img src={logoImg} alt="CodeForge" style={{ width: 22, height: 22, objectFit: 'contain', flexShrink: 0 }} />
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-base)', display: 'flex', alignItems: 'center', gap: 6 }}>
              <span>CodeForge AI</span>
              {/* Pro / Quota Badge */}
              <span
                style={{
                  fontSize: 9,
                  fontWeight: 700,
                  padding: '1px 5px',
                  borderRadius: 6,
                  background: isPro
                    ? 'rgba(168, 85, 247, 0.15)'
                    : isQuotaExceeded
                    ? 'rgba(248, 113, 113, 0.15)'
                    : 'rgba(56, 189, 248, 0.15)',
                  color: isPro ? '#c084fc' : isQuotaExceeded ? '#f87171' : '#38bdf8',
                  border: `1px solid ${
                    isPro
                      ? 'rgba(168, 85, 247, 0.3)'
                      : isQuotaExceeded
                      ? 'rgba(248, 113, 113, 0.3)'
                      : 'rgba(56, 189, 248, 0.3)'
                  }`,
                }}
              >
                {isPro ? 'PRO' : `${aiUsage}/${maxFreeAI} Used`}
              </span>
            </div>
            <div style={{ fontSize: 10, color: 'var(--text-dim)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 4 }}>
              <span>👤 @{authUser.login || authUser.name}</span>
              <span>·</span>
              <span style={{ color: '#38bdf8', fontWeight: 600 }}>Gemini 3.8 Flash</span>
            </div>
          </div>
        </div>

        {/* Right: Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>


          {/* Clear chat */}
          <button
            onClick={handleClearChat}
            title="Clear conversation"
            style={{
              padding: '4px 6px',
              borderRadius: 6,
              background: 'none',
              border: '1px solid var(--border)',
              color: 'var(--text-dim)',
              fontSize: 10,
              cursor: 'pointer',
            }}
          >
            <TrashIcon size={12} />
          </button>

          {/* Close panel */}
          <button
            onClick={onClose}
            title="Close AI panel"
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-muted)',
              padding: 4,
              cursor: 'pointer',
              lineHeight: 1,
            }}
          >
            <XIcon size={13} />
          </button>
        </div>
      </div>

      {/* ── Quota Exceeded Banner (if limit reached) ────────────────────────────── */}
      {isQuotaExceeded && (
        <div
          style={{
            padding: '8px 12px',
            background: 'rgba(248, 113, 113, 0.12)',
            borderBottom: '1px solid rgba(248, 113, 113, 0.25)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: 11,
            color: '#fca5a5',
            gap: 8,
          }}
        >
          <span>
            ⚠️ Monthly free AI limit reached (<strong>{maxFreeAI}/{maxFreeAI}</strong>).
          </span>
          <button
            onClick={onUpgradePro}
            style={{
              padding: '3px 8px',
              borderRadius: 5,
              background: '#ef4444',
              border: 'none',
              color: '#ffffff',
              fontSize: 10,
              fontWeight: 700,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            Upgrade Pro 🚀
          </button>
        </div>
      )}

      {/* ── Quick Action Buttons Bar ───────────────────────────────────────────── */}
      <div
        style={{
          display: 'flex',
          gap: 6,
          padding: '6px 12px',
          borderBottom: '1px solid var(--border)',
          background: 'rgba(0,0,0,0.1)',
          flexShrink: 0,
        }}
      >
        <button
          onClick={handleQuickFixBug}
          disabled={isThinking || isQuotaExceeded}
          className="btn btn-ghost"
          style={{ padding: '3px 8px', fontSize: 11, gap: 5, borderRadius: 6 }}
        >
          <BugIcon size={11} /> Fix Bug
        </button>
        <button
          onClick={handleQuickReview}
          disabled={isThinking || isQuotaExceeded}
          className="btn btn-ghost"
          style={{ padding: '3px 8px', fontSize: 11, gap: 5, borderRadius: 6 }}
        >
          <ReviewIcon size={11} /> Code Review
        </button>
        <button
          onClick={() => handleSendMessage(`Optimize the time and space complexity of ${curTab.name}.`)}
          disabled={isThinking || isQuotaExceeded}
          className="btn btn-ghost"
          style={{ padding: '3px 8px', fontSize: 11, gap: 5, borderRadius: 6 }}
        >
          ⚡ Optimize
        </button>
      </div>

      {/* ── Messages List Area ────────────────────────────────────────────────── */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '12px 14px',
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
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
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 5,
                  fontSize: 10,
                  color: 'var(--text-dim)',
                  marginBottom: 3,
                  padding: '0 4px',
                }}
              >
                {!isUser ? (
                  <>
                    <img src={logoImg} alt="" style={{ width: 12, height: 12, objectFit: 'contain' }} />
                    <span style={{ fontWeight: 600, color: 'var(--accent, #38bdf8)' }}>
                      CodeForge AI {msg.isGemini ? '(Gemini Live)' : ''}
                    </span>
                  </>
                ) : (
                  <span>@{authUser.login || authUser.name}</span>
                )}
                <span>·</span>
                <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </div>

              <div
                style={{
                  maxWidth: '92%',
                  padding: '9px 12px',
                  borderRadius: isUser ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
                  background: isUser
                    ? 'linear-gradient(135deg, rgba(56, 189, 248, 0.18) 0%, rgba(99, 102, 241, 0.22) 100%)'
                    : 'var(--bg-card, rgba(255,255,255,0.03))',
                  border: `1px solid ${isUser ? 'rgba(56, 189, 248, 0.35)' : 'var(--border)'}`,
                  color: 'var(--text-base)',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                }}
              >
                {renderMessageContent(msg.content, msg.id)}
              </div>
            </div>
          )
        })}

        {isThinking && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '8px 12px',
              color: 'var(--accent, #38bdf8)',
              fontSize: 11,
            }}
          >
            <SpinnerIcon size={14} />
            <span>CodeForge AI (Gemini 3.8 Flash) is generating...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* ── Quick Prompt Chips ────────────────────────────────────────────────── */}
      <div
        style={{
          display: 'flex',
          gap: 5,
          padding: '6px 10px',
          overflowX: 'auto',
          borderTop: '1px solid var(--border)',
          background: 'rgba(0,0,0,0.15)',
          flexShrink: 0,
        }}
      >
        {[
          { label: '💡 Explain Code', prompt: `Please explain how the code in ${curTab.name} works step-by-step with complexity analysis.` },
          { label: '🧪 Write Tests', prompt: `Write comprehensive unit tests with edge cases for ${curTab.name}.` },
          { label: '📝 Add Comments', prompt: `Add clear, production-ready docstrings and inline comments to ${curTab.name}.` },
          { label: '🎯 Complexity', prompt: `Calculate the exact Time & Space Complexity of ${curTab.name} in Big-O notation.` },
        ].map(qp => (
          <button
            key={qp.label}
            disabled={isThinking || isQuotaExceeded}
            onClick={() => handleSendMessage(qp.prompt)}
            style={{
              padding: '3px 8px',
              borderRadius: 12,
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              color: 'var(--text-muted)',
              fontSize: 10,
              whiteSpace: 'nowrap',
              cursor: isThinking || isQuotaExceeded ? 'not-allowed' : 'pointer',
              flexShrink: 0,
            }}
            onMouseEnter={e => {
              if (!isThinking && !isQuotaExceeded) {
                e.currentTarget.style.color = 'var(--accent, #38bdf8)'
                e.currentTarget.style.borderColor = 'var(--accent, #38bdf8)'
              }
            }}
            onMouseLeave={e => {
              e.currentTarget.style.color = 'var(--text-muted)'
              e.currentTarget.style.borderColor = 'var(--border)'
            }}
          >
            {qp.label}
          </button>
        ))}
      </div>

      {/* ── Composer Input Area ───────────────────────────────────────────────── */}
      <div
        style={{
          padding: '8px 10px 10px',
          borderTop: '1px solid var(--border)',
          background: 'var(--bg-panel)',
          flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 5 }}>
          <button
            onClick={handleAttachCode}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--accent, #38bdf8)',
              fontSize: 10,
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              cursor: 'pointer',
              padding: '2px 4px',
            }}
          >
            📎 Attach active file ({curTab.name})
          </button>
          <span style={{ fontSize: 9, color: 'var(--text-dim)' }}>
            {remainingQueries} queries left · Enter to send
          </span>
        </div>

        <div style={{ display: 'flex', gap: 6, alignItems: 'flex-end' }}>
          <textarea
            ref={inputRef}
            rows={2}
            value={inputPrompt}
            placeholder={
              isQuotaExceeded
                ? 'Monthly quota reached. Upgrade to Pro to continue...'
                : 'Ask anything about your code...'
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
              flex: 1,
              background: 'var(--bg-app)',
              border: '1px solid var(--border)',
              borderRadius: 8,
              padding: '8px 10px',
              color: 'var(--text-base)',
              fontSize: 12,
              fontFamily: 'inherit',
              resize: 'none',
              outline: 'none',
            }}
          />

          <button
            disabled={!inputPrompt.trim() || isThinking || isQuotaExceeded}
            onClick={() => handleSendMessage()}
            style={{
              padding: '8px 14px',
              borderRadius: 8,
              background:
                inputPrompt.trim() && !isThinking && !isQuotaExceeded
                  ? 'var(--accent, #38bdf8)'
                  : 'var(--border)',
              color: '#ffffff',
              border: 'none',
              fontSize: 12,
              fontWeight: 700,
              cursor: inputPrompt.trim() && !isThinking && !isQuotaExceeded ? 'pointer' : 'not-allowed',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: 38,
            }}
          >
            <SendIcon size={14} />
          </button>
        </div>
      </div>

      {/* ── Gemini Key Config Modal ───────────────────────────────────────────── */}

    </div>
  )
}

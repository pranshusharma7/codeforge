import React, { useState, useEffect } from 'react'
import {
  Key,
  Copy,
  Check,
  RefreshCw,
  Eye,
  EyeOff,
  Plus,
  Trash2,
  FileCode,
  Globe,
  CheckCircle2,
  AlertCircle,
  Terminal,
  Zap,
  Lock,
} from 'lucide-react'

interface SecretItem {
  key: string
  value: string
  isSecret: boolean
}

interface SecretsManagerModalProps {
  isOpen: boolean
  onClose: () => void
  showToast: (msg: string) => void
}

export const SecretsManagerModal: React.FC<SecretsManagerModalProps> = ({
  isOpen,
  onClose,
  showToast,
}) => {
  const [activeTab, setActiveTab] = useState<'connect' | 'secrets' | 'raw'>('connect')
  const [apiKey, setApiKey] = useState<string>('cf_live_7e8b2a4c9f1d3e5a6b8c0d2e4f6a8b0c')
  const [showApiKey, setShowApiKey] = useState<boolean>(false)
  const [copiedKey, setCopiedKey] = useState<boolean>(false)
  const [copiedUrl, setCopiedUrl] = useState<boolean>(false)
  const [copiedSnippet, setCopiedSnippet] = useState<boolean>(false)
  const [snippetLang, setSnippetLang] = useState<'python' | 'node' | 'curl' | 'next' | 'go'>('python')

  const [secrets, setSecrets] = useState<SecretItem[]>([])
  const [rawEnv, setRawEnv] = useState<string>('')
  const [newKey, setNewKey] = useState<string>('')
  const [newValue, setNewValue] = useState<string>('')
  const [visibleValues, setVisibleValues] = useState<Record<string, boolean>>({})

  const [testState, setTestState] = useState<{
    status: 'idle' | 'loading' | 'success' | 'error'
    message?: string
    output?: string
    time?: string
  }>({ status: 'idle' })

  const baseUrl = typeof window !== 'undefined' ? `${window.location.origin}/api/v1/execute` : 'http://localhost:8443/api/v1/execute'

  // Fetch secrets on modal open
  useEffect(() => {
    if (!isOpen) return
    fetchSecrets()
  }, [isOpen])

  const fetchSecrets = async () => {
    try {
      const res = await fetch('/api/secrets')
      if (res.ok) {
        const data = await res.json()
        if (data.apiKey) setApiKey(data.apiKey)
        if (data.rawEnv) setRawEnv(data.rawEnv)
        if (Array.isArray(data.secrets)) {
          setSecrets(data.secrets)
        }
      }
    } catch {
      // Fallback
    }
  }

  // Handle Copy API Key
  const handleCopyKey = async () => {
    try {
      await navigator.clipboard.writeText(apiKey)
      setCopiedKey(true)
      showToast('✓ Copied CodeForge API Key to clipboard!')
      setTimeout(() => setCopiedKey(false), 2000)
    } catch {}
  }

  // Handle Copy Base URL
  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(baseUrl)
      setCopiedUrl(true)
      showToast('✓ Copied API Endpoint URL!')
      setTimeout(() => setCopiedUrl(false), 2000)
    } catch {}
  }

  // Regenerate API Key
  const handleRegenerateKey = async () => {
    if (!window.confirm('Are you sure you want to generate a new API key? Any external projects using the old key will need to be updated.')) {
      return
    }
    try {
      const res = await fetch('/api/secrets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ regenerateApiKey: true }),
      })
      if (res.ok) {
        const data = await res.json()
        if (data.apiKey) {
          setApiKey(data.apiKey)
          showToast('✓ Generated new CodeForge API Key and saved to .env!')
          fetchSecrets()
        }
      }
    } catch {
      showToast('Failed to regenerate key')
    }
  }

  // Test Connection
  const handleTestConnection = async () => {
    setTestState({ status: 'loading' })
    try {
      const startTime = performance.now()
      const res = await fetch('/api/v1/execute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
        },
        body: JSON.stringify({
          code: "print('CodeForge API Connection: SUCCESS!')\nprint('External project connected via API Key.')",
          language: 'python',
        }),
      })

      const elapsed = ((performance.now() - startTime) / 1000).toFixed(3)
      const data = await res.json()

      if (res.ok && data.ok) {
        setTestState({
          status: 'success',
          message: `✓ Connected! Response in ${elapsed}s (HTTP 200)`,
          output: data.stdout || 'Program executed successfully',
          time: data.time || elapsed,
        })
        showToast('✓ External API Key connection test passed!')
      } else {
        setTestState({
          status: 'error',
          message: data.error || `HTTP ${res.status} Error`,
          output: data.stderr || 'Connection refused or key mismatch',
        })
      }
    } catch (err: any) {
      setTestState({
        status: 'error',
        message: 'Network request failed',
        output: err.message,
      })
    }
  }

  // Add new secret
  const handleAddSecret = async () => {
    if (!newKey.trim()) return
    const formattedKey = newKey.trim().toUpperCase().replace(/[^A-Z0-9_]/g, '_')
    try {
      const res = await fetch('/api/secrets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: formattedKey, value: newValue.trim() }),
      })
      if (res.ok) {
        showToast(`✓ Added ${formattedKey} to .env!`)
        setNewKey('')
        setNewValue('')
        fetchSecrets()
      }
    } catch {
      showToast('Failed to save secret')
    }
  }

  // Delete secret
  const handleDeleteSecret = async (keyToDelete: string) => {
    try {
      const lines = rawEnv.split('\n').filter(line => {
        const trimmed = line.trim()
        return !trimmed.startsWith(`${keyToDelete}=`)
      })
      const updated = lines.join('\n')
      const res = await fetch('/api/secrets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rawEnv: updated }),
      })
      if (res.ok) {
        showToast(`✓ Removed ${keyToDelete} from .env`)
        fetchSecrets()
      }
    } catch {
      showToast('Failed to delete')
    }
  }

  // Save Raw .env
  const handleSaveRaw = async () => {
    try {
      const res = await fetch('/api/secrets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rawEnv }),
      })
      if (res.ok) {
        showToast('✓ Saved changes to .env file!')
        fetchSecrets()
      }
    } catch {
      showToast('Failed to save .env')
    }
  }

  // Generate code snippet for active language
  const getCodeSnippet = () => {
    switch (snippetLang) {
      case 'python':
        return `# ── Connect to CodeForge Compiler from Python ──────────────
import requests

url = "${baseUrl}"
headers = {
    "Content-Type": "application/json",
    "x-api-key": "${apiKey}"
}
payload = {
    "code": "import sys\\nprint('Hello from external Python project!')",
    "language": "python",
    "stdin": ""
}

response = requests.post(url, json=payload, headers=headers)
data = response.json()
print("Output:", data.get("stdout"))
`
      case 'node':
        return `// ── Connect to CodeForge Compiler from Node.js / TS ────────
const response = await fetch("${baseUrl}", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "x-api-key": "${apiKey}"
  },
  body: JSON.stringify({
    code: "console.log('Hello from external Node.js project!');",
    language: "javascript"
  })
});

const data = await response.json();
console.log("Stdout:", data.stdout);
`
      case 'curl':
        return `# ── Connect to CodeForge from Terminal / cURL ──────────────
curl -X POST ${baseUrl} \\
  -H "Content-Type: application/json" \\
  -H "x-api-key: ${apiKey}" \\
  -d '{
    "code": "print(2 + 2)",
    "language": "python"
  }'
`
      case 'next':
        return `// ── Connect from Next.js (App Router / Route Handler) ─────
// app/api/run-code/route.ts
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const { code, language } = await req.json();

  const res = await fetch("${baseUrl}", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.CODEFORGE_API_KEY || "${apiKey}"
    },
    body: JSON.stringify({ code, language })
  });

  const result = await res.json();
  return NextResponse.json(result);
}
`
      case 'go':
        return `// ── Connect from Go (Golang) ──────────────────────────────
package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
)

func main() {
	payload := map[string]string{
		"code":     "fmt.Println(\\"Hello from Go!\\")",
		"language": "go",
	}
	jsonData, _ := json.Marshal(payload)

	req, _ := http.NewRequest("POST", "${baseUrl}", bytes.NewBuffer(jsonData))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("x-api-key", "${apiKey}")

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil { panic(err) }
	defer resp.Body.Close()

	body, _ := io.ReadAll(resp.Body)
	fmt.Println(string(body))
}
`
    }
  }

  const handleCopySnippet = async () => {
    try {
      await navigator.clipboard.writeText(getCodeSnippet())
      setCopiedSnippet(true)
      showToast('✓ Copied code snippet to clipboard!')
      setTimeout(() => setCopiedSnippet(false), 2000)
    } catch {}
  }

  if (!isOpen) return null

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(8px)',
        zIndex: 99999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: 16,
          width: '100%',
          maxWidth: 780,
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.6)',
          overflow: 'hidden',
          animation: 'fadeInScale 0.2s ease-out',
        }}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: '16px 22px',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'var(--bg-header)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 34,
                height: 34,
                borderRadius: 9,
                background: 'rgba(139, 92, 246, 0.15)',
                border: '1px solid rgba(139, 92, 246, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--accent)',
              }}
            >
              <Key size={18} />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 16, color: 'var(--text-base)', display: 'flex', alignItems: 'center', gap: 8 }}>
                <span>API Keys & Secrets Manager</span>
                <span style={{ fontSize: 11, background: 'var(--accent-subtle)', color: 'var(--accent)', padding: '2px 8px', borderRadius: 12, border: '1px solid rgba(139, 92, 246, 0.25)' }}>
                  .env
                </span>
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                Store API keys, credentials, and connect external projects to CodeForge
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              fontSize: 18,
              padding: 6,
              borderRadius: 6,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            title="Close modal"
          >
            ✕
          </button>
        </div>

        {/* Segmented Tabs Header */}
        <div
          style={{
            padding: '10px 22px',
            borderBottom: '1px solid var(--border)',
            background: 'var(--bg-surface)',
            display: 'flex',
            gap: 8,
          }}
        >
          <button
            onClick={() => setActiveTab('connect')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '6px 14px',
              borderRadius: 8,
              border: 'none',
              background: activeTab === 'connect' ? 'var(--accent)' : 'transparent',
              color: activeTab === 'connect' ? '#fff' : 'var(--text-muted)',
              fontSize: 12.5,
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.15s',
            }}
          >
            <Globe size={14} />
            <span>Connect External Projects</span>
          </button>

          <button
            onClick={() => setActiveTab('secrets')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '6px 14px',
              borderRadius: 8,
              border: 'none',
              background: activeTab === 'secrets' ? 'var(--accent)' : 'transparent',
              color: activeTab === 'secrets' ? '#fff' : 'var(--text-muted)',
              fontSize: 12.5,
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.15s',
            }}
          >
            <Lock size={14} />
            <span>Secrets & Environment ({secrets.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('raw')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '6px 14px',
              borderRadius: 8,
              border: 'none',
              background: activeTab === 'raw' ? 'var(--accent)' : 'transparent',
              color: activeTab === 'raw' ? '#fff' : 'var(--text-muted)',
              fontSize: 12.5,
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.15s',
            }}
          >
            <FileCode size={14} />
            <span>Raw .env File</span>
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 22 }}>
          {/* ── TAB 1: Connect External Projects ────────────────────────────── */}
          {activeTab === 'connect' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              {/* API Key Box */}
              <div
                style={{
                  background: 'var(--bg-app)',
                  border: '1px solid var(--border)',
                  borderRadius: 12,
                  padding: 16,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 12,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-base)', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span>Your CodeForge API Key</span>
                      <span style={{ fontSize: 10, background: '#10b98120', color: '#10b981', padding: '1px 6px', borderRadius: 10, fontWeight: 600 }}>Active</span>
                    </div>
                    <div style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>
                      Pass this key in the <code>x-api-key</code> header to execute code from any external project.
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <button
                      onClick={handleRegenerateKey}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 5,
                        background: 'var(--bg-surface)',
                        border: '1px solid var(--border)',
                        color: 'var(--text-muted)',
                        padding: '4px 10px',
                        borderRadius: 6,
                        fontSize: 11,
                        cursor: 'pointer',
                      }}
                      title="Generate new API Key"
                    >
                      <RefreshCw size={12} />
                      <span>Regenerate</span>
                    </button>
                  </div>
                </div>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border)',
                    borderRadius: 8,
                    padding: '6px 12px',
                  }}
                >
                  <code style={{ flex: 1, fontFamily: 'JetBrains Mono, monospace', fontSize: 12.5, color: 'var(--accent)', letterSpacing: '0.04em' }}>
                    {showApiKey ? apiKey : `${apiKey.slice(0, 8)}••••••••••••••••••••••••••••••••`}
                  </code>

                  <button
                    onClick={() => setShowApiKey(!showApiKey)}
                    style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 4 }}
                    title={showApiKey ? 'Hide API Key' : 'Reveal API Key'}
                  >
                    {showApiKey ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>

                  <button
                    onClick={handleCopyKey}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                      background: 'var(--accent)',
                      color: '#fff',
                      border: 'none',
                      borderRadius: 6,
                      padding: '4px 10px',
                      fontSize: 11.5,
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    {copiedKey ? <Check size={13} /> : <Copy size={13} />}
                    <span>{copiedKey ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
              </div>

              {/* API Endpoint & Live Test */}
              <div
                style={{
                  background: 'var(--bg-app)',
                  border: '1px solid var(--border)',
                  borderRadius: 12,
                  padding: 16,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 12,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-base)' }}>
                      Execution API Endpoint
                    </div>
                    <div style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>
                      Send POST requests with <code>{'{ "code": "...", "language": "python" }'}</code>
                    </div>
                  </div>

                  <button
                    onClick={handleTestConnection}
                    disabled={testState.status === 'loading'}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      background: 'linear-gradient(135deg, #10b981, #059669)',
                      color: '#fff',
                      border: 'none',
                      borderRadius: 6,
                      padding: '5px 12px',
                      fontSize: 11.5,
                      fontWeight: 600,
                      cursor: 'pointer',
                      boxShadow: '0 2px 6px rgba(16, 185, 129, 0.3)',
                    }}
                  >
                    <Zap size={13} />
                    <span>{testState.status === 'loading' ? 'Testing...' : 'Test Connection'}</span>
                  </button>
                </div>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border)',
                    borderRadius: 8,
                    padding: '6px 12px',
                  }}
                >
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#38bdf8', background: 'rgba(56, 189, 248, 0.1)', padding: '2px 6px', borderRadius: 4 }}>POST</span>
                  <code style={{ flex: 1, fontFamily: 'JetBrains Mono, monospace', fontSize: 12, color: 'var(--text-base)' }}>
                    {baseUrl}
                  </code>
                  <button
                    onClick={handleCopyUrl}
                    style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 4 }}
                    title="Copy URL"
                  >
                    {copiedUrl ? <Check size={14} style={{ color: '#10b981' }} /> : <Copy size={14} />}
                  </button>
                </div>

                {/* Test Feedback Result */}
                {testState.status !== 'idle' && (
                  <div
                    style={{
                      background: testState.status === 'success' ? 'rgba(16, 185, 129, 0.08)' : testState.status === 'error' ? 'rgba(239, 68, 68, 0.08)' : 'var(--bg-surface)',
                      border: `1px solid ${testState.status === 'success' ? 'rgba(16, 185, 129, 0.3)' : testState.status === 'error' ? 'rgba(239, 68, 68, 0.3)' : 'var(--border)'}`,
                      borderRadius: 8,
                      padding: 10,
                      fontSize: 12,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600, color: testState.status === 'success' ? '#10b981' : testState.status === 'error' ? '#ef4444' : 'var(--text-base)' }}>
                      {testState.status === 'success' && <CheckCircle2 size={15} />}
                      {testState.status === 'error' && <AlertCircle size={15} />}
                      <span>{testState.message}</span>
                    </div>
                    {testState.output && (
                      <pre style={{ margin: '6px 0 0', fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: 'var(--text-muted)', whiteSpace: 'pre-wrap' }}>
                        {testState.output}
                      </pre>
                    )}
                  </div>
                )}
              </div>

              {/* Ready-to-copy code snippets */}
              <div
                style={{
                  background: 'var(--bg-app)',
                  border: '1px solid var(--border)',
                  borderRadius: 12,
                  padding: 16,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 12,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-base)' }}>
                    Drop-in Code Snippets for Your Projects
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    {(['python', 'node', 'curl', 'next', 'go'] as const).map(lang => (
                      <button
                        key={lang}
                        onClick={() => setSnippetLang(lang)}
                        style={{
                          background: snippetLang === lang ? 'var(--accent)' : 'var(--bg-card)',
                          color: snippetLang === lang ? '#fff' : 'var(--text-muted)',
                          border: '1px solid',
                          borderColor: snippetLang === lang ? 'var(--accent)' : 'var(--border)',
                          borderRadius: 6,
                          padding: '3px 8px',
                          fontSize: 11,
                          fontWeight: 600,
                          cursor: 'pointer',
                          textTransform: 'uppercase',
                        }}
                      >
                        {lang}
                      </button>
                    ))}

                    <button
                      onClick={handleCopySnippet}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4,
                        background: 'var(--bg-surface)',
                        border: '1px solid var(--border)',
                        color: 'var(--text-base)',
                        padding: '3px 9px',
                        borderRadius: 6,
                        fontSize: 11,
                        cursor: 'pointer',
                      }}
                      title="Copy code snippet"
                    >
                      {copiedSnippet ? <Check size={12} style={{ color: '#10b981' }} /> : <Copy size={12} />}
                      <span>{copiedSnippet ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                </div>

                <pre
                  style={{
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border)',
                    borderRadius: 8,
                    padding: 14,
                    fontFamily: 'JetBrains Mono, monospace',
                    fontSize: 11.5,
                    lineHeight: 1.6,
                    color: 'var(--text-base)',
                    overflowX: 'auto',
                    margin: 0,
                  }}
                >
                  {getCodeSnippet()}
                </pre>
              </div>
            </div>
          )}

          {/* ── TAB 2: Secrets & Environment Variables ─────────────────────── */}
          {activeTab === 'secrets' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Add New Secret Form */}
              <div
                style={{
                  background: 'var(--bg-app)',
                  border: '1px solid var(--border)',
                  borderRadius: 12,
                  padding: 16,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 10,
                }}
              >
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-base)' }}>
                  Add Environment Variable / Secret
                </div>

                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <input
                    type="text"
                    value={newKey}
                    onChange={(e) => setNewKey(e.target.value)}
                    placeholder="VARIABLE_NAME (e.g. OPENAI_API_KEY)"
                    style={{
                      flex: 1,
                      minWidth: 180,
                      background: 'var(--bg-card)',
                      border: '1px solid var(--border)',
                      borderRadius: 6,
                      padding: '6px 12px',
                      fontSize: 12,
                      color: 'var(--text-base)',
                      fontFamily: 'JetBrains Mono, monospace',
                      outline: 'none',
                    }}
                  />

                  <input
                    type="text"
                    value={newValue}
                    onChange={(e) => setNewValue(e.target.value)}
                    placeholder="Secret value (e.g. sk-...)"
                    style={{
                      flex: 1.5,
                      minWidth: 180,
                      background: 'var(--bg-card)',
                      border: '1px solid var(--border)',
                      borderRadius: 6,
                      padding: '6px 12px',
                      fontSize: 12,
                      color: 'var(--text-base)',
                      outline: 'none',
                    }}
                  />

                  <button
                    onClick={handleAddSecret}
                    disabled={!newKey.trim()}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 5,
                      background: 'var(--accent)',
                      color: '#fff',
                      border: 'none',
                      borderRadius: 6,
                      padding: '6px 14px',
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: newKey.trim() ? 'pointer' : 'not-allowed',
                      opacity: newKey.trim() ? 1 : 0.6,
                    }}
                  >
                    <Plus size={14} />
                    <span>Add Secret</span>
                  </button>
                </div>

                {/* Quick Presets */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginTop: 4 }}>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Quick Presets:</span>
                  {[
                    { label: '+ OpenAI Key', key: 'OPENAI_API_KEY' },
                    { label: '+ Anthropic Key', key: 'ANTHROPIC_API_KEY' },
                    { label: '+ Database URL', key: 'DATABASE_URL' },
                    { label: '+ Stripe Key', key: 'STRIPE_SECRET_KEY' },
                  ].map(p => (
                    <button
                      key={p.key}
                      onClick={() => setNewKey(p.key)}
                      style={{
                        background: 'var(--bg-surface)',
                        border: '1px solid var(--border)',
                        color: 'var(--text-muted)',
                        borderRadius: 12,
                        padding: '2px 8px',
                        fontSize: 10.5,
                        cursor: 'pointer',
                      }}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Secrets List */}
              <div
                style={{
                  border: '1px solid var(--border)',
                  borderRadius: 12,
                  overflow: 'hidden',
                  background: 'var(--bg-app)',
                }}
              >
                <div
                  style={{
                    padding: '8px 14px',
                    background: 'var(--bg-surface)',
                    borderBottom: '1px solid var(--border)',
                    fontSize: 12,
                    fontWeight: 700,
                    color: 'var(--text-muted)',
                    display: 'flex',
                    justifyContent: 'space-between',
                  }}
                >
                  <span>Configured Variables ({secrets.length})</span>
                  <span>Auto-injected into Python, Node.js, C++, etc.</span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  {secrets.map((item) => {
                    const isVisible = visibleValues[item.key] || false
                    return (
                      <div
                        key={item.key}
                        style={{
                          padding: '10px 14px',
                          borderBottom: '1px solid var(--border)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: 12,
                          fontSize: 12.5,
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 200 }}>
                          <span style={{ fontWeight: 600, color: 'var(--accent)', fontFamily: 'JetBrains Mono, monospace' }}>
                            {item.key}
                          </span>
                        </div>

                        <div style={{ flex: 1, fontFamily: 'JetBrains Mono, monospace', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {item.isSecret && !isVisible
                            ? '••••••••••••••••'
                            : item.value || '(empty)'}
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          {item.isSecret && (
                            <button
                              onClick={() => setVisibleValues(prev => ({ ...prev, [item.key]: !isVisible }))}
                              style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 4 }}
                              title={isVisible ? 'Hide value' : 'Show value'}
                            >
                              {isVisible ? <EyeOff size={14} /> : <Eye size={14} />}
                            </button>
                          )}

                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(item.value)
                              showToast(`✓ Copied ${item.key}`)
                            }}
                            style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 4 }}
                            title="Copy value"
                          >
                            <Copy size={14} />
                          </button>

                          <button
                            onClick={() => handleDeleteSecret(item.key)}
                            style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', padding: 4 }}
                            title="Delete secret"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ── TAB 3: Raw .env File ────────────────────────────────────────── */}
          {activeTab === 'raw' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                Edit your <code>.env</code> file directly on disk. Changes will automatically update environment variables across the compiler.
              </div>

              <textarea
                value={rawEnv}
                onChange={(e) => setRawEnv(e.target.value)}
                style={{
                  width: '100%',
                  height: 320,
                  background: 'var(--bg-app)',
                  border: '1px solid var(--border)',
                  borderRadius: 10,
                  padding: 14,
                  fontFamily: 'JetBrains Mono, monospace',
                  fontSize: 12,
                  lineHeight: 1.6,
                  color: 'var(--text-base)',
                  resize: 'vertical',
                  outline: 'none',
                }}
              />

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                <button
                  onClick={fetchSecrets}
                  style={{
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border)',
                    color: 'var(--text-muted)',
                    borderRadius: 6,
                    padding: '6px 14px',
                    fontSize: 12,
                    cursor: 'pointer',
                  }}
                >
                  Reload from Disk
                </button>
                <button
                  onClick={handleSaveRaw}
                  style={{
                    background: 'var(--accent)',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 6,
                    padding: '6px 18px',
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Save .env File
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default SecretsManagerModal

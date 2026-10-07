import type { ExecutionResult } from './judge0'

export interface Submission {
  id: string
  timestamp: number
  lang: string
  code: string
  stdin: string
  result: ExecutionResult
}

export interface SavedSnippet {
  id: string
  name: string
  lang: string
  code: string
  createdAt: number
}

export interface SavedCode {
  id: string
  name: string
  lang: string
  code: string
  createdAt: number
}

export interface AuthUser {
  id: string
  name: string
  email: string
  initials: string
  provider?: 'github' | 'guest' | 'local'
  login?: string
  avatarUrl?: string
  accessToken?: string
  scopes?: string[]
}

import { encryptPayload, decryptPayload, isEncryptedEnvelope } from './crypto'

const SUBMISSIONS_KEY = 'cf_submissions'
const AUTH_KEY        = 'cf_auth_user'
const SAVED_CODE_KEY  = 'cf_saved_code_history'

// In-memory decrypted cache for instantaneous zero-latency access
const memoryVault = new Map<string, unknown>()

// Pre-hydrate vault at startup from localStorage
function initVault() {
  try {
    const keys = [SUBMISSIONS_KEY, AUTH_KEY, SAVED_CODE_KEY]
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i)
      if (k && (k.startsWith('cf_snippets_') || keys.includes(k))) {
        const raw = localStorage.getItem(k)
        if (raw) {
          if (!isEncryptedEnvelope(raw)) {
            // Legacy plain data: cache and re-encrypt
            try {
              const parsed = JSON.parse(raw)
              memoryVault.set(k, parsed)
              encryptPayload(raw).then(enc => {
                try { localStorage.setItem(k, enc) } catch {}
              })
            } catch {}
          } else {
            // Asynchronously decrypt into memory vault
            decryptPayload(raw).then(decrypted => {
              if (decrypted) {
                try {
                  memoryVault.set(k, JSON.parse(decrypted))
                } catch {}
              }
            })
          }
        }
      }
    }
  } catch {}
}

// Auto-run vault initialization
if (typeof window !== 'undefined') {
  initVault()
}

function load<T>(key: string, fallback: T): T {
  try {
    if (memoryVault.has(key)) {
      return memoryVault.get(key) as T
    }
    const raw = localStorage.getItem(key)
    if (!raw) return fallback

    if (isEncryptedEnvelope(raw)) {
      // If encrypted and not yet in memoryVault, trigger async decryption
      decryptPayload(raw).then(decrypted => {
        if (decrypted) {
          try {
            memoryVault.set(key, JSON.parse(decrypted))
          } catch {}
        }
      })
      return fallback
    }

    const parsed = JSON.parse(raw)
    memoryVault.set(key, parsed)
    // Upgrade to encrypted envelope in background
    encryptPayload(raw).then(enc => {
      try { localStorage.setItem(key, enc) } catch {}
    })
    return parsed
  } catch { return fallback }
}

function save(key: string, value: unknown) {
  try {
    memoryVault.set(key, value)
    const jsonStr = JSON.stringify(value)
    // Encrypt at rest with AES-256-GCM before writing to localStorage
    encryptPayload(jsonStr).then(enc => {
      try {
        localStorage.setItem(key, enc)
      } catch {}
    })
  } catch {}
}

// ── Submissions ────────────────────────────────────────────────────────────
export function getSubmissions(): Submission[] {
  return load<Submission[]>(SUBMISSIONS_KEY, [])
}

export function addSubmission(s: Omit<Submission, 'id'>): Submission {
  const submission = { ...s, id: crypto.randomUUID() }
  const all = [submission, ...getSubmissions()].slice(0, 50) // keep last 50
  save(SUBMISSIONS_KEY, all)
  return submission
}

export function clearSubmissions() {
  save(SUBMISSIONS_KEY, [])
}

export function deleteSubmission(id: string): Submission[] {
  const all = getSubmissions().filter(s => s.id !== id)
  save(SUBMISSIONS_KEY, all)
  return all
}

export function getSavedCodeHistory(): SavedCode[] {
  return load<SavedCode[]>(SAVED_CODE_KEY, [])
}

export function saveCodeSnapshot(name: string, lang: string, code: string): SavedCode {
  const snapshot: SavedCode = { id: crypto.randomUUID(), name, lang, code, createdAt: Date.now() }
  const all = [snapshot, ...getSavedCodeHistory()].slice(0, 50)
  save(SAVED_CODE_KEY, all)
  return snapshot
}

export function deleteSavedCode(id: string): SavedCode[] {
  const all = getSavedCodeHistory().filter(s => s.id !== id)
  save(SAVED_CODE_KEY, all)
  return all
}

// ── Snippets ───────────────────────────────────────────────────────────────
function snippetsKey(userId: string) {
  return `cf_snippets_${userId}`
}

export function getSnippets(userId = 'guest'): SavedSnippet[] {
  return load<SavedSnippet[]>(snippetsKey(userId), [])
}

export function saveSnippet(userId: string, name: string, lang: string, code: string): SavedSnippet {
  const snippet: SavedSnippet = { id: crypto.randomUUID(), name, lang, code, createdAt: Date.now() }
  const all = [snippet, ...getSnippets(userId)]
  save(snippetsKey(userId), all)
  return snippet
}

export function deleteSnippet(userId: string, id: string) {
  save(snippetsKey(userId), getSnippets(userId).filter(s => s.id !== id))
}

export function getAuthUser(): AuthUser | null {
  return load<AuthUser | null>(AUTH_KEY, null)
}

export function setAuthUser(user: AuthUser) {
  save(AUTH_KEY, user)
}

export function clearAuthUser() {
  try { localStorage.removeItem(AUTH_KEY) } catch {}
}

// ── Share link ─────────────────────────────────────────────────────────────
export function encodeShare(lang: string, code: string): string {
  try {
    const payload = JSON.stringify({ lang, code })
    const encoded = btoa(encodeURIComponent(payload))
    return `${window.location.origin}${window.location.pathname}?share=${encoded}`
  } catch { return window.location.href }
}

export function decodeShare(): { lang: string; code: string } | null {
  try {
    const params = new URLSearchParams(window.location.search)
    const encoded = params.get('share')
    if (!encoded) return null
    const payload = JSON.parse(decodeURIComponent(atob(encoded)))
    return payload
  } catch { return null }
}

// ── Download ───────────────────────────────────────────────────────────────
export function downloadCode(filename: string, code: string) {
  const blob = new Blob([code], { type: 'text/plain' })
  const url  = URL.createObjectURL(blob)
  const a    = Object.assign(document.createElement('a'), { href: url, download: filename })
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export async function downloadProjectZip(projectName: string, files: { name: string; code: string }[]) {
  const JSZip = (await import('jszip')).default
  const zip = new JSZip()
  const safeName = (projectName || 'CodeForge-Project').trim().replace(/[^a-zA-Z0-9_-]/g, '_')

  files.forEach(f => {
    zip.file(f.name, f.code)
  })

  const blob = await zip.generateAsync({ type: 'blob' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${safeName}.zip`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

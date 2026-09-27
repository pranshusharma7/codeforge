/**
 * AI Provider & BYOK (Bring Your Own Key / Account) Configuration
 * Allows users to log in with their own Gemini, ChatGPT, Claude, GitHub Copilot,
 * or DeepSeek/Custom credentials so the host server uses zero tokens.
 * All credentials are kept 100% private in browser localStorage.
 */

export type AIProviderId = 'gemini' | 'openai' | 'claude' | 'copilot' | 'custom' | 'builtin'

export interface ModelOption {
  id: string
  name: string
  badge?: string
  description: string
  recommended?: boolean
}

export interface ProviderDefinition {
  id: AIProviderId
  name: string
  company: string
  icon: string
  gradient: string
  accentColor: string
  description: string
  webAppUrl: string
  loginBrand: string
  tierName: string
  keyPlaceholder: string
  keyPrefix?: string
  keyDocUrl: string
  keyDocLabel: string
  models: ModelOption[]
  defaultModel: string
  defaultEndpoint?: string
  supportsCustomEndpoint?: boolean
  freeTierAvailable?: boolean
}

export interface AIAccountSession {
  providerId: AIProviderId
  email: string
  displayName: string
  avatarUrl?: string
  tier: string // e.g. "Gemini Advanced", "ChatGPT Plus", "Claude Pro", "Copilot Pro"
  selectedModel: string
  connectedAt: number
  isActive: boolean
  webAppUrl: string
}

export interface AIChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: number
  model?: string
}

export interface AIChatThread {
  id: string
  providerId: AIProviderId
  accountEmail: string
  title: string
  createdAt: number
  updatedAt: number
  messages: AIChatMessage[]
}

export interface ProviderCredentials {
  apiKey: string
  selectedModel: string
  customEndpoint?: string
  lastVerified?: number
  latencyMs?: number
  queriesUsed: number
}

export interface UserAIConfig {
  activeProvider: AIProviderId
  providers: Record<AIProviderId, ProviderCredentials>
}

export const AI_PROVIDERS: Record<AIProviderId, ProviderDefinition> = {
  gemini: {
    id: 'gemini',
    name: 'Google Gemini',
    company: 'Google AI',
    icon: '✨',
    gradient: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 50%, #9333ea 100%)',
    accentColor: '#38bdf8',
    description: 'Ultra-fast & intelligent multimodal coding. Sign in with Google to use Gemini Advanced & 2.5 Flash.',
    webAppUrl: 'https://gemini.google.com/app',
    loginBrand: 'Continue with Google Gemini',
    tierName: 'Gemini Advanced',
    keyPlaceholder: 'AIzaSy...',
    keyPrefix: 'AIza',
    keyDocUrl: 'https://aistudio.google.com/app/apikey',
    keyDocLabel: 'Google AI Studio',
    freeTierAvailable: true,
    defaultModel: 'gemini-3.8-flash',
    models: [
      { id: 'gemini-3.8-flash', name: 'Gemini 3.8 Flash', badge: 'Latest', description: 'Next-gen frontier reasoning & fast code generation', recommended: true },
      { id: 'gemini-3.7-flash', name: 'Gemini 3.7 Flash', badge: 'Fast', description: 'Advanced coding reasoning & real-time responses' },
      { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', badge: 'Stable', description: 'Multimodal speed & code assistance' },
      { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro', badge: 'Powerhouse', description: 'Deep coding intelligence & complex debugging' },
    ],
  },
  openai: {
    id: 'openai',
    name: 'ChatGPT / OpenAI',
    company: 'OpenAI',
    icon: '⚡',
    gradient: 'linear-gradient(135deg, #064e3b 0%, #10b981 50%, #059669 100%)',
    accentColor: '#10b981',
    description: 'Use your ChatGPT Plus or OpenAI account for GPT-4o, o3-mini and deep algorithmic reasoning.',
    webAppUrl: 'https://chatgpt.com',
    loginBrand: 'Continue with ChatGPT',
    tierName: 'ChatGPT Plus',
    keyPlaceholder: 'sk-proj-... or sk-...',
    keyPrefix: 'sk-',
    keyDocUrl: 'https://platform.openai.com/api-keys',
    keyDocLabel: 'OpenAI Platform',
    freeTierAvailable: false,
    defaultModel: 'gpt-4o',
    models: [
      { id: 'gpt-4o', name: 'GPT-4o', badge: 'Omni', description: 'OpenAI flagship multimodal coding model', recommended: true },
      { id: 'gpt-4o-mini', name: 'GPT-4o Mini', badge: 'Fast & Cheap', description: 'Extremely fast and lightweight' },
      { id: 'o3-mini', name: 'o3-mini', badge: 'Reasoning', description: 'Specialized STEM & programming reasoning' },
      { id: 'o1', name: 'o1', badge: 'Deep Thinker', description: 'Maximum depth reasoning for complex algorithms' },
      { id: 'gpt-4-turbo', name: 'GPT-4 Turbo', badge: 'Classic', description: 'High capability 128k context model' },
    ],
  },
  claude: {
    id: 'claude',
    name: 'Anthropic Claude',
    company: 'Anthropic',
    icon: '🔮',
    gradient: 'linear-gradient(135deg, #7c2d12 0%, #ea580c 50%, #d97706 100%)',
    accentColor: '#fb923c',
    description: 'The premier AI for software engineering, deep architectural refactoring, and code review.',
    webAppUrl: 'https://claude.ai/new',
    loginBrand: 'Continue with Claude',
    tierName: 'Claude Pro',
    keyPlaceholder: 'sk-ant-api03-...',
    keyPrefix: 'sk-ant-',
    keyDocUrl: 'https://console.anthropic.com/settings/keys',
    keyDocLabel: 'Anthropic Console',
    freeTierAvailable: false,
    defaultModel: 'claude-3-7-sonnet-20250219',
    models: [
      { id: 'claude-3-7-sonnet-20250219', name: 'Claude 3.7 Sonnet', badge: 'State of Art', description: 'Hybrid reasoning & coding champion', recommended: true },
      { id: 'claude-3-5-sonnet-20241022', name: 'Claude 3.5 Sonnet', badge: 'Popular', description: 'Industry benchmark for code accuracy' },
      { id: 'claude-3-5-haiku-20241022', name: 'Claude 3.5 Haiku', badge: 'Ultra-fast', description: 'Lightning-fast code completions' },
      { id: 'claude-3-opus-20240229', name: 'Claude 3 Opus', badge: 'Complex', description: 'Deep conceptual analysis' },
    ],
  },
  copilot: {
    id: 'copilot',
    name: 'GitHub Copilot / Models',
    company: 'GitHub / Microsoft',
    icon: '🐙',
    gradient: 'linear-gradient(135deg, #24292e 0%, #4f46e5 50%, #7c3aed 100%)',
    accentColor: '#a78bfa',
    description: 'Sign in with GitHub Copilot to use Copilot Pro and GitHub Models seamlessly.',
    webAppUrl: 'https://github.com/copilot',
    loginBrand: 'Continue with GitHub Copilot',
    tierName: 'Copilot Pro',
    keyPlaceholder: 'ghp_... or github_pat_...',
    keyPrefix: 'gh',
    keyDocUrl: 'https://github.com/settings/tokens',
    keyDocLabel: 'GitHub Settings',
    freeTierAvailable: true,
    defaultModel: 'gpt-4o',
    defaultEndpoint: 'https://models.inference.ai.azure.com/chat/completions',
    models: [
      { id: 'gpt-4o', name: 'GitHub Copilot (GPT-4o)', badge: 'Recommended', description: 'GitHub-optimized GPT-4o engine', recommended: true },
      { id: 'gpt-4o-mini', name: 'Copilot Mini (GPT-4o-mini)', badge: 'Fast', description: 'Rapid feedback and code analysis' },
      { id: 'DeepSeek-R1', name: 'DeepSeek R1 (via GitHub)', badge: 'Open Weights', description: 'Open reasoning model hosted by GitHub' },
      { id: 'Mistral-Large-2407', name: 'Mistral Large 2', badge: 'European AI', description: 'Top-tier multilingual code reasoning' },
    ],
  },
  custom: {
    id: 'custom',
    name: 'Custom / DeepSeek / Ollama',
    company: 'OpenAI Compatible',
    icon: '⚙️',
    gradient: 'linear-gradient(135deg, #1f2937 0%, #374151 50%, #4b5563 100%)',
    accentColor: '#94a3b8',
    description: 'Connect any OpenAI-compatible API endpoint (DeepSeek, OpenRouter, Local Ollama, Groq, Together AI).',
    webAppUrl: 'https://chat.deepseek.com',
    loginBrand: 'Continue with DeepSeek / Custom',
    tierName: 'Custom Tier',
    keyPlaceholder: 'api-key-or-none-for-local',
    keyDocUrl: 'https://ollama.ai/',
    keyDocLabel: 'Ollama Setup',
    defaultModel: 'deepseek-chat',
    defaultEndpoint: 'https://api.deepseek.com/v1/chat/completions',
    supportsCustomEndpoint: true,
    models: [
      { id: 'deepseek-chat', name: 'DeepSeek V3', badge: 'Cost Efficient', description: 'DeepSeek 671B model', recommended: true },
      { id: 'deepseek-reasoner', name: 'DeepSeek R1', badge: 'Chain-of-thought', description: 'Full reasoning trace for algorithms' },
      { id: 'llama3:latest', name: 'Local Ollama (Llama 3)', badge: 'Local / Offline', description: 'Runs on localhost:11434 with 0 latency cost' },
      { id: 'custom-model', name: 'Custom Model ID', badge: 'User Defined', description: 'Specify any model ID supported by your endpoint' },
    ],
  },
  builtin: {
    id: 'builtin',
    name: 'CodeForge Free Companion',
    company: 'Built-in Demo',
    icon: '🛡️',
    gradient: 'linear-gradient(135deg, #312e81 0%, #4338ca 100%)',
    accentColor: '#818cf8',
    description: 'Built-in companion with 20 free monthly queries.',
    webAppUrl: '',
    loginBrand: 'Continue with CodeForge Free',
    tierName: 'Free Tier',
    keyPlaceholder: 'No key needed',
    keyDocUrl: '',
    keyDocLabel: 'No key required',
    freeTierAvailable: true,
    defaultModel: 'built-in',
    models: [
      { id: 'built-in', name: 'CodeForge Assistant', badge: 'Default', description: 'Fast code helper with monthly limits', recommended: true },
    ],
  },
}

const STORAGE_KEY = 'cf_user_ai_config_v2'
const ACCOUNTS_STORAGE_KEY = 'cf_ai_account_sessions_v1'
const THREADS_STORAGE_KEY_PREFIX = 'cf_ai_threads_v1_'

export function getAIAccountSessions(): AIAccountSession[] {
  try {
    const raw = localStorage.getItem(ACCOUNTS_STORAGE_KEY)
    if (!raw) return []
    return JSON.parse(raw) as AIAccountSession[]
  } catch {
    return []
  }
}

export function getActiveAIAccount(): AIAccountSession | null {
  const sessions = getAIAccountSessions()
  return sessions.find(s => s.isActive) || sessions[0] || null
}

export function saveAIAccountSession(session: AIAccountSession): void {
  try {
    const existing = getAIAccountSessions().filter(s => s.providerId !== session.providerId)
    // Mark previous active as inactive if this one is active
    const updated = session.isActive ? existing.map(s => ({ ...s, isActive: false })) : existing
    updated.push(session)
    localStorage.setItem(ACCOUNTS_STORAGE_KEY, JSON.stringify(updated))

    // Also sync with activeProvider in config
    const config = getUserAIConfig()
    if (session.isActive) {
      config.activeProvider = session.providerId
      saveUserAIConfig(config)
    }

    window.dispatchEvent(new CustomEvent('cf_ai_session_changed', { detail: session }))
  } catch (err) {
    console.error('Failed to save AI account session', err)
  }
}

export function removeAIAccountSession(providerId: AIProviderId): void {
  try {
    const sessions = getAIAccountSessions().filter(s => s.providerId !== providerId)
    if (sessions.length > 0 && !sessions.some(s => s.isActive)) {
      sessions[0].isActive = true
    }
    localStorage.setItem(ACCOUNTS_STORAGE_KEY, JSON.stringify(sessions))

    const active = sessions.find(s => s.isActive)
    const config = getUserAIConfig()
    config.activeProvider = active ? active.providerId : 'builtin'
    saveUserAIConfig(config)

    window.dispatchEvent(new CustomEvent('cf_ai_session_changed', { detail: null }))
  } catch (err) {
    console.error('Failed to remove AI account session', err)
  }
}

export function switchActiveAIAccount(providerId: AIProviderId): void {
  try {
    const sessions = getAIAccountSessions().map(s => ({
      ...s,
      isActive: s.providerId === providerId,
    }))
    localStorage.setItem(ACCOUNTS_STORAGE_KEY, JSON.stringify(sessions))

    const config = getUserAIConfig()
    config.activeProvider = providerId
    saveUserAIConfig(config)

    window.dispatchEvent(new CustomEvent('cf_ai_session_changed', { detail: sessions.find(s => s.isActive) }))
  } catch (err) {
    console.error('Failed to switch AI account', err)
  }
}

// ── Per-Account Chat Thread Persistence ────────────────────────────────────
function getThreadStorageKey(providerId: string, email: string): string {
  const safeEmail = (email || 'anonymous').toLowerCase().replace(/[^a-z0-9]/g, '_')
  return `${THREADS_STORAGE_KEY_PREFIX}${providerId}_${safeEmail}`
}

export function getAccountThreads(providerId: AIProviderId, email: string): AIChatThread[] {
  try {
    const key = getThreadStorageKey(providerId, email)
    const raw = localStorage.getItem(key)
    if (!raw) return []
    return JSON.parse(raw) as AIChatThread[]
  } catch {
    return []
  }
}

export function saveAccountThread(thread: AIChatThread): void {
  try {
    const key = getThreadStorageKey(thread.providerId, thread.accountEmail)
    const existing = getAccountThreads(thread.providerId, thread.accountEmail)
    const filtered = existing.filter(t => t.id !== thread.id)
    const updated = [thread, ...filtered]
    localStorage.setItem(key, JSON.stringify(updated))
  } catch (err) {
    console.error('Failed to save chat thread', err)
  }
}

export function deleteAccountThread(threadId: string, providerId: AIProviderId, email: string): void {
  try {
    const key = getThreadStorageKey(providerId, email)
    const existing = getAccountThreads(providerId, email)
    const updated = existing.filter(t => t.id !== threadId)
    localStorage.setItem(key, JSON.stringify(updated))
  } catch (err) {
    console.error('Failed to delete chat thread', err)
  }
}

export function createDefaultThreadIfEmpty(providerId: AIProviderId, email: string, initialTitle?: string): AIChatThread {
  const threads = getAccountThreads(providerId, email)
  if (threads.length > 0) return threads[0]

  const pDef = AI_PROVIDERS[providerId] || AI_PROVIDERS.gemini
  const newThread: AIChatThread = {
    id: crypto.randomUUID(),
    providerId,
    accountEmail: email,
    title: initialTitle || `Welcome to ${pDef.name}`,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    messages: [
      {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: `👋 Hello! You are logged in with **${pDef.name}** as \`${email}\`.\n\nAll your chats are saved to your original account profile. How can I help with your code today?`,
        timestamp: Date.now(),
        model: pDef.defaultModel,
      },
    ],
  }
  saveAccountThread(newThread)
  return newThread
}

function getDefaultConfig(): UserAIConfig {
  return {
    activeProvider: 'builtin',
    providers: {
      gemini: { apiKey: '', selectedModel: AI_PROVIDERS.gemini.defaultModel, queriesUsed: 0 },
      openai: { apiKey: '', selectedModel: AI_PROVIDERS.openai.defaultModel, queriesUsed: 0 },
      claude: { apiKey: '', selectedModel: AI_PROVIDERS.claude.defaultModel, queriesUsed: 0 },
      copilot: { apiKey: '', selectedModel: AI_PROVIDERS.copilot.defaultModel, customEndpoint: AI_PROVIDERS.copilot.defaultEndpoint, queriesUsed: 0 },
      custom: { apiKey: '', selectedModel: AI_PROVIDERS.custom.defaultModel, customEndpoint: AI_PROVIDERS.custom.defaultEndpoint, queriesUsed: 0 },
      builtin: { apiKey: '', selectedModel: 'built-in', queriesUsed: 0 },
    },
  }
}

export function getUserAIConfig(): UserAIConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return getDefaultConfig()
    const parsed = JSON.parse(raw) as UserAIConfig
    const defaults = getDefaultConfig()
    return {
      activeProvider: parsed.activeProvider || defaults.activeProvider,
      providers: {
        ...defaults.providers,
        ...parsed.providers,
      },
    }
  } catch {
    return getDefaultConfig()
  }
}

export function saveUserAIConfig(config: UserAIConfig): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config))
    window.dispatchEvent(new CustomEvent('cf_ai_config_changed', { detail: config }))
  } catch (err) {
    console.error('Failed to save AI config to localStorage', err)
  }
}

export function isBYOKActive(): boolean {
  const activeAccount = getActiveAIAccount()
  if (activeAccount && activeAccount.isActive) return true
  const config = getUserAIConfig()
  if (config.activeProvider === 'builtin') return false
  const activeCreds = config.providers[config.activeProvider]
  return Boolean(activeCreds && activeCreds.apiKey.trim().length > 4)
}

export function getActiveProviderSummary(): {
  providerId: AIProviderId
  providerName: string
  modelName: string
  isBYOK: boolean
  accentColor: string
  icon: string
  accountEmail?: string
  tier?: string
} {
  const activeAccount = getActiveAIAccount()
  if (activeAccount && activeAccount.isActive) {
    const p = AI_PROVIDERS[activeAccount.providerId] || AI_PROVIDERS.gemini
    return {
      providerId: activeAccount.providerId,
      providerName: p.name,
      modelName: activeAccount.selectedModel || p.defaultModel,
      isBYOK: true,
      accentColor: p.accentColor,
      icon: p.icon,
      accountEmail: activeAccount.email,
      tier: activeAccount.tier,
    }
  }

  const config = getUserAIConfig()
  const provider = AI_PROVIDERS[config.activeProvider] || AI_PROVIDERS.builtin
  const creds = config.providers[config.activeProvider]
  const isCustomKey = Boolean(creds && creds.apiKey.trim().length > 4)
  const modelName = provider.models.find(m => m.id === creds?.selectedModel)?.name || creds?.selectedModel || provider.defaultModel

  return {
    providerId: config.activeProvider,
    providerName: provider.name,
    modelName,
    isBYOK: isCustomKey && config.activeProvider !== 'builtin',
    accentColor: provider.accentColor,
    icon: provider.icon,
  }
}

export function incrementBYOKUsage(providerId: AIProviderId): void {
  const config = getUserAIConfig()
  if (config.providers[providerId]) {
    config.providers[providerId].queriesUsed = (config.providers[providerId].queriesUsed || 0) + 1
    saveUserAIConfig(config)
  }
}

/**
 * Validates and tests an API key with a fast ping test.
 */
export async function testAIConnection(
  providerId: AIProviderId,
  apiKey: string,
  model?: string,
  customEndpoint?: string
): Promise<{ success: boolean; latencyMs: number; error?: string }> {
  const cleanKey = apiKey.trim()
  if (providerId !== 'builtin' && !cleanKey) {
    return { success: false, latencyMs: 0, error: 'API Key cannot be empty.' }
  }

  const startTime = performance.now()
  const testModel = model || AI_PROVIDERS[providerId].defaultModel
  const pingPrompt = 'Respond with only the single word: "READY"'

  try {
    if (providerId === 'gemini') {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${testModel}:generateContent?key=${encodeURIComponent(cleanKey)}`
      const resp = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: pingPrompt }] }],
          generationConfig: { maxOutputTokens: 10, temperature: 0.1 },
        }),
      })

      const latencyMs = Math.round(performance.now() - startTime)
      if (!resp.ok) {
        const errData = await resp.json().catch(() => ({}))
        return { success: false, latencyMs, error: errData.error?.message || `HTTP ${resp.status}: Gemini API request failed.` }
      }
      return { success: true, latencyMs }
    }

    if (providerId === 'openai') {
      const resp = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${cleanKey}`,
        },
        body: JSON.stringify({
          model: testModel,
          messages: [{ role: 'user', content: pingPrompt }],
          max_tokens: 10,
        }),
      })

      const latencyMs = Math.round(performance.now() - startTime)
      if (!resp.ok) {
        const errData = await resp.json().catch(() => ({}))
        return { success: false, latencyMs, error: errData.error?.message || `HTTP ${resp.status}: OpenAI API request failed.` }
      }
      return { success: true, latencyMs }
    }

    if (providerId === 'claude') {
      const resp = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': cleanKey,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true',
        },
        body: JSON.stringify({
          model: testModel,
          max_tokens: 10,
          messages: [{ role: 'user', content: pingPrompt }],
        }),
      })

      const latencyMs = Math.round(performance.now() - startTime)
      if (!resp.ok) {
        const errData = await resp.json().catch(() => ({}))
        return { success: false, latencyMs, error: errData.error?.message || `HTTP ${resp.status}: Anthropic Claude request failed.` }
      }
      return { success: true, latencyMs }
    }

    if (providerId === 'copilot') {
      const endpoint = customEndpoint || AI_PROVIDERS.copilot.defaultEndpoint || 'https://models.inference.ai.azure.com/chat/completions'
      const resp = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${cleanKey}`,
        },
        body: JSON.stringify({
          model: testModel,
          messages: [{ role: 'user', content: pingPrompt }],
          max_tokens: 10,
        }),
      })

      const latencyMs = Math.round(performance.now() - startTime)
      if (!resp.ok) {
        const errData = await resp.json().catch(() => ({}))
        return { success: false, latencyMs, error: errData.error?.message || `HTTP ${resp.status}: GitHub Models / Copilot connection failed.` }
      }
      return { success: true, latencyMs }
    }

    if (providerId === 'custom') {
      const endpoint = (customEndpoint || AI_PROVIDERS.custom.defaultEndpoint || 'http://localhost:11434/v1/chat/completions').trim()
      const resp = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(cleanKey ? { Authorization: `Bearer ${cleanKey}` } : {}),
        },
        body: JSON.stringify({
          model: testModel,
          messages: [{ role: 'user', content: pingPrompt }],
          max_tokens: 10,
        }),
      })

      const latencyMs = Math.round(performance.now() - startTime)
      if (!resp.ok) {
        const errData = await resp.json().catch(() => ({}))
        return { success: false, latencyMs, error: errData.error?.message || `HTTP ${resp.status}: Custom endpoint request failed.` }
      }
      return { success: true, latencyMs }
    }

    // Built-in
    await new Promise(r => setTimeout(r, 150))
    return { success: true, latencyMs: 150 }
  } catch (error) {
    const latencyMs = Math.round(performance.now() - startTime)
    const msg = error instanceof Error ? error.message : 'Network connection failed'
    return { success: false, latencyMs, error: `Connection failed: ${msg}. Check CORS or API endpoint.` }
  }
}

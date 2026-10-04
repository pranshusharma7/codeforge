export interface GitHubUser {
  id: number
  login: string
  name: string | null
  email: string | null
  avatar_url: string
  bio?: string | null
  public_repos?: number
  html_url?: string
}

export interface GitHubRepository {
  id: number
  name: string
  full_name: string
  private: boolean
  html_url: string
  description: string | null
  updated_at: string
  default_branch: string
  stargazers_count?: number
  forks_count?: number
  language?: string | null
  owner?: {
    login: string
    avatar_url: string
  }
}

export interface RepoTreeItem {
  path: string
  mode: string
  type: 'blob' | 'tree'
  sha: string
  size?: number
}

export interface CommitResult {
  commitSha: string
  commitUrl: string
  fileSha: string
  branch: string
}

export interface GitHubCommitSummary {
  sha: string
  fullSha: string
  message: string
  authorName: string
  authorAvatar?: string
  date: string
  html_url: string
}

export interface DeviceCodeResponse {
  device_code: string
  user_code: string
  verification_uri: string
  expires_in: number
  interval: number
}

const CLIENT_ID = (import.meta.env.VITE_GITHUB_CLIENT_ID as string | undefined)?.trim()
const API_URL = 'https://api.github.com'
const GITHUB_OAUTH_ERRORS = new Set([
  'authorization_pending',
  'slow_down',
  'access_denied',
  'expired_token',
  'incorrect_client_credentials',
  'incorrect_device_code',
  'device_flow_disabled',
  'bad_verification_code',
])

async function postOAuthRequest(url: string, body: Record<string, string>): Promise<{ data: any; status: number }> {
  const controller = new AbortController()
  const timeout = window.setTimeout(() => controller.abort(), 20000)
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal,
    })
    const contentType = response.headers.get('content-type') || ''
    if (contentType.includes('text/html')) {
      return { data: null, status: response.status }
    }
    const data = await response.json().catch(() => null)
    return { data, status: response.status }
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') {
      throw new Error('Connection timed out while contacting GitHub OAuth. Please try again.')
    }
    return { data: null, status: 0 }
  } finally {
    window.clearTimeout(timeout)
  }
}

function getDeviceUrl(): string {
  return '/api/github-device'
}

function getTokenUrl(): string {
  return '/api/github-token'
}

export const githubHeaders = (token?: string) => {
  const headers: Record<string, string> = {
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
  }
  if (token && typeof token === 'string' && token.trim().length > 0) {
    headers.Authorization = `Bearer ${token.trim()}`
  }
  return headers
}

export function isGitHubConfigured(): boolean {
  return Boolean(CLIENT_ID)
}

export function utf8ToBase64(str: string): string {
  const bytes = new TextEncoder().encode(str)
  let binary = ''
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return btoa(binary)
}

export function base64ToUtf8(b64: string): string {
  const clean = b64.replace(/\s/g, '')
  const binary = atob(clean)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return new TextDecoder().decode(bytes)
}

export async function verifyAndLoadGitHubUser(token: string): Promise<GitHubUser> {
  const clean = token.trim()
  if (!clean) throw new Error('Please enter a GitHub Personal Access Token.')
  const response = await fetch(`${API_URL}/user`, { headers: githubHeaders(clean) })
  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('Invalid GitHub token. Please verify your token and scopes (need "repo", "read:user").')
    }
    const err = await response.json().catch(() => ({}))
    throw new Error(err.message || 'Could not connect to GitHub API.')
  }
  return response.json()
}

/**
 * 100% Reliable direct Token Authentication (Works on Local, Vercel & Render without proxy)
 */
export async function authenticateWithToken(token: string): Promise<{
  user: import('./storage').AuthUser
  repos: GitHubRepository[]
}> {
  const clean = token.trim()
  if (!clean) throw new Error('Please enter a GitHub Personal Access Token.')
  const profile = await getGitHubUser(clean)
  const repos = await getGitHubRepositories(clean).catch(() => [])

  const user: import('./storage').AuthUser = {
    id: `github-${profile.id}`,
    name: profile.name ?? profile.login,
    email: profile.email ?? '',
    initials: profile.login.slice(0, 2).toUpperCase(),
    provider: 'github',
    login: profile.login,
    avatarUrl: profile.avatar_url,
    accessToken: clean,
    scopes: profile.scopes,
  }

  return { user, repos }
}

/**
 * 1-Click Guest Developer profile (Zero credentials, never errors, works 100% anywhere)
 */
export function createGuestDevUser(name = 'Developer'): import('./storage').AuthUser {
  const cleanName = name.trim() || 'Developer'
  const handle = cleanName.toLowerCase().replace(/[^a-z0-9_-]/g, '_')
  return {
    id: `dev-${Date.now().toString(36)}`,
    name: cleanName,
    email: `${handle}@codeforge.local`,
    initials: cleanName.slice(0, 2).toUpperCase(),
    provider: 'guest',
    login: handle,
    avatarUrl: `https://api.dicebear.com/7.x/bottts/svg?seed=${handle}`,
  }
}

export const SAMPLE_DEV_REPOSITORIES: GitHubRepository[] = [
  {
    id: 101,
    name: 'algorithms-showcase',
    full_name: 'developer/algorithms-showcase',
    private: false,
    html_url: 'https://github.com',
    description: 'Data structures & algorithms in TypeScript, Python, and C++',
    updated_at: new Date().toISOString(),
    default_branch: 'main',
    stargazers_count: 128,
    forks_count: 42,
    language: 'TypeScript',
    owner: {
      login: 'developer',
      avatar_url: 'https://api.dicebear.com/7.x/bottts/svg?seed=developer',
    },
  },
  {
    id: 102,
    name: 'react-fullstack-starter',
    full_name: 'developer/react-fullstack-starter',
    private: false,
    html_url: 'https://github.com',
    description: 'Fullstack React + Vite + TypeScript application starter template',
    updated_at: new Date().toISOString(),
    default_branch: 'main',
    stargazers_count: 94,
    forks_count: 23,
    language: 'TypeScript',
    owner: {
      login: 'developer',
      avatar_url: 'https://api.dicebear.com/7.x/bottts/svg?seed=developer',
    },
  },
]

export async function startGitHubDeviceFlow(): Promise<DeviceCodeResponse> {
  const clientId = (CLIENT_ID || 'Ov23liOzK7Vzn4ZGcYzY').trim()
  const scope = 'read:user user:email repo workflow'
  const endpoints = [
    '/api/github-device',
    '/api/github-oauth',
    '/api/github-oauth/login/device/code',
  ]

  let lastError = ''
  for (const url of endpoints) {
    try {
      const { data, status } = await postOAuthRequest(url, { client_id: clientId, scope })
      if (data?.device_code && data?.user_code && data?.verification_uri && data?.expires_in) {
        return data as DeviceCodeResponse
      }
      if (data?.error === 'device_flow_disabled') {
        throw new Error('Device flow is not enabled for this GitHub OAuth App. Enable it in the GitHub App settings.')
      }
      if (data?.error_description || data?.error) {
        lastError = data.error_description || data.error
      } else if (status === 404 || status === 0) {
        continue
      }
    } catch (err: any) {
      if (err?.message?.includes('Device flow is not enabled')) throw err
      lastError = err?.message || lastError
    }
  }

  throw new Error(lastError || 'Could not reach GitHub OAuth service. Please check your network and try again.')
}

export async function waitForGitHubToken(device: DeviceCodeResponse): Promise<string> {
  const clientId = (CLIENT_ID || 'Ov23liOzK7Vzn4ZGcYzY').trim()
  const deadline = Date.now() + device.expires_in * 1000
  let interval = Math.max(device.interval, 5) * 1000
  const endpoints = [
    '/api/github-token',
    '/api/github-oauth',
    '/api/github-oauth/login/oauth/access_token',
  ]
  let lastError = ''

  while (Date.now() < deadline) {
    await new Promise(resolve => window.setTimeout(resolve, interval))

    for (const url of endpoints) {
      try {
        const { data, status } = await postOAuthRequest(url, {
          client_id: clientId,
          device_code: device.device_code,
          grant_type: 'urn:ietf:params:oauth:grant-type:device_code',
        })
        if (data?.access_token) return data.access_token as string
        if (data?.error === 'authorization_pending') {
          lastError = ''
          break
        }
        if (data?.error === 'slow_down') {
          interval += 5000
          break
        }
        if (GITHUB_OAUTH_ERRORS.has(data?.error)) {
          throw new Error(data.error_description || data.error)
        }
        if (data?.error_description || data?.error) {
          lastError = data.error_description || data.error
        } else if (status === 404 || status === 0) {
          continue
        }
      } catch (err: any) {
        if (GITHUB_OAUTH_ERRORS.has(err?.message)) throw err
        lastError = err?.message || lastError
      }
    }
  }
  throw new Error(lastError || 'GitHub authorization expired. Please try again.')
}

export async function getGitHubUser(token: string): Promise<GitHubUser & { scopes?: string[] }> {
  const response = await fetch(`${API_URL}/user`, { headers: githubHeaders(token) })
  if (!response.ok) throw new Error('Could not load your GitHub profile.')
  const scopesHeader = response.headers.get('x-oauth-scopes') || ''
  const scopes = scopesHeader
    .split(',')
    .map(s => s.trim())
    .filter(Boolean)
  const profile = await response.json()
  return { ...profile, scopes }
}

export async function getGitHubRepositories(
  token?: string,
  username?: string
): Promise<GitHubRepository[]> {
  const cleanToken = token?.trim()
  const cleanUsername = username?.trim() || 'pranshusharma7'

  // 1. Try authenticated user repos if token is present
  if (cleanToken) {
    try {
      const response = await fetch(
        `${API_URL}/user/repos?sort=updated&per_page=100&affiliation=owner,collaborator,organization_member`,
        { headers: githubHeaders(cleanToken) }
      )
      if (response.ok) {
        const repos = (await response.json()) as GitHubRepository[]
        if (Array.isArray(repos) && repos.length > 0) {
          return repos
        }
      }
    } catch {
      // Continue to public username fallback
    }
  }

  // 2. Fetch public repos for the given username or default 'pranshusharma7'
  if (cleanUsername) {
    try {
      const pubRes = await fetch(
        `${API_URL}/users/${encodeURIComponent(cleanUsername)}/repos?sort=updated&per_page=100`,
        { headers: githubHeaders(cleanToken) }
      )
      if (pubRes.ok) {
        const repos = (await pubRes.json()) as GitHubRepository[]
        if (Array.isArray(repos) && repos.length > 0) {
          return repos
        }
      }
    } catch {
      // Continue to sample repos fallback
    }
  }

  return SAMPLE_DEV_REPOSITORIES
}

export async function createGitHubRepository(
  token: string,
  name: string,
  description: string,
  isPrivate: boolean
): Promise<GitHubRepository> {
  const cleanName = name.trim().replace(/\s+/g, '-')
  if (!cleanName) {
    throw new Error('Please enter a valid repository name.')
  }

  const payload: Record<string, any> = {
    name: cleanName,
    private: isPrivate,
    auto_init: true,
  }
  if (description.trim()) {
    payload.description = description.trim()
  }

  const response = await fetch(`${API_URL}/user/repos`, {
    method: 'POST',
    headers: { ...githubHeaders(token), 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })

  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    let errorDetail = ''
    if (data.errors && Array.isArray(data.errors)) {
      errorDetail = data.errors
        .map((e: any) => e.message || e.field || e.code)
        .filter(Boolean)
        .join(', ')
    }

    if (response.status === 403 || response.status === 404) {
      throw new Error(
        'Permission Denied: Your connected GitHub account does not have "repo" write permissions. Please Sign Out and Sign In again so GitHub can grant the repository permission.'
      )
    }

    if (response.status === 422) {
      throw new Error(
        errorDetail
          ? `Repository error: ${errorDetail}`
          : (data.message || 'A repository with this name already exists on your GitHub account, or the name is invalid.')
      )
    }

    throw new Error(
      errorDetail
        ? `${data.message || 'Repository creation failed'}: ${errorDetail}`
        : (data.message || 'Could not create the repository.')
    )
  }

  return data as GitHubRepository
}

export async function getRepoBranches(token: string | undefined, owner: string, repo: string): Promise<string[]> {
  try {
    const response = await fetch(`${API_URL}/repos/${owner}/${repo}/branches?per_page=100`, {
      headers: githubHeaders(token),
    })
    if (!response.ok) return ['main', 'master']
    const data = await response.json()
    const names = data.map((b: any) => b.name)
    return names.length > 0 ? names : ['main']
  } catch {
    return ['main']
  }
}

export async function getRepoTree(
  token: string | undefined,
  owner: string,
  repo: string,
  branch = 'main'
): Promise<RepoTreeItem[]> {
  const response = await fetch(`${API_URL}/repos/${owner}/${repo}/git/trees/${encodeURIComponent(branch)}?recursive=1`, {
    headers: githubHeaders(token),
  })
  if (!response.ok) {
    // If recursive tree fails, try root contents
    const contentsRes = await fetch(`${API_URL}/repos/${owner}/${repo}/contents?ref=${encodeURIComponent(branch)}`, {
      headers: githubHeaders(token),
    })
    if (!contentsRes.ok) throw new Error(`Could not load tree for ${owner}/${repo} on branch ${branch}`)
    const contents = await contentsRes.json()
    return contents.map((c: any) => ({
      path: c.path,
      mode: '100644',
      type: c.type === 'dir' ? 'tree' : 'blob',
      sha: c.sha,
      size: c.size,
    }))
  }
  const data = await response.json()
  if (!data.tree) return []
  return (data.tree as RepoTreeItem[])
    .filter(item => !item.path.startsWith('.git/'))
    .sort((a, b) => {
      if (a.type !== b.type) return a.type === 'tree' ? -1 : 1
      return a.path.localeCompare(b.path)
    })
}

export async function getRepoFileContent(
  token: string | undefined,
  owner: string,
  repo: string,
  path: string,
  branch?: string
): Promise<{ content: string; sha: string; path: string; name: string; html_url: string }> {
  const cleanPath = path.startsWith('/') ? path.slice(1) : path
  const url = `${API_URL}/repos/${owner}/${repo}/contents/${cleanPath}${branch ? `?ref=${encodeURIComponent(branch)}` : ''}`
  const response = await fetch(url, { headers: githubHeaders(token) })
  if (!response.ok) throw new Error(`Could not load file "${cleanPath}" from GitHub.`)
  const data = await response.json()
  if (data.type !== 'file') throw new Error(`"${cleanPath}" is a directory or submodule, not a single file.`)
  const content = base64ToUtf8(data.content)
  return {
    content,
    sha: data.sha,
    path: data.path,
    name: data.name,
    html_url: data.html_url,
  }
}

export async function commitOrUpdateRepoFile(
  token: string,
  owner: string,
  repo: string,
  path: string,
  content: string,
  message: string,
  branch: string,
  existingSha?: string
): Promise<CommitResult> {
  const cleanPath = path.startsWith('/') ? path.slice(1) : path
  let shaToUse = existingSha

  // If sha is not provided, check if file exists on this branch to avoid conflict
  if (!shaToUse) {
    try {
      const checkRes = await fetch(
        `${API_URL}/repos/${owner}/${repo}/contents/${cleanPath}?ref=${encodeURIComponent(branch)}`,
        { headers: githubHeaders(token) }
      )
      if (checkRes.ok) {
        const existingData = await checkRes.json()
        if (existingData?.sha) shaToUse = existingData.sha
      }
    } catch {
      // File may not exist yet, which is fine
    }
  }

  const url = `${API_URL}/repos/${owner}/${repo}/contents/${cleanPath}`
  const body: any = {
    message: message || `Update ${cleanPath}`,
    content: utf8ToBase64(content),
    branch,
  }
  if (shaToUse) {
    body.sha = shaToUse
  }

  const response = await fetch(url, {
    method: 'PUT',
    headers: {
      ...githubHeaders(token),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })

  const data = await response.json()
  if (!response.ok) {
    throw new Error(data.message || 'Failed to commit file to GitHub repository.')
  }

  return {
    commitSha: data.commit?.sha || '',
    commitUrl: data.commit?.html_url || `https://github.com/${owner}/${repo}/commits/${branch}`,
    fileSha: data.content?.sha || '',
    branch,
  }
}

export async function getRepoCommits(
  token: string,
  owner: string,
  repo: string,
  branch?: string,
  limit = 10
): Promise<GitHubCommitSummary[]> {
  const url = `${API_URL}/repos/${owner}/${repo}/commits?per_page=${limit}${branch ? `&sha=${encodeURIComponent(branch)}` : ''}`
  try {
    const response = await fetch(url, { headers: githubHeaders(token) })
    if (!response.ok) return []
    const data = await response.json()
    return data.map((item: any) => ({
      sha: (item.sha || '').slice(0, 7),
      fullSha: item.sha,
      message: item.commit?.message || 'Commit',
      authorName: item.commit?.author?.name || item.author?.login || 'Committer',
      authorAvatar: item.author?.avatar_url,
      date: item.commit?.author?.date || '',
      html_url: item.html_url,
    }))
  } catch {
    return []
  }
}

export interface BatchCommitItem {
  id?: string
  path: string
  content: string
  existingSha?: string
}

export interface BatchCommitResult {
  total: number
  succeeded: number
  failed: number
  committedFiles: { path: string; fileSha: string; tabId?: string }[]
  errors: { path: string; error: string }[]
  lastCommitSha?: string
  lastCommitUrl?: string
}

export async function commitMultipleRepoFiles(
  token: string,
  owner: string,
  repo: string,
  files: BatchCommitItem[],
  message: string,
  branch: string,
  onProgress?: (current: number, total: number, path: string) => void
): Promise<BatchCommitResult> {
  const result: BatchCommitResult = {
    total: files.length,
    succeeded: 0,
    failed: 0,
    committedFiles: [],
    errors: [],
  }

  for (let i = 0; i < files.length; i++) {
    const f = files[i]
    if (onProgress) {
      onProgress(i + 1, files.length, f.path)
    }

    try {
      const commitRes = await commitOrUpdateRepoFile(
        token,
        owner,
        repo,
        f.path,
        f.content,
        message ? `${message} (${f.path})` : `Update ${f.path}`,
        branch,
        f.existingSha
      )
      result.succeeded++
      result.committedFiles.push({ path: f.path, fileSha: commitRes.fileSha, tabId: f.id })
      result.lastCommitSha = commitRes.commitSha
      result.lastCommitUrl = commitRes.commitUrl
    } catch (err: any) {
      result.failed++
      result.errors.push({ path: f.path, error: err.message || 'Commit failed' })
    }
  }

  return result
}

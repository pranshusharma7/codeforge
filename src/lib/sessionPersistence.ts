/**
 * CodeForge Session Persistence Engine
 * 
 * Ensures workspace state (open tabs, code, folders, active tab, stdin, layout)
 * survives page refreshes. Data is stored in BOTH sessionStorage (per-tab, survives
 * refresh, cleared on tab close) and localStorage (survives tab close, cleared manually).
 * 
 * sessionStorage is the PRIMARY source — it means the workspace is per-browser-tab.
 * localStorage is the FALLBACK for when the user re-opens the site in a new tab.
 * 
 * The user's files will NEVER be lost on refresh. Only explicit close or browser clear
 * will remove the data.
 */

// ── Storage Keys ─────────────────────────────────────────────────────────────
const SESSION_KEY = 'cf_workspace_session'
const LOCAL_KEY = 'cf_workspace_persist'
const LAYOUT_KEY = 'cf_layout_state'

// ── Types ────────────────────────────────────────────────────────────────────
export interface PersistedTab {
  id: string
  name: string
  lang: string
  code: string
  modified?: boolean
  localPath?: string
  // fileHandle cannot be serialized — it will be re-linked on folder open
}

export interface PersistedWorkspace {
  version: number
  tabs: PersistedTab[]
  activeTab: string
  folders: string[]
  workspaceName: string
  stdin: string
  timestamp: number
}

export interface PersistedLayout {
  sideOpen: boolean
  sideW: number
  aiOpen: boolean
  aiW: number
  consH: number
  bottomPanelOpen: boolean
  panel: string
  consTab: string
  fontSize: number
  wordWrap: 'on' | 'off'
  showMini: boolean
}

const CURRENT_VERSION = 1

// ── Debounce Timer ───────────────────────────────────────────────────────────
let saveTimer: ReturnType<typeof setTimeout> | null = null
const SAVE_DEBOUNCE_MS = 500

// ── Save Workspace ───────────────────────────────────────────────────────────
function writeWorkspace(workspace: PersistedWorkspace) {
  const json = JSON.stringify(workspace)
  try {
    sessionStorage.setItem(SESSION_KEY, json)
  } catch (e) {
    console.warn('[Persistence] sessionStorage write failed:', e)
  }
  try {
    localStorage.setItem(LOCAL_KEY, json)
  } catch (e) {
    console.warn('[Persistence] localStorage write failed:', e)
  }
}

/**
 * Immediately persist the current workspace state (used in beforeunload).
 */
export function flushWorkspaceNow(
  tabs: PersistedTab[],
  activeTab: string,
  folders: string[],
  workspaceName: string,
  stdin: string,
) {
  const workspace: PersistedWorkspace = {
    version: CURRENT_VERSION,
    tabs: tabs.map(t => ({
      id: t.id,
      name: t.name,
      lang: t.lang,
      code: t.code,
      modified: t.modified,
      localPath: t.localPath,
    })),
    activeTab,
    folders,
    workspaceName,
    stdin,
    timestamp: Date.now(),
  }
  writeWorkspace(workspace)
}

/**
 * Debounced workspace persistence — call this on every state change.
 * Coalesces rapid updates into a single write after SAVE_DEBOUNCE_MS.
 */
export function persistWorkspace(
  tabs: PersistedTab[],
  activeTab: string,
  folders: string[],
  workspaceName: string,
  stdin: string,
) {
  if (saveTimer) clearTimeout(saveTimer)
  saveTimer = setTimeout(() => {
    flushWorkspaceNow(tabs, activeTab, folders, workspaceName, stdin)
  }, SAVE_DEBOUNCE_MS)
}

/**
 * Restore workspace state. Tries sessionStorage first (same tab),
 * then falls back to localStorage (returning visitor).
 */
export function restoreWorkspace(): PersistedWorkspace | null {
  try {
    // Priority 1: sessionStorage (same tab, survives refresh)
    const sessionData = sessionStorage.getItem(SESSION_KEY)
    if (sessionData) {
      const parsed = JSON.parse(sessionData) as PersistedWorkspace
      if (parsed.version === CURRENT_VERSION && parsed.tabs && parsed.tabs.length > 0) {
        return parsed
      }
    }
  } catch {}

  try {
    // Priority 2: localStorage (returning visitor, new tab)
    const localData = localStorage.getItem(LOCAL_KEY)
    if (localData) {
      const parsed = JSON.parse(localData) as PersistedWorkspace
      if (parsed.version === CURRENT_VERSION && parsed.tabs && parsed.tabs.length > 0) {
        // Only use localStorage data if it's less than 7 days old
        const sevenDays = 7 * 24 * 60 * 60 * 1000
        if (Date.now() - parsed.timestamp < sevenDays) {
          return parsed
        }
      }
    }
  } catch {}

  return null
}

/**
 * Clear all persisted workspace data.
 */
export function clearPersistedWorkspace() {
  try { sessionStorage.removeItem(SESSION_KEY) } catch {}
  try { localStorage.removeItem(LOCAL_KEY) } catch {}
}

// ── Layout Persistence ───────────────────────────────────────────────────────
export function persistLayout(layout: PersistedLayout) {
  try {
    localStorage.setItem(LAYOUT_KEY, JSON.stringify(layout))
  } catch {}
}

export function restoreLayout(): PersistedLayout | null {
  try {
    const raw = localStorage.getItem(LAYOUT_KEY)
    if (raw) return JSON.parse(raw) as PersistedLayout
  } catch {}
  return null
}

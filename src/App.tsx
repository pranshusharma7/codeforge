import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import MonacoEditor, { useMonaco } from '@monaco-editor/react'
import { LANGUAGES, getLangById } from './lib/languages'
import { executeCode, statusLabel } from './lib/judge0'
import { generateAIResponse, type AIMessage, type AIAction } from './lib/aiResponses'
import { aiProviderLabel, isLiveAI } from './engine/ai'
import { createGitHubRepository, getGitHubRepositories, getGitHubUser, type GitHubRepository } from './lib/github'
import SourceControlPanel, { type TabWithRepo } from './components/SourceControlPanel'
import SettingsModal from './components/SettingsModal'
import GitHubAuthModal from './components/GitHubAuthModal'
import UpgradeProModal from './components/UpgradeProModal'
import FileIcon from './components/FileIcon'
import AIAppPanel from './components/AIAppPanel'
import VSCodeTerminal from './components/VSCodeTerminal'
import { assembleWebProject } from './lib/webBundle'
import {
  isBYOKActive,
  getActiveProviderSummary,
  getUserAIConfig,
  saveUserAIConfig,
  AI_PROVIDERS,
} from './lib/aiConfig'
import {
  GitBranchIcon, RepoIcon, PaletteIcon, ShareIcon, DownloadIcon, SaveIcon,
  FolderIcon, FilePlusIcon, FolderPlusIcon, FileOpenIcon, FolderOpenIcon, TrashIcon, RefreshIcon, ChevronDown, GithubIcon,
  CollapseAllIcon, TerminalIcon, XIcon, TrophyIcon,
} from './components/icons'
import { ContestHubModal } from './components/contest/ContestHubModal'
import { ContestPage } from './components/contest/ContestPage'
import { EventsLandingPage } from './components/events/EventsLandingPage'
import { PreContestCheckModal } from './components/contest/PreContestCheckModal'
import { ContestArena } from './components/contest/ContestArena'
import type { Contest, ContestProblem } from './lib/contestTypes'
import { registerMonacoThemes, DEFAULT_THEME_ID, getThemeById, applyThemeToDocument, getThemeUIColors } from './lib/themes'
import {
  getSavedCodeHistory, saveCodeSnapshot, deleteSavedCode, getSnippets, saveSnippet, deleteSnippet,
  encodeShare, decodeShare, downloadCode, downloadProjectZip, getAuthUser, setAuthUser, clearAuthUser,
  type AuthUser,
  type SavedCode, type SavedSnippet,
} from './lib/storage'
import DebuggerPanel from './components/DebuggerPanel'
import FloatingDebugBar from './components/FloatingDebugBar'
import DebugConsole, { type DebugConsoleLog } from './components/DebugConsole'
import { generateExecutionTrace, evaluateWatchExpression, type DebugStep, type WatchItem } from './engine/debugger'
import type { ExecutionResult } from './lib/judge0'
import { getEditorFontById, DEFAULT_FONT_ID } from './lib/fonts'
import logoImg from './assets/logo.png'
import LeetCodeRunner from './components/LeetCodeRunner'
import {
  isFileSystemAccessSupported,
  openFilesFromDisk,
  saveToLocalDisk,
  saveAsLocalDisk,
} from './lib/fileSystemAccess'

// ── Types ──────────────────────────────────────────────────────────────────
type Tab = TabWithRepo
type Panel = 'explorer' | 'history' | 'source-control' | 'profile' | 'debug'
type ConsoleTab = 'terminal' | 'testcase' | 'output' | 'aisugg' | 'debug' | 'dsa'

// ── Monaco themes registered from src/lib/themes.ts ──────────────────────

// ── Markdown renderer ────────────────────────────────────────────────────
function renderMd(md: string): string {
  return md
    .replace(/```(\w*)\n([\s\S]*?)```/g, (_, _l, code) =>
      `<pre class="ai-pre"><code>${code.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</code></pre>`)
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`([^`]+)`/g, '<code class="ai-ic">$1</code>')
    .replace(/^### (.+)$/gm, '<div class="ai-h3">$1</div>')
    .replace(/^## (.+)$/gm, '<div class="ai-h2">$1</div>')
    .replace(/^# (.+)$/gm, '<div class="ai-h1">$1</div>')
    .replace(/^- (.+)$/gm, '<li>$1</li>')
    .replace(/(<li>.*<\/li>\n?)+/gs, m => `<ul class="ai-ul">${m}</ul>`)
    .replace(/---/g, '<hr class="ai-hr"/>')
    .replace(/\n\n/g, '<br/><br/>')
}

// ── Icon ─────────────────────────────────────────────────────────────────
const I = ({ d, s = 14, sw = 1.4 }: { d: string | string[]; s?: number; sw?: number }) => (
  <svg width={s} height={s} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
    {(Array.isArray(d) ? d : [d]).map((p, i) => <path key={i} d={p} />)}
  </svg>
)

// ── Quick actions ─────────────────────────────────────────────────────────
const ACTIONS: { label: string; action: AIAction; icon: string; color: string }[] = [
  { label: 'Explain',  action: 'explain',  icon: '🔍', color: '#58a6ff' },
  { label: 'Fix Bug',  action: 'fix',      icon: '🐛', color: '#f85149' },
  { label: 'Optimize', action: 'optimize', icon: '⚡', color: '#d29922' },
  { label: 'Review',   action: 'review',   icon: '👁', color: '#7c3aed' },
  { label: 'Comments', action: 'comment',  icon: '📝', color: '#3fb950' },
  { label: 'Tests',    action: 'tests',    icon: '🧪', color: '#f0883e' },
  { label: 'Build',    action: 'generate', icon: '⌘', color: '#3fb950' },
]

const COMMANDS = [
  { id: 'run', label: 'Run Code', detail: 'Execute the active file', key: 'Ctrl Enter', icon: '▶' },
  { id: 'save', label: 'Save File (Ctrl+S)', detail: 'Directly save changes to computer disk file', key: 'Ctrl S', icon: '💾' },
  { id: 'save-as', label: 'Save As... (Choose Location)', detail: 'Save code to a chosen file on local disk', key: 'Ctrl Shift S', icon: '📁' },
  { id: 'new', label: 'New File', detail: 'Create a new editor tab', key: 'Ctrl N', icon: '+' },
  { id: 'new-folder', label: 'New Folder', detail: 'Create a new folder in workspace', key: '', icon: '🗂️' },
  { id: 'open-file', label: 'Open File from Computer', detail: 'Open code file with direct disk saving', key: 'Ctrl O', icon: '📄' },
  { id: 'open-folder', label: 'Open Project / Folder', detail: 'Open local directory with direct disk saving', key: '', icon: '📁' },
  { id: 'format', label: 'Format Document', detail: 'Format the active file', key: 'Alt Shift F', icon: '✦' },
  { id: 'find', label: 'Find in Editor', detail: 'Search within the active file', key: 'Ctrl F', icon: '/' },
  { id: 'explorer', label: 'Show Explorer', detail: 'Open the file explorer', key: '', icon: '▤' },
  { id: 'history', label: 'Show Recent Saves', detail: 'Browse saved code snapshots', key: '', icon: '◷' },
  { id: 'ai', label: 'Toggle AI Panel', detail: 'Show or hide CodeForge AI', key: 'Ctrl Shift A', icon: '✧' },
  { id: 'source-control', label: 'Open Source Control', detail: 'Review changes and branches', key: '', icon: '⑂' },
  { id: 'themes', label: 'VS Code Themes', detail: 'Choose from 15 iconic VS Code themes', key: '', icon: '🎨' },
  { id: 'repos', label: 'GitHub Repositories', detail: 'Manage repositories and commit code', key: '', icon: '📦' },
  { id: 'settings', label: 'Open Settings', detail: 'Configure the editor', key: '', icon: '⚙' },
  { id: 'shortcuts', label: 'Keyboard Shortcuts', detail: 'View all editor shortcuts', key: '?', icon: '⌨' },
]

type RuntimeLanguage = typeof LANGUAGES[number]

const EXT_MAP: Record<string, string> = {
  json: 'json',
  md: 'markdown',
  markdown: 'markdown',
  yaml: 'yaml',
  yml: 'yaml',
  xml: 'xml',
  svg: 'xml',
  toml: 'toml',
  ini: 'toml',
  txt: 'plaintext',
  log: 'plaintext',
  env: 'plaintext',
  gitignore: 'plaintext',
  dockerignore: 'plaintext',
  dockerfile: 'dockerfile',
  graphql: 'graphql',
  gql: 'graphql',
  js: 'javascript',
  mjs: 'javascript',
  cjs: 'javascript',
  jsx: 'javascript',
  ts: 'typescript',
  mts: 'typescript',
  cts: 'typescript',
  tsx: 'typescript',
  py: 'python',
  pyw: 'python',
  c: 'c',
  h: 'c',
  cpp: 'cpp',
  cc: 'cpp',
  cxx: 'cpp',
  hpp: 'cpp',
  hxx: 'cpp',
  cs: 'csharp',
  java: 'java',
  go: 'go',
  rs: 'rust',
  rb: 'ruby',
  php: 'php',
  html: 'html',
  htm: 'html',
  css: 'css',
  scss: 'css',
  sass: 'css',
  less: 'css',
  sh: 'bash',
  bash: 'bash',
  zsh: 'bash',
  sql: 'sql',
  kt: 'kotlin',
  swift: 'swift',
  dart: 'dart',
  lua: 'lua',
}

const detectLanguage = (filename: string): RuntimeLanguage => {
  const lower = filename.trim().toLowerCase()
  if (lower === 'dockerfile') return getLangById('dockerfile')
  const ext = lower.split('.').pop() ?? ''
  const mappedId = EXT_MAP[ext]
  if (mappedId) return getLangById(mappedId)
  return LANGUAGES.find(language => language.ext.toLowerCase() === ext) ?? getLangById('plaintext')
}

const MAX_FREE_MONTHLY_AI = 20

function getCurrentMonthKey() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

function getAiUsageForUser(userId: string): number {
  try {
    const val = localStorage.getItem(`cf_ai_usage_${userId}_${getCurrentMonthKey()}`)
    return val ? parseInt(val, 10) : 0
  } catch {
    return 0
  }
}

function checkUserIsPro(userId: string): boolean {
  try {
    return localStorage.getItem(`cf_is_pro_${userId}`) === 'true'
  } catch {
    return false
  }
}

const DEFAULT_STARTER_TAB: Tab = {
  id: 'starter-main-py',
  name: 'main.py',
  lang: 'python',
  code: `# Welcome to CodeForge — Online Code Compiler & IDE!
# Multi-language compiler, Monaco editor, LeetCode runner & AI copilot.

def solve():
    message = "Hello, World from CodeForge!"
    print(f"🚀 {message}")
    
    numbers = [3, 1, 4, 1, 5, 9, 2, 6, 5]
    print(f"Sorted numbers: {sorted(numbers)}")
    print("Execution is ready: Python, C++, Java, JS, Rust & more.")

if __name__ == "__main__":
    solve()
`,
}

// ── App ────────────────────────────────────────────────────────────────────
export default function App() {
  const monaco = useMonaco()

  // editor
  const [tabs, setTabs]         = useState<Tab[]>([DEFAULT_STARTER_TAB])
  const [activeTab, setActiveTab] = useState('starter-main-py')
  const [fontSize, setFontSize]   = useState(14)
  const [wordWrap, setWordWrap]   = useState<'on'|'off'>('off')
  const [showMini, setShowMini]   = useState(false)

  // layout
  const [panel, setPanel]           = useState<Panel>('explorer')
  const [sideOpen, setSideOpen]     = useState(true)
  const [sideW, setSideW]           = useState(240)
  const [aiOpen, setAiOpen]         = useState(true)
  const [aiW, setAiW]               = useState(340)
  const [consH, setConsH]           = useState(220)
  const [consTab, setConsTab]       = useState<ConsoleTab>('output')
  const [bottomPanelOpen, setBottomPanelOpen] = useState(false)
  const [newFileOpen, setNewFileOpen] = useState(false)
  const [newFileName, setNewFileName] = useState('main.py')
  const [newFolderOpen, setNewFolderOpen] = useState(false)
  const [newFolderName, setNewFolderName] = useState('')
  const [newFileParentFolder, setNewFileParentFolder] = useState('')
  const [folders, setFolders] = useState<string[]>([])
  const [collapsedFolders, setCollapsedFolders] = useState<Record<string, boolean>>({})
  const [workspaceName, setWorkspaceName] = useState('CodeForge')
  const [workspaceExpanded, setWorkspaceExpanded] = useState(true)
  const [inlineItem, setInlineItem] = useState<{ type: 'file' | 'folder'; parentFolder: string } | null>(null)
  const [inlineName, setInlineName] = useState('')
  const [fileMenuOpen, setFileMenuOpen] = useState(false)
  const [downloadMenuOpen, setDownloadMenuOpen] = useState(false)
  const downloadMenuRef = useRef<HTMLDivElement>(null)
  const [moreActionsOpen, setMoreActionsOpen] = useState(false)
  const [blankContextMenu, setBlankContextMenu] = useState<{ x: number; y: number; folder?: string } | null>(null)
  const [folderContextMenu, setFolderContextMenu] = useState<{ x: number; y: number; folder: string } | null>(null)

  // execution
  const [stdin, setStdin]     = useState('')
  const [result, setResult]   = useState<ExecutionResult | null>(null)
  const [running, setRunning] = useState(false)

  // AI
  const [msgs, setMsgs]         = useState<AIMessage[]>([{
    id: '0', role: 'assistant', timestamp: new Date(), action: 'chat',
    content: `## Your coding companion\n\nContext-aware help for your workspace. Choose an action above or ask about your code below.`,
  }])
  const [aiInput, setAiInput]   = useState('')
  const [aiThink, setAiThink]   = useState(false)

  // persistence
  const [savedCodes, setSavedCodes] = useState<SavedCode[]>([])
  const [snips, setSnips]   = useState<SavedSnippet[]>([])
  const [snipName, setSnipName]   = useState('')
  const [showSnipModal, setShowSnipModal] = useState(false)
  const [showShare, setShowShare]   = useState(false)
  const [shareLink, setShareLink]   = useState('')
  const [copied, setCopied]         = useState(false)
  const [openMenuOpen, setOpenMenuOpen]   = useState(false)
  const openMenuRef                       = useRef<HTMLDivElement>(null)
  const [showSettings, setShowSettings]   = useState(false)
  const [settingsTab, setSettingsTab]     = useState<'editor' | 'themes' | 'repos' | 'profile'>('editor')
  const [editorTheme, setEditorTheme]     = useState<string>(() => {
    try { return localStorage.getItem('cf_editor_theme') || DEFAULT_THEME_ID } catch { return DEFAULT_THEME_ID }
  })
  const [editorFont, setEditorFont]       = useState<string>(() => {
    try { return localStorage.getItem('cf_editor_font') || DEFAULT_FONT_ID } catch { return DEFAULT_FONT_ID }
  })
  const [editorFontColor, setEditorFontColor] = useState<string>(() => {
    try { return localStorage.getItem('cf_editor_font_color') || 'default' } catch { return 'default' }
  })
  const [fontLigatures, setFontLigatures] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('cf_editor_ligatures')
      return saved !== null ? saved === 'true' : true
    } catch { return true }
  })
  const [showKeys, setShowKeys]           = useState(false)
  const [showAuth, setShowAuth]           = useState(false)
  const [activeRepo, setActiveRepo]       = useState<GitHubRepository | null>(null)
  const [repositories, setRepositories]  = useState<GitHubRepository[]>([])
  const [showCommands, setShowCommands]   = useState(false)
  const [commandQuery, setCommandQuery]   = useState('')
  const [authUser, setAuthUserState]      = useState<AuthUser | null>(null)
  const [toast, setToast] = useState<string|null>(null)

  // Contest & Assessment Proctoring state
  const [viewMode, setViewMode] = useState<'editor' | 'contests'>('editor')
  const [isContestHubOpen, setIsContestHubOpen] = useState(false)
  const [selectedContestForCheck, setSelectedContestForCheck] = useState<Contest | null>(null)
  const [activeContestArena, setActiveContestArena] = useState<{
    contest: Contest
    session: any
    mediaTracks: { videoTrack: MediaStreamTrack | null; screenTrack: MediaStreamTrack | null; audioTrack: MediaStreamTrack | null }
  } | null>(null)

  // Debugger states
  const [isDebugging, setIsDebugging]           = useState(false)
  const [activeDebugLine, setActiveDebugLine]   = useState<number | null>(null)
  const [breakpoints, setBreakpoints]           = useState<number[]>([4])
  const [debugSteps, setDebugSteps]             = useState<DebugStep[]>([])
  const [currentStepIdx, setCurrentStepIdx]     = useState<number>(0)
  const [isAutoPlaying, setIsAutoPlaying]       = useState<boolean>(false)
  const [playSpeed, setPlaySpeed]               = useState<number>(900)
  const [watches, setWatches]                   = useState<WatchItem[]>([
    { id: '1', expression: 'x', value: 'undefined' },
    { id: '2', expression: 'count', value: 'undefined' }
  ])
  const [debugLogs, setDebugLogs]               = useState<DebugConsoleLog[]>([
    {
      id: 'init-1',
      type: 'info',
      text: 'CodeForge Debugger ready. Set breakpoints in code gutter and press F5.',
      timestamp: new Date().toLocaleTimeString()
    }
  ])
  const autoPlayTimerRef                        = useRef<any>(null)
  const decorationsRef                          = useRef<string[]>([])

  // Right-click context menu for file operations
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; fileId: string; fileName: string; isFolder?: boolean } | null>(null)
  const [renameTarget, setRenameTarget] = useState<{ id: string; name: string } | null>(null)
  const [renameValue, setRenameValue] = useState('')
  // Editor right-click context menu
  const [editorCtxMenu, setEditorCtxMenu] = useState<{ x: number; y: number } | null>(null)

  // refs
  const editorRef     = useRef<any>(null)
  const codeTimerRef  = useRef<any>(null)
  const activeCodeRef = useRef<string>(tabs[0]?.code ?? '')
  const handleRunRef  = useRef<() => void>(() => {})
  const saveRef       = useRef<() => void>(() => {})
  const handleOpenDiskFileRef = useRef<() => void>(() => {})
  const handleSaveAsDiskRef   = useRef<() => void>(() => {})
  const fileInputRef  = useRef<HTMLInputElement>(null)
  const folderInputRef = useRef<HTMLInputElement>(null)
  const aiBottomRef   = useRef<HTMLDivElement>(null)
  const sideResRef    = useRef<{x:number;w:number}|null>(null)
  const aiResRef      = useRef<{x:number;w:number}|null>(null)
  const consResRef    = useRef<{y:number;h:number}|null>(null)
  const webResRef     = useRef<{x:number;w:number}|null>(null)

  // Web Live Preview state (for running HTML/CSS/JS websites side-by-side with editor)
  const [webPreviewOpen, setWebPreviewOpen] = useState<boolean>(false)
  const [webPreviewW, setWebPreviewW]       = useState<number>(() => {
    if (typeof window !== 'undefined') return Math.max(380, Math.floor(window.innerWidth * 0.5))
    return 520
  })

  // derived
  const activeTabObj = tabs.find(t => t.id === activeTab) ?? tabs[0]
  const emptyFallbackTab: Tab = { id: '', name: 'untitled.py', lang: 'python', code: '' }
  const curTab = activeTabObj ?? emptyFallbackTab
  const hasOpenTab = Boolean(activeTabObj)
  const curLang = getLangById(curTab.lang)
  const status  = result ? statusLabel(result) : null

  // AI usage & Pro states
  const [aiUsage, setAiUsage] = useState<number>(() => {
    const u = getAuthUser()
    return u ? getAiUsageForUser(u.id) : 0
  })
  const [isPro, setIsPro] = useState<boolean>(() => {
    const u = getAuthUser()
    return u ? checkUserIsPro(u.id) : false
  })
  const [showUpgradeModal, setShowUpgradeModal] = useState<boolean>(false)
  const [aiConfigVersion, setAiConfigVersion] = useState<number>(0)

  useEffect(() => {
    const handleAIConfigChange = () => setAiConfigVersion(v => v + 1)
    window.addEventListener('cf_ai_config_changed', handleAIConfigChange)
    return () => window.removeEventListener('cf_ai_config_changed', handleAIConfigChange)
  }, [])

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (openMenuRef.current && !openMenuRef.current.contains(e.target as Node)) {
        setOpenMenuOpen(false)
      }
    }
    if (openMenuOpen) {
      document.addEventListener('mousedown', handleOutsideClick)
    }
    return () => document.removeEventListener('mousedown', handleOutsideClick)
  }, [openMenuOpen])

  const liveChannelRef = useRef<BroadcastChannel | null>(null)

  // ── Setup Realtime BroadcastChannel for Live Preview Page ──────────────────
  useEffect(() => {
    try {
      const channel = new BroadcastChannel('codeforge_live_preview')
      liveChannelRef.current = channel
      channel.onmessage = (e) => {
        if (e.data?.type === 'REQUEST_INITIAL_HTML') {
          const { html, fileName } = assembleWebProject(curTab, tabs)
          channel.postMessage({ type: 'LIVE_UPDATE', html, fileName })
        }
      }
      return () => {
        channel.close()
      }
    } catch (e) {
      console.warn('BroadcastChannel error:', e)
    }
  }, [curTab, tabs])

  // ── Realtime Live Sync: as code changes in any tab, stream updates to the new page! ──
  useEffect(() => {
    const isWebWorkspace = tabs.some(t =>
      t.lang === 'html' || t.lang === 'css' || t.lang === 'javascript' ||
      t.name.toLowerCase().endsWith('.html') || t.name.toLowerCase().endsWith('.htm') ||
      t.name.toLowerCase().endsWith('.css') || t.name.toLowerCase().endsWith('.js')
    )
    if (!isWebWorkspace) return

    const timer = setTimeout(() => {
      try {
        const { html, fileName } = assembleWebProject(curTab, tabs)
        localStorage.setItem('codeforge_live_preview_html', html)
        localStorage.setItem('codeforge_live_preview_filename', fileName)
        liveChannelRef.current?.postMessage({ type: 'LIVE_UPDATE', html, fileName })

        // Notify local Live Server if listening
        fetch('/__update_live_html__', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ html }),
        }).catch(() => {})
      } catch (e) {}
    }, 150)

    return () => clearTimeout(timer)
  }, [tabs, activeTab, curTab.code])

  const activeAISummary = useMemo(() => {
    return getActiveProviderSummary()
  }, [aiConfigVersion])

  // ── Init ────────────────────────────────────────────────────────────────
  useEffect(() => {
    applyThemeToDocument(editorTheme, editorFontColor)
    setSavedCodes(getSavedCodeHistory())
    const savedUser = getAuthUser()
    setAuthUserState(savedUser)
    setSnips(getSnippets(savedUser?.id ?? 'guest'))
    if (savedUser?.accessToken) {
      getGitHubUser(savedUser.accessToken)
        .then(profile => {
          if (profile.scopes) {
            const updated = { ...savedUser, scopes: profile.scopes }
            setAuthUserState(updated)
            setAuthUser(updated)
          }
        })
        .catch(() => {})

      getGitHubRepositories(savedUser.accessToken)
        .then(repos => {
          setRepositories(repos)
          if (repos.length > 0) setActiveRepo(repos[0])
        })
        .catch(() => {})
    }
    const shared = decodeShare()
    if (shared) {
      const lang = getLangById(shared.lang)
      const t: Tab = { id: crypto.randomUUID(), name: `shared.${lang.ext}`, lang: shared.lang, code: shared.code }
      setTabs([t]); setActiveTab(t.id)
      showToast('Opened shared snippet')
      window.history.replaceState({}, '', window.location.pathname)
    }
  }, [])

  // ── Dynamic Theme & Custom Font Color Theme Name ────────────────────────
  const activeMonacoTheme = useMemo(() => {
    if (!editorFontColor || editorFontColor === 'default') {
      return editorTheme
    }
    const cleanColor = editorFontColor.replace(/[^a-zA-Z0-9]/g, '')
    return `${editorTheme}-fc-${cleanColor}`
  }, [editorTheme, editorFontColor])

  // ── Theme ───────────────────────────────────────────────────────────────
  useEffect(() => {
    applyThemeToDocument(editorTheme, editorFontColor)
    if (!monaco) return
    registerMonacoThemes(monaco, editorFontColor)
    monaco.editor.setTheme(activeMonacoTheme)
  }, [monaco, editorTheme, editorFontColor, activeMonacoTheme])

  // ── Breakpoints & Active Debug Line in Monaco ─────────────────────────────
  const toggleBreakpoint = useCallback((line: number) => {
    setBreakpoints(prev => {
      const exists = prev.includes(line)
      const next = exists ? prev.filter(l => l !== line) : [...prev, line]
      showToast(exists ? `Removed breakpoint at line ${line}` : `Set breakpoint at line ${line}`)
      return next
    })
  }, [])

  const clearBreakpoints = useCallback(() => {
    setBreakpoints([])
    showToast('Cleared all breakpoints')
  }, [])

  const jumpToLine = useCallback((line: number) => {
    if (editorRef.current) {
      editorRef.current.revealLineInCenter(line)
      editorRef.current.setPosition({ lineNumber: line, column: 1 })
      editorRef.current.focus()
    }
  }, [])

  useEffect(() => {
    if (!editorRef.current || !monaco) return
    const decs: any[] = []

    breakpoints.forEach(line => {
      decs.push({
        range: new monaco.Range(line, 1, line, 1),
        options: {
          isWholeLine: false,
          glyphMarginClassName: 'monaco-breakpoint-glyph',
          glyphMarginHoverMessage: { value: `Breakpoint at line ${line}` }
        }
      })
    })

    if (activeDebugLine) {
      const currentStep = debugSteps[currentStepIdx]
      const vars = currentStep?.variables || {}
      const varEntries = Object.entries(vars).slice(0, 4)
      const varSummary = varEntries
        .map(([k, v]) => `${k}: ${typeof v.value === 'object' ? JSON.stringify(v.value) : v.value}`)
        .join('  ')

      decs.push({
        range: new monaco.Range(activeDebugLine, 1, activeDebugLine, 1),
        options: {
          isWholeLine: true,
          className: 'monaco-debug-active-line',
          glyphMarginClassName: 'monaco-debug-arrow-glyph',
          after: varSummary ? {
            content: `   // ${varSummary}`,
            inlineClassName: 'monaco-debug-inline-value'
          } : undefined
        }
      })
      editorRef.current.revealLineInCenter(activeDebugLine)
    }

    decorationsRef.current = editorRef.current.deltaDecorations(decorationsRef.current, decs)
  }, [breakpoints, activeDebugLine, debugSteps, currentStepIdx, monaco])

  // ── AI scroll ───────────────────────────────────────────────────────────
  useEffect(() => { aiBottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [msgs, aiThink])

  const showToast = (msg: string) => {
    setToast(msg); setTimeout(() => setToast(null), 2800)
  }

  // Keep activeCodeRef synchronized with the active tab's code upon tab switch
  useEffect(() => {
    activeCodeRef.current = curTab.code
  }, [curTab.id])

  // Instant zero-latency getter that queries the live Monaco model or buffer ref
  const getActiveCode = useCallback(() => {
    if (editorRef.current) {
      try {
        const val = editorRef.current.getValue()
        if (typeof val === 'string') return val
      } catch {}
    }
    return activeCodeRef.current || curTab.code
  }, [curTab.code])

  // ── Debugger Controllers ────────────────────────────────────────────────
  const addDebugLog = useCallback((log: Omit<DebugConsoleLog, 'id' | 'timestamp'>) => {
    setDebugLogs(prev => [
      ...prev,
      {
        ...log,
        id: crypto.randomUUID(),
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      }
    ])
  }, [])

  const startDebugging = useCallback(() => {
    const code = getActiveCode()
    const trace = generateExecutionTrace(code, curTab.lang, breakpoints, stdin)
    setDebugSteps(trace)
    setCurrentStepIdx(0)
    setIsDebugging(true)
    setIsAutoPlaying(false)

    const firstLine = trace[0]?.line ?? 1
    setActiveDebugLine(firstLine)
    jumpToLine(firstLine)

    // Open Run and Debug in sidebar & Debug Console in bottom panel
    setSideOpen(true)
    setPanel('debug')
    setConsTab('debug')
    setBottomPanelOpen(true)

    addDebugLog({
      type: 'info',
      text: `[CodeForge Debugger] Session started for ${curTab.name} (${curLang.label})`
    })
    addDebugLog({
      type: 'breakpoint',
      text: `Paused at line ${firstLine}: ${trace[0]?.description || ''}`
    })
  }, [getActiveCode, curTab, curLang, breakpoints, stdin, jumpToLine, addDebugLog])

  const stopDebugging = useCallback(() => {
    setIsDebugging(false)
    setIsAutoPlaying(false)
    if (autoPlayTimerRef.current) clearInterval(autoPlayTimerRef.current)
    setActiveDebugLine(null)
    addDebugLog({
      type: 'info',
      text: '[CodeForge Debugger] Debug session ended.'
    })
  }, [addDebugLog])

  const restartDebugging = useCallback(() => {
    stopDebugging()
    setTimeout(() => {
      startDebugging()
    }, 60)
  }, [stopDebugging, startDebugging])

  const stepNext = useCallback(() => {
    setCurrentStepIdx(prev => {
      if (prev < debugSteps.length - 1) {
        const next = prev + 1
        const line = debugSteps[next].line
        setActiveDebugLine(line)
        jumpToLine(line)

        addDebugLog({
          type: 'info',
          text: `Step ${next + 1}: Line ${line} (${debugSteps[next].description})`
        })

        if (debugSteps[next].output) {
          addDebugLog({
            type: 'stdout',
            text: debugSteps[next].output
          })
        }
        return next
      } else {
        setIsAutoPlaying(false)
        addDebugLog({
          type: 'info',
          text: '[CodeForge Debugger] Stepped to end of execution.'
        })
        return prev
      }
    })
  }, [debugSteps, jumpToLine, addDebugLog])

  const stepPrev = useCallback(() => {
    setCurrentStepIdx(prev => {
      if (prev > 0) {
        const next = prev - 1
        const line = debugSteps[next].line
        setActiveDebugLine(line)
        jumpToLine(line)
        return next
      }
      return prev
    })
  }, [debugSteps, jumpToLine])

  const continueExecution = useCallback(() => {
    let targetIdx = -1
    for (let i = currentStepIdx + 1; i < debugSteps.length; i++) {
      if (breakpoints.includes(debugSteps[i].line) || debugSteps[i].isBreakpoint) {
        targetIdx = i
        break
      }
    }
    if (targetIdx !== -1) {
      setCurrentStepIdx(targetIdx)
      const line = debugSteps[targetIdx].line
      setActiveDebugLine(line)
      jumpToLine(line)
      addDebugLog({
        type: 'breakpoint',
        text: `Hit breakpoint at line ${line} (Step ${targetIdx + 1})`
      })
    } else {
      const lastIdx = Math.max(0, debugSteps.length - 1)
      setCurrentStepIdx(lastIdx)
      const line = debugSteps[lastIdx]?.line ?? 1
      setActiveDebugLine(line)
      jumpToLine(line)
      setIsAutoPlaying(false)
      addDebugLog({
        type: 'info',
        text: '[CodeForge Debugger] Continued to program termination.'
      })
    }
  }, [currentStepIdx, debugSteps, breakpoints, jumpToLine, addDebugLog])

  // Auto-play timer
  useEffect(() => {
    if (isAutoPlaying && isDebugging) {
      autoPlayTimerRef.current = setInterval(() => {
        stepNext()
      }, playSpeed)
    } else {
      if (autoPlayTimerRef.current) clearInterval(autoPlayTimerRef.current)
    }
    return () => {
      if (autoPlayTimerRef.current) clearInterval(autoPlayTimerRef.current)
    }
  }, [isAutoPlaying, isDebugging, stepNext, playSpeed])

  // Update watch values when current step variables change
  useEffect(() => {
    if (!isDebugging || !debugSteps[currentStepIdx]) return
    const curVars = debugSteps[currentStepIdx].variables || {}
    setWatches(prev =>
      prev.map(w => ({
        ...w,
        value: evaluateWatchExpression(w.expression, curVars)
      }))
    )
  }, [isDebugging, currentStepIdx, debugSteps])

  // ── Global Keyboard Shortcuts ─────────────────────────────────────────────
  useEffect(() => {
    const fn = (e: KeyboardEvent) => {
      const mod = e.ctrlKey || e.metaKey
      if (mod && e.key === 'Enter') { e.preventDefault(); handleRunRef.current() }
      const key = e.key.toLowerCase()
      if (mod && e.shiftKey && key === 's') { e.preventDefault(); handleSaveAsDiskRef.current() }
      else if (mod && key === 's')          { e.preventDefault(); saveRef.current() }
      if (mod && (e.shiftKey && key === 'p' || !e.shiftKey && key === 'k')) { e.preventDefault(); setShowCommands(true); setCommandQuery('') }
      if (mod && e.shiftKey && key === 'a') { e.preventDefault(); setAiOpen(p => !p) }
      if (mod && !e.shiftKey && key === 'n') {
        e.preventDefault()
        setPanel('explorer')
        setSideOpen(true)
        setWorkspaceExpanded(true)
        setInlineItem({ type: 'file', parentFolder: '' })
        setInlineName('')
      }
      if (mod && !e.shiftKey && key === 'o') {
        e.preventDefault()
        handleOpenDiskFileRef.current()
      }
      if (e.key === 'Escape') {
        setShowSettings(false); setShowKeys(false); setShowSnipModal(false); setShowShare(false); setShowCommands(false)
        setInlineItem(null); setInlineName(''); setFileMenuOpen(false); setDownloadMenuOpen(false); setMoreActionsOpen(false); setBlankContextMenu(null); setFolderContextMenu(null)
      }

      // VS Code debugging keyboard shortcuts
      if (e.key === 'F5') {
        e.preventDefault()
        if (e.shiftKey) {
          stopDebugging()
        } else if (isDebugging) {
          continueExecution()
        } else {
          startDebugging()
        }
      }
      if (e.key === 'F10') {
        e.preventDefault()
        if (isDebugging) stepNext()
      }
      if (e.key === 'F11') {
        e.preventDefault()
        if (isDebugging) stepNext()
      }
      if (e.key === 'F9') {
        e.preventDefault()
        const line = editorRef.current?.getPosition()?.lineNumber
        if (line) toggleBreakpoint(line)
      }
    }
    window.addEventListener('keydown', fn)
    return () => window.removeEventListener('keydown', fn)
  }, [isDebugging, continueExecution, startDebugging, stopDebugging, stepNext, toggleBreakpoint])

  // Click outside to close download dropdown
  useEffect(() => {
    if (!downloadMenuOpen) return
    const handleClickOutside = (e: MouseEvent) => {
      if (downloadMenuRef.current && !downloadMenuRef.current.contains(e.target as Node)) {
        setDownloadMenuOpen(false)
      }
    }
    window.addEventListener('mousedown', handleClickOutside)
    return () => window.removeEventListener('mousedown', handleClickOutside)
  }, [downloadMenuOpen])


  const syncTabsTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Flush any pending debounced code update directly into tabs state (e.g. before save, run, tab switch)
  const flushTabsSync = useCallback(() => {
    if (syncTabsTimerRef.current) {
      clearTimeout(syncTabsTimerRef.current)
      syncTabsTimerRef.current = null
    }
    const currentCode = activeCodeRef.current
    if (currentCode !== undefined) {
      setTabs(p => {
        const target = p.find(t => t.id === activeTab)
        if (target && target.code !== currentCode) {
          return p.map(t => t.id === activeTab ? { ...t, code: currentCode, modified: true } : t)
        }
        return p
      })
    }
  }, [activeTab])

  // Instant zero-latency typing handler:
  // 1. Immediately updates activeCodeRef in memory with zero input lag.
  // 2. Debounces the full React tree state update so individual keystrokes NEVER cause
  //    re-renders of App, preventing frame drops, stutter, or typing latency.
  const updateCode = useCallback((code: string) => {
    activeCodeRef.current = code

    if (syncTabsTimerRef.current) {
      clearTimeout(syncTabsTimerRef.current)
    }
    syncTabsTimerRef.current = setTimeout(() => {
      setTabs(p => {
        const target = p.find(t => t.id === activeTab)
        if (target && target.code !== code) {
          return p.map(t => t.id === activeTab ? { ...t, code, modified: true } : t)
        }
        return p
      })
    }, 280)
  }, [activeTab])

  const switchActiveTab = useCallback((tabId: string) => {
    if (tabId === activeTab) return
    flushTabsSync()
    setActiveTab(tabId)
  }, [activeTab, flushTabsSync])

  const switchLang = (langId: string) => {
    const l = getLangById(langId)
    setTabs(p => p.map(t => t.id === activeTab ? { ...t, lang: langId, name: t.name.includes('.') ? `${t.name.split('.').slice(0, -1).join('.')}.${l.ext}` : `main.${l.ext}` } : t))
  }

  const newTab = (name = 'untitled.py', initialCode?: string) => {
    const language = detectLanguage(name)
    const t: Tab = { id: crypto.randomUUID(), name, lang: language.id, code: initialCode ?? '' }
    setTabs(p => [...p, t]); setActiveTab(t.id)
  }

  const createFile = () => {
    const raw = newFileName.trim()
    if (!raw) return
    const fullName = newFileParentFolder ? `${newFileParentFolder}/${raw}` : raw
    const finalName = fullName.includes('.') ? fullName : `${fullName}.py`
    newTab(finalName, '')
    setNewFileOpen(false)
    setNewFileName('untitled.py')
    setNewFileParentFolder('')
    showToast(`${finalName} created ✨`)
  }

  const createFolder = () => {
    const raw = newFolderName.trim().replace(/^\/+|\/+$/g, '')
    if (!raw) return
    const target = newFileParentFolder ? `${newFileParentFolder}/${raw}` : raw
    if (!folders.includes(target)) {
      setFolders(prev => [...prev, target])
    }
    setNewFolderOpen(false)
    setNewFolderName('')
    showToast(`Folder "${target}" created 📁`)
  }

  const commitInlineCreate = () => {
    if (!inlineItem) return
    const raw = inlineName.trim()
    if (!raw) {
      setInlineItem(null)
      setInlineName('')
      return
    }

    if (inlineItem.type === 'file') {
      const rawPath = inlineItem.parentFolder ? `${inlineItem.parentFolder}/${raw}` : raw
      // Handle nested subdirectories in path if user typed e.g. "models/user.ts"
      const parts = rawPath.split('/')
      if (parts.length > 1) {
        let cur = ''
        for (let i = 0; i < parts.length - 1; i++) {
          cur = cur ? `${cur}/${parts[i]}` : parts[i]
          setFolders(prev => prev.includes(cur) ? prev : [...prev, cur])
        }
      }
      const finalName = rawPath.includes('.') ? rawPath : `${rawPath}.py`
      newTab(finalName, '')
      showToast(`${finalName} created ✨`)
    } else {
      const target = inlineItem.parentFolder ? `${inlineItem.parentFolder}/${raw}` : raw
      const clean = target.replace(/^\/+|\/+$/g, '')
      if (clean) {
        if (!folders.includes(clean)) {
          setFolders(prev => [...prev, clean])
        }
        setCollapsedFolders(prev => ({ ...prev, [clean]: false }))
        showToast(`Folder "${clean}" created 📁`)
      }
    }

    setInlineItem(null)
    setInlineName('')
  }

  const collapseAllFolders = () => {
    const allCollapsed: Record<string, boolean> = {}
    folders.forEach(f => { allCollapsed[f] = true })
    tabs.forEach(t => {
      if (t.name.includes('/')) {
        allCollapsed[t.name.substring(0, t.name.lastIndexOf('/'))] = true
      }
    })
    setCollapsedFolders(allCollapsed)
    showToast('Collapsed all folders in Explorer')
  }

  const refreshExplorer = () => {
    showToast('Explorer refreshed 🔄')
  }

  const handleDownloadProject = async () => {
    try {
      const currentCode = getActiveCode()
      const allFiles = tabs.map(t => t.id === activeTab ? { name: t.name, code: currentCode } : { name: t.name, code: t.code })
      await downloadProjectZip(workspaceName, allFiles)
      showToast(`Downloaded "${workspaceName}.zip" 📦`)
    } catch (err) {
      console.error(err)
      showToast('Failed to download project zip')
    }
  }

  const duplicateWorkspaceFile = (id: string) => {
    const target = tabs.find(t => t.id === id)
    if (!target) return
    const parts = target.name.split('.')
    const ext = parts.length > 1 ? `.${parts.pop()}` : ''
    const base = parts.join('.')
    const newName = `${base}-copy${ext}`
    const newTabItem: Tab = {
      id: crypto.randomUUID(),
      name: newName,
      lang: target.lang,
      code: target.code,
    }
    setTabs(prev => [...prev, newTabItem])
    setActiveTab(newTabItem.id)
    showToast(`Duplicated to ${newName}`)
  }

  const deleteFolder = (folderName: string) => {
    setFolders(prev => prev.filter(f => f !== folderName && !f.startsWith(folderName + '/')))
    setTabs(prev => {
      const remaining = prev.filter(t => !t.name.startsWith(folderName + '/'))
      return remaining.length > 0 ? remaining : [{ id: crypto.randomUUID(), name: 'main.py', lang: 'python', code: 'print("Hello, world!")' }]
    })
    showToast(`Folder "${folderName}" deleted`)
  }

  const toggleFolder = (folderName: string) => {
    setCollapsedFolders(prev => ({ ...prev, [folderName]: !prev[folderName] }))
  }

  const handleOpenFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return
    Array.from(files).forEach(file => {
      const reader = new FileReader()
      reader.onload = ev => {
        const content = ev.target?.result
        if (typeof content === 'string') {
          const detected = detectLanguage(file.name)
          const newTabItem: Tab = {
            id: crypto.randomUUID(),
            name: file.name,
            lang: detected.id,
            code: content,
          }
          setTabs(prev => {
            const exists = prev.find(t => t.name === file.name)
            if (exists) {
              return prev.map(t => t.id === exists.id ? { ...t, code: content } : t)
            }
            return [...prev, newTabItem]
          })
          setActiveTab(newTabItem.id)
          showToast(`Opened ${file.name} 📄`)
        }
      }
      reader.readAsText(file)
    })
    e.target.value = ''
  }

  const handleOpenFolder = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    const isCodeFile = (path: string) => {
      if (path.includes('node_modules/') || path.includes('/.git/') || path.startsWith('.git/')) return false
      if (path.includes('dist/') || path.includes('build/') || path.includes('.next/')) return false
      if (path.endsWith('.DS_Store') || path.endsWith('.lock') || path.endsWith('.png') || path.endsWith('.jpg') || path.endsWith('.ico') || path.endsWith('.jpeg')) return false
      return true
    }

    const validFiles = Array.from(files).filter(f => isCodeFile(f.webkitRelativePath || f.name))
    if (validFiles.length === 0) {
      showToast('No readable code files found in selected folder')
      return
    }

    const firstPath = validFiles[0].webkitRelativePath || validFiles[0].name
    const rootName = firstPath.split('/')[0] || 'Project'
    setWorkspaceName(rootName)

    const folderSet = new Set<string>()
    const loadedTabs: Tab[] = []

    for (const file of validFiles) {
      try {
        const content = await file.text()
        const fullRel = file.webkitRelativePath || file.name
        const cleanPath = fullRel.includes('/') ? fullRel.substring(fullRel.indexOf('/') + 1) : fullRel
        if (!cleanPath) continue

        const parts = cleanPath.split('/')
        if (parts.length > 1) {
          let cur = ''
          for (let i = 0; i < parts.length - 1; i++) {
            cur = cur ? `${cur}/${parts[i]}` : parts[i]
            folderSet.add(cur)
          }
        }

        const detected = detectLanguage(cleanPath)
        loadedTabs.push({
          id: crypto.randomUUID(),
          name: cleanPath,
          lang: detected.id,
          code: content,
        })
      } catch (err) {
        console.error('Error reading file', file.name, err)
      }
    }

    if (loadedTabs.length > 0) {
      setFolders(Array.from(folderSet))
      setTabs(loadedTabs)
      const primary = loadedTabs.find(t => /^(main|index|app)\./i.test(t.name.split('/').pop() || '')) || loadedTabs[0]
      setActiveTab(primary.id)
      showToast(`Opened project "${rootName}" (${loadedTabs.length} files) 🚀`)
    }
    e.target.value = ''
  }

  const handleOpenFileWithPicker = async () => {
    if (isFileSystemAccessSupported()) {
      try {
        const diskFiles = await openFilesFromDisk()
        if (diskFiles.length === 0) return
        const newTabs: Tab[] = []
        diskFiles.forEach(df => {
          const detected = detectLanguage(df.name)
          newTabs.push({
            id: crypto.randomUUID(),
            name: df.name,
            lang: detected.id,
            code: df.content,
            modified: false,
            fileHandle: df.handle,
            isLocalDisk: true,
            localPath: df.path,
          })
        })
        setTabs(prev => {
          // If workspace only had a single empty unmodified default file, replace it
          if (
            prev.length === 1 &&
            !prev[0].modified &&
            (!prev[0].code || prev[0].code.startsWith('# CodeForge') || prev[0].code.startsWith('print("Hello'))
          ) {
            return newTabs
          }
          const existingNames = new Set(prev.map(t => t.name))
          const filtered = newTabs.filter(t => !existingNames.has(t.name))
          return [...prev, ...filtered]
        })
        setActiveTab(newTabs[0].id)
        showToast(`Opened ${newTabs[0].name} from computer (Direct Disk Save active 💾)`)
        return
      } catch (err: any) {
        if (err.name === 'AbortError') return
        console.warn('showOpenFilePicker error, falling back:', err)
      }
    }
    fileInputRef.current?.click()
  }
  handleOpenDiskFileRef.current = handleOpenFileWithPicker

  const handleOpenProjectWithPicker = async () => {
    if (typeof window !== 'undefined' && 'showDirectoryPicker' in window) {
      try {
        const dirHandle = await (window as any).showDirectoryPicker({
          mode: 'readwrite',
        })
        if (!dirHandle) return

        const rootName = dirHandle.name || 'Project'
        setWorkspaceName(rootName)

        const isCodeFile = (path: string) => {
          const p = path.toLowerCase()
          if (p.includes('node_modules/') || p.includes('/.git/') || p.startsWith('.git/')) return false
          if (p.includes('dist/') || p.includes('build/') || p.includes('.next/') || p.includes('.cache/')) return false
          if (p.endsWith('.ds_store') || p.endsWith('.lock') || p.endsWith('.png') || p.endsWith('.jpg') || p.endsWith('.ico') || p.endsWith('.jpeg')) return false
          return true
        }

        const folderSet = new Set<string>()
        const loadedTabs: Tab[] = []

        async function scanDirectory(currentDir: any, pathPrefix = '') {
          const IGNORED = new Set(['node_modules', '.git', 'dist', 'build', '.next', '.cache', '__pycache__', '.vscode'])
          for await (const entry of currentDir.values()) {
            if (IGNORED.has(entry.name) || entry.name.startsWith('.')) continue
            const entryPath = pathPrefix ? `${pathPrefix}/${entry.name}` : entry.name
            if (entry.kind === 'directory') {
              folderSet.add(entryPath)
              await scanDirectory(entry, entryPath)
            } else if (entry.kind === 'file') {
              if (isCodeFile(entryPath)) {
                try {
                  const file = await entry.getFile()
                  if (file.size < 2 * 1024 * 1024) {
                    const content = await file.text()
                    const detected = detectLanguage(entryPath)
                    loadedTabs.push({
                      id: crypto.randomUUID(),
                      name: entryPath,
                      lang: detected.id,
                      code: content,
                      modified: false,
                      fileHandle: entry,
                      isLocalDisk: true,
                      localPath: entryPath,
                    })
                  }
                } catch (err) {
                  console.warn('Error reading file from handle', entryPath, err)
                }
              }
            }
          }
        }

        await scanDirectory(dirHandle)

        if (loadedTabs.length === 0) {
          const defaultFile: Tab = {
            id: crypto.randomUUID(),
            name: 'main.py',
            lang: 'python',
            code: `# Project: ${rootName}\nprint("Hello from ${rootName}!")\n`,
            modified: false,
          }
          setFolders(Array.from(folderSet))
          setTabs([defaultFile])
          setActiveTab(defaultFile.id)
          showToast(`Opened project "${rootName}" (Created main.py) 🚀`)
        } else {
          setFolders(Array.from(folderSet))
          setTabs(loadedTabs)
          const primary = loadedTabs.find(t => /^(main|index|app)\./i.test(t.name.split('/').pop() || '')) || loadedTabs[0]
          setActiveTab(primary.id)
          showToast(`Opened project "${rootName}" (${loadedTabs.length} files with Direct Disk Save 💾) 🚀`)
        }
        setPanel('explorer')
        setSideOpen(true)
        setWorkspaceExpanded(true)
        return
      } catch (err: any) {
        if (err.name === 'AbortError') return
        console.warn('showDirectoryPicker error, falling back to input', err)
      }
    }

    // Fallback to hidden directory input
    folderInputRef.current?.click()
  }

  const closeTab = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    const rest = tabs.filter(t => t.id !== id)
    setTabs(rest)
    if (activeTab === id) setActiveTab(rest.length > 0 ? rest[rest.length - 1].id : '')
  }

  const deleteWorkspaceFile = (id: string) => {
    const target = tabs.find(t => t.id === id)
    const rest = tabs.filter(t => t.id !== id)
    setTabs(rest)
    if (activeTab === id) setActiveTab(rest.length > 0 ? rest[rest.length - 1].id : '')
    showToast(`Deleted ${target?.name || 'file'}`)
  }

  // ── Run ──────────────────────────────────────────────────────────────────
  const handleRun = useCallback(async () => {
    if (running) return
    flushTabsSync()
    let activeTabToUse = curTab
    let codeToRun = getActiveCode()

    if (!hasOpenTab) {
      if (codeToRun.trim()) {
        const newTabItem: Tab = { id: crypto.randomUUID(), name: 'untitled.py', lang: 'python', code: codeToRun }
        setTabs([newTabItem])
        setActiveTab(newTabItem.id)
        activeTabToUse = newTabItem
      } else {
        showToast('⚠️ No code to run. Write some code first!')
        return
      }
    }

    // ── Check if running a website file (HTML/HTM connected to CSS & JS) ────
    const fileName = activeTabToUse.name.toLowerCase()
    const isWebFile =
      activeTabToUse.lang === 'html' ||
      fileName.endsWith('.html') ||
      fileName.endsWith('.htm')

    if (isWebFile) {
      const { html, fileName: bundledName } = assembleWebProject(activeTabToUse, tabs)
      localStorage.setItem('codeforge_live_preview_html', html)
      localStorage.setItem('codeforge_live_preview_filename', bundledName)
      liveChannelRef.current?.postMessage({ type: 'LIVE_UPDATE', html, fileName: bundledName })

      fetch('/__update_live_html__', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ html }),
      }).catch(() => {})

      // Directly open website in a new dedicated page with real-time live sync
      const win = window.open('/preview.html', 'codeforge_live_web')
      if (win) win.focus()

      showToast(`🚀 ${bundledName} opened in new page! Live sync active.`)
      return
    }

    // For all other languages (Python, Java, JS, C++, Rust, Go, etc.), output appears in the bottom terminal
    setRunning(true); setResult(null); setConsTab('output'); setBottomPanelOpen(true)
    try {
      let langToRun = getLangById(activeTabToUse.lang)
      let targetJudge0Id = langToRun.judge0Id
      if (targetJudge0Id === 0) {
        if (langToRun.id === 'json') {
          try {
            JSON.parse(codeToRun)
            setResult({
              stdout: `✓ Valid JSON Syntax!\nFile: ${activeTabToUse.name}\nSize: ${codeToRun.length} bytes\nLines: ${codeToRun.split('\n').length}`,
              stderr: null,
              compile_output: null,
              status: { id: 3, description: 'Accepted' },
              time: '0.001',
              memory: 1024,
              exit_code: 0,
            })
          } catch (jsonErr: any) {
            setResult({
              stdout: null,
              stderr: `✕ JSON Syntax Error:\n${jsonErr.message}`,
              compile_output: null,
              status: { id: 6, description: 'Compilation Error' },
              time: '0.001',
              memory: 1024,
              exit_code: 1,
            })
          }
          return
        } else {
          // Fallback plain text with code: execute with Python 3
          targetJudge0Id = 71
        }
      }

      const res = await executeCode({
        sourceCode: codeToRun,
        languageId: targetJudge0Id,
        lang: langToRun.id,
        stdin,
      })
      setResult(res)
    } finally { setRunning(false) }
  }, [running, hasOpenTab, curTab, getActiveCode, stdin])
  handleRunRef.current = handleRun

  // ── AI ───────────────────────────────────────────────────────────────────
  const sendAI = async (action: AIAction, text: string) => {
    const currentUserId = authUser?.id || 'cf_guest_developer'
    const currentUsage = getAiUsageForUser(currentUserId)
    if (!isPro && currentUsage >= MAX_FREE_MONTHLY_AI) {
      setShowUpgradeModal(true)
      showToast(`⚠️ Monthly free AI limit reached (${MAX_FREE_MONTHLY_AI}/${MAX_FREE_MONTHLY_AI}). Upgrade to Pro!`)
      return
    }

    if (!isPro) {
      const nextUsage = currentUsage + 1
      localStorage.setItem(`cf_ai_usage_${currentUserId}_${getCurrentMonthKey()}`, String(nextUsage))
      setAiUsage(nextUsage)
    }

    const label = ACTIONS.find(a => a.action === action)?.label ?? action
    const userMsg: AIMessage = {
      id: crypto.randomUUID(), role: 'user', timestamp: new Date(), action,
      content: action === 'chat' ? text : `${label} my code`,
    }
    setMsgs(p => [...p, userMsg]); setAiInput(''); setAiThink(true)
    try {
      const currentCode = hasOpenTab ? getActiveCode() : ''
      const res = await generateAIResponse(action, text, currentCode, curLang.id, result ?? undefined)
      setMsgs(p => [...p, { id: crypto.randomUUID(), role: 'assistant', timestamp: new Date(), action, content: res }])
    } finally { setAiThink(false) }
  }

  const submitAI = () => { if (aiInput.trim() && !aiThink) sendAI('chat', aiInput.trim()) }

  const applyAIResponse = (content: string) => {
    const match = content.match(/```(?:[\w+#.-]+)?\n([\s\S]*?)```/)
    const newCode = match ? match[1].trimEnd() : content.trimEnd()
    if (!newCode) { showToast('No code found to apply'); return }
    if (editorRef.current) {
      editorRef.current.setValue(newCode)
    }
    activeCodeRef.current = newCode
    setTabs(p => p.map(t => t.id === activeTab ? { ...t, code: newCode, modified: true } : t))
    showToast(`AI code applied to ${curTab.name} ✨`)
  }

  // ── Snippets ─────────────────────────────────────────────────────────────
  const doSaveSnip = () => {
    if (!snipName.trim() || !authUser) return
    const currentCode = getActiveCode()
    saveSnippet(authUser.id, snipName, curTab.lang, currentCode)
    setSnips(getSnippets(authUser.id)); setSnipName(''); setShowSnipModal(false)
    showToast(`Snippet "${snipName}" saved`)
  }

  const handleOpenFileFromRepo = (
    repo: GitHubRepository,
    path: string,
    content: string,
    sha: string,
    branch: string
  ) => {
    const filename = path.split('/').pop() || path
    const detected = detectLanguage(filename)

    const existing = tabs.find(
      t => t.repoName?.toLowerCase() === repo.name.toLowerCase() && t.repoPath === path
    )
    if (existing) {
      setActiveTab(existing.id)
      setActiveRepo(repo)
      return
    }

    const newTab: Tab = {
      id: crypto.randomUUID(),
      name: filename,
      lang: detected.id,
      code: content,
      modified: false,
      repoOwner: repo.owner?.login || authUser?.login || authUser?.name,
      repoName: repo.name,
      repoPath: path,
      repoSha: sha,
      repoBranch: branch,
    }
    setTabs(prev => [...prev, newTab])
    setActiveTab(newTab.id)
    setActiveRepo(repo)
  }

  const handleImportMultipleFilesFromRepo = (
    repo: GitHubRepository,
    files: { path: string; name: string; content: string; sha: string; branch: string }[]
  ) => {
    if (files.length === 0) return
    const newTabs: Tab[] = []
    const folderSet = new Set<string>()

    files.forEach(f => {
      const parts = f.path.split('/')
      if (parts.length > 1) {
        let cur = ''
        for (let i = 0; i < parts.length - 1; i++) {
          cur = cur ? `${cur}/${parts[i]}` : parts[i]
          folderSet.add(cur)
        }
      }
      const detected = detectLanguage(f.name)
      newTabs.push({
        id: crypto.randomUUID(),
        name: f.path,
        lang: detected.id,
        code: f.content,
        modified: false,
        repoOwner: repo.owner?.login || authUser?.login || authUser?.name,
        repoName: repo.name,
        repoPath: f.path,
        repoSha: f.sha,
        repoBranch: f.branch,
      })
    })

    setFolders(prev => Array.from(new Set([...prev, ...folderSet])))
    setTabs(prev => [...prev, ...newTabs])
    setActiveTab(newTabs[0].id)
    setActiveRepo(repo)
    showToast(`Imported ${newTabs.length} files from ${repo.name} 🚀`)
  }

  const handleCommitSuccess = (tabId: string, newSha: string, commitUrl: string, commitSha: string) => {
    setTabs(prev =>
      prev.map(tab => (tab.id === tabId ? { ...tab, modified: false, repoSha: newSha } : tab))
    )
  }

  const handleSelectRepoForCommit = (repo: GitHubRepository) => {
    setActiveRepo(repo)
    setPanel('source-control')
    setSideOpen(true)
    showToast(`Selected "${repo.name}" in Source Control`)
  }

  const handleAuthSuccess = (user: AuthUser, repos: GitHubRepository[]) => {
    setAuthUser(user)
    setAuthUserState(user)
    setSnips(getSnippets(user.id))
    setRepositories(repos)
    if (repos.length > 0) setActiveRepo(repos[0])
    setShowAuth(false)
  }

  const refreshRepositories = async () => {
    if (!authUser?.accessToken) return
    try {
      const [profile, repos] = await Promise.all([
        getGitHubUser(authUser.accessToken).catch(() => null),
        getGitHubRepositories(authUser.accessToken),
      ])
      if (profile?.scopes) {
        const updated = { ...authUser, scopes: profile.scopes }
        setAuthUserState(updated)
        setAuthUser(updated)
      }
      setRepositories(repos)
      showToast(`Synced ${repos.length} repositories from GitHub`)
    } catch (err: any) {
      showToast(err.message || 'Failed to refresh repositories')
    }
  }

  const handleThemeChange = (themeId: string) => {
    setEditorTheme(themeId)
    applyThemeToDocument(themeId, editorFontColor)
    try { localStorage.setItem('cf_editor_theme', themeId) } catch {}
    if (monaco) {
      registerMonacoThemes(monaco, editorFontColor)
      const targetTheme = editorFontColor && editorFontColor !== 'default'
        ? `${themeId}-fc-${editorFontColor.replace(/[^a-zA-Z0-9]/g, '')}`
        : themeId
      monaco.editor.setTheme(targetTheme)
    }
  }

  const handleFontColorChange = (color: string) => {
    setEditorFontColor(color)
    applyThemeToDocument(editorTheme, color)
    try { localStorage.setItem('cf_editor_font_color', color) } catch {}
    if (monaco) {
      registerMonacoThemes(monaco, color)
      const targetTheme = color && color !== 'default'
        ? `${editorTheme}-fc-${color.replace(/[^a-zA-Z0-9]/g, '')}`
        : editorTheme
      monaco.editor.setTheme(targetTheme)
    }
  }

  const handleFontChange = (fontId: string) => {
    setEditorFont(fontId)
    try { localStorage.setItem('cf_editor_font', fontId) } catch {}
  }

  const handleFontLigaturesToggle = () => {
    setFontLigatures(p => {
      const next = !p
      try { localStorage.setItem('cf_editor_ligatures', String(next)) } catch {}
      showToast(`Font ligatures: ${next ? 'Enabled' : 'Disabled'}`)
      return next
    })
  }

  const openSettings = (tab: 'editor' | 'themes' | 'repos' | 'profile' = 'editor') => {
    setSettingsTab(tab)
    setShowSettings(true)
  }

  const signOut = () => {
    clearAuthUser()
    setAuthUserState(null)
    setSnips([])
    setRepositories([])
    setActiveRepo(null)
    showToast('Signed out from GitHub')
  }

  const saveCurrentFile = async () => {
    if (!hasOpenTab) {
      showToast('⚠️ No active file to save')
      return
    }
    flushTabsSync()
    const currentCode = getActiveCode()

    // 1. If tab has native File System Access handle (direct write to user's disk file)
    if (curTab.fileHandle) {
      try {
        await saveToLocalDisk(curTab.fileHandle, currentCode)
        const snapshot = saveCodeSnapshot(curTab.name, curTab.lang, currentCode)
        setSavedCodes(previous => [snapshot, ...previous].slice(0, 50))
        setTabs(previous => previous.map(tab => tab.id === activeTab ? { ...tab, code: currentCode, modified: false } : tab))
        showToast(`Saved to "${curTab.name}" on your computer disk! 💾`)
        return
      } catch (err: any) {
        console.warn('Direct disk save failed:', err)
        showToast(`⚠️ Could not write to disk: ${err.message || 'Permission denied'}`)
      }
    }

    // 2. If it's a new / unlinked file and File System Access API is supported, prompt Save As
    if (isFileSystemAccessSupported()) {
      try {
        const handle = await saveAsLocalDisk(curTab.name, currentCode)
        const newName = handle.name
        const detected = detectLanguage(newName)
        const snapshot = saveCodeSnapshot(newName, detected.id, currentCode)
        setSavedCodes(previous => [snapshot, ...previous].slice(0, 50))
        setTabs(previous => previous.map(tab => tab.id === activeTab ? {
          ...tab,
          name: newName,
          lang: detected.id,
          code: currentCode,
          modified: false,
          fileHandle: handle,
          isLocalDisk: true,
          localPath: newName,
        } : tab))
        showToast(`Saved to "${newName}" on your computer disk! 💾`)
        return
      } catch (err: any) {
        if (err.name === 'AbortError') return
        console.warn('saveAsLocalDisk error:', err)
      }
    }

    // 3. Fallback
    const snapshot = saveCodeSnapshot(curTab.name, curTab.lang, currentCode)
    setSavedCodes(previous => [snapshot, ...previous].slice(0, 50))
    setTabs(previous => previous.map(tab => tab.id === activeTab ? { ...tab, code: currentCode, modified: false } : tab))
    showToast(`${curTab.name} saved locally`)
  }
  saveRef.current = saveCurrentFile

  const handleSaveAsDisk = async () => {
    if (!hasOpenTab) return
    const currentCode = getActiveCode()
    if (!isFileSystemAccessSupported()) {
      downloadCode(curTab.name, currentCode)
      showToast(`Downloaded ${curTab.name}`)
      return
    }
    try {
      const handle = await saveAsLocalDisk(curTab.name, currentCode)
      const newName = handle.name
      const detected = detectLanguage(newName)
      const snapshot = saveCodeSnapshot(newName, detected.id, currentCode)
      setSavedCodes(previous => [snapshot, ...previous].slice(0, 50))
      setTabs(previous => previous.map(tab => tab.id === activeTab ? {
        ...tab,
        name: newName,
        lang: detected.id,
        code: currentCode,
        modified: false,
        fileHandle: handle,
        isLocalDisk: true,
        localPath: newName,
      } : tab))
      showToast(`Linked and saved as "${newName}" on your computer disk! 💾`)
    } catch (err: any) {
      if (err.name === 'AbortError') return
      showToast(`⚠️ Could not save file: ${err.message}`)
    }
  }
  handleSaveAsDiskRef.current = handleSaveAsDisk

  const runCommand = (command: string) => {
    setShowCommands(false)
    switch (command) {
      case 'run': handleRun(); break
      case 'save': saveCurrentFile(); break
      case 'save-as': handleSaveAsDisk(); break
      case 'new': setPanel('explorer'); setSideOpen(true); setWorkspaceExpanded(true); setInlineItem({ type: 'file', parentFolder: '' }); setInlineName(''); break
      case 'new-folder': setPanel('explorer'); setSideOpen(true); setWorkspaceExpanded(true); setInlineItem({ type: 'folder', parentFolder: '' }); setInlineName(''); break
      case 'open-file': handleOpenFileWithPicker(); break
      case 'open-folder': handleOpenProjectWithPicker(); break
      case 'format': editorRef.current?.getAction('editor.action.formatDocument')?.run(); break
      case 'find': editorRef.current?.getAction('actions.find')?.run(); break
      case 'explorer': setPanel('explorer'); setSideOpen(true); break
      case 'history': setPanel('history'); setSideOpen(true); break
      case 'source-control': setPanel('source-control'); setSideOpen(true); break
      case 'themes': openSettings('themes'); break
      case 'repos': openSettings('repos'); break
      case 'ai': setAiOpen(p => !p); break
      case 'settings': setShowSettings(true); break
      case 'shortcuts': setShowKeys(true); break
    }
  }

  const loadSnip = (s: SavedSnippet) => {
    const l = getLangById(s.lang)
    const t: Tab = { id: crypto.randomUUID(), name: `${s.name}.${l.ext}`, lang: s.lang, code: s.code }
    setTabs(p => [...p, t]); setActiveTab(t.id)
    showToast(`Loaded "${s.name}"`)
  }

  // ── Share ─────────────────────────────────────────────────────────────────
  const doShare = () => {
    const currentCode = getActiveCode()
    setShareLink(encodeShare(curTab.lang, currentCode))
    setShowShare(true)
  }
  const doCopy  = () => {
    navigator.clipboard.writeText(shareLink).catch(() => {})
    setCopied(true); setTimeout(() => setCopied(false), 2000)
  }

  const formatCode = async () => {
    if (!editorRef.current) return
    try {
      // Try Monaco's built-in formatter first (works for JS/TS/JSON/HTML/CSS)
      const action = editorRef.current.getAction('editor.action.formatDocument')
      if (action) {
        await action.run()
        showToast('Code formatted ✨')
        return
      }
    } catch {}

    // Smart manual formatter for all other languages
    try {
      const code = getActiveCode()
      const lang = curTab.lang
      let formatted = code

      // Universal: normalize line endings, remove trailing whitespace
      formatted = formatted.replace(/\r\n/g, '\n').replace(/[ \t]+$/gm, '')

      // Language-specific formatting
      if (['python', 'ruby', 'r', 'bash', 'sh', 'powershell', 'perl', 'lua'].includes(lang)) {
        // 4-space indent normalization for Python-like langs
        const lines = formatted.split('\n')
        formatted = lines.map(line => {
          const match = line.match(/^(\t+)(.*)$/)
          if (match) return '    '.repeat(match[1].length) + match[2]
          return line
        }).join('\n')
      } else if (['javascript', 'typescript', 'java', 'c', 'cpp', 'csharp', 'go', 'rust', 'kotlin', 'swift', 'dart', 'groovy', 'scala'].includes(lang)) {
        // 2/4-space indent for brace-based langs
        const lines = formatted.split('\n')
        formatted = lines.map(line => {
          const match = line.match(/^(\t+)(.*)$/)
          if (match) return '  '.repeat(match[1].length) + match[2]
          return line
        }).join('\n')
        // Ensure space after keywords
        formatted = formatted
          .replace(/\bif\(/g, 'if (')
          .replace(/\bfor\(/g, 'for (')
          .replace(/\bwhile\(/g, 'while (')
          .replace(/\bswitch\(/g, 'switch (')
          .replace(/\bcatch\(/g, 'catch (')
      } else if (lang === 'sql') {
        // SQL: uppercase keywords
        const keywords = ['SELECT', 'FROM', 'WHERE', 'JOIN', 'LEFT', 'RIGHT', 'INNER', 'OUTER',
          'ON', 'AND', 'OR', 'NOT', 'IN', 'EXISTS', 'LIKE', 'BETWEEN', 'IS NULL', 'IS NOT NULL',
          'ORDER BY', 'GROUP BY', 'HAVING', 'LIMIT', 'OFFSET', 'INSERT INTO', 'VALUES', 'UPDATE',
          'SET', 'DELETE FROM', 'CREATE TABLE', 'DROP TABLE', 'ALTER TABLE', 'ADD COLUMN',
          'PRIMARY KEY', 'FOREIGN KEY', 'REFERENCES', 'UNIQUE', 'NOT NULL', 'DEFAULT',
          'COUNT', 'SUM', 'AVG', 'MAX', 'MIN', 'DISTINCT', 'AS', 'UNION', 'ALL']
        keywords.forEach(kw => {
          const rx = new RegExp(`\\b${kw}\\b`, 'gi')
          formatted = formatted.replace(rx, kw)
        })
      }

      // Remove excessive blank lines (max 2 consecutive)
      formatted = formatted.replace(/\n{3,}/g, '\n\n')
      // Ensure single newline at end
      formatted = formatted.trimEnd() + '\n'

      if (editorRef.current) {
        editorRef.current.setValue(formatted)
      }
      activeCodeRef.current = formatted
      setTabs(prev => prev.map(t => t.id === activeTab ? { ...t, code: formatted } : t))
      showToast(`${curLang.label} code formatted ✨`)
    } catch {
      showToast('Formatting failed')
    }
  }

  const copyCode = async () => {
    try {
      const currentCode = getActiveCode()
      await navigator.clipboard.writeText(currentCode)
      showToast('Code copied to clipboard! 📋')
    } catch {
      showToast('Failed to copy code')
    }
  }

  const handleEditorMount = (ed: any, monacoInstance: any) => {
    editorRef.current = ed
    ed.onDidChangeCursorPosition((e: any) => {
      const text = `Ln ${e.position.lineNumber}, Col ${e.position.column}`
      const el1 = document.getElementById('editor-cursor-pos-header')
      if (el1) el1.textContent = text
      const el2 = document.getElementById('editor-cursor-pos-status')
      if (el2) el2.textContent = text
    })
    ed.addCommand(monacoInstance.KeyMod.CtrlCmd | monacoInstance.KeyCode.Enter, () => {
      handleRun()
    })
    ed.addCommand(monacoInstance.KeyMod.CtrlCmd | monacoInstance.KeyCode.KeyS, () => {
      saveCurrentFile()
    })
    ed.addCommand(monacoInstance.KeyMod.Shift | monacoInstance.KeyMod.Alt | monacoInstance.KeyCode.KeyF, () => {
      formatCode()
    })
    ed.addCommand(monacoInstance.KeyCode.F5, () => {
      if (isDebugging) {
        continueExecution()
      } else {
        startDebugging()
      }
    })
    ed.addCommand(monacoInstance.KeyCode.F10, () => {
      if (isDebugging) stepNext()
    })
    ed.addCommand(monacoInstance.KeyCode.F11, () => {
      if (isDebugging) stepNext()
    })
    ed.addCommand(monacoInstance.KeyMod.Shift | monacoInstance.KeyCode.F5, () => {
      stopDebugging()
    })
    ed.addCommand(monacoInstance.KeyCode.F9, () => {
      const line = ed.getPosition()?.lineNumber
      if (line) toggleBreakpoint(line)
    })
    ed.onMouseDown((e: any) => {
      if (
        e.target.type === monacoInstance.editor.MouseTargetType.GUTTER_GLYPH_MARGIN ||
        e.target.type === monacoInstance.editor.MouseTargetType.GUTTER_LINE_NUMBERS
      ) {
        const line = e.target.position?.lineNumber
        if (line) {
          toggleBreakpoint(line)
        }
      }
    })

    // ── Add custom actions to Monaco's right-click context menu ─────────────
    // Group 1: Execute (id 1.1)
    ed.addAction({
      id: 'codeforge.run',
      label: '▶  Run Code',
      keybindings: [],
      contextMenuGroupId: '1_run',
      contextMenuOrder: 1,
      run: () => { handleRunRef.current() }
    })
    ed.addAction({
      id: 'codeforge.debug',
      label: '🐛 Toggle Breakpoint at Line',
      keybindings: [],
      contextMenuGroupId: '1_run',
      contextMenuOrder: 2,
      run: (edInstance: any) => {
        const line = edInstance.getPosition()?.lineNumber
        if (line) toggleBreakpoint(line)
      }
    })
    // Group 2: Edit
    ed.addAction({
      id: 'codeforge.format',
      label: '✦  Format Code  (⇧⌥F)',
      keybindings: [],
      contextMenuGroupId: '2_edit',
      contextMenuOrder: 1,
      run: () => { formatCode() }
    })
    ed.addAction({
      id: 'codeforge.copycode',
      label: '📋 Copy All Code',
      keybindings: [],
      contextMenuGroupId: '2_edit',
      contextMenuOrder: 2,
      run: () => { copyCode() }
    })
    ed.addAction({
      id: 'codeforge.selectall',
      label: '⊞  Select All',
      keybindings: [],
      contextMenuGroupId: '2_edit',
      contextMenuOrder: 3,
      run: (edInstance: any) => { edInstance.setSelection(edInstance.getModel()?.getFullModelRange()) }
    })
    // Group 3: Navigate
    ed.addAction({
      id: 'codeforge.find',
      label: '/  Find in File  (⌘F)',
      keybindings: [],
      contextMenuGroupId: '3_nav',
      contextMenuOrder: 1,
      run: (edInstance: any) => { edInstance.getAction('actions.find')?.run() }
    })
    ed.addAction({
      id: 'codeforge.findreplace',
      label: '⇄  Find & Replace  (⌘H)',
      keybindings: [],
      contextMenuGroupId: '3_nav',
      contextMenuOrder: 2,
      run: (edInstance: any) => { edInstance.getAction('editor.action.startFindReplaceAction')?.run() }
    })
    ed.addAction({
      id: 'codeforge.gotoline',
      label: '⌥  Go to Line  (⌃G)',
      keybindings: [],
      contextMenuGroupId: '3_nav',
      contextMenuOrder: 3,
      run: (edInstance: any) => { edInstance.getAction('editor.action.gotoLine')?.run() }
    })
    // Group 4: AI
    ed.addAction({
      id: 'codeforge.ai.explain',
      label: '🔍 AI: Explain Code',
      keybindings: [],
      contextMenuGroupId: '4_ai',
      contextMenuOrder: 1,
      run: () => { sendAI('explain', ''); setAiOpen(true) }
    })
    ed.addAction({
      id: 'codeforge.ai.fix',
      label: '🐛 AI: Fix Bugs',
      keybindings: [],
      contextMenuGroupId: '4_ai',
      contextMenuOrder: 2,
      run: () => { sendAI('fix', ''); setAiOpen(true) }
    })
    ed.addAction({
      id: 'codeforge.ai.optimize',
      label: '⚡ AI: Optimize Code',
      keybindings: [],
      contextMenuGroupId: '4_ai',
      contextMenuOrder: 3,
      run: () => { sendAI('optimize', ''); setAiOpen(true) }
    })
    // Group 5: File
    ed.addAction({
      id: 'codeforge.save',
      label: '💾 Save File  (⌘S)',
      keybindings: [],
      contextMenuGroupId: '5_file',
      contextMenuOrder: 1,
      run: () => { saveRef.current() }
    })
    ed.addAction({
      id: 'codeforge.download',
      label: '⬇️  Download File',
      keybindings: [],
      contextMenuGroupId: '5_file',
      contextMenuOrder: 2,
      run: () => { downloadCode(curTab.name, editorRef.current?.getValue() || '') }
    })

    ed.focus()
  }

  const currentFontObj = getEditorFontById(editorFont)

  // Ultra-smooth, responsive Monaco options for fluid typing experience
  const editorOptions = useMemo(() => ({
    fontSize,
    fontFamily: currentFontObj.fontFamily,
    fontLigatures: fontLigatures && currentFontObj.hasLigatures,
    lineHeight: Math.round(fontSize * 1.68),
    wordWrap: wordWrap === 'on' ? 'on' as const : 'off' as const,
    minimap: { enabled: showMini, scale: 1 },
    lineNumbers: 'on' as const,
    glyphMargin: true,
    renderLineHighlight: 'all' as const,
    renderLineHighlightOnlyWhenFocus: true,
    scrollBeyondLastLine: false,
    smoothScrolling: true,
    cursorSmoothCaretAnimation: 'on' as const,
    cursorBlinking: 'smooth' as const,
    cursorStyle: 'line' as const,
    cursorWidth: 2,
    cursorSurroundingLines: 3,
    cursorSurroundingLinesStyle: 'default' as const,
    bracketPairColorization: { enabled: true, independentColorPoolPerBracketType: true },
    guides: {
      bracketPairs: 'active' as const,
      bracketPairsHorizontal: true,
      highlightActiveBracketPair: true,
      indentation: true,
      highlightActiveIndentation: true,
    },
    autoClosingBrackets: 'always' as const,
    autoClosingQuotes: 'always' as const,
    autoClosingOvertype: 'auto' as const,
    autoSurround: 'languageDefined' as const,
    autoIndent: 'full' as const,
    formatOnPaste: false,
    formatOnType: false,
    tabSize: 2,
    insertSpaces: true,
    renderWhitespace: 'selection' as const,
    renderControlCharacters: false,
    stopRenderingLineAfter: -1,
    acceptSuggestionOnEnter: 'smart' as const,
    tabCompletion: 'on' as const,
    snippetSuggestions: 'top' as const,
    suggest: {
      showKeywords: true,
      showSnippets: true,
      showMethods: true,
      showFunctions: true,
      showClasses: true,
      showModules: true,
      showVariables: true,
      showConstants: true,
      preview: true,
      snippetsPreventQuickSuggestions: false,
    },
    quickSuggestions: {
      other: true,
      comments: false,
      strings: false,
    },
    quickSuggestionsDelay: 10,
    parameterHints: { enabled: true, cycle: true },
    folding: true,
    foldingHighlight: true,
    showFoldingControls: 'mouseover' as const,
    matchBrackets: 'always' as const,
    codeLens: false,
    lightbulb: { enabled: 'off' as any },
    inlayHints: { enabled: 'off' as any },
    wordBasedSuggestions: 'currentDocument' as const,
    unicodeHighlight: {
      ambiguousCharacters: false,
      invisibleCharacters: false,
    },
    scrollbar: {
      vertical: 'visible' as const,
      horizontal: 'visible' as const,
      verticalScrollbarSize: 9,
      horizontalScrollbarSize: 9,
      useShadows: false,
    },
    overviewRulerLanes: 2,
    hideCursorInOverviewRuler: false,
    padding: { top: 14, bottom: 14 },
    contextmenu: true,
    mouseWheelZoom: false,
    mouseWheelScrollSensitivity: 1.0,
    fastScrollSensitivity: 5,
    multiCursorModifier: 'ctrlCmd' as const,
    roundedSelection: true,
    accessibilitySupport: 'off' as const,
    automaticLayout: true,
  }), [fontSize, wordWrap, showMini, editorFont, fontLigatures])

  // ── Resize handlers ───────────────────────────────────────────────────────
  const mkSideResize = (e: React.MouseEvent) => {
    sideResRef.current = { x: e.clientX, w: sideW }
    const mv = (ev: MouseEvent) => { if (sideResRef.current) setSideW(Math.max(160, Math.min(400, sideResRef.current.w + ev.clientX - sideResRef.current.x))) }
    const up = () => { sideResRef.current = null; window.removeEventListener('mousemove', mv); window.removeEventListener('mouseup', up) }
    window.addEventListener('mousemove', mv); window.addEventListener('mouseup', up)
  }
  const mkAIResize = (e: React.MouseEvent) => {
    aiResRef.current = { x: e.clientX, w: aiW }
    const mv = (ev: MouseEvent) => { if (aiResRef.current) setAiW(Math.max(240, Math.min(520, aiResRef.current.w + aiResRef.current.x - ev.clientX))) }
    const up = () => { aiResRef.current = null; window.removeEventListener('mousemove', mv); window.removeEventListener('mouseup', up) }
    window.addEventListener('mousemove', mv); window.addEventListener('mouseup', up)
  }
  const mkConsResize = (e: React.MouseEvent) => {
    consResRef.current = { y: e.clientY, h: consH }
    const mv = (ev: MouseEvent) => { if (consResRef.current) setConsH(Math.max(60, Math.min(500, consResRef.current.h + consResRef.current.y - ev.clientY))) }
    const up = () => { consResRef.current = null; window.removeEventListener('mousemove', mv); window.removeEventListener('mouseup', up) }
    window.addEventListener('mousemove', mv); window.addEventListener('mouseup', up)
  }
  const mkWebResize = (e: React.MouseEvent) => {
    webResRef.current = { x: e.clientX, w: webPreviewW }
    const mv = (ev: MouseEvent) => {
      if (webResRef.current) {
        setWebPreviewW(Math.max(260, Math.min(window.innerWidth * 0.8, webResRef.current.w + webResRef.current.x - ev.clientX)))
      }
    }
    const up = () => {
      webResRef.current = null
      window.removeEventListener('mousemove', mv)
      window.removeEventListener('mouseup', up)
    }
    window.addEventListener('mousemove', mv)
    window.addEventListener('mouseup', up)
  }

  const hasErr = result && (result.stderr || result.compile_output)
  const visibleCommands = COMMANDS.filter(command => `${command.label} ${command.detail}`.toLowerCase().includes(commandQuery.toLowerCase()))

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg-app)', overflow: 'hidden', fontFamily: 'Inter, system-ui, sans-serif' }}>

      {/* Toast */}
      {toast && (
        <div className="toast-notification" style={{ position: 'fixed', top: 54, right: 16, zIndex: 9999 }}>
          <span style={{ fontSize: 14 }}>✦</span>
          {toast}
        </div>
      )}

      {/* ── Right-click Context Menu ──────────────────────────────────────── */}
      {contextMenu && (
        <>
          {/* Backdrop to close menu on outside click */}
          <div
            style={{ position: 'fixed', inset: 0, zIndex: 8998 }}
            onClick={() => setContextMenu(null)}
            onContextMenu={(e) => { e.preventDefault(); setContextMenu(null) }}
          />
          <div
            style={{
              position: 'fixed',
              top: Math.min(contextMenu.y, window.innerHeight - 180),
              left: Math.min(contextMenu.x, window.innerWidth - 200),
              zIndex: 8999,
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: 8,
              boxShadow: '0 8px 32px rgba(0,0,0,0.55)',
              minWidth: 190,
              padding: '4px 0',
              animation: 'modal-up .1s ease-out',
              overflow: 'hidden',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* File name header */}
            <div style={{ padding: '6px 14px 6px', fontSize: 11, color: 'var(--text-dim)', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
              <span style={{ fontSize: 10 }}>📄</span>
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 140 }}>{contextMenu.fileName.split('/').pop()}</span>
            </div>

            {/* Rename */}
            <button
              onClick={() => {
                setRenameTarget({ id: contextMenu.fileId, name: contextMenu.fileName })
                setRenameValue(contextMenu.fileName.split('/').pop() || contextMenu.fileName)
                setContextMenu(null)
              }}
              style={{ width: '100%', textAlign: 'left', background: 'none', border: 'none', padding: '7px 14px', fontSize: 12, color: 'var(--text-base)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 9, transition: 'background .1s' }}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--accent-subtle)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'none')}
            >
              <span style={{ fontSize: 13 }}>✏️</span> Rename
              <kbd style={{ marginLeft: 'auto', fontSize: 10, color: 'var(--text-dim)', background: 'var(--bg-app)', border: '1px solid var(--border)', borderRadius: 3, padding: '1px 4px' }}>F2</kbd>
            </button>

            {/* Copy Code */}
            <button
              onClick={() => {
                const fileTab = tabs.find(t => t.id === contextMenu.fileId)
                const code = fileTab?.code || ''
                navigator.clipboard.writeText(code).catch(() => {})
                showToast(`Code copied from ${contextMenu.fileName.split('/').pop()}`)
                setContextMenu(null)
              }}
              style={{ width: '100%', textAlign: 'left', background: 'none', border: 'none', padding: '7px 14px', fontSize: 12, color: 'var(--text-base)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 9, transition: 'background .1s' }}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--accent-subtle)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'none')}
            >
              <span style={{ fontSize: 13 }}>📋</span> Copy Code
            </button>

            {/* Copy Path */}
            <button
              onClick={() => {
                navigator.clipboard.writeText(contextMenu.fileName).catch(() => {})
                showToast(`Path copied: ${contextMenu.fileName}`)
                setContextMenu(null)
              }}
              style={{ width: '100%', textAlign: 'left', background: 'none', border: 'none', padding: '7px 14px', fontSize: 12, color: 'var(--text-base)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 9, transition: 'background .1s' }}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--accent-subtle)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'none')}
            >
              <span style={{ fontSize: 13 }}>📄</span> Copy Path
            </button>

            {/* Duplicate File */}
            <button
              onClick={() => {
                duplicateWorkspaceFile(contextMenu.fileId)
                setContextMenu(null)
              }}
              style={{ width: '100%', textAlign: 'left', background: 'none', border: 'none', padding: '7px 14px', fontSize: 12, color: 'var(--text-base)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 9, transition: 'background .1s' }}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--accent-subtle)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'none')}
            >
              <span style={{ fontSize: 13 }}>📑</span> Duplicate File
            </button>

            {/* Divider */}
            <div style={{ height: 1, background: 'var(--border)', margin: '3px 0' }} />

            {/* Delete — red, only way to delete */}
            <button
              onClick={() => {
                deleteWorkspaceFile(contextMenu.fileId)
                setContextMenu(null)
              }}
              style={{ width: '100%', textAlign: 'left', background: 'none', border: 'none', padding: '7px 14px', fontSize: 12, color: '#f85149', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 9, fontWeight: 600, transition: 'background .1s' }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(248,81,73,0.12)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'none')}
            >
              <span style={{ fontSize: 13 }}>🗑️</span> Delete
              <kbd style={{ marginLeft: 'auto', fontSize: 10, color: '#f85149', background: 'rgba(248,81,73,0.1)', border: '1px solid rgba(248,81,73,0.3)', borderRadius: 3, padding: '1px 4px' }}>Del</kbd>
            </button>
          </div>
        </>
      )}

      {/* ── Folder Right-click Context Menu ───────────────────────────────── */}
      {folderContextMenu && (
        <>
          <div
            style={{ position: 'fixed', inset: 0, zIndex: 8998 }}
            onClick={() => setFolderContextMenu(null)}
            onContextMenu={(e) => { e.preventDefault(); setFolderContextMenu(null) }}
          />
          <div
            style={{
              position: 'fixed',
              top: Math.min(folderContextMenu.y, window.innerHeight - 200),
              left: Math.min(folderContextMenu.x, window.innerWidth - 200),
              zIndex: 8999,
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: 8,
              boxShadow: '0 8px 32px rgba(0,0,0,0.55)',
              minWidth: 200,
              padding: '4px 0',
              animation: 'modal-up .1s ease-out',
              overflow: 'hidden',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ padding: '6px 14px 6px', fontSize: 11, color: 'var(--text-dim)', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
              <FolderIcon size={12} style={{ color: 'var(--yellow)' }} />
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 140 }}>{folderContextMenu.folder}</span>
            </div>

            <button
              onClick={() => {
                const folder = folderContextMenu.folder
                setFolderContextMenu(null)
                setCollapsedFolders(prev => ({ ...prev, [folder]: false }))
                setInlineItem({ type: 'file', parentFolder: folder })
                setInlineName('')
              }}
              className="menu-item-row"
            >
              <FilePlusIcon size={13} style={{ color: 'var(--accent)' }} />
              <span>New File in Folder...</span>
            </button>

            <button
              onClick={() => {
                const folder = folderContextMenu.folder
                setFolderContextMenu(null)
                setCollapsedFolders(prev => ({ ...prev, [folder]: false }))
                setInlineItem({ type: 'folder', parentFolder: folder })
                setInlineName('')
              }}
              className="menu-item-row"
            >
              <FolderPlusIcon size={13} style={{ color: 'var(--yellow)' }} />
              <span>New Folder in Folder...</span>
            </button>

            <div style={{ height: 1, background: 'var(--border)', margin: '3px 0' }} />

            <button
              onClick={() => {
                const folder = folderContextMenu.folder
                setFolderContextMenu(null)
                deleteFolder(folder)
              }}
              className="menu-item-row"
              style={{ color: '#f85149', fontWeight: 600 }}
            >
              <TrashIcon size={13} />
              <span>Delete Folder</span>
            </button>
          </div>
        </>
      )}

      {/* ── Blank Space Explorer Right-click Context Menu ─────────────────── */}
      {blankContextMenu && (
        <>
          <div
            style={{ position: 'fixed', inset: 0, zIndex: 8998 }}
            onClick={() => setBlankContextMenu(null)}
            onContextMenu={(e) => { e.preventDefault(); setBlankContextMenu(null) }}
          />
          <div
            style={{
              position: 'fixed',
              top: Math.min(blankContextMenu.y, window.innerHeight - 240),
              left: Math.min(blankContextMenu.x, window.innerWidth - 220),
              zIndex: 8999,
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: 8,
              boxShadow: '0 8px 32px rgba(0,0,0,0.55)',
              minWidth: 210,
              padding: '4px 0',
              animation: 'modal-up .1s ease-out',
              overflow: 'hidden',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => {
                setBlankContextMenu(null)
                setWorkspaceExpanded(true)
                setInlineItem({ type: 'file', parentFolder: '' })
                setInlineName('')
              }}
              className="menu-item-row"
            >
              <FilePlusIcon size={13} style={{ color: 'var(--accent)' }} />
              <span>New File...</span>
              <kbd style={{ marginLeft: 'auto', fontSize: 10, color: 'var(--text-dim)', background: 'var(--bg-app)', border: '1px solid var(--border)', borderRadius: 3, padding: '1px 5px' }}>Ctrl+N</kbd>
            </button>

            <button
              onClick={() => {
                setBlankContextMenu(null)
                setWorkspaceExpanded(true)
                setInlineItem({ type: 'folder', parentFolder: '' })
                setInlineName('')
              }}
              className="menu-item-row"
            >
              <FolderPlusIcon size={13} style={{ color: 'var(--yellow)' }} />
              <span>New Folder...</span>
            </button>

            <div style={{ height: 1, background: 'var(--border)', margin: '3px 0' }} />

            <button
              onClick={() => {
                setBlankContextMenu(null)
                handleOpenFileWithPicker()
              }}
              className="menu-item-row"
            >
              <FileOpenIcon size={13} style={{ color: '#a78bfa' }} />
              <span>Open File from Computer...</span>
              <kbd style={{ marginLeft: 'auto', fontSize: 10, color: 'var(--text-dim)', background: 'var(--bg-app)', border: '1px solid var(--border)', borderRadius: 3, padding: '1px 5px' }}>Ctrl+O</kbd>
            </button>

            <button
              onClick={() => {
                setBlankContextMenu(null)
                handleOpenProjectWithPicker()
              }}
              className="menu-item-row"
            >
              <FolderOpenIcon size={13} style={{ color: '#56b6c2' }} />
              <span>Open Project / Folder...</span>
              <kbd style={{ marginLeft: 'auto', fontSize: 10, color: 'var(--text-dim)', background: 'var(--bg-app)', border: '1px solid var(--border)', borderRadius: 3, padding: '1px 5px' }}>Ctrl+K</kbd>
            </button>

            <div style={{ height: 1, background: 'var(--border)', margin: '3px 0' }} />

            <button
              onClick={() => {
                setBlankContextMenu(null)
                refreshExplorer()
              }}
              className="menu-item-row"
            >
              <RefreshIcon size={13} />
              <span>Refresh Explorer</span>
            </button>

            <button
              onClick={() => {
                setBlankContextMenu(null)
                handleDownloadProject()
              }}
              className="menu-item-row"
            >
              <DownloadIcon size={13} style={{ color: 'var(--accent)' }} />
              <span>Download Entire Project (.zip)</span>
            </button>
          </div>
        </>
      )}

      {/* ── Editor Right-click Context Menu ───────────────────────────────── */}
      {editorCtxMenu && (
        <>
          <div
            style={{ position: 'fixed', inset: 0, zIndex: 8998 }}
            onClick={() => setEditorCtxMenu(null)}
            onContextMenu={(e) => { e.preventDefault(); setEditorCtxMenu(null) }}
          />
          <div
            style={{
              position: 'fixed',
              top: Math.min(editorCtxMenu.y, window.innerHeight - 420),
              left: Math.min(editorCtxMenu.x, window.innerWidth - 230),
              zIndex: 8999,
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: 8,
              boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
              minWidth: 220,
              padding: '4px 0',
              animation: 'modal-up .1s ease-out',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Section: Run */}
            <div style={{ padding: '4px 12px 2px', fontSize: 10, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Execute</div>
            {[
              { label: '▶  Run Code', shortcut: '⌃↵', action: () => { handleRun(); setEditorCtxMenu(null) }, color: '#3fb950' },
              { label: '🐛 Debug / Breakpoint', shortcut: 'F9', action: () => { const line = editorRef.current?.getPosition()?.lineNumber; if (line) toggleBreakpoint(line); showToast(`Breakpoint at line ${line}`); setEditorCtxMenu(null) }, color: '#eab308' },
            ].map(item => (
              <button key={item.label}
                onClick={item.action}
                style={{ width: '100%', textAlign: 'left', background: 'none', border: 'none', padding: '7px 14px', fontSize: 12, color: item.color || 'var(--text-base)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6, transition: 'background .1s' }}
                onMouseEnter={e => (e.currentTarget.style.background = 'var(--accent-subtle)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'none')}
              >
                <span>{item.label}</span>
                {item.shortcut && <kbd style={{ fontSize: 10, color: 'var(--text-dim)', background: 'var(--bg-app)', border: '1px solid var(--border)', borderRadius: 3, padding: '1px 5px', flexShrink: 0 }}>{item.shortcut}</kbd>}
              </button>
            ))}

            <div style={{ height: 1, background: 'var(--border)', margin: '3px 0' }} />
            {/* Section: Edit */}
            <div style={{ padding: '4px 12px 2px', fontSize: 10, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Edit</div>
            {[
              { label: '✦  Format Code', shortcut: '⇧⌥F', action: async () => { setEditorCtxMenu(null); await formatCode() } },
              { label: '↩  Undo', shortcut: '⌘Z', action: () => { editorRef.current?.trigger('keyboard', 'undo', null); setEditorCtxMenu(null) } },
              { label: '↪  Redo', shortcut: '⌘⇧Z', action: () => { editorRef.current?.trigger('keyboard', 'redo', null); setEditorCtxMenu(null) } },
              { label: '📋 Copy Code', shortcut: '⌘C', action: async () => { setEditorCtxMenu(null); await copyCode() } },
              { label: '📄 Paste', shortcut: '⌘V', action: () => { editorRef.current?.trigger('keyboard', 'editor.action.clipboardPasteAction', null); setEditorCtxMenu(null) } },
              { label: '⊞  Select All', shortcut: '⌘A', action: () => { editorRef.current?.trigger('keyboard', 'selectAll', null); setEditorCtxMenu(null) } },
            ].map(item => (
              <button key={item.label}
                onClick={item.action}
                style={{ width: '100%', textAlign: 'left', background: 'none', border: 'none', padding: '7px 14px', fontSize: 12, color: 'var(--text-base)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6, transition: 'background .1s' }}
                onMouseEnter={e => (e.currentTarget.style.background = 'var(--accent-subtle)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'none')}
              >
                <span>{item.label}</span>
                {item.shortcut && <kbd style={{ fontSize: 10, color: 'var(--text-dim)', background: 'var(--bg-app)', border: '1px solid var(--border)', borderRadius: 3, padding: '1px 5px', flexShrink: 0 }}>{item.shortcut}</kbd>}
              </button>
            ))}

            <div style={{ height: 1, background: 'var(--border)', margin: '3px 0' }} />
            {/* Section: Find */}
            <div style={{ padding: '4px 12px 2px', fontSize: 10, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Navigate</div>
            {[
              { label: '/ Find in File', shortcut: '⌘F', action: () => { editorRef.current?.getAction('actions.find')?.run(); setEditorCtxMenu(null) } },
              { label: '⇄  Find & Replace', shortcut: '⌘H', action: () => { editorRef.current?.getAction('editor.action.startFindReplaceAction')?.run(); setEditorCtxMenu(null) } },
              { label: '⌥  Go to Line', shortcut: '⌃G', action: () => { editorRef.current?.getAction('editor.action.gotoLine')?.run(); setEditorCtxMenu(null) } },
            ].map(item => (
              <button key={item.label}
                onClick={item.action}
                style={{ width: '100%', textAlign: 'left', background: 'none', border: 'none', padding: '7px 14px', fontSize: 12, color: 'var(--text-base)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6, transition: 'background .1s' }}
                onMouseEnter={e => (e.currentTarget.style.background = 'var(--accent-subtle)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'none')}
              >
                <span>{item.label}</span>
                {item.shortcut && <kbd style={{ fontSize: 10, color: 'var(--text-dim)', background: 'var(--bg-app)', border: '1px solid var(--border)', borderRadius: 3, padding: '1px 5px', flexShrink: 0 }}>{item.shortcut}</kbd>}
              </button>
            ))}

            <div style={{ height: 1, background: 'var(--border)', margin: '3px 0' }} />
            {/* Section: AI */}
            <div style={{ padding: '4px 12px 2px', fontSize: 10, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>AI Assistant</div>
            {[
              { label: '🔍 Explain Code', action: () => { sendAI('explain', ''); setSideOpen(true); setAiOpen(true); setEditorCtxMenu(null) } },
              { label: '🐛 Fix Bugs', action: () => { sendAI('fix', ''); setSideOpen(true); setAiOpen(true); setEditorCtxMenu(null) } },
              { label: '⚡ Optimize', action: () => { sendAI('optimize', ''); setSideOpen(true); setAiOpen(true); setEditorCtxMenu(null) } },
            ].map(item => (
              <button key={item.label}
                onClick={item.action}
                style={{ width: '100%', textAlign: 'left', background: 'none', border: 'none', padding: '7px 14px', fontSize: 12, color: 'var(--text-base)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 9, transition: 'background .1s' }}
                onMouseEnter={e => (e.currentTarget.style.background = 'var(--accent-subtle)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'none')}
              >
                {item.label}
              </button>
            ))}

            <div style={{ height: 1, background: 'var(--border)', margin: '3px 0' }} />
            {/* Section: File */}
            {[
              { label: '💾 Save File', shortcut: '⌘S', action: () => { saveCurrentFile(); setEditorCtxMenu(null) } },
              { label: '⬇️  Download File', action: () => { downloadCode(curTab.name, getActiveCode()); setEditorCtxMenu(null) } },
            ].map(item => (
              <button key={item.label}
                onClick={item.action}
                style={{ width: '100%', textAlign: 'left', background: 'none', border: 'none', padding: '7px 14px', fontSize: 12, color: 'var(--text-base)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6, transition: 'background .1s' }}
                onMouseEnter={e => (e.currentTarget.style.background = 'var(--accent-subtle)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'none')}
              >
                <span>{item.label}</span>
                {item.shortcut && <kbd style={{ fontSize: 10, color: 'var(--text-dim)', background: 'var(--bg-app)', border: '1px solid var(--border)', borderRadius: 3, padding: '1px 5px', flexShrink: 0 }}>{item.shortcut}</kbd>}
              </button>
            ))}
          </div>
        </>
      )}

      {/* ── View Switcher: CodeForge Events Platform vs IDE Editor ───────────── */}
      {viewMode === 'contests' ? (
        <div style={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>
          <EventsLandingPage
            logoImg={logoImg}
            authUser={authUser}
            onBackToEditor={() => setViewMode('editor')}
            onOpenAuth={() => setShowAuth(true)}
            onLaunchArena={(event) => {
              const convertedContest: Contest = {
                id: event.id,
                title: event.title,
                slug: event.slug,
                type: event.category === 'assessment' ? 'assessment' : 'competitive',
                status: event.status === 'LIVE' ? 'live' : event.status === 'COMPLETED' ? 'ended' : 'upcoming',
                description: event.description,
                startTime: `${event.startDate}T${event.startTime}:00`,
                endTime: `${event.endDate}T${event.endTime}:00`,
                durationMinutes: event.durationMinutes,
                totalPoints: event.rounds.reduce((acc, r) => acc + (r.maxScore || 100), 0),
                registeredUsersCount: event.currentParticipantsCount,
                proctoring: event.proctoring,
                privacyNotice: {
                  dataCollected: ['Webcam video snapshots', 'Screen capture stream', 'Window visibility & clipboard telemetry'],
                  purpose: 'Contest integrity and fair competitive standing verification.',
                  retentionPolicy: 'Stream frames processed ephemerally; security violation telemetry retained for audit.',
                  whoHasAccess: 'Authorized contest administrators & anti-cheat audit panel only.',
                  refusalConsequence: 'Proctored mode will not activate and submission privileges will remain locked.',
                },
                problems: event.rounds.flatMap((r) =>
                  r.questions.map((q) => ({
                    id: q.id,
                    title: q.title,
                    slug: q.slug,
                    difficulty: q.difficulty,
                    points: q.points,
                    timeLimitMs: q.timeLimitMs,
                    memoryLimitMb: q.memoryLimitMb,
                    description: q.description,
                    inputFormat: q.inputFormat,
                    outputFormat: q.outputFormat,
                    constraints: q.constraints,
                    sampleTestCases: q.testCases.filter((tc) => !tc.isHidden).map((tc) => ({
                      id: tc.id,
                      input: tc.input,
                      expectedOutput: tc.expectedOutput,
                      explanation: tc.explanation,
                    })),
                    starterCode: {
                      ...q.starterCode,
                      python: q.starterCode?.python || '# Write code here\n',
                      cpp: q.starterCode?.cpp || '// Write code here\n',
                      javascript: q.starterCode?.javascript || '// Write code here\n',
                    } as ContestProblem['starterCode'],
                  }))
                ),
              };
              setSelectedContestForCheck(convertedContest);
            }}
          />
        </div>
      ) : (
        <>
          {/* ── Header ────────────────────────────────────────────────────────── */}
          <header className="app-header" style={{ height: 46, flexShrink: 0, display: 'flex', alignItems: 'center', zIndex: 40 }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0 16px', borderRight: '1px solid var(--border)', height: '100%', flexShrink: 0 }}>
          <img src={logoImg} alt="CodeForge" className="logo-img" />
          <span className="brand-text">CodeForge</span>
        </div>

        {/* Simple File Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 1, padding: '0 6px', borderRight: '1px solid var(--border)', height: '100%', flexShrink: 0 }}>
          <button
            onClick={() => { setPanel('explorer'); setSideOpen(true); setWorkspaceExpanded(true); setInlineItem({ type: 'file', parentFolder: '' }); setInlineName('') }}
            title="New File (Ctrl+N)"
            style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'transparent', border: 'none', color: 'var(--text-muted)', fontSize: 12, padding: '4px 9px', borderRadius: 4, cursor: 'pointer', transition: 'all 0.1s' }}
            onMouseEnter={e => { e.currentTarget.style.color = 'var(--text-base)'; e.currentTarget.style.background = 'var(--bg-hover)' }}
            onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.background = 'transparent' }}
          >
            <FilePlusIcon size={13} /> New File
          </button>
          <button
            onClick={() => { setPanel('explorer'); setSideOpen(true); setWorkspaceExpanded(true); setInlineItem({ type: 'folder', parentFolder: '' }); setInlineName('') }}
            title="New Folder"
            style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'transparent', border: 'none', color: 'var(--text-muted)', fontSize: 12, padding: '4px 9px', borderRadius: 4, cursor: 'pointer', transition: 'all 0.1s' }}
            onMouseEnter={e => { e.currentTarget.style.color = 'var(--text-base)'; e.currentTarget.style.background = 'var(--bg-hover)' }}
            onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.background = 'transparent' }}
          >
            <FolderPlusIcon size={13} /> New Folder
          </button>
          <div ref={openMenuRef} style={{ position: 'relative' }}>
            <button
              onClick={() => setOpenMenuOpen(p => !p)}
              title="Open File or Project"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                background: openMenuOpen ? 'var(--bg-hover)' : 'transparent',
                border: 'none',
                color: openMenuOpen ? 'var(--text-base)' : 'var(--text-muted)',
                fontSize: 12,
                padding: '4px 9px',
                borderRadius: 4,
                cursor: 'pointer',
                transition: 'all 0.1s',
              }}
              onMouseEnter={e => { e.currentTarget.style.color = 'var(--text-base)'; e.currentTarget.style.background = 'var(--bg-hover)' }}
              onMouseLeave={e => { if (!openMenuOpen) { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.background = 'transparent' } }}
            >
              <FileOpenIcon size={13} /> Open
              <ChevronDown size={10} style={{ opacity: 0.7 }} />
            </button>

            {openMenuOpen && (
              <div
                style={{
                  position: 'absolute',
                  top: 'calc(100% + 4px)',
                  left: 0,
                  background: 'var(--bg-panel)',
                  border: '1px solid var(--border)',
                  borderRadius: 7,
                  boxShadow: '0 8px 24px rgba(0,0,0,0.5), 0 0 1px rgba(255,255,255,0.1)',
                  minWidth: 210,
                  zIndex: 9999,
                  padding: '5px 0',
                }}
              >
                <button
                  onClick={() => {
                    setOpenMenuOpen(false)
                    handleOpenFileWithPicker()
                  }}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 12px',
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-base)',
                    fontSize: 12,
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-hover)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <FileOpenIcon size={14} style={{ color: 'var(--accent)' }} />
                    <span>Open File from Computer...</span>
                  </div>
                  <kbd style={{ fontSize: 10, color: 'var(--text-dim)', background: 'var(--bg-app)', border: '1px solid var(--border)', borderRadius: 3, padding: '1px 5px' }}>
                    Ctrl+O
                  </kbd>
                </button>

                <button
                  onClick={() => {
                    setOpenMenuOpen(false)
                    handleOpenProjectWithPicker()
                  }}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 12px',
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-base)',
                    fontSize: 12,
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-hover)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <FolderOpenIcon size={14} style={{ color: '#eab308' }} />
                    <span>Open Project / Folder...</span>
                  </div>
                </button>

                <div style={{ height: 1, background: 'var(--border)', margin: '4px 0' }} />

                <button
                  onClick={() => {
                    setOpenMenuOpen(false)
                    handleSaveAsDisk()
                  }}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 12px',
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-base)',
                    fontSize: 12,
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-hover)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <SaveIcon size={14} style={{ color: '#38bdf8' }} />
                    <span>Save As... (Choose Location)</span>
                  </div>
                  <kbd style={{ fontSize: 10, color: 'var(--text-dim)', background: 'var(--bg-app)', border: '1px solid var(--border)', borderRadius: 3, padding: '1px 5px' }}>
                    Ctrl+Shift+S
                  </kbd>
                </button>
              </div>
            )}
          </div>
          <button
            onClick={() => saveCurrentFile()}
            title="Save (Ctrl+S)"
            style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'transparent', border: 'none', color: 'var(--text-muted)', fontSize: 12, padding: '4px 9px', borderRadius: 4, cursor: 'pointer', transition: 'all 0.1s' }}
            onMouseEnter={e => { e.currentTarget.style.color = 'var(--text-base)'; e.currentTarget.style.background = 'var(--bg-hover)' }}
            onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.background = 'transparent' }}
          >
            <SaveIcon size={13} /> Save
          </button>
          <div ref={downloadMenuRef} style={{ position: 'relative' }}>
            <button
              onClick={() => setDownloadMenuOpen(p => !p)}
              title="Download Options"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                background: downloadMenuOpen ? 'var(--bg-hover)' : 'transparent',
                border: 'none',
                color: downloadMenuOpen ? 'var(--text-base)' : 'var(--text-muted)',
                fontSize: 12,
                padding: '4px 9px',
                borderRadius: 4,
                cursor: 'pointer',
                transition: 'all 0.1s'
              }}
              onMouseEnter={e => { e.currentTarget.style.color = 'var(--text-base)'; e.currentTarget.style.background = 'var(--bg-hover)' }}
              onMouseLeave={e => {
                if (!downloadMenuOpen) {
                  e.currentTarget.style.color = 'var(--text-muted)'
                  e.currentTarget.style.background = 'transparent'
                }
              }}
            >
              <DownloadIcon size={13} />
              <span>Download</span>
              <ChevronDown size={11} style={{ opacity: 0.6, marginLeft: -1, transform: downloadMenuOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }} />
            </button>

            {downloadMenuOpen && (
              <div
                style={{
                  position: 'absolute',
                  top: 'calc(100% + 4px)',
                  left: 0,
                  width: 220,
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border)',
                  borderRadius: 7,
                  boxShadow: '0 8px 24px rgba(0,0,0,0.45)',
                  zIndex: 1000,
                  padding: '5px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 2,
                }}
              >
                <button
                  onClick={() => {
                    downloadCode(curTab.name, getActiveCode())
                    setDownloadMenuOpen(false)
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 9,
                    width: '100%',
                    padding: '7px 10px',
                    background: 'none',
                    border: 'none',
                    borderRadius: 5,
                    color: 'var(--text-base)',
                    fontSize: 12,
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'background 0.1s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-hover)' }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'none' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 22, height: 22, borderRadius: 4, background: 'rgba(56, 189, 248, 0.12)', color: '#38bdf8', flexShrink: 0 }}>
                    <DownloadIcon size={13} />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                    <span style={{ fontWeight: 500 }}>Download Current File</span>
                    <span style={{ fontSize: 10, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{curTab.name}</span>
                  </div>
                </button>

                <div style={{ height: 1, background: 'var(--border)', margin: '2px 4px' }} />

                <button
                  onClick={() => {
                    handleDownloadProject()
                    setDownloadMenuOpen(false)
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 9,
                    width: '100%',
                    padding: '7px 10px',
                    background: 'none',
                    border: 'none',
                    borderRadius: 5,
                    color: 'var(--text-base)',
                    fontSize: 12,
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'background 0.1s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-hover)' }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'none' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 22, height: 22, borderRadius: 4, background: 'rgba(168, 85, 247, 0.12)', color: '#c084fc', flexShrink: 0 }}>
                    <FolderIcon size={13} />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                    <span style={{ fontWeight: 500 }}>Download Projects</span>
                    <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>Entire workspace as .zip</span>
                  </div>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Contests & Assessments Button (Placed after Download and before Search) */}
        <button
          onClick={() => setViewMode('contests')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            marginLeft: 10,
            padding: '5px 12px',
            background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.12), rgba(59, 130, 246, 0.12))',
            border: '1px solid rgba(6, 182, 212, 0.35)',
            borderRadius: 6,
            color: '#38bdf8',
            fontSize: 12,
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.15s ease',
            boxShadow: '0 2px 8px rgba(6, 182, 212, 0.12)',
            flexShrink: 0
          }}
          onMouseEnter={e => {
            e.currentTarget.style.borderColor = 'rgba(6, 182, 212, 0.6)'
            e.currentTarget.style.background = 'linear-gradient(135deg, rgba(6, 182, 212, 0.22), rgba(59, 130, 246, 0.22))'
            e.currentTarget.style.boxShadow = '0 2px 12px rgba(6, 182, 212, 0.25)'
          }}
          onMouseLeave={e => {
            e.currentTarget.style.borderColor = 'rgba(6, 182, 212, 0.35)'
            e.currentTarget.style.background = 'linear-gradient(135deg, rgba(6, 182, 212, 0.12), rgba(59, 130, 246, 0.12))'
            e.currentTarget.style.boxShadow = '0 2px 8px rgba(6, 182, 212, 0.12)'
          }}
          title="Browse Contests, Assessments, and Anti-Cheat Proctor Arena"
        >
          <TrophyIcon style={{ width: 14, height: 14, color: '#38bdf8' }} />
          <span>Contests</span>
          <span style={{
            fontSize: 9,
            fontWeight: 700,
            background: 'rgba(239, 68, 68, 0.2)',
            color: '#f87171',
            border: '1px solid rgba(239, 68, 68, 0.4)',
            padding: '1px 5px',
            borderRadius: 10,
            textTransform: 'uppercase',
            letterSpacing: '0.04em'
          }}>
            Live
          </span>
        </button>

        {/* Search Bar - nicely separated from Language and Contests */}
        <button onClick={() => setShowCommands(true)} className="top-search" style={{ marginLeft: 10 }} aria-label="Search files, commands, or ask AI">
          <span style={{ color: 'var(--accent)' }}>⌕</span> Search files, commands, or ask AI...
          <kbd style={{ marginLeft: 'auto', color: 'var(--text-dim)', fontSize: 10 }}>⌘K</kbd>
        </button>

        <div style={{ flex: 1 }} />

        {/* Header actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0 8px' }}>
          {/* AI Toggle */}
          <button onClick={() => setAiOpen(p => !p)}
            style={{
              display: 'flex', alignItems: 'center', gap: 5,
              background: aiOpen ? 'var(--accent-subtle)' : 'transparent',
              border: '1px solid',
              borderColor: aiOpen ? 'var(--accent-border)' : 'var(--border)',
              borderRadius: 6, padding: '4px 10px', cursor: 'pointer',
              fontSize: 11, fontWeight: 500,
              color: aiOpen ? 'var(--accent)' : 'var(--text-muted)',
              transition: 'all .1s'
            }}>
            <span style={{ fontSize: 12 }}>✦</span>
            AI {aiOpen ? 'On' : 'Off'}
          </button>

          {/* Debugger */}
          <button
            onClick={() => { if (isDebugging) { stopDebugging() } else { startDebugging() } }}
            className="btn btn-ghost"
            style={{ padding: '4px 11px', fontSize: 12, fontWeight: 500, color: isDebugging ? 'var(--yellow)' : 'var(--text-muted)', borderColor: isDebugging ? 'var(--border-glow)' : 'var(--border)' }}
            title={isDebugging ? 'Stop Debugger (Shift+F5)' : 'Start Interactive Debugger (F5)'}
          >
            🐛 {isDebugging ? 'Debugging…' : 'Debug'}
          </button>

          {/* Run Button */}
          <button onClick={handleRun} disabled={running} className="btn btn-primary" style={{ padding: '4px 16px', fontSize: 12, fontWeight: 600, gap: 6 }}>
            {running
              ? <><div className="spin" style={{ width: 10, height: 10, borderRadius: '50%', border: '2px solid rgba(255,255,255,.3)', borderTopColor: '#fff' }} />Running…</>
              : <><svg width="7" height="9" viewBox="0 0 7 9" fill="white"><polygon points="0,0 7,4.5 0,9"/></svg> Run</>}
          </button>
        </div>
      </header>

      {/* ── Body ──────────────────────────────────────────────────────────── */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

        {/* Activity bar */}
        <div style={{ width: 46, background: 'var(--bg-activity)', borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0, paddingTop: 4 }}>
          {([
            { id: 'explorer' as Panel, tip: 'Explorer',      d: 'M4 2h5l3 3v9H4V2ZM9 2v3h3' },
            { id: 'history'  as Panel, tip: 'Recent Saves',   d: 'M8 2C4.7 2 2 4.7 2 8s2.7 6 6 6 6-2.7 6-6-2.7-6-6-6Zm0 3v3l2 2' },
            { id: 'debug'    as Panel, tip: 'Run and Debug',  d: 'M8 2a3 3 0 0 0-3 3v2h6V5a3 3 0 0 0-3-3ZM4 8v1a4 4 0 0 0 8 0V8H4Zm-2 1h2m8 0h2M3 12l2-1m6 1 2 1M3 6l2 1m6-1 2-1' },
            { id: 'source-control' as Panel, tip: 'Source Control', d: 'M5 3a2 2 0 1 0 0 4 2 2 0 0 0 0-4Zm6 6a2 2 0 1 0 0 4 2 2 0 0 0 0-4ZM5 7v2a2 2 0 0 0 2 2h2' },
            { id: 'profile' as Panel, tip: 'Profile', d: 'M8 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm-5 6a5 5 0 0 1 10 0' },
          ]).map(item => (
            <button key={item.id} data-tooltip={item.tip}
              onClick={() => { setPanel(item.id); setSideOpen(true) }}
              className={`activity-btn ${panel === item.id && sideOpen ? 'active' : ''}`}>
              <I d={item.d} s={16} sw={1.2} />
            </button>
          ))}
          <div style={{ flex: 1 }} />
          <button data-tooltip="Share Code" onClick={doShare} className="activity-btn" style={{ marginBottom: 4 }} aria-label="Share Code">
            <ShareIcon size={16} />
          </button>
          <button data-tooltip="Download Code" onClick={() => downloadCode(curTab.name, curTab.code)} className="activity-btn" style={{ marginBottom: 4 }} aria-label="Download Code">
            <DownloadIcon size={16} />
          </button>
          <button data-tooltip="VS Code Themes" onClick={() => openSettings('themes')} className="activity-btn" style={{ marginBottom: 4 }} aria-label="VS Code Themes">
            <PaletteIcon size={16} />
          </button>
          <button data-tooltip="Settings" onClick={() => setShowSettings(true)} className="activity-btn" style={{ marginBottom: 4 }}>
            <I d="M8 5a3 3 0 1 0 0 6 3 3 0 0 0 0-6Zm-5 3H1M15 8h-2M4.2 4.2 3 3M12 12l-1.2-1.2M4.2 11.8 3 13M12 4 10.8 5.2" s={16} sw={1.2} />
          </button>
          <button data-tooltip="Keyboard Shortcuts" onClick={() => setShowKeys(true)} className="activity-btn" style={{ marginBottom: 8 }}>
            <I d="M2 4h12v8H2zM5 4v8M11 4v8M2 8h12" s={16} sw={1.2} />
          </button>
        </div>

        {/* Sidebar */}
        {sideOpen && (
          <>
            <div style={{ width: sideW, background: 'var(--bg-sidebar)', borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', overflow: 'hidden', flexShrink: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px 6px' }}>
                <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                  {panel === 'explorer' ? 'Explorer' : panel === 'history' ? 'Recent Saves' : panel === 'debug' ? 'Run and Debug' : panel === 'source-control' ? 'Source Control' : 'Profile'}
                </span>
                <button onClick={() => setSideOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 2 }}>
                  <I d="M10 3L4 8l6 5" s={11} />
                </button>
              </div>

              {panel === 'debug' && (
                <div style={{ flex: 1, overflow: 'hidden' }}>
                  <DebuggerPanel
                    code={getActiveCode()}
                    langId={curTab.lang}
                    stdin={stdin}
                    fileName={curTab.name}
                    breakpoints={breakpoints}
                    onToggleBreakpoint={toggleBreakpoint}
                    onClearBreakpoints={clearBreakpoints}
                    onJumpToLine={jumpToLine}
                    onActiveLineChange={setActiveDebugLine}
                    isDebugging={isDebugging}
                    setIsDebugging={setIsDebugging}
                    steps={debugSteps}
                    currentStepIdx={currentStepIdx}
                    setCurrentStepIdx={setCurrentStepIdx}
                    onStartDebugging={startDebugging}
                    onStopDebugging={stopDebugging}
                    onRestartDebugging={restartDebugging}
                    onStepNext={stepNext}
                    onStepPrev={stepPrev}
                    onContinue={continueExecution}
                    isAutoPlaying={isAutoPlaying}
                    setIsAutoPlaying={setIsAutoPlaying}
                    playSpeed={playSpeed}
                    setPlaySpeed={setPlaySpeed}
                    watches={watches}
                    setWatches={setWatches}
                    onAddConsoleLog={addDebugLog}
                  />
                </div>
              )}

              {panel === 'explorer' && (
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

                  {/* Hidden native inputs for Open File and Open Project */}
                  <input
                    type="file"
                    ref={fileInputRef}
                    style={{ display: 'none' }}
                    multiple
                    onChange={handleOpenFile}
                  />
                  <input
                    type="file"
                    ref={folderInputRef}
                    style={{ display: 'none' }}
                    {...({ webkitdirectory: '', directory: '', multiple: true } as any)}
                    onChange={handleOpenFolder}
                  />

                  {/* VS Code / Antigravity Workspace Section Header */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '5px 10px 5px 8px',
                      background: 'var(--bg-app)',
                      borderTop: '1px solid var(--border)',
                      borderBottom: '1px solid var(--border)',
                      cursor: 'pointer',
                      userSelect: 'none',
                    }}
                    onClick={() => setWorkspaceExpanded(prev => !prev)}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5, minWidth: 0, flex: 1 }}>
                      <span style={{ fontSize: 9, color: 'var(--text-muted)', display: 'inline-block', transform: workspaceExpanded ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.15s ease' }}>
                        ▶
                      </span>
                      <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {workspaceName || 'WORKSPACE'}
                      </span>
                    </div>

                    {/* Quick action buttons like VS Code */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 2 }} onClick={e => e.stopPropagation()}>
                      <button
                        onClick={() => {
                          setWorkspaceExpanded(true)
                          setInlineItem({ type: 'file', parentFolder: '' })
                          setInlineName('')
                        }}
                        title="New File"
                        className="folder-action-btn"
                        style={{ padding: '2px 4px', borderRadius: 3, color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}
                      >
                        <FilePlusIcon size={13} />
                      </button>
                      <button
                        onClick={() => {
                          setWorkspaceExpanded(true)
                          setInlineItem({ type: 'folder', parentFolder: '' })
                          setInlineName('')
                        }}
                        title="New Folder"
                        className="folder-action-btn"
                        style={{ padding: '2px 4px', borderRadius: 3, color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}
                      >
                        <FolderPlusIcon size={13} />
                      </button>
                      <button
                        onClick={() => {
                          showToast('Explorer refreshed ✨')
                        }}
                        title="Refresh Explorer"
                        className="folder-action-btn"
                        style={{ padding: '2px 4px', borderRadius: 3, color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}
                      >
                        <RefreshIcon size={12} />
                      </button>
                      <button
                        onClick={() => {
                          const allCollapsed: Record<string, boolean> = {}
                          folders.forEach(f => { allCollapsed[f] = true })
                          setCollapsedFolders(allCollapsed)
                        }}
                        title="Collapse All Folders"
                        className="folder-action-btn"
                        style={{ padding: '2px 4px', borderRadius: 3, color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}
                      >
                        <CollapseAllIcon size={12} />
                      </button>
                    </div>
                  </div>

                  {/* Scrollable File & Folder Tree */}
                  {workspaceExpanded && (
                    <div
                      style={{ flex: 1, overflowY: 'auto', padding: '4px 0' }}
                      onClick={() => { setContextMenu(null); setFolderContextMenu(null); setBlankContextMenu(null) }}
                      onContextMenu={(e) => {
                        e.preventDefault()
                        setContextMenu(null)
                        setFolderContextMenu(null)
                        setBlankContextMenu({ x: e.clientX, y: e.clientY })
                      }}
                    >
                      {/* Empty state hint if workspace is completely empty */}
                      {tabs.length === 0 && folders.length === 0 && !inlineItem && (
                        <div style={{ padding: '24px 14px', textAlign: 'center', color: 'var(--text-dim)', fontSize: 11, fontStyle: 'italic' }}>
                          No files in workspace.<br />Use icons above or right-click to add files.
                        </div>
                      )}

                      {/* Root inline creation row (VS Code / Antigravity style) */}
                      {inlineItem && !inlineItem.parentFolder && (
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6,
                            padding: '4px 8px 4px 10px',
                            margin: '2px 6px',
                            background: inlineItem.type === 'file' ? 'var(--accent-subtle, rgba(56,139,253,0.12))' : 'rgba(234, 179, 8, 0.12)',
                            borderRadius: 4,
                            border: `1px solid ${inlineItem.type === 'file' ? 'var(--accent, #007fd4)' : '#eab308'}`
                          }}
                          onClick={e => e.stopPropagation()}
                        >
                          {inlineItem.type === 'file' ? (
                            <FileIcon fileName={inlineName || 'main.py'} size={15} />
                          ) : (
                            <FolderIcon size={14} style={{ color: '#eab308', flexShrink: 0 }} />
                          )}
                          <input
                            autoFocus
                            value={inlineName}
                            onChange={e => setInlineName(e.target.value)}
                            onKeyDown={e => {
                              if (e.key === 'Enter') commitInlineCreate()
                              else if (e.key === 'Escape') { setInlineItem(null); setInlineName('') }
                            }}
                            onBlur={commitInlineCreate}
                            placeholder={inlineItem.type === 'file' ? 'filename.ext (Enter to create, Esc)' : 'folder name (Enter to create, Esc)'}
                            style={{ flex: 1, background: 'var(--bg-app)', color: 'var(--text-base)', border: `1px solid ${inlineItem.type === 'file' ? 'var(--accent, #007fd4)' : '#eab308'}`, borderRadius: 3, padding: '2px 6px', fontSize: 11, fontFamily: 'JetBrains Mono, monospace', outline: 'none' }}
                          />
                        </div>
                      )}

                      {/* Folder list */}
                      {Array.from(new Set([
                        ...folders,
                        ...tabs.map(t => t.name.includes('/') ? t.name.substring(0, t.name.lastIndexOf('/')) : null).filter(Boolean) as string[],
                      ])).sort().map(folder => {
                        const isCollapsed = collapsedFolders[folder]
                        const folderFiles = tabs.filter(t => t.name.startsWith(folder + '/'))
                        return (
                          <div key={folder} style={{ marginBottom: 2 }}>
                            <div
                              className="folder-row"
                              onClick={() => toggleFolder(folder)}
                              onContextMenu={(e) => {
                                e.preventDefault()
                                e.stopPropagation()
                                setBlankContextMenu(null)
                                setContextMenu(null)
                                setFolderContextMenu({ x: e.clientX, y: e.clientY, folder })
                              }}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
                                <span style={{ fontSize: 10, color: 'var(--text-muted)', width: 10, textAlign: 'center' }}>
                                  {isCollapsed ? '›' : '⌄'}
                                </span>
                                <FolderIcon size={14} style={{ color: 'var(--yellow)', flexShrink: 0 }} />
                                <span style={{ fontSize: 12, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                  {folder.split('/').pop()}
                                </span>
                                <span style={{ fontSize: 10, color: 'var(--text-dim)', marginLeft: 2 }}>
                                  ({folderFiles.length})
                                </span>
                              </div>
                              <div className="folder-actions" onClick={e => e.stopPropagation()}>
                                <button
                                  onClick={() => {
                                    setCollapsedFolders(prev => ({ ...prev, [folder]: false }))
                                    setInlineItem({ type: 'file', parentFolder: folder })
                                    setInlineName('')
                                  }}
                                  title={`New File in ${folder}`}
                                  className="folder-action-btn"
                                >
                                  <FilePlusIcon size={11} />
                                </button>
                                <button
                                  onClick={() => {
                                    setCollapsedFolders(prev => ({ ...prev, [folder]: false }))
                                    setInlineItem({ type: 'folder', parentFolder: folder })
                                    setInlineName('')
                                  }}
                                  title={`New Folder in ${folder}`}
                                  className="folder-action-btn"
                                >
                                  <FolderPlusIcon size={11} />
                                </button>
                                <button
                                  onClick={() => deleteFolder(folder)}
                                  title={`Delete ${folder}`}
                                  className="folder-action-btn"
                                >
                                  <TrashIcon size={11} />
                                </button>
                              </div>
                            </div>

                            {!isCollapsed && (
                              <div style={{ paddingLeft: 16 }}>
                                {/* Inline create inside folder */}
                                {inlineItem && inlineItem.parentFolder === folder && (
                                  <div
                                    style={{
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: 6,
                                      padding: '3px 8px 3px 6px',
                                      margin: '2px 4px',
                                      background: inlineItem.type === 'file' ? 'var(--accent-subtle, rgba(56,139,253,0.12))' : 'rgba(234, 179, 8, 0.12)',
                                      borderRadius: 4,
                                      border: `1px solid ${inlineItem.type === 'file' ? 'var(--accent, #007fd4)' : '#eab308'}`
                                    }}
                                    onClick={e => e.stopPropagation()}
                                  >
                                    {inlineItem.type === 'file' ? (
                                      <FileIcon fileName={inlineName || 'main.py'} size={14} />
                                    ) : (
                                      <FolderIcon size={13} style={{ color: '#eab308', flexShrink: 0 }} />
                                    )}
                                    <input
                                      autoFocus
                                      value={inlineName}
                                      onChange={e => setInlineName(e.target.value)}
                                      onKeyDown={e => {
                                        if (e.key === 'Enter') commitInlineCreate()
                                        else if (e.key === 'Escape') { setInlineItem(null); setInlineName('') }
                                      }}
                                      onBlur={commitInlineCreate}
                                      placeholder={inlineItem.type === 'file' ? 'filename.ext (Enter)' : 'folder name (Enter)'}
                                      style={{ flex: 1, background: 'var(--bg-app)', color: 'var(--text-base)', border: `1px solid ${inlineItem.type === 'file' ? 'var(--accent, #007fd4)' : '#eab308'}`, borderRadius: 3, padding: '1px 5px', fontSize: 11, fontFamily: 'JetBrains Mono, monospace', outline: 'none' }}
                                    />
                                  </div>
                                )}

                                {folderFiles.length === 0 && (!inlineItem || inlineItem.parentFolder !== folder) ? (
                                  <div style={{ padding: '4px 14px', fontSize: 11, color: 'var(--text-dim)', fontStyle: 'italic' }}>
                                    Empty folder
                                  </div>
                                ) : (
                                  folderFiles.map(t => {
                                    const shortName = t.name.substring(folder.length + 1)
                                    const isRenaming = renameTarget?.id === t.id
                                    return (
                                      <div
                                        key={t.id}
                                        onClick={() => { if (!isRenaming) switchActiveTab(t.id) }}
                                        onContextMenu={(e) => {
                                          e.preventDefault()
                                          e.stopPropagation()
                                          setBlankContextMenu(null)
                                          setFolderContextMenu(null)
                                          setContextMenu({ x: e.clientX, y: e.clientY, fileId: t.id, fileName: t.name })
                                        }}
                                        className={`sidebar-item ${activeTab === t.id ? 'active' : ''}`}
                                        style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '5px 8px 5px 12px', margin: '1px 6px', color: activeTab === t.id ? 'var(--text-base)' : 'var(--text-muted)' }}
                                        title="Right-click for options"
                                      >
                                        <FileIcon fileName={shortName} size={15} />
                                        {isRenaming ? (
                                          <input
                                            autoFocus
                                            value={renameValue}
                                            onChange={e => setRenameValue(e.target.value)}
                                            onKeyDown={e => {
                                              if (e.key === 'Enter') {
                                                const newName = renameValue.trim()
                                                if (newName && newName !== t.name) {
                                                  setTabs(prev => prev.map(tab => tab.id === t.id ? { ...tab, name: newName } : tab))
                                                  showToast(`Renamed to ${newName}`)
                                                }
                                                setRenameTarget(null)
                                              } else if (e.key === 'Escape') {
                                                setRenameTarget(null)
                                              }
                                            }}
                                            onClick={e => e.stopPropagation()}
                                            style={{ fontSize: 12, flex: 1, background: 'var(--bg-card)', color: 'var(--text-base)', border: '1px solid var(--accent)', borderRadius: 3, padding: '1px 4px', outline: 'none' }}
                                          />
                                        ) : (
                                          <span style={{ fontSize: 12, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                            {shortName}
                                          </span>
                                        )}
                                        {t.modified && <span style={{ color: 'var(--yellow)', fontSize: 14 }}>•</span>}
                                      </div>
                                    )
                                  })
                                )}
                              </div>
                            )}
                          </div>
                        )
                      })}

                      {/* Root files */}
                      {tabs.filter(t => !t.name.includes('/')).map(t => {
                        const isRenaming = renameTarget?.id === t.id
                        return (
                          <div key={t.id}
                            onClick={() => { if (!isRenaming) switchActiveTab(t.id) }}
                            onContextMenu={(e) => {
                              e.preventDefault()
                              e.stopPropagation()
                              setBlankContextMenu(null)
                              setFolderContextMenu(null)
                              setContextMenu({ x: e.clientX, y: e.clientY, fileId: t.id, fileName: t.name })
                            }}
                            className={`sidebar-item ${activeTab === t.id ? 'active' : ''}`}
                            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 8px 6px 14px', margin: '1px 6px', color: activeTab === t.id ? 'var(--text-base)' : 'var(--text-muted)' }}
                            title="Right-click for options">
                            <FileIcon fileName={t.name} size={15} />
                            {isRenaming ? (
                              <input
                                autoFocus
                                value={renameValue}
                                onChange={e => setRenameValue(e.target.value)}
                                onKeyDown={e => {
                                  if (e.key === 'Enter') {
                                    const newName = renameValue.trim()
                                    if (newName && newName !== t.name) {
                                      setTabs(prev => prev.map(tab => tab.id === t.id ? { ...tab, name: newName } : tab))
                                      showToast(`Renamed to ${newName}`)
                                    }
                                    setRenameTarget(null)
                                  } else if (e.key === 'Escape') {
                                    setRenameTarget(null)
                                  }
                                }}
                                onClick={e => e.stopPropagation()}
                                style={{ fontSize: 12, flex: 1, background: 'var(--bg-card)', color: 'var(--text-base)', border: '1px solid var(--accent)', borderRadius: 3, padding: '1px 4px', outline: 'none' }}
                              />
                            ) : (
                              <span style={{ fontSize: 12, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.name}</span>
                            )}
                            {t.modified && <span style={{ color: 'var(--yellow)', fontSize: 14 }}>•</span>}
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )}

              {panel === 'source-control' && (
                <SourceControlPanel
                  authUser={authUser}
                  repositories={repositories}
                  activeRepo={activeRepo}
                  setActiveRepo={setActiveRepo}
                  activeTab={curTab}
                  allTabs={tabs}
                  onOpenFileFromRepo={handleOpenFileFromRepo}
                  onImportMultipleFiles={handleImportMultipleFilesFromRepo}
                  onCommitSuccess={handleCommitSuccess}
                  onConnectGitHub={() => setShowAuth(true)}
                  onRefreshRepos={refreshRepositories}
                  showToast={showToast}
                />
              )}

              {panel === 'history' && (
                <div style={{ flex: 1, overflowY: 'auto' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', borderBottom: '1px solid var(--border)' }}>
                    <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                      Recent Saves ({savedCodes.length})
                    </span>
                    {savedCodes.length > 0 && (
                      <button
                        onClick={() => {
                          setSavedCodes([])
                          try { localStorage.setItem('cf_saved_code_history', '[]') } catch {}
                          showToast('Cleared recent saved history')
                        }}
                        className="btn btn-ghost"
                        style={{ padding: '2px 7px', fontSize: 10, color: 'var(--red)' }}
                      >
                        <TrashIcon size={10} /> Clear
                      </button>
                    )}
                  </div>
                  {savedCodes.length === 0
                    ? <div style={{ padding: '24px 14px', textAlign: 'center', color: 'var(--text-dim)', fontSize: 12 }}>No saved code yet.<br/>Use Save to create a snapshot.</div>
                    : savedCodes.map(s => {
                      return (
                        <div key={s.id} className="sidebar-item" style={{ padding: '7px 10px', margin: '2px 6px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}
                          onClick={() => { const t: Tab = { id: crypto.randomUUID(), name: s.name, lang: s.lang, code: s.code }; setTabs(p => [...p, t]); setActiveTab(t.id) }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 7, minWidth: 0, flex: 1 }}>
                            {/* Small red delete button right in front of the file */}
                            <button
                              title={`Delete ${s.name} from history`}
                              aria-label={`Delete ${s.name} from history`}
                              onClick={(e) => {
                                e.stopPropagation()
                                const updated = deleteSavedCode(s.id)
                                setSavedCodes(updated)
                                showToast(`Deleted ${s.name} from history`)
                              }}
                              style={{
                                background: 'rgba(248, 81, 73, 0.15)',
                                color: '#f85149',
                                border: '1px solid rgba(248, 81, 73, 0.35)',
                                borderRadius: 4,
                                padding: '3px 5px',
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0,
                                transition: 'all 0.15s ease'
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.background = '#f85149'
                                e.currentTarget.style.color = '#ffffff'
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.background = 'rgba(248, 81, 73, 0.15)'
                                e.currentTarget.style.color = '#f85149'
                              }}
                            >
                              <TrashIcon size={11} />
                            </button>
                            <div style={{ width: 7, height: 7, borderRadius: 2, background: getLangById(s.lang).color, flexShrink: 0 }} />
                            <div style={{ minWidth: 0, flex: 1 }}>
                              <div style={{ fontSize: 11, color: 'var(--text-base)', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.name}</div>
                              <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 1 }}>{getLangById(s.lang).label} · {new Date(s.createdAt).toLocaleDateString()}</div>
                            </div>
                          </div>
                        </div>
                      )
                    })
                  }
                </div>
              )}



              {panel === 'profile' && (
                <div style={{ flex: 1, overflowY: 'auto', padding: 14 }}>
                  {authUser ? (
                    <>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0 16px' }}>
                        <span className="profile-avatar" style={{ width: 42, height: 42, fontSize: 16 }}>
                          {authUser.avatarUrl ? <img src={authUser.avatarUrl} alt="" /> : authUser.initials}
                        </span>
                        <div>
                          <div style={{ color: 'var(--text-base)', fontWeight: 700, fontSize: 14 }}>{authUser.name}</div>
                          <div style={{ color: 'var(--green)', fontSize: 11, marginTop: 2, display: 'flex', alignItems: 'center', gap: 5 }}>
                            <span className="secure-dot" /> @{authUser.login || authUser.name}
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
                        <button
                          onClick={() => openSettings('repos')}
                          className="btn btn-primary"
                          style={{ width: '100%', justifyContent: 'center', fontSize: 11, gap: 6, padding: '7px 10px' }}
                        >
                          <RepoIcon size={13} /> View All Repositories ({repositories.length})
                        </button>
                        <button
                          onClick={() => {
                            setPanel('source-control')
                            setSideOpen(true)
                          }}
                          className="btn btn-ghost"
                          style={{ width: '100%', justifyContent: 'center', fontSize: 11, gap: 6, padding: '7px 10px' }}
                        >
                          ⚡ Open Source Control / Commit
                        </button>
                      </div>

                      {repositories.length > 0 && (
                        <div style={{ marginBottom: 16 }}>
                          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', color: 'var(--text-dim)', marginBottom: 8 }}>
                            YOUR REPOSITORIES
                          </div>
                          {repositories.slice(0, 6).map(repo => (
                            <div
                              key={repo.id}
                              className="sidebar-item"
                              onClick={() => handleSelectRepoForCommit(repo)}
                              style={{ padding: '6px 8px', marginBottom: 3, cursor: 'pointer' }}
                              title="Click to select this repo for commit"
                            >
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 11, color: 'var(--text-base)' }}>
                                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{repo.name}</span>
                                <span style={{ fontSize: 9, color: repo.private ? '#d29922' : 'var(--text-dim)' }}>
                                  {repo.private ? 'Private' : 'Public'}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      <button
                        onClick={signOut}
                        className="btn btn-ghost"
                        style={{ width: '100%', justifyContent: 'center', fontSize: 11, color: 'var(--red)' }}
                      >
                        Disconnect GitHub
                      </button>
                    </>
                  ) : (
                    <>
                      <div style={{ color: 'var(--text-base)', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Your CodeForge Profile</div>
                      <div style={{ color: 'var(--text-muted)', fontSize: 11, lineHeight: 1.6, marginBottom: 16 }}>Connect GitHub to sync repositories, browse repository code, and commit changes directly.</div>
                      <button onClick={() => setShowAuth(true)} className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', fontSize: 11 }}>Connect GitHub</button>
                    </>
                  )}
                </div>
              )}
            </div>
            <div className="resizer-v" onMouseDown={mkSideResize} />
          </>
        )}

        {/* ── Center: Editor + Console ────────────────────────────────────── */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>

          {/* Tab bar */}
          <div style={{ display: 'flex', alignItems: 'center', background: 'var(--bg-header)', borderBottom: '1px solid var(--border)', overflowX: 'auto', flexShrink: 0, height: 35 }}>
            {tabs.map(t => {
              return (
                <div key={t.id} className={`editor-tab ${activeTab === t.id ? 'active' : ''}`} onClick={() => switchActiveTab(t.id)}>
                  <FileIcon fileName={t.name} size={14} />
                  {t.repoName && <span style={{ color: 'var(--accent)', fontSize: 10, marginRight: 2 }}>{t.repoName}:</span>}
                  <span>{t.name.split('/').pop()}</span>
                  {t.isLocalDisk && (
                    <span
                      title="Direct Local Disk Sync (Ctrl+S saves directly to your computer file)"
                      style={{
                        fontSize: 10,
                        color: '#38bdf8',
                        marginLeft: 4,
                        display: 'inline-flex',
                        alignItems: 'center',
                      }}
                    >
                      💾
                    </span>
                  )}
                  {t.modified && <span style={{ color: 'var(--yellow)', fontSize: 14, marginLeft: 2 }}>•</span>}
                  <button onClick={e => closeTab(t.id, e)} title="Close tab" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', padding: '1px 2px', lineHeight: 1, opacity: .4 }}
                    onMouseEnter={e => (e.currentTarget.style.opacity = '1')} onMouseLeave={e => (e.currentTarget.style.opacity = '.4')}>
                    <I d="M3 3l10 10M13 3L3 13" s={8} sw={1.6} />
                  </button>
                </div>
              )
            })}
            <button
              onClick={() => {
                setPanel('explorer')
                setSideOpen(true)
                setWorkspaceExpanded(true)
                setInlineItem({ type: 'file', parentFolder: '' })
                setInlineName('')
              }}
              title="New File (Ctrl+N)"
              aria-label="New File"
              style={{ padding: '0 12px', height: '100%', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-dim)', fontSize: 18, flexShrink: 0 }}
              onMouseEnter={e => (e.currentTarget.style.color = 'var(--text-muted)')}
              onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-dim)')}
            >
              +
            </button>
          </div>

          {/* Breadcrumb & Editor Toolbar */}
          <div className="breadcrumb-bar" style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '3px 12px',
            fontSize: 11,
            color: 'var(--text-muted)',
            userSelect: 'none',
            flexShrink: 0,
            gap: 12,
            minHeight: 28
          }}>
            {/* Left: Breadcrumb path & language badge */}
            {hasOpenTab ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0, overflow: 'hidden' }}>
                <span style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}>
                  <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor" style={{ opacity: 0.75 }}>
                    <path d="M1.75 1A1.75 1.75 0 0 0 0 2.75v10.5C0 14.216.784 15 1.75 15h12.5A1.75 1.75 0 0 0 16 13.25v-8.5A1.75 1.75 0 0 0 14.25 3H7.5a.25.25 0 0 1-.2-.1l-.9-1.2C6.07 1.26 5.55 1 5 1H1.75z"/>
                  </svg>
                </span>
                <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>{curTab.repoName || 'workspace'}</span>
                <span style={{ color: 'var(--text-dim)' }}>›</span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--text-base)', fontWeight: 600 }}>
                  <FileIcon fileName={curTab.name} size={14} />
                  {curTab.name}
                </span>
                {curTab.isLocalDisk && (
                  <span
                    style={{
                      fontSize: 10,
                      background: 'rgba(56, 189, 248, 0.12)',
                      color: '#38bdf8',
                      border: '1px solid rgba(56, 189, 248, 0.3)',
                      borderRadius: 4,
                      padding: '1px 6px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                      fontWeight: 500,
                    }}
                    title="Direct Disk Save active: Ctrl+S writes directly to your computer file"
                  >
                    💾 Local Disk File
                  </span>
                )}
                <span style={{
                  background: `${curLang.color}15`,
                  color: curLang.color,
                  border: `1px solid ${curLang.color}30`,
                  padding: '1px 6px',
                  borderRadius: 4,
                  fontSize: 10,
                  fontWeight: 600,
                  marginLeft: 4
                }}>
                  {curLang.label}
                </span>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)', fontSize: 11 }}>
                <span>No file open</span>
              </div>
            )}
          </div>

          {/* Editor Center Area */}
          <div style={{ flex: 1, overflow: 'hidden', position: 'relative', display: 'flex', flexDirection: 'column' }}>
            {!hasOpenTab ? (
              <div
                style={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: 32,
                  background: 'var(--bg-app)',
                  textAlign: 'center',
                  userSelect: 'none',
                }}
              >
                <div style={{ position: 'relative', marginBottom: 20 }}>
                  <img
                    src={logoImg}
                    alt="CodeForge"
                    style={{
                      width: 72,
                      height: 72,
                      objectFit: 'contain',
                      borderRadius: 16,
                      filter: 'drop-shadow(0 0 35px rgba(99, 102, 241, 0.4))',
                    }}
                  />
                </div>
                <h1 style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-base)', margin: '0 0 8px', letterSpacing: '-0.02em' }}>
                  Welcome to CodeForge
                </h1>
                <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '0 0 24px', maxWidth: 460, lineHeight: 1.6 }}>
                  Next-generation cloud editor & compiler. Create an empty file to start coding. Supports JSON, Markdown, Python, C++, Web, and 40+ programming languages.
                </p>

                {/* Quick actions */}
                <div style={{ display: 'flex', gap: 12, marginBottom: 32, flexWrap: 'wrap', justifyContent: 'center' }}>
                  <button
                    onClick={() => {
                      let candidate = 'untitled.py'
                      let idx = 1
                      while (tabs.some(t => t.name === candidate)) {
                        idx++
                        candidate = `untitled_${idx}.py`
                      }
                      newTab(candidate, '')
                      showToast(`Created ${candidate} ⚡`)
                    }}
                    className="btn btn-primary"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '10px 18px',
                      borderRadius: 8,
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    <FilePlusIcon size={15} /> New Empty File
                  </button>
                  <button
                    onClick={() => handleOpenFileWithPicker()}
                    className="btn btn-ghost"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '10px 18px',
                      borderRadius: 8,
                      fontSize: 13,
                      border: '1px solid var(--border)',
                      cursor: 'pointer',
                    }}
                  >
                    <FileOpenIcon size={15} /> Open File
                  </button>
                  <button
                    onClick={() => handleOpenProjectWithPicker()}
                    className="btn btn-ghost"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '10px 18px',
                      borderRadius: 8,
                      fontSize: 13,
                      border: '1px solid var(--border)',
                      cursor: 'pointer',
                    }}
                  >
                    <FolderOpenIcon size={15} /> Open Project
                  </button>
                </div>

                {/* Keyboard Shortcuts cheat card */}
                <div
                  style={{
                    background: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid var(--border)',
                    borderRadius: 10,
                    padding: '16px 20px',
                    width: 380,
                    maxWidth: '90vw',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 10,
                  }}
                >
                  <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-dim)', textAlign: 'left' }}>
                    Quick Shortcuts
                  </div>
                  {[
                    { label: 'New File', key: 'Ctrl + N' },
                    { label: 'Open File', key: 'Ctrl + O' },
                    { label: 'Command Palette', key: 'Ctrl + K' },
                    { label: 'Run Program', key: 'Ctrl + Enter' },
                    { label: 'Toggle CodeForge AI', key: 'Ctrl + Shift + A' },
                  ].map((sc, idx) => (
                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12, color: 'var(--text-muted)' }}>
                      <span>{sc.label}</span>
                      <kbd style={{ background: 'var(--bg-hover)', border: '1px solid var(--border)', borderRadius: 4, padding: '2px 7px', fontSize: 11, color: 'var(--text-base)', fontFamily: 'JetBrains Mono' }}>
                        {sc.key}
                      </kbd>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <>
                <FloatingDebugBar
                  isDebugging={isDebugging}
                  currentLine={activeDebugLine}
                  currentStep={currentStepIdx}
                  totalSteps={debugSteps.length}
                  onContinue={continueExecution}
                  onStepOver={stepNext}
                  onStepInto={stepNext}
                  onStepOut={stepPrev}
                  onRestart={restartDebugging}
                  onStop={stopDebugging}
                  isAutoPlaying={isAutoPlaying}
                  onToggleAutoPlay={() => setIsAutoPlaying(p => !p)}
                  playSpeed={playSpeed}
                  onChangePlaySpeed={setPlaySpeed}
                />

                <MonacoEditor
                  height="100%"
                  language={curLang.monacoId}
                  theme={activeMonacoTheme}
                  value={curTab.code}
                  onChange={v => updateCode(v ?? '')}
                  onMount={handleEditorMount}
                  options={editorOptions}
                />
              </>
            )}
          </div>
          {/* Invisible context-menu trigger overlay on editor area */}
          <div
            style={{ position: 'absolute', inset: 0, zIndex: 1, pointerEvents: 'none' }}
            onContextMenu={undefined}
          />

          {/* Console resize & bottom panel (collapsed by default, opens on Run or status bar click) */}
          {bottomPanelOpen && (
            <>
              <div className="resizer-h" onMouseDown={mkConsResize} />

              {/* Console */}
              <div style={{ height: consH, flexShrink: 0, display: 'flex', flexDirection: 'column', background: 'var(--bg-panel)' }}>
                {/* Console tabs */}
                <div style={{ display: 'flex', alignItems: 'center', background: 'var(--bg-header)', borderBottom: '1px solid var(--border)', height: 33, flexShrink: 0, paddingLeft: 6, paddingRight: 6 }}>
                  {([
                    { id: 'output'   as ConsoleTab, label: 'Output' },
                    { id: 'dsa'      as ConsoleTab, label: '⚡ LeetCode Testcases' },
                    { id: 'terminal' as ConsoleTab, label: '💻 Terminal' },
                    { id: 'testcase' as ConsoleTab, label: 'Standard Input (stdin)' },
                    { id: 'debug'    as ConsoleTab, label: '🐛 Debug Console' },
                    { id: 'aisugg'   as ConsoleTab, label: 'AI Suggestions' },
                  ]).map(t => (
                    <button key={t.id} className={`terminal-tab ${consTab === t.id ? 'active' : ''}`} onClick={() => setConsTab(t.id)}>
                      {t.id === 'output' && status && <div style={{ width: 6, height: 6, borderRadius: '50%', background: status.color }} />}
                      {t.id === 'dsa' && <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981' }} />}
                      {t.id === 'debug' && isDebugging && <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#eab308' }} />}
                      {t.label}
                    </button>
                  ))}
                  {status && (
                    <div style={{ marginLeft: 'auto', display: 'flex', gap: 12, alignItems: 'center', padding: '0 8px', fontSize: 11 }}>
                      <span style={{ color: status.color, fontWeight: 600 }}>{status.label}</span>
                      {result?.time   && <span style={{ color: 'var(--text-muted)' }}>⏱ {parseFloat(result.time).toFixed(3)}s</span>}
                      {result?.memory && <span style={{ color: 'var(--text-muted)' }}>💾 {(result.memory/1024).toFixed(1)} MB</span>}
                    </div>
                  )}
                  {running && <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6, padding: '0 8px', fontSize: 11, color: 'var(--accent)' }}><div className="spin" style={{ width: 9, height: 9, borderRadius: '50%', border: '1.5px solid var(--accent)', borderTopColor: 'transparent' }} />Executing…</div>}

                  {/* Close Panel Button */}
                  <button
                    onClick={() => setBottomPanelOpen(false)}
                    title="Close Panel (Hide Output/Terminal)"
                    style={{
                      marginLeft: status || running ? 6 : 'auto',
                      background: 'none',
                      border: 'none',
                      color: 'var(--text-muted)',
                      cursor: 'pointer',
                      padding: '3px 6px',
                      borderRadius: 4,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.color = '#fff'; e.currentTarget.style.background = 'rgba(255,255,255,0.08)' }}
                    onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.background = 'none' }}
                  >
                    <XIcon size={12} />
                  </button>
                </div>

            {/* Terminal tab */}
            {consTab === 'terminal' && (
              <div style={{ flex: 1, overflow: 'hidden' }}>
                <VSCodeTerminal
                  activeFileName={curTab.name}
                  activeFileLang={curTab.lang}
                  getActiveCode={getActiveCode}
                  allFiles={tabs.map(t => ({ name: t.name, content: t.code }))}
                  onRunActiveCode={handleRun}
                  onCreateFile={(name, content) => {
                    const existing = tabs.find(t => t.name.toLowerCase() === name.toLowerCase())
                    if (existing) {
                      setTabs(prev => prev.map(t => t.id === existing.id ? { ...t, code: content ?? t.code, modified: true } : t))
                      setActiveTab(existing.id)
                    } else {
                      newTab(name, content ?? '')
                    }
                  }}
                  onOpenFile={(name) => {
                    const existing = tabs.find(t => t.name.toLowerCase() === name.toLowerCase())
                    if (existing) {
                      setActiveTab(existing.id)
                    } else {
                      newTab(name, '')
                    }
                  }}
                  onDeleteFile={(name) => {
                    const existing = tabs.find(t => t.name.toLowerCase() === name.toLowerCase())
                    if (existing) {
                      deleteWorkspaceFile(existing.id)
                    }
                  }}
                  onExecuteCode={async (sourceCode, lang) => {
                    const matchedLang = LANGUAGES.find(l => l.id === lang || l.ext.toLowerCase() === lang.toLowerCase() || l.label.toLowerCase().includes(lang.toLowerCase())) || curLang
                    return executeCode({
                      sourceCode,
                      languageId: matchedLang.judge0Id,
                      lang: matchedLang.id,
                      stdin,
                    })
                  }}
                  activeBranch={activeRepo?.default_branch || 'main'}
                  showToast={showToast}
                />
              </div>
            )}

            {/* Debug Console tab */}
            {consTab === 'debug' && (
              <div style={{ flex: 1, overflow: 'hidden' }}>
                <DebugConsole
                  logs={debugLogs}
                  onClearLogs={() => setDebugLogs([])}
                  currentVariables={debugSteps[currentStepIdx]?.variables || {}}
                  isDebugging={isDebugging}
                  onAddLog={addDebugLog}
                  activeLine={activeDebugLine}
                />
              </div>
            )}

            {/* Testcase */}
            {consTab === 'testcase' && (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '10px 14px', gap: 6 }}>
                <label style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>Standard Input (stdin)</label>
                <textarea value={stdin} onChange={e => setStdin(e.target.value)} placeholder="Enter input for your program…"
                  style={{ flex: 1, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--output-font-color)', fontFamily: 'JetBrains Mono', fontSize: 12, lineHeight: 1.7, padding: '8px 10px', outline: 'none', resize: 'none', transition: 'border-color .15s' }}
                  onFocus={e => (e.target.style.borderColor = 'var(--accent)')} onBlur={e => (e.target.style.borderColor = 'var(--border)')} />
              </div>
            )}

            {/* Output */}
            {consTab === 'output' && (
              <div style={{ flex: 1, overflowY: 'auto', padding: '10px 14px', fontFamily: 'JetBrains Mono', fontSize: 12, lineHeight: 1.8, color: 'var(--output-font-color)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, paddingBottom: 6, borderBottom: '1px solid var(--border)' }}>
                  <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.05em', color: 'var(--text-muted)' }}>STANDARD EXECUTION OUTPUT</span>
                  <button
                    onClick={() => setConsTab('dsa')}
                    style={{
                      background: 'rgba(16, 185, 129, 0.12)',
                      border: '1px solid #10b981',
                      color: '#10b981',
                      fontSize: 10,
                      fontWeight: 700,
                      padding: '2px 8px',
                      borderRadius: 4,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                    }}
                  >
                    ⚡ Open LeetCode DSA Testcases
                  </button>
                </div>
                {!result && !running && <div style={{ color: 'var(--output-font-color)', opacity: 0.75, display: 'flex', alignItems: 'center', gap: 8 }}><svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor"><polygon points="0,0 10,5 0,10"/></svg>Press <span style={{ color: 'var(--output-font-color)', fontWeight: 700, margin: '0 4px' }}>Run</span> (⌃↵) to execute.</div>}
                {running && <div style={{ color: 'var(--output-font-color)' }}><span style={{ color: 'var(--accent)' }}>▶ </span>Executing {curLang.label}…</div>}
                {result && (
                  <>
                    {result.compile_output && (
                      <div style={{ marginBottom: 8 }}>
                        <div style={{ color: '#d29922', fontSize: 10, fontWeight: 700, letterSpacing: '0.06em', marginBottom: 3 }}>COMPILE OUTPUT</div>
                        <pre style={{ color: 'var(--red)', whiteSpace: 'pre-wrap', margin: 0 }}>{result.compile_output}</pre>
                      </div>
                    )}
                    {result.stderr && (
                      <div style={{ marginBottom: 8 }}>
                        <div style={{ color: 'var(--red)', fontSize: 10, fontWeight: 700, letterSpacing: '0.06em', marginBottom: 3 }}>STDERR</div>
                        <pre style={{ color: 'var(--red)', whiteSpace: 'pre-wrap', margin: 0 }}>{result.stderr}</pre>
                      </div>
                    )}
                    {result.stdout && (
                      <div>
                        <div style={{ color: 'var(--green)', fontSize: 10, fontWeight: 700, letterSpacing: '0.06em', marginBottom: 3 }}>STDOUT</div>
                        <pre style={{ color: 'var(--output-font-color)', whiteSpace: 'pre-wrap', margin: 0, fontWeight: 500 }}>{result.stdout}</pre>
                      </div>
                    )}
                    {!result.stdout && !result.stderr && !result.compile_output && <div style={{ color: 'var(--green)' }}>✓ Program exited with code 0 (no output)</div>}
                  </>
                )}
              </div>
            )}

            {/* LeetCode DSA Testcases Runner */}
            {consTab === 'dsa' && (
              <LeetCodeRunner
                sourceCode={getActiveCode()}
                langId={curLang.id}
                showToast={showToast}
              />
            )}

            {/* AI Suggestions */}
            {consTab === 'aisugg' && (
              <div style={{ flex: 1, overflowY: 'auto', padding: '10px 14px' }}>
                {!result
                  ? <div style={{ color: 'var(--text-dim)', fontSize: 12 }}>Run your code first to get AI suggestions.</div>
                  : <>
                    <div style={{ fontSize: 12, marginBottom: 8 }}>
                      <span style={{ color: status?.color, fontWeight: 600 }}>{status?.label}</span>
                      <span style={{ color: 'var(--text-muted)' }}> — AI analysis:</span>
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-base)', lineHeight: 1.7 }}>
                      {hasErr
                        ? <><div style={{ color: '#f85149', fontWeight: 600, marginBottom: 4 }}>Error detected</div>Root cause: {(result.stderr ?? result.compile_output ?? '').slice(0, 120)}</>
                        : <div style={{ color: '#3fb950' }}>✓ Execution successful! Use the AI panel for deeper analysis.</div>
                      }
                    </div>
                    <button onClick={() => { setAiOpen(true); sendAI(hasErr ? 'fix' : 'review', '') }}
                      className="btn btn-primary" style={{ marginTop: 10, fontSize: 11, padding: '5px 12px' }}>
                      {hasErr ? '🐛 Fix in AI Panel' : '👁 Review in AI Panel'}
                    </button>
                  </>
                }
              </div>
            )}
          </div>
        </>
      )}
    </div>

        {/* ── AI Panel ──────────────────────────────────────────────────────── */}
        {aiOpen && (
          <>
            <div className="resizer-v" onMouseDown={mkAIResize} />
            <div style={{ width: aiW, background: 'var(--bg-app)', borderLeft: '1px solid var(--border)', display: 'flex', flexDirection: 'column', overflow: 'hidden', flexShrink: 0 }}>

              <AIAppPanel
                authUser={authUser}
                onOpenGitHubAuth={() => setShowAuth(true)}
                aiUsage={aiUsage}
                setAiUsage={setAiUsage}
                maxFreeAI={MAX_FREE_MONTHLY_AI}
                isPro={isPro}
                onUpgradePro={() => setShowUpgradeModal(true)}
                getActiveCode={getActiveCode}
                curTab={curTab}
                onInsertCodeToEditor={applyAIResponse}
                onClose={() => setAiOpen(false)}
                showToast={showToast}
              />
            </div>
          </>
        )}
      </div>

      {/* ── Premium Status bar ─────────────────────────────────────────────── */}
      <div className="status-bar">
        <div className="status-item" onClick={() => setSideOpen(p => !p)} style={{ borderRight: '1px solid rgba(255,255,255,0.15)' }}>
          <I d="M2 4h12M2 8h12M2 12h12" s={11} sw={1.5} /> {sideOpen ? 'Explorer' : 'Open'}
        </div>
        <div className="status-item" style={{ borderRight: '1px solid rgba(255,255,255,0.15)' }}>
          <div style={{ width: 7, height: 7, borderRadius: '50%', background: 'rgba(255,255,255,0.8)' }} />
          {curLang.label}
        </div>
        {status && (
          <div
            className="status-item"
            onClick={() => { setConsTab('output'); setBottomPanelOpen(true) }}
            style={{ borderRight: '1px solid rgba(255,255,255,0.15)', cursor: 'pointer' }}
          >
            {status.label}
          </div>
        )}
        {result?.time   && <div className="status-item">⏱ {parseFloat(result.time).toFixed(3)}s</div>}
        {result?.memory && <div className="status-item">💾 {(result.memory/1024).toFixed(1)} MB</div>}
        {activeRepo && (
          <div
            className="status-item"
            onClick={() => { setPanel('source-control'); setSideOpen(true) }}
            style={{ borderRight: '1px solid rgba(255,255,255,0.15)', cursor: 'pointer' }}
          >
            <GitBranchIcon size={12} /> {activeRepo.name}
          </div>
        )}
        {/* Toggle Output & Terminal button right next to Github.md / activeRepo */}
        <div
          className="status-item"
          onClick={() => {
            if (bottomPanelOpen) {
              setBottomPanelOpen(false)
            } else {
              setBottomPanelOpen(true)
              setConsTab('output')
            }
          }}
          title={bottomPanelOpen ? "Hide Output & Terminal Panel" : "Open Output Panel"}
          style={{
            borderRight: '1px solid rgba(255,255,255,0.15)',
            display: 'flex',
            alignItems: 'center',
            gap: 5,
            cursor: 'pointer',
            background: bottomPanelOpen ? 'rgba(255,255,255,0.12)' : 'transparent',
            color: bottomPanelOpen ? '#38bdf8' : 'inherit',
            fontWeight: bottomPanelOpen ? 600 : 400,
          }}
        >
          <TerminalIcon size={11} />
          <span>Output / Terminal</span>
          {bottomPanelOpen && (
            <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#38bdf8' }} />
          )}
        </div>
        <div style={{ flex: 1 }} />
        {hasOpenTab && (
          curTab.isLocalDisk ? (
            <div
              className="status-item"
              onClick={() => saveCurrentFile()}
              title="Linked to local disk file. Click or press Ctrl+S to save directly to your computer."
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                color: '#38bdf8',
                fontWeight: 500,
                cursor: 'pointer',
              }}
            >
              <span>💾 Disk Synced</span>
            </div>
          ) : (
            <div
              className="status-item"
              onClick={handleSaveAsDisk}
              title="Click to link and save this file directly to your local computer disk"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                opacity: 0.75,
                cursor: 'pointer',
              }}
            >
              <span>💾 Link to Local File</span>
            </div>
          )
        )}
        <div id="editor-cursor-pos-status" className="status-item" style={{ fontFamily: 'JetBrains Mono, monospace', opacity: 0.8 }}>
          Ln 1, Col 1
        </div>
        <div className="status-item" style={{ opacity: 0.7 }}>UTF-8</div>
        <div className="status-item" onClick={() => openSettings('themes')} title="Change Theme" style={{ display: 'flex', alignItems: 'center', gap: 4, borderLeft: '1px solid rgba(255,255,255,0.15)' }}>
          <PaletteIcon size={11} /> {getThemeById(editorTheme).name.split(' (')[0]}
        </div>
        <div className="status-item" onClick={() => setWordWrap(p => p === 'on' ? 'off' : 'on')} style={{ opacity: 0.75 }}>Wrap: {wordWrap}</div>
        <div className="status-item" onClick={() => setShowKeys(true)} style={{ borderLeft: '1px solid rgba(255,255,255,0.15)', opacity: 0.75 }}>⌨ Shortcuts</div>
      </div>
        </>
      )}

      {/* ── Modals ──────────────────────────────────────────────────────────── */}

      {/* Command palette */}
      {showCommands && (
        <div className="command-backdrop" onClick={() => setShowCommands(false)}>
          <div className="command-palette" onClick={e => e.stopPropagation()}>
            <div className="command-search-row">
              <span className="command-search-icon">⌕</span>
              <input autoFocus value={commandQuery} onChange={e => setCommandQuery(e.target.value)} placeholder="Search commands..." onKeyDown={e => {
                if (e.key === 'Escape') setShowCommands(false)
                if (e.key === 'Enter' && visibleCommands[0]) runCommand(visibleCommands[0].id)
              }} />
              <kbd>Esc</kbd>
            </div>
            <div className="command-list">
              {visibleCommands.length === 0
                ? <div className="command-empty">No matching commands</div>
                : visibleCommands.map(command => (
                  <button key={command.id} className="command-item" onClick={() => runCommand(command.id)}>
                    <span className="command-icon">{command.icon}</span>
                    <span className="command-copy"><strong>{command.label}</strong><small>{command.detail}</small></span>
                    {command.key && <kbd>{command.key}</kbd>}
                  </button>
                ))}
            </div>
            <div className="command-footer"><span><kbd>↑↓</kbd> Navigate</span><span><kbd>Enter</kbd> Run</span><span><kbd>Esc</kbd> Close</span></div>
          </div>
        </div>
      )}

      {/* Sign in */}
      <GitHubAuthModal
        isOpen={showAuth}
        onClose={() => setShowAuth(false)}
        onSuccess={handleAuthSuccess}
        showToast={showToast}
      />

      {/* Upgrade to Pro Modal */}
      <UpgradeProModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        onSuccess={() => {
          if (authUser) {
            localStorage.setItem(`cf_is_pro_${authUser.id}`, 'true')
          }
          setIsPro(true)
        }}
        showToast={showToast}
        currentUsage={aiUsage}
        maxFree={MAX_FREE_MONTHLY_AI}
      />

      {/* New file */}
      {newFileOpen && (
        <div className="modal-backdrop" onClick={() => setNewFileOpen(false)}>
          <div className="modal-box" style={{ width: 390, padding: 22 }} onClick={e => e.stopPropagation()}>
            <div style={{ fontWeight: 700, fontSize: 16, color: 'var(--text-base)', marginBottom: 5 }}>Create New File</div>
            <div style={{ color: 'var(--text-muted)', fontSize: 11, marginBottom: 16 }}>
              {newFileParentFolder ? `Creating inside folder "${newFileParentFolder}/"` : 'Language will be detected from the filename.'}
            </div>
            <input autoFocus value={newFileName} onChange={e => setNewFileName(e.target.value)} onKeyDown={e => e.key === 'Enter' && createFile()} className="ide-input" placeholder="main.py" style={{ fontFamily: 'JetBrains Mono', fontSize: 13, marginBottom: 12 }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '9px 10px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 7, marginBottom: 18 }}>
              <div style={{ width: 22, height: 22, display: 'grid', placeItems: 'center', borderRadius: 5, background: `${detectLanguage(newFileName).color}20`, color: detectLanguage(newFileName).color, fontSize: 8, fontWeight: 700 }}>{detectLanguage(newFileName).ext.toUpperCase()}</div>
              <div><div style={{ color: 'var(--text-base)', fontSize: 12, fontWeight: 600 }}>{detectLanguage(newFileName).label}</div><div style={{ color: 'var(--text-dim)', fontSize: 10 }}>Detected automatically</div></div>
            </div>
            <div style={{ display: 'flex', gap: 9, justifyContent: 'flex-end' }}>
              <button onClick={() => { setNewFileOpen(false); setNewFileParentFolder('') }} className="btn btn-ghost">Cancel</button>
              <button onClick={createFile} className="btn btn-primary">Create File</button>
            </div>
          </div>
        </div>
      )}

      {/* New folder */}
      {newFolderOpen && (
        <div className="modal-backdrop" onClick={() => setNewFolderOpen(false)}>
          <div className="modal-box" style={{ width: 390, padding: 22 }} onClick={e => e.stopPropagation()}>
            <div style={{ fontWeight: 700, fontSize: 16, color: 'var(--text-base)', marginBottom: 5 }}>Create New Folder</div>
            <div style={{ color: 'var(--text-muted)', fontSize: 11, marginBottom: 16 }}>
              {newFileParentFolder ? `Creating inside "${newFileParentFolder}/"` : 'Enter a folder name for your workspace.'}
            </div>
            <input autoFocus value={newFolderName} onChange={e => setNewFolderName(e.target.value)} onKeyDown={e => e.key === 'Enter' && createFolder()} className="ide-input" placeholder="components" style={{ fontFamily: 'JetBrains Mono', fontSize: 13, marginBottom: 16 }} />
            <div style={{ display: 'flex', gap: 9, justifyContent: 'flex-end' }}>
              <button onClick={() => { setNewFolderOpen(false); setNewFolderName(''); setNewFileParentFolder('') }} className="btn btn-ghost">Cancel</button>
              <button onClick={createFolder} disabled={!newFolderName.trim()} className="btn btn-primary">Create Folder</button>
            </div>
          </div>
        </div>
      )}

      {/* Share */}
      {showShare && (
        <div className="modal-backdrop" onClick={() => setShowShare(false)}>
          <div className="modal-box" style={{ width: 440, padding: 24 }} onClick={e => e.stopPropagation()}>
            <div style={{ fontWeight: 700, fontSize: 16, color: 'var(--text-base)', marginBottom: 6 }}>Share Code</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 16 }}>Anyone with this link can view your {curLang.label} code.</div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
              <div style={{ flex: 1, background: 'var(--bg-app)', border: '1px solid var(--border)', borderRadius: 6, padding: '8px 10px', fontFamily: 'JetBrains Mono', fontSize: 11, color: 'var(--accent)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{shareLink}</div>
              <button onClick={doCopy} className="btn btn-primary" style={{ padding: '8px 14px' }}>{copied ? '✓' : 'Copy'}</button>
            </div>
            <button onClick={() => setShowShare(false)} className="btn btn-ghost" style={{ width: '100%', justifyContent: 'center' }}>Close</button>
          </div>
        </div>
      )}

      {/* Settings */}
      <SettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        initialTab={settingsTab}
        currentThemeId={editorTheme}
        onThemeChange={handleThemeChange}
        currentFontColor={editorFontColor}
        onFontColorChange={handleFontColorChange}
        currentFontId={editorFont}
        onFontChange={handleFontChange}
        fontLigatures={fontLigatures}
        onFontLigaturesToggle={handleFontLigaturesToggle}
        fontSize={fontSize}
        wordWrap={wordWrap}
        showMini={showMini}
        aiOpen={aiOpen}
        onFontSizeChange={setFontSize}
        onWordWrapChange={setWordWrap}
        onMiniChange={setShowMini}
        onAiToggle={() => setAiOpen(p => !p)}
        authUser={authUser}
        repositories={repositories}
        activeTab={curTab}
        onConnectGitHub={() => {
          setShowSettings(false)
          setShowAuth(true)
        }}
        onSignOut={signOut}
        onRefreshRepos={refreshRepositories}
        onSelectRepoForCommit={handleSelectRepoForCommit}
        onOpenFileFromRepo={handleOpenFileFromRepo}
        showToast={showToast}
      />


      {/* Shortcuts */}
      {showKeys && (
        <div className="modal-backdrop" onClick={() => setShowKeys(false)}>
          <div className="modal-box" style={{ width: 460, padding: 0, maxHeight: '80vh', display: 'flex', flexDirection: 'column' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 24px', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
              <span style={{ fontWeight: 700, fontSize: 16, color: 'var(--text-base)' }}>Keyboard Shortcuts</span>
              <button onClick={() => setShowKeys(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><I d="M3 3l10 10M13 3L3 13" s={14} /></button>
            </div>
            <div style={{ overflowY: 'auto', padding: '8px 24px 24px' }}>
              {[
                { group: 'Execution', items: [['Run Code', '⌃ ↵'], ['Stop', '⌃ C']] },
                { group: 'Editor',    items: [['Save', '⌃ S'], ['Find', '⌃ F'], ['Format', '⌥ ⇧ F'], ['Comment', '⌃ /'], ['Duplicate Line', '⌥ ⇧ ↓']] },
                { group: 'Navigation',items: [['Go to Line', '⌃ G'], ['Go to Definition', 'F12'], ['Quick Fix', '⌃ .']] },
                { group: 'AI Panel',  items: [['Toggle AI', '⌃ ⇧ A'], ['Explain', 'Click button'], ['Fix Bug', 'Click button']] },
              ].map(s => (
                <div key={s.group}>
                  <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-dim)', padding: '12px 0 4px' }}>{s.group}</div>
                  {s.items.map(([action, kbd]) => (
                    <div key={action} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: '1px solid var(--border)' }}>
                      <span style={{ fontSize: 13, color: 'var(--text-base)' }}>{action}</span>
                      <span className="kbd">{kbd}</span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Contest & Assessment Hub Modal */}
      <ContestHubModal
        isOpen={isContestHubOpen}
        onClose={() => setIsContestHubOpen(false)}
        user={authUser ? { id: String(authUser.id || authUser.login || 'usr_gh'), name: authUser.name || authUser.login || 'Contestant', email: authUser.email } : null}
        onSelectContestToEnter={(contest) => {
          setSelectedContestForCheck(contest)
          setIsContestHubOpen(false)
        }}
        onOpenAuth={() => {
          setShowAuth(true)
        }}
      />

      {/* Pre-Contest Device & Transparency Check Modal */}
      {selectedContestForCheck && (
        <PreContestCheckModal
          contest={selectedContestForCheck}
          user={authUser ? { id: String(authUser.id || authUser.login || 'usr_gh'), name: authUser.name || authUser.login || 'Contestant', email: authUser.email } : null}
          isOpen={true}
          onClose={() => setSelectedContestForCheck(null)}
          onStartSession={(session, mediaTracks) => {
            setActiveContestArena({
              contest: selectedContestForCheck,
              session,
              mediaTracks,
            })
            setSelectedContestForCheck(null)
          }}
          onOpenAuth={() => {
            setShowAuth(true)
          }}
        />
      )}

      {/* Secure Contest Arena Fullscreen Overlay */}
      {activeContestArena && (
        <ContestArena
          contest={activeContestArena.contest}
          session={activeContestArena.session}
          user={authUser ? { id: String(authUser.id || authUser.login || 'usr_gh'), name: authUser.name || authUser.login || 'Contestant', email: authUser.email } : { id: 'usr_guest', name: 'Contestant' }}
          mediaTracks={activeContestArena.mediaTracks}
          onExitArena={() => {
            setActiveContestArena(null)
            setIsContestHubOpen(true)
          }}
        />
      )}

      {/* Injected AI message styles */}
      <style>{`
        .ai-msg { font-size: 12px; color: var(--text-muted); line-height: 1.7; flex: 1; min-width: 0; }
        .ai-pre { background: rgba(0,0,0,0.35); border: 1px solid rgba(99,102,241,0.15); border-radius: 8px; padding: 10px 14px; overflow-x: auto; margin: 8px 0; font-family: 'JetBrains Mono',monospace; font-size: 11px; color: var(--text-base); white-space: pre; }
        .ai-ic  { background: rgba(99,102,241,0.12); border: 1px solid rgba(99,102,241,0.2); border-radius: 4px; padding: 1px 5px; font-family: 'JetBrains Mono',monospace; font-size: 11px; color: #f87171; }
        .ai-h1  { font-size: 15px; font-weight: 800; color: var(--text-base); margin: 10px 0 5px; }
        .ai-h2  { font-size: 13px; font-weight: 700; color: var(--text-base); margin: 8px 0 4px; border-bottom: 1px solid rgba(99,102,241,0.15); padding-bottom: 4px; }
        .ai-h3  { font-size: 12px; font-weight: 700; color: #a5b4fc; margin: 6px 0 3px; }
        .ai-ul  { margin: 5px 0 5px 16px; padding: 0; }
        .ai-ul li { margin-bottom: 3px; }
        .ai-hr  { border: none; border-top: 1px solid var(--border); margin: 10px 0; }
        strong  { color: var(--text-base); }
        em      { color: #a5b4fc; }
      `}</style>
    </div>
  )
}

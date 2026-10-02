// ── CodeForge Extensions System ─────────────────────────────────────────────
// Type definitions for extensions, AI helpers, auto-correct, and custom uploaded plugins

export type ExtensionCategory = 'ai' | 'linter' | 'formatter' | 'snippets' | 'tools' | 'custom'

export interface ExtensionCompletionRule {
  trigger: string
  code: string
  description?: string
}

export interface ExtensionLinterRule {
  pattern: string
  replacement: string
  message: string
}

export interface Extension {
  id: string
  name: string
  displayName?: string
  version: string
  author: string
  publisher?: string
  description: string
  icon: string // emoji, icon tag, or base64 / URL
  iconUrl?: string
  category: ExtensionCategory
  enabled: boolean
  isBuiltIn: boolean
  isVSCodeOfficial?: boolean
  verified?: boolean
  downloads?: number
  rating?: number
  reviewCount?: number
  tags: string[]
  settings?: Record<string, any>
  completions?: ExtensionCompletionRule[]
  linterRules?: ExtensionLinterRule[]
  installedAt?: number
  vsixUrl?: string
  repositoryUrl?: string
  readme?: string
  snippets?: Record<string, any>
  themes?: any[]
  themeData?: Record<string, any>
  packageJSON?: Record<string, any>
}

export interface GhostTextSuggestion {
  text: string
  insertText: string
  lineNumber: number
  column: number
  trigger: string
  sourceExtension: string
}

export interface AutoCorrectResult {
  correctedCode: string
  changesCount: number
  fixes: string[]
}

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
  version: string
  author: string
  description: string
  icon: string // emoji or icon tag
  category: ExtensionCategory
  enabled: boolean
  isBuiltIn: boolean
  downloads?: number
  rating?: number
  tags: string[]
  settings?: Record<string, any>
  completions?: ExtensionCompletionRule[]
  linterRules?: ExtensionLinterRule[]
  installedAt?: number
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

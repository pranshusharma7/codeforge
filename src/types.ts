export type Theme = 'dark' | 'light'

export type ExecutionStatus =
  | 'idle' | 'queued' | 'compiling' | 'running'
  | 'accepted' | 'wrong_answer' | 'time_limit'
  | 'memory_limit' | 'runtime_error' | 'compile_error'

export interface Language {
  id: string
  label: string
  monacoId: string
  judge0Id: number
  ext: string
  icon: string
  color: string
  starter: string
}

export interface FileTab {
  id: string
  name: string
  langId: string
  content: string
  modified: boolean
}

export interface ExecutionResult {
  status: ExecutionStatus
  stdout: string
  stderr: string
  compileOutput: string
  timeMs: number | null
  memoryKb: number | null
  exitCode: number | null
}

export interface ConsoleTab {
  id: 'testcase' | 'output' | 'ai'
  label: string
}

export interface HistoryEntry {
  id: string
  langId: string
  code: string
  status: ExecutionStatus
  timeMs: number | null
  memoryKb: number | null
  timestamp: Date
  stdin: string
}

export interface AIMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  type?: 'text' | 'diff' | 'review'
  timestamp: Date
}

export interface RailPanel {
  id: 'files' | 'history' | 'settings' | 'share'
  icon: React.ReactNode
  label: string
}

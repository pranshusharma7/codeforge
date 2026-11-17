import React, { useState, useEffect, useRef, useCallback } from 'react'
import {
  Play,
  RotateCcw,
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  Code2,
  FileText,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  Layers,
  FileJson,
  Maximize2,
  Download,
  Terminal,
  HelpCircle,
  RefreshCw,
} from 'lucide-react'

export interface JupyterCell {
  id: string
  cell_type: 'code' | 'markdown'
  source: string[] | string
  execution_count: number | null
  outputs: Array<{
    output_type: string
    name?: string
    text?: string[] | string
    data?: Record<string, any>
    ename?: string
    evalue?: string
    traceback?: string[]
  }>
  metadata?: Record<string, any>
  _status?: 'idle' | 'running' | 'success' | 'error'
  _duration?: string
}

export interface JupyterNotebookData {
  cells: JupyterCell[]
  metadata: {
    kernelspec?: {
      display_name: string
      language: string
      name: string
    }
    language_info?: {
      name: string
      version?: string
    }
    [key: string]: any
  }
  nbformat: number
  nbformat_minor: number
}

interface JupyterNotebookEditorProps {
  tabId: string
  fileName: string
  code: string
  onChange: (newJson: string) => void
  onRunCode: (
    code: string,
    stdin?: string,
  ) => Promise<{
    stdout: string | null
    stderr: string | null
    time?: string | null
    status?: { id: number; description: string } | null
    exit_code?: number | null
  }>
  onToggleRawMode?: () => void
  isCollabSession?: boolean
}

// Helper to convert source string or array to string
function getSourceString(source: string[] | string | undefined): string {
  if (!source) return ''
  if (Array.isArray(source)) return source.join('')
  return source
}

// Helper to parse notebook safely
function parseNotebook(rawJson: string): JupyterNotebookData {
  try {
    const parsed = JSON.parse(rawJson)
    if (parsed && typeof parsed === 'object' && Array.isArray(parsed.cells)) {
      return {
        cells: parsed.cells.map((c: any, idx: number) => ({
          ...c,
          id: c.id || `cell-${idx}-${Date.now()}`,
          execution_count: c.execution_count ?? null,
          outputs: Array.isArray(c.outputs) ? c.outputs : [],
          source: c.source || '',
        })),
        metadata: parsed.metadata || {
          kernelspec: { display_name: 'Python 3', language: 'python', name: 'python3' },
          language_info: { name: 'python' },
        },
        nbformat: parsed.nbformat || 4,
        nbformat_minor: parsed.nbformat_minor || 5,
      }
    }
  } catch {}

  // Fallback default starter notebook
  return {
    cells: [
      {
        id: `cell-${Date.now()}-1`,
        cell_type: 'markdown',
        source: [
          '# 🤖 Machine Learning Notebook\n',
          'Welcome to your interactive Python Jupyter Notebook in CodeForge.\n',
          'Use **▶ Run Cell** (`Shift+Enter`) to train models and visualize data.',
        ],
        execution_count: null,
        outputs: [],
      },
      {
        id: `cell-${Date.now()}-2`,
        cell_type: 'code',
        source: [
          '# Python ML Environment\n',
          'import sys\n',
          'print("🐍 Python:", sys.version.split()[0])\n',
          'import math\n',
          'print("✓ Ready to compute!")\n',
        ],
        execution_count: null,
        outputs: [],
      },
    ],
    metadata: {
      kernelspec: { display_name: 'Python 3', language: 'python', name: 'python3' },
      language_info: { name: 'python' },
    },
    nbformat: 4,
    nbformat_minor: 5,
  }
}

// Basic markdown renderer for preview mode
function renderSimpleMarkdown(md: string) {
  const lines = md.split('\n')
  return lines.map((line, idx) => {
    if (line.startsWith('# ')) {
      return <h1 key={idx} className="text-xl font-bold mt-2 mb-1" style={{ color: 'var(--text-base)' }}>{line.slice(2)}</h1>
    }
    if (line.startsWith('## ')) {
      return <h2 key={idx} className="text-lg font-semibold mt-2 mb-1" style={{ color: 'var(--text-base)' }}>{line.slice(3)}</h2>
    }
    if (line.startsWith('### ')) {
      return <h3 key={idx} className="text-base font-semibold mt-1 mb-1" style={{ color: 'var(--text-base)' }}>{line.slice(4)}</h3>
    }
    if (line.startsWith('> ')) {
      return (
        <blockquote key={idx} className="border-l-4 pl-3 py-1 my-1 text-sm italic" style={{ borderColor: 'var(--accent)', color: 'var(--text-muted)' }}>
          {line.slice(2)}
        </blockquote>
      )
    }
    if (line.startsWith('- ') || line.startsWith('* ')) {
      return (
        <li key={idx} className="ml-4 text-sm list-disc" style={{ color: 'var(--text-base)' }}>
          {line.slice(2)}
        </li>
      )
    }
    if (line.trim() === '') {
      return <div key={idx} className="h-2" />
    }
    return (
      <p key={idx} className="text-sm leading-relaxed my-0.5" style={{ color: 'var(--text-base)' }}>
        {line}
      </p>
    )
  })
}

export default function JupyterNotebookEditor({
  tabId,
  fileName,
  code,
  onChange,
  onRunCode,
  onToggleRawMode,
  isCollabSession,
}: JupyterNotebookEditorProps) {
  const [notebook, setNotebook] = useState<JupyterNotebookData>(() => parseNotebook(code))
  const [activeCellId, setActiveCellId] = useState<string | null>(null)
  const [editingMarkdownId, setEditingMarkdownId] = useState<string | null>(null)
  const [runningCellId, setRunningCellId] = useState<string | null>(null)
  const [isRunningAll, setIsRunningAll] = useState<boolean>(false)
  const [previewImageModal, setPreviewImageModal] = useState<string | null>(null)
  const isUpdatingRef = useRef<boolean>(false)

  // Sync internal state when external code prop changes (e.g. file switched or collab sync)
  useEffect(() => {
    if (isUpdatingRef.current) return
    const parsed = parseNotebook(code)
    setNotebook(parsed)
    if (parsed.cells.length > 0 && !activeCellId) {
      setActiveCellId(parsed.cells[0].id)
    }
  }, [code, tabId])

  // Broadcast changes back to parent
  const emitChanges = useCallback(
    (newNotebook: JupyterNotebookData) => {
      isUpdatingRef.current = true
      setNotebook(newNotebook)
      const serialized = JSON.stringify(newNotebook, null, 2)
      onChange(serialized)
      setTimeout(() => {
        isUpdatingRef.current = false
      }, 50)
    },
    [onChange],
  )

  // Update a single cell's source
  const handleSourceChange = (cellId: string, newSource: string) => {
    const updatedCells = notebook.cells.map((cell) => {
      if (cell.id === cellId) {
        return {
          ...cell,
          source: newSource,
        }
      }
      return cell
    })
    emitChanges({ ...notebook, cells: updatedCells })
  }

  // Toggle cell type
  const handleToggleCellType = (cellId: string, newType: 'code' | 'markdown') => {
    const updatedCells = notebook.cells.map((cell) => {
      if (cell.id === cellId) {
        return {
          ...cell,
          cell_type: newType,
          outputs: newType === 'markdown' ? [] : cell.outputs,
          execution_count: newType === 'markdown' ? null : cell.execution_count,
        }
      }
      return cell
    })
    emitChanges({ ...notebook, cells: updatedCells })
  }

  // Add a new cell
  const handleAddCell = (type: 'code' | 'markdown', afterId?: string) => {
    const newCell: JupyterCell = {
      id: `cell-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      cell_type: type,
      source: type === 'code' ? '# Write Python code here\n' : '### Markdown Documentation\nWrite notes, formulas, or explanations.',
      execution_count: null,
      outputs: [],
    }

    let updatedCells: JupyterCell[] = []
    if (!afterId || notebook.cells.length === 0) {
      updatedCells = [...notebook.cells, newCell]
    } else {
      const idx = notebook.cells.findIndex((c) => c.id === afterId)
      if (idx === -1) {
        updatedCells = [...notebook.cells, newCell]
      } else {
        updatedCells = [
          ...notebook.cells.slice(0, idx + 1),
          newCell,
          ...notebook.cells.slice(idx + 1),
        ]
      }
    }

    setActiveCellId(newCell.id)
    if (type === 'markdown') {
      setEditingMarkdownId(newCell.id)
    }
    emitChanges({ ...notebook, cells: updatedCells })
  }

  // Delete a cell
  const handleDeleteCell = (cellId: string) => {
    if (notebook.cells.length <= 1) return
    const updatedCells = notebook.cells.filter((c) => c.id !== cellId)
    emitChanges({ ...notebook, cells: updatedCells })
    if (activeCellId === cellId) {
      setActiveCellId(updatedCells[0]?.id || null)
    }
  }

  // Move cell up
  const handleMoveUp = (cellId: string) => {
    const idx = notebook.cells.findIndex((c) => c.id === cellId)
    if (idx <= 0) return
    const updatedCells = [...notebook.cells]
    const temp = updatedCells[idx - 1]
    updatedCells[idx - 1] = updatedCells[idx]
    updatedCells[idx] = temp
    emitChanges({ ...notebook, cells: updatedCells })
  }

  // Move cell down
  const handleMoveDown = (cellId: string) => {
    const idx = notebook.cells.findIndex((c) => c.id === cellId)
    if (idx === -1 || idx >= notebook.cells.length - 1) return
    const updatedCells = [...notebook.cells]
    const temp = updatedCells[idx + 1]
    updatedCells[idx + 1] = updatedCells[idx]
    updatedCells[idx] = temp
    emitChanges({ ...notebook, cells: updatedCells })
  }

  // Clear all outputs
  const handleClearOutputs = () => {
    const updatedCells = notebook.cells.map((cell) => ({
      ...cell,
      outputs: [],
      execution_count: null,
      _status: 'idle' as const,
      _duration: undefined,
    }))
    emitChanges({ ...notebook, cells: updatedCells })
  }

  // Execute a single code cell
  const handleRunCell = async (cellId: string) => {
    const cell = notebook.cells.find((c) => c.id === cellId)
    if (!cell || cell.cell_type !== 'code') return

    setRunningCellId(cellId)
    const rawCode = getSourceString(cell.source)

    // Transparently auto-capture matplotlib plots if matplotlib.pyplot is imported
    let codeToExecute = rawCode
    if (rawCode.includes('matplotlib') || rawCode.includes('plt.')) {
      codeToExecute = `import os\nos.environ['MPLCONFIGDIR'] = '/tmp'\n` + rawCode + `\n
# Auto-capture Matplotlib Figures
try:
    import sys
    if 'matplotlib.pyplot' in sys.modules:
        import io, base64
        _plt = sys.modules['matplotlib.pyplot']
        if _plt.get_fignums():
            _buf = io.BytesIO()
            _plt.savefig(_buf, format='png', bbox_inches='tight', dpi=100)
            _buf.seek(0)
            print('\\n__IMAGE_BASE64__:' + base64.b64encode(_buf.read()).decode('utf-8'))
            _plt.close('all')
except Exception:
    pass
`
    }

    const nextCount = (Math.max(0, ...notebook.cells.map((c) => c.execution_count || 0))) + 1

    try {
      const res = await onRunCode(codeToExecute)

      let stdoutText = res.stdout || ''
      const stderrText = res.stderr || ''
      let imageBase64: string | null = null

      // Extract __IMAGE_BASE64__ token if present
      if (stdoutText.includes('__IMAGE_BASE64__:')) {
        const parts = stdoutText.split('__IMAGE_BASE64__:')
        stdoutText = parts[0].trim()
        const afterToken = parts[1]
        const endLineIdx = afterToken.indexOf('\n')
        if (endLineIdx !== -1) {
          imageBase64 = afterToken.slice(0, endLineIdx).trim()
          stdoutText += '\n' + afterToken.slice(endLineIdx).trim()
        } else {
          imageBase64 = afterToken.trim()
        }
      }

      const outputs: JupyterCell['outputs'] = []

      if (stdoutText.trim()) {
        outputs.push({
          output_type: 'stream',
          name: 'stdout',
          text: [stdoutText + '\n'],
        })
      }

      if (imageBase64) {
        outputs.push({
          output_type: 'display_data',
          data: {
            'image/png': imageBase64,
            'text/plain': ['<Figure size 600x300 with 1 Axes>'],
          },
        })
      }

      if (stderrText.trim()) {
        outputs.push({
          output_type: 'error',
          ename: 'RuntimeError',
          evalue: stderrText,
          traceback: stderrText.split('\n'),
        })
      }

      const isSuccess = !stderrText.trim() && (res.exit_code === 0 || res.exit_code === undefined)

      const updatedCells = notebook.cells.map((c) => {
        if (c.id === cellId) {
          return {
            ...c,
            execution_count: nextCount,
            outputs,
            _status: isSuccess ? ('success' as const) : ('error' as const),
            _duration: res.time ? `${Math.round(parseFloat(res.time) * 1000)}ms` : undefined,
          }
        }
        return c
      })

      emitChanges({ ...notebook, cells: updatedCells })
    } catch (err: any) {
      const updatedCells = notebook.cells.map((c) => {
        if (c.id === cellId) {
          return {
            ...c,
            execution_count: nextCount,
            outputs: [
              {
                output_type: 'error',
                ename: 'ExecutionError',
                evalue: err.message || String(err),
                traceback: [err.message || String(err)],
              },
            ],
            _status: 'error' as const,
          }
        }
        return c
      })
      emitChanges({ ...notebook, cells: updatedCells })
    } finally {
      setRunningCellId(null)
    }
  }

  // Run all code cells in sequential order
  const handleRunAll = async () => {
    setIsRunningAll(true)
    for (const cell of notebook.cells) {
      if (cell.cell_type === 'code') {
        await handleRunCell(cell.id)
      }
    }
    setIsRunningAll(false)
  }

  return (
    <div
      className="flex flex-col h-full w-full select-text"
      style={{
        backgroundColor: 'var(--bg-app)',
        color: 'var(--text-base)',
      }}
    >
      {/* ── Top Notebook Control Toolbar ── */}
      <div
        className="flex items-center justify-between px-4 py-2 border-b flex-wrap gap-2 text-xs"
        style={{
          borderColor: 'var(--border)',
          backgroundColor: 'var(--bg-card)',
        }}
      >
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 font-semibold text-xs text-orange-400">
            <Sparkles size={14} />
            <span>Jupyter Notebook</span>
          </div>

          <div
            className="flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-mono border"
            style={{
              backgroundColor: 'var(--bg-hover)',
              borderColor: 'var(--border)',
              color: 'var(--text-muted)',
            }}
          >
            <span
              className={`inline-block w-2 h-2 rounded-full ${
                runningCellId || isRunningAll ? 'bg-amber-400 animate-pulse' : 'bg-emerald-400'
              }`}
            />
            <span>
              {runningCellId || isRunningAll ? 'Python 3 (Running...)' : 'Python 3 (Idle)'}
            </span>
          </div>

          <span className="text-[11px] text-gray-400">
            {notebook.cells.length} {notebook.cells.length === 1 ? 'cell' : 'cells'}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => handleAddCell('code', activeCellId || undefined)}
            className="btn flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium cursor-pointer transition hover:opacity-90"
            style={{
              backgroundColor: 'var(--bg-hover)',
              border: '1px solid var(--border)',
              color: 'var(--text-base)',
            }}
            title="Add new Python code cell below"
          >
            <Plus size={13} className="text-emerald-400" />
            <span>Code</span>
          </button>

          <button
            onClick={() => handleAddCell('markdown', activeCellId || undefined)}
            className="btn flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium cursor-pointer transition hover:opacity-90"
            style={{
              backgroundColor: 'var(--bg-hover)',
              border: '1px solid var(--border)',
              color: 'var(--text-base)',
            }}
            title="Add new Markdown documentation cell"
          >
            <Plus size={13} className="text-blue-400" />
            <span>Markdown</span>
          </button>

          <button
            onClick={handleRunAll}
            disabled={isRunningAll || !!runningCellId}
            className="btn flex items-center gap-1.5 px-3 py-1 rounded text-xs font-semibold cursor-pointer transition disabled:opacity-50"
            style={{
              backgroundColor: 'var(--accent)',
              color: '#ffffff',
            }}
            title="Run all code cells in sequence"
          >
            <Play size={12} fill="currentColor" />
            <span>{isRunningAll ? 'Running...' : 'Run All'}</span>
          </button>

          <button
            onClick={handleClearOutputs}
            className="btn flex items-center gap-1 px-2 py-1 rounded text-xs font-medium cursor-pointer transition"
            style={{
              backgroundColor: 'var(--bg-hover)',
              border: '1px solid var(--border)',
              color: 'var(--text-muted)',
            }}
            title="Clear all execution outputs"
          >
            <RotateCcw size={12} />
            <span className="hidden sm:inline">Clear Outputs</span>
          </button>

          {onToggleRawMode && (
            <button
              onClick={onToggleRawMode}
              className="btn flex items-center gap-1 px-2 py-1 rounded text-xs font-medium cursor-pointer transition"
              style={{
                backgroundColor: 'var(--bg-hover)',
                border: '1px solid var(--border)',
                color: 'var(--text-muted)',
              }}
              title="Toggle raw .ipynb JSON editor"
            >
              <FileJson size={12} />
              <span className="hidden md:inline">Raw JSON</span>
            </button>
          )}
        </div>
      </div>

      {/* ── Main Cells Scroll Area ── */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {notebook.cells.map((cell, idx) => {
          const isCode = cell.cell_type === 'code'
          const isActive = activeCellId === cell.id
          const isRunning = runningCellId === cell.id
          const rawSource = getSourceString(cell.source)

          return (
            <div
              key={cell.id}
              onClick={() => setActiveCellId(cell.id)}
              className="rounded-lg transition border group relative"
              style={{
                backgroundColor: 'var(--bg-card)',
                borderColor: isActive ? 'var(--accent)' : 'var(--border)',
                boxShadow: isActive ? '0 0 0 1px var(--accent)' : 'none',
              }}
            >
              {/* Cell Header / Action Bar */}
              <div
                className="flex items-center justify-between px-3 py-1.5 text-xs border-b select-none"
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.02)',
                  borderColor: 'var(--border)',
                  color: 'var(--text-muted)',
                }}
              >
                <div className="flex items-center gap-2">
                  <span
                    className="font-mono text-[11px] px-1.5 py-0.5 rounded font-semibold"
                    style={{
                      backgroundColor: isCode ? 'rgba(16, 185, 129, 0.15)' : 'rgba(59, 130, 246, 0.15)',
                      color: isCode ? '#10b981' : '#3b82f6',
                    }}
                  >
                    {isCode ? `[${cell.execution_count ?? ' '}] Code` : 'Markdown'}
                  </span>

                  {cell._duration && (
                    <span className="flex items-center gap-1 text-[11px] text-gray-400">
                      <Clock size={11} />
                      {cell._duration}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1 opacity-70 group-hover:opacity-100 transition-opacity">
                  {/* Run Cell button for Code cells */}
                  {isCode && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleRunCell(cell.id)
                      }}
                      disabled={isRunning || isRunningAll}
                      className="p-1 rounded hover:bg-emerald-500/20 text-emerald-400 transition cursor-pointer"
                      title="Run Cell (Shift+Enter)"
                    >
                      <Play size={13} fill="currentColor" />
                    </button>
                  )}

                  {/* Switch Cell Type */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleToggleCellType(cell.id, isCode ? 'markdown' : 'code')
                    }}
                    className="p-1 rounded hover:bg-white/10 transition cursor-pointer text-[11px]"
                    title={`Convert to ${isCode ? 'Markdown' : 'Code'}`}
                  >
                    {isCode ? <FileText size={13} /> : <Code2 size={13} />}
                  </button>

                  {/* Move Up */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleMoveUp(cell.id)
                    }}
                    disabled={idx === 0}
                    className="p-1 rounded hover:bg-white/10 transition cursor-pointer disabled:opacity-30"
                    title="Move Cell Up"
                  >
                    <ChevronUp size={13} />
                  </button>

                  {/* Move Down */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleMoveDown(cell.id)
                    }}
                    disabled={idx === notebook.cells.length - 1}
                    className="p-1 rounded hover:bg-white/10 transition cursor-pointer disabled:opacity-30"
                    title="Move Cell Down"
                  >
                    <ChevronDown size={13} />
                  </button>

                  {/* Delete Cell */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDeleteCell(cell.id)
                    }}
                    disabled={notebook.cells.length <= 1}
                    className="p-1 rounded hover:bg-red-500/20 text-red-400 transition cursor-pointer disabled:opacity-30"
                    title="Delete Cell"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>

              {/* Cell Body */}
              <div className="p-3">
                {isCode ? (
                  <div className="flex gap-2">
                    {/* Execution count gutter */}
                    <div className="w-12 pt-1 font-mono text-[11px] text-right pr-2 text-gray-500 select-none">
                      {isRunning ? (
                        <RefreshCw size={13} className="animate-spin text-amber-400 ml-auto" />
                      ) : (
                        `[${cell.execution_count ?? ' '}]:`
                      )}
                    </div>

                    {/* Code Textarea Editor */}
                    <div className="flex-1">
                      <textarea
                        value={rawSource}
                        onChange={(e) => handleSourceChange(cell.id, e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && (e.shiftKey || e.ctrlKey)) {
                            e.preventDefault()
                            handleRunCell(cell.id)
                          } else if (e.key === 'Tab') {
                            e.preventDefault()
                            const target = e.currentTarget
                            const start = target.selectionStart
                            const end = target.selectionEnd
                            const val = target.value
                            const next = val.substring(0, start) + '    ' + val.substring(end)
                            handleSourceChange(cell.id, next)
                            setTimeout(() => {
                              target.selectionStart = target.selectionEnd = start + 4
                            }, 0)
                          }
                        }}
                        placeholder="# Write Python code here..."
                        rows={Math.max(2, rawSource.split('\n').length)}
                        className="w-full font-mono text-xs leading-relaxed bg-transparent resize-y outline-none p-2 rounded border focus:border-purple-500"
                        style={{
                          backgroundColor: 'rgba(0, 0, 0, 0.25)',
                          borderColor: 'var(--border)',
                          color: 'var(--text-base)',
                        }}
                        spellCheck={false}
                      />
                    </div>
                  </div>
                ) : (
                  /* Markdown Cell */
                  <div>
                    {editingMarkdownId === cell.id ? (
                      <div>
                        <textarea
                          value={rawSource}
                          onChange={(e) => handleSourceChange(cell.id, e.target.value)}
                          onBlur={() => setEditingMarkdownId(null)}
                          autoFocus
                          rows={Math.max(3, rawSource.split('\n').length)}
                          className="w-full font-mono text-xs leading-relaxed bg-transparent resize-y outline-none p-2.5 rounded border focus:border-blue-500"
                          style={{
                            backgroundColor: 'rgba(0, 0, 0, 0.25)',
                            borderColor: 'var(--border)',
                            color: 'var(--text-base)',
                          }}
                        />
                        <div className="flex justify-between items-center text-[11px] text-gray-400 mt-1 px-1">
                          <span>Markdown mode (Press Esc or click outside to preview)</span>
                          <button
                            onClick={() => setEditingMarkdownId(null)}
                            className="text-blue-400 hover:underline cursor-pointer"
                          >
                            Done Editing
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div
                        onDoubleClick={() => setEditingMarkdownId(cell.id)}
                        className="cursor-pointer min-h-[40px] px-2 py-1 rounded hover:bg-white/[0.02]"
                        title="Double-click to edit Markdown"
                      >
                        {rawSource.trim() ? (
                          renderSimpleMarkdown(rawSource)
                        ) : (
                          <span className="italic text-gray-500 text-xs">
                            Empty markdown cell. Double-click to write notes.
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Outputs Section (Code cells only) */}
                {isCode && cell.outputs && cell.outputs.length > 0 && (
                  <div
                    className="mt-3 ml-12 rounded border p-3 text-xs font-mono space-y-2 overflow-x-auto"
                    style={{
                      backgroundColor: 'rgba(0, 0, 0, 0.35)',
                      borderColor: 'var(--border)',
                    }}
                  >
                    {cell.outputs.map((out, outIdx) => {
                      if (out.output_type === 'stream') {
                        const streamText = Array.isArray(out.text)
                          ? out.text.join('')
                          : out.text || ''
                        return (
                          <div
                            key={outIdx}
                            className="whitespace-pre-wrap leading-relaxed"
                            style={{
                              color: out.name === 'stderr' ? '#f87171' : 'var(--text-base)',
                            }}
                          >
                            {streamText}
                          </div>
                        )
                      }

                      if (out.output_type === 'display_data' || out.output_type === 'execute_result') {
                        const imgB64 = out.data?.['image/png']
                        const plainText = out.data?.['text/plain']
                        return (
                          <div key={outIdx} className="space-y-2">
                            {plainText && (
                              <div className="text-gray-400 text-[11px]">
                                {Array.isArray(plainText) ? plainText.join('') : plainText}
                              </div>
                            )}
                            {imgB64 && (
                              <div className="relative inline-block border rounded overflow-hidden bg-white/5 p-1 group">
                                <img
                                  src={`data:image/png;base64,${imgB64}`}
                                  alt="Matplotlib Plot"
                                  className="max-w-full rounded cursor-pointer"
                                  onClick={() => setPreviewImageModal(imgB64)}
                                />
                                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-black/70 px-2 py-1 rounded text-[10px] text-white flex items-center gap-1 cursor-pointer">
                                  <Maximize2 size={11} />
                                  <span>Enlarge</span>
                                </div>
                              </div>
                            )}
                          </div>
                        )
                      }

                      if (out.output_type === 'error') {
                        const errorMsg =
                          out.traceback && out.traceback.length > 0
                            ? out.traceback.join('\n')
                            : `${out.ename || 'Error'}: ${out.evalue || 'Unknown error'}`
                        return (
                          <div
                            key={outIdx}
                            className="text-red-400 whitespace-pre-wrap leading-relaxed p-2 rounded bg-red-950/20 border border-red-900/30"
                          >
                            {errorMsg}
                          </div>
                        )
                      }

                      return null
                    })}
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* ── Image Lightbox Modal ── */}
      {previewImageModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setPreviewImageModal(null)}
        >
          <div
            className="relative max-w-4xl max-h-[90vh] bg-neutral-900 p-2 rounded-lg border border-neutral-700 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-2 px-2 text-xs text-gray-400">
              <span>Interactive Plot Preview</span>
              <button
                onClick={() => setPreviewImageModal(null)}
                className="text-gray-400 hover:text-white"
              >
                ✕ Close
              </button>
            </div>
            <img
              src={`data:image/png;base64,${previewImageModal}`}
              alt="Enlarged Plot"
              className="max-h-[80vh] w-auto rounded"
            />
          </div>
        </div>
      )}
    </div>
  )
}

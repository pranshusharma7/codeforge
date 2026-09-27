import React, { useState, useEffect, useRef } from 'react'
import type { DebugStep, DebugVariable, WatchItem, BugInsight } from '../engine/debugger'
import {
  evaluateWatchExpression,
  analyzeCodeForBugs
} from '../engine/debugger'
import {
  PlayIcon,
  PauseIcon,
  TrashIcon,
  SparklesIcon,
  StepOverIcon,
  StepIntoIcon,
  StepOutIcon,
  RestartIcon,
  StopIcon,
  CheckIcon,
  ChevronDown
} from './icons'

interface Props {
  code: string
  langId: string
  stdin: string
  fileName?: string
  breakpoints: number[]
  onToggleBreakpoint: (line: number) => void
  onClearBreakpoints: () => void
  onJumpToLine?: (line: number) => void
  onActiveLineChange?: (line: number | null) => void
  isDebugging: boolean
  setIsDebugging: (v: boolean) => void
  steps: DebugStep[]
  currentStepIdx: number
  setCurrentStepIdx: (idx: number | ((prev: number) => number)) => void
  onStartDebugging: () => void
  onStopDebugging: () => void
  onRestartDebugging: () => void
  onStepNext: () => void
  onStepPrev: () => void
  onContinue: () => void
  isAutoPlaying: boolean
  setIsAutoPlaying: (v: boolean | ((p: boolean) => boolean)) => void
  playSpeed: number
  setPlaySpeed: (s: number) => void
  watches: WatchItem[]
  setWatches: React.Dispatch<React.SetStateAction<WatchItem[]>>
  onAddConsoleLog?: (log: any) => void
}

export default function DebuggerPanel({
  code,
  langId,
  stdin,
  fileName = 'main',
  breakpoints,
  onToggleBreakpoint,
  onClearBreakpoints,
  onJumpToLine,
  onActiveLineChange,
  isDebugging,
  setIsDebugging,
  steps,
  currentStepIdx,
  setCurrentStepIdx,
  onStartDebugging,
  onStopDebugging,
  onRestartDebugging,
  onStepNext,
  onStepPrev,
  onContinue,
  isAutoPlaying,
  setIsAutoPlaying,
  playSpeed,
  setPlaySpeed,
  watches,
  setWatches,
  onAddConsoleLog
}: Props) {
  // Accordion states (VS Code sections)
  const [openSections, setOpenSections] = useState({
    variables: true,
    watch: true,
    callstack: true,
    breakpoints: true,
    ai: false
  })

  const [expandedVarKeys, setExpandedVarKeys] = useState<Record<string, boolean>>({})
  const [editingVar, setEditingVar] = useState<{ name: string; value: string } | null>(null)
  const [newWatchExpr, setNewWatchExpr] = useState('')
  const [isAddingWatch, setIsAddingWatch] = useState(false)
  const [newBpLine, setNewBpLine] = useState('')
  const [isAddingBp, setIsAddingBp] = useState(false)
  const [disabledBreakpoints, setDisabledBreakpoints] = useState<number[]>([])
  const [bugInsights, setBugInsights] = useState<BugInsight[]>([])
  const [isScanningBugs, setIsScanningBugs] = useState(false)
  const [copiedKey, setCopiedKey] = useState<string | null>(null)

  const toggleSection = (section: keyof typeof openSections) => {
    setOpenSections(prev => ({ ...prev, [section]: !prev[section] }))
  }

  const currentStep = steps[currentStepIdx] || null
  const currentVariables = currentStep?.variables || {}
  const codeLines = code.split('\n')

  // Toggle variable expand in tree
  const toggleVarExpand = (key: string) => {
    setExpandedVarKeys(prev => ({ ...prev, [key]: !prev[key] }))
  }

  // Copy variable value
  const handleCopyVar = (key: string, val: any, e: React.MouseEvent) => {
    e.stopPropagation()
    const str = typeof val === 'object' ? JSON.stringify(val, null, 2) : String(val)
    navigator.clipboard?.writeText?.(str)
    setCopiedKey(key)
    setTimeout(() => setCopiedKey(null), 1500)
  }

  // Edit variable value live in current step
  const handleSaveVarEdit = (varName: string) => {
    if (!editingVar || !currentStep) return
    let parsedVal: any = editingVar.value
    try {
      if (editingVar.value === 'true') parsedVal = true
      else if (editingVar.value === 'false') parsedVal = false
      else if (!isNaN(Number(editingVar.value)) && editingVar.value.trim() !== '') {
        parsedVal = Number(editingVar.value)
      } else if (editingVar.value.startsWith('[') || editingVar.value.startsWith('{')) {
        parsedVal = JSON.parse(editingVar.value)
      }
    } catch {}

    if (currentStep.variables[varName]) {
      currentStep.variables[varName].value = parsedVal
      currentStep.variables[varName].changed = true
      onAddConsoleLog?.({
        type: 'info',
        text: `Modified variable '${varName}' = ${JSON.stringify(parsedVal)}`
      })
    }
    setEditingVar(null)
  }

  // Watch expressions handlers
  const handleAddWatch = (e?: React.FormEvent) => {
    e?.preventDefault()
    if (!newWatchExpr.trim()) return
    const expr = newWatchExpr.trim()
    const val = evaluateWatchExpression(expr, currentVariables)
    setWatches(prev => [...prev, { id: crypto.randomUUID(), expression: expr, value: val }])
    setNewWatchExpr('')
    setIsAddingWatch(false)
  }

  const handleRemoveWatch = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setWatches(prev => prev.filter(w => w.id !== id))
  }

  // Breakpoints handlers
  const handleAddBpSubmit = (e?: React.FormEvent) => {
    e?.preventDefault()
    const line = parseInt(newBpLine, 10)
    if (!isNaN(line) && line > 0 && !breakpoints.includes(line)) {
      onToggleBreakpoint(line)
      setNewBpLine('')
      setIsAddingBp(false)
    }
  }

  const toggleBpEnabled = (line: number, e: React.MouseEvent) => {
    e.stopPropagation()
    setDisabledBreakpoints(prev =>
      prev.includes(line) ? prev.filter(l => l !== line) : [...prev, line]
    )
  }

  // AI Bug scan
  const handleScanBugs = () => {
    setIsScanningBugs(true)
    setTimeout(() => {
      const results = analyzeCodeForBugs(code, langId)
      setBugInsights(results)
      setIsScanningBugs(false)
      setOpenSections(prev => ({ ...prev, ai: true }))
    }, 280)
  }

  // Helper to render colored value
  const renderValuePreview = (val: any, type: string) => {
    if (val === null) return <span style={{ color: '#7d8590' }}>null</span>
    if (val === undefined) return <span style={{ color: '#7d8590' }}>undefined</span>
    if (type === 'number' || typeof val === 'number') {
      return <span style={{ color: '#38bdf8' }}>{String(val)}</span>
    }
    if (type === 'boolean' || typeof val === 'boolean') {
      return <span style={{ color: '#c084fc', fontWeight: 600 }}>{String(val)}</span>
    }
    if (type === 'string' || typeof val === 'string') {
      return <span style={{ color: '#4ade80' }}>&quot;{String(val)}&quot;</span>
    }
    if (Array.isArray(val)) {
      return <span style={{ color: 'var(--text-muted)' }}>Array({val.length}) [{val.slice(0, 3).join(', ')}{val.length > 3 ? '…' : ''}]</span>
    }
    if (typeof val === 'object') {
      return <span style={{ color: 'var(--text-muted)' }}>Object {JSON.stringify(val).slice(0, 30)}</span>
    }
    return <span>{String(val)}</span>
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--bg-sidebar)', color: 'var(--text-base)', fontSize: 11, userSelect: 'none' }}>
      
      {/* ── Top Header: RUN AND DEBUG ─────────────────────────────────── */}
      <div style={{ padding: '8px 12px', borderBottom: '1px solid var(--border)', background: 'var(--bg-header)', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
            Run and Debug
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span
              style={{
                fontSize: 9,
                fontWeight: 700,
                padding: '1px 5px',
                borderRadius: 4,
                background: isDebugging ? 'rgba(34, 197, 94, 0.15)' : 'rgba(110, 118, 129, 0.15)',
                color: isDebugging ? '#22c55e' : 'var(--text-dim)',
                border: `1px solid ${isDebugging ? 'rgba(34, 197, 94, 0.3)' : 'var(--border)'}`
              }}
            >
              {isDebugging ? 'ACTIVE' : 'IDLE'}
            </span>
          </div>
        </div>

        {/* Start / Control bar */}
        {!isDebugging ? (
          <button
            onClick={onStartDebugging}
            className="btn btn-primary"
            style={{
              width: '100%',
              padding: '6px 12px',
              fontSize: 12,
              fontWeight: 600,
              gap: 8,
              justifyContent: 'center',
              background: '#238636',
              border: 'none',
              borderRadius: 6
            }}
          >
            <PlayIcon size={12} /> Start Debugging (F5)
          </button>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {/* Status progress */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 10, color: 'var(--text-muted)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#eab308' }} />
                <span>Paused on line <b>{currentStep?.line ?? '?'}</b></span>
              </div>
              <span>Step {currentStepIdx + 1} of {steps.length}</span>
            </div>

            {/* Quick action control row */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2, background: 'var(--bg-app)', padding: '2px 4px', borderRadius: 6, border: '1px solid var(--border)' }}>
              <button onClick={onContinue} className="debug-tool-btn continue" title="Continue (F5)">
                <PlayIcon size={12} style={{ color: '#22c55e' }} />
              </button>
              <button onClick={onStepNext} className="debug-tool-btn" title="Step Over (F10)">
                <StepOverIcon size={13} style={{ color: 'var(--accent)' }} />
              </button>
              <button onClick={onStepNext} className="debug-tool-btn" title="Step Into (F11)">
                <StepIntoIcon size={13} style={{ color: 'var(--accent)' }} />
              </button>
              <button onClick={onStepPrev} className="debug-tool-btn" title="Step Out (Shift+F11)">
                <StepOutIcon size={13} style={{ color: 'var(--accent)' }} />
              </button>
              <button onClick={onRestartDebugging} className="debug-tool-btn restart" title="Restart (Ctrl+Shift+F5)">
                <RestartIcon size={12} style={{ color: '#38bdf8' }} />
              </button>
              <button onClick={onStopDebugging} className="debug-tool-btn stop" title="Stop (Shift+F5)">
                <StopIcon size={11} style={{ color: '#f85149' }} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Scrollable Accordions ─────────────────────────────────────── */}
      <div style={{ flex: 1, overflowY: 'auto' }}>

        {/* ── 1. VARIABLES ───────────────────────────────────────────── */}
        <div>
          <div className="debug-accordion-header" onClick={() => toggleSection('variables')}>
            <span style={{ transform: openSections.variables ? 'rotate(0deg)' : 'rotate(-90deg)', transition: 'transform 0.15s ease', display: 'flex' }}>
              <ChevronDown size={11} />
            </span>
            <span>Variables</span>
            <span style={{ marginLeft: 'auto', fontSize: 10, color: 'var(--text-dim)', fontWeight: 400 }}>
              {Object.keys(currentVariables).length}
            </span>
          </div>

          {openSections.variables && (
            <div style={{ padding: '4px 0', borderBottom: '1px solid var(--border)' }}>
              {/* Locals sub-group */}
              <div style={{ padding: '3px 12px', fontSize: 10, fontWeight: 700, color: 'var(--text-dim)', letterSpacing: '0.04em' }}>
                ▾ LOCALS
              </div>

              {Object.keys(currentVariables).length === 0 ? (
                <div style={{ padding: '6px 20px', color: 'var(--text-dim)', fontStyle: 'italic', fontSize: 11 }}>
                  {isDebugging ? 'No local variables in current frame' : 'Start debugger to inspect variables'}
                </div>
              ) : (
                Object.entries(currentVariables).map(([varName, variable]) => {
                  const isExpanded = !!expandedVarKeys[varName]
                  const isEditing = editingVar?.name === varName
                  const isArrayOrObj = typeof variable.value === 'object' && variable.value !== null

                  return (
                    <div key={varName} style={{ margin: '1px 0' }}>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                          padding: '3px 10px 3px 20px',
                          cursor: 'pointer',
                          background: variable.changed ? 'rgba(234, 179, 8, 0.08)' : 'transparent',
                          transition: 'background 0.1s'
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
                        onMouseLeave={e => e.currentTarget.style.background = variable.changed ? 'rgba(234, 179, 8, 0.08)' : 'transparent'}
                        onClick={() => {
                          if (isArrayOrObj) toggleVarExpand(varName)
                        }}
                        onDoubleClick={(e) => {
                          e.stopPropagation()
                          setEditingVar({ name: varName, value: typeof variable.value === 'object' ? JSON.stringify(variable.value) : String(variable.value) })
                        }}
                      >
                        {/* Expand chevron for array/obj */}
                        {isArrayOrObj ? (
                          <span style={{ fontSize: 9, color: 'var(--text-dim)', width: 10 }}>
                            {isExpanded ? '▾' : '▸'}
                          </span>
                        ) : (
                          <span style={{ width: 10 }} />
                        )}

                        {/* Variable name */}
                        <span style={{ color: 'var(--text-base)', fontWeight: 600, fontFamily: "'JetBrains Mono', monospace" }}>
                          {varName}:
                        </span>

                        {/* Value preview or inline edit */}
                        {isEditing ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4, flex: 1 }} onClick={e => e.stopPropagation()}>
                            <input
                              autoFocus
                              value={editingVar.value}
                              onChange={e => setEditingVar({ name: varName, value: e.target.value })}
                              onKeyDown={e => {
                                if (e.key === 'Enter') handleSaveVarEdit(varName)
                                if (e.key === 'Escape') setEditingVar(null)
                              }}
                              style={{
                                flex: 1,
                                background: 'var(--bg-input)',
                                border: '1px solid var(--accent)',
                                color: 'var(--text-base)',
                                fontSize: 10,
                                fontFamily: "'JetBrains Mono', monospace",
                                padding: '1px 4px',
                                borderRadius: 3
                              }}
                            />
                            <button
                              onClick={() => handleSaveVarEdit(varName)}
                              style={{ background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 3, padding: '1px 5px', fontSize: 10, cursor: 'pointer' }}
                            >
                              ✓
                            </button>
                            <button
                              onClick={() => setEditingVar(null)}
                              style={{ background: 'transparent', color: 'var(--text-muted)', border: 'none', cursor: 'pointer', fontSize: 10 }}
                            >
                              ✕
                            </button>
                          </div>
                        ) : (
                          <div style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: "'JetBrains Mono', monospace" }}>
                            {renderValuePreview(variable.value, variable.type)}
                          </div>
                        )}

                        {/* Changed indicator */}
                        {variable.changed && (
                          <span style={{ fontSize: 8, fontWeight: 700, background: 'rgba(234, 179, 8, 0.25)', color: '#eab308', padding: '1px 4px', borderRadius: 3 }}>
                            NEW
                          </span>
                        )}

                        {/* Copy button on hover */}
                        <button
                          onClick={(e) => handleCopyVar(varName, variable.value, e)}
                          title="Copy Value"
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: copiedKey === varName ? 'var(--green)' : 'var(--text-dim)',
                            cursor: 'pointer',
                            padding: 2,
                            opacity: 0.6
                          }}
                        >
                          {copiedKey === varName ? '✓' : '⧉'}
                        </button>
                      </div>

                      {/* Expanded array/obj properties */}
                      {isArrayOrObj && isExpanded && (
                        <div style={{ paddingLeft: 34, background: 'rgba(0,0,0,0.1)', fontSize: 10, fontFamily: "'JetBrains Mono', monospace" }}>
                          {Array.isArray(variable.value) ? (
                            variable.value.map((item, idx) => (
                              <div key={idx} style={{ padding: '2px 0', display: 'flex', gap: 6 }}>
                                <span style={{ color: 'var(--text-dim)' }}>[{idx}]:</span>
                                {renderValuePreview(item, typeof item)}
                              </div>
                            ))
                          ) : (
                            Object.entries(variable.value).map(([k, v]) => (
                              <div key={k} style={{ padding: '2px 0', display: 'flex', gap: 6 }}>
                                <span style={{ color: 'var(--text-dim)' }}>{k}:</span>
                                {renderValuePreview(v, typeof v)}
                              </div>
                            ))
                          )}
                        </div>
                      )}
                    </div>
                  )
                })
              )}

              {/* Globals sub-group */}
              <div style={{ padding: '6px 12px 2px', fontSize: 10, fontWeight: 700, color: 'var(--text-dim)', letterSpacing: '0.04em' }}>
                ▾ GLOBALS
              </div>
              <div style={{ padding: '2px 10px 2px 20px', display: 'flex', gap: 6, fontFamily: "'JetBrains Mono', monospace" }}>
                <span style={{ color: 'var(--text-muted)' }}>stdin:</span>
                <span style={{ color: '#4ade80' }}>&quot;{stdin ? stdin.slice(0, 30) : '(empty)'}&quot;</span>
              </div>
            </div>
          )}
        </div>

        {/* ── 2. WATCH ───────────────────────────────────────────────── */}
        <div>
          <div className="debug-accordion-header" onClick={() => toggleSection('watch')}>
            <span style={{ transform: openSections.watch ? 'rotate(0deg)' : 'rotate(-90deg)', transition: 'transform 0.15s ease', display: 'flex' }}>
              <ChevronDown size={11} />
            </span>
            <span>Watch</span>
            <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6 }} onClick={e => e.stopPropagation()}>
              <button
                onClick={() => setIsAddingWatch(true)}
                title="Add Expression"
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 2 }}
              >
                +
              </button>
              <button
                onClick={() => setWatches([])}
                title="Remove All Expressions"
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 2 }}
              >
                <TrashIcon size={10} />
              </button>
            </div>
          </div>

          {openSections.watch && (
            <div style={{ padding: '4px 0', borderBottom: '1px solid var(--border)' }}>
              {isAddingWatch && (
                <form onSubmit={handleAddWatch} style={{ padding: '4px 12px', display: 'flex', gap: 4 }}>
                  <input
                    autoFocus
                    value={newWatchExpr}
                    onChange={e => setNewWatchExpr(e.target.value)}
                    placeholder="Expression to watch..."
                    style={{
                      flex: 1,
                      background: 'var(--bg-input)',
                      border: '1px solid var(--accent)',
                      color: 'var(--text-base)',
                      fontSize: 11,
                      fontFamily: "'JetBrains Mono', monospace",
                      padding: '3px 6px',
                      borderRadius: 4
                    }}
                  />
                  <button type="submit" style={{ background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 4, padding: '2px 8px', fontSize: 10, cursor: 'pointer' }}>
                    Add
                  </button>
                  <button type="button" onClick={() => setIsAddingWatch(false)} style={{ background: 'transparent', color: 'var(--text-muted)', border: 'none', cursor: 'pointer', fontSize: 10 }}>
                    ✕
                  </button>
                </form>
              )}

              {watches.length === 0 && !isAddingWatch ? (
                <div style={{ padding: '6px 20px', color: 'var(--text-dim)', fontStyle: 'italic', fontSize: 11 }}>
                  No watch expressions. Click &apos;+&apos; to watch variables or math.
                </div>
              ) : (
                watches.map(w => (
                  <div
                    key={w.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '3px 12px 3px 20px',
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: 11
                    }}
                  >
                    <span style={{ color: 'var(--text-base)', fontWeight: 600 }}>{w.expression}:</span>
                    <span style={{ color: w.value === 'undefined' ? 'var(--text-dim)' : '#38bdf8', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {w.value}
                    </span>
                    <button
                      onClick={(e) => handleRemoveWatch(w.id, e)}
                      title="Remove expression"
                      style={{ background: 'transparent', border: 'none', color: 'var(--text-dim)', cursor: 'pointer', padding: 2 }}
                    >
                      ✕
                    </button>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* ── 3. CALL STACK ──────────────────────────────────────────── */}
        <div>
          <div className="debug-accordion-header" onClick={() => toggleSection('callstack')}>
            <span style={{ transform: openSections.callstack ? 'rotate(0deg)' : 'rotate(-90deg)', transition: 'transform 0.15s ease', display: 'flex' }}>
              <ChevronDown size={11} />
            </span>
            <span>Call Stack</span>
            <span style={{ marginLeft: 'auto', fontSize: 10, color: 'var(--text-dim)', fontWeight: 400 }}>
              {isDebugging ? 'Paused' : 'Not running'}
            </span>
          </div>

          {openSections.callstack && (
            <div style={{ padding: '4px 0', borderBottom: '1px solid var(--border)' }}>
              {!isDebugging ? (
                <div style={{ padding: '6px 20px', color: 'var(--text-dim)', fontStyle: 'italic', fontSize: 11 }}>
                  Not paused on any stack frame
                </div>
              ) : (
                <div>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 7,
                      padding: '4px 12px 4px 20px',
                      background: 'rgba(234, 179, 8, 0.1)',
                      cursor: 'pointer'
                    }}
                    onClick={() => {
                      if (currentStep) {
                        onJumpToLine?.(currentStep.line)
                        onActiveLineChange?.(currentStep.line)
                      }
                    }}
                  >
                    <span style={{ color: '#eab308', fontSize: 10 }}>▶</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, color: 'var(--text-base)', fontSize: 11 }}>
                        main()
                      </div>
                      <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                        {fileName} : Line {currentStep?.line ?? 1}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── 4. BREAKPOINTS ─────────────────────────────────────────── */}
        <div>
          <div className="debug-accordion-header" onClick={() => toggleSection('breakpoints')}>
            <span style={{ transform: openSections.breakpoints ? 'rotate(0deg)' : 'rotate(-90deg)', transition: 'transform 0.15s ease', display: 'flex' }}>
              <ChevronDown size={11} />
            </span>
            <span>Breakpoints</span>
            <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6 }} onClick={e => e.stopPropagation()}>
              <button
                onClick={() => setIsAddingBp(true)}
                title="Add Line Breakpoint"
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 2 }}
              >
                +
              </button>
              <button
                onClick={onClearBreakpoints}
                title="Remove All Breakpoints"
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 2 }}
              >
                <TrashIcon size={10} />
              </button>
            </div>
          </div>

          {openSections.breakpoints && (
            <div style={{ padding: '4px 0', borderBottom: '1px solid var(--border)' }}>
              {isAddingBp && (
                <form onSubmit={handleAddBpSubmit} style={{ padding: '4px 12px', display: 'flex', gap: 4 }}>
                  <input
                    autoFocus
                    type="number"
                    value={newBpLine}
                    onChange={e => setNewBpLine(e.target.value)}
                    placeholder="Line number..."
                    style={{
                      flex: 1,
                      background: 'var(--bg-input)',
                      border: '1px solid var(--accent)',
                      color: 'var(--text-base)',
                      fontSize: 11,
                      padding: '3px 6px',
                      borderRadius: 4
                    }}
                  />
                  <button type="submit" style={{ background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 4, padding: '2px 8px', fontSize: 10, cursor: 'pointer' }}>
                    Set
                  </button>
                  <button type="button" onClick={() => setIsAddingBp(false)} style={{ background: 'transparent', color: 'var(--text-muted)', border: 'none', cursor: 'pointer', fontSize: 10 }}>
                    ✕
                  </button>
                </form>
              )}

              {breakpoints.length === 0 && !isAddingBp ? (
                <div style={{ padding: '6px 20px', color: 'var(--text-dim)', fontStyle: 'italic', fontSize: 11 }}>
                  No breakpoints set. Click the editor gutter to toggle breakpoints.
                </div>
              ) : (
                breakpoints.map(line => {
                  const isDisabled = disabledBreakpoints.includes(line)
                  const lineCode = codeLines[line - 1]?.trim() || ''

                  return (
                    <div
                      key={line}
                      onClick={() => onJumpToLine?.(line)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        padding: '4px 12px 4px 16px',
                        cursor: 'pointer',
                        opacity: isDisabled ? 0.45 : 1,
                        transition: 'background 0.1s'
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                      title={`Jump to line ${line}`}
                    >
                      {/* Enable/disable checkbox */}
                      <input
                        type="checkbox"
                        checked={!isDisabled}
                        onChange={(e) => toggleBpEnabled(line, e as any)}
                        onClick={e => e.stopPropagation()}
                        style={{ cursor: 'pointer', accentColor: 'var(--red)' }}
                      />

                      {/* Red circle dot */}
                      <span style={{ width: 8, height: 8, borderRadius: '50%', background: isDisabled ? 'var(--text-dim)' : 'var(--red)', flexShrink: 0 }} />

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ fontWeight: 600, color: 'var(--text-base)', fontSize: 11 }}>
                            {fileName}
                          </span>
                          <span style={{ color: 'var(--text-dim)', fontSize: 10 }}>
                            Line {line}
                          </span>
                        </div>
                        {lineCode && (
                          <div style={{ fontSize: 10, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: "'JetBrains Mono', monospace" }}>
                            {lineCode}
                          </div>
                        )}
                      </div>

                      {/* Remove breakpoint */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          onToggleBreakpoint(line)
                        }}
                        title="Remove Breakpoint"
                        style={{ background: 'transparent', border: 'none', color: 'var(--red)', cursor: 'pointer', padding: 2, opacity: 0.7 }}
                      >
                        ✕
                      </button>
                    </div>
                  )
                })
              )}
            </div>
          )}
        </div>

        {/* ── 5. AI BUG DIAGNOSTICS (CodeForge Exclusive) ─────────────── */}
        <div>
          <div className="debug-accordion-header" onClick={() => toggleSection('ai')}>
            <span style={{ transform: openSections.ai ? 'rotate(0deg)' : 'rotate(-90deg)', transition: 'transform 0.15s ease', display: 'flex' }}>
              <ChevronDown size={11} />
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <SparklesIcon size={12} style={{ color: 'var(--accent)' }} /> Bug Diagnostics
            </span>
            <span style={{ marginLeft: 'auto', fontSize: 10, color: 'var(--text-dim)', fontWeight: 400 }}>
              {bugInsights.length > 0 ? `${bugInsights.length} detected` : ''}
            </span>
          </div>

          {openSections.ai && (
            <div style={{ padding: '8px 12px', borderBottom: '1px solid var(--border)' }}>
              <button
                onClick={handleScanBugs}
                disabled={isScanningBugs}
                className="btn btn-secondary"
                style={{ width: '100%', padding: '5px 10px', fontSize: 11, justifyContent: 'center', gap: 6, marginBottom: 8 }}
              >
                {isScanningBugs ? 'Analyzing code...' : '⚡ Scan Code for Bugs'}
              </button>

              {bugInsights.length === 0 ? (
                <div style={{ color: 'var(--text-dim)', fontStyle: 'italic', fontSize: 10, textAlign: 'center' }}>
                  No known bugs detected yet. Run scan to inspect syntax and runtime issues.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {bugInsights.map((bug, i) => (
                    <div
                      key={i}
                      style={{
                        padding: '6px 8px',
                        borderRadius: 6,
                        background: bug.severity === 'error' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(234, 179, 8, 0.1)',
                        border: `1px solid ${bug.severity === 'error' ? 'rgba(239, 68, 68, 0.3)' : 'rgba(234, 179, 8, 0.3)'}`
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 4 }}>
                        <span style={{ fontWeight: 700, color: bug.severity === 'error' ? 'var(--red)' : '#eab308' }}>
                          {bug.title}
                        </span>
                        {bug.line && (
                          <button
                            onClick={() => onJumpToLine?.(bug.line!)}
                            style={{ background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', fontSize: 10 }}
                          >
                            Line {bug.line}
                          </button>
                        )}
                      </div>
                      <div style={{ fontSize: 10, color: 'var(--text-base)', marginTop: 2 }}>
                        {bug.description}
                      </div>
                      {bug.suggestion && (
                        <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 3, fontStyle: 'italic' }}>
                          Fix: {bug.suggestion}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

      </div>
    </div>
  )
}

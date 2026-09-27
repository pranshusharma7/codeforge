import React from 'react'
import {
  PlayIcon,
  PauseIcon,
  StopIcon,
  StepOverIcon,
  StepIntoIcon,
  StepOutIcon,
  RestartIcon
} from './icons'

interface Props {
  isDebugging: boolean
  currentLine: number | null
  currentStep: number
  totalSteps: number
  onContinue: () => void
  onStepOver: () => void
  onStepInto: () => void
  onStepOut: () => void
  onRestart: () => void
  onStop: () => void
  isAutoPlaying: boolean
  onToggleAutoPlay: () => void
  playSpeed: number
  onChangePlaySpeed: (speed: number) => void
}

export default function FloatingDebugBar({
  isDebugging,
  currentLine,
  currentStep,
  totalSteps,
  onContinue,
  onStepOver,
  onStepInto,
  onStepOut,
  onRestart,
  onStop,
  isAutoPlaying,
  onToggleAutoPlay,
  playSpeed,
  onChangePlaySpeed
}: Props) {
  if (!isDebugging) return null

  return (
    <div
      className="floating-debug-bar"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 4
      }}
      role="toolbar"
      aria-label="Debug controls"
    >
      {/* Drag handle */}
      <span
        style={{
          cursor: 'grab',
          color: 'var(--text-dim)',
          fontSize: 12,
          padding: '0 4px',
          display: 'flex',
          alignItems: 'center'
        }}
        title="Debug Toolbar"
      >
        ⠿
      </span>

      {/* Paused line badge */}
      {currentLine !== null && (
        <div
          style={{
            fontSize: 10,
            fontWeight: 700,
            fontFamily: "'JetBrains Mono', monospace",
            background: 'rgba(234, 179, 8, 0.18)',
            color: '#eab308',
            border: '1px solid rgba(234, 179, 8, 0.4)',
            borderRadius: 4,
            padding: '2px 6px',
            marginRight: 4,
            whiteSpace: 'nowrap'
          }}
          title={`Paused at line ${currentLine} (Step ${currentStep + 1} of ${totalSteps})`}
        >
          Ln {currentLine}
        </div>
      )}

      {/* Continue / Pause (F5) */}
      <button
        onClick={onContinue}
        className="debug-tool-btn continue"
        title="Continue (F5) - Run to next breakpoint"
        aria-label="Continue"
      >
        <PlayIcon size={14} style={{ color: '#22c55e' }} />
      </button>

      {/* Step Over (F10) */}
      <button
        onClick={onStepOver}
        className="debug-tool-btn"
        title="Step Over (F10)"
        aria-label="Step Over"
      >
        <StepOverIcon size={15} style={{ color: 'var(--accent)' }} />
      </button>

      {/* Step Into (F11) */}
      <button
        onClick={onStepInto}
        className="debug-tool-btn"
        title="Step Into (F11)"
        aria-label="Step Into"
      >
        <StepIntoIcon size={15} style={{ color: 'var(--accent)' }} />
      </button>

      {/* Step Out (Shift+F11) */}
      <button
        onClick={onStepOut}
        className="debug-tool-btn"
        title="Step Out (Shift+F11)"
        aria-label="Step Out"
      >
        <StepOutIcon size={15} style={{ color: 'var(--accent)' }} />
      </button>

      {/* Restart (Ctrl+Shift+F5) */}
      <button
        onClick={onRestart}
        className="debug-tool-btn restart"
        title="Restart Debugging (Ctrl+Shift+F5)"
        aria-label="Restart"
      >
        <RestartIcon size={14} style={{ color: '#38bdf8' }} />
      </button>

      {/* Stop (Shift+F5) */}
      <button
        onClick={onStop}
        className="debug-tool-btn stop"
        title="Stop Debugging (Shift+F5)"
        aria-label="Stop"
      >
        <StopIcon size={13} style={{ color: '#f85149' }} />
      </button>

      {/* Divider */}
      <div style={{ width: 1, height: 16, background: 'var(--border)', margin: '0 3px' }} />

      {/* Auto-step Play / Pause */}
      <button
        onClick={onToggleAutoPlay}
        className="debug-tool-btn"
        title={isAutoPlaying ? 'Pause Auto-Step' : 'Auto-Step Execution'}
        style={{
          background: isAutoPlaying ? 'var(--accent-subtle)' : 'transparent',
          color: isAutoPlaying ? 'var(--accent)' : 'var(--text-muted)'
        }}
      >
        {isAutoPlaying ? <PauseIcon size={12} /> : <span style={{ fontSize: 11 }}>⏯</span>}
      </button>

      {/* Speed Selector */}
      <select
        value={playSpeed}
        onChange={e => onChangePlaySpeed(Number(e.target.value))}
        style={{
          background: 'var(--bg-input)',
          color: 'var(--text-muted)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 4,
          fontSize: 10,
          padding: '2px 4px',
          outline: 'none',
          cursor: 'pointer'
        }}
        title="Auto-step execution speed"
      >
        <option value={400}>Fast (0.4s)</option>
        <option value={900}>Normal (0.9s)</option>
        <option value={1800}>Slow (1.8s)</option>
      </select>
    </div>
  )
}

// Minimal inline SVG icon set
import type { CSSProperties } from 'react'

interface IconProps { size?: number; style?: CSSProperties; className?: string }
const I = ({ d, size = 16, style, className }: IconProps & { d: string }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={style} className={className}>
    <path d={d} />
  </svg>
)

export const PlayIcon    = (p: IconProps) => <I {...p} d="M4 2.5l9 5.5-9 5.5V2.5z" />
export const StopIcon    = (p: IconProps) => <I {...p} d="M3 3h10v10H3z" />
export const SaveIcon    = (p: IconProps) => <I {...p} d="M3 2h7l3 3v9H3V2zM9 2v4H6M5 10h6M5 12.5h4" />
export const DownloadIcon= (p: IconProps) => <I {...p} d="M8 2v8m-4 0l4 4 4-4M2 14h12" />
export const ShareIcon   = (p: IconProps) => <I {...p} d="M11 1.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5zm-6 4a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5zm6 4a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5zM8.5 4.5L5 7m0 2l3.5 2.5" />
export const GithubIcon  = (p: IconProps) => <svg width={p.size??16} height={p.size??16} viewBox="0 0 16 16" fill="currentColor" style={p.style} className={p.className}><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0 0 16 8c0-4.42-3.58-8-8-8z"/></svg>
export const FilesIcon   = (p: IconProps) => <I {...p} d="M3 2h6l4 4v8H3V2zM9 2v4h4M5 8h6M5 11h4" />
export const HistoryIcon = (p: IconProps) => <I {...p} d="M1 8a7 7 0 1 0 14 0A7 7 0 0 0 1 8zm7-4v4l3 2" />
export const SettingsIcon= (p: IconProps) => <I {...p} d="M8 10a2 2 0 1 0 0-4 2 2 0 0 0 0 4zm5.3-1.7a5.4 5.4 0 0 0 .1-.3l1.5-.9-1.5-2.6-1.5.9a5.4 5.4 0 0 0-1-.6l-.2-1.8H7.7l-.2 1.8a5.4 5.4 0 0 0-1 .6l-1.5-.9-1.5 2.6 1.5.9a5.4 5.4 0 0 0 0 .6 5.4 5.4 0 0 0 0 .6l-1.5.9 1.5 2.6 1.5-.9a5.4 5.4 0 0 0 1 .6l.2 1.8h3l.2-1.8a5.4 5.4 0 0 0 1-.6l1.5.9 1.5-2.6-1.5-.9a5.4 5.4 0 0 0 .1-.3" />
export const AIIcon      = (p: IconProps) => <I {...p} d="M9.5 2a4 4 0 0 1 0 8H8l-3 3v-3H4a4 4 0 0 1 0-8h5.5z" />
export const XIcon       = (p: IconProps) => <I {...p} d="M3 3l10 10M13 3 3 13" />
export const PlusIcon    = (p: IconProps) => <I {...p} d="M8 2v12M2 8h12" />
export const CopyIcon    = (p: IconProps) => <I {...p} d="M5 3H3a1 1 0 0 0-1 1v9a1 1 0 0 0 1 1h7a1 1 0 0 0 1-1v-2M6 1h7a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1z" />
export const CheckIcon   = (p: IconProps) => <I {...p} d="M2 8l4 4 8-8" />
export const SunIcon     = (p: IconProps) => <I {...p} d="M8 1v2m0 10v2M1 8h2m10 0h2M3.5 3.5l1.4 1.4m6.2 6.2 1.4 1.4M3.5 12.5l1.4-1.4m6.2-6.2 1.4-1.4M8 5a3 3 0 1 0 0 6 3 3 0 0 0 0-6z" />
export const MoonIcon    = (p: IconProps) => <I {...p} d="M12 3a6 6 0 0 1-9 9 6 6 0 0 0 9-9z" />
export const SendIcon    = (p: IconProps) => <I {...p} d="M2 8l12-6-6 12V8H2zM8 8l6-6" />
export const BugIcon     = (p: IconProps) => <I {...p} d="M8 6v4m0 2v1M5 3.5A3 3 0 0 1 11 3.5M3 8H1m14 0h-2M4 5l-2-1m12 1 2-1M4 11l-2 1m12-1 2 1M6 13a2 2 0 0 0 4 0" />
export const ReviewIcon  = (p: IconProps) => <I {...p} d="M2 4h12v8H2zM5 7h6M5 9.5h4" />
export const SpinnerIcon = ({ size = 16, className }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none" className={`spin ${className ?? ''}`}>
    <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.5" strokeOpacity="0.25"/>
    <path d="M14 8A6 6 0 0 0 8 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
)
export const ChevronDown = (p: IconProps) => <I {...p} d="M3 5l5 5 5-5" />
export const WrapIcon    = (p: IconProps) => <I {...p} d="M2 4h12M2 8h8a3 3 0 0 1 0 6H8l2-2m-2 2 2 2" />
export const TrashIcon   = (p: IconProps) => <I {...p} d="M2 4h12m-9 0V3h6v1M5 4v9a1 1 0 0 0 1 1h4a1 1 0 0 0 1-1V4" />
export const GitBranchIcon = (p: IconProps) => <I {...p} d="M4 3a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm8 6a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM4 7v2a3 3 0 0 0 3 3h1m4-3v-1" />
export const GitCommitIcon = (p: IconProps) => <I {...p} d="M8 5a3 3 0 1 0 0 6 3 3 0 0 0 0-6zM1 8h4m6 0h4" />
export const RepoIcon      = (p: IconProps) => <I {...p} d="M3 2h7l3 3v9a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1zm0 3h7" />
export const ExternalLinkIcon = (p: IconProps) => <I {...p} d="M12 9v4a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h4m4-2h4v4m-8.5 4.5L15 2" />
export const RefreshIcon   = (p: IconProps) => <I {...p} d="M1 8a7 7 0 0 1 12-4.9L15 5m-2-4v4h4M15 8a7 7 0 0 1-12 4.9L1 11m2 4v-4H-1" />
export const FolderIcon    = (p: IconProps) => <I {...p} d="M2 3h4l2 2h6v8H2V3z" />
export const PaletteIcon   = (p: IconProps) => <I {...p} d="M8 1a7 7 0 1 0 7 7c0-1.5-1-2-2-2h-1.5a1.5 1.5 0 0 1-1.5-1.5V4a3 3 0 0 0-3-3zm-3.5 6a1 1 0 1 1 0-2 1 1 0 0 1 0 2zm3-2a1 1 0 1 1 0-2 1 1 0 0 1 0 2zm4 2a1 1 0 1 1 0-2 1 1 0 0 1 0 2zm-5 4a1 1 0 1 1 0-2 1 1 0 0 1 0 2z" />
export const LeetCodeIcon  = (p: IconProps) => <svg width={p.size??16} height={p.size??16} viewBox="0 0 24 24" fill="currentColor" style={p.style} className={p.className}><path d="M13.483 0a1.374 1.374 0 0 0-.961.438L7.116 6.226l-3.854 4.126a5.266 5.266 0 0 0-1.209 2.104 5.35 5.35 0 0 0-.125.513 5.527 5.527 0 0 0 .062 2.362 5.874 5.874 0 0 0 .349 1.017 5.938 5.938 0 0 0 1.271 1.818l4.277 4.193.039.038c2.248 2.165 5.852 2.133 8.063-.074l2.396-2.392c.54-.54.54-1.414.003-1.955a1.378 1.378 0 0 0-1.951-.003l-2.396 2.392a3.021 3.021 0 0 1-4.205.038l-.02-.019-4.276-4.193c-.652-.64-.972-1.469-.948-2.263a2.68 2.68 0 0 1 .666-1.607L9.36 8.29l4.89-5.111a1.378 1.378 0 0 0-.767-2.179z"/></svg>
export const KeyIcon       = (p: IconProps) => <I {...p} d="M10 2a4 4 0 0 0-4 4c0 .4.07.8.2 1.2L2 11.4V14h2.6l1-1h1.5l1-1h.5l.6-.6A4 4 0 1 0 10 2zm1 3a1 1 0 1 1 0-2 1 1 0 0 1 0 2z" />

export const FilePlusIcon = (p: IconProps) => (
  <svg width={p.size??16} height={p.size??16} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" style={p.style} className={p.className}>
    <path d="M9 2H4a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V6L9 2z"/>
    <path d="M9 2v4h4"/>
    <path d="M8 8v4M6 10h4"/>
  </svg>
)

export const FolderPlusIcon = (p: IconProps) => (
  <svg width={p.size??16} height={p.size??16} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" style={p.style} className={p.className}>
    <path d="M2 3h4l2 2h6v8a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V3z"/>
    <path d="M8 8v4M6 10h4"/>
  </svg>
)

export const FileOpenIcon = (p: IconProps) => (
  <svg width={p.size??16} height={p.size??16} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" style={p.style} className={p.className}>
    <path d="M3 2h6l4 4v8a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1z"/>
    <path d="M9 2v4h4"/>
    <path d="M8 12V7M6 9l2-2 2 2"/>
  </svg>
)

export const FolderOpenIcon = (p: IconProps) => (
  <svg width={p.size??16} height={p.size??16} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" style={p.style} className={p.className}>
    <path d="M2 4h4l1.5 2H14a1 1 0 0 1 1 1v1H1V5a1 1 0 0 1 1-1z"/>
    <path d="M1 8h14l-1.5 6H2.5L1 8z"/>
  </svg>
)

export const PauseIcon = (p: IconProps) => <I {...p} d="M4 3h2.5v10H4V3zm5.5 0H12v10H9.5V3z" />
export const SparklesIcon = (p: IconProps) => <I {...p} d="M8 1.5l1.5 3.5 3.5 1.5-3.5 1.5L8 11.5 6.5 8 3 6.5l3.5-1.5L8 1.5zm4.5 8l.75 1.75 1.75.75-1.75.75-.75 1.75-.75-1.75-1.75-.75 1.75-.75.75-1.75z" />

export const StepOverIcon = (p: IconProps) => (
  <svg width={p.size??16} height={p.size??16} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={p.style} className={p.className}>
    <path d="M3 5.5c0-1.657 2.239-3 5-3s5 1.343 5 3v4.5" />
    <path d="M10.5 7.5L13 10l2.5-2.5" />
    <circle cx="8" cy="12" r="1.5" fill="currentColor" stroke="none" />
  </svg>
)

export const StepIntoIcon = (p: IconProps) => (
  <svg width={p.size??16} height={p.size??16} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={p.style} className={p.className}>
    <path d="M8 2.5v7.5" />
    <path d="M5.5 7.5L8 10l2.5-2.5" />
    <circle cx="8" cy="13" r="1.5" fill="currentColor" stroke="none" />
  </svg>
)

export const StepOutIcon = (p: IconProps) => (
  <svg width={p.size??16} height={p.size??16} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={p.style} className={p.className}>
    <path d="M8 9.5V2" />
    <path d="M5.5 4.5L8 2l2.5 2.5" />
    <circle cx="8" cy="13" r="1.5" fill="currentColor" stroke="none" />
  </svg>
)

export const RestartIcon = (p: IconProps) => (
  <svg width={p.size??16} height={p.size??16} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={p.style} className={p.className}>
    <path d="M13.5 8a5.5 5.5 0 1 1-1.6-3.9L14 6.5" />
    <path d="M14 2.5v4h-4" />
  </svg>
)

export const CollapseAllIcon = (p: IconProps) => (
  <svg width={p.size??16} height={p.size??16} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" style={p.style} className={p.className}>
    <path d="M2 4h12M4 8h8M6 12h4" />
  </svg>
)

export const TerminalIcon = (p: IconProps) => (
  <svg width={p.size??16} height={p.size??16} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" style={p.style} className={p.className}>
    <rect x="2" y="3" width="12" height="10" rx="1.5" />
    <path d="M4.5 6.5l2.5 1.5-2.5 1.5M9 10h2.5" />
  </svg>
)

export const TrophyIcon = (p: IconProps) => (
  <svg width={p.size??16} height={p.size??16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={p.style} className={p.className}>
    <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6M18 9h1.5a2.5 2.5 0 0 0 0-5H18M4 22h16M10 14.66V17c0 .55-.45 1-1 1H8v4h8v-4h-1c-.55 0-1-.45-1-1v-2.34M18 2H6v7a6 6 0 0 0 12 0V2z" />
  </svg>
)

export const ShieldIcon = (p: IconProps) => (
  <svg width={p.size??16} height={p.size??16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={p.style} className={p.className}>
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    <path d="M9 12l2 2 4-4" />
  </svg>
)

export const CameraIcon = (p: IconProps) => (
  <svg width={p.size??16} height={p.size??16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={p.style} className={p.className}>
    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
    <circle cx="12" cy="13" r="4" />
  </svg>
)

export const MicIcon = (p: IconProps) => (
  <svg width={p.size??16} height={p.size??16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={p.style} className={p.className}>
    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
    <path d="M19 10v2a7 7 0 0 1-14 0v-2M12 19v4M8 23h8" />
  </svg>
)

export const ScreenIcon = (p: IconProps) => (
  <svg width={p.size??16} height={p.size??16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={p.style} className={p.className}>
    <rect x="2" y="3" width="20" height="14" rx="2" />
    <path d="M8 21h8M12 17v4" />
  </svg>
)

export const AlertTriangleIcon = (p: IconProps) => (
  <svg width={p.size??16} height={p.size??16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={p.style} className={p.className}>
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0zM12 9v4M12 17h.01" />
  </svg>
)

export const LockIcon = (p: IconProps) => (
  <svg width={p.size??16} height={p.size??16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={p.style} className={p.className}>
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
)

export const UserCheckIcon = (p: IconProps) => (
  <svg width={p.size??16} height={p.size??16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={p.style} className={p.className}>
    <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="8.5" cy="7" r="4" />
    <polyline points="17 11 19 13 23 9" />
  </svg>
)

export const ClockIcon = (p: IconProps) => (
  <svg width={p.size??16} height={p.size??16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={p.style} className={p.className}>
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
)

export const EyeIcon = (p: IconProps) => (
  <svg width={p.size??16} height={p.size??16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={p.style} className={p.className}>
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
)




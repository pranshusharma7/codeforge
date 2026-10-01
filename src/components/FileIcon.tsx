import React from 'react'

interface FileIconProps {
  fileName?: string
  name?: string
  size?: number
  className?: string
  style?: React.CSSProperties
}

/**
 * High-fidelity VS Code / Seti style Language File Icons
 * Renders authentic, pixel-perfect icons for 25+ language extensions.
 */
export default function FileIcon({ fileName, name, size = 16, className, style }: FileIconProps) {
  const targetName = fileName || name || ''
  const lower = targetName.toLowerCase().trim()
  const ext = lower.includes('.') ? lower.substring(lower.lastIndexOf('.') + 1) : lower

  // Exact file name matching
  if (lower === 'dockerfile' || lower.startsWith('dockerfile.')) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style} className={className}>
        <rect width="24" height="24" rx="4" fill="#0db7ed" fillOpacity="0.2"/>
        <path d="M4 14c.5-1.5 2-2 3.5-2 .5 0 1 .1 1.5.3.8-.8 1.8-1.3 3-1.3 1.5 0 2.8.8 3.5 2 1.5 0 2.5 1 3 2.5.5.3 1.5 1 1.5 2.5 0 2-2 3-5 3H7c-3 0-5-1.5-5-4 0-.8.4-1.5 1-2.1.3-.4.6-.7 1-.9z" fill="#0db7ed"/>
        <rect x="7" y="8" width="2" height="2" rx="0.5" fill="#0db7ed"/>
        <rect x="10" y="8" width="2" height="2" rx="0.5" fill="#0db7ed"/>
        <rect x="10" y="5.5" width="2" height="2" rx="0.5" fill="#0db7ed"/>
        <rect x="13" y="8" width="2" height="2" rx="0.5" fill="#0db7ed"/>
      </svg>
    )
  }

  if (lower === '.gitignore' || lower === '.gitattributes' || lower.startsWith('.git')) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style} className={className}>
        <rect width="24" height="24" rx="4" fill="#f05032" fillOpacity="0.18"/>
        <path d="M19 11.5L12.5 5a1.5 1.5 0 0 0-2.1 0L8.6 6.8l2.6 2.6a1.8 1.8 0 0 1 2.3 2.3l2.5 2.5a1.8 1.8 0 1 1-1.1 1.1l-2.4-2.4v3.3a1.8 1.8 0 1 1-1.5 0V11a1.8 1.8 0 0 1-.9-2.3L7.5 6.1 5 8.6a1.5 1.5 0 0 0 0 2.1l6.5 6.5a1.5 1.5 0 0 0 2.1 0l5.4-5.4a1.5 1.5 0 0 0 0-2.1z" fill="#f05032"/>
      </svg>
    )
  }

  // React JSX / TSX
  if (ext === 'jsx' || ext === 'tsx') {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style} className={className}>
        <circle cx="12" cy="12" r="2.2" fill="#00d8ff"/>
        <ellipse cx="12" cy="12" rx="10" ry="3.8" stroke="#00d8ff" strokeWidth="1.5" transform="rotate(30 12 12)"/>
        <ellipse cx="12" cy="12" rx="10" ry="3.8" stroke="#00d8ff" strokeWidth="1.5" transform="rotate(90 12 12)"/>
        <ellipse cx="12" cy="12" rx="10" ry="3.8" stroke="#00d8ff" strokeWidth="1.5" transform="rotate(150 12 12)"/>
      </svg>
    )
  }

  // Python
  if (ext === 'py' || ext === 'pyw' || ext === 'ipynb') {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style} className={className}>
        <path d="M11.9 2c-3.8 0-3.6 1.6-3.6 1.6l.01 1.7h3.7v.5H6.3S4 5.5 4 9.4c0 3.8 2 3.7 2 3.7h1.2v-1.8s-.1-2 2-2h3.5s1.9.03 1.9-1.9V4c0-2-2.7-2-2.7-2zm-1.8 1.2c.4 0 .7.3.7.7s-.3.7-.7.7-.7-.3-.7-.7.3-.7.7-.7z" fill="#387eb8"/>
        <path d="M12.1 22c3.8 0 3.6-1.6 3.6-1.6l-.01-1.7h-3.7v-.5h5.7s2.3.3 2.3-3.6c0-3.8-2-3.7-2-3.7h-1.2v1.8s.1 2-2 2h-3.5s-1.9-.03-1.9 1.9V20c0 2 2.7 2 2.7 2zm1.8-1.2c-.4 0-.7-.3-.7-.7s.3-.7.7-.7.7.3.7.7-.3.7-.7.7z" fill="#ffe052"/>
      </svg>
    )
  }

  // JavaScript
  if (ext === 'js' || ext === 'mjs' || ext === 'cjs') {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style} className={className}>
        <rect width="24" height="24" rx="4" fill="#f7df1e"/>
        <path d="M7 17.5c1 .6 2.2.8 3 .2.9-.6.8-2 .8-3.4v-5h-2v4.8c0 .8 0 1.5-.4 1.8-.4.3-1 .2-1.4 0v1.6zm8.2-.1c1.2.7 2.6.8 3.6.3 1-.6 1.2-1.8 1.2-2.8 0-2.3-2-2.8-3.1-3.3-.8-.4-1.3-.7-1.3-1.3 0-.6.4-1.1 1.2-1.1.7 0 1.5.3 2 .7l.8-1.5c-.7-.5-1.7-.8-2.8-.8-1.7 0-2.9 1-2.9 2.6 0 1.9 1.5 2.5 2.8 3 .9.4 1.5.7 1.5 1.5 0 .8-.6 1.3-1.5 1.3-.8 0-1.8-.3-2.5-.9l-1 1.4z" fill="#000000"/>
      </svg>
    )
  }

  // TypeScript
  if (ext === 'ts' || ext === 'mts' || ext === 'cts') {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style} className={className}>
        <rect width="24" height="24" rx="4" fill="#3178c6"/>
        <path d="M6 10.5h5.5v1.8H9.7V18H7.7v-5.7H6v-1.8zm9.5 7.4c1.2.6 2.6.7 3.5.2.9-.5 1-1.6 1-2.5 0-2.2-1.8-2.6-2.8-3-.7-.3-1.1-.6-1.1-1.1 0-.5.4-1 1.1-1 .7 0 1.4.3 1.8.6l.7-1.4c-.6-.4-1.5-.7-2.5-.7-1.6 0-2.7.9-2.7 2.3 0 1.7 1.4 2.2 2.5 2.7.8.3 1.3.6 1.3 1.3 0 .7-.5 1.2-1.4 1.2-.7 0-1.6-.3-2.2-.8l-.8 1.2z" fill="#ffffff"/>
      </svg>
    )
  }

  // HTML
  if (ext === 'html' || ext === 'htm') {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style} className={className}>
        <path d="M4 3l1.5 16.5L12 22l6.5-2.5L20 3H4z" fill="#e44d26"/>
        <path d="M12 4.5v15.8l5.2-2 1.3-13.8H12z" fill="#f16529"/>
        <path d="M8.5 7.5h7l-.2 2.2H8.7l.3 3.3h6.3l-.4 4.3-2.9 1-2.9-1-.2-2.1H7.4l.4 3.7L12 20.3l4.2-1.4.6-6.4H7.2L6.8 7.5h1.7z" fill="#ffffff"/>
      </svg>
    )
  }

  // CSS / SCSS / LESS
  if (ext === 'css' || ext === 'scss' || ext === 'sass' || ext === 'less') {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style} className={className}>
        <path d="M4 3l1.5 16.5L12 22l6.5-2.5L20 3H4z" fill="#1572b6"/>
        <path d="M12 4.5v15.8l5.2-2 1.3-13.8H12z" fill="#33a9dc"/>
        <path d="M8.5 7.5h7l-.3 2.5H8.7l.2 2.5h6l-.4 4.5-2.5.8-2.5-.8-.1-1.5H7.8l.3 3 3.9 1.3 3.9-1.3.5-5.5.1-1.8.2-3.7H8.5z" fill="#ffffff"/>
      </svg>
    )
  }

  // C++
  if (ext === 'cpp' || ext === 'cc' || ext === 'cxx' || ext === 'hpp') {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style} className={className}>
        <path d="M12 2l8.5 5v10L12 22 3.5 17V7L12 2z" fill="#00599c"/>
        <path d="M11 7.5a4.5 4.5 0 1 0 0 9c1.8 0 3-1 3.5-2.2h-1.9c-.4.6-1 1-1.6 1a3 3 0 1 1 0-6c.7 0 1.2.4 1.6 1h1.9c-.5-1.2-1.7-2.8-3.5-2.8z" fill="#ffffff"/>
        <path d="M15 11h1v-1h1v1h1v1h-1v1h-1v-1h-1v-1zm4.5 0h1v-1h1v1h1v1h-1v1h-1v-1h-1v-1z" fill="#659ad2"/>
      </svg>
    )
  }

  // C
  if (ext === 'c' || ext === 'h') {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style} className={className}>
        <path d="M12 2l8.5 5v10L12 22 3.5 17V7L12 2z" fill="#03599c"/>
        <path d="M12.5 7.5a4.5 4.5 0 1 0 0 9c2 0 3.3-1.1 3.8-2.5h-2c-.4.7-1 1.2-1.8 1.2a3 3 0 1 1 0-6c.8 0 1.4.5 1.8 1.2h2c-.5-1.4-1.8-2.9-3.8-2.9z" fill="#ffffff"/>
      </svg>
    )
  }

  // Java
  if (ext === 'java' || ext === 'class' || ext === 'jar') {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style} className={className}>
        <path d="M8.5 17.5c3.5.3 7-.3 10-1.8-1 1-2.5 1.7-4.5 2-2 .3-4 .2-5.5-.2z" fill="#ea2d2e"/>
        <path d="M7 19.5c4 .4 8 0 11.5-1.5-1.2 1.2-3 2-5.5 2.2-2.3.2-4.5 0-6-.7z" fill="#ea2d2e"/>
        <path d="M12 2c1.5 2-1 3.5-1 5 2-1.5 3-3.5 1-5z" fill="#5382a1"/>
        <path d="M15 3.5c1.8 1.8-1.2 3.2-1 4.5 2.2-1.4 3-3 1-4.5z" fill="#5382a1"/>
        <path d="M9.5 4.5c1.2 1.6-.8 2.8-.8 4 1.8-1.2 2.4-2.5.8-4z" fill="#5382a1"/>
        <path d="M15.5 11c1 .2 1.8.8 1.8 1.6 0 1.2-1.5 1.8-3.3 1.8-1.8 0-3.3-.6-3.3-1.8 0-.8.8-1.4 1.8-1.6 0 0-.5.5-.3.8.3.3 1.2.4 1.8.4.6 0 1.5-.1 1.8-.4.2-.3-.3-.8-.3-.8z" fill="#ea2d2e"/>
      </svg>
    )
  }

  // Rust
  if (ext === 'rs') {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style} className={className}>
        <circle cx="12" cy="12" r="9" stroke="#ce412b" strokeWidth="2"/>
        <path d="M12 4v2m0 12v2m8-8h-2M6 12H4m12.7-5.7l-1.4 1.4m-6.6 6.6l-1.4 1.4m0-9.4l1.4 1.4m6.6 6.6l1.4 1.4" stroke="#ce412b" strokeWidth="2"/>
        <path d="M9 8h3.5a2.5 2.5 0 0 1 2.5 2.5c0 1.2-.8 2.1-1.8 2.4L15.5 16H13l-2-3H10v3H9V8zm1 1.2v2.6h2.5c.8 0 1.5-.6 1.5-1.3s-.7-1.3-1.5-1.3H10z" fill="#ce412b"/>
      </svg>
    )
  }

  // Go
  if (ext === 'go') {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style} className={className}>
        <rect width="24" height="24" rx="4" fill="#00add8"/>
        <path d="M6 12c0-2.8 2-4.5 4.8-4.5 2.3 0 3.8 1.2 4.2 2.8H13c-.3-.8-1.1-1.3-2.2-1.3-1.8 0-3 1.2-3 3s1.2 3 3 3c1.3 0 2.2-.6 2.4-1.6h-2.4v-1.4h4.1v4.3h-1.4l-.2-1.1c-.6.8-1.5 1.3-2.6 1.3-2.7 0-4.7-1.7-4.7-4.5zm11.7 0c0-2.8 2-4.5 4.3-4.5 2.3 0 4.3 1.7 4.3 4.5s-2 4.5-4.3 4.5c-2.3 0-4.3-1.7-4.3-4.5zm6.8 0c0-1.8-1.1-3-2.5-3s-2.5 1.2-2.5 3 1.1 3 2.5 3 2.5-1.2 2.5-3z" fill="#ffffff"/>
      </svg>
    )
  }

  // JSON
  if (ext === 'json') {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style} className={className}>
        <rect width="24" height="24" rx="4" fill="#cbcb41" fillOpacity="0.2"/>
        <text x="12" y="16" fontSize="13" fontWeight="bold" fontFamily="monospace" fill="#fbc02d" textAnchor="middle">{'{ }'}</text>
      </svg>
    )
  }

  // Markdown
  if (ext === 'md' || ext === 'markdown') {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style} className={className}>
        <rect x="2" y="4" width="20" height="16" rx="2" stroke="#42a5f5" strokeWidth="1.6"/>
        <path d="M5 15V9l3 3.5L11 9v6M17 15l2.5-3.5H18V9h-2v2.5h-1.5L17 15z" fill="#42a5f5"/>
      </svg>
    )
  }

  // Shell / Bash
  if (ext === 'sh' || ext === 'bash' || ext === 'zsh') {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style} className={className}>
        <rect width="24" height="24" rx="4" fill="#1e293b"/>
        <path d="M5 8l4 4-4 4M12 16h6" stroke="#4ade80" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    )
  }

  // SQL
  if (ext === 'sql') {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style} className={className}>
        <ellipse cx="12" cy="6" rx="8" ry="3" fill="#336791" fillOpacity="0.4" stroke="#336791" strokeWidth="1.5"/>
        <path d="M4 6v6c0 1.7 3.6 3 8 3s8-1.3 8-3V6" stroke="#336791" strokeWidth="1.5"/>
        <path d="M4 12v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6" stroke="#336791" strokeWidth="1.5"/>
      </svg>
    )
  }

  // PHP
  if (ext === 'php') {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style} className={className}>
        <ellipse cx="12" cy="12" rx="10" ry="6" fill="#777bb4"/>
        <text x="12" y="15" fontSize="8" fontWeight="900" fontFamily="sans-serif" fill="#ffffff" textAnchor="middle">php</text>
      </svg>
    )
  }

  // Ruby
  if (ext === 'rb') {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style} className={className}>
        <path d="M6 4h12l4 6-10 11L2 10l4-6z" fill="#cc342d"/>
        <path d="M2 10h20M12 21L8 10l4-6 4 6-4 11z" stroke="#ffffff" strokeWidth="1.2" strokeOpacity="0.6"/>
      </svg>
    )
  }

  // Swift
  if (ext === 'swift') {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style} className={className}>
        <rect width="24" height="24" rx="4" fill="#f05138" fillOpacity="0.2"/>
        <path d="M19 18c-3-1-5.5-3.5-7-7 2.5 2 5.5 3 8.5 2.5-1.5 2-1.5 4.5-1.5 4.5zm-5-9c-2 1-3.5 2.5-4.5 4.5C8 10 9 6.5 12 4c.5 1.5 1.2 3.5 2 5zm-3 8c-3.5-1-6-4.5-6-8.5 2 1.5 4.5 2.5 7 2.5-1 2-1 4.5-1 6z" fill="#f05138"/>
      </svg>
    )
  }

  // Kotlin
  if (ext === 'kt' || ext === 'kts') {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style} className={className}>
        <rect width="24" height="24" rx="4" fill="#7f52ff"/>
        <path d="M4 4h8l-8 8V4zm8 0l-8 8v8l16-16h-8zm0 8l8 8h-8l-4-4 4-4z" fill="#ffffff"/>
      </svg>
    )
  }

  // Dart
  if (ext === 'dart') {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style} className={className}>
        <path d="M4 14l8 8h6l-6-6 4-4-6-6H4l6 6-6 2z" fill="#0175c2"/>
        <path d="M10 8l6-6h4l-8 8-2-2z" fill="#00b4ab"/>
      </svg>
    )
  }

  // YAML / YML
  if (ext === 'yaml' || ext === 'yml') {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style} className={className}>
        <rect width="24" height="24" rx="4" fill="#cb171e" fillOpacity="0.18"/>
        <text x="12" y="16" fontSize="10" fontWeight="bold" fontFamily="monospace" fill="#ef4444" textAnchor="middle">YML</text>
      </svg>
    )
  }

  // XML / SVG
  if (ext === 'xml' || ext === 'svg') {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style} className={className}>
        <rect width="24" height="24" rx="4" fill="#f97316" fillOpacity="0.18"/>
        <path d="M8 8L4 12l4 4M16 8l4 4-4 4M13 7l-2 10" stroke="#f97316" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    )
  }

  // Default clean document file icon
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style} className={className}>
      <path d="M6 3h8l5 5v13a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z" fill="var(--bg-card, #1e293b)" stroke="var(--text-muted, #64748b)" strokeWidth="1.4"/>
      <path d="M14 3v5h5" stroke="var(--text-muted, #64748b)" strokeWidth="1.4"/>
      <path d="M9 13h6M9 17h4" stroke="var(--text-muted, #64748b)" strokeWidth="1.2" strokeLinecap="round"/>
    </svg>
  )
}

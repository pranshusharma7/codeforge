import Editor, { useMonaco } from '@monaco-editor/react'
import { useEffect, useRef } from 'react'
import type { Language } from '../types'
import type { editor } from 'monaco-editor'

interface Props {
  code: string
  language: Language
  theme: 'dark' | 'light'
  fontSize: number
  wordWrap: boolean
  onChange: (code: string) => void
  onRun: () => void
  onSave: () => void
  editorRef?: React.MutableRefObject<editor.IStandaloneCodeEditor | null>
}

const DARK_THEME = {
  base: 'vs-dark' as const,
  inherit: true,
  rules: [
    { token: 'comment',   foreground: '6c7086', fontStyle: 'italic' },
    { token: 'keyword',   foreground: 'cba6f7' },
    { token: 'string',    foreground: 'a6e3a1' },
    { token: 'number',    foreground: 'fab387' },
    { token: 'type',      foreground: '89dceb' },
    { token: 'function',  foreground: '89b4fa' },
    { token: 'variable',  foreground: 'cdd6f4' },
    { token: 'operator',  foreground: '89dceb' },
    { token: 'delimiter', foreground: '7f849c' },
  ],
  colors: {
    'editor.background':              '#1e1e2e',
    'editor.foreground':              '#cdd6f4',
    'editorLineNumber.foreground':    '#45475a',
    'editorLineNumber.activeForeground': '#7f849c',
    'editor.lineHighlightBackground':'#313145',
    'editor.selectionBackground':     '#cba6f744',
    'editor.inactiveSelectionBackground': '#cba6f722',
    'editorCursor.foreground':        '#f5c2e7',
    'editorWhitespace.foreground':    '#313145',
    'editorIndentGuide.background':   '#313145',
    'editorIndentGuide.activeBackground': '#45475a',
    'editor.findMatchBackground':     '#f9e2af44',
    'editor.findMatchHighlightBackground': '#f9e2af22',
    'editorWidget.background':        '#181825',
    'editorWidget.border':            '#313145',
    'editorSuggestWidget.background': '#181825',
    'editorSuggestWidget.border':     '#313145',
    'editorSuggestWidget.selectedBackground': '#313145',
    'input.background':               '#181825',
    'input.border':                   '#313145',
    'focusBorder':                    '#cba6f7',
    'scrollbarSlider.background':     '#31314588',
    'scrollbarSlider.hoverBackground':'#45475a88',
    'scrollbarSlider.activeBackground':'#45475a',
  },
}

const LIGHT_THEME = {
  base: 'vs' as const,
  inherit: true,
  rules: [
    { token: 'comment',   foreground: '6e6c7e', fontStyle: 'italic' },
    { token: 'keyword',   foreground: '7c3aed' },
    { token: 'string',    foreground: '40a02b' },
    { token: 'number',    foreground: 'fe640b' },
    { token: 'type',      foreground: '1e66f5' },
    { token: 'function',  foreground: '209fb5' },
  ],
  colors: {
    'editor.background':              '#fffffe',
    'editor.foreground':              '#24273a',
    'editorLineNumber.foreground':    '#9ca0b0',
    'editorLineNumber.activeForeground': '#6e6c7e',
    'editor.lineHighlightBackground':'#f5f5fa',
    'editor.selectionBackground':     '#7c3aed33',
    'editorCursor.foreground':        '#7c3aed',
    'focusBorder':                    '#7c3aed',
  },
}

export default function MonacoEditor({ code, language, theme, fontSize, wordWrap, onChange, onRun, onSave, editorRef }: Props) {
  const monaco = useMonaco()
  const innerRef = useRef<editor.IStandaloneCodeEditor | null>(null)

  // Register themes once
  useEffect(() => {
    if (!monaco) return
    monaco.editor.defineTheme('codeforge-dark',  DARK_THEME as any)
    monaco.editor.defineTheme('codeforge-light', LIGHT_THEME as any)
    monaco.editor.setTheme(theme === 'dark' ? 'codeforge-dark' : 'codeforge-light')
  }, [monaco])

  // Theme switch
  useEffect(() => {
    if (!monaco) return
    monaco.editor.setTheme(theme === 'dark' ? 'codeforge-dark' : 'codeforge-light')
  }, [monaco, theme])

  function handleMount(ed: editor.IStandaloneCodeEditor, m: typeof import('monaco-editor')) {
    innerRef.current = ed
    if (editorRef) editorRef.current = ed

    m.editor.defineTheme('codeforge-dark',  DARK_THEME as any)
    m.editor.defineTheme('codeforge-light', LIGHT_THEME as any)
    m.editor.setTheme(theme === 'dark' ? 'codeforge-dark' : 'codeforge-light')

    // Keyboard shortcuts
    ed.addAction({
      id: 'run-code',
      label: 'Run Code',
      keybindings: [m.KeyMod.CtrlCmd | m.KeyCode.Enter],
      run: () => onRun(),
    })
    ed.addAction({
      id: 'save-code',
      label: 'Save Code',
      keybindings: [m.KeyMod.CtrlCmd | m.KeyCode.KeyS],
      run: () => onSave(),
    })

    // Focus
    ed.focus()
  }

  return (
    <Editor
      height="100%"
      language={language.monacoId}
      value={code}
      theme={theme === 'dark' ? 'codeforge-dark' : 'codeforge-light'}
      onChange={v => onChange(v ?? '')}
      onMount={handleMount}
      loading={
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)', fontSize: 13 }}>
          Loading editor...
        </div>
      }
      options={{
        fontSize,
        fontFamily: "'JetBrains Mono', monospace",
        fontLigatures: true,
        wordWrap: wordWrap ? 'on' : 'off',
        minimap: { enabled: true, scale: 1 },
        lineNumbers: 'on',
        renderLineHighlight: 'all',
        scrollBeyondLastLine: false,
        smoothScrolling: true,
        cursorSmoothCaretAnimation: 'on',
        cursorBlinking: 'phase',
        bracketPairColorization: { enabled: true },
        autoClosingBrackets: 'always',
        autoClosingQuotes: 'always',
        autoIndent: 'full',
        formatOnPaste: true,
        tabSize: 2,
        insertSpaces: true,
        renderWhitespace: 'selection',
        suggest: {
          showKeywords: true,
          showSnippets: true,
          showMethods: true,
          showFunctions: true,
          showClasses: true,
          showModules: true,
        },
        quickSuggestions: {
          other: true,
          comments: false,
          strings: false,
        },
        parameterHints: { enabled: true },
        folding: true,
        foldingHighlight: true,
        showFoldingControls: 'mouseover',
        scrollbar: {
          vertical: 'visible',
          horizontal: 'visible',
          verticalScrollbarSize: 8,
          horizontalScrollbarSize: 8,
          useShadows: false,
        },
        overviewRulerLanes: 0,
        hideCursorInOverviewRuler: true,
        padding: { top: 12, bottom: 12 },
        contextmenu: true,
        mouseWheelZoom: false,
        multiCursorModifier: 'ctrlCmd',
        accessibilitySupport: 'off',
      }}
    />
  )
}

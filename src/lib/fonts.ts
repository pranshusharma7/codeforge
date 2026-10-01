export interface EditorFont {
  id: string
  name: string
  fontFamily: string
  cssName: string
  author: string
  hasLigatures: boolean
  description: string
  category: 'Popular' | 'Ligatures' | 'Modern' | 'Classic'
  previewText: string
  badge?: string
}

export const DEFAULT_FONT_ID = 'jetbrains-mono'

export const EDITOR_FONTS: EditorFont[] = [
  {
    id: 'jetbrains-mono',
    name: 'JetBrains Mono',
    fontFamily: "'JetBrains Mono', monospace",
    cssName: 'JetBrains Mono',
    author: 'JetBrains',
    hasLigatures: true,
    category: 'Popular',
    badge: 'IDE Default',
    description: "The world's most popular developer font. High x-height, clear 0/O and 1/l distinction, tailored for long coding sessions.",
    previewText: 'const total = items.reduce((a, b) => a + b, 0); // != == === =>'
  },
  {
    id: 'fira-code',
    name: 'Fira Code',
    fontFamily: "'Fira Code', monospace",
    cssName: 'Fira Code',
    author: 'Nikita Prokopov',
    hasLigatures: true,
    category: 'Ligatures',
    badge: 'Ligatures King',
    description: 'Iconic font that popularized programming ligatures (->, =>, !=, ===, <=, >=, ::). A developer community favorite.',
    previewText: 'if (status !== 200 && count >= 1) return val => val * 2;'
  },
  {
    id: 'cascadia-code',
    name: 'Cascadia Code',
    fontFamily: "'Cascadia Code', monospace",
    cssName: 'Cascadia Code',
    author: 'Microsoft',
    hasLigatures: true,
    category: 'Modern',
    badge: 'VS Code Official',
    description: "Microsoft's official font designed specifically for Visual Studio Code and Windows Terminal.",
    previewText: 'def process(records: list[str]) -> bool: return len(records) > 0'
  },
  {
    id: 'source-code-pro',
    name: 'Source Code Pro',
    fontFamily: "'Source Code Pro', monospace",
    cssName: 'Source Code Pro',
    author: 'Adobe',
    hasLigatures: false,
    category: 'Popular',
    badge: 'Adobe Classic',
    description: "Adobe's legendary open-source monospaced typeface designed specifically for coding environments.",
    previewText: 'template <typename T> void swap(T& a, T& b) { T tmp = a; a = b; b = tmp; }'
  },
  {
    id: 'victor-mono',
    name: 'Victor Mono',
    fontFamily: "'Victor Mono', monospace",
    cssName: 'Victor Mono',
    author: 'Rune Bjørnerås',
    hasLigatures: true,
    category: 'Ligatures',
    badge: 'Cursive Italics',
    description: 'Clean monospaced font famous for semi-connected cursive italics in comments & attributes plus rich programming ligatures.',
    previewText: '/* Cursive italic comments with smooth arrows */ fn main() -> ()'
  },
  {
    id: 'ibm-plex-mono',
    name: 'IBM Plex Mono',
    fontFamily: "'IBM Plex Mono', monospace",
    cssName: 'IBM Plex Mono',
    author: 'IBM',
    hasLigatures: false,
    category: 'Modern',
    badge: 'Engineered',
    description: "IBM's engineered corporate monospace font reflecting the relationship between mankind and machine.",
    previewText: 'SELECT id, username, created_at FROM users WHERE role = "admin";'
  },
  {
    id: 'inconsolata',
    name: 'Inconsolata',
    fontFamily: "'Inconsolata', monospace",
    cssName: 'Inconsolata',
    author: 'Raph Levien',
    hasLigatures: false,
    category: 'Classic',
    badge: 'Humanist',
    description: 'Humanist monospaced font inspired by Consolas, praised for outstanding clarity and beauty on high-res displays.',
    previewText: 'System.out.println("Computed value: " + Math.sqrt(delta));'
  },
  {
    id: 'space-mono',
    name: 'Space Mono',
    fontFamily: "'Space Mono', monospace",
    author: 'Colophon Foundry',
    cssName: 'Space Mono',
    hasLigatures: false,
    category: 'Modern',
    badge: 'Geometric',
    description: 'Original geometric monospace font with a bold, retro-futuristic headline personality for unique editor style.',
    previewText: 'curl -s -X POST https://api.codeforge.io/v1/compile'
  },
  {
    id: 'ubuntu-mono',
    name: 'Ubuntu Mono',
    fontFamily: "'Ubuntu Mono', monospace",
    cssName: 'Ubuntu Mono',
    author: 'Canonical & Dalton Maag',
    hasLigatures: false,
    category: 'Classic',
    badge: 'Linux Native',
    description: 'Distinctive rounded monospace typeface with high density, beloved by Linux system engineers and developers.',
    previewText: 'git checkout -b feature/extensions-and-fonts origin/main'
  },
  {
    id: 'anonymous-pro',
    name: 'Anonymous Pro',
    fontFamily: "'Anonymous Pro', monospace",
    cssName: 'Anonymous Pro',
    author: 'Mark Simonson',
    hasLigatures: false,
    category: 'Classic',
    badge: 'Zero Ambiguity',
    description: 'Carefully fixed-width font designed to eliminate any visual ambiguity between 0 vs O, and 1 vs l vs I.',
    previewText: 'for (int i = 0; i < N; ++i) { array[i] = (i * 10) / 2; }'
  },
  {
    id: 'system-mono',
    name: 'System Default Monospace',
    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace',
    cssName: 'ui-monospace',
    author: 'Native OS',
    hasLigatures: false,
    category: 'Classic',
    badge: 'Zero Latency',
    description: 'Fastest native operating system font (SF Mono on macOS, Consolas on Windows, Menlo or DejaVu on Linux).',
    previewText: 'const os = require("os"); console.log(os.platform());'
  }
]

export function getEditorFontById(id: string): EditorFont {
  return EDITOR_FONTS.find(f => f.id === id) || EDITOR_FONTS[0]
}

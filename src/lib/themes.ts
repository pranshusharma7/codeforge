export interface ThemeDefinition {
  id: string
  name: string
  category: "dark" | "light"
  author: string
  description: string
  previewColors: [string, string, string, string] // [bg, accent, text, secondary]
  isExtensionTheme?: boolean
  extensionId?: string
  monacoTheme: {
    base: "vs-dark" | "vs"
    inherit: boolean
    rules: {
      token: string
      foreground?: string
      background?: string
      fontStyle?: string
    }[]
    colors: Record<string, string>
  }
}

export const VSCODE_THEMES: ThemeDefinition[] = [
  // ── 1. VS Code Dark+ (Default) ─────────────────────────────────────────────
  {
    id: "vscode-dark",
    name: "VS Code Dark+ (Default)",
    category: "dark",
    author: "Microsoft",
    description: "The iconic default dark theme of Visual Studio Code",
    previewColors: ["#1e1e1e", "#007acc", "#d4d4d4", "#4ec9b0"],
    monacoTheme: {
      base: "vs-dark",
      inherit: true,
      rules: [
        { token: "", foreground: "d4d4d4" },
        { token: "comment", foreground: "6a9955", fontStyle: "italic" },
        { token: "keyword", foreground: "c586c0" },
        { token: "keyword.control", foreground: "c586c0" },
        { token: "keyword.operator", foreground: "d4d4d4" },
        { token: "string", foreground: "ce9178" },
        { token: "number", foreground: "b5cea8" },
        { token: "type", foreground: "4ec9b0" },
        { token: "type.identifier", foreground: "4ec9b0" },
        { token: "function", foreground: "dcdcaa" },
        { token: "delimiter", foreground: "d4d4d4" },
        { token: "variable.predefined", foreground: "4fc1ff" },
      ],
      colors: {
        "editor.background": "#1e1e1e",
        "editor.foreground": "#d4d4d4",
        "editor.lineHighlightBackground": "#2a2d2e",
        "editor.selectionBackground": "#264f78",
        "editorCursor.foreground": "#aeafad",
        "editorLineNumber.foreground": "#858585",
        "editorLineNumber.activeForeground": "#c6c6c6",
        "editorIndentGuide.background1": "#404040",
        "editorIndentGuide.activeBackground1": "#707070",
        "editorBracketMatch.background": "#0064001a",
        "editorBracketMatch.border": "#888888",
        "editorGutter.background": "#1e1e1e",
      },
    },
  },

  // ── 2. Dracula Official ───────────────────────────────────────────────────
  {
    id: "dracula",
    name: "Dracula Official",
    category: "dark",
    author: "Zeno Rocha",
    description: "A dark theme for vampires, featuring vibrant neon pastels",
    previewColors: ["#282a36", "#bd93f9", "#f8f8f2", "#ff79c6"],
    monacoTheme: {
      base: "vs-dark",
      inherit: true,
      rules: [
        { token: "", foreground: "f8f8f2" },
        { token: "comment", foreground: "6272a4", fontStyle: "italic" },
        { token: "keyword", foreground: "ff79c6" },
        { token: "keyword.control", foreground: "ff79c6" },
        { token: "keyword.operator", foreground: "ff79c6" },
        { token: "string", foreground: "f1fa8c" },
        { token: "number", foreground: "bd93f9" },
        { token: "type", foreground: "8be9fd", fontStyle: "italic" },
        { token: "type.identifier", foreground: "8be9fd" },
        { token: "function", foreground: "50fa7b" },
        { token: "delimiter", foreground: "f8f8f2" },
        { token: "variable.predefined", foreground: "ffb86c" },
      ],
      colors: {
        "editor.background": "#282a36",
        "editor.foreground": "#f8f8f2",
        "editor.lineHighlightBackground": "#44475a75",
        "editor.selectionBackground": "#44475a",
        "editorCursor.foreground": "#aeafad",
        "editorLineNumber.foreground": "#6272a4",
        "editorLineNumber.activeForeground": "#f8f8f2",
        "editorIndentGuide.background1": "#ffffff1a",
        "editorIndentGuide.activeBackground1": "#ffffff45",
        "editorBracketMatch.background": "#bd93f930",
        "editorBracketMatch.border": "#bd93f9",
        "editorGutter.background": "#282a36",
      },
    },
  },

  // ── 3. One Dark Pro (Atom) ────────────────────────────────────────────────
  {
    id: "one-dark-pro",
    name: "One Dark Pro",
    category: "dark",
    author: "Binaryify",
    description:
      "Atom's iconic One Dark theme, one of the most installed in VS Code",
    previewColors: ["#282c34", "#61afef", "#abb2bf", "#98c379"],
    monacoTheme: {
      base: "vs-dark",
      inherit: true,
      rules: [
        { token: "", foreground: "abb2bf" },
        { token: "comment", foreground: "5c6370", fontStyle: "italic" },
        { token: "keyword", foreground: "c678dd" },
        { token: "keyword.control", foreground: "c678dd" },
        { token: "keyword.operator", foreground: "56b6c2" },
        { token: "string", foreground: "98c379" },
        { token: "number", foreground: "d19a66" },
        { token: "type", foreground: "e5c07b" },
        { token: "type.identifier", foreground: "e5c07b" },
        { token: "function", foreground: "61afef" },
        { token: "delimiter", foreground: "abb2bf" },
        { token: "variable.predefined", foreground: "e06c75" },
      ],
      colors: {
        "editor.background": "#282c34",
        "editor.foreground": "#abb2bf",
        "editor.lineHighlightBackground": "#2c313c",
        "editor.selectionBackground": "#3e4451",
        "editorCursor.foreground": "#528bff",
        "editorLineNumber.foreground": "#4b5263",
        "editorLineNumber.activeForeground": "#abb2bf",
        "editorIndentGuide.background1": "#3b4048",
        "editorIndentGuide.activeBackground1": "#626772",
        "editorBracketMatch.background": "#515a6b",
        "editorBracketMatch.border": "#528bff",
        "editorGutter.background": "#282c34",
      },
    },
  },

  // ── 4. GitHub Dark ────────────────────────────────────────────────────────
  {
    id: "github-dark",
    name: "GitHub Dark",
    category: "dark",
    author: "GitHub",
    description: "The standard dark theme from GitHub.com",
    previewColors: ["#0d1117", "#58a6ff", "#e6edf3", "#7ee787"],
    monacoTheme: {
      base: "vs-dark",
      inherit: true,
      rules: [
        { token: "", foreground: "e6edf3" },
        { token: "comment", foreground: "8b949e", fontStyle: "italic" },
        { token: "keyword", foreground: "ff7b72" },
        { token: "keyword.control", foreground: "ff7b72" },
        { token: "keyword.operator", foreground: "79c0ff" },
        { token: "string", foreground: "a5d6ff" },
        { token: "number", foreground: "79c0ff" },
        { token: "type", foreground: "ffa657" },
        { token: "type.identifier", foreground: "ffa657" },
        { token: "function", foreground: "d2a8ff" },
        { token: "delimiter", foreground: "8b949e" },
        { token: "variable.predefined", foreground: "ffa657" },
      ],
      colors: {
        "editor.background": "#0d1117",
        "editor.foreground": "#e6edf3",
        "editor.lineHighlightBackground": "#161b22",
        "editor.selectionBackground": "#388bfd33",
        "editorCursor.foreground": "#e6edf3",
        "editorLineNumber.foreground": "#484f58",
        "editorLineNumber.activeForeground": "#e6edf3",
        "editorIndentGuide.background1": "#21262d",
        "editorIndentGuide.activeBackground1": "#30363d",
        "editorBracketMatch.background": "#388bfd25",
        "editorBracketMatch.border": "#388bfd",
        "editorGutter.background": "#0d1117",
      },
    },
  },

  // ── 5. GitHub Dark Dimmed ─────────────────────────────────────────────────
  {
    id: "github-dark-dimmed",
    name: "GitHub Dark Dimmed",
    category: "dark",
    author: "GitHub",
    description:
      "Subtle and comfortable lower-contrast dark palette from GitHub",
    previewColors: ["#22272e", "#539bf5", "#adbac7", "#6cb6ff"],
    monacoTheme: {
      base: "vs-dark",
      inherit: true,
      rules: [
        { token: "", foreground: "adbac7" },
        { token: "comment", foreground: "768390", fontStyle: "italic" },
        { token: "keyword", foreground: "f47067" },
        { token: "keyword.control", foreground: "f47067" },
        { token: "keyword.operator", foreground: "6cb6ff" },
        { token: "string", foreground: "96d0ff" },
        { token: "number", foreground: "6cb6ff" },
        { token: "type", foreground: "f69d50" },
        { token: "type.identifier", foreground: "f69d50" },
        { token: "function", foreground: "dcbdfb" },
        { token: "delimiter", foreground: "768390" },
        { token: "variable.predefined", foreground: "f69d50" },
      ],
      colors: {
        "editor.background": "#22272e",
        "editor.foreground": "#adbac7",
        "editor.lineHighlightBackground": "#2d333b",
        "editor.selectionBackground": "#4184e433",
        "editorCursor.foreground": "#adbac7",
        "editorLineNumber.foreground": "#545d68",
        "editorLineNumber.activeForeground": "#adbac7",
        "editorIndentGuide.background1": "#2d333b",
        "editorIndentGuide.activeBackground1": "#444c56",
        "editorBracketMatch.background": "#539bf525",
        "editorBracketMatch.border": "#539bf5",
        "editorGutter.background": "#22272e",
      },
    },
  },

  // ── 6. Monokai Pro ────────────────────────────────────────────────────────
  {
    id: "monokai-pro",
    name: "Monokai Pro",
    category: "dark",
    author: "Monokai",
    description: "The beloved developer palette engineered for laser focus",
    previewColors: ["#2d2a2e", "#ffd866", "#fcfcfa", "#ff6188"],
    monacoTheme: {
      base: "vs-dark",
      inherit: true,
      rules: [
        { token: "", foreground: "fcfcfa" },
        { token: "comment", foreground: "727072", fontStyle: "italic" },
        { token: "keyword", foreground: "ff6188" },
        { token: "keyword.control", foreground: "ff6188" },
        { token: "keyword.operator", foreground: "ff6188" },
        { token: "string", foreground: "ffd866" },
        { token: "number", foreground: "ab9df2" },
        { token: "type", foreground: "78dce8", fontStyle: "italic" },
        { token: "type.identifier", foreground: "78dce8" },
        { token: "function", foreground: "a9dc76" },
        { token: "delimiter", foreground: "939293" },
        { token: "variable.predefined", foreground: "fc9867" },
      ],
      colors: {
        "editor.background": "#2d2a2e",
        "editor.foreground": "#fcfcfa",
        "editor.lineHighlightBackground": "#3a373b",
        "editor.selectionBackground": "#403e41",
        "editorCursor.foreground": "#ffd866",
        "editorLineNumber.foreground": "#727072",
        "editorLineNumber.activeForeground": "#fcfcfa",
        "editorIndentGuide.background1": "#403e41",
        "editorIndentGuide.activeBackground1": "#727072",
        "editorBracketMatch.background": "#ffd86630",
        "editorBracketMatch.border": "#ffd866",
        "editorGutter.background": "#2d2a2e",
      },
    },
  },

  // ── 7. Tokyo Night ────────────────────────────────────────────────────────
  {
    id: "tokyo-night",
    name: "Tokyo Night",
    category: "dark",
    author: "Enkia",
    description:
      "Clean, futuristic dark theme inspired by the lights of downtown Tokyo",
    previewColors: ["#1a1b26", "#7aa2f7", "#a9b1d6", "#bb9af7"],
    monacoTheme: {
      base: "vs-dark",
      inherit: true,
      rules: [
        { token: "", foreground: "a9b1d6" },
        { token: "comment", foreground: "565f89", fontStyle: "italic" },
        { token: "keyword", foreground: "bb9af7" },
        { token: "keyword.control", foreground: "bb9af7" },
        { token: "keyword.operator", foreground: "89ddff" },
        { token: "string", foreground: "9ece6a" },
        { token: "number", foreground: "ff9e64" },
        { token: "type", foreground: "2ac3de" },
        { token: "type.identifier", foreground: "2ac3de" },
        { token: "function", foreground: "7aa2f7" },
        { token: "delimiter", foreground: "89ddff" },
        { token: "variable.predefined", foreground: "f7768e" },
      ],
      colors: {
        "editor.background": "#1a1b26",
        "editor.foreground": "#a9b1d6",
        "editor.lineHighlightBackground": "#24283b",
        "editor.selectionBackground": "#283457",
        "editorCursor.foreground": "#c0caf5",
        "editorLineNumber.foreground": "#363b54",
        "editorLineNumber.activeForeground": "#737aa2",
        "editorIndentGuide.background1": "#292e42",
        "editorIndentGuide.activeBackground1": "#3b4261",
        "editorBracketMatch.background": "#7aa2f733",
        "editorBracketMatch.border": "#7aa2f7",
        "editorGutter.background": "#1a1b26",
      },
    },
  },

  // ── 8. Catppuccin Mocha ───────────────────────────────────────────────────
  {
    id: "catppuccin-mocha",
    name: "Catppuccin Mocha",
    category: "dark",
    author: "Catppuccin Org",
    description: "Soothing warm pastel theme for high productivity and comfort",
    previewColors: ["#1e1e2e", "#cba6f7", "#cdd6f4", "#f38ba8"],
    monacoTheme: {
      base: "vs-dark",
      inherit: true,
      rules: [
        { token: "", foreground: "cdd6f4" },
        { token: "comment", foreground: "6c7086", fontStyle: "italic" },
        { token: "keyword", foreground: "cba6f7" },
        { token: "keyword.control", foreground: "cba6f7" },
        { token: "keyword.operator", foreground: "89dceb" },
        { token: "string", foreground: "a6e3a1" },
        { token: "number", foreground: "fab387" },
        { token: "type", foreground: "f9e2af" },
        { token: "type.identifier", foreground: "f9e2af" },
        { token: "function", foreground: "89b4fa" },
        { token: "delimiter", foreground: "9399b2" },
        { token: "variable.predefined", foreground: "f38ba8" },
      ],
      colors: {
        "editor.background": "#1e1e2e",
        "editor.foreground": "#cdd6f4",
        "editor.lineHighlightBackground": "#31324466",
        "editor.selectionBackground": "#45475a",
        "editorCursor.foreground": "#f5e0dc",
        "editorLineNumber.foreground": "#585b70",
        "editorLineNumber.activeForeground": "#cdd6f4",
        "editorIndentGuide.background1": "#313244",
        "editorIndentGuide.activeBackground1": "#45475a",
        "editorBracketMatch.background": "#cba6f733",
        "editorBracketMatch.border": "#cba6f7",
        "editorGutter.background": "#1e1e2e",
      },
    },
  },

  // ── 9. Nord ───────────────────────────────────────────────────────────────
  {
    id: "nord",
    name: "Nord",
    category: "dark",
    author: "Arctic Ice Studio",
    description: "An arctic, north-bluish clean and elegant color palette",
    previewColors: ["#2e3440", "#88c0d0", "#d8dee9", "#81a1c1"],
    monacoTheme: {
      base: "vs-dark",
      inherit: true,
      rules: [
        { token: "", foreground: "d8dee9" },
        { token: "comment", foreground: "4c566a", fontStyle: "italic" },
        { token: "keyword", foreground: "81a1c1" },
        { token: "keyword.control", foreground: "81a1c1" },
        { token: "keyword.operator", foreground: "81a1c1" },
        { token: "string", foreground: "a3be8c" },
        { token: "number", foreground: "b48ead" },
        { token: "type", foreground: "8fbcbb" },
        { token: "type.identifier", foreground: "8fbcbb" },
        { token: "function", foreground: "88c0d0" },
        { token: "delimiter", foreground: "d8dee9" },
        { token: "variable.predefined", foreground: "bf616a" },
      ],
      colors: {
        "editor.background": "#2e3440",
        "editor.foreground": "#d8dee9",
        "editor.lineHighlightBackground": "#3b4252",
        "editor.selectionBackground": "#434c5e",
        "editorCursor.foreground": "#d8dee9",
        "editorLineNumber.foreground": "#4c566a",
        "editorLineNumber.activeForeground": "#d8dee9",
        "editorIndentGuide.background1": "#3b4252",
        "editorIndentGuide.activeBackground1": "#4c566a",
        "editorBracketMatch.background": "#88c0d033",
        "editorBracketMatch.border": "#88c0d0",
        "editorGutter.background": "#2e3440",
      },
    },
  },

  // ── 10. Night Owl ─────────────────────────────────────────────────────────
  {
    id: "night-owl",
    name: "Night Owl",
    category: "dark",
    author: "Sarah Drasner",
    description:
      "A theme for late-night coders with vibrant colors and rich dark navy",
    previewColors: ["#011627", "#82aaff", "#d6deeb", "#c792ea"],
    monacoTheme: {
      base: "vs-dark",
      inherit: true,
      rules: [
        { token: "", foreground: "d6deeb" },
        { token: "comment", foreground: "637777", fontStyle: "italic" },
        { token: "keyword", foreground: "c792ea" },
        { token: "keyword.control", foreground: "c792ea" },
        { token: "keyword.operator", foreground: "7fdbca" },
        { token: "string", foreground: "ecc48d" },
        { token: "number", foreground: "f78c6c" },
        { token: "type", foreground: "ffcb8b" },
        { token: "type.identifier", foreground: "ffcb8b" },
        { token: "function", foreground: "82aaff" },
        { token: "delimiter", foreground: "d6deeb" },
        { token: "variable.predefined", foreground: "addb67" },
      ],
      colors: {
        "editor.background": "#011627",
        "editor.foreground": "#d6deeb",
        "editor.lineHighlightBackground": "#0b2942",
        "editor.selectionBackground": "#1d3b53",
        "editorCursor.foreground": "#7e57c2",
        "editorLineNumber.foreground": "#4b6479",
        "editorLineNumber.activeForeground": "#c5e4fd",
        "editorIndentGuide.background1": "#0b2942",
        "editorIndentGuide.activeBackground1": "#1d3b53",
        "editorBracketMatch.background": "#82aaff33",
        "editorBracketMatch.border": "#82aaff",
        "editorGutter.background": "#011627",
      },
    },
  },

  // ── 11. SynthWave '84 (Cyberpunk) ──────────────────────────────────────────
  {
    id: "synthwave-84",
    name: "SynthWave '84",
    category: "dark",
    author: "Robb Owen",
    description:
      "Retro 80s neon glowing aesthetic inspired by modern synthwave art",
    previewColors: ["#262335", "#ff7edb", "#f92aad", "#36f9f6"],
    monacoTheme: {
      base: "vs-dark",
      inherit: true,
      rules: [
        { token: "", foreground: "f92aad" },
        { token: "comment", foreground: "614d85", fontStyle: "italic" },
        { token: "keyword", foreground: "fede5d" },
        { token: "keyword.control", foreground: "fede5d" },
        { token: "keyword.operator", foreground: "fe4450" },
        { token: "string", foreground: "ff7edb" },
        { token: "number", foreground: "f97e72" },
        { token: "type", foreground: "fe4450" },
        { token: "type.identifier", foreground: "fe4450" },
        { token: "function", foreground: "36f9f6" },
        { token: "delimiter", foreground: "f92aad" },
        { token: "variable.predefined", foreground: "ff7edb" },
      ],
      colors: {
        "editor.background": "#262335",
        "editor.foreground": "#f92aad",
        "editor.lineHighlightBackground": "#34294f55",
        "editor.selectionBackground": "#ffffff22",
        "editorCursor.foreground": "#fe4450",
        "editorLineNumber.foreground": "#544670",
        "editorLineNumber.activeForeground": "#ff7edb",
        "editorIndentGuide.background1": "#34294f",
        "editorIndentGuide.activeBackground1": "#493774",
        "editorBracketMatch.background": "#36f9f633",
        "editorBracketMatch.border": "#36f9f6",
        "editorGutter.background": "#262335",
      },
    },
  },

  // ── 12. Cobalt2 ───────────────────────────────────────────────────────────
  {
    id: "cobalt2",
    name: "Cobalt2",
    category: "dark",
    author: "Wes Bos",
    description:
      "Wes Bos legendary vibrant deep navy blue with sunshine yellow accents",
    previewColors: ["#193549", "#ffc600", "#ffffff", "#0088ff"],
    monacoTheme: {
      base: "vs-dark",
      inherit: true,
      rules: [
        { token: "", foreground: "ffffff" },
        { token: "comment", foreground: "0088ff", fontStyle: "italic" },
        { token: "keyword", foreground: "ff9d00" },
        { token: "keyword.control", foreground: "ff9d00" },
        { token: "keyword.operator", foreground: "0088ff" },
        { token: "string", foreground: "3ad900" },
        { token: "number", foreground: "ff628c" },
        { token: "type", foreground: "80ffbb" },
        { token: "type.identifier", foreground: "80ffbb" },
        { token: "function", foreground: "ffc600" },
        { token: "delimiter", foreground: "ffffff" },
        { token: "variable.predefined", foreground: "ffc600" },
      ],
      colors: {
        "editor.background": "#193549",
        "editor.foreground": "#ffffff",
        "editor.lineHighlightBackground": "#1f4662",
        "editor.selectionBackground": "#005088",
        "editorCursor.foreground": "#ffc600",
        "editorLineNumber.foreground": "#386588",
        "editorLineNumber.activeForeground": "#ffc600",
        "editorIndentGuide.background1": "#1f4662",
        "editorIndentGuide.activeBackground1": "#0088ff55",
        "editorBracketMatch.background": "#ffc60033",
        "editorBracketMatch.border": "#ffc600",
        "editorGutter.background": "#193549",
      },
    },
  },

  // ── 13. Solarized Dark ────────────────────────────────────────────────────
  {
    id: "solarized-dark",
    name: "Solarized Dark",
    category: "dark",
    author: "Ethan Schoonover",
    description:
      "Precision engineered scientifically tuned low-contrast color palette",
    previewColors: ["#002b36", "#268bd2", "#839496", "#2aa198"],
    monacoTheme: {
      base: "vs-dark",
      inherit: true,
      rules: [
        { token: "", foreground: "839496" },
        { token: "comment", foreground: "586e75", fontStyle: "italic" },
        { token: "keyword", foreground: "859900" },
        { token: "keyword.control", foreground: "859900" },
        { token: "keyword.operator", foreground: "859900" },
        { token: "string", foreground: "2aa198" },
        { token: "number", foreground: "d33682" },
        { token: "type", foreground: "b58900" },
        { token: "type.identifier", foreground: "b58900" },
        { token: "function", foreground: "268bd2" },
        { token: "delimiter", foreground: "839496" },
        { token: "variable.predefined", foreground: "cb4b16" },
      ],
      colors: {
        "editor.background": "#002b36",
        "editor.foreground": "#839496",
        "editor.lineHighlightBackground": "#073642",
        "editor.selectionBackground": "#073642",
        "editorCursor.foreground": "#d30102",
        "editorLineNumber.foreground": "#586e75",
        "editorLineNumber.activeForeground": "#93a1a1",
        "editorIndentGuide.background1": "#073642",
        "editorIndentGuide.activeBackground1": "#586e75",
        "editorBracketMatch.background": "#268bd233",
        "editorBracketMatch.border": "#268bd2",
        "editorGutter.background": "#002b36",
      },
    },
  },

  // ── 14. GitHub Light ──────────────────────────────────────────────────────
  {
    id: "github-light",
    name: "GitHub Light",
    category: "light",
    author: "GitHub",
    description: "Crisp, clean default light theme from GitHub",
    previewColors: ["#ffffff", "#0969da", "#24292f", "#1a7f37"],
    monacoTheme: {
      base: "vs",
      inherit: true,
      rules: [
        { token: "", foreground: "24292f" },
        { token: "comment", foreground: "6e7781", fontStyle: "italic" },
        { token: "keyword", foreground: "cf222e" },
        { token: "keyword.control", foreground: "cf222e" },
        { token: "keyword.operator", foreground: "0550ae" },
        { token: "string", foreground: "0a3069" },
        { token: "number", foreground: "0550ae" },
        { token: "type", foreground: "953800" },
        { token: "type.identifier", foreground: "953800" },
        { token: "function", foreground: "8250df" },
        { token: "delimiter", foreground: "24292f" },
        { token: "variable.predefined", foreground: "953800" },
      ],
      colors: {
        "editor.background": "#ffffff",
        "editor.foreground": "#24292f",
        "editor.lineHighlightBackground": "#f6f8fa",
        "editor.selectionBackground": "#b6e3ff",
        "editorCursor.foreground": "#24292f",
        "editorLineNumber.foreground": "#8c959f",
        "editorLineNumber.activeForeground": "#24292f",
        "editorIndentGuide.background1": "#eaeef2",
        "editorIndentGuide.activeBackground1": "#d0d7de",
        "editorBracketMatch.background": "#0969da20",
        "editorBracketMatch.border": "#0969da",
        "editorGutter.background": "#ffffff",
      },
    },
  },

  // ── 15. VS Code Light+ (Default Light) ────────────────────────────────────
  {
    id: "vscode-light",
    name: "VS Code Light+ (Default)",
    category: "light",
    author: "Microsoft",
    description: "The standard default light theme of Visual Studio Code",
    previewColors: ["#ffffff", "#007acc", "#000000", "#001080"],
    monacoTheme: {
      base: "vs",
      inherit: true,
      rules: [
        { token: "", foreground: "000000" },
        { token: "comment", foreground: "008000", fontStyle: "italic" },
        { token: "keyword", foreground: "af00db" },
        { token: "keyword.control", foreground: "af00db" },
        { token: "keyword.operator", foreground: "000000" },
        { token: "string", foreground: "a31515" },
        { token: "number", foreground: "098658" },
        { token: "type", foreground: "267f99" },
        { token: "type.identifier", foreground: "267f99" },
        { token: "function", foreground: "795e26" },
        { token: "delimiter", foreground: "000000" },
        { token: "variable.predefined", foreground: "001080" },
      ],
      colors: {
        "editor.background": "#ffffff",
        "editor.foreground": "#000000",
        "editor.lineHighlightBackground": "#f3f3f3",
        "editor.selectionBackground": "#add6ff",
        "editorCursor.foreground": "#000000",
        "editorLineNumber.foreground": "#237893",
        "editorLineNumber.activeForeground": "#0b216f",
        "editorIndentGuide.background1": "#d3d3d3",
        "editorIndentGuide.activeBackground1": "#939393",
        "editorBracketMatch.background": "#007acc25",
        "editorBracketMatch.border": "#007acc",
        "editorGutter.background": "#ffffff",
      },
    },
  },

  // ── 16. Cyberpunk 2077 (Neon Dark) ─────────────────────────────────────────
  {
    id: "cyberpunk-2077",
    name: "Cyberpunk 2077 (Neon)",
    category: "dark",
    author: "Night City Developers",
    description:
      "High-contrast neon cyberpunk theme with electric yellow, hot pink, and cyan highlights",
    previewColors: ["#0d0f18", "#fcee0a", "#00f0ff", "#ff007f"],
    monacoTheme: {
      base: "vs-dark",
      inherit: true,
      rules: [
        { token: "", foreground: "00f0ff" },
        { token: "comment", foreground: "5c6370", fontStyle: "italic" },
        { token: "keyword", foreground: "ff007f" },
        { token: "keyword.control", foreground: "ff007f" },
        { token: "keyword.operator", foreground: "fcee0a" },
        { token: "string", foreground: "37f499" },
        { token: "number", foreground: "fcee0a" },
        { token: "type", foreground: "ff9900" },
        { token: "type.identifier", foreground: "ff9900" },
        { token: "function", foreground: "00f0ff" },
        { token: "delimiter", foreground: "e0e0e0" },
        { token: "variable.predefined", foreground: "ff007f" },
      ],
      colors: {
        "editor.background": "#0d0f18",
        "editor.foreground": "#00f0ff",
        "editor.lineHighlightBackground": "#181b29",
        "editor.selectionBackground": "#ff007f35",
        "editorCursor.foreground": "#fcee0a",
        "editorLineNumber.foreground": "#3b4261",
        "editorLineNumber.activeForeground": "#fcee0a",
        "editorIndentGuide.background1": "#1e2238",
        "editorIndentGuide.activeBackground1": "#00f0ff40",
        "editorBracketMatch.background": "#fcee0a25",
        "editorBracketMatch.border": "#fcee0a",
        "editorGutter.background": "#0d0f18",
      },
    },
  },

  // ── 17. Rosé Pine (Aesthetic Natural) ──────────────────────────────────────
  {
    id: "rose-pine",
    name: "Rosé Pine",
    category: "dark",
    author: "mvllow",
    description:
      "Soho vibes for high-elegance minimalist coding with soft natural pastels",
    previewColors: ["#191724", "#ebbcba", "#9ccfd8", "#c4a7e7"],
    monacoTheme: {
      base: "vs-dark",
      inherit: true,
      rules: [
        { token: "", foreground: "e0def4" },
        { token: "comment", foreground: "6e6a86", fontStyle: "italic" },
        { token: "keyword", foreground: "31748f" },
        { token: "keyword.control", foreground: "31748f" },
        { token: "keyword.operator", foreground: "eb6f92" },
        { token: "string", foreground: "ebbcba" },
        { token: "number", foreground: "f6c177" },
        { token: "type", foreground: "9ccfd8" },
        { token: "type.identifier", foreground: "9ccfd8" },
        { token: "function", foreground: "c4a7e7" },
        { token: "delimiter", foreground: "e0def4" },
        { token: "variable.predefined", foreground: "eb6f92" },
      ],
      colors: {
        "editor.background": "#191724",
        "editor.foreground": "#e0def4",
        "editor.lineHighlightBackground": "#26233a70",
        "editor.selectionBackground": "#403d5280",
        "editorCursor.foreground": "#ebbcba",
        "editorLineNumber.foreground": "#524f67",
        "editorLineNumber.activeForeground": "#e0def4",
        "editorIndentGuide.background1": "#26233a",
        "editorIndentGuide.activeBackground1": "#524f67",
        "editorBracketMatch.background": "#ebbcba25",
        "editorBracketMatch.border": "#ebbcba",
        "editorGutter.background": "#191724",
      },
    },
  },

  // ── 18. Tokyo Night Storm ─────────────────────────────────────────────────
  {
    id: "tokyo-night-storm",
    name: "Tokyo Night Storm",
    category: "dark",
    author: "enkia",
    description:
      "A clean storm-blue theme that celebrates the lights of Downtown Tokyo at twilight",
    previewColors: ["#24283b", "#7aa2f7", "#7dcfff", "#bb9af7"],
    monacoTheme: {
      base: "vs-dark",
      inherit: true,
      rules: [
        { token: "", foreground: "c0caf5" },
        { token: "comment", foreground: "565f89", fontStyle: "italic" },
        { token: "keyword", foreground: "bb9af7" },
        { token: "keyword.control", foreground: "bb9af7" },
        { token: "keyword.operator", foreground: "89ddff" },
        { token: "string", foreground: "9ece6a" },
        { token: "number", foreground: "ff9e64" },
        { token: "type", foreground: "2ac3de" },
        { token: "type.identifier", foreground: "2ac3de" },
        { token: "function", foreground: "7aa2f7" },
        { token: "delimiter", foreground: "c0caf5" },
        { token: "variable.predefined", foreground: "7dcfff" },
      ],
      colors: {
        "editor.background": "#24283b",
        "editor.foreground": "#c0caf5",
        "editor.lineHighlightBackground": "#292e42",
        "editor.selectionBackground": "#3e445e",
        "editorCursor.foreground": "#c0caf5",
        "editorLineNumber.foreground": "#565f89",
        "editorLineNumber.activeForeground": "#7aa2f7",
        "editorIndentGuide.background1": "#2f3549",
        "editorIndentGuide.activeBackground1": "#565f89",
        "editorBracketMatch.background": "#7aa2f725",
        "editorBracketMatch.border": "#7aa2f7",
        "editorGutter.background": "#24283b",
      },
    },
  },

  // ── 19. Aura Dark (Cosmic Violet) ──────────────────────────────────────────
  {
    id: "aura-dark",
    name: "Aura Dark (Cosmic)",
    category: "dark",
    author: "Dalton Menezes",
    description:
      "Beautiful cosmic violet theme with vibrant green, purple, and orange accents",
    previewColors: ["#15141b", "#a277ff", "#61ffca", "#ffca85"],
    monacoTheme: {
      base: "vs-dark",
      inherit: true,
      rules: [
        { token: "", foreground: "edecee" },
        { token: "comment", foreground: "6d6d6d", fontStyle: "italic" },
        { token: "keyword", foreground: "a277ff" },
        { token: "keyword.control", foreground: "a277ff" },
        { token: "keyword.operator", foreground: "a277ff" },
        { token: "string", foreground: "61ffca" },
        { token: "number", foreground: "ffca85" },
        { token: "type", foreground: "82e2ff" },
        { token: "type.identifier", foreground: "82e2ff" },
        { token: "function", foreground: "ff6767" },
        { token: "delimiter", foreground: "edecee" },
        { token: "variable.predefined", foreground: "a277ff" },
      ],
      colors: {
        "editor.background": "#15141b",
        "editor.foreground": "#edecee",
        "editor.lineHighlightBackground": "#21202e",
        "editor.selectionBackground": "#323048",
        "editorCursor.foreground": "#a277ff",
        "editorLineNumber.foreground": "#4e4c67",
        "editorLineNumber.activeForeground": "#a277ff",
        "editorIndentGuide.background1": "#21202e",
        "editorIndentGuide.activeBackground1": "#4e4c67",
        "editorBracketMatch.background": "#a277ff25",
        "editorBracketMatch.border": "#a277ff",
        "editorGutter.background": "#15141b",
      },
    },
  },

  // ── 20. Shades of Purple ──────────────────────────────────────────────────
  {
    id: "shades-of-purple",
    name: "Shades of Purple",
    category: "dark",
    author: "Ahmad Awais",
    description:
      "Electric purple canvas with supercharged gold and cyan highlights",
    previewColors: ["#2d2b55", "#fad000", "#ff2c7d", "#b362ff"],
    monacoTheme: {
      base: "vs-dark",
      inherit: true,
      rules: [
        { token: "", foreground: "ffffff" },
        { token: "comment", foreground: "b362ff", fontStyle: "italic" },
        { token: "keyword", foreground: "ff9d00" },
        { token: "keyword.control", foreground: "ff9d00" },
        { token: "keyword.operator", foreground: "fad000" },
        { token: "string", foreground: "a5ff90" },
        { token: "number", foreground: "ff628c" },
        { token: "type", foreground: "9effff" },
        { token: "type.identifier", foreground: "9effff" },
        { token: "function", foreground: "fad000" },
        { token: "delimiter", foreground: "ffffff" },
        { token: "variable.predefined", foreground: "fb94ff" },
      ],
      colors: {
        "editor.background": "#2d2b55",
        "editor.foreground": "#ffffff",
        "editor.lineHighlightBackground": "#1f1f41",
        "editor.selectionBackground": "#7e45b870",
        "editorCursor.foreground": "#fad000",
        "editorLineNumber.foreground": "#a599e9",
        "editorLineNumber.activeForeground": "#fad000",
        "editorIndentGuide.background1": "#3b386e",
        "editorIndentGuide.activeBackground1": "#7e45b8",
        "editorBracketMatch.background": "#fad00030",
        "editorBracketMatch.border": "#fad000",
        "editorGutter.background": "#28264d",
      },
    },
  },

  // ── 21. Gruvbox Dark (Retro Groove) ───────────────────────────────────────
  {
    id: "gruvbox-dark",
    name: "Gruvbox Dark (Retro)",
    category: "dark",
    author: "morhetz",
    description:
      "Iconic retro groove warm color scheme with vintage earthy pastels",
    previewColors: ["#1d2021", "#fe8019", "#ebdbb2", "#fabd2f"],
    monacoTheme: {
      base: "vs-dark",
      inherit: true,
      rules: [
        { token: "", foreground: "ebdbb2" },
        { token: "comment", foreground: "928374", fontStyle: "italic" },
        { token: "keyword", foreground: "fb4934" },
        { token: "keyword.control", foreground: "fb4934" },
        { token: "keyword.operator", foreground: "fe8019" },
        { token: "string", foreground: "b8bb26" },
        { token: "number", foreground: "d3869b" },
        { token: "type", foreground: "fabd2f" },
        { token: "type.identifier", foreground: "fabd2f" },
        { token: "function", foreground: "8ec07c" },
        { token: "delimiter", foreground: "ebdbb2" },
        { token: "variable.predefined", foreground: "83a598" },
      ],
      colors: {
        "editor.background": "#1d2021",
        "editor.foreground": "#ebdbb2",
        "editor.lineHighlightBackground": "#282828",
        "editor.selectionBackground": "#504945",
        "editorCursor.foreground": "#ebdbb2",
        "editorLineNumber.foreground": "#7c6f64",
        "editorLineNumber.activeForeground": "#fabd2f",
        "editorIndentGuide.background1": "#3c3836",
        "editorIndentGuide.activeBackground1": "#665c54",
        "editorBracketMatch.background": "#fe801925",
        "editorBracketMatch.border": "#fe8019",
        "editorGutter.background": "#1d2021",
      },
    },
  },

  // ── 22. Gruvbox Light (Parchment) ─────────────────────────────────────────
  {
    id: "gruvbox-light",
    name: "Gruvbox Light (Parchment)",
    category: "light",
    author: "morhetz",
    description:
      "Warm parchment paper aesthetic with retro sepia inks and comfortable reading contrast",
    previewColors: ["#fbf1c7", "#af3a03", "#282828", "#b57614"],
    monacoTheme: {
      base: "vs",
      inherit: true,
      rules: [
        { token: "", foreground: "282828" },
        { token: "comment", foreground: "928374", fontStyle: "italic" },
        { token: "keyword", foreground: "9d0006" },
        { token: "keyword.control", foreground: "9d0006" },
        { token: "keyword.operator", foreground: "af3a03" },
        { token: "string", foreground: "79740e" },
        { token: "number", foreground: "8f3f71" },
        { token: "type", foreground: "b57614" },
        { token: "type.identifier", foreground: "b57614" },
        { token: "function", foreground: "427b58" },
        { token: "delimiter", foreground: "282828" },
        { token: "variable.predefined", foreground: "076678" },
      ],
      colors: {
        "editor.background": "#fbf1c7",
        "editor.foreground": "#282828",
        "editor.lineHighlightBackground": "#f2e5bc",
        "editor.selectionBackground": "#ebdbb2",
        "editorCursor.foreground": "#282828",
        "editorLineNumber.foreground": "#928374",
        "editorLineNumber.activeForeground": "#af3a03",
        "editorIndentGuide.background1": "#ebdbb2",
        "editorIndentGuide.activeBackground1": "#d5c4a1",
        "editorBracketMatch.background": "#af3a0320",
        "editorBracketMatch.border": "#af3a03",
        "editorGutter.background": "#fbf1c7",
      },
    },
  },

  // ── 23. Catppuccin Latte (Light Pastel) ───────────────────────────────────
  {
    id: "catppuccin-latte",
    name: "Catppuccin Latte",
    category: "light",
    author: "Catppuccin Org",
    description:
      "A soothing pastel cream light theme that is gentle on your eyes",
    previewColors: ["#eff1f5", "#1e66f5", "#4c4f69", "#8839ef"],
    monacoTheme: {
      base: "vs",
      inherit: true,
      rules: [
        { token: "", foreground: "4c4f69" },
        { token: "comment", foreground: "9ca0b0", fontStyle: "italic" },
        { token: "keyword", foreground: "8839ef" },
        { token: "keyword.control", foreground: "8839ef" },
        { token: "keyword.operator", foreground: "04a5e5" },
        { token: "string", foreground: "40a02b" },
        { token: "number", foreground: "fe640b" },
        { token: "type", foreground: "df8e1d" },
        { token: "type.identifier", foreground: "df8e1d" },
        { token: "function", foreground: "1e66f5" },
        { token: "delimiter", foreground: "4c4f69" },
        { token: "variable.predefined", foreground: "e64553" },
      ],
      colors: {
        "editor.background": "#eff1f5",
        "editor.foreground": "#4c4f69",
        "editor.lineHighlightBackground": "#e6e9ef",
        "editor.selectionBackground": "#bcc0cc",
        "editorCursor.foreground": "#dc8a78",
        "editorLineNumber.foreground": "#9ca0b0",
        "editorLineNumber.activeForeground": "#1e66f5",
        "editorIndentGuide.background1": "#e6e9ef",
        "editorIndentGuide.activeBackground1": "#bcc0cc",
        "editorBracketMatch.background": "#1e66f520",
        "editorBracketMatch.border": "#1e66f5",
        "editorGutter.background": "#eff1f5",
      },
    },
  },

  // ── 24. Solarized Osaka ───────────────────────────────────────────────────
  {
    id: "solarized-osaka",
    name: "Solarized Osaka",
    category: "dark",
    author: "craftzdog",
    description:
      "Neo-Tokyo evolution of Solarized with deep navy shadows and glowing teal accents",
    previewColors: ["#101920", "#00e8c6", "#839496", "#ff6b35"],
    monacoTheme: {
      base: "vs-dark",
      inherit: true,
      rules: [
        { token: "", foreground: "93a1a1" },
        { token: "comment", foreground: "586e75", fontStyle: "italic" },
        { token: "keyword", foreground: "268bd2" },
        { token: "keyword.control", foreground: "268bd2" },
        { token: "keyword.operator", foreground: "00e8c6" },
        { token: "string", foreground: "2aa198" },
        { token: "number", foreground: "d33682" },
        { token: "type", foreground: "b58900" },
        { token: "type.identifier", foreground: "b58900" },
        { token: "function", foreground: "00e8c6" },
        { token: "delimiter", foreground: "93a1a1" },
        { token: "variable.predefined", foreground: "ff6b35" },
      ],
      colors: {
        "editor.background": "#101920",
        "editor.foreground": "#93a1a1",
        "editor.lineHighlightBackground": "#18242e",
        "editor.selectionBackground": "#073642",
        "editorCursor.foreground": "#00e8c6",
        "editorLineNumber.foreground": "#586e75",
        "editorLineNumber.activeForeground": "#00e8c6",
        "editorIndentGuide.background1": "#192a35",
        "editorIndentGuide.activeBackground1": "#586e75",
        "editorBracketMatch.background": "#00e8c625",
        "editorBracketMatch.border": "#00e8c6",
        "editorGutter.background": "#101920",
      },
    },
  },

  // ── 25. Poimandres (Minimalist Slate) ──────────────────────────────────────
  {
    id: "poimandres",
    name: "Poimandres",
    category: "dark",
    author: "drcmda",
    description:
      "A storm-inspired minimalist dark theme with mint, sky blue, and soft lavender",
    previewColors: ["#1b1e2e", "#5de4c7", "#e4f0fb", "#d0679d"],
    monacoTheme: {
      base: "vs-dark",
      inherit: true,
      rules: [
        { token: "", foreground: "e4f0fb" },
        { token: "comment", foreground: "767c9d", fontStyle: "italic" },
        { token: "keyword", foreground: "5de4c7" },
        { token: "keyword.control", foreground: "5de4c7" },
        { token: "keyword.operator", foreground: "91b4d5" },
        { token: "string", foreground: "5fb9bc" },
        { token: "number", foreground: "d0679d" },
        { token: "type", foreground: "89ddff" },
        { token: "type.identifier", foreground: "89ddff" },
        { token: "function", foreground: "89ddff" },
        { token: "delimiter", foreground: "e4f0fb" },
        { token: "variable.predefined", foreground: "add7ff" },
      ],
      colors: {
        "editor.background": "#1b1e2e",
        "editor.foreground": "#e4f0fb",
        "editor.lineHighlightBackground": "#25293e",
        "editor.selectionBackground": "#303340",
        "editorCursor.foreground": "#5de4c7",
        "editorLineNumber.foreground": "#506477",
        "editorLineNumber.activeForeground": "#5de4c7",
        "editorIndentGuide.background1": "#25293e",
        "editorIndentGuide.activeBackground1": "#506477",
        "editorBracketMatch.background": "#5de4c725",
        "editorBracketMatch.border": "#5de4c7",
        "editorGutter.background": "#1b1e2e",
      },
    },
  },
]

export interface UIThemeColors {
  id?: string
  name?: string
  category?: string
  bgApp: string
  bgHeader: string
  bgSidebar: string
  bgActivity: string
  bgPanel: string
  bgCard: string
  bgInput: string
  bgHover: string
  border: string
  borderSubtle: string
  textBase: string
  textMuted: string
  textDim: string
  accent: string
  accentHover: string
  accentSubtle: string
  accentBorder: string
  red: string
  green: string
  yellow: string
}

export const THEME_UI_PALETTES: Record<string, UIThemeColors> = {
  "vscode-dark": {
    bgApp: "#1e1e1e",
    bgHeader: "#252526",
    bgSidebar: "#252526",
    bgActivity: "#333333",
    bgPanel: "#1e1e1e",
    bgCard: "#2d2d2d",
    bgInput: "#3c3c3c",
    bgHover: "rgba(255, 255, 255, 0.08)",
    border: "#3c3c3c",
    borderSubtle: "#474747",
    textBase: "#d4d4d4",
    textMuted: "#858585",
    textDim: "#6e6e6e",
    accent: "#007acc",
    accentHover: "#0062a3",
    accentSubtle: "rgba(0, 122, 204, 0.18)",
    accentBorder: "rgba(0, 122, 204, 0.45)",
    red: "#f14c4c",
    green: "#89d185",
    yellow: "#cca700",
  },
  dracula: {
    bgApp: "#282a36",
    bgHeader: "#21222c",
    bgSidebar: "#21222c",
    bgActivity: "#191a21",
    bgPanel: "#282a36",
    bgCard: "#343746",
    bgInput: "#1e1f29",
    bgHover: "rgba(255, 255, 255, 0.07)",
    border: "#44475a",
    borderSubtle: "#6272a4",
    textBase: "#f8f8f2",
    textMuted: "#8be9fd",
    textDim: "#6272a4",
    accent: "#bd93f9",
    accentHover: "#ff79c6",
    accentSubtle: "rgba(189, 147, 249, 0.18)",
    accentBorder: "rgba(189, 147, 249, 0.45)",
    red: "#ff5555",
    green: "#50fa7b",
    yellow: "#f1fa8c",
  },
  "one-dark-pro": {
    bgApp: "#282c34",
    bgHeader: "#21252b",
    bgSidebar: "#21252b",
    bgActivity: "#1b1d23",
    bgPanel: "#282c34",
    bgCard: "#2c313a",
    bgInput: "#1e2227",
    bgHover: "rgba(255, 255, 255, 0.06)",
    border: "#3b4048",
    borderSubtle: "#4b5263",
    textBase: "#abb2bf",
    textMuted: "#7f848e",
    textDim: "#5c6370",
    accent: "#61afef",
    accentHover: "#528bff",
    accentSubtle: "rgba(97, 175, 239, 0.18)",
    accentBorder: "rgba(97, 175, 239, 0.4)",
    red: "#e06c75",
    green: "#98c379",
    yellow: "#e5c07b",
  },
  "github-dark": {
    bgApp: "#0d1117",
    bgHeader: "#161b22",
    bgSidebar: "#161b22",
    bgActivity: "#161b22",
    bgPanel: "#0d1117",
    bgCard: "#1c2128",
    bgInput: "#0d1117",
    bgHover: "rgba(255, 255, 255, 0.06)",
    border: "#21262d",
    borderSubtle: "#30363d",
    textBase: "#e6edf3",
    textMuted: "#7d8590",
    textDim: "#484f58",
    accent: "#7c3aed",
    accentHover: "#6d28d9",
    accentSubtle: "rgba(124, 58, 237, 0.15)",
    accentBorder: "rgba(124, 58, 237, 0.4)",
    red: "#f85149",
    green: "#3fb950",
    yellow: "#d29922",
  },
  "github-dark-dimmed": {
    bgApp: "#22272e",
    bgHeader: "#2d333b",
    bgSidebar: "#2d333b",
    bgActivity: "#1c2128",
    bgPanel: "#22272e",
    bgCard: "#2d333b",
    bgInput: "#1c2128",
    bgHover: "rgba(255, 255, 255, 0.06)",
    border: "#444c56",
    borderSubtle: "#545d68",
    textBase: "#adbac7",
    textMuted: "#768390",
    textDim: "#545d68",
    accent: "#539bf5",
    accentHover: "#4184e4",
    accentSubtle: "rgba(83, 155, 245, 0.18)",
    accentBorder: "rgba(83, 155, 245, 0.4)",
    red: "#f47067",
    green: "#57ab5a",
    yellow: "#c69026",
  },
  "monokai-pro": {
    bgApp: "#2d2a2e",
    bgHeader: "#221f22",
    bgSidebar: "#221f22",
    bgActivity: "#1e1c1e",
    bgPanel: "#2d2a2e",
    bgCard: "#3a373b",
    bgInput: "#19181a",
    bgHover: "rgba(255, 255, 255, 0.06)",
    border: "#403e41",
    borderSubtle: "#5a575b",
    textBase: "#fcfcfa",
    textMuted: "#939293",
    textDim: "#727072",
    accent: "#ffd866",
    accentHover: "#fc9867",
    accentSubtle: "rgba(255, 216, 102, 0.18)",
    accentBorder: "rgba(255, 216, 102, 0.45)",
    red: "#ff6188",
    green: "#a9dc76",
    yellow: "#ffd866",
  },
  "tokyo-night": {
    bgApp: "#1a1b26",
    bgHeader: "#16161e",
    bgSidebar: "#16161e",
    bgActivity: "#13141c",
    bgPanel: "#1a1b26",
    bgCard: "#24283b",
    bgInput: "#13141c",
    bgHover: "rgba(255, 255, 255, 0.06)",
    border: "#292e42",
    borderSubtle: "#414868",
    textBase: "#c0caf5",
    textMuted: "#7aa2f7",
    textDim: "#565f89",
    accent: "#7aa2f7",
    accentHover: "#bb9af7",
    accentSubtle: "rgba(122, 162, 247, 0.18)",
    accentBorder: "rgba(122, 162, 247, 0.4)",
    red: "#f7768e",
    green: "#9ece6a",
    yellow: "#e0af68",
  },
  "catppuccin-mocha": {
    bgApp: "#1e1e2e",
    bgHeader: "#181825",
    bgSidebar: "#181825",
    bgActivity: "#11111b",
    bgPanel: "#1e1e2e",
    bgCard: "#313244",
    bgInput: "#11111b",
    bgHover: "rgba(255, 255, 255, 0.06)",
    border: "#313244",
    borderSubtle: "#45475a",
    textBase: "#cdd6f4",
    textMuted: "#a6adc8",
    textDim: "#6c7086",
    accent: "#cba6f7",
    accentHover: "#f5c2e7",
    accentSubtle: "rgba(203, 166, 247, 0.18)",
    accentBorder: "rgba(203, 166, 247, 0.4)",
    red: "#f38ba8",
    green: "#a6e3a1",
    yellow: "#f9e2af",
  },
  nord: {
    bgApp: "#2e3440",
    bgHeader: "#272c36",
    bgSidebar: "#272c36",
    bgActivity: "#232730",
    bgPanel: "#2e3440",
    bgCard: "#3b4252",
    bgInput: "#242933",
    bgHover: "rgba(255, 255, 255, 0.06)",
    border: "#434c5e",
    borderSubtle: "#4c566a",
    textBase: "#d8dee9",
    textMuted: "#88c0d0",
    textDim: "#4c566a",
    accent: "#88c0d0",
    accentHover: "#81a1c1",
    accentSubtle: "rgba(136, 192, 208, 0.18)",
    accentBorder: "rgba(136, 192, 208, 0.4)",
    red: "#bf616a",
    green: "#a3be8c",
    yellow: "#ebcb8b",
  },
  "night-owl": {
    bgApp: "#011627",
    bgHeader: "#01111d",
    bgSidebar: "#01111d",
    bgActivity: "#000c14",
    bgPanel: "#011627",
    bgCard: "#0b253a",
    bgInput: "#00101c",
    bgHover: "rgba(255, 255, 255, 0.06)",
    border: "#1d3b53",
    borderSubtle: "#2a4e6c",
    textBase: "#d6deeb",
    textMuted: "#82aaff",
    textDim: "#5f7e97",
    accent: "#82aaff",
    accentHover: "#c792ea",
    accentSubtle: "rgba(130, 170, 255, 0.18)",
    accentBorder: "rgba(130, 170, 255, 0.4)",
    red: "#ef5350",
    green: "#22da6e",
    yellow: "#addb67",
  },
  "synthwave-84": {
    bgApp: "#262335",
    bgHeader: "#1f1c2b",
    bgSidebar: "#1f1c2b",
    bgActivity: "#171520",
    bgPanel: "#262335",
    bgCard: "#34294f",
    bgInput: "#191724",
    bgHover: "rgba(255, 255, 255, 0.08)",
    border: "#34294f",
    borderSubtle: "#493b6e",
    textBase: "#f92aad",
    textMuted: "#ff7edb",
    textDim: "#848bbd",
    accent: "#fe4450",
    accentHover: "#ff7edb",
    accentSubtle: "rgba(254, 68, 80, 0.22)",
    accentBorder: "rgba(254, 68, 80, 0.5)",
    red: "#fe4450",
    green: "#72f1b8",
    yellow: "#fede5d",
  },
  cobalt2: {
    bgApp: "#193549",
    bgHeader: "#122738",
    bgSidebar: "#122738",
    bgActivity: "#0d1d2a",
    bgPanel: "#193549",
    bgCard: "#1f415b",
    bgInput: "#0f2231",
    bgHover: "rgba(255, 255, 255, 0.08)",
    border: "#204a6e",
    borderSubtle: "#2e6390",
    textBase: "#ffffff",
    textMuted: "#0088ff",
    textDim: "#005096",
    accent: "#ffc600",
    accentHover: "#ff9d00",
    accentSubtle: "rgba(255, 198, 0, 0.22)",
    accentBorder: "rgba(255, 198, 0, 0.5)",
    red: "#ff0000",
    green: "#3ad900",
    yellow: "#ffc600",
  },
  "solarized-dark": {
    bgApp: "#002b36",
    bgHeader: "#073642",
    bgSidebar: "#073642",
    bgActivity: "#00212b",
    bgPanel: "#002b36",
    bgCard: "#0a4150",
    bgInput: "#001f27",
    bgHover: "rgba(255, 255, 255, 0.07)",
    border: "#0e4a58",
    borderSubtle: "#1a5d6e",
    textBase: "#93a1a1",
    textMuted: "#839496",
    textDim: "#586e75",
    accent: "#268bd2",
    accentHover: "#2aa198",
    accentSubtle: "rgba(38, 139, 210, 0.22)",
    accentBorder: "rgba(38, 139, 210, 0.45)",
    red: "#dc322f",
    green: "#859900",
    yellow: "#b58900",
  },
  "github-light": {
    bgApp: "#ffffff",
    bgHeader: "#f6f8fa",
    bgSidebar: "#f6f8fa",
    bgActivity: "#eaedf1",
    bgPanel: "#ffffff",
    bgCard: "#f6f8fa",
    bgInput: "#ffffff",
    bgHover: "rgba(0, 0, 0, 0.05)",
    border: "#d0d7de",
    borderSubtle: "#e1e4e8",
    textBase: "#1f2328",
    textMuted: "#656d76",
    textDim: "#8c959f",
    accent: "#0969da",
    accentHover: "#0860ca",
    accentSubtle: "rgba(9, 105, 218, 0.12)",
    accentBorder: "rgba(9, 105, 218, 0.35)",
    red: "#cf222e",
    green: "#1a7f37",
    yellow: "#9a6700",
  },
  "vscode-light": {
    bgApp: "#ffffff",
    bgHeader: "#f3f3f3",
    bgSidebar: "#f3f3f3",
    bgActivity: "#e8e8e8",
    bgPanel: "#ffffff",
    bgCard: "#f8f8f8",
    bgInput: "#ffffff",
    bgHover: "rgba(0, 0, 0, 0.05)",
    border: "#e5e5e5",
    borderSubtle: "#d0d0d0",
    textBase: "#333333",
    textMuted: "#616161",
    textDim: "#888888",
    accent: "#007acc",
    accentHover: "#0062a3",
    accentSubtle: "rgba(0, 122, 204, 0.12)",
    accentBorder: "rgba(0, 122, 204, 0.35)",
    red: "#cd3131",
    green: "#008000",
    yellow: "#795e26",
  },
  "cyberpunk-2077": {
    bgApp: "#0d0f18",
    bgHeader: "#141724",
    bgSidebar: "#101320",
    bgActivity: "#090a12",
    bgPanel: "#0d0f18",
    bgCard: "#181b2a",
    bgInput: "#1f2338",
    bgHover: "rgba(252, 238, 10, 0.1)",
    border: "#2b314e",
    borderSubtle: "#1b1f33",
    textBase: "#f4f6fc",
    textMuted: "#8a94b8",
    textDim: "#535c7a",
    accent: "#fcee0a",
    accentHover: "#e0d408",
    accentSubtle: "rgba(252, 238, 10, 0.18)",
    accentBorder: "rgba(252, 238, 10, 0.5)",
    red: "#ff007f",
    green: "#37f499",
    yellow: "#fcee0a",
  },
  "rose-pine": {
    bgApp: "#191724",
    bgHeader: "#1f1d2e",
    bgSidebar: "#1f1d2e",
    bgActivity: "#14131d",
    bgPanel: "#191724",
    bgCard: "#26233a",
    bgInput: "#2a283e",
    bgHover: "rgba(235, 188, 186, 0.1)",
    border: "#36344d",
    borderSubtle: "#2a283e",
    textBase: "#e0def4",
    textMuted: "#908caa",
    textDim: "#6e6a86",
    accent: "#ebbcba",
    accentHover: "#e0aba9",
    accentSubtle: "rgba(235, 188, 186, 0.15)",
    accentBorder: "rgba(235, 188, 186, 0.4)",
    red: "#eb6f92",
    green: "#9ccfd8",
    yellow: "#f6c177",
  },
  "tokyo-night-storm": {
    bgApp: "#24283b",
    bgHeader: "#1f2335",
    bgSidebar: "#1f2335",
    bgActivity: "#1a1b26",
    bgPanel: "#24283b",
    bgCard: "#292e42",
    bgInput: "#2f3549",
    bgHover: "rgba(122, 162, 247, 0.1)",
    border: "#3b4261",
    borderSubtle: "#292e42",
    textBase: "#c0caf5",
    textMuted: "#7982a9",
    textDim: "#565f89",
    accent: "#7aa2f7",
    accentHover: "#6991e6",
    accentSubtle: "rgba(122, 162, 247, 0.18)",
    accentBorder: "rgba(122, 162, 247, 0.45)",
    red: "#f7768e",
    green: "#9ece6a",
    yellow: "#e0af68",
  },
  "aura-dark": {
    bgApp: "#15141b",
    bgHeader: "#1b1a23",
    bgSidebar: "#1b1a23",
    bgActivity: "#111016",
    bgPanel: "#15141b",
    bgCard: "#21202e",
    bgInput: "#2b293d",
    bgHover: "rgba(162, 119, 255, 0.1)",
    border: "#36334a",
    borderSubtle: "#282538",
    textBase: "#edecee",
    textMuted: "#9a97a8",
    textDim: "#6d6a7d",
    accent: "#a277ff",
    accentHover: "#9061fa",
    accentSubtle: "rgba(162, 119, 255, 0.18)",
    accentBorder: "rgba(162, 119, 255, 0.45)",
    red: "#ff6767",
    green: "#61ffca",
    yellow: "#ffca85",
  },
  "shades-of-purple": {
    bgApp: "#2d2b55",
    bgHeader: "#222144",
    bgSidebar: "#222144",
    bgActivity: "#1a1935",
    bgPanel: "#2d2b55",
    bgCard: "#3b386e",
    bgInput: "#44417f",
    bgHover: "rgba(250, 208, 0, 0.1)",
    border: "#4d498f",
    borderSubtle: "#383569",
    textBase: "#ffffff",
    textMuted: "#b9b4e3",
    textDim: "#8b84bd",
    accent: "#fad000",
    accentHover: "#e6be00",
    accentSubtle: "rgba(250, 208, 0, 0.2)",
    accentBorder: "rgba(250, 208, 0, 0.5)",
    red: "#ff628c",
    green: "#a5ff90",
    yellow: "#fad000",
  },
  "gruvbox-dark": {
    bgApp: "#1d2021",
    bgHeader: "#282828",
    bgSidebar: "#282828",
    bgActivity: "#17191a",
    bgPanel: "#1d2021",
    bgCard: "#32302f",
    bgInput: "#3c3836",
    bgHover: "rgba(254, 128, 25, 0.1)",
    border: "#504945",
    borderSubtle: "#3c3836",
    textBase: "#ebdbb2",
    textMuted: "#a89984",
    textDim: "#7c6f64",
    accent: "#fe8019",
    accentHover: "#e06f14",
    accentSubtle: "rgba(254, 128, 25, 0.18)",
    accentBorder: "rgba(254, 128, 25, 0.45)",
    red: "#fb4934",
    green: "#b8bb26",
    yellow: "#fabd2f",
  },
  "gruvbox-light": {
    bgApp: "#fbf1c7",
    bgHeader: "#f2e5bc",
    bgSidebar: "#f2e5bc",
    bgActivity: "#ebdbb2",
    bgPanel: "#fbf1c7",
    bgCard: "#f2e5bc",
    bgInput: "#ffffff",
    bgHover: "rgba(175, 58, 3, 0.08)",
    border: "#d5c4a1",
    borderSubtle: "#ebdbb2",
    textBase: "#282828",
    textMuted: "#504945",
    textDim: "#7c6f64",
    accent: "#af3a03",
    accentHover: "#8f2f02",
    accentSubtle: "rgba(175, 58, 3, 0.12)",
    accentBorder: "rgba(175, 58, 3, 0.35)",
    red: "#9d0006",
    green: "#79740e",
    yellow: "#b57614",
  },
  "catppuccin-latte": {
    bgApp: "#eff1f5",
    bgHeader: "#e6e9ef",
    bgSidebar: "#e6e9ef",
    bgActivity: "#dce0e8",
    bgPanel: "#eff1f5",
    bgCard: "#e6e9ef",
    bgInput: "#ffffff",
    bgHover: "rgba(30, 102, 245, 0.08)",
    border: "#ccd0da",
    borderSubtle: "#bcc0cc",
    textBase: "#4c4f69",
    textMuted: "#6c6f85",
    textDim: "#8c8fa1",
    accent: "#1e66f5",
    accentHover: "#1555db",
    accentSubtle: "rgba(30, 102, 245, 0.12)",
    accentBorder: "rgba(30, 102, 245, 0.35)",
    red: "#d20f39",
    green: "#40a02b",
    yellow: "#df8e1d",
  },
  "solarized-osaka": {
    bgApp: "#101920",
    bgHeader: "#14202a",
    bgSidebar: "#14202a",
    bgActivity: "#0c1318",
    bgPanel: "#101920",
    bgCard: "#1a2936",
    bgInput: "#203342",
    bgHover: "rgba(0, 232, 198, 0.1)",
    border: "#284154",
    borderSubtle: "#1b2c39",
    textBase: "#93a1a1",
    textMuted: "#657b83",
    textDim: "#586e75",
    accent: "#00e8c6",
    accentHover: "#00cbb0",
    accentSubtle: "rgba(0, 232, 198, 0.18)",
    accentBorder: "rgba(0, 232, 198, 0.45)",
    red: "#dc322f",
    green: "#2aa198",
    yellow: "#b58900",
  },
  poimandres: {
    bgApp: "#1b1e2e",
    bgHeader: "#171926",
    bgSidebar: "#171926",
    bgActivity: "#12141f",
    bgPanel: "#1b1e2e",
    bgCard: "#25293e",
    bgInput: "#2d324b",
    bgHover: "rgba(93, 228, 199, 0.1)",
    border: "#3b4060",
    borderSubtle: "#292d43",
    textBase: "#e4f0fb",
    textMuted: "#939dbb",
    textDim: "#6b7494",
    accent: "#5de4c7",
    accentHover: "#4cd2b6",
    accentSubtle: "rgba(93, 228, 199, 0.18)",
    accentBorder: "rgba(93, 228, 199, 0.45)",
    red: "#d0679d",
    green: "#5fb9bc",
    yellow: "#fffac2",
  },
}

export const DEFAULT_THEME_ID = "vscode-dark"

export interface FontColorOption {
  id: string
  name: string
  color: string
  category: "Classic" | "Neon" | "Warm" | "Pastel"
  glow?: string
  description?: string
}

export const EDITOR_FONT_COLORS: FontColorOption[] = [
  {
    id: "default",
    name: "Original Theme Default",
    color: "default",
    category: "Classic",
    description: "Original VS Code theme syntax colors",
  },
  {
    id: "cyber-cyan",
    name: "⚡ Cyberpunk Neon Cyan",
    color: "#00f0ff",
    category: "Neon",
    glow: "rgba(0, 240, 255, 0.6)",
    description: "High-voltage electric futuristic cyan",
  },
  {
    id: "matrix-green",
    name: "🟢 Matrix Hacker Emerald",
    color: "#00ff66",
    category: "Neon",
    glow: "rgba(0, 255, 102, 0.6)",
    description: "Phosphor green terminal aesthetic",
  },
  {
    id: "royal-gold",
    name: "👑 24K Royal Gold",
    color: "#ffd700",
    category: "Warm",
    glow: "rgba(255, 215, 0, 0.6)",
    description: "Rich glowing warm gold",
  },
  {
    id: "synth-magenta",
    name: "💖 Synthwave Hot Magenta",
    color: "#ff007f",
    category: "Neon",
    glow: "rgba(255, 0, 127, 0.6)",
    description: "Retrowave 80s neon magenta",
  },
  {
    id: "glacier-blue",
    name: "❄️ Glacier Diamond Frost",
    color: "#38bdf8",
    category: "Pastel",
    glow: "rgba(56, 189, 248, 0.5)",
    description: "Crisp Arctic sky blue",
  },
  {
    id: "celestial-iris",
    name: "🪻 Celestial Pastel Iris",
    color: "#c4a7e7",
    category: "Pastel",
    glow: "rgba(196, 167, 231, 0.5)",
    description: "Dreamy aesthetic lilac iris",
  },
  {
    id: "zen-mint",
    name: "🍃 Zen Forest Turquoise",
    color: "#4eecd5",
    category: "Pastel",
    glow: "rgba(78, 236, 213, 0.5)",
    description: "Soothing eye-friendly mint",
  },
  {
    id: "sunset-flame",
    name: "🔥 Tokyo Sunset Flame",
    color: "#ff6b35",
    category: "Warm",
    glow: "rgba(255, 107, 53, 0.5)",
    description: "Vibrant fiery tangerine glow",
  },
  {
    id: "electric-violet",
    name: "🔮 Electric Amethyst",
    color: "#d946ef",
    category: "Neon",
    glow: "rgba(217, 70, 239, 0.6)",
    description: "Deep cosmic luminous purple",
  },
  {
    id: "acid-lime",
    name: "🧪 Acid Radioactive Lime",
    color: "#a3e635",
    category: "Neon",
    glow: "rgba(163, 230, 53, 0.5)",
    description: "Ultra-bright energetic lime",
  },
  {
    id: "pure-white",
    name: "⚪ High-Contrast Snow White",
    color: "#ffffff",
    category: "Classic",
    glow: "rgba(255, 255, 255, 0.4)",
    description: "Maximum contrast crisp white",
  },
  {
    id: "pitch-black",
    name: "⚫ Pitch Onyx Black",
    color: "#000000",
    category: "Classic",
    description: "Deep obsidian black for light themes",
  },
  {
    id: "retro-cream",
    name: "☕ Gruvbox Vintage Cream",
    color: "#ebdbb2",
    category: "Warm",
    description: "Warm nostalgic retro parchment",
  },
]

export function getInstalledExtensionThemes(): ThemeDefinition[] {
  try {
    const raw =
      typeof localStorage !== "undefined"
        ? localStorage.getItem("cf_installed_extensions_v1")
        : null
    if (!raw) return []
    const exts = JSON.parse(raw)
    const themes: ThemeDefinition[] = []

    for (const ext of exts) {
      if (!ext.enabled) continue

      // 1. Direct theme data in extension (e.g. from VSIX or marketplace)
      if (ext.themeData) {
        themes.push({
          id: ext.id,
          name: `${ext.displayName || ext.name} (Extension)`,
          category: ext.themeData.base === "vs" ? "light" : "dark",
          author: ext.publisher || ext.author || "VS Code Extension",
          description:
            ext.description || "Theme provided by installed VS Code extension",
          isExtensionTheme: true,
          extensionId: ext.id,
          previewColors: [
            ext.themeData.colors?.["editor.background"] || "#282a36",
            ext.themeData.colors?.["editor.selectionBackground"] || "#bd93f9",
            ext.themeData.colors?.["editor.foreground"] || "#f8f8f2",
            ext.themeData.rules?.find((r: any) => r.token === "keyword")
              ?.foreground
              ? `#${ext.themeData.rules.find((r: any) => r.token === "keyword").foreground}`
              : "#ff79c6",
          ],
          monacoTheme: ext.themeData,
        })
      }

      // 2. Known official themes alias (e.g. dracula-theme.theme-dracula or github.github-vscode-theme)
      if (ext.id === "dracula-theme.theme-dracula") {
        const builtinDracula = VSCODE_THEMES.find((t) => t.id === "dracula")
        if (builtinDracula && !themes.some((t) => t.id === ext.id)) {
          themes.push({
            ...builtinDracula,
            id: ext.id,
            name: "Dracula Official (VS Code Extension)",
            isExtensionTheme: true,
            extensionId: ext.id,
          })
        }
      }

      if (ext.id === "github.github-vscode-theme") {
        const builtinGithub = VSCODE_THEMES.find((t) => t.id === "github-dark")
        if (builtinGithub && !themes.some((t) => t.id === ext.id)) {
          themes.push({
            ...builtinGithub,
            id: ext.id,
            name: "GitHub Dark (VS Code Extension)",
            isExtensionTheme: true,
            extensionId: ext.id,
          })
        }
      }
    }

    return themes
  } catch (e) {
    console.warn("Error reading installed extension themes:", e)
    return []
  }
}

export function getAllThemes(): ThemeDefinition[] {
  const extensionThemes = getInstalledExtensionThemes()
  if (extensionThemes.length === 0) return VSCODE_THEMES

  const existingIds = new Set(VSCODE_THEMES.map((t) => t.id))
  const merged = [...VSCODE_THEMES]
  for (const extTheme of extensionThemes) {
    if (!existingIds.has(extTheme.id)) {
      merged.push(extTheme)
      existingIds.add(extTheme.id)
    }
  }
  return merged
}

export function getThemeById(themeId: string): ThemeDefinition {
  const all = getAllThemes()
  return all.find((t) => t.id === themeId) || VSCODE_THEMES[0]
}

/**
 * Normalizes ANY valid CSS color (Hex 3/6/8-digit, RGB, RGBA, HSL, HSLA, or named colors like red, cyan, lime, gold, etc.)
 * into a standard 6-digit hex string `#rrggbb`. Returns null if input is not a valid color.
 */
export function parseAnyColorToHex(input: string): string | null {
  if (!input || typeof input !== "string") return null
  const str = input.trim()
  if (!str) return null

  // 1. Direct hex checks (with or without '#')
  const hexNoHash = str.startsWith("#") ? str.slice(1) : str
  if (/^[0-9A-Fa-f]{3}$/.test(hexNoHash)) {
    return `#${hexNoHash[0]}${hexNoHash[0]}${hexNoHash[1]}${hexNoHash[1]}${hexNoHash[2]}${hexNoHash[2]}`.toLowerCase()
  }
  if (/^[0-9A-Fa-f]{6}$/.test(hexNoHash)) {
    return `#${hexNoHash}`.toLowerCase()
  }
  if (/^[0-9A-Fa-f]{8}$/.test(hexNoHash)) {
    return `#${hexNoHash.slice(0, 6)}`.toLowerCase()
  }

  // 2. Browser DOM canvas resolution for rgb(), rgba(), hsl(), hsla(), or named colors
  if (typeof document !== "undefined") {
    try {
      const canvas = document.createElement("canvas")
      canvas.width = 1
      canvas.height = 1
      const ctx = canvas.getContext("2d")
      if (ctx) {
        // Set sentinel value to test if input modifies it
        ctx.fillStyle = "#010203"
        ctx.fillStyle = str
        const computed = ctx.fillStyle
        if (computed.startsWith("#") && computed.length === 7) {
          return computed.toLowerCase()
        }
        const rgbMatch = computed.match(/\d+/g)
        if (rgbMatch && rgbMatch.length >= 3) {
          const r = parseInt(rgbMatch[0], 10).toString(16).padStart(2, "0")
          const g = parseInt(rgbMatch[1], 10).toString(16).padStart(2, "0")
          const b = parseInt(rgbMatch[2], 10).toString(16).padStart(2, "0")
          return `#${r}${g}${b}`.toLowerCase()
        }
      }
    } catch {
      // Fallback if canvas context fails
    }
  }

  return null
}

export function getActiveMonacoThemeId(
  themeId: string,
  customFontColor?: string,
  customCommentColor?: string,
): string {
  const hasCustomFont = customFontColor && customFontColor !== "default"
  const hasCustomComment =
    customCommentColor && customCommentColor !== "default"
  if (!hasCustomFont && !hasCustomComment) return themeId

  let suffix = ""
  if (hasCustomFont) {
    suffix += `-fc-${customFontColor.replace(/[^a-zA-Z0-9]/g, "")}`
  }
  if (hasCustomComment) {
    suffix += `-cc-${customCommentColor.replace(/[^a-zA-Z0-9]/g, "")}`
  }
  return `${themeId}${suffix}`
}

export function registerMonacoThemes(
  monacoInstance: any,
  customFontColor?: string,
  customCommentColor?: string,
) {
  if (!monacoInstance?.editor?.defineTheme) return
  const allThemes = getAllThemes()
  for (const theme of allThemes) {
    try {
      // 1. Register baseline theme
      monacoInstance.editor.defineTheme(theme.id, theme.monacoTheme as any)

      // 2. If customFontColor or customCommentColor is selected, register dynamic theme ID
      const hasCustomFont = customFontColor && customFontColor !== "default"
      const hasCustomComment =
        customCommentColor && customCommentColor !== "default"

      if (hasCustomFont || hasCustomComment) {
        const customThemeId = getActiveMonacoThemeId(
          theme.id,
          customFontColor,
          customCommentColor,
        )
        const clonedTheme = JSON.parse(JSON.stringify(theme.monacoTheme))

        if (hasCustomFont) {
          const cleanHex = customFontColor.startsWith("#")
            ? customFontColor.slice(1)
            : customFontColor

          clonedTheme.colors["editor.foreground"] = customFontColor
          clonedTheme.colors["editorCursor.foreground"] = customFontColor
          clonedTheme.colors["editorLineNumber.activeForeground"] =
            customFontColor

          // Update default token rule
          const defaultRule = clonedTheme.rules.find((r: any) => r.token === "")
          if (defaultRule) {
            defaultRule.foreground = cleanHex
          } else {
            clonedTheme.rules.unshift({ token: "", foreground: cleanHex })
          }

          // Apply custom color to primary code tokens
          const tokensToColor = [
            "identifier",
            "variable",
            "variable.predefined",
            "delimiter",
            "type",
            "type.identifier",
            "operator",
          ]
          for (const t of tokensToColor) {
            const existing = clonedTheme.rules.find((r: any) => r.token === t)
            if (existing) {
              existing.foreground = cleanHex
            } else {
              clonedTheme.rules.unshift({ token: t, foreground: cleanHex })
            }
          }
        }

        if (hasCustomComment) {
          const cleanCommentHex = customCommentColor.startsWith("#")
            ? customCommentColor.slice(1)
            : customCommentColor
          const commentTokens = [
            "comment",
            "comment.line",
            "comment.block",
            "comment.doc",
          ]
          for (const token of commentTokens) {
            const existing = clonedTheme.rules.find(
              (r: any) => r.token === token,
            )
            if (existing) {
              existing.foreground = cleanCommentHex
              if (!existing.fontStyle) existing.fontStyle = "italic"
            } else {
              clonedTheme.rules.push({
                token,
                foreground: cleanCommentHex,
                fontStyle: "italic",
              })
            }
          }
        }

        // Register the dynamic theme
        monacoInstance.editor.defineTheme(customThemeId, clonedTheme as any)
      }
    } catch (e) {
      console.warn(`Failed to register theme ${theme.id}:`, e)
    }
  }
}

export function getThemeUIColors(themeId: string): UIThemeColors {
  if (THEME_UI_PALETTES[themeId]) return THEME_UI_PALETTES[themeId]
  const theme = getThemeById(themeId)
  const isLight = theme.category === "light"
  const bg = theme.previewColors[0] || (isLight ? "#ffffff" : "#1e1e1e")
  const fg = theme.previewColors[2] || (isLight ? "#333333" : "#d4d4d4")
  const accent = theme.previewColors[1] || (isLight ? "#007acc" : "#7c3aed")

  return {
    id: themeId,
    name: theme.name,
    category: theme.category,
    bgApp: bg,
    bgHeader: isLight ? "#f3f4f6" : "#181824",
    bgSidebar: isLight ? "#f9fafb" : "#14141e",
    bgActivity: isLight ? "#e5e7eb" : "#0f0f17",
    bgPanel: bg,
    bgCard: isLight ? "#ffffff" : "#1f1f2e",
    bgInput: isLight ? "#f3f4f6" : "#161622",
    bgHover: isLight ? "rgba(0,0,0,0.05)" : "rgba(255,255,255,0.06)",
    border: isLight ? "#e5e7eb" : "#2d2d3f",
    borderSubtle: isLight ? "#f3f4f6" : "#232332",
    textBase: fg,
    textMuted: isLight ? "#6b7280" : "#9ca3af",
    textDim: isLight ? "#9ca3af" : "#6b7280",
    accent,
    accentHover: accent,
    accentSubtle: `${accent}22`,
    accentBorder: `${accent}55`,
    red: "#ef4444",
    green: "#22c55e",
    yellow: "#eab308",
  }
}

export function applyThemeToDocument(
  themeId: string,
  customFontColor?: string,
  customCommentColor?: string,
) {
  const theme = getThemeById(themeId)
  const colors = getThemeUIColors(themeId)
  const root = document.documentElement

  root.setAttribute("data-theme", themeId)
  root.setAttribute("data-theme-category", theme.category)

  // ── Critical Requirement: Output font color is ALWAYS black in light themes and ALWAYS white in dark themes ──
  const outputFontColor = theme.category === "light" ? "#000000" : "#ffffff"
  root.style.setProperty("--output-font-color", outputFontColor)

  if (customFontColor && customFontColor !== "default") {
    root.style.setProperty("--editor-custom-font-color", customFontColor)
  } else {
    root.style.removeProperty("--editor-custom-font-color")
  }

  if (customCommentColor && customCommentColor !== "default") {
    root.style.setProperty("--editor-custom-comment-color", customCommentColor)
  } else {
    root.style.removeProperty("--editor-custom-comment-color")
  }

  root.style.setProperty("--bg-app", colors.bgApp)
  root.style.setProperty("--bg-main", colors.bgApp)
  root.style.setProperty("--bg-header", colors.bgHeader)
  root.style.setProperty("--bg-sidebar", colors.bgSidebar)
  root.style.setProperty("--bg-activity", colors.bgActivity)
  root.style.setProperty("--bg-panel", colors.bgPanel)
  root.style.setProperty("--bg-card", colors.bgCard)
  root.style.setProperty("--bg-input", colors.bgInput)
  root.style.setProperty("--bg-hover", colors.bgHover)
  root.style.setProperty("--border", colors.border)
  root.style.setProperty("--border-subtle", colors.borderSubtle)
  root.style.setProperty("--text-base", colors.textBase)
  root.style.setProperty("--text-main", colors.textBase)
  root.style.setProperty("--text-muted", colors.textMuted)
  root.style.setProperty("--text-dim", colors.textDim)
  root.style.setProperty("--accent", colors.accent)
  root.style.setProperty("--accent-hover", colors.accentHover)
  root.style.setProperty("--accent-subtle", colors.accentSubtle)
  root.style.setProperty("--accent-border", colors.accentBorder)
  root.style.setProperty("--red", colors.red)
  root.style.setProperty("--green", colors.green)
  root.style.setProperty("--yellow", colors.yellow)
}

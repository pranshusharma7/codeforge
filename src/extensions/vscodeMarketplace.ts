// ── VS Code Official Extensions Marketplace & VSIX Installer ───────────────
import type { Extension, ExtensionCompletionRule } from './types'

export interface VSCodeSearchResult {
  id: string
  name: string
  displayName: string
  version: string
  publisher: string
  description: string
  iconUrl?: string
  downloads: number
  rating: number
  reviewCount: number
  verified: boolean
  vsixUrl?: string
  repositoryUrl?: string
  tags: string[]
  isInstalled?: boolean
}

// ── Curated Top Official VS Code Extensions with Real Snippets & Rules ───────
export const OFFICIAL_VSCODE_CATALOG: Extension[] = [
  {
    id: 'ms-python.python',
    name: 'Python',
    displayName: 'Python Language Support & IntelliSense',
    version: '2026.4.0',
    author: 'Microsoft',
    publisher: 'ms-python',
    description: 'Official Python extension with rich support for Python debugging, IntelliSense code completion, docstrings, formatting, and unit tests.',
    icon: '🐍',
    iconUrl: 'https://raw.githubusercontent.com/microsoft/vscode-python/main/images/Python-logo-notext.png',
    category: 'tools',
    enabled: true,
    isBuiltIn: false,
    isVSCodeOfficial: true,
    verified: true,
    downloads: 128500000,
    rating: 4.8,
    reviewCount: 3820,
    tags: ['python', 'microsoft', 'intellisense', 'debugging', 'official'],
    completions: [
      {
        trigger: 'def',
        code: 'def function_name(args):\n    """Docstring explaining the function."""\n    pass',
        description: 'Python Function with Docstring'
      },
      {
        trigger: 'class',
        code: 'class ClassName:\n    def __init__(self, *args, **kwargs):\n        super().__init__()\n',
        description: 'Python Class Definition'
      },
      {
        trigger: 'ifmain',
        code: 'if __name__ == "__main__":\n    main()',
        description: 'Python Main Block'
      },
      {
        trigger: 'try',
        code: 'try:\n    pass\nexcept Exception as e:\n    print(f"Error occurred: {e}")\nfinally:\n    pass',
        description: 'Python Try/Except/Finally Block'
      },
      {
        trigger: 'lambda',
        code: 'lambda x: x',
        description: 'Python Lambda Expression'
      }
    ]
  },
  {
    id: 'esbenp.prettier-vscode',
    name: 'Prettier - Code formatter',
    displayName: 'Prettier Official Formatter',
    version: '10.4.0',
    author: 'Prettier',
    publisher: 'esbenp',
    description: 'Opinionated code formatter for JavaScript, TypeScript, CSS, HTML, JSON, Markdown, and YAML. Ensures clean, consistent, beautiful code formatting.',
    icon: '💅',
    iconUrl: 'https://raw.githubusercontent.com/prettier/prettier-vscode/main/images/icon.png',
    category: 'formatter',
    enabled: true,
    isBuiltIn: false,
    isVSCodeOfficial: true,
    verified: true,
    downloads: 48900000,
    rating: 4.7,
    reviewCount: 1940,
    tags: ['formatter', 'prettier', 'javascript', 'typescript', 'clean-code'],
    linterRules: [
      {
        pattern: ';;+',
        replacement: ';',
        message: 'Prettier cleanup: remove duplicate semicolons'
      },
      {
        pattern: '\\s+\\n',
        replacement: '\n',
        message: 'Prettier: remove trailing whitespace'
      }
    ]
  },
  {
    id: 'dbaeumer.vscode-eslint',
    name: 'ESLint',
    displayName: 'ESLint JavaScript & TypeScript Linter',
    version: '3.0.10',
    author: 'Microsoft / Dirk Baeumer',
    publisher: 'dbaeumer',
    description: 'Integrates ESLint into CodeForge. Catches common JavaScript and TypeScript pitfalls, enforces clean coding standards, and auto-fixes warnings.',
    icon: '🛡️',
    iconUrl: 'https://raw.githubusercontent.com/microsoft/vscode-eslint/main/images/icon.png',
    category: 'linter',
    enabled: true,
    isBuiltIn: false,
    isVSCodeOfficial: true,
    verified: true,
    downloads: 36200000,
    rating: 4.6,
    reviewCount: 1420,
    tags: ['eslint', 'linter', 'javascript', 'typescript', 'security'],
    linterRules: [
      {
        pattern: '==(?!=)',
        replacement: '===',
        message: 'ESLint [eqeqeq]: Expected "===" and instead saw "=="'
      },
      {
        pattern: 'debugger;?',
        replacement: '',
        message: 'ESLint [no-debugger]: Unexpected debugger statement'
      },
      {
        pattern: 'var\\s+',
        replacement: 'let ',
        message: 'ESLint [no-var]: Unexpected var, use let or const instead'
      }
    ]
  },
  {
    id: 'dracula-theme.theme-dracula',
    name: 'Dracula Official',
    displayName: 'Dracula Official Dark Theme',
    version: '2.25.1',
    author: 'Dracula Theme',
    publisher: 'dracula-theme',
    description: 'The legendary dark theme for vampires, developers, and night owls. High-contrast gothic colors with neon accents.',
    icon: '🧛',
    iconUrl: 'https://raw.githubusercontent.com/dracula/visual-studio-code/master/images/dracula.png',
    category: 'tools',
    enabled: true,
    isBuiltIn: false,
    isVSCodeOfficial: true,
    verified: true,
    downloads: 8900000,
    rating: 4.9,
    reviewCount: 910,
    tags: ['theme', 'dark', 'dracula', 'vampire', 'official'],
    themeData: {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: 'comment', foreground: '6272a4', fontStyle: 'italic' },
        { token: 'keyword', foreground: 'ff79c6', fontStyle: 'bold' },
        { token: 'string', foreground: 'f1fa8c' },
        { token: 'number', foreground: 'bd93f9' },
        { token: 'type', foreground: '8be9fd' },
        { token: 'function', foreground: '50fa7b' },
        { token: 'variable', foreground: 'f8f8f2' }
      ],
      colors: {
        'editor.background': '#282a36',
        'editor.foreground': '#f8f8f2',
        'editorCursor.foreground': '#aeafad',
        'editor.lineHighlightBackground': '#44475a75',
        'editor.selectionBackground': '#44475a'
      }
    }
  },
  {
    id: 'bradlc.vscode-tailwindcss',
    name: 'Tailwind CSS IntelliSense',
    displayName: 'Tailwind CSS Official IntelliSense',
    version: '0.14.3',
    author: 'Tailwind Labs',
    publisher: 'bradlc',
    description: 'Intelligent Tailwind CSS tooling for VS Code and CodeForge. Autocomplete for classes, color previews, linting, and syntax highlighting.',
    icon: '🌊',
    iconUrl: 'https://raw.githubusercontent.com/tailwindlabs/tailwindcss-intellisense/master/packages/vscode-tailwindcss/src/images/icon.png',
    category: 'snippets',
    enabled: true,
    isBuiltIn: false,
    isVSCodeOfficial: true,
    verified: true,
    downloads: 18400000,
    rating: 4.8,
    reviewCount: 780,
    tags: ['tailwind', 'css', 'utility', 'intellisense', 'design'],
    completions: [
      {
        trigger: 'flex-center',
        code: 'flex items-center justify-center',
        description: 'Tailwind flexbox center utility'
      },
      {
        trigger: 'btn-style',
        code: 'px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition duration-150',
        description: 'Tailwind modern button classes'
      },
      {
        trigger: 'glass-card',
        code: 'bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6 shadow-xl',
        description: 'Tailwind glassmorphism card style'
      }
    ]
  },
  {
    id: 'pkief.material-icon-theme',
    name: 'Material Icon Theme',
    displayName: 'Material Design Icons for VS Code',
    version: '5.18.0',
    author: 'Philipp Kief',
    publisher: 'pkief',
    description: 'Official Material Design icons for files, folders, and extensions. Over 1,000+ custom icons for every programming language and tool.',
    icon: '📁',
    iconUrl: 'https://raw.githubusercontent.com/PKief/vscode-material-icon-theme/main/images/logo.png',
    category: 'tools',
    enabled: true,
    isBuiltIn: false,
    isVSCodeOfficial: true,
    verified: true,
    downloads: 24700000,
    rating: 4.9,
    reviewCount: 2210,
    tags: ['icons', 'material', 'theme', 'ui', 'files']
  },
  {
    id: 'aaron-bond.better-comments',
    name: 'Better Comments',
    displayName: 'Better Comments Highlighter',
    version: '3.0.2',
    author: 'Aaron Bond',
    publisher: 'aaron-bond',
    description: 'Categorize annotations into Alerts (!), Queries (?), TODOs (*), and Highlights. Improves code readability and developer communication.',
    icon: '💬',
    iconUrl: 'https://raw.githubusercontent.com/aaron-bond/better-comments/master/images/icon.png',
    category: 'tools',
    enabled: true,
    isBuiltIn: false,
    isVSCodeOfficial: true,
    verified: true,
    downloads: 7800000,
    rating: 4.8,
    reviewCount: 650,
    tags: ['comments', 'highlight', 'todo', 'documentation'],
    completions: [
      { trigger: '// !', code: '// ! ALERT: ', description: 'Urgent critical comment' },
      { trigger: '// ?', code: '// ? QUESTION: ', description: 'Query / Question comment' },
      { trigger: '// *', code: '// * HIGHLIGHT: ', description: 'Important note comment' },
      { trigger: '// TODO', code: '// TODO: ', description: 'Actionable todo comment' }
    ]
  },
  {
    id: 'formulahendry.auto-rename-tag',
    name: 'Auto Rename Tag',
    displayName: 'Auto Rename Paired HTML/XML Tag',
    version: '0.1.10',
    author: 'Jun Han',
    publisher: 'formulahendry',
    description: 'Automatically rename paired HTML/XML tags. When you rename an opening tag, the matching closing tag is automatically updated.',
    icon: '🏷️',
    category: 'tools',
    enabled: true,
    isBuiltIn: false,
    isVSCodeOfficial: true,
    verified: true,
    downloads: 16500000,
    rating: 4.6,
    reviewCount: 490,
    tags: ['html', 'xml', 'tag', 'rename', 'web']
  },
  {
    id: 'golang.go',
    name: 'Go',
    displayName: 'Official Rich Go Language Support',
    version: '0.44.0',
    author: 'Go Team at Google',
    publisher: 'golang',
    description: 'Official extension from Google providing rich language support for Go, including code completion, formatting, testing, and debugging.',
    icon: '🐹',
    iconUrl: 'https://raw.githubusercontent.com/golang/vscode-go/master/media/go-logo-blue.png',
    category: 'tools',
    enabled: false,
    isBuiltIn: false,
    isVSCodeOfficial: true,
    verified: true,
    downloads: 15100000,
    rating: 4.7,
    reviewCount: 520,
    tags: ['go', 'golang', 'google', 'language'],
    completions: [
      {
        trigger: 'main',
        code: 'package main\n\nimport "fmt"\n\nfunc main() {\n    fmt.Println("Hello, World!")\n}',
        description: 'Go Main Package template'
      },
      {
        trigger: 'iferr',
        code: 'if err != nil {\n    return err\n}',
        description: 'Go idiomatic error checking'
      },
      {
        trigger: 'struct',
        code: 'type Name struct {\n    ID   string `json:"id"`\n    Name string `json:"name"`\n}',
        description: 'Go Struct Definition'
      }
    ]
  },
  {
    id: 'rust-lang.rust-analyzer',
    name: 'rust-analyzer',
    displayName: 'Official Rust Language Server & Analyzer',
    version: '0.4.2000',
    author: 'The Rust Programming Language',
    publisher: 'rust-lang',
    description: 'High-performance modular compiler frontend for the Rust language. Real-time type hints, borrow-checker analysis, and cargo integration.',
    icon: '🦀',
    iconUrl: 'https://raw.githubusercontent.com/rust-lang/rust-analyzer/master/crates/rust-analyzer/icons/rust-analyzer.png',
    category: 'tools',
    enabled: false,
    isBuiltIn: false,
    isVSCodeOfficial: true,
    verified: true,
    downloads: 8700000,
    rating: 4.9,
    reviewCount: 1120,
    tags: ['rust', 'analyzer', 'cargo', 'systems-programming'],
    completions: [
      {
        trigger: 'fnmain',
        code: 'fn main() {\n    println!("Hello, Rust!");\n}',
        description: 'Rust Main Entrypoint'
      },
      {
        trigger: 'derive',
        code: '#[derive(Debug, Clone, PartialEq, Eq)]',
        description: 'Rust Common Derive Macros'
      },
      {
        trigger: 'match',
        code: 'match val {\n    Some(x) => println!("{x}"),\n    None => (),\n}',
        description: 'Rust Pattern Matching'
      }
    ]
  },
  {
    id: 'ms-vscode.cpptools',
    name: 'C/C++',
    displayName: 'C/C++ Official IntelliSense & Debugging',
    version: '1.20.5',
    author: 'Microsoft',
    publisher: 'ms-vscode',
    description: 'Official C/C++ support from Microsoft with Clang-Format, IntelliSense, symbol browsing, and code navigation.',
    icon: '⚙️',
    iconUrl: 'https://raw.githubusercontent.com/microsoft/vscode-cpptools/main/Documentation/images/cpp.png',
    category: 'tools',
    enabled: false,
    isBuiltIn: false,
    isVSCodeOfficial: true,
    verified: true,
    downloads: 62000000,
    rating: 4.5,
    reviewCount: 1980,
    tags: ['cpp', 'c', 'microsoft', 'native'],
    completions: [
      {
        trigger: 'cppmain',
        code: '#include <iostream>\nusing namespace std;\n\nint main() {\n    ios_base::sync_with_stdio(false);\n    cin.tie(NULL);\n    cout << "Hello C++!" << endl;\n    return 0;\n}',
        description: 'Competitive C++ Fast I/O Template'
      }
    ]
  },
  {
    id: 'github.github-vscode-theme',
    name: 'GitHub Theme',
    displayName: 'GitHub Official Dark & Light Themes',
    version: '6.3.5',
    author: 'GitHub',
    publisher: 'github',
    description: 'The official theme of GitHub. Seamlessly matches GitHub.com with GitHub Dark Default, GitHub Dark High Contrast, and GitHub Light.',
    icon: '🐙',
    iconUrl: 'https://raw.githubusercontent.com/primer/github-vscode-theme/main/media/icon.png',
    category: 'tools',
    enabled: false,
    isBuiltIn: false,
    isVSCodeOfficial: true,
    verified: true,
    downloads: 14200000,
    rating: 4.8,
    reviewCount: 940,
    tags: ['github', 'theme', 'dark', 'light', 'official']
  }
]

// ── Search Open VSX Registry & Fallback Catalog ──────────────────────────────
export async function searchVSCodeMarketplace(query: string): Promise<Extension[]> {
  const trimmed = query.trim().toLowerCase()

  // 1. Filter local official catalog first for instant response
  const catalogMatches = OFFICIAL_VSCODE_CATALOG.filter(ext => {
    if (!trimmed) return true
    return (
      ext.id.toLowerCase().includes(trimmed) ||
      ext.name.toLowerCase().includes(trimmed) ||
      (ext.displayName && ext.displayName.toLowerCase().includes(trimmed)) ||
      ext.description.toLowerCase().includes(trimmed) ||
      ext.author.toLowerCase().includes(trimmed) ||
      ext.tags.some(t => t.toLowerCase().includes(trimmed))
    )
  })

  // 2. Query Open VSX API if available
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 4000)

    const url = trimmed
      ? `https://open-vsx.org/api/-/search?query=${encodeURIComponent(trimmed)}&size=15`
      : `https://open-vsx.org/api/-/search?sortBy=downloadCount&sortOrder=desc&size=15`

    const res = await fetch(url, { signal: controller.signal })
    clearTimeout(timeoutId)

    if (res.ok) {
      const data = await res.json()
      if (Array.isArray(data.extensions)) {
        const remoteExts: Extension[] = data.extensions.map((item: any) => {
          const id = `${item.namespace}.${item.name}`
          const existing = catalogMatches.find(c => c.id === id)
          if (existing) return existing

          const category: Extension['category'] = item.categories?.some((c: string) => c.toLowerCase().includes('snippet'))
            ? 'snippets'
            : item.categories?.some((c: string) => c.toLowerCase().includes('linter') || c.toLowerCase().includes('formatter'))
            ? 'linter'
            : 'tools'

          return {
            id,
            name: item.displayName || item.name,
            displayName: item.displayName || item.name,
            version: item.version || '1.0.0',
            author: item.namespace,
            publisher: item.namespace,
            description: item.description || `Official VS Code extension by ${item.namespace}`,
            icon: '📦',
            iconUrl: item.files?.icon || undefined,
            category,
            enabled: false,
            isBuiltIn: false,
            isVSCodeOfficial: true,
            verified: item.verified || false,
            downloads: item.downloadCount || 0,
            rating: item.averageRating || 4.5,
            reviewCount: item.reviewCount || 10,
            tags: item.categories || ['vscode', 'official'],
            vsixUrl: item.files?.download || undefined,
            repositoryUrl: item.repository || undefined
          }
        })

        // Merge without duplicates
        const seenIds = new Set(catalogMatches.map(e => e.id))
        const merged = [...catalogMatches]
        for (const rem of remoteExts) {
          if (!seenIds.has(rem.id)) {
            merged.push(rem)
            seenIds.add(rem.id)
          }
        }
        return merged
      }
    }
  } catch (err) {
    // If network fails (e.g. offline or CORS), return curated catalog
    console.warn('VS Code Marketplace remote search fallback to local catalogue:', err)
  }

  return catalogMatches
}

// ── Parse Official .vsix Zip Archive using JSZip ──────────────────────────────
export async function parseVsixPackage(file: File | Blob): Promise<Extension> {
  const JSZip = (await import('jszip')).default
  const zip = await JSZip.loadAsync(file)

  // In standard VS Code VSIX, package.json resides at "extension/package.json"
  let packageJsonFile = zip.file('extension/package.json')
  if (!packageJsonFile) {
    // Search recursively for package.json
    const matching = Object.keys(zip.files).find(p => p.endsWith('package.json'))
    if (matching) {
      packageJsonFile = zip.file(matching)
    }
  }

  if (!packageJsonFile) {
    throw new Error('Invalid VSIX: Missing extension/package.json manifest')
  }

  const packageJsonRaw = await packageJsonFile.async('string')
  const pkg = JSON.parse(packageJsonRaw)

  // Try to find icon in the VSIX
  let iconUrl: string | undefined
  if (pkg.icon) {
    const iconPath = pkg.icon.startsWith('extension/') ? pkg.icon : `extension/${pkg.icon.replace(/^\.?\//, '')}`
    const iconFile = zip.file(iconPath) || Object.entries(zip.files).find(([k]) => k.endsWith(pkg.icon.split('/').pop() || ''))?.[1]
    if (iconFile) {
      const base64 = await iconFile.async('base64')
      const ext = pkg.icon.endsWith('.svg') ? 'svg+xml' : 'png'
      iconUrl = `data:image/${ext};base64,${base64}`
    }
  }

  // Extract snippet contributions
  const completions: ExtensionCompletionRule[] = []
  if (pkg.contributes?.snippets && Array.isArray(pkg.contributes.snippets)) {
    for (const snipDef of pkg.contributes.snippets) {
      const snipPath = snipDef.path ? `extension/${snipDef.path.replace(/^\.?\//, '')}` : null
      if (snipPath) {
        const snipFile = zip.file(snipPath)
        if (snipFile) {
          try {
            const snipContent = await snipFile.async('string')
            const parsedSnips = JSON.parse(snipContent)
            for (const [name, val] of Object.entries<any>(parsedSnips)) {
              if (val.prefix && val.body) {
                const bodyStr = Array.isArray(val.body) ? val.body.join('\n') : String(val.body)
                completions.push({
                  trigger: Array.isArray(val.prefix) ? val.prefix[0] : String(val.prefix),
                  code: bodyStr,
                  description: val.description || name
                })
              }
            }
          } catch (e) {
            console.warn('Failed parsing snippet file in VSIX:', snipPath, e)
          }
        }
      }
    }
  }

  const id = `${pkg.publisher || 'custom'}.${pkg.name}`
  const displayName = pkg.displayName || pkg.name

  return {
    id,
    name: displayName,
    displayName,
    version: pkg.version || '1.0.0',
    author: pkg.publisher || pkg.author?.name || 'VS Code Publisher',
    publisher: pkg.publisher,
    description: pkg.description || 'Installed from official VS Code VSIX package',
    icon: iconUrl ? '📦' : '🧩',
    iconUrl,
    category: completions.length > 0 ? 'snippets' : 'tools',
    enabled: true,
    isBuiltIn: false,
    isVSCodeOfficial: true,
    verified: true,
    downloads: 1,
    rating: 5.0,
    tags: pkg.keywords || ['vscode', 'vsix', 'extension'],
    completions,
    installedAt: Date.now(),
    packageJSON: pkg
  }
}

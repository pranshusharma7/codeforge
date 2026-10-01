import type { Extension } from './types'

const STORAGE_KEY = 'cf_installed_extensions_v1'

export const BUILT_IN_EXTENSIONS: Extension[] = [
  {
    id: 'antigravity-ai-copilot',
    name: 'AntiGravity AI Copilot',
    version: '2.4.0',
    author: 'DeepMind / AntiGravity Team',
    description: 'AI-powered next-line code detection & ghost autocomplete. Predicts what code comes next as you type - press Tab to accept (just like Anti Gravity).',
    icon: '✦',
    category: 'ai',
    enabled: true,
    isBuiltIn: true,
    downloads: 142000,
    rating: 4.9,
    tags: ['ai', 'copilot', 'autocomplete', 'tab-complete', 'ghost-text']
  },
  {
    id: 'smart-autocorrect',
    name: 'Smart Auto-Correct & Linter',
    version: '1.8.2',
    author: 'CodeForge DevTools',
    description: 'Detects typos (e.g. prnit -> print, fucntion -> function), missing colons in Python, unclosed quotes, and syntax errors with instant auto-fix.',
    icon: '🪄',
    category: 'linter',
    enabled: true,
    isBuiltIn: true,
    downloads: 98000,
    rating: 4.8,
    tags: ['autocorrect', 'linter', 'syntax', 'clean-code']
  },
  {
    id: 'bracket-pair-colorizer',
    name: 'Bracket Pair Colorizer Pro',
    version: '2.0.1',
    author: 'CoenraadS',
    description: 'Colorizes matching brackets, braces, and parentheses with vibrant alternating rainbow colors for instant visual hierarchy.',
    icon: '{ }',
    category: 'tools',
    enabled: true,
    isBuiltIn: true,
    downloads: 320000,
    rating: 4.9,
    tags: ['brackets', 'colors', 'rainbow', 'editor']
  },
  {
    id: 'algo-snippets',
    name: 'LeetCode & DSA Algorithm Snippets',
    version: '3.1.0',
    author: 'Competitive Programmers Guild',
    description: 'Fast algorithm boilerplates: Binary Search, DFS/BFS, Dijkstra, QuickSort, Two Pointers, and Dynamic Programming templates.',
    icon: '⚡',
    category: 'snippets',
    enabled: true,
    isBuiltIn: true,
    downloads: 87000,
    rating: 4.7,
    tags: ['dsa', 'leetcode', 'algorithms', 'snippets', 'templates'],
    completions: [
      {
        trigger: 'bs',
        code: 'def binary_search(arr, target):\n    l, r = 0, len(arr) - 1\n    while l <= r:\n        mid = (l + r) // 2\n        if arr[mid] == target:\n            return mid\n        elif arr[mid] < target:\n            l = mid + 1\n        else:\n            r = mid - 1\n    return -1',
        description: 'Binary Search Algorithm (Python)'
      },
      {
        trigger: 'bfs',
        code: 'from collections import deque\ndef bfs(start, graph):\n    visited = {start}\n    queue = deque([start])\n    while queue:\n        node = queue.popleft()\n        for neighbor in graph[node]:\n            if neighbor not in visited:\n                visited.add(neighbor)\n                queue.append(neighbor)',
        description: 'Breadth First Search (BFS) template'
      }
    ]
  },
  {
    id: 'docstring-generator',
    name: 'Auto Docstring & JSDoc AI',
    version: '1.2.0',
    author: 'CodeForge AI Labs',
    description: 'Generates comprehensive documentation, parameter types, return values, and usage examples for any function.',
    icon: '📝',
    category: 'ai',
    enabled: false,
    isBuiltIn: true,
    downloads: 45000,
    rating: 4.6,
    tags: ['docstring', 'documentation', 'jsdoc', 'ai']
  }
]

export function getInstalledExtensions(): Extension[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      saveInstalledExtensions(BUILT_IN_EXTENSIONS)
      return BUILT_IN_EXTENSIONS
    }
    const parsed: Extension[] = JSON.parse(raw)
    // Merge any newly introduced built-in extensions
    const existingIds = new Set(parsed.map(e => e.id))
    let updated = [...parsed]
    for (const b of BUILT_IN_EXTENSIONS) {
      if (!existingIds.has(b.id)) {
        updated.push(b)
      }
    }
    return updated
  } catch (e) {
    console.error('Failed to load extensions from storage:', e)
    return BUILT_IN_EXTENSIONS
  }
}

export function saveInstalledExtensions(extensions: Extension[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(extensions))
  } catch (e) {
    console.error('Failed to save extensions to storage:', e)
  }
}

export function toggleExtensionState(id: string): Extension[] {
  const current = getInstalledExtensions()
  const updated = current.map(ext =>
    ext.id === id ? { ...ext, enabled: !ext.enabled } : ext
  )
  saveInstalledExtensions(updated)
  return updated
}

export function addCustomExtension(extensionData: Partial<Extension>): Extension[] {
  const current = getInstalledExtensions()
  const id = extensionData.id || `custom-${Date.now()}`
  
  const newExt: Extension = {
    id,
    name: extensionData.name || 'Custom Extension',
    version: extensionData.version || '1.0.0',
    author: extensionData.author || 'User',
    description: extensionData.description || 'Custom user uploaded extension',
    icon: extensionData.icon || '🧩',
    category: extensionData.category || 'custom',
    enabled: true,
    isBuiltIn: false,
    downloads: 1,
    rating: 5.0,
    tags: extensionData.tags || ['custom', 'plugin'],
    completions: extensionData.completions || [],
    linterRules: extensionData.linterRules || [],
    installedAt: Date.now()
  }

  // Replace if exists or append
  const exists = current.some(e => e.id === id)
  const updated = exists ? current.map(e => e.id === id ? newExt : e) : [newExt, ...current]
  saveInstalledExtensions(updated)
  return updated
}

export function removeExtension(id: string): Extension[] {
  const current = getInstalledExtensions()
  const updated = current.filter(e => e.id !== id)
  saveInstalledExtensions(updated)
  return updated
}

export function isExtensionEnabled(id: string, extensions: Extension[]): boolean {
  const found = extensions.find(e => e.id === id)
  return found ? found.enabled : false
}

export function generateSampleExtensionJSON(): string {
  const sample: Partial<Extension> = {
    id: 'my-custom-assistant',
    name: 'My Custom Code Assistant',
    version: '1.0.0',
    author: 'Developer',
    description: 'Custom snippets and auto-completions for my daily workflow.',
    icon: '🚀',
    category: 'custom',
    tags: ['custom', 'productivity'],
    completions: [
      {
        trigger: 'log',
        code: "console.log('DEBUG:', )",
        description: 'Quick debug logger'
      },
      {
        trigger: 'fori',
        code: 'for (let i = 0; i < n; i++) {\n  \n}',
        description: 'Standard for loop'
      }
    ],
    linterRules: [
      {
        pattern: 'consle.log',
        replacement: 'console.log',
        message: 'Fixed typo: consle -> console'
      }
    ]
  }
  return JSON.stringify(sample, null, 2)
}

// ── Official VS Code Snippets & Language Extensions Completion Provider ──────
import type { Extension } from './types'

export function registerLanguageSnippets(
  monacoInstance: any,
  extensions: Extension[]
): { dispose: () => void }[] {
  if (!monacoInstance?.languages?.registerCompletionItemProvider) return []
  const disposables: { dispose: () => void }[] = []

  const isEnabled = (id: string) => {
    const ext = extensions.find(e => e.id === id)
    return ext ? ext.enabled : false
  }

  // 1. Official Python Language Support Snippets
  if (isEnabled('ms-python.python')) {
    const pythonSnippets = [
      {
        label: 'def',
        insertText: 'def ${1:function_name}(${2:args}):\n    """${3:Docstring}"""\n    ${0:pass}',
        detail: 'Python Function with Docstring (ms-python.python)'
      },
      {
        label: 'class',
        insertText: 'class ${1:ClassName}:\n    def __init__(self, ${2:*args}, ${3:**kwargs}):\n        super().__init__()\n        ${0:pass}',
        detail: 'Python Class Definition (ms-python.python)'
      },
      {
        label: 'ifmain',
        insertText: 'if __name__ == "__main__":\n    ${0:main()}',
        detail: 'Python Main Block Boilerplate'
      },
      {
        label: 'try',
        insertText: 'try:\n    ${1:pass}\nexcept ${2:Exception} as e:\n    print(f"Error: {e}")\nfinally:\n    ${0:pass}',
        detail: 'Python Try / Except / Finally Block'
      },
      {
        label: 'lambda',
        insertText: 'lambda ${1:x}: ${0:x}',
        detail: 'Python Anonymous Lambda Function'
      },
      {
        label: 'listcomp',
        insertText: '[${1:x} for ${1:x} in ${2:iterable} if ${3:condition}]',
        detail: 'Python List Comprehension'
      },
      {
        label: 'dictcomp',
        insertText: '{${1:key}: ${2:value} for ${1:key}, ${2:value} in ${3:iterable}}',
        detail: 'Python Dict Comprehension'
      }
    ]

    disposables.push(
      monacoInstance.languages.registerCompletionItemProvider('python', {
        provideCompletionItems: () => ({
          suggestions: pythonSnippets.map(s => ({
            label: s.label,
            kind: monacoInstance.languages.CompletionItemKind.Snippet,
            insertText: s.insertText,
            insertTextRules: monacoInstance.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            detail: s.detail
          }))
        })
      })
    )
  }

  // 2. Official Go Language Support Snippets
  if (isEnabled('golang.go')) {
    const goSnippets = [
      {
        label: 'main',
        insertText: 'package main\n\nimport "fmt"\n\nfunc main() {\n    fmt.Println("${1:Hello, World!}")\n}',
        detail: 'Go Main Package Template (golang.go)'
      },
      {
        label: 'iferr',
        insertText: 'if err != nil {\n    return ${1:err}\n}',
        detail: 'Go Idiomatic Error Handling'
      },
      {
        label: 'struct',
        insertText: 'type ${1:Name} struct {\n    ${2:ID}   ${3:string} `json:"${4:id}"`\n}',
        detail: 'Go Struct Definition'
      },
      {
        label: 'func',
        insertText: 'func ${1:name}(${2:params}) ${3:error} {\n    ${0:return nil}\n}',
        detail: 'Go Function Declaration'
      }
    ]

    disposables.push(
      monacoInstance.languages.registerCompletionItemProvider('go', {
        provideCompletionItems: () => ({
          suggestions: goSnippets.map(s => ({
            label: s.label,
            kind: monacoInstance.languages.CompletionItemKind.Snippet,
            insertText: s.insertText,
            insertTextRules: monacoInstance.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            detail: s.detail
          }))
        })
      })
    )
  }

  // 3. Official Rust Language Support Snippets
  if (isEnabled('rust-lang.rust-analyzer')) {
    const rustSnippets = [
      {
        label: 'fnmain',
        insertText: 'fn main() {\n    println!("${1:Hello, Rust!}");\n}',
        detail: 'Rust Main Entrypoint (rust-analyzer)'
      },
      {
        label: 'derive',
        insertText: '#[derive(Debug, Clone, PartialEq, Eq)]',
        detail: 'Rust Common Derive Macros'
      },
      {
        label: 'match',
        insertText: 'match ${1:val} {\n    Some(${2:x}) => println!("{}", ${2:x}),\n    None => (),\n}',
        detail: 'Rust Pattern Matching'
      }
    ]

    disposables.push(
      monacoInstance.languages.registerCompletionItemProvider('rust', {
        provideCompletionItems: () => ({
          suggestions: rustSnippets.map(s => ({
            label: s.label,
            kind: monacoInstance.languages.CompletionItemKind.Snippet,
            insertText: s.insertText,
            insertTextRules: monacoInstance.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            detail: s.detail
          }))
        })
      })
    )
  }

  // 4. Official C/C++ Support Snippets
  if (isEnabled('ms-vscode.cpptools')) {
    const cppSnippets = [
      {
        label: 'cppmain',
        insertText: '#include <iostream>\nusing namespace std;\n\nint main() {\n    ios_base::sync_with_stdio(false);\n    cin.tie(NULL);\n    cout << "${1:Hello, C++!}\\n";\n    return 0;\n}',
        detail: 'C++ Fast I/O Template (ms-vscode.cpptools)'
      },
      {
        label: 'vector',
        insertText: 'vector<${1:int}> ${2:v}(${3:n}, ${4:0});',
        detail: 'C++ Vector Initialization'
      },
      {
        label: 'sort',
        insertText: 'sort(${1:v}.begin(), ${1:v}.end());',
        detail: 'C++ STL Sort'
      }
    ]

    disposables.push(
      monacoInstance.languages.registerCompletionItemProvider('cpp', {
        provideCompletionItems: () => ({
          suggestions: cppSnippets.map(s => ({
            label: s.label,
            kind: monacoInstance.languages.CompletionItemKind.Snippet,
            insertText: s.insertText,
            insertTextRules: monacoInstance.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            detail: s.detail
          }))
        })
      })
    )
  }

  // 5. Official Tailwind CSS IntelliSense Snippets
  if (isEnabled('bradlc.vscode-tailwindcss')) {
    const tailwindSnippets = [
      { label: 'flex-center', insertText: 'flex items-center justify-center', detail: 'Tailwind Flexbox Center' },
      { label: 'btn-style', insertText: 'px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition', detail: 'Tailwind Button Classes' },
      { label: 'glass-card', insertText: 'bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6 shadow-xl', detail: 'Tailwind Glassmorphism' },
      { label: 'grid-responsive', insertText: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6', detail: 'Tailwind Responsive Grid' }
    ]

    const targetLangs = ['html', 'javascript', 'typescript', 'css']
    for (const lang of targetLangs) {
      disposables.push(
        monacoInstance.languages.registerCompletionItemProvider(lang, {
          provideCompletionItems: () => ({
            suggestions: tailwindSnippets.map(s => ({
              label: s.label,
              kind: monacoInstance.languages.CompletionItemKind.Property,
              insertText: s.insertText,
              detail: s.detail
            }))
          })
        })
      )
    }
  }

  // 6. Better Comments Snippets
  if (isEnabled('aaron-bond.better-comments')) {
    const commentSnippets = [
      { label: '// !', insertText: '// ! ALERT: ${0}', detail: 'Better Comments: Urgent Alert' },
      { label: '// ?', insertText: '// ? QUESTION: ${0}', detail: 'Better Comments: Query / Question' },
      { label: '// *', insertText: '// * HIGHLIGHT: ${0}', detail: 'Better Comments: Important Note' },
      { label: '// TODO', insertText: '// TODO: ${0}', detail: 'Better Comments: Actionable TODO' }
    ]

    disposables.push(
      monacoInstance.languages.registerCompletionItemProvider('*', {
        provideCompletionItems: () => ({
          suggestions: commentSnippets.map(s => ({
            label: s.label,
            kind: monacoInstance.languages.CompletionItemKind.Snippet,
            insertText: s.insertText,
            insertTextRules: monacoInstance.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            detail: s.detail
          }))
        })
      })
    )
  }

  // 7. Dynamic Custom & Uploaded VSIX Extension Snippets
  const activeCustomCompletions = extensions.filter(e => e.enabled).flatMap(e => e.completions || [])
  if (activeCustomCompletions.length > 0) {
    disposables.push(
      monacoInstance.languages.registerCompletionItemProvider('*', {
        provideCompletionItems: () => ({
          suggestions: activeCustomCompletions.map(c => ({
            label: c.trigger,
            kind: monacoInstance.languages.CompletionItemKind.Snippet,
            insertText: c.code,
            detail: c.description || 'Custom Extension Snippet'
          }))
        })
      })
    )
  }

  return disposables
}

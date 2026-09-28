export interface WebTabItem {
  id: string
  name: string
  lang: string
  code: string
}

/**
 * Assembles a complete, standalone HTML document from workspace tabs
 * automatically connecting HTML, CSS, and JS files.
 */
export function assembleWebProject(activeTab: WebTabItem, allTabs: WebTabItem[]): { html: string; fileName: string } {
  // 1. Determine which tab is the HTML entrypoint
  const isHtml = (t: WebTabItem) =>
    t.lang === 'html' ||
    t.name.toLowerCase().endsWith('.html') ||
    t.name.toLowerCase().endsWith('.htm')

  let htmlTab = isHtml(activeTab) ? activeTab : allTabs.find(isHtml)

  // If no HTML tab found in workspace, create an HTML skeleton using the active code
  if (!htmlTab) {
    if (activeTab.lang === 'css' || activeTab.name.endsWith('.css')) {
      return {
        html: `<!DOCTYPE html>\n<html>\n<head>\n<meta charset="utf-8">\n<style>${activeTab.code}</style>\n</head>\n<body>\n<h1>CSS Preview: ${activeTab.name}</h1>\n<p>Add an index.html file to view full design.</p>\n</body>\n</html>`,
        fileName: activeTab.name,
      }
    }
    if (activeTab.lang === 'javascript' || activeTab.name.endsWith('.js')) {
      return {
        html: `<!DOCTYPE html>\n<html>\n<head>\n<meta charset="utf-8">\n</head>\n<body>\n<h1>JS Preview: ${activeTab.name}</h1>\n<div id="app"></div>\n<script>${activeTab.code}</script>\n</body>\n</html>`,
        fileName: activeTab.name,
      }
    }
    return { html: activeTab.code || '', fileName: activeTab.name }
  }

  let rawHtml = htmlTab.code || ''
  const matchedCssFiles = new Set<string>()
  const matchedJsFiles = new Set<string>()

  const findTab = (filename: string) => {
    const clean = filename.replace(/^(\.\/|\/)/, '').toLowerCase().trim()
    return allTabs.find(t => t.name.toLowerCase().trim() === clean || t.name.toLowerCase().endsWith('/' + clean))
  }

  // 2. Replace <link rel="stylesheet" href="..."> with inlined styles
  const linkRegex = /<link\s+[^>]*href=["']([^"']+\.css)["'][^>]*>/gi
  rawHtml = rawHtml.replace(linkRegex, (fullMatch, href) => {
    const matched = findTab(href)
    if (matched) {
      matchedCssFiles.add(matched.name.toLowerCase())
      return `<style data-source="${matched.name}">\n/* Inlined from ${matched.name} */\n${matched.code}\n</style>`
    }
    return fullMatch
  })

  // 3. Replace <script src="..."> with inlined scripts
  const scriptRegex = /<script\s+[^>]*src=["']([^"']+\.js)["'][^>]*>\s*<\/script>/gi
  rawHtml = rawHtml.replace(scriptRegex, (fullMatch, src) => {
    const matched = findTab(src)
    if (matched) {
      matchedJsFiles.add(matched.name.toLowerCase())
      return `<script data-source="${matched.name}">\n/* Inlined from ${matched.name} */\n${matched.code}\n</script>`
    }
    return fullMatch
  })

  // 4. Auto-inject any remaining .css workspace files not explicitly linked
  const extraCssTabs = allTabs.filter(
    t => (t.lang === 'css' || t.name.toLowerCase().endsWith('.css')) && !matchedCssFiles.has(t.name.toLowerCase())
  )
  const extraStyles = extraCssTabs
    .map(t => `<style data-workspace="${t.name}">\n/* Auto-connected from workspace: ${t.name} */\n${t.code}\n</style>`)
    .join('\n')

  // 5. Auto-inject any remaining .js workspace files not explicitly linked (excluding test files)
  const extraJsTabs = allTabs.filter(
    t =>
      (t.lang === 'javascript' || t.name.toLowerCase().endsWith('.js')) &&
      !matchedJsFiles.has(t.name.toLowerCase()) &&
      !t.name.toLowerCase().includes('.test.') &&
      !t.name.toLowerCase().includes('.spec.')
  )
  const extraScripts = extraJsTabs
    .map(t => `<script data-workspace="${t.name}">\n/* Auto-connected from workspace: ${t.name} */\n${t.code}\n</script>`)
    .join('\n')

  // 6. Assemble complete document structure
  if (rawHtml.includes('</head>')) {
    rawHtml = rawHtml.replace('</head>', `${extraStyles}\n</head>`)
  } else if (rawHtml.includes('<body')) {
    rawHtml = rawHtml.replace('<body', `${extraStyles}\n<body`)
  } else {
    rawHtml = `<style>${extraStyles}</style>\n${rawHtml}`
  }

  if (rawHtml.includes('</body>')) {
    rawHtml = rawHtml.replace('</body>', `${extraScripts}\n</body>`)
  } else {
    rawHtml = `${rawHtml}\n${extraScripts}`
  }

  if (!rawHtml.toLowerCase().includes('<!doctype html>')) {
    rawHtml = `<!DOCTYPE html>\n<html>\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1.0">\n<title>${htmlTab.name}</title>\n</head>\n<body>\n${rawHtml}\n</body>\n</html>`
  }

  return { html: rawHtml, fileName: htmlTab.name }
}

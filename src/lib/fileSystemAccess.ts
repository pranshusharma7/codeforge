/**
 * Native File System Access API utilities for CodeForge.
 * Enables direct read/write to local disk files and folders just like VS Code!
 */

export interface LocalDiskFile {
  name: string
  path: string
  content: string
  handle: FileSystemFileHandle
}

export function isFileSystemAccessSupported(): boolean {
  return typeof window !== 'undefined' && 'showOpenFilePicker' in window
}

/**
 * Open one or more files directly from the user's local disk
 */
export async function openFilesFromDisk(): Promise<LocalDiskFile[]> {
  if (!isFileSystemAccessSupported()) {
    throw new Error('File System Access API is not supported in this browser. Please use Chrome, Edge, or Opera.')
  }

  const handles = await (window as any).showOpenFilePicker({
    multiple: true,
    types: [
      {
        description: 'Code & Text Files',
        accept: {
          'text/*': [
            '.js', '.jsx', '.ts', '.tsx', '.mjs', '.cjs',
            '.py', '.java', '.c', '.cpp', '.h', '.hpp', '.cs',
            '.go', '.rs', '.php', '.rb', '.swift', '.kt',
            '.html', '.htm', '.css', '.scss', '.sass', '.less',
            '.json', '.jsonc', '.yaml', '.yml', '.toml', '.xml',
            '.md', '.markdown', '.txt', '.sql', '.sh', '.bash', '.zsh',
            '.env', '.gitignore', '.dockerignore',
          ],
        },
      },
      {
        description: 'All Files',
        accept: { '*/*': [] },
      },
    ],
  })

  const results: LocalDiskFile[] = []
  for (const handle of handles) {
    const file = await handle.getFile()
    const content = await file.text()
    results.push({
      name: file.name,
      path: file.name,
      content,
      handle,
    })
  }

  return results
}

/**
 * Open an entire folder directly from local disk, preserving handles for every file
 */
export async function openDirectoryFromDisk(): Promise<{ folderName: string; files: LocalDiskFile[]; folders: string[] }> {
  if (typeof window === 'undefined' || !('showDirectoryPicker' in window)) {
    throw new Error('Directory Picker API is not supported in this browser.')
  }

  const dirHandle = await (window as any).showDirectoryPicker({
    mode: 'readwrite',
  })

  const files: LocalDiskFile[] = []
  const folderSet = new Set<string>()

  const isCodeFile = (name: string) => {
    if (name.startsWith('.') && name !== '.env' && name !== '.gitignore') return false
    const lower = name.toLowerCase()
    const binaryExts = ['.png', '.jpg', '.jpeg', '.gif', '.ico', '.svg', '.webp', '.pdf', '.zip', '.tar', '.gz', '.mp4', '.mp3', '.exe', '.bin', '.wasm']
    if (binaryExts.some(ext => lower.endsWith(ext))) return false
    return true
  }

  const shouldSkipDir = (name: string) => {
    return ['node_modules', '.git', 'dist', 'build', '.next', '.cache', '__pycache__', '.vscode', '.idea'].includes(name)
  }

  async function scanDirectory(currentHandle: any, currentPath = '') {
    for await (const entry of currentHandle.values()) {
      if (entry.kind === 'file') {
        if (isCodeFile(entry.name)) {
          try {
            const file = await entry.getFile()
            // Ignore files larger than 5MB to avoid freeze
            if (file.size < 5 * 1024 * 1024) {
              const content = await file.text()
              const relPath = currentPath ? `${currentPath}/${entry.name}` : entry.name
              files.push({
                name: relPath,
                path: relPath,
                content,
                handle: entry,
              })
            }
          } catch (e) {
            console.warn('Could not read file', entry.name, e)
          }
        }
      } else if (entry.kind === 'directory') {
        if (!shouldSkipDir(entry.name)) {
          const subPath = currentPath ? `${currentPath}/${entry.name}` : entry.name
          folderSet.add(subPath)
          await scanDirectory(entry, subPath)
        }
      }
    }
  }

  await scanDirectory(dirHandle)

  return {
    folderName: dirHandle.name,
    files,
    folders: Array.from(folderSet),
  }
}

/**
 * Save code directly to a file handle on local disk without prompting
 */
export async function saveToLocalDisk(handle: FileSystemFileHandle, content: string): Promise<void> {
  // Check or request write permission
  let perm = await (handle as any).queryPermission?.({ mode: 'readwrite' })
  if (perm !== 'granted') {
    perm = await (handle as any).requestPermission?.({ mode: 'readwrite' })
  }
  if (perm && perm !== 'granted') {
    throw new Error('Permission to write to file was not granted.')
  }

  const writable = await (handle as any).createWritable()
  await writable.write(content)
  await writable.close()
}

/**
 * Save As: Prompt user to choose where to save a file on local disk, returns new handle
 */
export async function saveAsLocalDisk(suggestedName: string, content: string): Promise<FileSystemFileHandle> {
  if (typeof window === 'undefined' || !('showSaveFilePicker' in window)) {
    throw new Error('Save File Picker is not supported in this browser.')
  }

  const handle = await (window as any).showSaveFilePicker({
    suggestedName,
    types: [
      {
        description: 'Code & Text Files',
        accept: {
          'text/*': ['.js', '.jsx', '.ts', '.tsx', '.py', '.java', '.cpp', '.c', '.html', '.css', '.json', '.md', '.txt'],
        },
      },
    ],
  })

  await saveToLocalDisk(handle, content)
  return handle
}

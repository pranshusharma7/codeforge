import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  FileText,
  Copy,
  Check,
  Eye,
  Code,
  ExternalLink,
  BookOpen,
  Sparkles,
  Globe,
} from 'lucide-react';
import { parseGitHubMarkdown } from '../lib/githubMarkdown';
import { openGitHubWebpage } from '../lib/githubWebpageGenerator';

interface GitHubMarkdownPreviewProps {
  markdown: string;
  fileName?: string;
  repoName?: string;
  username?: string;
  avatarUrl?: string;
  onOpenRawEditor?: () => void;
  className?: string;
}

export const GitHubMarkdownPreview: React.FC<GitHubMarkdownPreviewProps> = ({
  markdown,
  fileName = 'README.md',
  repoName = 'codeforge-project',
  username = 'developer',
  avatarUrl = 'https://github.com/identicons/app.png',
  onOpenRawEditor,
  className = '',
}) => {
  const [viewMode, setViewMode] = useState<'preview' | 'raw'>('preview');
  const [copied, setCopied] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Compute parsed HTML safely
  const parsedHtml = useMemo(() => {
    return parseGitHubMarkdown(markdown);
  }, [markdown]);

  // Compute file metadata
  const stats = useMemo(() => {
    const lines = markdown ? markdown.split('\n').length : 0;
    const bytes = new Blob([markdown || '']).size;
    const kb = (bytes / 1024).toFixed(1);
    const words = markdown ? markdown.trim().split(/\s+/).length : 0;
    const readMin = Math.max(1, Math.ceil(words / 200));
    return { lines, bytes, kb, words, readMin };
  }, [markdown]);

  // Handle Copy Raw Markdown
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(markdown);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  // Handle popout to full authentic GitHub web page in a new browser tab
  const handlePopout = () => {
    openGitHubWebpage({
      markdown,
      fileName,
      repoName,
      username,
      avatarUrl,
    });
  };

  // Wire up code block copy buttons inside the rendered HTML
  useEffect(() => {
    if (!containerRef.current) return;

    const copyButtons = containerRef.current.querySelectorAll('.gh-copy-code-btn');
    const handlers: { btn: Element; handler: () => void }[] = [];

    copyButtons.forEach((btn) => {
      const codeData = btn.getAttribute('data-code');
      if (!codeData) return;

      const handler = async () => {
        try {
          const raw = decodeURIComponent(codeData);
          await navigator.clipboard.writeText(raw);
          const originalText = btn.innerHTML;
          btn.innerHTML = '<span>✓ Copied!</span>';
          setTimeout(() => {
            btn.innerHTML = originalText;
          }, 2000);
        } catch (e) {
          console.warn('Copy code block failed', e);
        }
      };

      btn.addEventListener('click', handler);
      handlers.push({ btn, handler });
    });

    return () => {
      handlers.forEach(({ btn, handler }) => {
        btn.removeEventListener('click', handler);
      });
    };
  }, [parsedHtml, viewMode]);

  return (
    <div className={`gh-readme-wrapper flex flex-col w-full h-full min-h-0 ${className}`}>
      {/* ── 1. GitHub Repository README Header Bar ──────────────────────────── */}
      <div
        style={{
          background: 'var(--bg-header)',
          borderColor: 'var(--border)',
        }}
        className="gh-readme-header flex items-center justify-between px-3.5 py-2 border-b shrink-0 flex-wrap gap-2 text-xs"
      >
        {/* Left: Octicon + Filename + Stats */}
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-1.5 font-semibold text-[13px]" style={{ color: 'var(--text-base)' }}>
            <BookOpen className="w-4 h-4 text-violet-400 shrink-0" />
            <span>{fileName}</span>
          </div>

          <span
            style={{
              background: 'var(--bg-hover)',
              borderColor: 'var(--border)',
              color: 'var(--text-muted)',
            }}
            className="px-2 py-0.5 rounded-full border text-[10px] font-mono hidden sm:inline-flex items-center gap-1"
          >
            <span>{stats.lines} lines</span>
            <span>•</span>
            <span>{stats.kb} KB</span>
            <span>•</span>
            <span>{stats.readMin} min read</span>
          </span>

          <span className="hidden md:inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
            <Sparkles className="w-2.5 h-2.5" />
            GFM Rendered
          </span>
        </div>

        {/* Right: View Mode Toggle & Copy Button */}
        <div className="flex items-center gap-1.5">
          {/* Preview / Raw segmented toggle */}
          <div
            style={{
              background: 'var(--bg-hover)',
              borderColor: 'var(--border)',
            }}
            className="flex items-center p-0.5 rounded-lg border text-xs"
          >
            <button
              onClick={() => setViewMode('preview')}
              style={{
                background: viewMode === 'preview' ? 'var(--bg-card)' : 'transparent',
                color: viewMode === 'preview' ? 'var(--accent)' : 'var(--text-muted)',
                boxShadow: viewMode === 'preview' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
              }}
              className="px-2 py-1 rounded-md font-medium flex items-center gap-1 transition-all"
              title="Rendered GitHub Markdown Preview"
            >
              <Eye className="w-3 h-3" />
              <span>Preview</span>
            </button>
            <button
              onClick={() => setViewMode('raw')}
              style={{
                background: viewMode === 'raw' ? 'var(--bg-card)' : 'transparent',
                color: viewMode === 'raw' ? 'var(--accent)' : 'var(--text-muted)',
                boxShadow: viewMode === 'raw' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
              }}
              className="px-2 py-1 rounded-md font-medium flex items-center gap-1 transition-all"
              title="View Raw Markdown Source Code"
            >
              <Code className="w-3 h-3" />
              <span>Raw</span>
            </button>
          </div>

          {/* Copy Raw Markdown */}
          <button
            onClick={handleCopy}
            style={{
              background: 'var(--bg-hover)',
              borderColor: 'var(--border)',
              color: 'var(--text-base)',
            }}
            className="px-2.5 py-1 rounded-lg border font-medium flex items-center gap-1.5 transition-all hover:opacity-90 active:scale-95"
            title="Copy Raw Markdown"
          >
            {copied ? (
              <>
                <Check className="w-3 h-3 text-emerald-400" />
                <span className="text-emerald-400 font-semibold">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3 h-3" />
                <span>Copy</span>
              </>
            )}
          </button>

          {/* Open in Dedicated New Web Page */}
          <button
            onClick={handlePopout}
            style={{
              background: 'var(--accent)',
              borderColor: 'var(--accent)',
              color: '#ffffff',
            }}
            className="px-2.5 py-1 rounded-lg border font-semibold flex items-center gap-1.5 transition-all hover:opacity-95 active:scale-95 shadow-xs"
            title="Open in a clean, dedicated new web page (New Tab)"
          >
            <Globe className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Open in Web Page</span>
            <ExternalLink className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* ── 2. GitHub Markdown Body Container ─────────────────────────────────── */}
      <div
        ref={containerRef}
        style={{
          background: 'var(--bg-app)',
          color: 'var(--text-base)',
        }}
        className="gh-readme-body flex-1 overflow-y-auto p-4 md:p-6 custom-scrollbar"
      >
        {viewMode === 'preview' ? (
          <div
            style={{
              background: 'var(--bg-card)',
              borderColor: 'var(--border)',
            }}
            className="gh-readme-card max-w-[890px] mx-auto p-6 md:p-8 rounded-xl border shadow-xs"
          >
            {markdown.trim() ? (
              <div
                className="markdown-body gh-markdown-content"
                dangerouslySetInnerHTML={{ __html: parsedHtml }}
              />
            ) : (
              <div style={{ color: 'var(--text-muted)' }} className="py-12 text-center text-xs">
                <FileText className="w-8 h-8 mx-auto mb-2 opacity-40 text-violet-400" />
                <p style={{ color: 'var(--text-base)' }} className="font-semibold text-sm">Empty Markdown Document</p>
                <p className="mt-1">Write your project documentation, badges, headers, or alerts in {fileName}.</p>
              </div>
            )}
          </div>
        ) : (
          <div
            style={{
              background: 'var(--bg-card)',
              borderColor: 'var(--border)',
            }}
            className="gh-readme-card max-w-[890px] mx-auto p-5 rounded-xl border shadow-xs"
          >
            <pre
              style={{
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: 12,
                lineHeight: 1.7,
                color: 'var(--text-base)',
              }}
              className="whitespace-pre-wrap break-words"
            >
              {markdown}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};

export default GitHubMarkdownPreview;


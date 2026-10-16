import React, { useState, useEffect, useMemo } from 'react'
import {
  SearchIcon,
  CheckIcon,
  SpinnerIcon,
  TerminalIcon,
  CopyIcon,
  PlusIcon,
  RefreshIcon
} from './icons'

export interface PackageInfo {
  name: string
  ecosystem: 'cran' | 'pypi' | 'npm' | 'crates'
  version: string
  description: string
  category: string
  author?: string
  license?: string
  importSnippet: string
  usageCode?: string
}

const CURATED_PACKAGES: PackageInfo[] = [
  // ── R / CRAN Packages ───────────────────────────────────────────────────────
  {
    name: 'ggplot2',
    ecosystem: 'cran',
    version: '3.5.1',
    description: 'Create elegant, declarative data graphics and publication plots using The Grammar of Graphics.',
    category: 'Visualization',
    author: 'Hadley Wickham (Posit)',
    importSnippet: 'library(ggplot2)',
  },
  {
    name: 'dplyr',
    ecosystem: 'cran',
    version: '1.1.4',
    description: 'Fast, intuitive grammar of data manipulation with select, filter, mutate, arrange, and group_by pipes.',
    category: 'Data Wrangling',
    author: 'Hadley Wickham',
    importSnippet: 'library(dplyr)',
  },
  {
    name: 'tidyr',
    ecosystem: 'cran',
    version: '1.3.1',
    description: 'Tools to reshape and clean data into tidy formats where each variable is a column.',
    category: 'Data Wrangling',
    author: 'Posit Software',
    importSnippet: 'library(tidyr)',
  },
  {
    name: 'readr',
    ecosystem: 'cran',
    version: '2.1.5',
    description: 'Fast and friendly way to read rectangular data like CSV, TSV, and fixed-width files.',
    category: 'IO & Files',
    author: 'Jim Hester',
    importSnippet: 'library(readr)',
  },
  {
    name: 'shiny',
    ecosystem: 'cran',
    version: '1.9.1',
    description: 'Build interactive web applications and reactive dashboards directly in R.',
    category: 'Web & Apps',
    author: 'Winston Chang (Posit)',
    importSnippet: 'library(shiny)',
  },
  {
    name: 'plotly',
    ecosystem: 'cran',
    version: '4.10.4',
    description: 'Publish interactive D3 web charts, 3D scatter plots, and tooltips directly from R.',
    category: 'Visualization',
    author: 'Carson Sievert',
    importSnippet: 'library(plotly)',
  },
  {
    name: 'data.table',
    ecosystem: 'cran',
    version: '1.16.2',
    description: 'Ultra-fast memory-efficient data manipulation, fast aggregation, and rolling joins in pure C.',
    category: 'Data Wrangling',
    author: 'Matt Dowle',
    importSnippet: 'library(data.table)',
  },
  {
    name: 'caret',
    ecosystem: 'cran',
    version: '6.0-94',
    description: 'Classification and Regression Training toolkit for machine learning in R.',
    category: 'Machine Learning',
    author: 'Max Kuhn',
    importSnippet: 'library(caret)',
  },
  {
    name: 'lubridate',
    ecosystem: 'cran',
    version: '1.9.3',
    description: 'Fast, simple date-time parsing, intervals, periods, and time zone arithmetic.',
    category: 'Utilities',
    author: 'Vitalie Spinu',
    importSnippet: 'library(lubridate)',
  },
  {
    name: 'stringr',
    ecosystem: 'cran',
    version: '1.5.1',
    description: 'Clean, modern, and reliable string manipulation functions based on stringi / ICU.',
    category: 'Utilities',
    author: 'Hadley Wickham',
    importSnippet: 'library(stringr)',
  },

  // ── Python / PyPI Packages ──────────────────────────────────────────────────
  {
    name: 'numpy',
    ecosystem: 'pypi',
    version: '1.26.4',
    description: 'Fundamental package for array computing, linear algebra, and mathematical operations.',
    category: 'Scientific & Math',
    author: 'NumPy Developers',
    importSnippet: 'import numpy as np',
  },
  {
    name: 'pandas',
    ecosystem: 'pypi',
    version: '2.2.2',
    description: 'Powerful data structures and data analysis tools for tabular and time series datasets.',
    category: 'Data Wrangling',
    author: 'Wes McKinney',
    importSnippet: 'import pandas as pd',
  },
  {
    name: 'matplotlib',
    ecosystem: 'pypi',
    version: '3.9.0',
    description: 'Comprehensive library for creating static, animated, and interactive visualizations.',
    category: 'Visualization',
    author: 'John D. Hunter',
    importSnippet: 'import matplotlib.pyplot as plt',
  },
  {
    name: 'scikit-learn',
    ecosystem: 'pypi',
    version: '1.5.0',
    description: 'Predictive data analysis, machine learning algorithms, classification, and regression.',
    category: 'Machine Learning',
    author: 'Scikit-Learn Consortium',
    importSnippet: 'from sklearn.linear_model import LinearRegression',
  },
  {
    name: 'requests',
    ecosystem: 'pypi',
    version: '2.32.3',
    description: 'Elegant, simple, and reliable HTTP library for Python built for human beings.',
    category: 'Web & API',
    author: 'Kenneth Reitz',
    importSnippet: 'import requests',
  },
  {
    name: 'torch',
    ecosystem: 'pypi',
    version: '2.3.1',
    description: 'Tensors and dynamic neural networks in Python with strong GPU acceleration (PyTorch).',
    category: 'Machine Learning',
    author: 'PyTorch Team',
    importSnippet: 'import torch',
  },
  {
    name: 'scipy',
    ecosystem: 'pypi',
    version: '1.13.1',
    description: 'Fundamental algorithms for scientific computing in Python (optimization, stats, signal).',
    category: 'Scientific & Math',
    author: 'SciPy Community',
    importSnippet: 'import scipy',
  },
  {
    name: 'flask',
    ecosystem: 'pypi',
    version: '3.0.3',
    description: 'Lightweight WSGI web application framework designed to make getting started quick.',
    category: 'Web & API',
    author: 'Armin Ronacher',
    importSnippet: 'from flask import Flask',
  },

  // ── Node.js / npm Packages ──────────────────────────────────────────────────
  {
    name: 'lodash',
    ecosystem: 'npm',
    version: '4.17.21',
    description: 'Modern JavaScript utility library delivering modularity, performance, and extras.',
    category: 'Utilities',
    author: 'John-David Dalton',
    importSnippet: "import _ from 'lodash'",
  },
  {
    name: 'axios',
    ecosystem: 'npm',
    version: '1.7.2',
    description: 'Promise based HTTP client for node.js and the browser with interceptors and transforms.',
    category: 'Web & API',
    author: 'Matt Zabriskie',
    importSnippet: "import axios from 'axios'",
  },
  {
    name: 'zod',
    ecosystem: 'npm',
    version: '3.23.8',
    description: 'TypeScript-first schema declaration and validation with static type inference.',
    category: 'Utilities',
    author: 'Colin McDonnell',
    importSnippet: "import { z } from 'zod'",
  },
  {
    name: 'date-fns',
    ecosystem: 'npm',
    version: '3.6.0',
    description: 'Modern JavaScript date utility library with modular immutable functions.',
    category: 'Utilities',
    author: 'Sasha Koss',
    importSnippet: "import { format } from 'date-fns'",
  },

  // ── Rust / Crates.io Packages ───────────────────────────────────────────────
  {
    name: 'serde',
    ecosystem: 'crates',
    version: '1.0.204',
    description: 'Generic serialization/deserialization framework for Rust data structures.',
    category: 'Utilities',
    author: 'David Tolnay',
    importSnippet: 'use serde::{Serialize, Deserialize};',
  },
  {
    name: 'tokio',
    ecosystem: 'crates',
    version: '1.38.0',
    description: 'An event-driven, non-blocking I/O platform for writing asynchronous applications in Rust.',
    category: 'Async & Web',
    author: 'Tokio Contributors',
    importSnippet: '#[tokio::main]\nasync fn main() {}',
  },
]

interface Props {
  activeLang: string
  activeCode: string
  onInsertCode: (codeToInsert: string) => void
  onRunTerminalCommand: (command: string) => void
  showToast: (msg: string) => void
}

export default function PackageInstaller({
  activeLang,
  activeCode: _activeCode,
  onInsertCode,
  onRunTerminalCommand,
  showToast,
}: Props) {
  // Determine default ecosystem from active editor language
  const defaultEco = useMemo<'cran' | 'pypi' | 'npm' | 'crates'>(() => {
    const l = (activeLang || '').toLowerCase()
    if (l === 'r' || l === 'rscript' || l === 'rstudio') return 'cran'
    if (l === 'python' || l === 'py') return 'pypi'
    if (l === 'javascript' || l === 'typescript' || l === 'js' || l === 'ts') return 'npm'
    if (l === 'rust' || l === 'rs') return 'crates'
    return 'pypi'
  }, [activeLang])

  const [ecosystem, setEcosystem] = useState<'cran' | 'pypi' | 'npm' | 'crates'>(defaultEco)
  const [packageNameInput, setPackageNameInput] = useState('')
  const [installedList, setInstalledList] = useState<string[]>([])
  const [isLoadingInstalled, setIsLoadingInstalled] = useState(false)
  const [filterQuery, setFilterQuery] = useState('')

  // Sync ecosystem if active language changed
  useEffect(() => {
    setEcosystem(defaultEco)
  }, [defaultEco])

  // Fetch installed packages from API
  const refreshInstalled = async () => {
    setIsLoadingInstalled(true)
    try {
      const res = await fetch('/api/packages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'list', ecosystem }),
      })
      if (res.ok) {
        const data = await res.json()
        if (data.packages && Array.isArray(data.packages)) {
          setInstalledList(data.packages)
        }
      }
    } catch {
      // Fallback defaults
      if (ecosystem === 'cran') {
        setInstalledList(['base', 'datasets', 'utils', 'graphics', 'stats', 'dplyr'])
      } else if (ecosystem === 'pypi') {
        setInstalledList(['pip', 'setuptools', 'wheel'])
      } else {
        setInstalledList(['vite', 'react', 'typescript'])
      }
    } finally {
      setIsLoadingInstalled(false)
    }
  }

  useEffect(() => {
    refreshInstalled()
  }, [ecosystem])

  // Compute terminal command based on current input and ecosystem
  const computedTerminalCommand = useMemo(() => {
    const raw = packageNameInput.trim()
    if (!raw) return ''

    // If user already typed full command like `pip install ...` or `install.packages(...)`
    if (raw.startsWith('pip ') || raw.startsWith('npm ') || raw.startsWith('cargo ') || raw.startsWith('install.packages')) {
      return raw
    }

    if (ecosystem === 'cran') {
      return `install.packages("${raw}")`
    }
    if (ecosystem === 'pypi') {
      return `pip install ${raw}`
    }
    if (ecosystem === 'npm') {
      return `npm install ${raw}`
    }
    if (ecosystem === 'crates') {
      return `cargo add ${raw}`
    }
    return `pip install ${raw}`
  }, [packageNameInput, ecosystem])

  // Trigger Install in VS Code Terminal
  const handleTriggerTerminalInstall = (customPkg?: string) => {
    const pkgToInstall = (customPkg || packageNameInput).trim()
    if (!pkgToInstall) {
      showToast('Please enter a package name to install')
      return
    }

    let cmd = ''
    if (pkgToInstall.startsWith('pip ') || pkgToInstall.startsWith('npm ') || pkgToInstall.startsWith('cargo ') || pkgToInstall.startsWith('install.packages')) {
      cmd = pkgToInstall
    } else if (ecosystem === 'cran') {
      cmd = `install.packages("${pkgToInstall}")`
    } else if (ecosystem === 'pypi') {
      cmd = `pip install ${pkgToInstall}`
    } else if (ecosystem === 'npm') {
      cmd = `npm install ${pkgToInstall}`
    } else if (ecosystem === 'crates') {
      cmd = `cargo add ${pkgToInstall}`
    }

    // Call terminal runner
    onRunTerminalCommand(cmd)
    showToast(`🚀 Running "${cmd}" in terminal...`)
    setPackageNameInput('')
  }

  // Filtered curated list for current ecosystem
  const popularPackages = useMemo(() => {
    return CURATED_PACKAGES.filter(p => p.ecosystem === ecosystem)
  }, [ecosystem])

  // Filtered installed list
  const filteredInstalled = useMemo(() => {
    if (!filterQuery.trim()) return installedList
    const q = filterQuery.toLowerCase()
    return installedList.filter(p => p.toLowerCase().includes(q))
  }, [installedList, filterQuery])

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', overflowY: 'auto', background: 'var(--bg-sidebar)', color: 'var(--text-base)', fontSize: 11, userSelect: 'none' }}>
      {/* ── Package Installer Header & Active Info ─────────────────────────── */}
      <div style={{ padding: '12px 14px 8px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700, fontSize: 12 }}>
            <span>📦</span> Package Manager
          </div>
          <span
            style={{
              fontSize: 9,
              fontWeight: 700,
              textTransform: 'uppercase',
              padding: '1px 6px',
              borderRadius: 4,
              background: ecosystem === 'cran' ? 'rgba(39, 109, 195, 0.15)' : 'rgba(56, 189, 248, 0.15)',
              color: ecosystem === 'cran' ? '#38bdf8' : '#38bdf8',
              border: '1px solid rgba(56, 189, 248, 0.3)',
            }}
          >
            {ecosystem.toUpperCase()}
          </span>
        </div>

        {/* Ecosystem Selection Pills */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 12 }}>
          {[
            { id: 'cran'   as const, label: '🔵 R (CRAN)' },
            { id: 'pypi'   as const, label: '🐍 Python' },
            { id: 'npm'    as const, label: '🟨 Node' },
            { id: 'crates' as const, label: '🦀 Rust' },
          ].map(eco => (
            <button
              key={eco.id}
              onClick={() => setEcosystem(eco.id)}
              style={{
                flex: 1,
                background: ecosystem === eco.id ? 'var(--accent, #007fd4)' : 'rgba(255,255,255,0.04)',
                color: ecosystem === eco.id ? '#ffffff' : 'var(--text-muted)',
                border: `1px solid ${ecosystem === eco.id ? 'var(--accent, #007fd4)' : 'var(--border)'}`,
                borderRadius: 4,
                padding: '4px 2px',
                fontSize: 10,
                fontWeight: 600,
                cursor: 'pointer',
                textAlign: 'center',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s ease',
              }}
            >
              {eco.label}
            </button>
          ))}
        </div>

        {/* Package Name Input */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <label style={{ fontSize: 10, color: 'var(--text-dim)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Install Any Package
          </label>
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <input
              type="text"
              value={packageNameInput}
              onChange={e => setPackageNameInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') handleTriggerTerminalInstall()
              }}
              placeholder={
                ecosystem === 'cran'
                  ? 'e.g. ggplot2, dplyr, tidyr...'
                  : ecosystem === 'pypi'
                  ? 'e.g. numpy, pandas, torch...'
                  : ecosystem === 'npm'
                  ? 'e.g. lodash, axios, zod...'
                  : 'e.g. serde, tokio...'
              }
              style={{
                width: '100%',
                background: 'var(--bg-card)',
                color: 'var(--text-base)',
                border: '1px solid var(--border)',
                borderRadius: 5,
                padding: '7px 8px',
                fontSize: 11,
                fontFamily: 'inherit',
                outline: 'none',
              }}
              onFocus={e => (e.target.style.borderColor = 'var(--accent, #007fd4)')}
              onBlur={e => (e.target.style.borderColor = 'var(--border)')}
            />
            {packageNameInput && (
              <button
                onClick={() => setPackageNameInput('')}
                style={{ position: 'absolute', right: 6, background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer', fontSize: 11 }}
              >
                ✕
              </button>
            )}
          </div>

          {/* Terminal Command Live Preview */}
          {computedTerminalCommand && (
            <div style={{ background: 'var(--bg-app)', border: '1px solid var(--border)', borderRadius: 4, padding: '4px 8px', fontSize: 10, color: '#38bdf8', fontFamily: 'JetBrains Mono, monospace', display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ color: 'var(--text-dim)' }}>$</span> {computedTerminalCommand}
            </div>
          )}

          {/* Install Button */}
          <button
            onClick={() => handleTriggerTerminalInstall()}
            className="btn btn-primary"
            style={{
              width: '100%',
              justifyContent: 'center',
              padding: '7px 10px',
              fontSize: 11,
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              borderRadius: 5,
              cursor: 'pointer',
              marginTop: 2,
            }}
          >
            <TerminalIcon size={12} /> Install in Terminal
          </button>
        </div>
      </div>

      {/* ── Popular Quick Picks Section ────────────────────────────────────── */}
      <div style={{ padding: '10px 14px 4px' }}>
        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', color: 'var(--text-dim)', textTransform: 'uppercase', marginBottom: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span>POPULAR {ecosystem.toUpperCase()} PACKAGES</span>
          <span style={{ fontSize: 9, color: 'var(--text-dim)' }}>{popularPackages.length} available</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {popularPackages.map(pkg => (
            <div
              key={pkg.name}
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border)',
                borderRadius: 6,
                padding: '8px 10px',
                display: 'flex',
                flexDirection: 'column',
                gap: 4,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontWeight: 700, fontSize: 12, color: 'var(--text-base)' }}>
                  {pkg.name}
                </span>
                <span style={{ fontSize: 9, color: 'var(--text-dim)', fontFamily: 'JetBrains Mono, monospace' }}>
                  v{pkg.version}
                </span>
              </div>
              <p style={{ margin: 0, fontSize: 10, color: 'var(--text-muted)', lineHeight: 1.4 }}>
                {pkg.description}
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                <button
                  onClick={() => handleTriggerTerminalInstall(pkg.name)}
                  style={{
                    flex: 1,
                    background: 'rgba(56, 189, 248, 0.12)',
                    border: '1px solid rgba(56, 189, 248, 0.3)',
                    color: '#38bdf8',
                    borderRadius: 4,
                    padding: '3px 6px',
                    fontSize: 10,
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 4,
                  }}
                  title={`Run install for ${pkg.name} in terminal`}
                >
                  <TerminalIcon size={10} /> Install
                </button>
                <button
                  onClick={() => {
                    onInsertCode(pkg.importSnippet)
                    showToast(`Inserted ${pkg.importSnippet} ✨`)
                  }}
                  style={{
                    background: 'none',
                    border: '1px solid var(--border)',
                    color: 'var(--text-base)',
                    borderRadius: 4,
                    padding: '3px 8px',
                    fontSize: 10,
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 3,
                  }}
                  title={`Add ${pkg.importSnippet} to current file`}
                >
                  <PlusIcon size={10} /> Import
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Installed Packages Section ──────────────────────────────────────── */}
      <div style={{ padding: '12px 14px', marginTop: 6, borderTop: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', color: 'var(--text-dim)', textTransform: 'uppercase' }}>
            INSTALLED ({installedList.length})
          </span>
          <button
            onClick={refreshInstalled}
            disabled={isLoadingInstalled}
            style={{ background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer', padding: 2 }}
            title="Refresh installed packages"
          >
            <RefreshIcon size={11} className={isLoadingInstalled ? 'spin' : ''} />
          </button>
        </div>

        {installedList.length > 5 && (
          <input
            type="text"
            value={filterQuery}
            onChange={e => setFilterQuery(e.target.value)}
            placeholder="Filter installed packages..."
            style={{
              width: '100%',
              background: 'var(--bg-card)',
              color: 'var(--text-base)',
              border: '1px solid var(--border)',
              borderRadius: 4,
              padding: '4px 8px',
              fontSize: 10,
              outline: 'none',
              marginBottom: 8,
            }}
          />
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 2, maxHeight: 220, overflowY: 'auto' }}>
          {filteredInstalled.slice(0, 30).map((pkgName, i) => (
            <div
              key={i}
              className="sidebar-item"
              style={{
                padding: '4px 8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderRadius: 4,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#10b981' }} />
                <span style={{ color: 'var(--text-base)', fontSize: 11 }}>{pkgName}</span>
              </div>
              <button
                onClick={() => {
                  const snippet = ecosystem === 'cran' ? `library(${pkgName})` : `import ${pkgName}`
                  onInsertCode(snippet)
                  showToast(`Inserted ${snippet} ✨`)
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-dim)',
                  cursor: 'pointer',
                  fontSize: 10,
                  padding: '1px 4px',
                }}
                title="Insert import into code"
              >
                + Import
              </button>
            </div>
          ))}
          {filteredInstalled.length === 0 && (
            <div style={{ color: 'var(--text-dim)', fontSize: 10, fontStyle: 'italic', padding: '6px 4px' }}>
              No packages matching filter
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

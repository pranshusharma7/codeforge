import { useState } from 'react'
import type { DeveloperProfile } from '../../lib/collab/types'
import {
  X,
  GitBranch,
  FolderCode,
  Users,
  Zap,
  MapPin,
  Calendar,
  ExternalLink,
  Award,
  Activity as ActivityIcon,
  CheckCircle2,
} from 'lucide-react'

const GithubIcon: React.FC<{ size?: number }> = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
  </svg>
)

interface Props {
  isOpen: boolean
  onClose: () => void
  profile: DeveloperProfile
  initialTab?: 'overview' | 'projects' | 'activity' | 'achievements'
  onLaunchCollaboration?: () => void
}

export default function DeveloperProfileModal({
  isOpen,
  onClose,
  profile,
  initialTab = 'overview',
  onLaunchCollaboration,
}: Props) {
  const [tab, setTab] = useState<'overview' | 'projects' | 'activity' | 'achievements'>(initialTab)

  if (!isOpen) return null

  // Generate 26 weeks contribution squares for GitHub style activity matrix
  const activityWeeks = Array.from({ length: 26 }, (_, weekIdx) => {
    return Array.from({ length: 7 }, (_, dayIdx) => {
      // Activity level 0 to 4
      const seed = (weekIdx * 7 + dayIdx * 13) % 19
      let level = 0
      if (seed > 14) level = 4
      else if (seed > 10) level = 3
      else if (seed > 6) level = 2
      else if (seed > 3) level = 1
      return { level, day: dayIdx, week: weekIdx }
    })
  })

  const getHeatmapColor = (level: number) => {
    switch (level) {
      case 4: return '#10b981'
      case 3: return '#059669'
      case 2: return '#047857'
      case 1: return '#064e3b'
      default: return 'rgba(255, 255, 255, 0.05)'
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose} style={{ zIndex: 1100 }}>
      <div
        className="modal-box"
        onClick={e => e.stopPropagation()}
        style={{
          width: 820,
          maxWidth: '95vw',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: 16,
          boxShadow: '0 24px 60px rgba(0, 0, 0, 0.6), 0 0 1px 1px rgba(255, 255, 255, 0.06) inset',
          overflow: 'hidden',
          animation: 'modal-up 0.15s ease-out',
        }}
      >
        {/* Modal Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px 22px',
            borderBottom: '1px solid var(--border)',
            background: 'var(--bg-header)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(56, 189, 248, 0.12)', color: '#38bdf8', display: 'grid', placeItems: 'center' }}>
              <GithubIcon size={16} />
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-base)' }}>Developer Profile</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Verified GitHub Identity & Coding Statistics</div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="btn btn-ghost"
            style={{ padding: '6px', borderRadius: 8, color: 'var(--text-muted)' }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '22px' }}>
          {/* Top Banner / Hero Card */}
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 20,
              padding: '20px',
              background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.03), rgba(255, 255, 255, 0.01))',
              border: '1px solid var(--border)',
              borderRadius: 14,
              marginBottom: 20,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              {/* Avatar with Ring */}
              <div style={{ position: 'relative' }}>
                <img
                  src={profile.avatarUrl}
                  alt={profile.username}
                  style={{
                    width: 72,
                    height: 72,
                    borderRadius: '50%',
                    border: '3px solid var(--accent)',
                    boxShadow: '0 4px 18px var(--accent-subtle)',
                    objectFit: 'cover',
                  }}
                />
                <span
                  style={{
                    position: 'absolute',
                    bottom: 2,
                    right: 2,
                    width: 14,
                    height: 14,
                    borderRadius: '50%',
                    background: '#10b981',
                    border: '2.5px solid var(--bg-card)',
                    boxShadow: '0 0 6px #10b981',
                  }}
                  title="Online"
                />
              </div>

              {/* Bio & Details */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-base)' }}>
                    {profile.name}
                  </span>
                  <a
                    href={profile.profileUrl}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      fontSize: 12,
                      fontWeight: 600,
                      color: 'var(--accent)',
                      textDecoration: 'none',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                      background: 'var(--accent-subtle)',
                      border: '1px solid var(--accent-border)',
                      padding: '2px 8px',
                      borderRadius: 12,
                    }}
                  >
                    @{profile.username}
                    <ExternalLink size={10} />
                  </a>
                </div>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4, maxWidth: 440, lineHeight: 1.5 }}>
                  {profile.bio}
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 8, fontSize: 11, color: 'var(--text-dim)' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <MapPin size={12} /> {profile.location}
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Calendar size={12} /> Member since 2024
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#10b981' }}>
                    <CheckCircle2 size={12} /> GitHub Verified
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Action Button */}
            {onLaunchCollaboration && (
              <button
                onClick={() => {
                  onClose()
                  onLaunchCollaboration()
                }}
                className="btn btn-primary"
                style={{
                  padding: '9px 18px',
                  borderRadius: 20,
                  fontSize: 12,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 7,
                  boxShadow: '0 4px 14px var(--accent-subtle)',
                }}
              >
                <Users size={14} />
                <span>Live Collaboration</span>
              </button>
            )}
          </div>

          {/* 4 Stats Cards */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
              gap: 12,
              marginBottom: 20,
            }}
          >
            <div style={statCardStyle}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Public Repositories</span>
                <GitBranch size={14} style={{ color: '#38bdf8' }} />
              </div>
              <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-base)', marginTop: 4 }}>
                {profile.publicReposCount}
              </div>
            </div>

            <div style={statCardStyle}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>CodeForge Projects</span>
                <FolderCode size={14} style={{ color: '#a855f7' }} />
              </div>
              <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-base)', marginTop: 4 }}>
                {profile.codeforgeProjectsCount}
              </div>
            </div>

            <div style={statCardStyle}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Live Collaborations</span>
                <Users size={14} style={{ color: '#10b981' }} />
              </div>
              <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-base)', marginTop: 4 }}>
                {profile.totalCollaborationsCount}
              </div>
            </div>

            <div style={statCardStyle}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Code Executions</span>
                <Zap size={14} style={{ color: '#f59e0b' }} />
              </div>
              <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-base)', marginTop: 4 }}>
                {profile.codeExecutionsCount}
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div
            style={{
              display: 'flex',
              gap: 6,
              borderBottom: '1px solid var(--border)',
              marginBottom: 18,
              paddingBottom: 2,
            }}
          >
            {[
              { id: 'overview', label: 'Overview', icon: <ActivityIcon size={13} /> },
              { id: 'achievements', label: 'Achievements', icon: <Award size={13} /> },
              { id: 'activity', label: 'Recent Activity', icon: <Calendar size={13} /> },
            ].map(t => (
              <button
                key={t.id}
                onClick={() => setTab(t.id as any)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '6px 14px',
                  borderRadius: '6px 6px 0 0',
                  background: tab === t.id ? 'var(--bg-hover)' : 'transparent',
                  border: 'none',
                  borderBottom: tab === t.id ? '2px solid var(--accent)' : '2px solid transparent',
                  color: tab === t.id ? 'var(--text-base)' : 'var(--text-muted)',
                  fontSize: 12,
                  fontWeight: tab === t.id ? 700 : 500,
                  cursor: 'pointer',
                  transition: 'all 0.12s',
                }}
              >
                {t.icon}
                <span>{t.label}</span>
              </button>
            ))}
          </div>

          {/* Tab 1: Overview */}
          {tab === 'overview' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              {/* Language Breakdown */}
              <div style={{ padding: '16px', background: 'var(--bg-panel)', border: '1px solid var(--border)', borderRadius: 12 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-base)', marginBottom: 10 }}>
                  Top Programming Languages
                </div>
                {/* Segmented bar */}
                <div style={{ display: 'flex', height: 8, borderRadius: 6, overflow: 'hidden', marginBottom: 12 }}>
                  {profile.topLanguages.map(l => (
                    <div
                      key={l.name}
                      style={{
                        width: `${l.percentage}%`,
                        background: l.color,
                      }}
                      title={`${l.name}: ${l.percentage}%`}
                    />
                  ))}
                </div>
                {/* Legend */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14 }}>
                  {profile.topLanguages.map(l => (
                    <div key={l.name} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11 }}>
                      <span style={{ width: 8, height: 8, borderRadius: '50%', background: l.color }} />
                      <span style={{ color: 'var(--text-base)', fontWeight: 600 }}>{l.name}</span>
                      <span style={{ color: 'var(--text-muted)' }}>{l.percentage}%</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* GitHub-style Contribution Matrix */}
              <div style={{ padding: '16px', background: 'var(--bg-panel)', border: '1px solid var(--border)', borderRadius: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-base)' }}>Coding & Execution Activity</span>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Past 6 Months</span>
                </div>
                <div style={{ display: 'flex', gap: 3, overflowX: 'auto', paddingBottom: 6 }}>
                  {activityWeeks.map((week, wIdx) => (
                    <div key={wIdx} style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                      {week.map((d, dIdx) => (
                        <div
                          key={dIdx}
                          style={{
                            width: 11,
                            height: 11,
                            borderRadius: 2,
                            background: getHeatmapColor(d.level),
                          }}
                          title={`Activity level ${d.level}`}
                        />
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Tab 2: Achievements */}
          {tab === 'achievements' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
              {profile.achievements.map(ach => (
                <div
                  key={ach.id}
                  style={{
                    padding: '14px',
                    background: 'var(--bg-panel)',
                    border: '1px solid var(--border)',
                    borderRadius: 12,
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 12,
                  }}
                >
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(245, 158, 11, 0.12)', fontSize: 18, display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                    {ach.icon}
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-base)' }}>{ach.title}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{ach.description}</div>
                    <div style={{ fontSize: 10, color: '#10b981', marginTop: 4, fontWeight: 600 }}>Unlocked ✓</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Tab 3: Recent Activity */}
          {tab === 'activity' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {profile.recentActivity.map(act => (
                <div
                  key={act.id}
                  style={{
                    padding: '12px 14px',
                    background: 'var(--bg-panel)',
                    border: '1px solid var(--border)',
                    borderRadius: 10,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--accent-subtle)', color: 'var(--accent)', display: 'grid', placeItems: 'center' }}>
                      <Zap size={14} />
                    </div>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-base)' }}>{act.title}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{act.description}</div>
                    </div>
                  </div>
                  <span style={{ fontSize: 10, color: 'var(--text-dim)' }}>
                    {new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

const statCardStyle: React.CSSProperties = {
  padding: '14px',
  background: 'var(--bg-panel)',
  border: '1px solid var(--border)',
  borderRadius: 12,
}

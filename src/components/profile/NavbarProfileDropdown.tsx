import { useState, useRef, useEffect } from 'react'
import type { AuthUser } from '../../lib/storage'
import {
  User,
  FolderCode,
  Users,
  Activity,
  Settings,
  LogOut,
  ChevronDown,
  ExternalLink,
} from 'lucide-react'

const GithubIcon: React.FC<{ size?: number }> = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
  </svg>
)

interface Props {
  authUser: AuthUser | null
  onOpenProfile: () => void
  onOpenProjects: () => void
  onOpenCollaborations: () => void
  onOpenActivity: () => void
  onOpenSettings: () => void
  onSignIn: () => void
  onSignOut: () => void
}

export default function NavbarProfileDropdown({
  authUser,
  onOpenProfile,
  onOpenProjects,
  onOpenCollaborations,
  onOpenActivity,
  onOpenSettings,
  onSignIn,
  onSignOut,
}: Props) {
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick)
    }
    return () => document.removeEventListener('mousedown', handleOutsideClick)
  }, [isOpen])

  if (!authUser) {
    return (
      <button
        onClick={onSignIn}
        className="btn"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 7,
          padding: '5px 12px',
          borderRadius: 8,
          background: 'rgba(255, 255, 255, 0.06)',
          border: '1px solid var(--border)',
          color: 'var(--text-base)',
          fontSize: 12,
          fontWeight: 600,
          cursor: 'pointer',
          transition: 'all 0.15s ease',
        }}
        onMouseEnter={e => {
          e.currentTarget.style.background = 'var(--bg-hover)'
          e.currentTarget.style.borderColor = 'var(--accent)'
        }}
        onMouseLeave={e => {
          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)'
          e.currentTarget.style.borderColor = 'var(--border)'
        }}
        title="Sign in with GitHub to access your developer profile and collaborations"
      >
        <GithubIcon size={14} />
        <span>Sign In</span>
      </button>
    )
  }

  const username = authUser.login || authUser.name || 'Developer'
  const displayUsername = `@${username}`

  return (
    <div ref={menuRef} style={{ position: 'relative' }}>
      {/* Navbar Profile Button */}
      <button
        onClick={() => setIsOpen(p => !p)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '4px 10px',
          borderRadius: 20,
          background: isOpen ? 'var(--bg-hover)' : 'rgba(255, 255, 255, 0.05)',
          border: '1px solid',
          borderColor: isOpen ? 'var(--accent)' : 'var(--border)',
          color: 'var(--text-base)',
          cursor: 'pointer',
          transition: 'all 0.15s ease',
          boxShadow: isOpen ? '0 0 10px var(--accent-subtle)' : 'none',
        }}
        onMouseEnter={e => {
          if (!isOpen) e.currentTarget.style.borderColor = 'var(--border-subtle)'
        }}
        onMouseLeave={e => {
          if (!isOpen) e.currentTarget.style.borderColor = 'var(--border)'
        }}
      >
        {/* Avatar with Online Green Dot */}
        <div style={{ position: 'relative', width: 22, height: 22, flexShrink: 0 }}>
          <img
            src={authUser.avatarUrl || 'https://github.com/ghost.png'}
            alt={username}
            style={{
              width: 22,
              height: 22,
              borderRadius: '50%',
              objectFit: 'cover',
              border: '1px solid var(--border)',
            }}
          />
          <span
            style={{
              position: 'absolute',
              bottom: -1,
              right: -1,
              width: 7,
              height: 7,
              borderRadius: '50%',
              background: '#10b981',
              border: '1.5px solid var(--bg-header)',
              boxShadow: '0 0 4px #10b981',
            }}
            title="Online"
          />
        </div>

        {/* GitHub Username */}
        <span style={{ fontSize: 12, fontWeight: 600, maxWidth: 110, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {displayUsername}
        </span>

        {/* Small dropdown chevron indicator */}
        <ChevronDown
          size={12}
          style={{
            color: 'var(--text-muted)',
            transform: isOpen ? 'rotate(180deg)' : 'none',
            transition: 'transform 0.15s ease',
          }}
        />
      </button>

      {/* Clean Dropdown Menu */}
      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            right: 0,
            width: 240,
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: 12,
            boxShadow: '0 12px 36px rgba(0, 0, 0, 0.4), 0 0 1px 1px rgba(255, 255, 255, 0.05) inset',
            padding: 6,
            zIndex: 1000,
            animation: 'modal-up 0.12s ease-out',
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
          }}
        >
          {/* User Header Preview */}
          <div
            style={{
              padding: '10px 12px',
              borderBottom: '1px solid var(--border)',
              marginBottom: 4,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <img
                src={authUser.avatarUrl || 'https://github.com/ghost.png'}
                alt={username}
                style={{ width: 34, height: 34, borderRadius: '50%', border: '1.5px solid var(--accent)' }}
              />
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-base)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {authUser.name || username}
                </div>
                <div style={{ fontSize: 11, color: 'var(--accent)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span>{displayUsername}</span>
                  <ExternalLink size={10} style={{ opacity: 0.7 }} />
                </div>
              </div>
            </div>
          </div>

          {/* Menu Item 1: My Profile */}
          <button
            onClick={() => {
              setIsOpen(false)
              onOpenProfile()
            }}
            className="dropdown-item"
            style={dropdownItemStyle}
          >
            <User size={14} style={{ color: '#38bdf8' }} />
            <span>My Profile</span>
          </button>

          {/* Menu Item 2: My Projects */}
          <button
            onClick={() => {
              setIsOpen(false)
              onOpenProjects()
            }}
            className="dropdown-item"
            style={dropdownItemStyle}
          >
            <FolderCode size={14} style={{ color: '#a855f7' }} />
            <span>My Projects</span>
          </button>

          {/* Menu Item 3: My Collaborations (Live Rooms) */}
          <button
            onClick={() => {
              setIsOpen(false)
              onOpenCollaborations()
            }}
            className="dropdown-item"
            style={dropdownItemStyle}
          >
            <Users size={14} style={{ color: '#10b981' }} />
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
              <span>My Collaborations</span>
              <span style={{ fontSize: 9, background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.3)', padding: '1px 5px', borderRadius: 10, fontWeight: 700 }}>
                LIVE
              </span>
            </div>
          </button>

          {/* Menu Item 4: Activity & Contributions */}
          <button
            onClick={() => {
              setIsOpen(false)
              onOpenActivity()
            }}
            className="dropdown-item"
            style={dropdownItemStyle}
          >
            <Activity size={14} style={{ color: '#f59e0b' }} />
            <span>Activity & Contributions</span>
          </button>

          {/* Divider */}
          <div style={{ height: 1, background: 'var(--border)', margin: '4px 6px' }} />

          {/* Menu Item 5: Account Settings */}
          <button
            onClick={() => {
              setIsOpen(false)
              onOpenSettings()
            }}
            className="dropdown-item"
            style={dropdownItemStyle}
          >
            <Settings size={14} style={{ color: 'var(--text-muted)' }} />
            <span>Account Settings</span>
          </button>

          {/* Menu Item 6: Disconnect GitHub */}
          <button
            onClick={() => {
              setIsOpen(false)
              onSignOut()
            }}
            className="dropdown-item"
            style={{ ...dropdownItemStyle, color: '#f87171' }}
          >
            <LogOut size={14} style={{ color: '#f87171' }} />
            <span>Disconnect GitHub</span>
          </button>
        </div>
      )}
    </div>
  )
}

const dropdownItemStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  padding: '8px 12px',
  borderRadius: 8,
  background: 'transparent',
  border: 'none',
  color: 'var(--text-base)',
  fontSize: 12,
  fontWeight: 500,
  cursor: 'pointer',
  textAlign: 'left',
  width: '100%',
  transition: 'background 0.12s ease',
}

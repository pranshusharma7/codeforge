export type RoomRole = 'owner' | 'editor' | 'viewer' | 'OWNER' | 'EDITOR' | 'VIEWER'

export interface RoomMember {
  id: string
  userId: string
  githubUsername: string
  avatarUrl: string
  role: RoomRole
  joinedAt: number
  isOnline: boolean
  isSpeaking?: boolean
  isMuted?: boolean
  isDeafened?: boolean
  color: string
}

export interface RoomInvite {
  id: string
  roomId: string
  token: string
  createdBy: string
  createdAt: number
  expiresAt: number | null // null = never
  isRevoked: boolean
}

export interface RoomMessage {
  id: string
  roomId: string
  userId: string
  username: string
  avatarUrl: string
  role: RoomRole
  text: string
  timestamp: number
  isSystem?: boolean
}

export interface CollabFile {
  id: string
  name: string
  lang: string
  code: string
  modified?: boolean
}

export interface CollabRoom {
  id: string
  name: string
  description?: string
  roomCode: string
  ownerId: string
  ownerUsername: string
  language: string
  createdAt: number
  updatedAt: number
  isPrivate: true // All rooms are strictly private
  inviteToken: string
  members: RoomMember[]
  files: CollabFile[]
  activeFileId: string
}

export interface RemoteCursor {
  userId: string
  username: string
  color: string
  lineNumber: number
  column: number
  selection?: {
    startLineNumber: number
    startColumn: number
    endLineNumber: number
    endColumn: number
  }
}

export interface DeveloperProfile {
  id: string
  githubId: string
  username: string
  name: string
  avatarUrl: string
  profileUrl: string
  bio: string
  location?: string
  publicReposCount: number
  codeforgeProjectsCount: number
  totalCollaborationsCount: number
  codeExecutionsCount: number
  topLanguages: { name: string; percentage: number; color: string }[]
  achievements: {
    id: string
    title: string
    description: string
    icon: string
    unlockedAt: number
  }[]
  recentActivity: {
    id: string
    type: 'commit' | 'collaboration' | 'execution' | 'project_created'
    title: string
    description: string
    timestamp: number
  }[]
}

export interface PingLineEvent {
  roomId: string
  fileId: string
  lineNumber: number
  userId: string
  username: string
  color: string
  timestamp: number
}

export interface FollowState {
  isFollowing: boolean
  targetUserId: string | null
  targetUsername?: string
}

export interface TerminalStreamEvent {
  roomId: string
  executionId: string
  ownerId: string
  ownerUsername: string
  lang: string
  type: 'start' | 'stdout' | 'stderr' | 'exit'
  chunk?: string
  exitCode?: number
  timestamp: number
}

export interface InlineCodeComment {
  id: string
  roomId: string
  fileId: string
  lineNumber: number
  userId: string
  username: string
  avatarUrl: string
  content: string
  createdAt: number
  resolved: boolean
  replies?: {
    id: string
    userId: string
    username: string
    avatarUrl: string
    content: string
    createdAt: number
  }[]
}

export interface DocumentSnapshot {
  id: string
  roomId: string
  name: string
  createdAt: number
  createdBy: string
  fileCount: number
  files: {
    name: string
    lang: string
    code: string
  }[]
}

export interface WhiteboardElement {
  id: string
  type: 'freehand' | 'rectangle' | 'circle' | 'arrow' | 'text' | 'eraser'
  points?: { x: number; y: number }[]
  x?: number
  y?: number
  width?: number
  height?: number
  color: string
  strokeWidth: number
  text?: string
}

export interface ScreenShareState {
  isSharing: boolean
  sharerId?: string
  sharerUsername?: string
  stream?: MediaStream | null
}

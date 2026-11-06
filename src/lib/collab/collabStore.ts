import type { CollabRoom, RoomMember, RoomRole, RoomMessage, DeveloperProfile, CollabFile } from './types'
import type { AuthUser } from '../storage'

const ROOMS_STORAGE_KEY = 'cf_collab_rooms'
const ROOM_MESSAGES_KEY_PREFIX = 'cf_room_messages_'
const PROFILE_STATS_KEY = 'cf_dev_profile_stats'

// Palette of distinctive vibrant collaborator colors
export const COLLAB_COLORS = [
  '#8b5cf6', // Violet
  '#10b981', // Emerald
  '#06b6d4', // Cyan
  '#f59e0b', // Amber
  '#ec4899', // Pink
  '#3b82f6', // Blue
  '#14b8a6', // Teal
  '#f43f5e', // Rose
]

export function getCollaboratorColor(index: number): string {
  return COLLAB_COLORS[index % COLLAB_COLORS.length]
}

// Generate unique human-readable room code: CF-XXXX-XXXX
export function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  const part1 = Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
  const part2 = Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
  return `CF-${part1}-${part2}`
}

export function generateSecureToken(): string {
  const bytes = new Uint8Array(16)
  crypto.getRandomValues(bytes)
  return Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('')
}

export function getStoredRooms(): CollabRoom[] {
  try {
    const raw = localStorage.getItem(ROOMS_STORAGE_KEY)
    if (!raw) return []
    return JSON.parse(raw) as CollabRoom[]
  } catch {
    return []
  }
}

export function saveStoredRooms(rooms: CollabRoom[]) {
  try {
    localStorage.setItem(ROOMS_STORAGE_KEY, JSON.stringify(rooms))
  } catch {}
}

export function createRoom(params: {
  name: string
  description?: string
  language: string
  owner: AuthUser
  initialFiles?: { name: string; lang: string; code: string }[]
}): CollabRoom {
  const roomCode = generateRoomCode()
  const inviteToken = generateSecureToken()
  const roomId = `room_${crypto.randomUUID()}`

  const defaultFiles: CollabFile[] = params.initialFiles?.length
    ? params.initialFiles.map((f, i) => ({
        id: `file_${i}_${crypto.randomUUID()}`,
        name: f.name,
        lang: f.lang,
        code: f.code,
      }))
    : [
        {
          id: `file_main_${crypto.randomUUID()}`,
          name: params.language === 'python' ? 'main.py' : params.language === 'csharp' ? 'Program.cs' : params.language === 'cpp' ? 'main.cpp' : 'main.js',
          lang: params.language,
          code: params.language === 'csharp'
            ? 'using System;\n\nnamespace CodeForge;\n\nclass Program {\n    static void Main() {\n        Console.WriteLine("Welcome to CodeForge Live Room! 🚀");\n    }\n}\n'
            : params.language === 'python'
            ? 'print("Welcome to CodeForge Live Room! 🚀")\n'
            : 'console.log("Welcome to CodeForge Live Room! 🚀");\n',
        },
      ]

  const ownerMember: RoomMember = {
    id: `mem_${crypto.randomUUID()}`,
    userId: params.owner.id || params.owner.login || 'owner',
    githubUsername: params.owner.login || params.owner.name || 'Developer',
    avatarUrl: params.owner.avatarUrl || 'https://github.com/ghost.png',
    role: 'owner',
    joinedAt: Date.now(),
    isOnline: true,
    color: COLLAB_COLORS[0],
  }

  const room: CollabRoom = {
    id: roomId,
    name: params.name.trim() || 'Untitled Private Room',
    description: params.description?.trim(),
    roomCode,
    ownerId: ownerMember.userId,
    ownerUsername: ownerMember.githubUsername,
    language: params.language,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    isPrivate: true,
    inviteToken,
    members: [ownerMember],
    files: defaultFiles,
    activeFileId: defaultFiles[0].id,
  }

  const existing = getStoredRooms()
  saveStoredRooms([room, ...existing])

  // Record initial system message
  addRoomMessage(room.id, {
    roomId: room.id,
    userId: 'system',
    username: 'System',
    avatarUrl: '',
    role: 'owner',
    text: `Room "${room.name}" created by @${room.ownerUsername}`,
    timestamp: Date.now(),
    isSystem: true,
  })

  // Increment collaboration count in developer profile
  incrementProfileCollabCount(params.owner.login || params.owner.name)

  return room
}

export function findRoomByCode(code: string): CollabRoom | null {
  const clean = code.trim().toUpperCase()
  const rooms = getStoredRooms()
  return rooms.find(r => r.roomCode.toUpperCase() === clean) || null
}

export function findRoomById(id: string): CollabRoom | null {
  const rooms = getStoredRooms()
  return rooms.find(r => r.id === id) || null
}

export function validateInviteToken(room: CollabRoom, token: string): boolean {
  if (!token) return false
  return room.inviteToken === token
}

export function joinRoom(
  room: CollabRoom,
  user: AuthUser,
  role: RoomRole = 'editor'
): { room: CollabRoom; member: RoomMember } {
  const userId = user.id || user.login || 'guest_user'
  const username = user.login || user.name || 'Guest'
  const avatarUrl = user.avatarUrl || 'https://github.com/ghost.png'

  let member = room.members.find(m => m.userId === userId)
  let updatedMembers = [...room.members]

  if (member) {
    member = { ...member, isOnline: true }
    updatedMembers = updatedMembers.map(m => m.userId === userId ? member! : m)
  } else {
    // Determine color
    const color = getCollaboratorColor(room.members.length)
    member = {
      id: `mem_${crypto.randomUUID()}`,
      userId,
      githubUsername: username,
      avatarUrl,
      role: room.ownerId === userId ? 'owner' : role,
      joinedAt: Date.now(),
      isOnline: true,
      color,
    }
    updatedMembers.push(member)

    // System welcome message
    addRoomMessage(room.id, {
      roomId: room.id,
      userId: 'system',
      username: 'System',
      avatarUrl: '',
      role: member.role,
      text: `@${username} joined the collaboration room as ${member.role.toUpperCase()}`,
      timestamp: Date.now(),
      isSystem: true,
    })
  }

  const updatedRoom: CollabRoom = {
    ...room,
    members: updatedMembers,
    updatedAt: Date.now(),
  }

  updateRoomInStorage(updatedRoom)
  incrementProfileCollabCount(username)

  return { room: updatedRoom, member }
}

export function updateMemberRole(roomId: string, targetUserId: string, newRole: RoomRole): CollabRoom | null {
  const room = findRoomById(roomId)
  if (!room) return null

  // Owner cannot be demoted
  if (room.ownerId === targetUserId && newRole !== 'owner') return null

  const updatedMembers = room.members.map(m => {
    if (m.userId === targetUserId) {
      return { ...m, role: newRole }
    }
    return m
  })

  const targetMember = room.members.find(m => m.userId === targetUserId)
  if (targetMember) {
    addRoomMessage(roomId, {
      roomId,
      userId: 'system',
      username: 'System',
      avatarUrl: '',
      role: 'owner',
      text: `@${targetMember.githubUsername}'s role was updated to ${newRole.toUpperCase()}`,
      timestamp: Date.now(),
      isSystem: true,
    })
  }

  const updatedRoom = { ...room, members: updatedMembers, updatedAt: Date.now() }
  updateRoomInStorage(updatedRoom)
  return updatedRoom
}

export function removeMemberFromRoom(roomId: string, targetUserId: string): CollabRoom | null {
  const room = findRoomById(roomId)
  if (!room) return null
  if (room.ownerId === targetUserId) return null // Cannot remove owner

  const targetMember = room.members.find(m => m.userId === targetUserId)
  const updatedMembers = room.members.filter(m => m.userId !== targetUserId)

  if (targetMember) {
    addRoomMessage(roomId, {
      roomId,
      userId: 'system',
      username: 'System',
      avatarUrl: '',
      role: 'owner',
      text: `@${targetMember.githubUsername} was removed from the room`,
      timestamp: Date.now(),
      isSystem: true,
    })
  }

  const updatedRoom = { ...room, members: updatedMembers, updatedAt: Date.now() }
  updateRoomInStorage(updatedRoom)
  return updatedRoom
}

export function updateRoomInStorage(updated: CollabRoom) {
  const rooms = getStoredRooms()
  const next = rooms.map(r => r.id === updated.id ? updated : r)
  saveStoredRooms(next)
}

export function deleteRoom(roomId: string): boolean {
  const rooms = getStoredRooms()
  const next = rooms.filter(r => r.id !== roomId)
  saveStoredRooms(next)
  try {
    localStorage.removeItem(`${ROOM_MESSAGES_KEY_PREFIX}${roomId}`)
  } catch {}
  return true
}

export function getRoomInviteUrl(room: CollabRoom): string {
  const origin = typeof window !== 'undefined' ? window.location.origin : ''
  const pathname = typeof window !== 'undefined' ? window.location.pathname : ''
  return `${origin}${pathname}?room=${encodeURIComponent(room.roomCode)}&token=${encodeURIComponent(room.inviteToken)}`
}

export function getMyRole(room: CollabRoom, userId: string): RoomRole {
  if (room.ownerId === userId) return 'owner'
  const member = room.members.find(m => m.userId === userId)
  return member?.role ?? 'viewer'
}

export const getCollabRooms = getStoredRooms

export function createCollabRoom(params: {
  name: string
  description?: string
  language: string
  owner: any
  initialFiles?: { name: string; lang: string; code: string }[]
}): CollabRoom {
  const ownerUser: AuthUser = {
    id: params.owner.id || 'dev_user',
    name: params.owner.name || params.owner.username || 'Developer',
    email: params.owner.email || 'dev@codeforge.io',
    initials: (params.owner.name || params.owner.username || 'CF').slice(0, 2).toUpperCase(),
    login: params.owner.username || params.owner.github_username || params.owner.login || 'Developer',
    avatarUrl: params.owner.avatarUrl || params.owner.avatar_url || 'https://github.com/ghost.png',
  }

  return createRoom({
    name: params.name,
    description: params.description,
    language: params.language,
    owner: ownerUser,
    initialFiles: params.initialFiles,
  })
}

export function joinCollabRoom(
  roomCodeOrId: string,
  user: any,
  token?: string
): { success: boolean; room?: CollabRoom; error?: string } {
  const clean = roomCodeOrId.trim()
  const targetRoom = findRoomByCode(clean) || findRoomById(clean)
  if (!targetRoom) {
    return { success: false, error: `No private room found matching code "${clean}"` }
  }

  const userId = user.id || user.login || 'guest_user'
  const isExistingMember = targetRoom.members.some(m => m.userId === userId)

  if (!isExistingMember && token && token !== targetRoom.inviteToken) {
    return { success: false, error: 'Invalid or expired invitation token for this private room' }
  }

  const authUser: AuthUser = {
    id: userId,
    name: user.name || user.username || 'Developer',
    email: user.email || 'dev@codeforge.io',
    initials: (user.name || user.username || 'CF').slice(0, 2).toUpperCase(),
    login: user.username || user.github_username || user.login || 'Developer',
    avatarUrl: user.avatarUrl || user.avatar_url || 'https://github.com/ghost.png',
  }

  const res = joinRoom(targetRoom, authUser, targetRoom.ownerId === userId ? 'owner' : 'editor')
  return { success: true, room: res.room }
}

export const deleteCollabRoom = deleteRoom

export function leaveCollabRoom(roomId: string, userId: string): boolean {
  removeMemberFromRoom(roomId, userId)
  return true
}

// ── Room Messages ────────────────────────────────────────────────────────────
export function getRoomMessages(roomId: string): RoomMessage[] {
  try {
    const raw = localStorage.getItem(`${ROOM_MESSAGES_KEY_PREFIX}${roomId}`)
    if (!raw) return []
    return JSON.parse(raw) as RoomMessage[]
  } catch {
    return []
  }
}

export function addRoomMessage(roomId: string, msg: Omit<RoomMessage, 'id'>): RoomMessage {
  const message: RoomMessage = {
    ...msg,
    id: `msg_${crypto.randomUUID()}`,
  }
  const current = getRoomMessages(roomId)
  const updated = [...current, message].slice(-200) // Keep last 200 messages
  try {
    localStorage.setItem(`${ROOM_MESSAGES_KEY_PREFIX}${roomId}`, JSON.stringify(updated))
    const bc = new BroadcastChannel(`cf_room_msg_channel_${roomId}`)
    bc.postMessage({ type: 'new_message', roomId, message })
    bc.close()
  } catch {}
  return message
}

export function sendRoomMessage(roomId: string, user: any, text: string, type: string = 'text'): RoomMessage {
  return addRoomMessage(roomId, {
    roomId,
    userId: user.id || 'dev_user',
    username: user.username || user.login || user.github_username || 'Developer',
    avatarUrl: user.avatarUrl || user.avatar_url || 'https://github.com/ghost.png',
    role: (user.role || 'editor').toLowerCase() as RoomRole,
    text,
    timestamp: Date.now(),
    isSystem: type === 'system',
  })
}

export function subscribeToRoomMessages(roomId: string, callback: (msgs: RoomMessage[]) => void): () => void {
  const bc = new BroadcastChannel(`cf_room_msg_channel_${roomId}`)
  bc.onmessage = () => {
    callback(getRoomMessages(roomId))
  }
  const handleStorage = (e: StorageEvent) => {
    if (e.key === `${ROOM_MESSAGES_KEY_PREFIX}${roomId}`) {
      callback(getRoomMessages(roomId))
    }
  }
  window.addEventListener('storage', handleStorage)

  return () => {
    bc.close()
    window.removeEventListener('storage', handleStorage)
  }
}

// ── Shared Developer Profile Storage & Subscriptions ──────────────────────────
const DEV_PROFILE_KEY = 'cf_active_developer_profile'

export function getDeveloperProfile(): DeveloperProfile {
  try {
    const raw = localStorage.getItem(DEV_PROFILE_KEY)
    if (raw) return JSON.parse(raw) as DeveloperProfile
  } catch {}
  return buildDeveloperProfile(null, 8, 5)
}

export function saveDeveloperProfile(profile: DeveloperProfile) {
  try {
    localStorage.setItem(DEV_PROFILE_KEY, JSON.stringify(profile))
    window.dispatchEvent(new CustomEvent('cf_dev_profile_updated', { detail: profile }))
  } catch {}
}

export function subscribeToProfile(cb: (profile: DeveloperProfile) => void): () => void {
  const handler = (e: any) => {
    if (e.detail) cb(e.detail)
    else cb(getDeveloperProfile())
  }
  window.addEventListener('cf_dev_profile_updated', handler)
  return () => window.removeEventListener('cf_dev_profile_updated', handler)
}

export function recordExecution(lang?: string) {
  const profile = getDeveloperProfile()
  incrementProfileExecutionCount(profile.username, lang)
  saveDeveloperProfile({
    ...profile,
    codeExecutionsCount: (profile.codeExecutionsCount || 0) + 1,
  })
}

export function recordCollaboration() {
  const profile = getDeveloperProfile()
  incrementProfileCollabCount(profile.username)
  saveDeveloperProfile({
    ...profile,
    totalCollaborationsCount: (profile.totalCollaborationsCount || 0) + 1,
  })
}

// ── Developer Profile Stats & Badges ─────────────────────────────────────────
interface ProfileStats {
  collaborationsCount: number
  executionsCount: number
  activityLog: { id: string; type: 'commit' | 'collaboration' | 'execution' | 'project_created'; title: string; description: string; timestamp: number }[]
}

function getProfileStats(username: string): ProfileStats {
  try {
    const raw = localStorage.getItem(`${PROFILE_STATS_KEY}_${username.toLowerCase()}`)
    if (raw) return JSON.parse(raw)
  } catch {}
  return { collaborationsCount: 1, executionsCount: 12, activityLog: [] }
}

function saveProfileStats(username: string, stats: ProfileStats) {
  try {
    localStorage.setItem(`${PROFILE_STATS_KEY}_${username.toLowerCase()}`, JSON.stringify(stats))
  } catch {}
}

export function incrementProfileCollabCount(username?: string) {
  if (!username) return
  const stats = getProfileStats(username)
  stats.collaborationsCount += 1
  stats.activityLog.unshift({
    id: crypto.randomUUID(),
    type: 'collaboration',
    title: 'Joined Live Collaboration',
    description: 'Participated in a private real-time coding session',
    timestamp: Date.now(),
  })
  stats.activityLog = stats.activityLog.slice(0, 30)
  saveProfileStats(username, stats)
}

export function incrementProfileExecutionCount(username?: string, lang?: string) {
  if (!username) return
  const stats = getProfileStats(username)
  stats.executionsCount += 1
  stats.activityLog.unshift({
    id: crypto.randomUUID(),
    type: 'execution',
    title: `Executed ${lang || 'Code'} Program`,
    description: `Ran code successfully via isolated compiler sandbox`,
    timestamp: Date.now(),
  })
  stats.activityLog = stats.activityLog.slice(0, 30)
  saveProfileStats(username, stats)
}

export function buildDeveloperProfile(
  authUser: AuthUser | null,
  publicReposCount = 0,
  projectsCount = 0
): DeveloperProfile {
  const username = authUser?.login || authUser?.name || 'Developer'
  const stats = getProfileStats(username)

  const topLanguages = [
    { name: 'TypeScript', percentage: 38, color: '#3178c6' },
    { name: 'Python', percentage: 28, color: '#3572A5' },
    { name: 'C#', percentage: 18, color: '#178600' },
    { name: 'C++', percentage: 10, color: '#f34b7d' },
    { name: 'Rust', percentage: 6, color: '#dea584' },
  ]

  const achievements = [
    {
      id: 'polyglot',
      title: 'Polyglot Developer',
      description: 'Compiled code in 3+ languages on CodeForge',
      icon: '🌐',
      unlockedAt: Date.now() - 86400000 * 5,
    },
    {
      id: 'multiplayer',
      title: 'Multiplayer Pioneer',
      description: 'Created and coded in a live private collaboration room',
      icon: '👥',
      unlockedAt: Date.now() - 86400000 * 2,
    },
    {
      id: 'csharp_pro',
      title: 'C# .NET Pioneer',
      description: 'Built and executed enterprise C# programs in CodeForge',
      icon: '🔷',
      unlockedAt: Date.now() - 86400000 * 1,
    },
    {
      id: 'verified',
      title: 'Verified GitHub Developer',
      description: 'Connected official GitHub identity & repositories',
      icon: '🛡️',
      unlockedAt: Date.now() - 86400000 * 10,
    },
  ]

  return {
    id: authUser?.id || 'dev_user',
    githubId: authUser?.id || '10293847',
    username,
    name: authUser?.name || username,
    avatarUrl: authUser?.avatarUrl || 'https://github.com/ghost.png',
    profileUrl: `https://github.com/${username}`,
    bio: 'Software engineer building modern high-performance web applications and real-time distributed systems.',
    location: 'Global',
    publicReposCount: Math.max(publicReposCount, 6),
    codeforgeProjectsCount: Math.max(projectsCount, 4),
    totalCollaborationsCount: Math.max(stats.collaborationsCount, 1),
    codeExecutionsCount: Math.max(stats.executionsCount, 15),
    topLanguages,
    achievements,
    recentActivity: stats.activityLog.length ? stats.activityLog : [
      {
        id: 'act_1',
        type: 'collaboration',
        title: 'Joined Live Room',
        description: 'Collaborative pair programming in C# / Python',
        timestamp: Date.now() - 1000 * 60 * 15,
      },
      {
        id: 'act_2',
        type: 'execution',
        title: 'Executed Program.cs',
        description: 'Compiled and executed in 0.082s via isolated sandbox',
        timestamp: Date.now() - 1000 * 60 * 45,
      },
      {
        id: 'act_3',
        type: 'commit',
        title: 'Committed to repository',
        description: 'Pushed code changes to main branch',
        timestamp: Date.now() - 1000 * 60 * 60 * 3,
      },
    ],
  }
}

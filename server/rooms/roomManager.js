import crypto from 'crypto';
import db from '../persistence/database.js';

export function generateRoomCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let p1 = '';
  let p2 = '';
  for (let i = 0; i < 4; i++) p1 += chars.charAt(Math.floor(Math.random() * chars.length));
  for (let i = 0; i < 4; i++) p2 += chars.charAt(Math.floor(Math.random() * chars.length));
  return `CF-${p1}-${p2}`;
}

export function generateSecureToken() {
  return 'cf_inv_' + crypto.randomBytes(16).toString('hex');
}

export class RoomManager {
  constructor() {
    this.activeSockets = new Map(); // socketId -> { roomId, userId, role }
  }

  // ── Create Private Room ────────────────────────────────────────────────────
  async createRoom({ name, description, language, ownerId, ownerUsername, initialFiles, id, customRoomCode, roomCode: passedCode, inviteToken: passedToken }) {
    const roomId = id || 'room_' + crypto.randomBytes(8).toString('hex');
    const roomCode = passedCode || customRoomCode || generateRoomCode();
    const inviteToken = passedToken || generateSecureToken();

    const files = initialFiles && initialFiles.length > 0
      ? initialFiles
      : [
          {
            id: 'file_main',
            name: language === 'csharp' ? 'Program.cs' : language === 'python' ? 'main.py' : 'main.js',
            lang: language || 'javascript',
            code: '// CodeForge Collaborative Workspace\nconsole.log("Hello from live collaboration!");\n',
          },
        ];

    const ownerMember = {
      id: 'mem_' + crypto.randomBytes(6).toString('hex'),
      userId: ownerId,
      githubUsername: ownerUsername,
      avatarUrl: `https://github.com/${ownerUsername}.png`,
      role: 'owner',
      joinedAt: Date.now(),
      isOnline: true,
      color: '#8b5cf6',
    };

    const room = {
      id: roomId,
      name: name || 'Untitled Room',
      description: description || '',
      roomCode,
      ownerId,
      ownerUsername,
      language: language || 'javascript',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      isPrivate: true,
      inviteToken,
      members: [ownerMember],
      files,
      activeFileId: files[0]?.id || 'file_main',
    };

    // Save invitation record
    await db.saveInvitation({
      id: 'inv_' + crypto.randomBytes(6).toString('hex'),
      roomId,
      token: inviteToken,
      createdBy: ownerId,
      createdAt: Date.now(),
      expiresAt: null, // Default initial room owner token does not auto-expire
      isSingleUse: false,
      usedCount: 0,
      isRevoked: false,
    });

    await db.saveRoom(room);
    return room;
  }

  // ── Join Room Authorization & Validation ───────────────────────────────────
  async joinRoom({ roomIdentifier, user, token, roomData }) {
    // Look up by roomId or roomCode
    let room = await db.getRoom(roomIdentifier);
    if (!room) {
      room = await db.getRoomByCode(roomIdentifier);
    }

    // Auto-register room if roomData was provided (e.g. created on frontend client)
    if (!room && roomData && (roomData.ownerId === user.id || roomData.ownerUsername === user.username)) {
      room = await this.createRoom({
        id: roomData.id || roomIdentifier,
        name: roomData.name || 'Collaboration Room',
        description: roomData.description || '',
        language: roomData.language || 'csharp',
        ownerId: user.id,
        ownerUsername: user.username,
        customRoomCode: roomData.roomCode,
        roomCode: roomData.roomCode,
        inviteToken: roomData.inviteToken || token,
        initialFiles: roomData.files,
      });
    }

    if (!room) {
      return { success: false, error: 'Room not found. Check the Room ID or invitation code.' };
    }

    // Check if user is already a member
    let member = room.members.find((m) => m.userId === user.id);

    if (!member) {
      // Validate invitation token
      if (token) {
        const inv = await db.getInvitation(token);
        const isValidToken = (inv && inv.roomId === room.id && !inv.isRevoked && (!inv.expiresAt || Date.now() <= inv.expiresAt)) || (token === room.inviteToken);
        if (!isValidToken) {
          return { success: false, error: 'Invalid or expired invitation token for this room.' };
        }
        if (inv) {
          if (inv.isSingleUse && inv.usedCount > 0) {
            return { success: false, error: 'This single-use invitation has already been claimed.' };
          }
          inv.usedCount = (inv.usedCount || 0) + 1;
          await db.saveInvitation(inv);
        }
      } else if (room.ownerId !== user.id) {
        // Joining without a token is only allowed if user is already in the member list
        return { success: false, error: 'An invitation link or authorized Room token is required.' };
      }

      // Assign distinct cursor color
      const colors = ['#8b5cf6', '#38bdf8', '#10b981', '#f59e0b', '#ec4899', '#6366f1', '#14b8a6', '#f43f5e'];
      const assignedColor = colors[room.members.length % colors.length];

      member = {
        id: 'mem_' + crypto.randomBytes(6).toString('hex'),
        userId: user.id,
        githubUsername: user.username,
        avatarUrl: user.avatarUrl || `https://github.com/${user.username}.png`,
        role: room.ownerId === user.id ? 'owner' : 'editor',
        joinedAt: Date.now(),
        isOnline: true,
        color: assignedColor,
      };

      room.members.push(member);
    } else {
      member.isOnline = true;
    }

    await db.saveRoom(room);
    return { success: true, room, member };
  }

  // ── Role Permissions Check ─────────────────────────────────────────────────
  async checkPermission(roomId, userId, action) {
    const room = await db.getRoom(roomId);
    if (!room) return false;

    const member = room.members.find((m) => m.userId === userId);
    if (!member) return false;

    const role = (member.role || 'viewer').toLowerCase();

    switch (action) {
      case 'edit_code':
      case 'create_file':
      case 'delete_file':
      case 'rename_file':
      case 'run_code':
        return role === 'owner' || role === 'editor';

      case 'manage_members':
      case 'change_role':
      case 'revoke_invite':
      case 'end_room':
        return role === 'owner';

      case 'view':
      case 'chat':
      case 'voice':
        return true;

      default:
        return false;
    }
  }

  // ── Leave Room ─────────────────────────────────────────────────────────────
  async leaveRoom(roomId, userId) {
    const room = await db.getRoom(roomId);
    if (!room) return null;

    const member = room.members.find((m) => m.userId === userId);
    if (member) {
      member.isOnline = false;
      await db.saveRoom(room);
    }
    return room;
  }
}

export const roomManager = new RoomManager();
export default roomManager;

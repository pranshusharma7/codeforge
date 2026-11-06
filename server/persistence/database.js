import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import config from '../config/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, '../data');
const DATA_FILE = path.join(DATA_DIR, 'collab-db.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

class DatabaseAdapter {
  constructor() {
    this.pgClient = null;
    this.memoryStore = {
      users: {},
      rooms: {},
      members: {},
      invitations: {},
      messages: {},
      files: {},
      docUpdates: {},
      snapshots: {},
      comments: {},
    };
    this.init();
  }

  init() {
    // Attempt local file restoration
    if (fs.existsSync(DATA_FILE)) {
      try {
        const raw = fs.readFileSync(DATA_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        this.memoryStore = { ...this.memoryStore, ...parsed };
      } catch (err) {
        console.warn('[DB] Failed reading local database file, initializing empty store:', err.message);
      }
    }
  }

  save() {
    try {
      fs.writeFileSync(DATA_FILE, JSON.stringify(this.memoryStore, null, 2), 'utf-8');
    } catch (err) {
      console.error('[DB] Failed saving data to disk:', err.message);
    }
  }

  // ── Rooms ──────────────────────────────────────────────────────────────────
  async getRoom(roomId) {
    return this.memoryStore.rooms[roomId] || null;
  }

  async getRoomByCode(roomCode) {
    const rooms = Object.values(this.memoryStore.rooms);
    return rooms.find((r) => r.roomCode.toLowerCase() === roomCode.toLowerCase()) || null;
  }

  async saveRoom(room) {
    this.memoryStore.rooms[room.id] = {
      ...room,
      updatedAt: Date.now(),
    };
    this.save();
    return this.memoryStore.rooms[room.id];
  }

  async deleteRoom(roomId) {
    delete this.memoryStore.rooms[roomId];
    delete this.memoryStore.messages[roomId];
    delete this.memoryStore.files[roomId];
    delete this.memoryStore.snapshots[roomId];
    delete this.memoryStore.docUpdates[roomId];
    this.save();
    return true;
  }

  // ── Members ────────────────────────────────────────────────────────────────
  async getRoomMembers(roomId) {
    const room = this.memoryStore.rooms[roomId];
    return room ? room.members || [] : [];
  }

  async updateMemberRole(roomId, userId, newRole) {
    const room = this.memoryStore.rooms[roomId];
    if (!room) return null;
    const member = room.members.find((m) => m.userId === userId);
    if (member) {
      member.role = newRole;
      this.save();
    }
    return member;
  }

  async removeMember(roomId, userId) {
    const room = this.memoryStore.rooms[roomId];
    if (!room) return false;
    room.members = room.members.filter((m) => m.userId !== userId);
    this.save();
    return true;
  }

  // ── Invitations ────────────────────────────────────────────────────────────
  async saveInvitation(invite) {
    this.memoryStore.invitations[invite.token] = invite;
    this.save();
    return invite;
  }

  async getInvitation(token) {
    return this.memoryStore.invitations[token] || null;
  }

  async revokeInvitation(token) {
    const inv = this.memoryStore.invitations[token];
    if (inv) {
      inv.isRevoked = true;
      this.save();
    }
    return inv;
  }

  // ── Chat Messages ──────────────────────────────────────────────────────────
  async getMessages(roomId) {
    return this.memoryStore.messages[roomId] || [];
  }

  async saveMessage(roomId, msg) {
    if (!this.memoryStore.messages[roomId]) {
      this.memoryStore.messages[roomId] = [];
    }
    this.memoryStore.messages[roomId].push(msg);
    // Keep last 500 messages per room
    if (this.memoryStore.messages[roomId].length > 500) {
      this.memoryStore.messages[roomId].shift();
    }
    this.save();
    return msg;
  }

  // ── Multi-File Project Structure ───────────────────────────────────────────
  async getRoomFiles(roomId) {
    const room = this.memoryStore.rooms[roomId];
    return room ? room.files || [] : [];
  }

  async saveFile(roomId, file) {
    const room = this.memoryStore.rooms[roomId];
    if (!room) return null;
    if (!room.files) room.files = [];
    const idx = room.files.findIndex((f) => f.id === file.id || f.name === file.name);
    if (idx >= 0) {
      room.files[idx] = { ...room.files[idx], ...file };
    } else {
      room.files.push(file);
    }
    this.save();
    return file;
  }

  async deleteFile(roomId, fileId) {
    const room = this.memoryStore.rooms[roomId];
    if (!room || !room.files) return false;
    room.files = room.files.filter((f) => f.id !== fileId);
    this.save();
    return true;
  }

  // ── Snapshots & Time-Travel History ────────────────────────────────────────
  async getSnapshots(roomId) {
    return this.memoryStore.snapshots[roomId] || [];
  }

  async saveSnapshot(roomId, snapshot) {
    if (!this.memoryStore.snapshots[roomId]) {
      this.memoryStore.snapshots[roomId] = [];
    }
    this.memoryStore.snapshots[roomId].unshift(snapshot);
    this.save();
    return snapshot;
  }

  // ── Document Yjs CRDT State Persistence ────────────────────────────────────
  async getDocUpdates(roomId, fileId) {
    const key = `${roomId}:${fileId}`;
    return this.memoryStore.docUpdates[key] || [];
  }

  async saveDocUpdate(roomId, fileId, updateBase64) {
    const key = `${roomId}:${fileId}`;
    if (!this.memoryStore.docUpdates[key]) {
      this.memoryStore.docUpdates[key] = [];
    }
    this.memoryStore.docUpdates[key].push(updateBase64);
    // Compact if too many individual update chunks accumulate
    if (this.memoryStore.docUpdates[key].length > 1000) {
      this.memoryStore.docUpdates[key] = this.memoryStore.docUpdates[key].slice(-500);
    }
    this.save();
  }
}

export const db = new DatabaseAdapter();
export default db;


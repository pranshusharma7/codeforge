import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import config from './config/index.js';
import db from './persistence/database.js';
import roomManager from './rooms/roomManager.js';
import yjsRelay from './services/yjsRelay.js';
import registerWebRTCSignaling from './signaling/webrtcSignaling.js';

const app = express();
const server = http.createServer(app);

// ── Middleware ───────────────────────────────────────────────────────────────
app.use(cors({
  origin: config.clientOrigins,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));

// ── Health & Diagnostic Endpoints ────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'codeforge-collab-server',
    uptime: process.uptime(),
    timestamp: Date.now(),
    features: ['yjs-crdt', 'webrtc-voice', 'screen-sharing', 'shared-terminal', 'whiteboard'],
  });
});

// ── REST APIs for Rooms & Invitations ────────────────────────────────────────
app.post('/api/rooms', async (req, res) => {
  try {
    const { name, description, language, ownerId, ownerUsername, initialFiles } = req.body;
    if (!ownerId || !ownerUsername) {
      return res.status(400).json({ error: 'Owner identity required' });
    }
    const room = await roomManager.createRoom({
      name,
      description,
      language,
      ownerId,
      ownerUsername,
      initialFiles,
    });
    res.status(201).json({ success: true, room });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/rooms/:identifier', async (req, res) => {
  try {
    const { identifier } = req.params;
    let room = await db.getRoom(identifier);
    if (!room) {
      room = await db.getRoomByCode(identifier);
    }
    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }
    res.json({ success: true, room });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/rooms/:roomId/snapshots', async (req, res) => {
  try {
    const { roomId } = req.params;
    const { name, createdBy, files } = req.body;
    const snapshot = {
      id: 'snap_' + Date.now(),
      roomId,
      name: name || `Snapshot ${new Date().toLocaleTimeString()}`,
      createdAt: Date.now(),
      createdBy: createdBy || 'Developer',
      fileCount: (files || []).length,
      files: files || [],
    };
    await db.saveSnapshot(roomId, snapshot);
    res.status(201).json({ success: true, snapshot });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/rooms/:roomId/snapshots', async (req, res) => {
  try {
    const { roomId } = req.params;
    const snapshots = await db.getSnapshots(roomId);
    res.json({ success: true, snapshots });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Socket.IO Real-Time Server ───────────────────────────────────────────────
const io = new Server(server, {
  cors: {
    origin: config.clientOrigins,
    methods: ['GET', 'POST'],
    credentials: true,
  },
  pingInterval: 10000,
  pingTimeout: 5000,
  maxHttpBufferSize: 1e7, // 10MB
});

io.on('connection', (socket) => {
  // ── 1. Join Room ───────────────────────────────────────────────────────────
  socket.on('join-room', async ({ roomIdentifier, user, token, roomData }, callback) => {
    try {
      if (!user || !user.id || !user.username) {
        return callback?.({ success: false, error: 'User identity required' });
      }

      const result = await roomManager.joinRoom({ roomIdentifier, user, token, roomData });
      if (!result.success) {
        return callback?.(result);
      }

      const { room, member } = result;

      // Associate socket session data
      socket.data.userId = user.id;
      socket.data.username = user.username;
      socket.data.roomId = room.id;
      socket.data.role = member.role;

      // Join Socket.IO room channel
      socket.join(`room:${room.id}`);

      // Fetch existing room chat history & snapshots
      const messages = await db.getMessages(room.id);
      const snapshots = await db.getSnapshots(room.id);

      // Notify others in room
      socket.to(`room:${room.id}`).emit('member-joined', {
        member,
        roomId: room.id,
      });

      // System message broadcast
      const sysMsg = {
        id: 'msg_sys_' + Date.now(),
        roomId: room.id,
        userId: 'system',
        username: 'System',
        avatarUrl: '',
        role: 'system',
        text: `@${user.username} joined the collaboration room.`,
        timestamp: Date.now(),
        isSystem: true,
      };
      await db.saveMessage(room.id, sysMsg);
      io.to(`room:${room.id}`).emit('new-message', sysMsg);

      // Reply with full initial state
      callback?.({
        success: true,
        room,
        member,
        messages,
        snapshots,
      });
    } catch (err) {
      console.error('[Socket] Join room error:', err);
      callback?.({ success: false, error: err.message });
    }
  });

  // ── 2. Yjs CRDT Synchronization ───────────────────────────────────────────
  socket.on('yjs-sync-request', async ({ roomId, fileId, initialContent }, callback) => {
    try {
      const syncState = await yjsRelay.getDocSyncState(roomId, fileId, initialContent);
      callback?.({ success: true, syncState });
    } catch (err) {
      callback?.({ success: false, error: err.message });
    }
  });

  socket.on('yjs-update', async ({ roomId, fileId, update }) => {
    // Permission check: viewer cannot edit code
    const canEdit = await roomManager.checkPermission(roomId, socket.data.userId, 'edit_code');
    if (!canEdit) {
      socket.emit('permission-denied', { action: 'edit_code', reason: 'Viewers cannot modify code.' });
      return;
    }

    // Apply update to server document state
    await yjsRelay.handleDocUpdate(roomId, fileId, update, socket.data.userId);

    // Broadcast delta update to other peers in room
    socket.to(`room:${roomId}`).emit('yjs-update', {
      fileId,
      update,
      senderId: socket.data.userId,
    });
  });

  // ── 3. Live Cursor & Selection ─────────────────────────────────────────────
  socket.on('cursor-update', ({ roomId, fileId, cursor }) => {
    socket.to(`room:${roomId}`).emit('cursor-update', {
      fileId,
      cursor: {
        ...cursor,
        userId: socket.data.userId,
        username: socket.data.username,
      },
    });
  });

  // ── 4. Ping Line ("Look Here") ─────────────────────────────────────────────
  socket.on('ping-line', ({ roomId, fileId, lineNumber, color }) => {
    io.to(`room:${roomId}`).emit('line-pinged', {
      roomId,
      fileId,
      lineNumber,
      userId: socket.data.userId,
      username: socket.data.username,
      color: color || '#8b5cf6',
      timestamp: Date.now(),
    });
  });

  // ── 5. Follow Mode ─────────────────────────────────────────────────────────
  socket.on('follow-user', ({ roomId, targetUserId }) => {
    socket.to(`room:${roomId}`).emit('user-followed', {
      followerId: socket.data.userId,
      followerUsername: socket.data.username,
      targetUserId,
    });
  });

  // ── 6. Multi-File Project Sync ─────────────────────────────────────────────
  socket.on('file-create', async ({ roomId, file }, callback) => {
    const canCreate = await roomManager.checkPermission(roomId, socket.data.userId, 'create_file');
    if (!canCreate) {
      return callback?.({ success: false, error: 'Permission denied: Viewers cannot create files.' });
    }

    await db.saveFile(roomId, file);
    socket.to(`room:${roomId}`).emit('file-created', { file });
    callback?.({ success: true, file });
  });

  socket.on('file-delete', async ({ roomId, fileId }, callback) => {
    const canDelete = await roomManager.checkPermission(roomId, socket.data.userId, 'delete_file');
    if (!canDelete) {
      return callback?.({ success: false, error: 'Permission denied: Viewers cannot delete files.' });
    }

    await db.deleteFile(roomId, fileId);
    socket.to(`room:${roomId}`).emit('file-deleted', { fileId });
    callback?.({ success: true, fileId });
  });

  socket.on('file-rename', async ({ roomId, fileId, newName }, callback) => {
    const canRename = await roomManager.checkPermission(roomId, socket.data.userId, 'rename_file');
    if (!canRename) {
      return callback?.({ success: false, error: 'Permission denied: Viewers cannot rename files.' });
    }

    const room = await db.getRoom(roomId);
    const targetFile = room?.files?.find((f) => f.id === fileId);
    if (targetFile) {
      targetFile.name = newName;
      await db.saveRoom(room);
      socket.to(`room:${roomId}`).emit('file-renamed', { fileId, newName });
      callback?.({ success: true });
    } else {
      callback?.({ success: false, error: 'File not found' });
    }
  });

  // ── 7. Shared Terminal Execution Streaming ─────────────────────────────────
  socket.on('terminal-run-start', async ({ roomId, lang, fileName }) => {
    const canRun = await roomManager.checkPermission(roomId, socket.data.userId, 'run_code');
    if (!canRun) {
      socket.emit('permission-denied', { action: 'run_code', reason: 'Viewers cannot execute code.' });
      return;
    }

    io.to(`room:${roomId}`).emit('terminal-stream', {
      type: 'start',
      ownerId: socket.data.userId,
      ownerUsername: socket.data.username,
      lang,
      fileName,
      timestamp: Date.now(),
    });
  });

  socket.on('terminal-stream-chunk', ({ roomId, chunk, isError }) => {
    socket.to(`room:${roomId}`).emit('terminal-stream', {
      type: isError ? 'stderr' : 'stdout',
      chunk,
      ownerId: socket.data.userId,
      timestamp: Date.now(),
    });
  });

  socket.on('terminal-run-end', ({ roomId, exitCode, durationMs }) => {
    io.to(`room:${roomId}`).emit('terminal-stream', {
      type: 'exit',
      exitCode,
      durationMs,
      ownerId: socket.data.userId,
      timestamp: Date.now(),
    });
  });

  // ── 8. Chat Messages ───────────────────────────────────────────────────────
  socket.on('send-message', async ({ roomId, text }, callback) => {
    if (!text || !text.trim()) return;

    const message = {
      id: 'msg_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      roomId,
      userId: socket.data.userId,
      username: socket.data.username,
      avatarUrl: `https://github.com/${socket.data.username}.png`,
      role: socket.data.role || 'editor',
      text: text.trim().substring(0, 1000), // sanitize max length
      timestamp: Date.now(),
    };

    await db.saveMessage(roomId, message);
    io.to(`room:${roomId}`).emit('new-message', message);
    callback?.({ success: true, message });
  });

  // ── 9. Member Role Management & Kick (Owner only) ──────────────────────────
  socket.on('change-member-role', async ({ roomId, targetUserId, newRole }, callback) => {
    const canManage = await roomManager.checkPermission(roomId, socket.data.userId, 'manage_members');
    if (!canManage) {
      return callback?.({ success: false, error: 'Only room owners can change roles.' });
    }

    const updated = await db.updateMemberRole(roomId, targetUserId, newRole);
    io.to(`room:${roomId}`).emit('member-role-updated', {
      targetUserId,
      newRole,
    });
    callback?.({ success: true, updated });
  });

  socket.on('kick-member', async ({ roomId, targetUserId }, callback) => {
    const canManage = await roomManager.checkPermission(roomId, socket.data.userId, 'manage_members');
    if (!canManage) {
      return callback?.({ success: false, error: 'Only room owners can kick members.' });
    }

    await db.removeMember(roomId, targetUserId);
    io.to(`room:${roomId}`).emit('member-kicked', {
      targetUserId,
      roomId,
    });
    callback?.({ success: true });
  });

  // ── 10. Collaborative Whiteboard ───────────────────────────────────────────
  socket.on('whiteboard-draw', ({ roomId, element }) => {
    socket.to(`room:${roomId}`).emit('whiteboard-element', { element });
  });

  socket.on('whiteboard-clear', ({ roomId }) => {
    io.to(`room:${roomId}`).emit('whiteboard-cleared');
  });

  // ── 11. Register WebRTC Voice & Screen Signaling ───────────────────────────
  registerWebRTCSignaling(io, socket);

  // ── 12. Disconnect Cleanup ─────────────────────────────────────────────────
  socket.on('disconnect', async () => {
    const { roomId, userId, username } = socket.data;
    if (roomId && userId) {
      await roomManager.leaveRoom(roomId, userId);
      socket.to(`room:${roomId}`).emit('member-left', {
        userId,
        username,
        roomId,
      });
    }
  });
});

// ── Start Server ─────────────────────────────────────────────────────────────
const PORT = config.port;
server.listen(PORT, config.host, () => {
  console.log(`\n================================================================`);
  console.log(`🚀 CodeForge Real-Time Collaboration Server running on port ${PORT}`);
  console.log(`📡 WebSocket Transport: Socket.IO + Yjs CRDT + WebRTC Mesh`);
  console.log(`🌐 Health endpoint: http://${config.host}:${PORT}/health`);
  console.log(`================================================================\n`);
});

// Graceful termination
process.on('SIGTERM', () => {
  console.log('[Server] SIGTERM received. Gracefully shutting down...');
  server.close(() => process.exit(0));
});
process.on('SIGINT', () => {
  console.log('[Server] SIGINT received. Gracefully shutting down...');
  server.close(() => process.exit(0));
});

export default server;

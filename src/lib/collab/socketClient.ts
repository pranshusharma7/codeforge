import { io, Socket } from 'socket.io-client';
import type {
  CollabRoom,
  DeveloperProfile,
  RoomMember,
  RoomMessage,
  RemoteCursor,
  PingLineEvent,
  TerminalStreamEvent,
  WhiteboardElement,
} from './types';

// Default collab server URL from environment or standard port 4000
const COLLAB_SERVER_URL =
  (import.meta as any).env?.VITE_COLLAB_SERVER_URL ||
  (typeof window !== 'undefined' && window.location.hostname !== 'localhost'
    ? `${window.location.protocol}//${window.location.hostname}:4000`
    : 'http://localhost:4000');

class CollabSocketClient {
  private socket: Socket | null = null;
  private currentRoomId: string | null = null;
  private currentUser: DeveloperProfile | null = null;
  private connectionStatus: 'disconnected' | 'connecting' | 'connected' | 'reconnecting' = 'disconnected';
  private listeners: Map<string, Set<Function>> = new Map();

  constructor() {
    // Lazy initialized when entering room
  }

  public getConnectionStatus() {
    return this.connectionStatus;
  }

  public getSocket(): Socket | null {
    return this.socket;
  }

  // ── Initialize Socket Connection ───────────────────────────────────────────
  public connect(): Socket {
    if (this.socket && this.socket.connected) {
      return this.socket;
    }

    this.connectionStatus = 'connecting';
    this.emitStatusChange();

    this.socket = io(COLLAB_SERVER_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 10000,
    });

    this.socket.on('connect', () => {
      this.connectionStatus = 'connected';
      this.emitStatusChange();
      console.log('[CollabSocket] Connected to real-time collaboration server:', COLLAB_SERVER_URL);

      // Re-join active room if reconnecting
      if (this.currentRoomId && this.currentUser) {
        this.joinRoom(this.currentRoomId, this.currentUser);
      }
    });

    this.socket.on('disconnect', (reason) => {
      this.connectionStatus = reason === 'io client disconnect' ? 'disconnected' : 'reconnecting';
      this.emitStatusChange();
      console.warn('[CollabSocket] Disconnected from collaboration server:', reason);
    });

    this.socket.on('connect_error', (err) => {
      this.connectionStatus = 'disconnected';
      this.emitStatusChange();
      console.warn('[CollabSocket] Server connection error (operating in local fallback mode):', err.message);
    });

    // ── Forward Socket Events to Subscribers ─────────────────────────────────
    this.socket.on('member-joined', (data) => this.dispatch('member-joined', data));
    this.socket.on('member-left', (data) => this.dispatch('member-left', data));
    this.socket.on('member-role-updated', (data) => this.dispatch('member-role-updated', data));
    this.socket.on('member-kicked', (data) => this.dispatch('member-kicked', data));
    this.socket.on('new-message', (data) => this.dispatch('new-message', data));
    this.socket.on('yjs-update', (data) => this.dispatch('yjs-update', data));
    this.socket.on('cursor-update', (data) => this.dispatch('cursor-update', data));
    this.socket.on('line-pinged', (data: PingLineEvent) => this.dispatch('line-pinged', data));
    this.socket.on('user-followed', (data) => this.dispatch('user-followed', data));
    this.socket.on('file-created', (data) => this.dispatch('file-created', data));
    this.socket.on('file-deleted', (data) => this.dispatch('file-deleted', data));
    this.socket.on('file-renamed', (data) => this.dispatch('file-renamed', data));
    this.socket.on('terminal-stream', (data: TerminalStreamEvent) => this.dispatch('terminal-stream', data));
    this.socket.on('whiteboard-element', (data) => this.dispatch('whiteboard-element', data));
    this.socket.on('whiteboard-cleared', () => this.dispatch('whiteboard-cleared', null));
    this.socket.on('permission-denied', (data) => this.dispatch('permission-denied', data));

    return this.socket;
  }

  // ── Join Collaboration Room ────────────────────────────────────────────────
  public async joinRoom(
    roomIdentifier: string,
    user: DeveloperProfile,
    token?: string,
    roomData?: Partial<CollabRoom>
  ): Promise<{ success: boolean; room?: CollabRoom; error?: string }> {
    const socket = this.connect();
    this.currentRoomId = roomIdentifier;
    this.currentUser = user;

    return new Promise((resolve) => {
      socket.emit('join-room', { roomIdentifier, user, token, roomData }, (res: any) => {
        if (res && res.success) {
          this.currentRoomId = res.room.id;
          resolve({ success: true, room: res.room });
        } else {
          resolve({ success: false, error: res?.error || 'Failed joining room' });
        }
      });
    });
  }

  // ── Leave Room ─────────────────────────────────────────────────────────────
  public leaveRoom() {
    if (this.socket && this.currentRoomId) {
      this.socket.emit('leave-room', { roomId: this.currentRoomId });
      this.currentRoomId = null;
    }
  }

  // ── Yjs CRDT Synchronization ───────────────────────────────────────────────
  public emitYjsUpdate(fileId: string, updateBase64: string) {
    if (this.socket?.connected && this.currentRoomId) {
      this.socket.emit('yjs-update', {
        roomId: this.currentRoomId,
        fileId,
        update: updateBase64,
      });
    }
  }

  public async requestInitialDocSync(fileId: string, initialContent?: string): Promise<string | null> {
    if (!this.socket?.connected || !this.currentRoomId) return null;
    return new Promise((resolve) => {
      this.socket?.emit(
        'yjs-sync-request',
        { roomId: this.currentRoomId, fileId, initialContent },
        (res: any) => {
          resolve(res?.success ? res.syncState : null);
        }
      );
    });
  }

  // ── Cursor Position ────────────────────────────────────────────────────────
  public emitCursor(fileId: string, cursor: RemoteCursor) {
    if (this.socket?.connected && this.currentRoomId) {
      this.socket.emit('cursor-update', {
        roomId: this.currentRoomId,
        fileId,
        cursor,
      });
    }
  }

  // ── Ping Line ("Look Here") ────────────────────────────────────────────────
  public pingLine(fileId: string, lineNumber: number, color?: string) {
    if (this.socket?.connected && this.currentRoomId) {
      this.socket.emit('ping-line', {
        roomId: this.currentRoomId,
        fileId,
        lineNumber,
        color,
      });
    }
  }

  // ── Follow User ────────────────────────────────────────────────────────────
  public followUser(targetUserId: string) {
    if (this.socket?.connected && this.currentRoomId) {
      this.socket.emit('follow-user', {
        roomId: this.currentRoomId,
        targetUserId,
      });
    }
  }

  // ── Multi-File Project Sync ────────────────────────────────────────────────
  public emitFileCreate(file: { id: string; name: string; lang: string; code: string }) {
    if (this.socket?.connected && this.currentRoomId) {
      this.socket.emit('file-create', { roomId: this.currentRoomId, file });
    }
  }

  public emitFileDelete(fileId: string) {
    if (this.socket?.connected && this.currentRoomId) {
      this.socket.emit('file-delete', { roomId: this.currentRoomId, fileId });
    }
  }

  public emitFileRename(fileId: string, newName: string) {
    if (this.socket?.connected && this.currentRoomId) {
      this.socket.emit('file-rename', { roomId: this.currentRoomId, fileId, newName });
    }
  }

  // ── Shared Terminal Execution Streaming ────────────────────────────────────
  public emitTerminalRunStart(lang: string, fileName: string) {
    if (this.socket?.connected && this.currentRoomId) {
      this.socket.emit('terminal-run-start', { roomId: this.currentRoomId, lang, fileName });
    }
  }

  public emitTerminalChunk(chunk: string, isError = false) {
    if (this.socket?.connected && this.currentRoomId) {
      this.socket.emit('terminal-stream-chunk', { roomId: this.currentRoomId, chunk, isError });
    }
  }

  public emitTerminalRunEnd(exitCode = 0, durationMs = 0) {
    if (this.socket?.connected && this.currentRoomId) {
      this.socket.emit('terminal-run-end', { roomId: this.currentRoomId, exitCode, durationMs });
    }
  }

  // ── Collaborative Whiteboard ───────────────────────────────────────────────
  public emitWhiteboardDraw(element: WhiteboardElement) {
    if (this.socket?.connected && this.currentRoomId) {
      this.socket.emit('whiteboard-draw', { roomId: this.currentRoomId, element });
    }
  }

  public emitWhiteboardClear() {
    if (this.socket?.connected && this.currentRoomId) {
      this.socket.emit('whiteboard-clear', { roomId: this.currentRoomId });
    }
  }

  // ── Chat Messaging ─────────────────────────────────────────────────────────
  public sendMessage(text: string): Promise<boolean> {
    return new Promise((resolve) => {
      if (!this.socket?.connected || !this.currentRoomId) {
        resolve(false);
        return;
      }
      this.socket.emit('send-message', { roomId: this.currentRoomId, text }, (res: any) => {
        resolve(!!res?.success);
      });
    });
  }

  // ── Roles & Permissions ────────────────────────────────────────────────────
  public changeMemberRole(targetUserId: string, newRole: string) {
    if (this.socket?.connected && this.currentRoomId) {
      this.socket.emit('change-member-role', { roomId: this.currentRoomId, targetUserId, newRole });
    }
  }

  public kickMember(targetUserId: string) {
    if (this.socket?.connected && this.currentRoomId) {
      this.socket.emit('kick-member', { roomId: this.currentRoomId, targetUserId });
    }
  }

  // ── Subscriptions ──────────────────────────────────────────────────────────
  public on(event: string, callback: Function) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
    return () => this.off(event, callback);
  }

  public off(event: string, callback: Function) {
    this.listeners.get(event)?.delete(callback);
  }

  private dispatch(event: string, payload: any) {
    this.listeners.get(event)?.forEach((fn) => {
      try {
        fn(payload);
      } catch (err) {
        console.error(`[CollabSocket] Error in listener for ${event}:`, err);
      }
    });
  }

  private emitStatusChange() {
    this.dispatch('status-change', this.connectionStatus);
  }
}

export const socketClient = new CollabSocketClient();
export default socketClient;

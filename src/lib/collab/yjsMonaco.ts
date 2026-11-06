import * as Y from 'yjs';
import type { RemoteCursor, PingLineEvent } from './types';
import socketClient from './socketClient';

export interface CollabSessionOptions {
  roomId: string;
  fileId: string;
  userId: string;
  username: string;
  color: string;
  initialCode?: string;
  readOnly?: boolean;
  onRemoteCursorChange?: (cursors: RemoteCursor[]) => void;
  followingUserId?: string | null;
}

export class CollabMonacoSession {
  public doc: Y.Doc;
  public ytext: Y.Text;
  private monacoEditor: any = null;
  private monacoModel: any = null;
  private options: CollabSessionOptions;
  private channel: BroadcastChannel;
  private isApplyingRemote = false;
  private remoteCursors = new Map<string, RemoteCursor>();
  private cursorDecorationIds: string[] = [];
  private pingDecorationIds: string[] = [];
  private socketUnsubscribers: (() => void)[] = [];
  private disposed = false;
  private injectedStyles = new Set<string>();

  constructor(options: CollabSessionOptions) {
    this.options = options;
    this.doc = new Y.Doc();
    this.ytext = this.doc.getText('code');

    // 1. Initialize document content if provided
    if (this.ytext.length === 0 && options.initialCode) {
      this.doc.transact(() => {
        this.ytext.insert(0, options.initialCode!);
      });
    }

    // 2. Local BroadcastChannel transport (instant same-machine tab sync)
    this.channel = new BroadcastChannel(`cf_collab_room_${options.roomId}_${options.fileId}`);
    this.channel.onmessage = this.handleChannelMessage.bind(this);

    // 3. Listen to local Yjs document changes and broadcast to BOTH WebSocket and BroadcastChannel
    this.doc.on('update', (update: Uint8Array, origin: any) => {
      if (origin !== 'remote' && !this.disposed) {
        const base64 = btoa(String.fromCharCode(...update));

        // Send over WebSocket to remote developers
        socketClient.emitYjsUpdate(this.options.fileId, base64);

        // Send over local BroadcastChannel
        this.channel.postMessage({
          type: 'yjs-update',
          roomId: this.options.roomId,
          fileId: this.options.fileId,
          update: base64,
          senderId: this.options.userId,
        });
      }
    });

    // 4. Hook up remote Socket.IO events
    this.setupSocketListeners();

    // 5. Request initial document sync from server
    this.requestInitialSync();
  }

  private async requestInitialSync() {
    try {
      const syncState = await socketClient.requestInitialDocSync(
        this.options.fileId,
        this.options.initialCode
      );
      if (syncState && !this.disposed) {
        const binary = Uint8Array.from(atob(syncState), (c) => c.charCodeAt(0));
        Y.applyUpdate(this.doc, binary, 'remote');
      }
    } catch (err) {
      console.warn('[CollabSession] Remote initial sync fallback to local:', err);
    }

    // Also trigger local sync request
    this.channel.postMessage({
      type: 'sync-request',
      roomId: this.options.roomId,
      fileId: this.options.fileId,
      senderId: this.options.userId,
    });
  }

  private setupSocketListeners() {
    // Remote Yjs update from server
    const unsubUpdate = socketClient.on('yjs-update', (data: any) => {
      if (this.disposed || !data || data.fileId !== this.options.fileId) return;
      if (data.senderId === this.options.userId) return;

      try {
        const binary = Uint8Array.from(atob(data.update), (c) => c.charCodeAt(0));
        Y.applyUpdate(this.doc, binary, 'remote');
      } catch (err) {
        console.warn('[CollabSession] Failed applying socket Yjs update:', err);
      }
    });

    // Remote cursor from server
    const unsubCursor = socketClient.on('cursor-update', (data: any) => {
      if (this.disposed || !data || data.fileId !== this.options.fileId) return;
      const cursor: RemoteCursor = data.cursor;
      if (cursor && cursor.userId !== this.options.userId) {
        this.remoteCursors.set(cursor.userId, cursor);
        this.renderRemoteCursors();
        this.options.onRemoteCursorChange?.(Array.from(this.remoteCursors.values()));

        // Follow mode check: if we are following this user, auto-scroll editor!
        if (this.options.followingUserId === cursor.userId && this.monacoEditor) {
          this.monacoEditor.revealLineInCenter(cursor.lineNumber);
        }
      }
    });

    // Ping line event
    const unsubPing = socketClient.on('line-pinged', (data: PingLineEvent) => {
      if (this.disposed || !data || data.fileId !== this.options.fileId) return;
      this.triggerPingLine(data.lineNumber, data.username, data.color);
    });

    // Member left event
    const unsubLeft = socketClient.on('member-left', (data: any) => {
      if (data?.userId) {
        this.remoteCursors.delete(data.userId);
        this.renderRemoteCursors();
        this.options.onRemoteCursorChange?.(Array.from(this.remoteCursors.values()));
      }
    });

    this.socketUnsubscribers.push(unsubUpdate, unsubCursor, unsubPing, unsubLeft);
  }

  public setFollowingUser(targetUserId: string | null) {
    this.options.followingUserId = targetUserId;
    if (targetUserId && this.remoteCursors.has(targetUserId) && this.monacoEditor) {
      const cursor = this.remoteCursors.get(targetUserId);
      if (cursor) {
        this.monacoEditor.revealLineInCenter(cursor.lineNumber);
      }
    }
  }

  public pingCurrentLine() {
    if (!this.monacoEditor) return;
    const pos = this.monacoEditor.getPosition();
    const line = pos ? pos.lineNumber : 1;
    socketClient.pingLine(this.options.fileId, line, this.options.color);
    this.triggerPingLine(line, this.options.username, this.options.color);
  }

  public bindEditor(editor: any) {
    this.monacoEditor = editor;
    this.monacoModel = editor.getModel();
    if (!this.monacoModel) return;

    // Sync initial Yjs content to Monaco model
    const currentYText = this.ytext.toString();
    if (currentYText && this.monacoModel.getValue() !== currentYText) {
      this.monacoModel.setValue(currentYText);
    }

    // 1. Monaco model changes -> Yjs
    this.monacoModel.onDidChangeContent((e: any) => {
      if (this.isApplyingRemote || this.disposed || this.options.readOnly) return;

      this.doc.transact(() => {
        const changes = [...e.changes].sort((a, b) => b.rangeOffset - a.rangeOffset);
        for (const change of changes) {
          if (change.rangeLength > 0) {
            this.ytext.delete(change.rangeOffset, change.rangeLength);
          }
          if (change.text.length > 0) {
            this.ytext.insert(change.rangeOffset, change.text);
          }
        }
      });
    });

    // 2. Yjs changes -> Monaco model
    const observer = (event: Y.YTextEvent) => {
      if (this.disposed || !this.monacoModel) return;
      if (event.transaction.origin !== 'remote') return;

      this.isApplyingRemote = true;
      try {
        let offset = 0;
        const edits: any[] = [];

        for (const delta of event.delta) {
          if (delta.retain !== undefined) {
            offset += delta.retain;
          }
          if (delta.delete !== undefined) {
            const startPos = this.monacoModel.getPositionAt(offset);
            const endPos = this.monacoModel.getPositionAt(offset + delta.delete);
            edits.push({
              range: {
                startLineNumber: startPos.lineNumber,
                startColumn: startPos.column,
                endLineNumber: endPos.lineNumber,
                endColumn: endPos.column,
              },
              text: '',
            });
          }
          if (delta.insert !== undefined) {
            const pos = this.monacoModel.getPositionAt(offset);
            const textToInsert = typeof delta.insert === 'string' ? delta.insert : '';
            edits.push({
              range: {
                startLineNumber: pos.lineNumber,
                startColumn: pos.column,
                endLineNumber: pos.lineNumber,
                endColumn: pos.column,
              },
              text: textToInsert,
            });
            offset += textToInsert.length;
          }
        }

        if (edits.length > 0) {
          this.monacoModel.pushEditOperations([], edits, () => null);
        }
      } catch (err) {
        console.warn('[CollabSession] Error applying delta, falling back to full text update:', err);
        const full = this.ytext.toString();
        if (this.monacoModel.getValue() !== full) {
          this.monacoModel.setValue(full);
        }
      } finally {
        this.isApplyingRemote = false;
      }
    };

    this.ytext.observe(observer);

    // 3. Track cursor and selection movements to broadcast to peers
    this.monacoEditor.onDidChangeCursorPosition((e: any) => {
      if (this.disposed || !e.position) return;
      this.broadcastCursor(e.position);
    });

    this.monacoEditor.onDidChangeCursorSelection((e: any) => {
      if (this.disposed || !e.selection) return;
      this.broadcastCursor(e.selection.getPosition(), e.selection);
    });

    // Re-render remote cursors on new editor binding
    this.renderRemoteCursors();
  }

  private broadcastCursor(position: any, selection?: any) {
    const cursor: RemoteCursor = {
      userId: this.options.userId,
      username: this.options.username,
      color: this.options.color,
      lineNumber: position.lineNumber,
      column: position.column,
      selection: selection
        ? {
            startLineNumber: selection.startLineNumber,
            startColumn: selection.startColumn,
            endLineNumber: selection.endLineNumber,
            endColumn: selection.endColumn,
          }
        : undefined,
    };

    // Broadcast over WebSocket
    socketClient.emitCursor(this.options.fileId, cursor);

    // Broadcast over BroadcastChannel
    this.channel.postMessage({
      type: 'cursor-update',
      roomId: this.options.roomId,
      fileId: this.options.fileId,
      cursor,
    });
  }

  private handleChannelMessage(e: MessageEvent) {
    if (this.disposed || !e.data) return;
    const data = e.data;

    if (data.roomId !== this.options.roomId || data.fileId !== this.options.fileId) return;
    if (data.senderId === this.options.userId) return;

    if (data.type === 'yjs-update' && data.update) {
      try {
        const binary = Uint8Array.from(atob(data.update), (c) => c.charCodeAt(0));
        Y.applyUpdate(this.doc, binary, 'remote');
      } catch (err) {
        console.warn('Failed applying broadcast Yjs update:', err);
      }
    } else if (data.type === 'sync-request') {
      const state = Y.encodeStateAsUpdate(this.doc);
      const base64 = btoa(String.fromCharCode(...state));
      this.channel.postMessage({
        type: 'yjs-update',
        roomId: this.options.roomId,
        fileId: this.options.fileId,
        update: base64,
        senderId: this.options.userId,
      });
    } else if (data.type === 'cursor-update' && data.cursor) {
      const cursor: RemoteCursor = data.cursor;
      if (cursor.userId !== this.options.userId) {
        this.remoteCursors.set(cursor.userId, cursor);
        this.renderRemoteCursors();
        this.options.onRemoteCursorChange?.(Array.from(this.remoteCursors.values()));
      }
    }
  }

  // ── Render Collaborator Cursors with Dynamic CSS ───────────────────────────
  private renderRemoteCursors() {
    if (!this.monacoEditor || this.disposed) return;

    const decorations: any[] = [];

    for (const cursor of this.remoteCursors.values()) {
      const safeId = cursor.userId.replace(/[^a-zA-Z0-9]/g, '');
      this.ensureCursorStyle(safeId, cursor.color, cursor.username);

      // Cursor caret & floating name label
      decorations.push({
        range: {
          startLineNumber: cursor.lineNumber,
          startColumn: cursor.column,
          endLineNumber: cursor.lineNumber,
          endColumn: cursor.column,
        },
        options: {
          className: `collab-caret-${safeId}`,
          hoverMessage: { value: `**@${cursor.username}** (Live Collaborator)` },
          before: {
            content: `\u2588`,
            inlineClassName: `collab-caret-block-${safeId}`,
          },
        },
      });

      // Selection range
      if (
        cursor.selection &&
        (cursor.selection.startLineNumber !== cursor.selection.endLineNumber ||
          cursor.selection.startColumn !== cursor.selection.endColumn)
      ) {
        decorations.push({
          range: {
            startLineNumber: cursor.selection.startLineNumber,
            startColumn: cursor.selection.startColumn,
            endLineNumber: cursor.selection.endLineNumber,
            endColumn: cursor.selection.endColumn,
          },
          options: {
            className: `collab-selection-${safeId}`,
            isWholeLine: false,
          },
        });
      }
    }

    this.cursorDecorationIds = this.monacoEditor.deltaDecorations(
      this.cursorDecorationIds,
      decorations
    );
  }

  private ensureCursorStyle(safeId: string, color: string, username: string) {
    if (this.injectedStyles.has(safeId)) return;
    this.injectedStyles.add(safeId);

    const styleEl = document.createElement('style');
    styleEl.innerHTML = `
      .collab-caret-block-${safeId} {
        color: ${color} !important;
        font-weight: bold;
        position: relative;
      }
      .collab-caret-block-${safeId}::after {
        content: '${username.replace(/'/g, "\\'")}';
        position: absolute;
        top: -18px;
        left: 0;
        background: ${color};
        color: #ffffff;
        font-size: 9px;
        font-weight: 700;
        padding: 1px 4px;
        border-radius: 3px;
        white-space: nowrap;
        pointer-events: none;
        z-index: 100;
        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
      }
      .collab-selection-${safeId} {
        background: ${color}33 !important;
        border-radius: 2px;
      }
    `;
    document.head.appendChild(styleEl);
  }

  // ── Ping Line Ripple Animation ─────────────────────────────────────────────
  public triggerPingLine(lineNumber: number, username: string, color = '#8b5cf6') {
    if (!this.monacoEditor || this.disposed) return;

    // Reveal and center line
    this.monacoEditor.revealLineInCenter(lineNumber);

    // Apply temporary pulsating line highlight
    const pingDec = [
      {
        range: {
          startLineNumber: lineNumber,
          startColumn: 1,
          endLineNumber: lineNumber,
          endColumn: 1,
        },
        options: {
          isWholeLine: true,
          className: 'collab-ping-line',
          hoverMessage: { value: `📍 **@${username}**: "Look here!"` },
        },
      },
    ];

    this.pingDecorationIds = this.monacoEditor.deltaDecorations(this.pingDecorationIds, pingDec);

    // Clear after 3.5 seconds
    setTimeout(() => {
      if (!this.disposed && this.monacoEditor) {
        this.pingDecorationIds = this.monacoEditor.deltaDecorations(this.pingDecorationIds, []);
      }
    }, 3500);
  }

  public dispose() {
    this.disposed = true;
    this.socketUnsubscribers.forEach((unsub) => unsub());
    this.channel.close();
    if (this.monacoEditor) {
      this.cursorDecorationIds = this.monacoEditor.deltaDecorations(this.cursorDecorationIds, []);
      this.pingDecorationIds = this.monacoEditor.deltaDecorations(this.pingDecorationIds, []);
    }
    this.doc.destroy();
  }
}

export default CollabMonacoSession;

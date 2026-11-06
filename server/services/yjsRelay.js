import * as Y from 'yjs';
import db from '../persistence/database.js';

export class YjsRelayService {
  constructor() {
    this.roomDocs = new Map(); // `${roomId}:${fileId}` -> Y.Doc
  }

  // ── Get or Initialize Server-side Y.Doc ─────────────────────────────────────
  async getOrCreateDoc(roomId, fileId, initialContent = '') {
    const key = `${roomId}:${fileId}`;
    if (this.roomDocs.has(key)) {
      return this.roomDocs.get(key);
    }

    const doc = new Y.Doc();
    const ytext = doc.getText('code');

    // Attempt to replay saved document updates from persistence
    const savedUpdates = await db.getDocUpdates(roomId, fileId);
    if (savedUpdates && savedUpdates.length > 0) {
      for (const updateBase64 of savedUpdates) {
        try {
          const binary = Buffer.from(updateBase64, 'base64');
          Y.applyUpdate(doc, new Uint8Array(binary));
        } catch (err) {
          console.warn(`[Yjs] Failed applying saved update for ${key}:`, err.message);
        }
      }
    } else if (initialContent && ytext.length === 0) {
      doc.transact(() => {
        ytext.insert(0, initialContent);
      });
    }

    this.roomDocs.set(key, doc);
    return doc;
  }

  // ── Apply and Relay Client Update ──────────────────────────────────────────
  async handleDocUpdate(roomId, fileId, updateBase64, senderId) {
    const key = `${roomId}:${fileId}`;
    let doc = this.roomDocs.get(key);
    if (!doc) {
      doc = await this.getOrCreateDoc(roomId, fileId);
    }

    try {
      const binary = Buffer.from(updateBase64, 'base64');
      Y.applyUpdate(doc, new Uint8Array(binary));
      // Persist update
      await db.saveDocUpdate(roomId, fileId, updateBase64);
    } catch (err) {
      console.error(`[Yjs] Error applying update to ${key}:`, err.message);
    }
  }

  // ── Generate Initial Sync State for New Client ─────────────────────────────
  async getDocSyncState(roomId, fileId, initialContent = '') {
    const doc = await this.getOrCreateDoc(roomId, fileId, initialContent);
    const state = Y.encodeStateAsUpdate(doc);
    return Buffer.from(state).toString('base64');
  }
}

export const yjsRelay = new YjsRelayService();
export default yjsRelay;


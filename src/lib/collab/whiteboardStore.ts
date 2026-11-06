import type { WhiteboardElement } from './types';
import socketClient from './socketClient';

class WhiteboardStore {
  private elements: WhiteboardElement[] = [];
  private listeners: Set<(elements: WhiteboardElement[]) => void> = new Set();

  constructor() {
    // Listen to remote whiteboard events from Socket
    socketClient.on('whiteboard-element', ({ element }: { element: WhiteboardElement }) => {
      this.elements.push(element);
      this.notify();
    });

    socketClient.on('whiteboard-cleared', () => {
      this.elements = [];
      this.notify();
    });
  }

  public getElements(): WhiteboardElement[] {
    return this.elements;
  }

  public addElement(element: WhiteboardElement) {
    this.elements.push(element);
    this.notify();
    // Broadcast to remote developers
    socketClient.emitWhiteboardDraw(element);
  }

  public clear() {
    this.elements = [];
    this.notify();
    socketClient.emitWhiteboardClear();
  }

  public subscribe(fn: (elements: WhiteboardElement[]) => void): () => void {
    this.listeners.add(fn);
    fn(this.elements);
    return () => this.listeners.delete(fn);
  }

  private notify() {
    this.listeners.forEach((fn) => {
      try {
        fn(this.elements);
      } catch (err) {
        console.error('[WhiteboardStore] Error in listener:', err);
      }
    });
  }
}

export const whiteboardStore = new WhiteboardStore();
export default whiteboardStore;


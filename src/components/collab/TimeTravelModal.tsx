import React, { useState, useEffect } from 'react';
import { History, Clock, FileCode, RotateCcw, X, Sparkles, Check, Download } from 'lucide-react';
import type { DocumentSnapshot, CollabRoom } from '../../lib/collab/types';

interface TimeTravelModalProps {
  isOpen: boolean;
  onClose: () => void;
  room: CollabRoom | null;
  onRestoreSnapshot?: (snapshot: DocumentSnapshot) => void;
  canRestore?: boolean;
}

export const TimeTravelModal: React.FC<TimeTravelModalProps> = ({
  isOpen,
  onClose,
  room,
  onRestoreSnapshot,
  canRestore = false,
}) => {
  const [snapshots, setSnapshots] = useState<DocumentSnapshot[]>([]);
  const [selectedSnapshot, setSelectedSnapshot] = useState<DocumentSnapshot | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [restoredMsg, setRestoredMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !room) return;
    setLoading(true);

    // Fetch snapshots from collaboration server
    const serverUrl =
      (import.meta as any).env?.VITE_COLLAB_SERVER_URL || 'http://localhost:4000';

    fetch(`${serverUrl}/api/rooms/${room.id}/snapshots`)
      .then((res) => res.json())
      .then((data) => {
        if (data.snapshots && data.snapshots.length > 0) {
          setSnapshots(data.snapshots);
          setSelectedSnapshot(data.snapshots[0]);
        } else {
          // Local room state as initial snapshot
          const initialSnap: DocumentSnapshot = {
            id: 'snap_init_' + room.createdAt,
            roomId: room.id,
            name: 'Room Inception State',
            createdAt: room.createdAt,
            createdBy: room.ownerUsername,
            fileCount: (room.files || []).length,
            files: (room.files || []).map((f) => ({
              name: f.name,
              lang: f.lang,
              code: f.code,
            })),
          };
          setSnapshots([initialSnap]);
          setSelectedSnapshot(initialSnap);
        }
      })
      .catch(() => {
        // Fallback to room's current state
        const fallbackSnap: DocumentSnapshot = {
          id: 'snap_now_' + Date.now(),
          roomId: room.id,
          name: 'Current Session Checkpoint',
          createdAt: Date.now(),
          createdBy: 'Auto-saved',
          fileCount: (room.files || []).length,
          files: (room.files || []).map((f) => ({
            name: f.name,
            lang: f.lang,
            code: f.code,
          })),
        };
        setSnapshots([fallbackSnap]);
        setSelectedSnapshot(fallbackSnap);
      })
      .finally(() => setLoading(false));
  }, [isOpen, room]);

  if (!isOpen || !room) return null;

  const handleRestore = () => {
    if (!selectedSnapshot) return;
    if (confirm(`Restore project to "${selectedSnapshot.name}"? This will update files for all collaborators.`)) {
      onRestoreSnapshot?.(selectedSnapshot);
      setRestoredMsg(`Successfully restored snapshot: ${selectedSnapshot.name}`);
      setTimeout(() => setRestoredMsg(null), 3000);
    }
  };

  return (
    <div className="fixed inset-0 z-[1100] flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-150">
      <div
        style={{
          background: 'var(--bg-card)',
          borderColor: 'var(--border)',
          color: 'var(--text-base)',
        }}
        className="collab-modal w-full max-w-3xl max-h-[85vh] border rounded-2xl shadow-2xl overflow-hidden flex flex-col select-none"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            background: 'var(--bg-header)',
            borderBottom: '1px solid var(--border)',
          }}
          className="px-5 py-4 flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-violet-500/15 border border-violet-500/30 flex items-center justify-center text-violet-400">
              <History className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold">Time-Travel History & Snapshots</h3>
                <span className="px-1.5 py-0.2 text-[9px] font-semibold bg-violet-500/10 text-violet-400 border border-violet-500/20 rounded">
                  CRDT Audit Trail
                </span>
              </div>
              <p style={{ color: 'var(--text-muted)' }} className="text-[11px]">
                Inspect past project checkpoints and restore state for <span className="font-semibold">{room.name}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ color: 'var(--text-muted)' }}
            className="p-1 rounded-md hover:bg-black/10 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {restoredMsg && (
          <div className="p-3 bg-emerald-500/15 border-b border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
            <Sparkles className="w-4 h-4 shrink-0" />
            <span>{restoredMsg}</span>
          </div>
        )}

        {/* Body (Timeline on left, preview on right) */}
        <div className="flex-1 overflow-hidden flex flex-col md:flex-row min-h-0">
          {/* Timeline List */}
          <div
            style={{
              borderColor: 'var(--border)',
              background: 'var(--bg-panel)',
            }}
            className="w-full md:w-64 border-r overflow-y-auto p-3 space-y-2 shrink-0"
          >
            <span style={{ color: 'var(--text-muted)' }} className="text-[10px] font-bold uppercase tracking-wider block px-1 mb-2">
              Checkpoints ({snapshots.length})
            </span>

            {snapshots.map((snap) => {
              const isSelected = selectedSnapshot?.id === snap.id;
              return (
                <button
                  key={snap.id}
                  onClick={() => setSelectedSnapshot(snap)}
                  style={{
                    background: isSelected ? 'var(--bg-hover)' : 'transparent',
                    borderColor: isSelected ? 'var(--accent)' : 'var(--border)',
                  }}
                  className="w-full p-2.5 rounded-xl border text-left transition-all"
                >
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="truncate">{snap.name}</span>
                    {isSelected && <Check className="w-3.5 h-3.5 text-violet-400 shrink-0" />}
                  </div>
                  <div style={{ color: 'var(--text-muted)' }} className="flex items-center gap-1.5 text-[10px] mt-1">
                    <Clock className="w-3 h-3" />
                    <span>{new Date(snap.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    <span>• by @{snap.createdBy}</span>
                  </div>
                  <div style={{ color: 'var(--text-dim)' }} className="text-[10px] mt-0.5">
                    {snap.fileCount} {snap.fileCount === 1 ? 'file' : 'files'} recorded
                  </div>
                </button>
              );
            })}
          </div>

          {/* Snapshot Content Preview */}
          <div className="flex-1 flex flex-col min-h-0 p-4 overflow-y-auto">
            {selectedSnapshot ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <h4 className="text-sm font-bold">{selectedSnapshot.name}</h4>
                    <p style={{ color: 'var(--text-muted)' }} className="text-xs">
                      Recorded on {new Date(selectedSnapshot.createdAt).toLocaleString()} by @{selectedSnapshot.createdBy}
                    </p>
                  </div>

                  {canRestore && (
                    <button
                      onClick={handleRestore}
                      className="px-3 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Restore This Snapshot</span>
                    </button>
                  )}
                </div>

                {/* Files in this snapshot */}
                <div className="space-y-2">
                  <span style={{ color: 'var(--text-muted)' }} className="text-xs font-semibold">Files in Checkpoint:</span>
                  <div className="space-y-2">
                    {selectedSnapshot.files.map((file, idx) => (
                      <div
                        key={idx}
                        style={{
                          background: 'var(--bg-input)',
                          borderColor: 'var(--border)',
                        }}
                        className="p-3 rounded-xl border text-xs"
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="font-mono font-bold flex items-center gap-1.5">
                            <FileCode className="w-3.5 h-3.5 text-violet-400" />
                            {file.name}
                          </span>
                          <span style={{ color: 'var(--text-muted)' }} className="text-[10px] uppercase font-semibold">
                            {file.lang}
                          </span>
                        </div>
                        <pre
                          style={{
                            background: 'var(--bg-panel)',
                            color: 'var(--text-base)',
                          }}
                          className="p-2.5 rounded-lg text-[11px] font-mono max-h-36 overflow-auto"
                        >
                          {file.code || '// Empty file'}
                        </pre>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ color: 'var(--text-muted)' }} className="h-full flex items-center justify-center text-xs">
                Select a checkpoint to inspect code states.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TimeTravelModal;


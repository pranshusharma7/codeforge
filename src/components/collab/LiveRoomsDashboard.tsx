import React, { useState } from 'react';
import {
  Users,
  Plus,
  KeyRound,
  Link2,
  Lock,
  Copy,
  Check,
  Trash2,
  LogOut,
  Clock,
  Sparkles,
  X,
  ExternalLink,
  Shield,
  ArrowRight,
  Code2,
} from 'lucide-react';
import {
  CollabRoom,
  DeveloperProfile,
} from '../../lib/collab/types';
import {
  createCollabRoom,
  joinCollabRoom,
  leaveCollabRoom,
  deleteCollabRoom,
  getCollabRooms,
  getRoomInviteUrl,
} from '../../lib/collab/collabStore';

interface LiveRoomsDashboardProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: DeveloperProfile;
  currentRoom: CollabRoom | null;
  onEnterRoom: (room: CollabRoom) => void;
}

export const LiveRoomsDashboard: React.FC<LiveRoomsDashboardProps> = ({
  isOpen,
  onClose,
  currentUser,
  currentRoom,
  onEnterRoom,
}) => {
  const [tab, setTab] = useState<'my-rooms' | 'create' | 'join-id' | 'join-link'>('my-rooms');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form states: Create Room
  const [roomName, setRoomName] = useState('');
  const [roomDesc, setRoomDesc] = useState('');
  const [roomLanguage, setRoomLanguage] = useState('csharp');

  // Form states: Join with ID
  const [joinRoomCode, setJoinRoomCode] = useState('');
  const [joinToken, setJoinToken] = useState('');

  // Form states: Join with Link
  const [inviteLinkInput, setInviteLinkInput] = useState('');

  if (!isOpen) return null;

  const rooms = getCollabRooms();

  const handleCopyLink = async (room: CollabRoom, e: React.MouseEvent) => {
    e.stopPropagation();
    const url = getRoomInviteUrl(room);
    try {
      await navigator.clipboard.writeText(url);
      setCopiedId(room.id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      // fallback
    }
  };

  const handleCopyCode = async (code: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(code);
      setCopiedId(code);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {}
  };

  const handleCreateRoom = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    if (!roomName.trim()) {
      setErrorMsg('Please enter a room name');
      return;
    }

    try {
      const newRoom = createCollabRoom({
        name: roomName.trim(),
        description: roomDesc.trim(),
        language: roomLanguage,
        owner: currentUser,
      });
      setRoomName('');
      setRoomDesc('');
      onEnterRoom(newRoom);
      onClose();
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to create room');
    }
  };

  const handleJoinById = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    if (!joinRoomCode.trim()) {
      setErrorMsg('Please enter a Room ID');
      return;
    }

    const res = joinCollabRoom(joinRoomCode.trim(), currentUser, joinToken.trim() || undefined);
    if (!res.success || !res.room) {
      setErrorMsg(res.error || 'Could not join room');
      return;
    }

    setJoinRoomCode('');
    setJoinToken('');
    onEnterRoom(res.room);
    onClose();
  };

  const handleJoinByLink = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    if (!inviteLinkInput.trim()) {
      setErrorMsg('Please paste an invitation link');
      return;
    }

    try {
      const url = new URL(inviteLinkInput.trim());
      const roomParam = url.searchParams.get('room') || url.searchParams.get('room_code');
      const tokenParam = url.searchParams.get('token');

      if (!roomParam) {
        setErrorMsg('Invalid invitation link: Room ID missing');
        return;
      }

      const res = joinCollabRoom(roomParam, currentUser, tokenParam || undefined);
      if (!res.success || !res.room) {
        setErrorMsg(res.error || 'Failed to join using invitation link');
        return;
      }

      setInviteLinkInput('');
      onEnterRoom(res.room);
      onClose();
    } catch {
      setErrorMsg('Invalid URL format. Please paste a full invitation link.');
    }
  };

  const handleDelete = (roomId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to end and delete this collaboration room?')) {
      deleteCollabRoom(roomId);
    }
  };

  const handleLeave = (roomId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    leaveCollabRoom(roomId, currentUser.id);
  };

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="collab-modal relative w-full max-w-4xl max-h-[90vh] bg-[#0d0f14] border border-[#222736] rounded-2xl shadow-2xl overflow-hidden flex flex-col text-slate-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#1c2230] flex items-center justify-between bg-[#11151f]/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-violet-500/15 border border-violet-500/30 flex items-center justify-center text-violet-400">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-100">CodeForge Live Rooms</h2>
                <span className="px-2 py-0.5 text-[11px] font-semibold bg-violet-500/10 text-violet-300 border border-violet-500/20 rounded-full flex items-center gap-1">
                  <Lock className="w-2.5 h-2.5" /> Private Only
                </span>
              </div>
              <p className="text-xs text-slate-400">
                End-to-end CRDT real-time collaborative coding rooms with WebRTC voice
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-[#1a2030] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="px-6 pt-3 border-b border-[#1c2230] flex items-center gap-2 bg-[#0d0f14]">
          <button
            onClick={() => { setTab('my-rooms'); setErrorMsg(null); }}
            className={`px-4 py-2 text-xs font-medium rounded-t-lg transition-colors border-b-2 flex items-center gap-2 ${
              tab === 'my-rooms'
                ? 'border-violet-500 text-violet-400 bg-[#141924]'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-[#121620]'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            Active & Recent Rooms ({rooms.length})
          </button>
          <button
            onClick={() => { setTab('create'); setErrorMsg(null); }}
            className={`px-4 py-2 text-xs font-medium rounded-t-lg transition-colors border-b-2 flex items-center gap-2 ${
              tab === 'create'
                ? 'border-violet-500 text-violet-400 bg-[#141924]'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-[#121620]'
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            Create New Room
          </button>
          <button
            onClick={() => { setTab('join-id'); setErrorMsg(null); }}
            className={`px-4 py-2 text-xs font-medium rounded-t-lg transition-colors border-b-2 flex items-center gap-2 ${
              tab === 'join-id'
                ? 'border-violet-500 text-violet-400 bg-[#141924]'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-[#121620]'
            }`}
          >
            <KeyRound className="w-3.5 h-3.5" />
            Join with Room ID
          </button>
          <button
            onClick={() => { setTab('join-link'); setErrorMsg(null); }}
            className={`px-4 py-2 text-xs font-medium rounded-t-lg transition-colors border-b-2 flex items-center gap-2 ${
              tab === 'join-link'
                ? 'border-violet-500 text-violet-400 bg-[#141924]'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-[#121620]'
            }`}
          >
            <Link2 className="w-3.5 h-3.5" />
            Enter Invitation Link
          </button>
        </div>

        {/* Error notification banner */}
        {errorMsg && (
          <div className="mx-6 mt-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
            <Shield className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
          {tab === 'my-rooms' && (
            <div>
              {rooms.length === 0 ? (
                <div className="py-14 text-center">
                  <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400">
                    <Users className="w-7 h-7" />
                  </div>
                  <h3 className="text-base font-semibold text-slate-200">No Active Rooms Found</h3>
                  <p className="text-xs text-slate-400 max-w-md mx-auto mt-1 mb-5">
                    Live rooms allow private real-time code collaboration with teammate cursors, voice chat, and synchronized Monaco editor state.
                  </p>
                  <div className="flex items-center justify-center gap-3">
                    <button
                      onClick={() => setTab('create')}
                      className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold flex items-center gap-2 shadow-lg shadow-violet-600/25 transition-all"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Create First Room
                    </button>
                    <button
                      onClick={() => setTab('join-id')}
                      className="px-4 py-2 rounded-xl bg-[#1c2230] hover:bg-[#252c3e] text-slate-200 text-xs font-medium border border-[#2b3347] flex items-center gap-2 transition-all"
                    >
                      <KeyRound className="w-3.5 h-3.5" />
                      Join with Code
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-slate-400">
                      Collaborative sessions you own or are a member of
                    </span>
                    <button
                      onClick={() => setTab('create')}
                      className="text-xs text-violet-400 hover:text-violet-300 flex items-center gap-1 font-medium"
                    >
                      <Plus className="w-3.5 h-3.5" /> New Room
                    </button>
                  </div>

                  {rooms.map((r: CollabRoom) => {
                    const isCurrent = currentRoom?.id === r.id;
                    const isOwner = r.ownerId === currentUser.id;
                    const memberCount = r.members.length;

                    return (
                      <div
                        key={r.id}
                        className={`p-4 rounded-xl border transition-all ${
                          isCurrent
                            ? 'bg-violet-950/20 border-violet-500/40 shadow-lg shadow-violet-900/10'
                            : 'bg-[#111520] border-[#1f2637] hover:border-[#2f3952]'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2.5 flex-wrap">
                              <h3 className="text-sm font-semibold text-slate-100 truncate">
                                {r.name}
                              </h3>
                              <span className="px-2 py-0.5 text-[10px] font-mono rounded bg-slate-800 text-slate-300 border border-slate-700/60 flex items-center gap-1">
                                {r.roomCode}
                                <button
                                  onClick={(e) => handleCopyCode(r.roomCode, e)}
                                  className="text-slate-400 hover:text-slate-100"
                                  title="Copy Room ID"
                                >
                                  {copiedId === r.roomCode ? (
                                    <Check className="w-3 h-3 text-emerald-400" />
                                  ) : (
                                    <Copy className="w-3 h-3" />
                                  )}
                                </button>
                              </span>
                              <span className="px-2 py-0.5 text-[10px] font-medium rounded-full bg-violet-500/10 text-violet-400 border border-violet-500/20 uppercase tracking-wide">
                                {r.language}
                              </span>
                              {isCurrent && (
                                <span className="px-2 py-0.5 text-[10px] font-medium rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                  Currently Open
                                </span>
                              )}
                              {isOwner && (
                                <span className="px-2 py-0.5 text-[10px] font-medium rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20">
                                  Owner
                                </span>
                              )}
                            </div>

                            {r.description && (
                              <p className="text-xs text-slate-400 mt-1 line-clamp-1">
                                {r.description}
                              </p>
                            )}

                            <div className="flex items-center gap-4 mt-3 text-[11px] text-slate-400 flex-wrap">
                              <span className="flex items-center gap-1.5">
                                <Users className="w-3.5 h-3.5 text-violet-400" />
                                {memberCount} {memberCount === 1 ? 'member' : 'members'}
                              </span>
                              <span className="flex items-center gap-1.5">
                                <Clock className="w-3.5 h-3.5 text-slate-500" />
                                Updated {new Date(r.updatedAt || r.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                              <span className="flex items-center gap-1.5">
                                <Code2 className="w-3.5 h-3.5 text-slate-500" />
                                {r.files?.length || 1} {r.files?.length === 1 ? 'file' : 'files'}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              onClick={(e) => handleCopyLink(r, e)}
                              className="px-3 py-1.5 rounded-lg bg-[#1a2030] hover:bg-[#232c42] text-slate-300 hover:text-slate-100 text-xs font-medium border border-[#2b3347] flex items-center gap-1.5 transition-colors"
                              title="Copy secure invitation link"
                            >
                              {copiedId === r.id ? (
                                <>
                                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                                  <span className="text-emerald-400">Copied</span>
                                </>
                              ) : (
                                <>
                                  <Link2 className="w-3.5 h-3.5" />
                                  <span>Invite Link</span>
                                </>
                              )}
                            </button>

                            <button
                              onClick={() => {
                                onEnterRoom(r);
                                onClose();
                              }}
                              className="px-3.5 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-violet-600/20 transition-all"
                            >
                              <span>Enter Room</span>
                              <ArrowRight className="w-3.5 h-3.5" />
                            </button>

                            {isOwner ? (
                              <button
                                onClick={(e) => handleDelete(r.id, e)}
                                className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                                title="Delete Room"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            ) : (
                              <button
                                onClick={(e) => handleLeave(r.id, e)}
                                className="p-1.5 rounded-lg text-slate-500 hover:text-amber-400 hover:bg-amber-500/10 transition-colors"
                                title="Leave Room"
                              >
                                <LogOut className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {tab === 'create' && (
            <form onSubmit={handleCreateRoom} className="max-w-xl mx-auto space-y-4 py-2">
              <div className="p-3.5 rounded-xl bg-violet-500/10 border border-violet-500/20 text-xs text-violet-300 flex items-center gap-3">
                <Sparkles className="w-4 h-4 text-violet-400 shrink-0" />
                <span>
                  Creating a private room generates an isolated CRDT session, unique Room ID, and 128-bit invitation token. Only invited users can enter.
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Room Name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={roomName}
                  onChange={(e) => setRoomName(e.target.value)}
                  placeholder="e.g. C# Algorithm Sprint, API Pair Programming"
                  required
                  className="w-full px-3.5 py-2.5 bg-[#141824] border border-[#232a3d] focus:border-violet-500 rounded-xl text-slate-100 text-xs outline-none transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Description <span className="text-slate-500 font-normal">(optional)</span>
                </label>
                <input
                  type="text"
                  value={roomDesc}
                  onChange={(e) => setRoomDesc(e.target.value)}
                  placeholder="Goals, agenda, or context for collaborators"
                  className="w-full px-3.5 py-2.5 bg-[#141824] border border-[#232a3d] focus:border-violet-500 rounded-xl text-slate-100 text-xs outline-none transition-colors"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Primary Language
                  </label>
                  <select
                    value={roomLanguage}
                    onChange={(e) => setRoomLanguage(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-[#141824] border border-[#232a3d] focus:border-violet-500 rounded-xl text-slate-100 text-xs outline-none transition-colors"
                  >
                    <option value="csharp">C# (.NET)</option>
                    <option value="python">Python 3</option>
                    <option value="javascript">JavaScript (Node.js)</option>
                    <option value="typescript">TypeScript</option>
                    <option value="cpp">C++ (GCC)</option>
                    <option value="java">Java (OpenJDK)</option>
                    <option value="go">Go</option>
                    <option value="rust">Rust</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Room Visibility
                  </label>
                  <div className="px-3.5 py-2.5 bg-[#141824] border border-[#232a3d] rounded-xl text-slate-300 text-xs flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <Lock className="w-3.5 h-3.5 text-violet-400" />
                      Private Only
                    </span>
                    <span className="text-[10px] text-slate-500 uppercase font-mono">ENFORCED</span>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-[#1c2230] flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setTab('my-rooms')}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-[#1a2030] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold shadow-lg shadow-violet-600/25 flex items-center gap-2 transition-all"
                >
                  <Plus className="w-4 h-4" />
                  Create Private Room
                </button>
              </div>
            </form>
          )}

          {tab === 'join-id' && (
            <form onSubmit={handleJoinById} className="max-w-xl mx-auto space-y-4 py-2">
              <div className="p-3.5 rounded-xl bg-[#141824] border border-[#232a3d] text-xs text-slate-300 flex items-center gap-3">
                <KeyRound className="w-4 h-4 text-violet-400 shrink-0" />
                <span>
                  Enter the 10-character Room ID provided by the host. If this room requires authorization, enter the invitation token.
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Room ID <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={joinRoomCode}
                  onChange={(e) => setJoinRoomCode(e.target.value.toUpperCase())}
                  placeholder="e.g. CF-4820-9182"
                  required
                  className="w-full px-3.5 py-2.5 bg-[#141824] border border-[#232a3d] focus:border-violet-500 rounded-xl text-slate-100 font-mono text-xs outline-none transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Invitation Token <span className="text-slate-500 font-normal">(if first time joining)</span>
                </label>
                <input
                  type="text"
                  value={joinToken}
                  onChange={(e) => setJoinToken(e.target.value)}
                  placeholder="Paste 128-bit hex token or leave empty if already accepted"
                  className="w-full px-3.5 py-2.5 bg-[#141824] border border-[#232a3d] focus:border-violet-500 rounded-xl text-slate-100 font-mono text-xs outline-none transition-colors"
                />
              </div>

              <div className="pt-4 border-t border-[#1c2230] flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setTab('my-rooms')}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-[#1a2030] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold shadow-lg shadow-violet-600/25 flex items-center gap-2 transition-all"
                >
                  <KeyRound className="w-4 h-4" />
                  Join Room
                </button>
              </div>
            </form>
          )}

          {tab === 'join-link' && (
            <form onSubmit={handleJoinByLink} className="max-w-xl mx-auto space-y-4 py-2">
              <div className="p-3.5 rounded-xl bg-[#141824] border border-[#232a3d] text-xs text-slate-300 flex items-center gap-3">
                <Link2 className="w-4 h-4 text-violet-400 shrink-0" />
                <span>
                  Paste the complete invitation URL received from the room owner (e.g. <code className="text-violet-300 font-mono">https://...?room=CF-xxxx&token=yyyy</code>).
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Invitation URL <span className="text-red-400">*</span>
                </label>
                <textarea
                  rows={3}
                  value={inviteLinkInput}
                  onChange={(e) => setInviteLinkInput(e.target.value)}
                  placeholder="https://.../?room=CF-1234-5678&token=..."
                  required
                  className="w-full px-3.5 py-2.5 bg-[#141824] border border-[#232a3d] focus:border-violet-500 rounded-xl text-slate-100 text-xs font-mono outline-none transition-colors resize-none"
                />
              </div>

              <div className="pt-4 border-t border-[#1c2230] flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setTab('my-rooms')}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-[#1a2030] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold shadow-lg shadow-violet-600/25 flex items-center gap-2 transition-all"
                >
                  <ExternalLink className="w-4 h-4" />
                  Validate & Join
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-[#1c2230] bg-[#0c0e14] flex items-center justify-between text-[11px] text-slate-400">
          <div className="flex items-center gap-2">
            <Shield className="w-3.5 h-3.5 text-violet-400" />
            <span>Role-based permissions (Owner / Editor / Viewer) enforced in realtime</span>
          </div>
          <div className="font-mono text-slate-500">CodeForge Live v2.5</div>
        </div>
      </div>
    </div>
  );
};

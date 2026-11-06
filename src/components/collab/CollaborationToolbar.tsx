import React, { useState, useEffect } from 'react';
import {
  Users,
  Copy,
  Check,
  Link2,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  LogOut,
  Radio,
  Lock,
  ChevronRight,
  Shield,
  MessageSquare,
} from 'lucide-react';
import { CollabRoom, DeveloperProfile, RoomRole } from '../../lib/collab/types';
import { getRoomInviteUrl, getMyRole } from '../../lib/collab/collabStore';
import { getVoiceManager, VoiceState } from '../../lib/collab/webrtcVoice';

interface CollaborationToolbarProps {
  room: CollabRoom;
  currentUser: DeveloperProfile;
  onLeaveRoom: () => void;
  onToggleSidebar: () => void;
  isSidebarOpen: boolean;
  unreadCount?: number;
}

export const CollaborationToolbar: React.FC<CollaborationToolbarProps> = ({
  room,
  currentUser,
  onLeaveRoom,
  onToggleSidebar,
  isSidebarOpen,
  unreadCount = 0,
}) => {
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const voiceManager = getVoiceManager(room.id, currentUser.id, currentUser.username);
  const [voiceState, setVoiceState] = useState<VoiceState>(voiceManager.getState());

  useEffect(() => {
    const unsub = voiceManager.subscribe(setVoiceState);
    return unsub;
  }, [room.id, currentUser.id]);

  const myRole: RoomRole = getMyRole(room, currentUser.id);

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(room.roomCode);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    } catch {}
  };

  const handleCopyInviteLink = async () => {
    try {
      const url = getRoomInviteUrl(room);
      await navigator.clipboard.writeText(url);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } catch {}
  };

  const handleVoiceToggle = async () => {
    if (voiceState.inVoice) {
      voiceManager.leaveVoice();
    } else {
      await voiceManager.joinVoice();
    }
  };

  return (
    <div className="h-11 px-3 bg-[#0c0e14] border-b border-[#1c2230] flex items-center justify-between text-xs text-slate-200 select-none z-30">
      {/* Left side: Live Room badge + Room Name + ID + Copy Link */}
      <div className="flex items-center gap-2.5 overflow-hidden">
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-violet-500/15 border border-violet-500/30 text-violet-300 font-semibold shrink-0">
          <span className="w-2 h-2 rounded-full bg-violet-400 animate-pulse" />
          <span className="tracking-wide text-[11px] uppercase">LIVE ROOM</span>
        </div>

        <div className="flex items-center gap-1.5 min-w-0">
          <span className="font-semibold text-slate-100 truncate max-w-[200px]" title={room.name}>
            {room.name}
          </span>
          <span className="text-slate-500">•</span>
          <button
            onClick={handleCopyCode}
            className="group px-2 py-0.5 rounded bg-[#151924] border border-[#232b3d] hover:border-violet-500/50 text-[11px] font-mono text-slate-300 flex items-center gap-1.5 transition-colors"
            title="Click to copy Room ID"
          >
            <span>{room.roomCode}</span>
            {copiedCode ? (
              <Check className="w-3 h-3 text-emerald-400" />
            ) : (
              <Copy className="w-3 h-3 text-slate-400 group-hover:text-slate-200" />
            )}
          </button>
        </div>

        <button
          onClick={handleCopyInviteLink}
          className="px-2.5 py-1 rounded-md bg-[#161a26] hover:bg-[#1e2436] text-slate-300 hover:text-white border border-[#242c3e] flex items-center gap-1.5 transition-colors text-[11px] font-medium shrink-0"
          title="Copy full invite link with security token"
        >
          {copiedLink ? (
            <>
              <Check className="w-3 h-3 text-emerald-400" />
              <span className="text-emerald-400 font-medium">Link Copied!</span>
            </>
          ) : (
            <>
              <Link2 className="w-3 h-3 text-violet-400" />
              <span>Copy Invite</span>
            </>
          )}
        </button>

        {/* Current user role badge */}
        <span
          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 shrink-0 ${
            myRole.toLowerCase() === 'owner'
              ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
              : myRole.toLowerCase() === 'editor'
              ? 'bg-blue-500/15 text-blue-300 border border-blue-500/30'
              : 'bg-slate-700/40 text-slate-400 border border-slate-600/40'
          }`}
        >
          <Shield className="w-2.5 h-2.5" />
          {myRole.toUpperCase()}
        </span>
      </div>

      {/* Right side: Voice controls + Members count + Chat toggle + Leave button */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Voice Chat Controls */}
        <div className="flex items-center bg-[#131722] border border-[#212838] rounded-lg p-0.5 gap-0.5">
          <button
            onClick={handleVoiceToggle}
            className={`px-2.5 py-1 rounded-md text-[11px] font-medium flex items-center gap-1.5 transition-all ${
              voiceState.inVoice
                ? voiceState.isSpeaking
                  ? 'bg-emerald-600 text-white shadow-sm ring-2 ring-emerald-400/50'
                  : 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/30'
                : 'hover:bg-[#1c2232] text-slate-300'
            }`}
            title={voiceState.inVoice ? 'Disconnect from voice room' : 'Join WebRTC Voice Chat'}
          >
            {voiceState.inVoice ? (
              <Radio className={`w-3.5 h-3.5 ${voiceState.isSpeaking ? 'animate-bounce' : ''}`} />
            ) : (
              <Mic className="w-3.5 h-3.5 text-slate-400" />
            )}
            <span>{voiceState.inVoice ? 'Voice Connected' : 'Join Voice'}</span>
          </button>

          {voiceState.inVoice && (
            <>
              <button
                onClick={() => voiceManager.toggleMute()}
                className={`p-1 rounded-md transition-colors ${
                  voiceState.isMuted
                    ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                    : 'text-slate-300 hover:bg-[#1d2334]'
                }`}
                title={voiceState.isMuted ? 'Unmute microphone' : 'Mute microphone'}
              >
                {voiceState.isMuted ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
              </button>

              <button
                onClick={() => voiceManager.toggleDeafen()}
                className={`p-1 rounded-md transition-colors ${
                  voiceState.isDeafened
                    ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                    : 'text-slate-300 hover:bg-[#1d2334]'
                }`}
                title={voiceState.isDeafened ? 'Undeafen' : 'Deafen'}
              >
                {voiceState.isDeafened ? (
                  <VolumeX className="w-3.5 h-3.5" />
                ) : (
                  <Volume2 className="w-3.5 h-3.5" />
                )}
              </button>
            </>
          )}
        </div>

        {/* Sidebar Toggle (Members & Chat) */}
        <button
          onClick={onToggleSidebar}
          className={`relative px-2.5 py-1 rounded-lg border text-xs font-medium flex items-center gap-1.5 transition-colors ${
            isSidebarOpen
              ? 'bg-violet-600/20 text-violet-300 border-violet-500/40'
              : 'bg-[#141824] hover:bg-[#1c2232] text-slate-300 border-[#22293b]'
          }`}
          title="Toggle Collaboration Panel (Members & Chat)"
        >
          <Users className="w-3.5 h-3.5 text-violet-400" />
          <span>{room.members.length}</span>
          <MessageSquare className="w-3.5 h-3.5 text-slate-400 ml-1" />
          {unreadCount > 0 && !isSidebarOpen && (
            <span className="w-2 h-2 rounded-full bg-violet-400 ring-2 ring-[#0c0e14] animate-pulse" />
          )}
        </button>

        {/* Leave Room Button */}
        <button
          onClick={onLeaveRoom}
          className="px-2.5 py-1 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 border border-red-500/30 text-xs font-medium flex items-center gap-1.5 transition-colors"
          title="Leave Live Room session"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Exit Room</span>
        </button>
      </div>
    </div>
  );
};

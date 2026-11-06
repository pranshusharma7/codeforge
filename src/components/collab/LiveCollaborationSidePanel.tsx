import React, { useState, useEffect, useRef } from 'react';
import {
  Users,
  MessageSquare,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Send,
  Shield,
  UserMinus,
  X,
  Radio,
  Lock,
  Copy,
  Check,
  UserPlus,
  MoreVertical,
  LogOut,
  Sparkles,
  ExternalLink,
  ChevronDown,
  Settings,
  Circle,
  Plus,
  KeyRound,
  ShieldCheck,
  Headphones,
  PhoneOff,
  Pin,
  History,
  Eye,
} from 'lucide-react';
import type {
  CollabRoom,
  DeveloperProfile,
  RoomMember,
  RoomMessage,
  RoomRole,
  DocumentSnapshot,
} from '../../lib/collab/types';
import {
  getRoomMessages,
  sendRoomMessage,
  updateMemberRole,
  removeMemberFromRoom,
  subscribeToRoomMessages,
  getMyRole,
} from '../../lib/collab/collabStore';
import { getVoiceManager, VoiceState } from '../../lib/collab/webrtcVoice';
import socketClient from '../../lib/collab/socketClient';
import { InviteDeveloperModal } from './InviteDeveloperModal';
import { TimeTravelModal } from './TimeTravelModal';

interface LiveCollaborationSidePanelProps {
  room: CollabRoom | null;
  currentUser: DeveloperProfile;
  isOpen: boolean;
  onClose: () => void;
  width: number;
  onRoomUpdated?: (updatedRoom: CollabRoom) => void;
  onOpenDashboard?: (tab?: 'my-rooms' | 'create' | 'join-id' | 'join-link') => void;
  onOpenProfileModal?: () => void;
  onLeaveRoom?: () => void;
  onPingLine?: () => void;
  followingUserId?: string | null;
  onToggleFollowUser?: (userId: string) => void;
  onRestoreSnapshot?: (snapshot: DocumentSnapshot) => void;
}

export const LiveCollaborationSidePanel: React.FC<LiveCollaborationSidePanelProps> = ({
  room,
  currentUser,
  isOpen,
  onClose,
  width,
  onRoomUpdated,
  onOpenDashboard,
  onOpenProfileModal,
  onLeaveRoom,
  onPingLine,
  followingUserId,
  onToggleFollowUser,
  onRestoreSnapshot,
}) => {
  const [activeTab, setActiveTab] = useState<'members' | 'chat'>('members');
  const [messages, setMessages] = useState<RoomMessage[]>(() =>
    room ? getRoomMessages(room.id) : []
  );
  const [inputText, setInputText] = useState('');
  const [copiedId, setCopiedId] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showTimeTravelModal, setShowTimeTravelModal] = useState(false);
  const [showHeaderMenu, setShowHeaderMenu] = useState(false);
  const [activeMemberMenuId, setActiveMemberMenuId] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'reconnecting' | 'disconnected'>('connected');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const headerMenuRef = useRef<HTMLDivElement>(null);
  const memberMenuRef = useRef<HTMLDivElement>(null);

  // WebRTC Voice
  const voiceManager = room
    ? getVoiceManager(room.id, currentUser.id, currentUser.username)
    : null;
  const [voiceState, setVoiceState] = useState<VoiceState>(
    voiceManager ? voiceManager.getState() : {
      isJoined: false,
      inVoice: false,
      isMuted: false,
      isDeafened: false,
      isSpeaking: false,
      hasPermission: false,
    }
  );

  const myRole: RoomRole = room ? getMyRole(room, currentUser.id) : 'editor';
  const isOwner = myRole.toLowerCase() === 'owner';
  const canManageRoom = isOwner;

  // Listen to socket status
  useEffect(() => {
    const unsub = socketClient.on('status-change', (status: any) => {
      setConnectionStatus(status === 'connected' ? 'connected' : 'reconnecting');
    });
    return unsub;
  }, []);

  // Subscribe to real-time chat messages
  useEffect(() => {
    if (!room) {
      setMessages([]);
      return;
    }
    setMessages(getRoomMessages(room.id));
    const unsub = subscribeToRoomMessages(room.id, (msgs: RoomMessage[]) => {
      setMessages(msgs);
      if (activeTab !== 'chat') {
        setUnreadCount((prev) => prev + 1);
      }
    });
    return unsub;
  }, [room?.id, activeTab]);

  // Subscribe to voice state
  useEffect(() => {
    if (!voiceManager) return;
    const unsub = voiceManager.subscribe(setVoiceState);
    return unsub;
  }, [voiceManager, room?.id, currentUser.id]);

  // Clear unread on chat tab switch
  useEffect(() => {
    if (activeTab === 'chat') {
      setUnreadCount(0);
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [activeTab, messages]);

  // Close menus on outside click
  useEffect(() => {
    const handleDocClick = (e: MouseEvent) => {
      if (headerMenuRef.current && !headerMenuRef.current.contains(e.target as Node)) {
        setShowHeaderMenu(false);
      }
      if (memberMenuRef.current && !memberMenuRef.current.contains(e.target as Node)) {
        setActiveMemberMenuId(null);
      }
    };
    document.addEventListener('mousedown', handleDocClick);
    return () => document.removeEventListener('mousedown', handleDocClick);
  }, []);

  if (!isOpen) return null;

  const handleCopyCode = async () => {
    if (!room) return;
    try {
      await navigator.clipboard.writeText(room.roomCode);
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2000);
    } catch {}
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !room) return;
    sendRoomMessage(room.id, currentUser, inputText.trim(), 'text');
    socketClient.sendMessage(inputText.trim());
    setInputText('');
  };

  const handleRoleChange = (targetUserId: string, newRole: RoomRole) => {
    if (!room) return;
    const updated = updateMemberRole(room.id, targetUserId, newRole.toLowerCase() as RoomRole);
    socketClient.changeMemberRole(targetUserId, newRole.toLowerCase());
    if (updated && onRoomUpdated) {
      onRoomUpdated(updated);
    }
    setActiveMemberMenuId(null);
  };

  const handleRemoveMember = (targetUserId: string) => {
    if (!room) return;
    if (confirm('Remove this member from the collaboration room?')) {
      const updated = removeMemberFromRoom(room.id, targetUserId);
      socketClient.kickMember(targetUserId);
      if (updated && onRoomUpdated) {
        onRoomUpdated(updated);
      }
    }
    setActiveMemberMenuId(null);
  };

  const handleVoiceToggle = async () => {
    if (!voiceManager) return;
    if (voiceState.inVoice) {
      voiceManager.leaveVoice();
    } else {
      await voiceManager.joinVoice();
    }
  };

  const onlineMembers = room ? room.members.filter((m) => m.isOnline) : [];

  return (
    <>
      <aside
        style={{
          width,
          background: 'var(--bg-panel)',
          borderLeft: '1px solid var(--border)',
          color: 'var(--text-base)',
        }}
        className="collab-side-panel h-full flex flex-col z-20 select-none animate-in slide-in-from-right-3 duration-150"
      >
        {/* ── 1. PANEL HEADER ────────────────────────────────────────────────── */}
        <div
          style={{
            background: 'var(--bg-header)',
            borderBottom: '1px solid var(--border)',
          }}
          className="h-11 px-3.5 flex items-center justify-between shrink-0"
        >
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-6 h-6 rounded-md bg-violet-600/20 border border-violet-500/30 flex items-center justify-center text-violet-400 shrink-0">
              <Users className="w-3.5 h-3.5" />
            </div>
            <div className="flex items-center gap-2 truncate">
              <span style={{ color: 'var(--text-base)' }} className="text-xs font-bold tracking-tight">
                Live Collaboration
              </span>
              <div
                style={{
                  background: 'var(--bg-card)',
                  borderColor: 'var(--border)',
                  color: 'var(--text-muted)',
                }}
                className="flex items-center gap-1.5 px-1.5 py-0.5 rounded-full border text-[10px]"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>{onlineMembers.length || (room ? 1 : 0)} Online</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            {/* Status indicator */}
            <span
              className={`text-[10px] px-1.5 py-0.5 rounded border hidden sm:inline-flex items-center gap-1 font-medium ${
                connectionStatus === 'connected'
                  ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
                  : 'text-amber-400 bg-amber-500/10 border-amber-500/20'
              }`}
              title={`Connection state: ${connectionStatus}`}
            >
              <Circle className={`w-1.5 h-1.5 ${connectionStatus === 'connected' ? 'fill-emerald-400' : 'fill-amber-400'}`} />
              {connectionStatus === 'connected' ? 'Connected' : 'Reconnecting'}
            </span>

            {/* Three-dot settings menu */}
            <div className="relative" ref={headerMenuRef}>
              <button
                onClick={() => setShowHeaderMenu((p) => !p)}
                style={{ color: 'var(--text-muted)' }}
                className="p-1 rounded hover:bg-black/10 transition-colors"
                title="Room Actions & Settings"
              >
                <MoreVertical className="w-4 h-4" />
              </button>

              {showHeaderMenu && (
                <div
                  style={{
                    background: 'var(--bg-card)',
                    borderColor: 'var(--border)',
                    color: 'var(--text-base)',
                  }}
                  className="absolute right-0 top-full mt-1 w-48 border rounded-xl shadow-2xl py-1.5 z-50 text-xs"
                >
                  {room ? (
                    <>
                      <button
                        onClick={() => {
                          handleCopyCode();
                          setShowHeaderMenu(false);
                        }}
                        className="w-full px-3 py-1.5 text-left hover:bg-black/10 flex items-center gap-2 transition-colors"
                      >
                        <Copy className="w-3.5 h-3.5 text-violet-400" />
                        <span>Copy Room ID</span>
                      </button>

                      <button
                        onClick={() => {
                          setShowInviteModal(true);
                          setShowHeaderMenu(false);
                        }}
                        className="w-full px-3 py-1.5 text-left hover:bg-black/10 flex items-center gap-2 transition-colors"
                      >
                        <UserPlus className="w-3.5 h-3.5 text-violet-400" />
                        <span>Invite Developer...</span>
                      </button>

                      <button
                        onClick={() => {
                          setShowTimeTravelModal(true);
                          setShowHeaderMenu(false);
                        }}
                        className="w-full px-3 py-1.5 text-left hover:bg-black/10 flex items-center gap-2 transition-colors"
                      >
                        <History className="w-3.5 h-3.5 text-violet-400" />
                        <span>Snapshots & History</span>
                      </button>

                      <div style={{ borderColor: 'var(--border)' }} className="my-1 border-t" />

                      <button
                        onClick={() => {
                          onOpenDashboard?.('my-rooms');
                          setShowHeaderMenu(false);
                        }}
                        className="w-full px-3 py-1.5 text-left hover:bg-black/10 flex items-center gap-2 transition-colors"
                      >
                        <Settings className="w-3.5 h-3.5 text-slate-400" />
                        <span>All Rooms Dashboard</span>
                      </button>

                      <button
                        onClick={() => {
                          setShowHeaderMenu(false);
                          if (confirm('Leave this collaboration room?')) {
                            onLeaveRoom?.();
                          }
                        }}
                        className="w-full px-3 py-1.5 text-left text-red-400 hover:text-red-300 hover:bg-red-500/10 flex items-center gap-2 transition-colors"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Leave Room</span>
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => {
                          onOpenDashboard?.('create');
                          setShowHeaderMenu(false);
                        }}
                        className="w-full px-3 py-1.5 text-left hover:bg-black/10 flex items-center gap-2 transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5 text-violet-400" />
                        <span>Create New Room</span>
                      </button>
                      <button
                        onClick={() => {
                          onOpenDashboard?.('join-id');
                          setShowHeaderMenu(false);
                        }}
                        className="w-full px-3 py-1.5 text-left hover:bg-black/10 flex items-center gap-2 transition-colors"
                      >
                        <KeyRound className="w-3.5 h-3.5 text-violet-400" />
                        <span>Join with Room ID</span>
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Close side panel button */}
            <button
              onClick={onClose}
              style={{ color: 'var(--text-muted)' }}
              className="p-1 rounded hover:bg-black/10 transition-colors"
              title="Close Live Collaboration Panel"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ── 2. ROOM INFORMATION CARD ────────────────────────────────────────── */}
        <div
          style={{
            background: 'var(--bg-card)',
            borderBottom: '1px solid var(--border)',
          }}
          className="p-3"
        >
          {room ? (
            <div className="space-y-2.5">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span style={{ color: 'var(--text-base)' }} className="font-semibold text-xs truncate" title={room.name}>
                      {room.name}
                    </span>
                    <span className="px-1.5 py-0.2 rounded text-[9px] font-bold tracking-wide uppercase bg-violet-500/15 text-violet-400 border border-violet-500/30 flex items-center gap-1 shrink-0">
                      <Lock className="w-2.5 h-2.5" /> Private
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span style={{ color: 'var(--text-muted)' }} className="text-[11px] font-mono">
                      Room: <span style={{ color: 'var(--text-base)' }} className="font-semibold">{room.roomCode}</span>
                    </span>
                    <button
                      onClick={handleCopyCode}
                      style={{
                        background: 'var(--bg-hover)',
                        borderColor: 'var(--border)',
                        color: 'var(--text-base)',
                      }}
                      className="px-1.5 py-0.5 rounded border text-[10px] flex items-center gap-1 transition-colors"
                      title="Copy Room ID to clipboard"
                    >
                      {copiedId ? (
                        <>
                          <Check className="w-2.5 h-2.5 text-emerald-400" />
                          <span className="text-emerald-400">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-2.5 h-2.5" />
                          <span>Copy ID</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* My Role pill */}
                <span
                  className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider shrink-0 flex items-center gap-1 ${
                    myRole.toLowerCase() === 'owner'
                      ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                      : myRole.toLowerCase() === 'editor'
                      ? 'bg-blue-500/15 text-blue-400 border border-blue-500/30'
                      : 'bg-slate-500/20 text-slate-400 border border-slate-500/30'
                  }`}
                >
                  <ShieldCheck className="w-2.5 h-2.5" />
                  {myRole.toUpperCase()}
                </span>
              </div>

              {/* Action buttons row */}
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setShowInviteModal(true)}
                  className="flex-1 py-1.5 px-2 rounded-lg bg-violet-600/20 hover:bg-violet-600/30 border border-violet-500/40 hover:border-violet-500/60 text-violet-400 hover:text-violet-300 text-xs font-semibold flex items-center justify-center gap-1 transition-all shadow-sm"
                >
                  <UserPlus className="w-3.5 h-3.5 text-violet-400" />
                  <span>Invite</span>
                </button>
                <button
                  onClick={onPingLine}
                  style={{ background: 'var(--bg-hover)', borderColor: 'var(--border)', color: 'var(--text-base)' }}
                  className="py-1.5 px-2 rounded-lg border text-xs font-semibold flex items-center justify-center gap-1 transition-all"
                  title="Ping Active Line to all collaborators (Look Here)"
                >
                  <Pin className="w-3.5 h-3.5 text-violet-400" />
                  <span>Ping</span>
                </button>
                <button
                  onClick={() => setShowTimeTravelModal(true)}
                  style={{ background: 'var(--bg-hover)', borderColor: 'var(--border)', color: 'var(--text-base)' }}
                  className="py-1.5 px-2 rounded-lg border text-xs font-semibold flex items-center justify-center gap-1 transition-all"
                  title="Time-Travel Snapshots & Checkpoint History"
                >
                  <History className="w-3.5 h-3.5 text-violet-400" />
                  <span>Snapshots</span>
                </button>
              </div>
            </div>
          ) : (
            <div
              style={{
                background: 'var(--bg-hover)',
                borderColor: 'var(--border)',
              }}
              className="py-2.5 px-3 rounded-xl border text-center"
            >
              <div className="w-8 h-8 rounded-lg bg-violet-500/10 border border-violet-500/20 flex items-center justify-center mx-auto text-violet-400 mb-1.5">
                <Users className="w-4 h-4" />
              </div>
              <p style={{ color: 'var(--text-base)' }} className="text-xs font-semibold">No Active Room</p>
              <p style={{ color: 'var(--text-muted)' }} className="text-[10px] mt-0.5 max-w-[240px] mx-auto">
                Create a private room or enter an ID to collaborate with live cursors and voice.
              </p>
              <div className="flex items-center justify-center gap-2 mt-2.5">
                <button
                  onClick={() => onOpenDashboard?.('create')}
                  className="px-2.5 py-1 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-[11px] font-semibold flex items-center gap-1 transition-all"
                >
                  <Plus className="w-3 h-3" />
                  Create Room
                </button>
                <button
                  onClick={() => onOpenDashboard?.('join-id')}
                  style={{
                    background: 'var(--bg-card)',
                    borderColor: 'var(--border)',
                    color: 'var(--text-base)',
                  }}
                  className="px-2.5 py-1 rounded-lg border text-[11px] font-medium flex items-center gap-1 transition-colors"
                >
                  <KeyRound className="w-3 h-3" />
                  Join with ID
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ── 3. TABS BAR ──────────────────────────────────────────────────────── */}
        <div
          style={{
            background: 'var(--bg-header)',
            borderBottom: '1px solid var(--border)',
          }}
          className="flex px-2 pt-1 shrink-0 overflow-x-auto gap-1"
        >
          <button
            onClick={() => setActiveTab('members')}
            style={{
              borderBottomColor: activeTab === 'members' ? 'var(--accent)' : 'transparent',
              color: activeTab === 'members' ? 'var(--accent)' : 'var(--text-muted)',
              background: activeTab === 'members' ? 'var(--bg-hover)' : 'transparent',
            }}
            className="flex-1 py-1.5 text-xs font-semibold border-b-2 flex items-center justify-center gap-1 transition-colors rounded-t-md min-w-[65px]"
          >
            <Users className="w-3.5 h-3.5" />
            <span>Members</span>
            {room && (
              <span
                style={{
                  background: 'var(--bg-card)',
                  color: 'var(--text-muted)',
                  borderColor: 'var(--border)',
                }}
                className="px-1 py-0.2 rounded-full border text-[9px] font-mono"
              >
                {room.members.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('chat')}
            style={{
              borderBottomColor: activeTab === 'chat' ? 'var(--accent)' : 'transparent',
              color: activeTab === 'chat' ? 'var(--accent)' : 'var(--text-muted)',
              background: activeTab === 'chat' ? 'var(--bg-hover)' : 'transparent',
            }}
            className="flex-1 py-1.5 text-xs font-semibold border-b-2 flex items-center justify-center gap-1 transition-colors relative rounded-t-md min-w-[55px]"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Chat</span>
            {unreadCount > 0 && activeTab !== 'chat' && (
              <span className="px-1.5 py-0.2 rounded-full bg-violet-600 text-[9px] font-bold text-white animate-pulse">
                {unreadCount}
              </span>
            )}
          </button>
        </div>

        {/* ── 4. TAB CONTENT ─────────────────────────────────────────────────── */}
        <div
          style={{
            background: 'var(--bg-panel)',
            color: 'var(--text-base)',
          }}
          className="flex-1 overflow-y-auto custom-scrollbar flex flex-col min-h-0"
        >
          {/* MEMBERS TAB */}
          {activeTab === 'members' && (
            <div className="p-3 space-y-2 flex-1">
              {!room ? (
                <div
                  style={{ color: 'var(--text-muted)' }}
                  className="h-full flex flex-col items-center justify-center text-center p-6"
                >
                  <Users className="w-8 h-8 mb-2 opacity-50" />
                  <p style={{ color: 'var(--text-base)' }} className="text-xs font-medium">Collaborators</p>
                  <p style={{ color: 'var(--text-muted)' }} className="text-[11px] mt-1">
                    Connect to a room to view participants, assign roles, and live edit together.
                  </p>
                </div>
              ) : (
                room.members.map((member: RoomMember) => {
                  const isMe = member.userId === currentUser.id;
                  const isMemberOwner = member.role.toLowerCase() === 'owner';
                  const isMenuOpen = activeMemberMenuId === member.userId;
                  const isFollowed = followingUserId === member.userId;

                  return (
                    <div
                      key={member.id}
                      style={{
                        background: 'var(--bg-card)',
                        borderColor: isFollowed ? 'var(--accent)' : 'var(--border)',
                      }}
                      className="p-2.5 rounded-xl border flex items-center justify-between gap-2 transition-all relative group"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        {/* Avatar with color ring & online indicator */}
                        <div className="relative shrink-0">
                          <img
                            src={member.avatarUrl || 'https://github.com/ghost.png'}
                            alt={member.githubUsername}
                            className="w-8 h-8 rounded-full object-cover border"
                            style={{ borderColor: member.color || '#8b5cf6' }}
                          />
                          <span
                            className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-transparent ${
                              member.isOnline ? 'bg-emerald-400' : 'bg-slate-500'
                            }`}
                            title={member.isOnline ? 'Online' : 'Offline'}
                          />
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span style={{ color: 'var(--text-base)' }} className="text-xs font-semibold truncate">
                              @{member.githubUsername}
                            </span>
                            {isMe && (
                              <span className="text-[9px] text-violet-400 font-semibold">(You)</span>
                            )}
                          </div>

                          <div className="flex items-center gap-1.5 mt-0.5">
                            {/* Role badge */}
                            <span
                              className={`px-1.5 py-0.2 rounded text-[9px] font-bold uppercase tracking-wider ${
                                member.role.toLowerCase() === 'owner'
                                  ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                                  : member.role.toLowerCase() === 'editor'
                                  ? 'bg-blue-500/15 text-blue-400 border border-blue-500/30'
                                  : 'bg-slate-500/20 text-slate-400 border border-slate-500/30'
                              }`}
                            >
                              {member.role}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Right controls: Follow button & Member menu */}
                      <div className="flex items-center gap-1.5">
                        {!isMe && onToggleFollowUser && (
                          <button
                            onClick={() => onToggleFollowUser(member.userId)}
                            style={{
                              background: isFollowed ? 'var(--accent)' : 'var(--bg-hover)',
                              color: isFollowed ? '#ffffff' : 'var(--text-muted)',
                              borderColor: isFollowed ? 'var(--accent)' : 'var(--border)',
                            }}
                            className="px-2 py-0.5 rounded text-[10px] font-semibold border flex items-center gap-1 transition-all"
                            title={isFollowed ? 'Following viewport (Click to stop)' : 'Follow this developer in editor'}
                          >
                            <Eye className="w-3 h-3" />
                            <span>{isFollowed ? 'Following' : 'Follow'}</span>
                          </button>
                        )}

                        <div className="relative">
                          <button
                            onClick={() => setActiveMemberMenuId(isMenuOpen ? null : member.userId)}
                            style={{ color: 'var(--text-muted)' }}
                            className="p-1 rounded hover:bg-black/10 transition-colors"
                            title="Member Actions"
                          >
                            <MoreVertical className="w-3.5 h-3.5" />
                          </button>

                          {isMenuOpen && (
                            <div
                              style={{
                                background: 'var(--bg-card)',
                                borderColor: 'var(--border)',
                                color: 'var(--text-base)',
                              }}
                              className="absolute right-0 top-full mt-1 w-44 border rounded-xl shadow-2xl py-1 z-50 text-[11px]"
                            >
                              {canManageRoom && !isMemberOwner ? (
                                <>
                                  <div style={{ color: 'var(--text-muted)', borderColor: 'var(--border)' }} className="px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider border-b">
                                    Change Role
                                  </div>
                                  <button
                                    onClick={() => handleRoleChange(member.userId, 'editor')}
                                    style={{ color: 'var(--text-base)' }}
                                    className="w-full px-2.5 py-1 text-left hover:bg-black/10 flex items-center justify-between"
                                  >
                                    <span>Editor (Can code & run)</span>
                                    {member.role.toLowerCase() === 'editor' && <Check className="w-3 h-3 text-violet-400" />}
                                  </button>
                                  <button
                                    onClick={() => handleRoleChange(member.userId, 'viewer')}
                                    style={{ color: 'var(--text-base)' }}
                                    className="w-full px-2.5 py-1 text-left hover:bg-black/10 flex items-center justify-between"
                                  >
                                    <span>Viewer (Read-only)</span>
                                    {member.role.toLowerCase() === 'viewer' && <Check className="w-3 h-3 text-violet-400" />}
                                  </button>

                                  <div style={{ borderColor: 'var(--border)' }} className="my-1 border-t" />

                                  <button
                                    onClick={() => handleRemoveMember(member.userId)}
                                    className="w-full px-3 py-1.5 text-left text-red-400 hover:text-red-300 hover:bg-red-500/10 flex items-center gap-1.5"
                                  >
                                    <UserMinus className="w-3 h-3" />
                                    <span>Remove Participant</span>
                                  </button>
                                </>
                              ) : null}

                              <a
                                href={`https://github.com/${member.githubUsername}`}
                                target="_blank"
                                rel="noreferrer"
                                style={{ color: 'var(--text-base)' }}
                                className="w-full px-3 py-1.5 text-left hover:bg-black/10 flex items-center gap-1.5 transition-colors"
                                onClick={() => setActiveMemberMenuId(null)}
                              >
                                <ExternalLink className="w-3 h-3 text-slate-400" />
                                <span>View GitHub Profile</span>
                              </a>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* CHAT TAB */}
          {activeTab === 'chat' && (
            <div
              style={{
                background: 'var(--bg-panel)',
              }}
              className="flex-1 flex flex-col min-h-0"
            >
              {!room ? (
                <div
                  style={{ color: 'var(--text-muted)' }}
                  className="h-full flex flex-col items-center justify-center text-center p-6"
                >
                  <div className="w-12 h-12 rounded-2xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400 mb-3 shadow-inner">
                    <MessageSquare className="w-6 h-6" />
                  </div>
                  <p style={{ color: 'var(--text-base)' }} className="text-sm font-semibold">Live Room Chat</p>
                  <p style={{ color: 'var(--text-muted)' }} className="text-xs mt-1 max-w-[220px]">
                    Join or create a collaboration room to exchange real-time messages with your team.
                  </p>
                </div>
              ) : (
                <>
                  <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar">
                    {messages.length === 0 ? (
                      <div className="py-12 text-center text-xs">
                        <div className="w-12 h-12 rounded-2xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center mx-auto text-violet-400 mb-3">
                          <MessageSquare className="w-6 h-6" />
                        </div>
                        <p style={{ color: 'var(--text-base)' }} className="font-semibold text-sm">No messages yet</p>
                        <p style={{ color: 'var(--text-muted)' }} className="text-xs mt-1">
                          Say hi to developers in <span className="font-semibold text-violet-400">#{room.name.toLowerCase().replace(/\s+/g, '-')}</span>!
                        </p>
                      </div>
                    ) : (
                      messages.map((m) => {
                        const isSystem = m.isSystem;
                        const isMe = m.userId === currentUser.id;

                        if (isSystem) {
                          return (
                            <div
                              key={m.id}
                              style={{
                                background: 'var(--bg-card)',
                                borderColor: 'var(--border)',
                                color: 'var(--text-base)',
                              }}
                              className="collab-chat-system text-center my-2 text-[10.5px] font-medium py-1 px-3 rounded-full border mx-auto max-w-[90%] shadow-xs flex items-center justify-center gap-1.5 opacity-90"
                            >
                              <span className="w-1.5 h-1.5 rounded-full bg-violet-500 shrink-0" />
                              <span>{m.text}</span>
                            </div>
                          );
                        }

                        return (
                          <div
                            key={m.id}
                            className={`flex items-end gap-2 text-xs ${isMe ? 'flex-row-reverse' : ''}`}
                          >
                            <img
                              src={m.avatarUrl || 'https://github.com/ghost.png'}
                              alt={m.username}
                              className="w-7 h-7 rounded-full border object-cover shrink-0 mb-0.5 shadow-sm"
                              style={{ borderColor: 'var(--border)' }}
                            />
                            <div
                              className={`max-w-[82%] rounded-2xl px-3 py-2 shadow-sm ${
                                isMe
                                  ? 'collab-chat-msg-me rounded-br-xs'
                                  : 'collab-chat-msg-peer rounded-bl-xs'
                              }`}
                            >
                              <div className="flex items-center gap-2 mb-1">
                                <span
                                  className={`text-[10px] font-bold truncate ${
                                    isMe ? 'text-white' : 'collab-chat-peer-username'
                                  }`}
                                >
                                  {isMe ? 'You' : `@${m.username}`}
                                </span>
                                <span
                                  className={`text-[9px] ${
                                    isMe ? 'collab-chat-time text-white/75' : 'text-slate-400'
                                  }`}
                                  style={{ color: isMe ? undefined : 'var(--text-muted)' }}
                                >
                                  {new Date(m.timestamp).toLocaleTimeString([], {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })}
                                </span>
                              </div>
                              <p className="break-words leading-relaxed text-[12px] whitespace-pre-wrap font-normal">
                                {m.text}
                              </p>
                            </div>
                          </div>
                        );
                      })
                    )}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Message Input Box */}
                  <form
                    onSubmit={handleSendMessage}
                    style={{
                      background: 'var(--bg-card)',
                      borderTop: '1px solid var(--border)',
                    }}
                    className="p-2.5 flex items-center gap-2 shrink-0"
                  >
                    <input
                      type="text"
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                      placeholder={`Message #${room.name.toLowerCase().replace(/\s+/g, '-')}...`}
                      style={{
                        background: 'var(--bg-input)',
                        borderColor: 'var(--border)',
                        color: 'var(--text-base)',
                      }}
                      className="flex-1 px-3 py-2 border focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 rounded-xl text-xs outline-none transition-all"
                    />
                    <button
                      type="submit"
                      disabled={!inputText.trim()}
                      style={{
                        background: 'linear-gradient(135deg, #7c3aed 0%, #6366f1 100%)',
                      }}
                      className="p-2.5 rounded-xl text-white disabled:opacity-35 disabled:hover:scale-100 hover:scale-105 active:scale-95 transition-all shadow-md shadow-violet-600/25 shrink-0"
                      title="Send message (Enter)"
                    >
                      <Send className="w-3.5 h-3.5" />
                    </button>
                  </form>
                </>
              )}
            </div>
          )}
        </div>

        {/* ── 5. VOICE CHAT SECTION (HIGH-END HUDDLE / AUDIO ROOM) ───────────── */}
        {room && (
          <div
            style={{
              background: 'var(--bg-card)',
              borderTop: '1px solid var(--border)',
            }}
            className="p-3 shrink-0"
          >
            <div
              style={{
                background: 'var(--bg-hover)',
                borderColor: 'var(--border)',
              }}
              className="p-3 rounded-2xl border shadow-sm transition-all"
            >
              {/* Header Status Row */}
              <div className="flex items-center justify-between mb-2.5">
                <div className="flex items-center gap-2.5">
                  <div
                    className={`w-7 h-7 rounded-xl flex items-center justify-center transition-all shadow-sm ${
                      voiceState.inVoice
                        ? 'bg-emerald-500 text-white shadow-emerald-500/30'
                        : 'bg-violet-500/15 text-violet-400 border border-violet-500/25'
                    }`}
                  >
                    <Headphones className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span style={{ color: 'var(--text-base)' }} className="text-xs font-bold tracking-tight">Voice Channel</span>
                      {voiceState.inVoice && (
                        <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-[9px] font-bold text-emerald-400">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                          LIVE
                        </span>
                      )}
                    </div>
                    <div style={{ color: 'var(--text-muted)' }} className="text-[10px]">
                      {voiceState.inVoice ? 'Mesh Audio • HD 48kHz' : 'Talk with room members'}
                    </div>
                  </div>
                </div>

                {/* Animated speaking audio waveform indicator */}
                {voiceState.inVoice && voiceState.isSpeaking && (
                  <div
                    className="flex items-center gap-0.5 h-4 px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[10px] font-semibold"
                    title="Microphone active & speaking"
                  >
                    <span className="inline-block w-0.5 h-2.5 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="inline-block w-0.5 h-3.5 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="inline-block w-0.5 h-2 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    <span className="inline-block w-0.5 h-3 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '450ms' }} />
                    <span className="ml-1 text-[9px] font-bold uppercase tracking-wider">Speaking</span>
                  </div>
                )}
              </div>

              {/* Voice controls */}
              <div className="flex items-center gap-2">
                {voiceState.inVoice ? (
                  <>
                    <button
                      onClick={() => voiceManager?.toggleMute()}
                      style={{
                        background: voiceState.isMuted ? 'rgba(239, 68, 68, 0.15)' : 'var(--bg-card)',
                        borderColor: voiceState.isMuted ? 'rgba(239, 68, 68, 0.35)' : 'var(--border)',
                        color: voiceState.isMuted ? '#ef4444' : 'var(--text-base)',
                      }}
                      className="flex-1 py-1.5 px-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all border shadow-xs hover:opacity-90 active:scale-98"
                      title={voiceState.isMuted ? 'Unmute Microphone' : 'Mute Microphone'}
                    >
                      {voiceState.isMuted ? <MicOff className="w-3.5 h-3.5 text-rose-500" /> : <Mic className="w-3.5 h-3.5 text-emerald-500" />}
                      <span>{voiceState.isMuted ? 'Muted' : 'Mute'}</span>
                    </button>

                    <button
                      onClick={() => voiceManager?.toggleDeafen()}
                      style={{
                        background: voiceState.isDeafened ? 'rgba(245, 158, 11, 0.15)' : 'var(--bg-card)',
                        borderColor: voiceState.isDeafened ? 'rgba(245, 158, 11, 0.35)' : 'var(--border)',
                        color: voiceState.isDeafened ? '#f59e0b' : 'var(--text-base)',
                      }}
                      className="flex-1 py-1.5 px-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all border shadow-xs hover:opacity-90 active:scale-98"
                      title={voiceState.isDeafened ? 'Undeafen Audio' : 'Deafen Audio'}
                    >
                      {voiceState.isDeafened ? <VolumeX className="w-3.5 h-3.5 text-amber-500" /> : <Volume2 className="w-3.5 h-3.5 text-violet-400" />}
                      <span>{voiceState.isDeafened ? 'Deafened' : 'Deafen'}</span>
                    </button>

                    <button
                      onClick={handleVoiceToggle}
                      className="py-1.5 px-3 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-500 font-semibold text-xs flex items-center gap-1 transition-all active:scale-95"
                      title="Disconnect from Voice"
                    >
                      <PhoneOff className="w-3.5 h-3.5" />
                      <span>Leave</span>
                    </button>
                  </>
                ) : (
                  <button
                    onClick={handleVoiceToggle}
                    style={{
                      background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    }}
                    className="w-full py-2 px-3 rounded-xl text-white text-xs font-bold flex items-center justify-center gap-2 shadow-md shadow-emerald-600/25 hover:brightness-105 active:scale-98 transition-all"
                  >
                    <Headphones className="w-4 h-4" />
                    <span>Connect to Voice Room</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </aside>

      {/* Invite Developer Modal */}
      {showInviteModal && room && (
        <InviteDeveloperModal
          isOpen={showInviteModal}
          onClose={() => setShowInviteModal(false)}
          room={room}
          currentUserId={currentUser.id}
          onRoomUpdated={onRoomUpdated}
        />
      )}

      {/* Time-Travel History Modal */}
      {showTimeTravelModal && room && (
        <TimeTravelModal
          isOpen={showTimeTravelModal}
          onClose={() => setShowTimeTravelModal(false)}
          room={room}
          canRestore={canManageRoom || myRole.toLowerCase() === 'editor'}
          onRestoreSnapshot={onRestoreSnapshot}
        />
      )}
    </>
  );
};

export default LiveCollaborationSidePanel;

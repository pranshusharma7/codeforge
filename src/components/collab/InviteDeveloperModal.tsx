import React, { useState } from 'react';
import {
  Link2,
  Copy,
  Check,
  Clock,
  Shield,
  RotateCcw,
  X,
  Lock,
  Sparkles,
} from 'lucide-react';
import type { CollabRoom } from '../../lib/collab/types';
import {
  getRoomInviteUrl,
  generateSecureToken,
  updateRoomInStorage,
  getMyRole,
} from '../../lib/collab/collabStore';

interface InviteDeveloperModalProps {
  isOpen: boolean;
  onClose: () => void;
  room: CollabRoom | null;
  currentUserId: string;
  onRoomUpdated?: (updatedRoom: CollabRoom) => void;
}

export const InviteDeveloperModal: React.FC<InviteDeveloperModalProps> = ({
  isOpen,
  onClose,
  room,
  currentUserId,
  onRoomUpdated,
}) => {
  const [copied, setCopied] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [expiryHours, setExpiryHours] = useState('24');
  const [revokedMessage, setRevokedMessage] = useState<string | null>(null);

  if (!isOpen || !room) return null;

  const myRole = getMyRole(room, currentUserId);
  const canInvite = myRole.toLowerCase() === 'owner' || myRole.toLowerCase() === 'editor';
  const inviteUrl = getRoomInviteUrl(room);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(room.roomCode);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    } catch {}
  };

  const handleRevokeToken = () => {
    if (!canInvite) return;
    if (confirm('Revoking this token will invalidate all previously shared invite links. Generate new token?')) {
      const newToken = generateSecureToken();
      const updatedRoom: CollabRoom = {
        ...room,
        inviteToken: newToken,
        updatedAt: Date.now(),
      };
      updateRoomInStorage(updatedRoom);
      onRoomUpdated?.(updatedRoom);
      setRevokedMessage('Previous invite link revoked! Generated new secure token.');
      setTimeout(() => setRevokedMessage(null), 3500);
    }
  };

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        className="collab-modal w-full max-w-md bg-[#0e111a] border border-[#22293b] rounded-2xl shadow-2xl overflow-hidden flex flex-col text-slate-200 select-none"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-[#1c2230] flex items-center justify-between bg-[#111522]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-violet-500/15 border border-violet-500/30 flex items-center justify-center text-violet-400">
              <Link2 className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-100">Invite Developer</h3>
                <span className="px-1.5 py-0.5 text-[9px] font-semibold bg-violet-500/10 text-violet-300 border border-violet-500/20 rounded">
                  Private Room
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Share access to <span className="text-slate-200 font-medium">{room.name}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-slate-100 hover:bg-[#1a2030] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 text-xs">
          {revokedMessage && (
            <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
              <Sparkles className="w-4 h-4 shrink-0" />
              <span>{revokedMessage}</span>
            </div>
          )}

          {!canInvite ? (
            <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/25 text-amber-300 text-xs flex items-center gap-2">
              <Shield className="w-4 h-4 shrink-0" />
              <span>Only room Owners and Editors can generate invitation tokens.</span>
            </div>
          ) : (
            <>
              {/* Room Code Quick Box */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                  Unique Room ID
                </label>
                <div className="flex items-center gap-2">
                  <div className="flex-1 px-3 py-2 rounded-xl bg-[#141824] border border-[#232b3d] font-mono text-slate-200 text-xs flex items-center justify-between">
                    <span>{room.roomCode}</span>
                    <span className="text-[10px] text-slate-500 font-sans">CODEFORGE P2P</span>
                  </div>
                  <button
                    onClick={handleCopyCode}
                    className="px-3 py-2 rounded-xl bg-[#1a2032] hover:bg-[#232c44] border border-[#2b354d] text-slate-200 text-xs font-medium flex items-center gap-1.5 transition-colors shrink-0"
                    title="Copy Room ID"
                  >
                    {copiedCode ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy ID</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Secure Invitation Link */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                  Secure Invitation Link
                </label>
                <div className="relative">
                  <textarea
                    readOnly
                    rows={2}
                    value={inviteUrl}
                    className="w-full px-3 py-2 rounded-xl bg-[#141824] border border-[#232b3d] font-mono text-[11px] text-slate-300 resize-none outline-none focus:border-violet-500 select-all"
                  />
                </div>
                <div className="flex items-center justify-between mt-2">
                  <button
                    onClick={handleCopyLink}
                    className="w-full py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-lg shadow-violet-600/25 transition-all"
                  >
                    {copied ? (
                      <>
                        <Check className="w-4 h-4 text-white" />
                        <span>Invitation Link Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        <span>Copy Invitation Link</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Expiry and Revoke */}
              <div className="pt-3 border-t border-[#1c2230] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-slate-400 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-violet-400" />
                    Link Expiration
                  </span>
                  <select
                    value={expiryHours}
                    onChange={(e) => setExpiryHours(e.target.value)}
                    className="bg-[#141824] border border-[#232b3d] rounded-lg px-2.5 py-1 text-slate-300 text-xs outline-none cursor-pointer hover:border-violet-500/50"
                  >
                    <option value="1">1 Hour</option>
                    <option value="24">24 Hours (Default)</option>
                    <option value="168">7 Days</option>
                    <option value="never">Never (Until Revoked)</option>
                  </select>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <div>
                    <p className="text-xs font-semibold text-slate-300">Security & Token Revocation</p>
                    <p className="text-[10px] text-slate-500">Regenerate 128-bit key if leaked</p>
                  </div>
                  <button
                    onClick={handleRevokeToken}
                    className="px-2.5 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 border border-red-500/25 text-red-400 text-[11px] font-medium flex items-center gap-1.5 transition-colors"
                    title="Invalidate previous invite links"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Revoke Link</span>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-[#1c2230] bg-[#0c0e14] flex items-center justify-between text-[11px] text-slate-500">
          <span className="flex items-center gap-1.5">
            <Lock className="w-3 h-3 text-slate-400" />
            End-to-end CRDT protected
          </span>
          <button
            onClick={onClose}
            className="text-xs text-slate-400 hover:text-slate-200 transition-colors font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default InviteDeveloperModal;

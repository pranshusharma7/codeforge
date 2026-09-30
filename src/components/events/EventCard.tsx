import React from 'react';
import { CodeForgeEvent } from '../../lib/eventTypes';
import {
  TrophyIcon,
  ShieldIcon,
  ClockIcon,
  CameraIcon,
  ScreenIcon,
  LockIcon,
  CheckIcon,
  UserCheckIcon,
} from '../icons';

interface EventCardProps {
  event: CodeForgeEvent;
  onViewDetails: (event: CodeForgeEvent) => void;
  onRegister: (event: CodeForgeEvent) => void;
  onEnterArena?: (event: CodeForgeEvent) => void;
  isRegistered?: boolean;
}

export const EventCard: React.FC<EventCardProps> = ({
  event,
  onViewDetails,
  onRegister,
  onEnterArena,
  isRegistered,
}) => {
  const isLive = event.status === 'LIVE';
  const isUpcoming = event.status === 'UPCOMING' || event.status === 'REGISTRATION_OPEN';
  const isCompleted = event.status === 'COMPLETED';

  // Format date & time
  const formatDateTime = (dateStr: string, timeStr: string) => {
    try {
      const d = new Date(`${dateStr}T${timeStr}:00`);
      return d.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return `${dateStr} · ${timeStr}`;
    }
  };

  const getVerificationBadge = () => {
    switch (event.organizer.verification) {
      case 'verified_company':
        return (
          <span className="text-[10px] font-semibold text-sky-400 bg-sky-950/60 border border-sky-800/60 px-1.5 py-0.5 rounded flex items-center gap-1" title="Verified Company Host">
            <span>🏢</span> Verified Company
          </span>
        );
      case 'verified_college':
        return (
          <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 px-1.5 py-0.5 rounded flex items-center gap-1" title="Verified University/College Host">
            <span>🎓</span> Verified College
          </span>
        );
      case 'verified_organization':
        return (
          <span className="text-[10px] font-semibold text-cyan-400 bg-cyan-950/60 border border-cyan-800/60 px-1.5 py-0.5 rounded flex items-center gap-1" title="Verified CodeForge Organization">
            <span>✓</span> Official Partner
          </span>
        );
      case 'verified_organizer':
        return (
          <span className="text-[10px] font-semibold text-amber-400 bg-amber-950/60 border border-amber-800/60 px-1.5 py-0.5 rounded flex items-center gap-1" title="Verified Individual Organizer">
            <span>⭐</span> Verified Host
          </span>
        );
      default:
        return (
          <span className="text-[10px] text-slate-400 bg-slate-800/60 px-1.5 py-0.5 rounded">
            {event.organizer.type}
          </span>
        );
    }
  };

  return (
    <div
      onClick={() => onViewDetails(event)}
      className="bg-[var(--bg-card)] border border-[var(--border)] hover:border-[var(--accent-border)] rounded-xl p-5 flex flex-col justify-between space-y-4 transition-all duration-150 cursor-pointer group shadow-sm hover:shadow-md"
    >
      <div>
        {/* Top Header: Logo, Organizer, Status */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-3">
            <img
              src={event.logo}
              alt={event.title}
              className="w-11 h-11 rounded-lg object-cover border border-[var(--border)] shrink-0"
              onError={(e) => {
                // Fallback icon placeholder if image fails to load
                (e.currentTarget as any).src =
                  'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100&h=100&fit=crop';
              }}
            />
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-semibold text-[var(--text-muted)] truncate">
                  {event.organizer.name}
                </span>
                {getVerificationBadge()}
              </div>
              <h3 className="text-sm font-bold text-[var(--text-base)] group-hover:text-[var(--accent)] transition truncate">
                {event.title}
              </h3>
            </div>
          </div>

          {/* Status Badge */}
          <span
            className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full shrink-0 flex items-center gap-1 ${
              isLive
                ? 'bg-rose-950/80 text-rose-400 border border-rose-800'
                : isUpcoming
                ? 'bg-sky-950/80 text-sky-400 border border-sky-800'
                : 'bg-slate-800 text-slate-400 border border-slate-700'
            }`}
          >
            {isLive && <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse" />}
            {isLive ? 'LIVE' : isUpcoming ? 'UPCOMING' : 'COMPLETED'}
          </span>
        </div>

        {/* Short Description */}
        <p className="text-xs text-[var(--text-muted)] line-clamp-2 leading-relaxed">
          {event.description}
        </p>
      </div>

      {/* Meta Specs Grid */}
      <div className="space-y-3 pt-1 border-t border-[var(--border-subtle)]">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
          <div className="bg-[var(--bg-app)] p-2 rounded-lg border border-[var(--border)]">
            <span className="text-[10px] text-[var(--text-dim)] block uppercase font-mono">Date</span>
            <span className="font-semibold text-[var(--text-base)]">
              {formatDateTime(event.startDate, event.startTime)}
            </span>
          </div>
          <div className="bg-[var(--bg-app)] p-2 rounded-lg border border-[var(--border)]">
            <span className="text-[10px] text-[var(--text-dim)] block uppercase font-mono">Duration</span>
            <span className="font-semibold text-[var(--text-base)]">{event.durationMinutes} mins</span>
          </div>
          <div className="bg-[var(--bg-app)] p-2 rounded-lg border border-[var(--border)]">
            <span className="text-[10px] text-[var(--text-dim)] block uppercase font-mono">Rounds</span>
            <span className="font-semibold text-[var(--accent)]">{event.rounds.length} Round{event.rounds.length > 1 ? 's' : ''}</span>
          </div>
          <div className="bg-[var(--bg-app)] p-2 rounded-lg border border-[var(--border)]">
            <span className="text-[10px] text-[var(--text-dim)] block uppercase font-mono">Enrolled</span>
            <span className="font-semibold text-[var(--text-base)]">{event.currentParticipantsCount}</span>
          </div>
        </div>

        {/* Tags & Prize teaser */}
        <div className="flex items-center justify-between text-xs gap-2 pt-1 flex-wrap">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded bg-[var(--bg-hover)] text-[var(--text-muted)] border border-[var(--border)]">
              {event.eventType}
            </span>
            {event.proctoring.requireCamera && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--bg-hover)] text-[var(--text-muted)] flex items-center gap-1 border border-[var(--border)]" title="Webcam Proctoring Required">
                <CameraIcon className="w-3 h-3 text-cyan-400" /> Cam
              </span>
            )}
            {event.proctoring.requireScreenShare && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--bg-hover)] text-[var(--text-muted)] flex items-center gap-1 border border-[var(--border)]" title="Screen Capture Proctored">
                <ScreenIcon className="w-3 h-3 text-indigo-400" /> Screen
              </span>
            )}
          </div>

          {event.prizes && event.prizes.length > 0 && (
            <span className="text-[11px] font-semibold text-amber-400 flex items-center gap-1">
              <span>🏆</span> {event.prizes[0].reward}
            </span>
          )}
        </div>

        {/* Action Buttons */}
        <div className="pt-2 flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => onViewDetails(event)}
            className="flex-1 py-1.5 px-3 rounded-lg bg-[var(--bg-app)] hover:bg-[var(--bg-hover)] text-[var(--text-base)] border border-[var(--border)] text-xs font-semibold transition text-center"
          >
            View Details
          </button>

          {isLive && (isRegistered || event.isRegistered) ? (
            <button
              onClick={() => onEnterArena && onEnterArena(event)}
              className="flex-1 py-1.5 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-sm shadow-emerald-600/30"
            >
              <span>Enter Arena</span>
              <span>→</span>
            </button>
          ) : (isRegistered || event.isRegistered) ? (
            <span className="flex-1 py-1.5 px-3 rounded-lg bg-emerald-950/40 text-emerald-400 border border-emerald-800/60 text-xs font-semibold text-center flex items-center justify-center gap-1">
              <CheckIcon className="w-3.5 h-3.5" /> Registered
            </span>
          ) : (
            <button
              onClick={() => onRegister(event)}
              className="flex-1 py-1.5 px-3 rounded-lg bg-[var(--accent)] hover:bg-[var(--accent-2)] text-white text-xs font-semibold transition text-center"
            >
              Register
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

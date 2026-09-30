import React, { useState, useEffect } from 'react';
import { CodeForgeEvent } from '../../lib/eventTypes';
import {
  TrophyIcon,
  ShieldIcon,
  ClockIcon,
  CameraIcon,
  ScreenIcon,
  LockIcon,
  CheckIcon,
  AlertTriangleIcon,
  PlayIcon,
  UserCheckIcon,
} from '../icons';

interface EventDetailsViewProps {
  event: CodeForgeEvent;
  onBack: () => void;
  onRegister: (event: CodeForgeEvent) => void;
  onEnterArena: (event: CodeForgeEvent) => void;
  isRegistered?: boolean;
}

export const EventDetailsView: React.FC<EventDetailsViewProps> = ({
  event,
  onBack,
  onRegister,
  onEnterArena,
  isRegistered,
}) => {
  const [activeTab, setActiveTab] = useState<
    'overview' | 'rounds' | 'rules' | 'schedule' | 'prizes' | 'eligibility' | 'faqs'
  >('overview');

  // Countdown timer calculation
  const [countdown, setCountdown] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    isStarted: false,
    isEnded: false,
  });

  useEffect(() => {
    const updateCountdown = () => {
      const eventStart = new Date(`${event.startDate}T${event.startTime}:00`).getTime();
      const eventEnd = new Date(`${event.endDate}T${event.endTime}:00`).getTime();
      const now = Date.now();

      if (now >= eventEnd) {
        setCountdown({ days: 0, hours: 0, minutes: 0, seconds: 0, isStarted: true, isEnded: true });
        return;
      }

      if (now >= eventStart) {
        // Event is currently running
        const diff = Math.max(0, eventEnd - now);
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
        const minutes = Math.floor((diff / 1000 / 60) % 60);
        const seconds = Math.floor((diff / 1000) % 60);
        setCountdown({ days, hours, minutes, seconds, isStarted: true, isEnded: false });
        return;
      }

      // Event has not started yet
      const diff = Math.max(0, eventStart - now);
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((diff / 1000 / 60) % 60);
      const seconds = Math.floor((diff / 1000) % 60);
      setCountdown({ days, hours, minutes, seconds, isStarted: false, isEnded: false });
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [event.startDate, event.startTime, event.endDate, event.endTime]);

  const isLive = event.status === 'LIVE' || (countdown.isStarted && !countdown.isEnded);

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-16 animate-in fade-in duration-150">
      {/* Back button */}
      <button
        onClick={onBack}
        className="inline-flex items-center gap-2 text-xs font-semibold text-[var(--text-muted)] hover:text-[var(--text-base)] transition cursor-pointer"
      >
        <span>←</span>
        <span>Back to Events Discovery</span>
      </button>

      {/* Main Header Banner */}
      <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-6 sm:p-8 space-y-6">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
          <div className="flex items-start gap-4">
            <img
              src={event.logo}
              alt={event.title}
              className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl object-cover border border-[var(--border)] shrink-0"
              onError={(e) => {
                (e.currentTarget as any).src =
                  'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100&h=100&fit=crop';
              }}
            />
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-semibold text-[var(--text-muted)]">
                  Hosted by {event.organizer.name}
                </span>
                <span className="text-[10px] font-semibold text-cyan-400 bg-cyan-950/60 border border-cyan-800/60 px-2 py-0.5 rounded">
                  ✓ {event.organizer.type}
                </span>
                <span
                  className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                    isLive
                      ? 'bg-rose-950/80 text-rose-400 border border-rose-800 animate-pulse'
                      : 'bg-sky-950/80 text-sky-400 border border-sky-800'
                  }`}
                >
                  {isLive ? '● Live Now' : event.status}
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-extrabold text-[var(--text-base)] tracking-tight">
                {event.title}
              </h1>

              <p className="text-xs text-[var(--text-muted)] max-w-2xl leading-relaxed">
                {event.description}
              </p>
            </div>
          </div>

          {/* Primary Action & Countdown Card */}
          <div className="bg-[var(--bg-app)] border border-[var(--border)] p-4 rounded-xl flex flex-col items-center justify-center min-w-[240px] text-center space-y-3 shrink-0">
            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-dim)] block">
                {isLive ? 'Contest Closes In' : 'Starts In'}
              </span>
              <div className="flex items-center justify-center gap-1.5 font-mono text-lg font-bold text-[var(--accent)] mt-0.5">
                <span className="bg-[var(--bg-card)] px-2 py-1 rounded border border-[var(--border)]">
                  {String(countdown.days).padStart(2, '0')}d
                </span>
                <span>:</span>
                <span className="bg-[var(--bg-card)] px-2 py-1 rounded border border-[var(--border)]">
                  {String(countdown.hours).padStart(2, '0')}h
                </span>
                <span>:</span>
                <span className="bg-[var(--bg-card)] px-2 py-1 rounded border border-[var(--border)]">
                  {String(countdown.minutes).padStart(2, '0')}m
                </span>
                <span>:</span>
                <span className="bg-[var(--bg-card)] px-2 py-1 rounded border border-[var(--border)] text-white">
                  {String(countdown.seconds).padStart(2, '0')}s
                </span>
              </div>
            </div>

            {isLive && (isRegistered || event.isRegistered) ? (
              <button
                onClick={() => onEnterArena(event)}
                className="w-full py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-wider shadow-md shadow-emerald-600/30 transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Enter Contest Arena</span>
                <span>→</span>
              </button>
            ) : (isRegistered || event.isRegistered) ? (
              <div className="w-full py-2 rounded-lg bg-emerald-950/40 text-emerald-400 border border-emerald-800/60 text-xs font-semibold flex items-center justify-center gap-1.5">
                <CheckIcon className="w-4 h-4" /> Registered ✓
              </div>
            ) : (
              <button
                onClick={() => onRegister(event)}
                className="w-full py-2.5 rounded-lg bg-[var(--accent)] hover:bg-[var(--accent-2)] text-white font-bold text-xs uppercase tracking-wider shadow-md shadow-blue-500/20 transition cursor-pointer"
              >
                Register Now
              </button>
            )}
          </div>
        </div>

        {/* 6 Key Quick Specs */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 pt-3 border-t border-[var(--border-subtle)] text-xs">
          <div className="bg-[var(--bg-app)] p-3 rounded-xl border border-[var(--border)]">
            <span className="text-[10px] text-[var(--text-dim)] uppercase block font-mono">Total Rounds</span>
            <span className="text-sm font-bold text-[var(--text-base)]">{event.rounds.length}</span>
          </div>
          <div className="bg-[var(--bg-app)] p-3 rounded-xl border border-[var(--border)]">
            <span className="text-[10px] text-[var(--text-dim)] uppercase block font-mono">Duration</span>
            <span className="text-sm font-bold text-[var(--text-base)]">{event.durationMinutes} mins</span>
          </div>
          <div className="bg-[var(--bg-app)] p-3 rounded-xl border border-[var(--border)]">
            <span className="text-[10px] text-[var(--text-dim)] uppercase block font-mono">Participants</span>
            <span className="text-sm font-bold text-[var(--accent)]">
              {event.currentParticipantsCount} {event.maxParticipants ? `/ ${event.maxParticipants}` : ''}
            </span>
          </div>
          <div className="bg-[var(--bg-app)] p-3 rounded-xl border border-[var(--border)]">
            <span className="text-[10px] text-[var(--text-dim)] uppercase block font-mono">Languages</span>
            <span className="text-sm font-bold text-[var(--text-base)]">Python · C++ · JS</span>
          </div>
          <div className="bg-[var(--bg-app)] p-3 rounded-xl border border-[var(--border)]">
            <span className="text-[10px] text-[var(--text-dim)] uppercase block font-mono">Certificates</span>
            <span className="text-sm font-bold text-amber-400">
              {event.certificateConfig?.enabled ? 'Verified Available' : 'Not Applicable'}
            </span>
          </div>
          <div className="bg-[var(--bg-app)] p-3 rounded-xl border border-[var(--border)]">
            <span className="text-[10px] text-[var(--text-dim)] uppercase block font-mono">Proctoring</span>
            <span className="text-sm font-bold text-purple-400">
              {event.proctoring.requireCamera || event.proctoring.requireScreenShare ? 'AI Proctored' : 'Standard'}
            </span>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-1 border-b border-[var(--border)] overflow-x-auto pb-1 text-xs">
        {(
          [
            { id: 'overview', label: 'Overview & About' },
            { id: 'rounds', label: `Rounds (${event.rounds.length})` },
            { id: 'rules', label: 'Rules & Format' },
            { id: 'schedule', label: 'Schedule' },
            { id: 'prizes', label: 'Prizes & Rewards' },
            { id: 'eligibility', label: 'Eligibility' },
            { id: 'faqs', label: 'FAQs' },
          ] as const
        ).map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`px-4 py-2 font-semibold transition rounded-t-lg border-b-2 -mb-px shrink-0 ${
              activeTab === t.id
                ? 'border-[var(--accent)] text-[var(--text-base)] bg-[var(--bg-card)]'
                : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-base)]'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab Contents */}
      <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-6 sm:p-8 text-xs leading-relaxed text-[var(--text-base)] space-y-6">
        {activeTab === 'overview' && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-[var(--text-base)] uppercase tracking-wider">About This Event</h3>
            <div className="prose prose-invert max-w-none text-slate-300 text-xs leading-relaxed whitespace-pre-wrap">
              {event.aboutMarkdown}
            </div>

            {/* Tags */}
            <div className="pt-4 border-t border-[var(--border-subtle)]">
              <span className="text-[10px] text-[var(--text-dim)] uppercase font-mono block mb-2">Topics & Tags:</span>
              <div className="flex items-center gap-1.5 flex-wrap">
                {event.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-2.5 py-1 rounded-md bg-[var(--bg-app)] border border-[var(--border)] text-[var(--text-muted)] text-[11px]"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'rounds' && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-[var(--text-base)] uppercase tracking-wider">Event Rounds Breakdown</h3>
            <div className="space-y-4">
              {event.rounds.map((round, idx) => (
                <div
                  key={round.id}
                  className="p-4 rounded-xl bg-[var(--bg-app)] border border-[var(--border)] space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-[var(--accent)] text-white font-bold flex items-center justify-center text-xs">
                        {idx + 1}
                      </span>
                      <h4 className="font-bold text-sm text-[var(--text-base)]">{round.name}</h4>
                    </div>

                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold uppercase bg-[var(--bg-hover)] text-[var(--text-muted)] border border-[var(--border)]">
                      {round.type} round
                    </span>
                  </div>

                  <p className="text-xs text-[var(--text-muted)]">{round.description}</p>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] pt-1 font-mono">
                    <div>
                      <span className="text-[var(--text-dim)] block text-[10px]">Duration</span>
                      <span className="text-[var(--text-base)] font-semibold">{round.durationMinutes} mins</span>
                    </div>
                    <div>
                      <span className="text-[var(--text-dim)] block text-[10px]">Max Score</span>
                      <span className="text-cyan-400 font-semibold">{round.maxScore} pts</span>
                    </div>
                    <div>
                      <span className="text-[var(--text-dim)] block text-[10px]">Cutoff Score</span>
                      <span className="text-[var(--text-base)] font-semibold">
                        {round.passingScore ? `${round.passingScore} pts` : 'Top Rankers'}
                      </span>
                    </div>
                    <div>
                      <span className="text-[var(--text-dim)] block text-[10px]">Questions</span>
                      <span className="text-[var(--text-base)] font-semibold">{round.questions.length} problems</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'rules' && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-[var(--text-base)] uppercase tracking-wider">Competition Rules & Code of Conduct</h3>
            <ul className="list-disc list-inside space-y-2 text-[var(--text-muted)]">
              {event.rules.map((rule, idx) => (
                <li key={idx} className="leading-relaxed">
                  <span className="text-[var(--text-base)]">{rule}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {activeTab === 'schedule' && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-[var(--text-base)] uppercase tracking-wider">Event Timeline</h3>
            <div className="space-y-3 font-mono text-xs">
              <div className="flex justify-between p-3 rounded-lg bg-[var(--bg-app)] border border-[var(--border)]">
                <span className="text-[var(--text-muted)]">Registration Closes:</span>
                <span className="text-[var(--text-base)] font-semibold">{event.registrationDeadline}</span>
              </div>
              <div className="flex justify-between p-3 rounded-lg bg-[var(--bg-app)] border border-[var(--border)]">
                <span className="text-[var(--text-muted)]">Event Starts:</span>
                <span className="text-cyan-400 font-semibold">{event.startDate} · {event.startTime}</span>
              </div>
              <div className="flex justify-between p-3 rounded-lg bg-[var(--bg-app)] border border-[var(--border)]">
                <span className="text-[var(--text-muted)]">Event Concludes:</span>
                <span className="text-[var(--text-base)] font-semibold">{event.endDate} · {event.endTime}</span>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'prizes' && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-[var(--text-base)] uppercase tracking-wider">Prizes & Bounties</h3>
            {event.prizes && event.prizes.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {event.prizes.map((p, idx) => (
                  <div key={idx} className="p-4 rounded-xl bg-[var(--bg-app)] border border-[var(--border)] space-y-1">
                    <span className="text-xs font-mono font-bold text-amber-400">{p.rank}</span>
                    <h4 className="text-sm font-bold text-[var(--text-base)]">{p.reward}</h4>
                    {p.description && <p className="text-[11px] text-[var(--text-muted)]">{p.description}</p>}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[var(--text-muted)]">Certificate of Merit & Global Leaderboard recognition awarded to top finishers.</p>
            )}
          </div>
        )}

        {activeTab === 'eligibility' && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-[var(--text-base)] uppercase tracking-wider">Eligibility Criteria</h3>
            <p className="text-[var(--text-muted)]">{event.eligibility.description}</p>
          </div>
        )}

        {activeTab === 'faqs' && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-[var(--text-base)] uppercase tracking-wider">Frequently Asked Questions</h3>
            <div className="space-y-3">
              {(event.faqs || [
                { question: 'What editor is provided in the contest arena?', answer: 'The exact Monaco code editor used by CodeForge with full syntax highlighting, bracket matching, and auto-indent.' },
                { question: 'What happens if my network drops during the contest?', answer: 'Your local code state is continuously autosaved. When you reconnect, your attempt automatically syncs with the server without resetting the timer.' }
              ]).map((faq, idx) => (
                <div key={idx} className="p-3.5 rounded-xl bg-[var(--bg-app)] border border-[var(--border)] space-y-1">
                  <h4 className="font-semibold text-xs text-[var(--text-base)]">{faq.question}</h4>
                  <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">{faq.answer}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

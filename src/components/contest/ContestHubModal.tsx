import React, { useState } from 'react';
import { Contest } from '../../lib/contestTypes';
import { SEED_CONTESTS } from '../../lib/contestData';
import { contestService } from '../../lib/contestService';
import { ContestLeaderboard } from './ContestLeaderboard';
import { ContestAdminDashboard } from './ContestAdminDashboard';
import {
  TrophyIcon,
  ShieldIcon,
  ClockIcon,
  CameraIcon,
  ScreenIcon,
  LockIcon,
  CheckIcon,
  MicIcon,
  AlertTriangleIcon,
} from '../icons';

interface ContestHubModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: { id: string; name: string; email?: string } | null;
  onSelectContestToEnter: (contest: Contest) => void;
  onOpenAuth: () => void;
}

export const ContestHubModal: React.FC<ContestHubModalProps> = ({
  isOpen,
  onClose,
  user,
  onSelectContestToEnter,
  onOpenAuth,
}) => {
  const [activeTab, setActiveTab] = useState<'contests' | 'leaderboard' | 'admin'>('contests');
  const [contestFilter, setContestFilter] = useState<'all' | 'competitive' | 'assessment'>('all');
  const [registeredContestIds, setRegisteredContestIds] = useState<Set<string>>(new Set(['contest-showdown-1']));
  const [registeringId, setRegisteringId] = useState<string | null>(null);

  if (!isOpen) return null;

  const filteredContests = SEED_CONTESTS.filter((c) => {
    if (contestFilter === 'all') return true;
    return c.type === contestFilter;
  });

  const handleRegister = async (contest: Contest) => {
    if (!user) {
      onOpenAuth();
      return;
    }
    setRegisteringId(contest.id);
    await contestService.registerContest(contest.id, user);
    setRegisteredContestIds((prev) => new Set(prev).add(contest.id));
    setRegisteringId(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-5xl bg-[#0b1120] border border-cyan-500/30 rounded-2xl shadow-2xl overflow-hidden flex flex-col h-[85vh]">
        {/* Hub Header */}
        <div className="px-6 py-4 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 text-white font-bold">
              <TrophyIcon className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white tracking-wide">CodeForge Contests & Assessments</h2>
                <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-400 border border-cyan-800/50">
                  Secure Proctor v2.4
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Competitive programming matches & proctored technical evaluations with server-authoritative integrity
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white text-base font-mono p-1 rounded-lg hover:bg-slate-800 transition"
          >
            ✕
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center justify-between border-b border-slate-800 bg-slate-950/60 px-6 pt-2">
          <div className="flex items-center gap-6">
            <button
              onClick={() => setActiveTab('contests')}
              className={`pb-3 text-xs font-semibold uppercase tracking-wider border-b-2 transition flex items-center gap-2 ${
                activeTab === 'contests'
                  ? 'border-cyan-400 text-cyan-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <TrophyIcon className="w-4 h-4" />
              Available Contests ({SEED_CONTESTS.length})
            </button>

            <button
              onClick={() => setActiveTab('leaderboard')}
              className={`pb-3 text-xs font-semibold uppercase tracking-wider border-b-2 transition flex items-center gap-2 ${
                activeTab === 'leaderboard'
                  ? 'border-cyan-400 text-cyan-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <ShieldIcon className="w-4 h-4" />
              Live Leaderboard
            </button>

            <button
              onClick={() => setActiveTab('admin')}
              className={`pb-3 text-xs font-semibold uppercase tracking-wider border-b-2 transition flex items-center gap-2 ${
                activeTab === 'admin'
                  ? 'border-cyan-400 text-cyan-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <LockIcon className="w-4 h-4" />
              Proctor & Security Admin
            </button>
          </div>

          {activeTab === 'contests' && (
            <div className="flex items-center gap-1.5 pb-2">
              {(['all', 'competitive', 'assessment'] as const).map((filter) => (
                <button
                  key={filter}
                  onClick={() => setContestFilter(filter)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold capitalize transition ${
                    contestFilter === filter
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                      : 'bg-slate-800/40 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'contests' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {filteredContests.map((contest) => {
                const isRegistered = registeredContestIds.has(contest.id);
                const isLive = contest.status === 'live';
                const isUpcoming = contest.status === 'upcoming';

                return (
                  <div
                    key={contest.id}
                    className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-cyan-500/40 transition flex flex-col justify-between space-y-4 group"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span
                          className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                            isLive
                              ? 'bg-rose-950 text-rose-400 border border-rose-800 animate-pulse'
                              : isUpcoming
                              ? 'bg-blue-950 text-blue-400 border border-blue-800'
                              : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {isLive ? '● Live Now' : isUpcoming ? 'Upcoming' : 'Concluded'}
                        </span>

                        <span className="text-[11px] font-semibold text-slate-400 capitalize">
                          {contest.type === 'competitive' ? 'Competitive Programming' : 'Technical Assessment'}
                        </span>
                      </div>

                      <h3 className="text-base font-bold text-white group-hover:text-cyan-300 transition">
                        {contest.title}
                      </h3>
                      <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                        {contest.description}
                      </p>
                    </div>

                    <div className="space-y-3">
                      {/* Metadata badges */}
                      <div className="grid grid-cols-3 gap-2 text-center text-xs">
                        <div className="bg-slate-950/60 p-2 rounded-lg border border-slate-800/80">
                          <span className="text-[10px] text-slate-500 block uppercase">Duration</span>
                          <span className="font-bold text-slate-200">{contest.durationMinutes}m</span>
                        </div>
                        <div className="bg-slate-950/60 p-2 rounded-lg border border-slate-800/80">
                          <span className="text-[10px] text-slate-500 block uppercase">Points</span>
                          <span className="font-bold text-cyan-400">{contest.totalPoints} pts</span>
                        </div>
                        <div className="bg-slate-950/60 p-2 rounded-lg border border-slate-800/80">
                          <span className="text-[10px] text-slate-500 block uppercase">Candidates</span>
                          <span className="font-bold text-slate-200">{contest.registeredUsersCount}</span>
                        </div>
                      </div>

                      {/* Proctoring Requirements Tags */}
                      <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[10px] text-slate-400">
                        <span className="font-semibold text-slate-500">Security:</span>
                        {contest.proctoring.requireCamera && (
                          <span className="px-2 py-0.5 rounded-full bg-slate-950 border border-slate-800 flex items-center gap-1">
                            <CameraIcon className="w-3 h-3 text-cyan-400" /> Cam
                          </span>
                        )}
                        {contest.proctoring.requireScreenShare && (
                          <span className="px-2 py-0.5 rounded-full bg-slate-950 border border-slate-800 flex items-center gap-1">
                            <ScreenIcon className="w-3 h-3 text-indigo-400" /> Screen
                          </span>
                        )}
                        {contest.proctoring.requireMic && (
                          <span className="px-2 py-0.5 rounded-full bg-slate-950 border border-slate-800 flex items-center gap-1">
                            <MicIcon className="w-3 h-3 text-purple-400" /> Mic
                          </span>
                        )}
                        {contest.proctoring.requireFullscreen && (
                          <span className="px-2 py-0.5 rounded-full bg-slate-950 border border-slate-800 flex items-center gap-1">
                            <LockIcon className="w-3 h-3 text-emerald-400" /> Fullscreen
                          </span>
                        )}
                      </div>

                      {/* CTA Actions */}
                      <div className="pt-2 flex items-center gap-2">
                        {isLive && isRegistered ? (
                          <button
                            onClick={() => onSelectContestToEnter(contest)}
                            className="w-full py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-xs uppercase tracking-wide shadow-lg shadow-cyan-500/20 transition cursor-pointer flex items-center justify-center gap-2"
                          >
                            <span>Enter Contest Arena</span>
                            <span>→</span>
                          </button>
                        ) : !isRegistered ? (
                          <button
                            onClick={() => handleRegister(contest)}
                            disabled={registeringId === contest.id}
                            className="w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-semibold text-xs border border-slate-700 transition cursor-pointer flex items-center justify-center gap-1.5"
                          >
                            {registeringId === contest.id ? 'Registering...' : 'Register for Contest'}
                          </button>
                        ) : (
                          <div className="w-full py-2 text-center text-xs text-slate-400 bg-slate-950/60 rounded-xl border border-slate-800">
                            Registered · Arena opens at scheduled time
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {activeTab === 'leaderboard' && (
            <ContestLeaderboard
              contestId="contest-showdown-1"
              contestTitle="CodeForge Grand Showdown #1"
            />
          )}

          {activeTab === 'admin' && (
            <ContestAdminDashboard contestId="contest-showdown-1" />
          )}
        </div>
      </div>
    </div>
  );
};

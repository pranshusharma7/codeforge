import React, { useState, useMemo } from 'react';
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
  GithubIcon,
  UserCheckIcon,
  PlayIcon,
  RefreshIcon,
} from '../icons';

interface ContestPageProps {
  logoImg: string;
  authUser: {
    id?: string | number;
    login?: string;
    name?: string;
    avatar_url?: string;
    email?: string;
  } | null;
  onBackToEditor: () => void;
  onOpenAuth: () => void;
  onSignOut: () => void;
  onSelectContestToEnter: (contest: Contest) => void;
}

export const ContestPage: React.FC<ContestPageProps> = ({
  logoImg,
  authUser,
  onBackToEditor,
  onOpenAuth,
  onSignOut,
  onSelectContestToEnter,
}) => {
  const [activeNav, setActiveNav] = useState<'contests' | 'assessments' | 'leaderboard' | 'proctor_admin'>('contests');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'live' | 'upcoming'>('all');
  const [registeredContestIds, setRegisteredContestIds] = useState<Set<string>>(new Set(['contest-showdown-1']));
  const [registeringId, setRegisteringId] = useState<string | null>(null);

  // Filtered contests based on search & tab
  const displayedContests = useMemo(() => {
    return SEED_CONTESTS.filter((c) => {
      // Tab filter
      if (activeNav === 'contests' && c.type !== 'competitive') return false;
      if (activeNav === 'assessments' && c.type !== 'assessment') return false;

      // Status filter
      if (statusFilter !== 'all' && c.status !== statusFilter) return false;

      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = c.title.toLowerCase().includes(q);
        const matchesDesc = c.description.toLowerCase().includes(q);
        return matchesTitle || matchesDesc;
      }
      return true;
    });
  }, [activeNav, statusFilter, searchQuery]);

  const handleRegister = async (contest: Contest) => {
    if (!authUser) {
      onOpenAuth();
      return;
    }
    setRegisteringId(contest.id);
    await contestService.registerContest(contest.id, {
      id: String(authUser.id || authUser.login || 'gh_user'),
      name: authUser.name || authUser.login || 'GitHub Contestant',
      email: authUser.email,
    });
    setRegisteredContestIds((prev) => new Set(prev).add(contest.id));
    setRegisteringId(null);
  };

  const activeLiveCount = useMemo(() => SEED_CONTESTS.filter((c) => c.status === 'live').length, []);
  const upcomingCount = useMemo(() => SEED_CONTESTS.filter((c) => c.status === 'upcoming').length, []);

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 flex flex-col font-sans select-none overflow-x-hidden">
      {/* ── Top CodeForge Navigation Bar ────────────────────────────────────────── */}
      <header className="h-14 px-6 bg-[#0f172a]/95 border-b border-slate-800/80 sticky top-0 z-40 backdrop-blur-md flex items-center justify-between">
        {/* Brand & Logo */}
        <div className="flex items-center gap-4">
          <div
            onClick={onBackToEditor}
            className="flex items-center gap-3 cursor-pointer group hover:opacity-90 transition"
            title="Return to CodeForge Code Editor"
          >
            <img src={logoImg} alt="CodeForge" className="w-6 h-6 object-contain rounded" />
            <span className="font-extrabold text-base tracking-tight text-white group-hover:text-cyan-400 transition">
              CodeForge
            </span>
          </div>

          <div className="h-4 w-px bg-slate-700/80 hidden sm:block" />

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider bg-cyan-950/70 px-2.5 py-0.5 rounded-full border border-cyan-800/60 shadow-sm shadow-cyan-500/10 flex items-center gap-1.5">
              <TrophyIcon className="w-3.5 h-3.5" />
              Contest Arena
            </span>
            <span className="text-[10px] text-slate-400 font-mono hidden md:inline">v2.4 Anti-Cheat</span>
          </div>
        </div>

        {/* Center Nav Links */}
        <div className="hidden lg:flex items-center gap-1 bg-slate-900/80 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setActiveNav('contests')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
              activeNav === 'contests'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <TrophyIcon className="w-3.5 h-3.5" />
            Competitive Contests
          </button>

          <button
            onClick={() => setActiveNav('assessments')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
              activeNav === 'assessments'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <ShieldIcon className="w-3.5 h-3.5" />
            Interview Assessments
          </button>

          <button
            onClick={() => setActiveNav('leaderboard')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
              activeNav === 'leaderboard'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>📊</span>
            Leaderboard
          </button>

          <button
            onClick={() => setActiveNav('proctor_admin')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
              activeNav === 'proctor_admin'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <LockIcon className="w-3.5 h-3.5" />
            Proctor Control
          </button>
        </div>

        {/* Right Actions: GitHub Auth & Back to Editor */}
        <div className="flex items-center gap-3">
          {/* GitHub User Auth State */}
          {authUser ? (
            <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1">
              {authUser.avatar_url ? (
                <img
                  src={authUser.avatar_url}
                  alt={authUser.login}
                  className="w-5 h-5 rounded-full object-cover border border-slate-700"
                />
              ) : (
                <GithubIcon size={14} className="text-slate-300" />
              )}
              <div className="flex flex-col text-left">
                <span className="text-xs font-bold text-slate-200 leading-none">
                  {authUser.name || authUser.login}
                </span>
                <span className="text-[9px] text-emerald-400 font-mono font-semibold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  GitHub Synced
                </span>
              </div>
            </div>
          ) : (
            <button
              onClick={onOpenAuth}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-slate-200 flex items-center gap-1.5 transition shadow-sm"
              title="Authenticate with GitHub to participate and record official rankings"
            >
              <GithubIcon size={14} />
              <span>Login with GitHub</span>
            </button>
          )}

          {/* Back to Editor Button */}
          <button
            onClick={onBackToEditor}
            className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-xs shadow-md shadow-cyan-600/20 transition flex items-center gap-1.5 cursor-pointer"
          >
            <span>←</span>
            <span>Back to Editor</span>
          </button>
        </div>
      </header>

      {/* ── Main Hero Section ─────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden pt-10 pb-8 px-6 border-b border-slate-800/80 bg-gradient-to-b from-slate-900/60 via-[#0a0f1d] to-[#090d16]">
        {/* Glow ambient effects */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-10 right-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-6xl mx-auto space-y-6 relative z-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700/80 text-xs text-slate-300">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                <span className="font-semibold text-emerald-400">{activeLiveCount} Active Contests Live</span>
                <span className="text-slate-600">|</span>
                <span className="text-slate-400">{upcomingCount} Scheduled for this week</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                CodeForge Arena & <span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">Proctored Assessments</span>
              </h1>
              <p className="text-sm text-slate-400 max-w-2xl leading-relaxed">
                Compete in real-time competitive programming challenges and high-stakes technical interview rounds with
                server-authoritative execution sandboxes, tamper-proof hidden test cases, and transparent AI proctoring telemetry.
              </p>
            </div>

            {/* Quick Actions / Status badge */}
            <div className="flex items-center gap-3">
              {!authUser && (
                <button
                  onClick={onOpenAuth}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs border border-slate-700 flex items-center gap-2 shadow-lg transition"
                >
                  <GithubIcon size={16} />
                  <span>Connect GitHub to Compete</span>
                </button>
              )}
            </div>
          </div>

          {/* 4 Feature Cards / Metrics Banner */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
            <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                <TrophyIcon className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs text-slate-400 font-medium block">Contestants Enrolled</span>
                <span className="text-lg font-bold text-white font-mono">1,504+</span>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                <ShieldIcon className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs text-slate-400 font-medium block">Anti-Cheat Verification</span>
                <span className="text-lg font-bold text-emerald-400 font-mono">99.8% Safe</span>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
                <ScreenIcon className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs text-slate-400 font-medium block">Proctored Streams</span>
                <span className="text-lg font-bold text-purple-300 font-mono">Cam · Screen · Mic</span>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <PlayIcon className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <span className="text-xs text-slate-400 font-medium block">Execution Sandbox</span>
                <span className="text-lg font-bold text-cyan-300 font-mono">Isolated Linux</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Sub Navigation & Search Bar ────────────────────────────────────────── */}
      <div className="bg-[#0b0f1a] border-b border-slate-800/80 px-6 py-3 sticky top-14 z-30">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Mobile Tab Switcher */}
          <div className="flex lg:hidden items-center gap-1 w-full sm:w-auto overflow-x-auto pb-1">
            <button
              onClick={() => setActiveNav('contests')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold ${
                activeNav === 'contests' ? 'bg-cyan-500/20 text-cyan-300' : 'text-slate-400'
              }`}
            >
              Competitive
            </button>
            <button
              onClick={() => setActiveNav('assessments')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold ${
                activeNav === 'assessments' ? 'bg-cyan-500/20 text-cyan-300' : 'text-slate-400'
              }`}
            >
              Assessments
            </button>
            <button
              onClick={() => setActiveNav('leaderboard')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold ${
                activeNav === 'leaderboard' ? 'bg-cyan-500/20 text-cyan-300' : 'text-slate-400'
              }`}
            >
              Leaderboard
            </button>
            <button
              onClick={() => setActiveNav('proctor_admin')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold ${
                activeNav === 'proctor_admin' ? 'bg-cyan-500/20 text-cyan-300' : 'text-slate-400'
              }`}
            >
              Proctor
            </button>
          </div>

          {/* Search bar */}
          {(activeNav === 'contests' || activeNav === 'assessments') && (
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search challenges by title or topic..."
                className="bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 w-full sm:w-72"
              />

              {/* Status filter pill */}
              <div className="flex items-center gap-1 bg-slate-900/60 p-1 rounded-xl border border-slate-800 shrink-0">
                {(['all', 'live', 'upcoming'] as const).map((st) => (
                  <button
                    key={st}
                    onClick={() => setStatusFilter(st)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold uppercase tracking-wider transition ${
                      statusFilter === st
                        ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Main Viewport Content ──────────────────────────────────────────────── */}
      <main className="max-w-6xl mx-auto w-full px-6 py-8 flex-1">
        {/* Contests or Assessments Grid */}
        {(activeNav === 'contests' || activeNav === 'assessments') && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-white tracking-wide">
                  {activeNav === 'contests' ? 'Competitive Programming Tournaments' : 'Technical Hiring Assessments'}
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  {activeNav === 'contests'
                    ? 'Algorithmic competitions ranked by speed, accuracy, and testcase passes.'
                    : 'Standardized assessment rounds designed for software engineering hiring pipelines.'}
                </p>
              </div>

              <span className="text-xs text-slate-400 font-mono">
                Showing {displayedContests.length} {displayedContests.length === 1 ? 'match' : 'matches'}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {displayedContests.map((contest) => {
                const isRegistered = registeredContestIds.has(contest.id);
                const isLive = contest.status === 'live';
                const isUpcoming = contest.status === 'upcoming';

                return (
                  <div
                    key={contest.id}
                    className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800/90 hover:border-cyan-500/50 transition-all duration-200 flex flex-col justify-between space-y-5 group relative overflow-hidden shadow-xl"
                  >
                    {/* Top ambient highlight */}
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-cyan-500/40 to-transparent opacity-0 group-hover:opacity-100 transition" />

                    <div>
                      {/* Status & Type Bar */}
                      <div className="flex items-center justify-between mb-3">
                        <span
                          className={`text-[10px] uppercase font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1.5 ${
                            isLive
                              ? 'bg-rose-950/80 text-rose-400 border border-rose-800'
                              : isUpcoming
                              ? 'bg-blue-950/80 text-blue-400 border border-blue-800'
                              : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {isLive && <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse" />}
                          {isLive ? 'Live Now' : isUpcoming ? 'Upcoming' : 'Concluded'}
                        </span>

                        <span className="text-xs font-semibold text-slate-400 capitalize">
                          {contest.type === 'competitive' ? 'Algorithmic Match' : 'Systems & Coding Round'}
                        </span>
                      </div>

                      <h3 className="text-lg font-bold text-white group-hover:text-cyan-300 transition">
                        {contest.title}
                      </h3>
                      <p className="text-xs text-slate-400 mt-1.5 line-clamp-2 leading-relaxed">
                        {contest.description}
                      </p>
                    </div>

                    <div className="space-y-4">
                      {/* Metric Boxes */}
                      <div className="grid grid-cols-3 gap-2.5 text-center text-xs">
                        <div className="bg-slate-950/70 p-2.5 rounded-xl border border-slate-800">
                          <span className="text-[10px] text-slate-500 block uppercase font-medium">Duration</span>
                          <span className="font-bold text-slate-200">{contest.durationMinutes} mins</span>
                        </div>
                        <div className="bg-slate-950/70 p-2.5 rounded-xl border border-slate-800">
                          <span className="text-[10px] text-slate-500 block uppercase font-medium">Total Points</span>
                          <span className="font-bold text-cyan-400">{contest.totalPoints} pts</span>
                        </div>
                        <div className="bg-slate-950/70 p-2.5 rounded-xl border border-slate-800">
                          <span className="text-[10px] text-slate-500 block uppercase font-medium">Registered</span>
                          <span className="font-bold text-slate-200">{contest.registeredUsersCount}</span>
                        </div>
                      </div>

                      {/* Proctoring Badges */}
                      <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-slate-400">
                        <span className="font-semibold text-slate-500 text-[10px] uppercase">Telemetry:</span>
                        {contest.proctoring.requireCamera && (
                          <span className="px-2 py-0.5 rounded-lg bg-slate-950 border border-slate-800 flex items-center gap-1 text-slate-300">
                            <CameraIcon className="w-3 h-3 text-cyan-400" /> Webcam
                          </span>
                        )}
                        {contest.proctoring.requireScreenShare && (
                          <span className="px-2 py-0.5 rounded-lg bg-slate-950 border border-slate-800 flex items-center gap-1 text-slate-300">
                            <ScreenIcon className="w-3 h-3 text-indigo-400" /> Screen Share
                          </span>
                        )}
                        {contest.proctoring.requireMic && (
                          <span className="px-2 py-0.5 rounded-lg bg-slate-950 border border-slate-800 flex items-center gap-1 text-slate-300">
                            <MicIcon className="w-3 h-3 text-purple-400" /> Mic
                          </span>
                        )}
                        {contest.proctoring.requireFullscreen && (
                          <span className="px-2 py-0.5 rounded-lg bg-slate-950 border border-slate-800 flex items-center gap-1 text-slate-300">
                            <LockIcon className="w-3 h-3 text-emerald-400" /> Fullscreen
                          </span>
                        )}
                      </div>

                      {/* Problems breakdown teaser */}
                      {contest.problems.length > 0 && (
                        <div className="text-[11px] text-slate-400 bg-slate-950/40 p-2 rounded-lg border border-slate-800/60 flex items-center justify-between">
                          <span>
                            <strong>{contest.problems.length} Problems:</strong>{' '}
                            {contest.problems.map((p) => p.title).join(', ')}
                          </span>
                        </div>
                      )}

                      {/* Action CTA */}
                      <div className="pt-1">
                        {isLive && isRegistered ? (
                          <button
                            onClick={() => onSelectContestToEnter(contest)}
                            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-cyan-500/25 transition cursor-pointer flex items-center justify-center gap-2 group-hover:shadow-cyan-500/40"
                          >
                            <span>Enter Contest Arena</span>
                            <span>→</span>
                          </button>
                        ) : !isRegistered ? (
                          <button
                            onClick={() => handleRegister(contest)}
                            disabled={registeringId === contest.id}
                            className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-semibold text-xs border border-slate-700 transition cursor-pointer flex items-center justify-center gap-2"
                          >
                            {registeringId === contest.id ? (
                              <>
                                <span className="w-3 h-3 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                                Binding GitHub Profile...
                              </>
                            ) : (
                              'Register for Contest'
                            )}
                          </button>
                        ) : (
                          <div className="w-full py-2.5 text-center text-xs text-slate-400 bg-slate-950/60 rounded-xl border border-slate-800 font-medium">
                            ✓ Registered · Contest arena opens at scheduled time
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Global Standings Leaderboard */}
        {activeNav === 'leaderboard' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-white tracking-wide">Live Tournament Standings</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Official leaderboard verified by CodeForge Anti-Cheat & Sandbox execution engine.
              </p>
            </div>
            <ContestLeaderboard contestId="contest-showdown-1" contestTitle="CodeForge Grand Showdown #1" />
          </div>
        )}

        {/* Proctor & Security Admin Dashboard */}
        {activeNav === 'proctor_admin' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-white tracking-wide">Proctor & Security Operations Center</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Real-time contestant session telemetry, composite risk scoring (0-100), and immutable audit logs.
              </p>
            </div>
            <ContestAdminDashboard contestId="contest-showdown-1" />
          </div>
        )}
      </main>

      {/* ── Footer ───────────────────────────────────────────────────────────── */}
      <footer className="py-6 px-6 border-t border-slate-800/80 bg-[#090d16] text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <img src={logoImg} alt="CodeForge" className="w-4 h-4 object-contain opacity-70" />
          <span>CodeForge Contest Platform · Production Proctor v2.4</span>
        </div>
        <div className="flex items-center gap-4 text-[11px]">
          <span>Transparent Proctoring Policy</span>
          <span>·</span>
          <span>Sandboxed Execution Engine</span>
          <span>·</span>
          <span>Server-Authoritative Clock</span>
        </div>
      </footer>
    </div>
  );
};

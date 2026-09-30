import React, { useState } from 'react';
import { LeaderboardEntry } from '../../lib/contestTypes';
import { TrophyIcon, ShieldIcon, CheckIcon, AlertTriangleIcon } from '../icons';

interface ContestLeaderboardProps {
  contestId: string;
  contestTitle: string;
}

const SEED_LEADERBOARD: LeaderboardEntry[] = [
  {
    rank: 1,
    userId: 'usr_coder_alpha',
    userName: 'Alex Chen',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=80&h=80&fit=crop',
    score: 300,
    penaltyTimeSeconds: 4120,
    solvedProblemsCount: 3,
    problemSubmissions: {
      'prob-max-subarray': { solved: true, attempts: 1, timeMinutes: 14, points: 50 },
      'prob-two-sum-target': { solved: true, attempts: 1, timeMinutes: 28, points: 100 },
      'prob-valid-parentheses': { solved: true, attempts: 2, timeMinutes: 52, points: 150 },
    },
    riskScore: 5,
    proctorStatus: 'verified',
  },
  {
    rank: 2,
    userId: 'usr_sarah_algo',
    userName: 'Sarah Jenkins',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&h=80&fit=crop',
    score: 250,
    penaltyTimeSeconds: 4890,
    solvedProblemsCount: 2,
    problemSubmissions: {
      'prob-max-subarray': { solved: true, attempts: 1, timeMinutes: 18, points: 50 },
      'prob-two-sum-target': { solved: true, attempts: 1, timeMinutes: 44, points: 100 },
      'prob-valid-parentheses': { solved: false, attempts: 3, timeMinutes: 70, points: 100 },
    },
    riskScore: 12,
    proctorStatus: 'verified',
  },
  {
    rank: 3,
    userId: 'usr_rahul_dev',
    userName: 'Rahul Sharma',
    avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=80&h=80&fit=crop',
    score: 200,
    penaltyTimeSeconds: 5230,
    solvedProblemsCount: 2,
    problemSubmissions: {
      'prob-max-subarray': { solved: true, attempts: 2, timeMinutes: 22, points: 50 },
      'prob-two-sum-target': { solved: true, attempts: 1, timeMinutes: 56, points: 100 },
    },
    riskScore: 34,
    proctorStatus: 'in_review',
  },
  {
    rank: 4,
    userId: 'usr_elena_k',
    userName: 'Elena Rostova',
    avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=80&h=80&fit=crop',
    score: 150,
    penaltyTimeSeconds: 3100,
    solvedProblemsCount: 2,
    problemSubmissions: {
      'prob-max-subarray': { solved: true, attempts: 1, timeMinutes: 12, points: 50 },
      'prob-two-sum-target': { solved: true, attempts: 2, timeMinutes: 38, points: 100 },
    },
    riskScore: 68,
    proctorStatus: 'flagged',
  },
  {
    rank: 5,
    userId: 'usr_david_m',
    userName: 'David Miller',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop',
    score: 150,
    penaltyTimeSeconds: 3950,
    solvedProblemsCount: 2,
    problemSubmissions: {
      'prob-max-subarray': { solved: true, attempts: 1, timeMinutes: 19, points: 50 },
      'prob-two-sum-target': { solved: true, attempts: 3, timeMinutes: 46, points: 100 },
    },
    riskScore: 8,
    proctorStatus: 'verified',
  },
];

export const ContestLeaderboard: React.FC<ContestLeaderboardProps> = ({ contestTitle }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'verified' | 'in_review' | 'flagged'>('all');

  const filteredEntries = SEED_LEADERBOARD.filter((entry) => {
    const matchesSearch = entry.userName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === 'all' || entry.proctorStatus === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const formatPenalty = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}m ${s}s`;
  };

  return (
    <div className="space-y-4">
      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-900/60 p-3 rounded-xl border border-slate-800">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <input
            type="text"
            placeholder="Search contestant..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 w-full sm:w-56"
          />
        </div>

        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto">
          {(['all', 'verified', 'in_review', 'flagged'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold capitalize transition ${
                filterStatus === status
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                  : 'bg-slate-800/50 text-slate-400 hover:text-slate-200'
              }`}
            >
              {status.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-900/40">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-900/90 text-slate-400 uppercase font-semibold text-[10px] tracking-wider border-b border-slate-800">
            <tr>
              <th className="py-3 px-4 w-12 text-center">Rank</th>
              <th className="py-3 px-4">Contestant</th>
              <th className="py-3 px-4 text-center">Solved</th>
              <th className="py-3 px-4 text-center">Score</th>
              <th className="py-3 px-4 text-center">Penalty Time</th>
              <th className="py-3 px-4 text-center">Integrity Audit</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-sans">
            {filteredEntries.map((entry) => (
              <tr key={entry.userId} className="hover:bg-slate-800/30 transition">
                <td className="py-3 px-4 text-center font-bold">
                  {entry.rank === 1 ? (
                    <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40">
                      🥇
                    </span>
                  ) : entry.rank === 2 ? (
                    <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-slate-400/20 text-slate-300 border border-slate-400/40">
                      🥈
                    </span>
                  ) : entry.rank === 3 ? (
                    <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-700/20 text-amber-400 border border-amber-700/40">
                      🥉
                    </span>
                  ) : (
                    <span className="text-slate-400 font-mono">#{entry.rank}</span>
                  )}
                </td>

                <td className="py-3 px-4">
                  <div className="flex items-center gap-2.5">
                    <img
                      src={entry.avatar}
                      alt={entry.userName}
                      className="w-7 h-7 rounded-full object-cover border border-slate-700"
                    />
                    <div>
                      <span className="font-semibold text-slate-200 block">{entry.userName}</span>
                      <span className="text-[10px] text-slate-500 font-mono">@{entry.userId.replace('usr_', '')}</span>
                    </div>
                  </div>
                </td>

                <td className="py-3 px-4 text-center font-mono font-semibold text-cyan-400">
                  {entry.solvedProblemsCount}
                </td>

                <td className="py-3 px-4 text-center font-mono font-bold text-white text-sm">
                  {entry.score}
                </td>

                <td className="py-3 px-4 text-center font-mono text-slate-400">
                  {formatPenalty(entry.penaltyTimeSeconds)}
                </td>

                <td className="py-3 px-4 text-center">
                  {entry.proctorStatus === 'verified' && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-950/60 text-emerald-400 border border-emerald-800">
                      <CheckIcon className="w-3 h-3" /> Verified Safe
                    </span>
                  )}
                  {entry.proctorStatus === 'in_review' && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-950/60 text-amber-400 border border-amber-800">
                      <AlertTriangleIcon className="w-3 h-3" /> Under Review
                    </span>
                  )}
                  {entry.proctorStatus === 'flagged' && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-950/60 text-rose-400 border border-rose-800">
                      <ShieldIcon className="w-3 h-3" /> Flagged
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

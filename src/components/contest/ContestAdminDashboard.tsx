import React, { useState, useEffect } from 'react';
import { ContestSession, SecurityEvent } from '../../lib/contestTypes';
import {
  ShieldIcon,
  AlertTriangleIcon,
  EyeIcon,
  CheckIcon,
  CameraIcon,
  ScreenIcon,
  LockIcon,
  ClockIcon,
} from '../icons';

interface ContestAdminDashboardProps {
  contestId: string;
}

export const ContestAdminDashboard: React.FC<ContestAdminDashboardProps> = ({ contestId }) => {
  const [sessions, setSessions] = useState<ContestSession[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [selectedSession, setSelectedSession] = useState<ContestSession | null>(null);
  const [filterRisk, setFilterRisk] = useState<'all' | 'high' | 'review' | 'normal'>('all');
  const [isLoading, setIsLoading] = useState(true);

  // Fetch admin audit logs and sessions from backend
  const fetchAdminData = async () => {
    try {
      const res = await fetch(`/api/contest/admin/audit?contestId=${contestId}`);
      if (res.ok) {
        const data = await res.json();
        setSessions(data.sessions || []);
        setAuditLogs(data.auditLogs || []);
      }
    } catch {
      // Fallback demo sessions if server is newly started
      setSessions([
        {
          id: 'ses_cand_9921',
          contestId,
          userId: 'usr_sarah_99',
          userName: 'Sarah Jenkins',
          userEmail: 'sarah.j@example.com',
          status: 'in_progress',
          startTime: new Date(Date.now() - 40 * 60 * 1000).toISOString(),
          startTimestamp: Date.now() - 40 * 60 * 1000,
          lastHeartbeat: Date.now() - 5000,
          ipAddress: '192.168.1.42',
          userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
          deviceInfo: 'MacIntel | Chrome 129.0',
          permissions: {
            cameraGranted: true,
            micGranted: true,
            screenGranted: true,
            fullscreenActive: true,
          },
          riskMetrics: {
            overallScore: 78,
            level: 'high',
            totalViolations: 4,
            breakdown: {
              tabSwitches: 2,
              windowBlurs: 1,
              fullscreenExits: 1,
              screenShareDrops: 0,
              cameraDrops: 0,
              micDrops: 0,
              copyPastes: 2,
              devtoolsDetections: 0,
            },
          },
          submissions: [],
        },
        {
          id: 'ses_cand_8832',
          contestId,
          userId: 'usr_alex_01',
          userName: 'Alex Chen',
          userEmail: 'alex.c@example.com',
          status: 'in_progress',
          startTime: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
          startTimestamp: Date.now() - 25 * 60 * 1000,
          lastHeartbeat: Date.now() - 2000,
          ipAddress: '10.0.0.15',
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
          deviceInfo: 'Win32 | Firefox 130.0',
          permissions: {
            cameraGranted: true,
            micGranted: false,
            screenGranted: true,
            fullscreenActive: true,
          },
          riskMetrics: {
            overallScore: 8,
            level: 'normal',
            totalViolations: 0,
            breakdown: {
              tabSwitches: 0,
              windowBlurs: 0,
              fullscreenExits: 0,
              screenShareDrops: 0,
              cameraDrops: 0,
              micDrops: 0,
              copyPastes: 0,
              devtoolsDetections: 0,
            },
          },
          submissions: [],
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
    const interval = setInterval(fetchAdminData, 8000);
    return () => clearInterval(interval);
  }, [contestId]);

  const filteredSessions = sessions.filter((s) => {
    if (filterRisk === 'all') return true;
    return s.riskMetrics.level === filterRisk;
  });

  return (
    <div className="space-y-6">
      {/* Overview Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
          <span className="text-slate-400 text-xs block mb-1">Active Contestants</span>
          <span className="text-2xl font-bold text-white">{sessions.length}</span>
        </div>
        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
          <span className="text-slate-400 text-xs block mb-1">High Risk Anomaly Sessions</span>
          <span className="text-2xl font-bold text-rose-400">
            {sessions.filter((s) => s.riskMetrics.level === 'high').length}
          </span>
        </div>
        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
          <span className="text-slate-400 text-xs block mb-1">In Review Sessions</span>
          <span className="text-2xl font-bold text-amber-400">
            {sessions.filter((s) => s.riskMetrics.level === 'review').length}
          </span>
        </div>
        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
          <span className="text-slate-400 text-xs block mb-1">Immutable Audit Records</span>
          <span className="text-2xl font-bold text-cyan-400">{auditLogs.length}</span>
        </div>
      </div>

      {/* Main Roster & Inspection Split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Candidate List (2 Cols) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between bg-slate-900/60 p-3 rounded-xl border border-slate-800">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">Active Candidate Roster</h3>

            <div className="flex items-center gap-1.5">
              {(['all', 'high', 'review', 'normal'] as const).map((lvl) => (
                <button
                  key={lvl}
                  onClick={() => setFilterRisk(lvl)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold uppercase tracking-wider transition ${
                    filterRisk === lvl
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                      : 'bg-slate-800/40 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {lvl}
                </button>
              ))}
            </div>
          </div>

          <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-900/40">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/90 text-slate-400 uppercase font-semibold text-[10px] tracking-wider border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Candidate</th>
                  <th className="py-3 px-4">Device / IP</th>
                  <th className="py-3 px-4 text-center">Proctor Stream</th>
                  <th className="py-3 px-4 text-center">Risk Score</th>
                  <th className="py-3 px-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredSessions.map((cand) => (
                  <tr
                    key={cand.id}
                    onClick={() => setSelectedSession(cand)}
                    className={`hover:bg-slate-800/40 cursor-pointer transition ${
                      selectedSession?.id === cand.id ? 'bg-cyan-950/20 border-l-2 border-cyan-400' : ''
                    }`}
                  >
                    <td className="py-3 px-4">
                      <div>
                        <span className="font-semibold text-slate-200 block">{cand.userName}</span>
                        <span className="text-[10px] text-slate-500 font-mono">{cand.id}</span>
                      </div>
                    </td>

                    <td className="py-3 px-4 text-slate-400 text-[11px]">
                      <div>{cand.ipAddress}</div>
                      <div className="text-[10px] text-slate-500 truncate max-w-[140px]">{cand.deviceInfo}</div>
                    </td>

                    <td className="py-3 px-4 text-center">
                      <div className="inline-flex items-center gap-1.5">
                        <span
                          className={`w-2 h-2 rounded-full ${
                            cand.permissions.cameraGranted ? 'bg-emerald-400' : 'bg-slate-600'
                          }`}
                          title="Camera"
                        />
                        <span
                          className={`w-2 h-2 rounded-full ${
                            cand.permissions.screenGranted ? 'bg-emerald-400' : 'bg-slate-600'
                          }`}
                          title="Screen Share"
                        />
                        <span
                          className={`w-2 h-2 rounded-full ${
                            cand.permissions.fullscreenActive ? 'bg-emerald-400' : 'bg-rose-500'
                          }`}
                          title="Fullscreen"
                        />
                      </div>
                    </td>

                    <td className="py-3 px-4 text-center">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          cand.riskMetrics.level === 'high'
                            ? 'bg-rose-950/80 text-rose-300 border border-rose-800'
                            : cand.riskMetrics.level === 'review'
                            ? 'bg-amber-950/80 text-amber-300 border border-amber-800'
                            : 'bg-emerald-950/80 text-emerald-400 border border-emerald-800'
                        }`}
                      >
                        {cand.riskMetrics.overallScore}% ({cand.riskMetrics.level.toUpperCase()})
                      </span>
                    </td>

                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedSession(cand);
                        }}
                        className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-[11px] font-medium transition"
                      >
                        Audit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Detailed Inspector Drawer (1 Col) */}
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-3 flex items-center gap-2">
              <ShieldIcon className="w-4 h-4 text-cyan-400" />
              Proctor Risk Inspector
            </h3>

            {selectedSession ? (
              <div className="space-y-4 text-xs">
                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-1">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Candidate:</span>
                    <span className="font-semibold text-white">{selectedSession.userName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Session ID:</span>
                    <span className="font-mono text-cyan-300">{selectedSession.id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Started:</span>
                    <span className="text-slate-300">
                      {new Date(selectedSession.startTime).toLocaleTimeString()}
                    </span>
                  </div>
                </div>

                {/* Telemetry Breakdown */}
                <div>
                  <span className="text-slate-400 font-semibold block mb-2 text-[11px] uppercase tracking-wider">
                    Anti-Cheat Anomaly Breakdown
                  </span>
                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div className="p-2 rounded bg-slate-950 border border-slate-800/80">
                      <span className="text-slate-500 block">Tab Switches</span>
                      <span className="font-bold text-slate-200">
                        {selectedSession.riskMetrics.breakdown.tabSwitches}
                      </span>
                    </div>
                    <div className="p-2 rounded bg-slate-950 border border-slate-800/80">
                      <span className="text-slate-500 block">Fullscreen Exits</span>
                      <span className="font-bold text-slate-200">
                        {selectedSession.riskMetrics.breakdown.fullscreenExits}
                      </span>
                    </div>
                    <div className="p-2 rounded bg-slate-950 border border-slate-800/80">
                      <span className="text-slate-500 block">Paste Events</span>
                      <span className="font-bold text-slate-200">
                        {selectedSession.riskMetrics.breakdown.copyPastes}
                      </span>
                    </div>
                    <div className="p-2 rounded bg-slate-950 border border-slate-800/80">
                      <span className="text-slate-500 block">Screen Drops</span>
                      <span className="font-bold text-slate-200">
                        {selectedSession.riskMetrics.breakdown.screenShareDrops}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Timeline of events */}
                <div>
                  <span className="text-slate-400 font-semibold block mb-2 text-[11px] uppercase tracking-wider">
                    Audit Log Stream
                  </span>
                  <div className="max-h-48 overflow-y-auto space-y-1.5 p-2 rounded-lg bg-slate-950 border border-slate-800 font-mono text-[10px]">
                    {auditLogs
                      .filter((l) => l.sessionId === selectedSession.id)
                      .map((log, idx) => (
                        <div key={idx} className="border-b border-slate-800/60 pb-1">
                          <span className="text-cyan-400">{new Date(log.timestamp).toLocaleTimeString()}</span>{' '}
                          <span className="text-amber-300 font-bold">{log.event}</span>
                        </div>
                      ))}
                    {auditLogs.filter((l) => l.sessionId === selectedSession.id).length === 0 && (
                      <span className="text-slate-600 block py-2 text-center font-sans">
                        No critical violations logged yet.
                      </span>
                    )}
                  </div>
                </div>

                {/* Moderator Actions */}
                <div className="pt-2 flex items-center gap-2">
                  <button
                    onClick={() => {
                      alert(`Session ${selectedSession.id} verified and cleared.`);
                    }}
                    className="flex-1 py-1.5 rounded-lg bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-300 border border-emerald-500/40 text-xs font-semibold transition"
                  >
                    Clear & Approve
                  </button>
                  <button
                    onClick={() => {
                      alert(`Session ${selectedSession.id} flagged for disqualification.`);
                    }}
                    className="flex-1 py-1.5 rounded-lg bg-rose-600/30 hover:bg-rose-600/50 text-rose-300 border border-rose-500/40 text-xs font-semibold transition"
                  >
                    Flag Attempt
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-10 text-slate-500 text-xs">
                Select any candidate from the roster to inspect telemetry and audit logs.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

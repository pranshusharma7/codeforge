import React, { useState, useEffect } from 'react';
import {
  CodeForgeEvent,
  EventRegistration,
  QuestionBankItem,
} from '../../lib/eventTypes';
import { eventStore } from '../../lib/eventStore';
import {
  TrophyIcon,
  ShieldIcon,
  ClockIcon,
  PlayIcon,
  LockIcon,
  CheckIcon,
  AlertTriangleIcon,
} from '../icons';

interface OrganizerDashboardProps {
  onOpenCreateWizard: () => void;
  onSelectEventToView: (event: CodeForgeEvent) => void;
}

export const OrganizerDashboard: React.FC<OrganizerDashboardProps> = ({
  onOpenCreateWizard,
  onSelectEventToView,
}) => {
  const [activeTab, setActiveTab] = useState<'events' | 'live_control' | 'participants' | 'question_bank' | 'analytics'>('events');
  const [events, setEvents] = useState<CodeForgeEvent[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>('ev-codeforge-weekly-01');
  const [announcementMsg, setAnnouncementMsg] = useState('');
  const [broadcastSentToast, setBroadcastSentToast] = useState(false);
  const [questionBank, setQuestionBank] = useState<QuestionBankItem[]>([]);
  const [bankSearch, setBankSearch] = useState('');

  const refreshData = () => {
    const all = eventStore.getEvents();
    setEvents(all);
    if (!selectedEventId && all.length > 0) {
      setSelectedEventId(all[0].id);
    }
    setQuestionBank(eventStore.getQuestionBank());
  };

  useEffect(() => {
    refreshData();
  }, []);

  const activeEvent = events.find((e) => e.id === selectedEventId) || events[0];
  const activeRegistrations = activeEvent ? eventStore.getRegistrationsForEvent(activeEvent.id) : [];

  // Live Control actions
  const handleBroadcast = () => {
    if (!announcementMsg.trim() || !activeEvent) return;
    eventStore.broadcastAnnouncement(activeEvent.id, 'Organizer Announcement', announcementMsg.trim());
    setAnnouncementMsg('');
    setBroadcastSentToast(true);
    refreshData();
    setTimeout(() => setBroadcastSentToast(false), 3000);
  };

  const handleExtendTime = (minutes: number) => {
    if (!activeEvent) return;
    eventStore.extendEventDuration(activeEvent.id, minutes);
    refreshData();
  };

  const handleTogglePause = () => {
    if (!activeEvent) return;
    const nextStatus = activeEvent.status === 'PAUSED' ? 'LIVE' : 'PAUSED';
    eventStore.setEventStatus(activeEvent.id, nextStatus);
    refreshData();
  };

  // Export CSV
  const handleExportCSV = () => {
    if (!activeEvent) return;
    const rows = [
      ['Participant Name', 'Email', 'GitHub', 'College', 'Score', 'Status', 'Registered At'],
      ...activeRegistrations.map((r) => [
        r.userName,
        r.userEmail,
        r.githubHandle || '',
        r.college || '',
        String(r.totalScore),
        r.status,
        r.registeredAt,
      ]),
    ];
    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map((e) => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${activeEvent.slug}_results.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20 animate-in fade-in duration-150">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--border)] pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800">
              Organizer Operations Center
            </span>
          </div>
          <h2 className="text-xl font-bold text-[var(--text-base)]">Event Management & Control Hub</h2>
          <p className="text-xs text-[var(--text-muted)]">
            Create events, manage rounds, monitor live participants, and export verified contest scorecards.
          </p>
        </div>

        <button
          onClick={onOpenCreateWizard}
          className="px-4 py-2 rounded-xl bg-[var(--accent)] hover:bg-[var(--accent-2)] text-white text-xs font-bold shadow-md shadow-blue-500/20 transition cursor-pointer flex items-center gap-1.5 self-start sm:self-auto"
        >
          <span>+ Create New Event</span>
        </button>
      </div>

      {/* Summary KPI Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="p-3.5 rounded-xl bg-[var(--bg-card)] border border-[var(--border)]">
          <span className="text-[10px] text-[var(--text-dim)] uppercase font-mono block">Hosted Events</span>
          <span className="text-xl font-bold text-[var(--text-base)] font-mono">{events.length}</span>
        </div>
        <div className="p-3.5 rounded-xl bg-[var(--bg-card)] border border-[var(--border)]">
          <span className="text-[10px] text-[var(--text-dim)] uppercase font-mono block">Active Right Now</span>
          <span className="text-xl font-bold text-rose-400 font-mono">
            {events.filter((e) => e.status === 'LIVE').length}
          </span>
        </div>
        <div className="p-3.5 rounded-xl bg-[var(--bg-card)] border border-[var(--border)]">
          <span className="text-[10px] text-[var(--text-dim)] uppercase font-mono block">Total Participants</span>
          <span className="text-xl font-bold text-cyan-400 font-mono">
            {events.reduce((acc, curr) => acc + (curr.currentParticipantsCount || 0), 0)}
          </span>
        </div>
        <div className="p-3.5 rounded-xl bg-[var(--bg-card)] border border-[var(--border)]">
          <span className="text-[10px] text-[var(--text-dim)] uppercase font-mono block">Total Submissions</span>
          <span className="text-xl font-bold text-[var(--text-base)] font-mono">3,892</span>
        </div>
        <div className="p-3.5 rounded-xl bg-[var(--bg-card)] border border-[var(--border)]">
          <span className="text-[10px] text-[var(--text-dim)] uppercase font-mono block">Average Score</span>
          <span className="text-xl font-bold text-emerald-400 font-mono">68.4%</span>
        </div>
        <div className="p-3.5 rounded-xl bg-[var(--bg-card)] border border-[var(--border)]">
          <span className="text-[10px] text-[var(--text-dim)] uppercase font-mono block">Anti-Cheat Safe</span>
          <span className="text-xl font-bold text-purple-400 font-mono">99.8%</span>
        </div>
      </div>

      {/* Tabs Switcher */}
      <div className="flex items-center gap-1 border-b border-[var(--border)] overflow-x-auto pb-1 text-xs">
        {[
          { id: 'events', label: `My Events (${events.length})` },
          { id: 'live_control', label: '🔴 Live Event Control Center' },
          { id: 'participants', label: 'Participant Roster' },
          { id: 'question_bank', label: `Question Bank (${questionBank.length})` },
          { id: 'analytics', label: 'Analytics & Export' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-2 font-semibold transition rounded-t-lg border-b-2 -mb-px shrink-0 ${
              activeTab === tab.id
                ? 'border-[var(--accent)] text-[var(--text-base)] bg-[var(--bg-card)]'
                : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-base)]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab 1: Events Management Table */}
      {activeTab === 'events' && (
        <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl overflow-hidden">
          <div className="p-4 border-b border-[var(--border)] flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-base)]">
              All Configured Competitions & Assessments
            </h3>
            <span className="text-xs text-[var(--text-muted)]">
              Manage rounds, edit questions, or open live event controls.
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[var(--bg-app)] text-[var(--text-dim)] uppercase font-semibold text-[10px] tracking-wider border-b border-[var(--border)]">
                <tr>
                  <th className="py-3 px-4">Event Details</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-center">Rounds</th>
                  <th className="py-3 px-4 text-center">Enrolled</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-subtle)]">
                {events.map((ev) => (
                  <tr key={ev.id} className="hover:bg-[var(--bg-hover)] transition">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={ev.logo}
                          alt={ev.title}
                          className="w-8 h-8 rounded-lg object-cover border border-[var(--border)]"
                          onError={(e) => {
                            (e.currentTarget as any).src =
                              'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100&h=100&fit=crop';
                          }}
                        />
                        <div>
                          <span className="font-bold text-[var(--text-base)] block">{ev.title}</span>
                          <span className="text-[10px] text-[var(--text-muted)] font-mono">
                            {ev.startDate} · {ev.startTime} ({ev.durationMinutes}m)
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-[var(--text-muted)]">
                      <span className="px-2 py-0.5 rounded bg-[var(--bg-app)] border border-[var(--border)] text-[10px] font-semibold">
                        {ev.eventType}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <span
                        className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                          ev.status === 'LIVE'
                            ? 'bg-rose-950/80 text-rose-400 border border-rose-800'
                            : 'bg-sky-950/80 text-sky-400 border border-sky-800'
                        }`}
                      >
                        {ev.status}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-center font-mono font-semibold text-[var(--text-base)]">
                      {ev.rounds.length}
                    </td>

                    <td className="py-3.5 px-4 text-center font-mono font-semibold text-cyan-400">
                      {ev.currentParticipantsCount}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => onSelectEventToView(ev)}
                          className="px-2.5 py-1 rounded bg-[var(--bg-app)] hover:bg-[var(--bg-hover)] text-[var(--text-base)] border border-[var(--border)] text-[11px] font-semibold transition"
                        >
                          View
                        </button>
                        <button
                          onClick={() => {
                            setSelectedEventId(ev.id);
                            setActiveTab('live_control');
                          }}
                          className="px-2.5 py-1 rounded bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/40 text-[11px] font-semibold transition"
                        >
                          Control
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Live Control Center */}
      {activeTab === 'live_control' && activeEvent && (
        <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--border)] pb-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="w-2 h-2 rounded-full bg-rose-400 animate-ping" />
                <span className="text-[10px] font-mono uppercase text-rose-400 font-bold">
                  Live Operations Deck
                </span>
              </div>
              <h3 className="text-lg font-bold text-[var(--text-base)]">{activeEvent.title}</h3>
            </div>

            {/* Quick action buttons */}
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={handleTogglePause}
                className="px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-bold transition cursor-pointer"
              >
                {activeEvent.status === 'PAUSED' ? '▶ Resume Event' : '⏸ Pause Event'}
              </button>

              <button
                onClick={() => handleExtendTime(15)}
                className="px-3 py-1.5 rounded-lg bg-[var(--bg-app)] hover:bg-[var(--bg-hover)] text-[var(--text-base)] border border-[var(--border)] text-xs font-semibold transition cursor-pointer"
              >
                +15 Mins Time
              </button>

              <button
                onClick={() => handleExtendTime(30)}
                className="px-3 py-1.5 rounded-lg bg-[var(--bg-app)] hover:bg-[var(--bg-hover)] text-[var(--text-base)] border border-[var(--border)] text-xs font-semibold transition cursor-pointer"
              >
                +30 Mins Time
              </button>
            </div>
          </div>

          {/* Broadcast Announcement Bar */}
          <div className="p-4 rounded-xl bg-[var(--bg-app)] border border-[var(--border)] space-y-3">
            <span className="text-xs font-bold text-[var(--text-base)] block">
              Broadcast Real-Time Announcement to All Candidates
            </span>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={announcementMsg}
                onChange={(e) => setAnnouncementMsg(e.target.value)}
                placeholder="e.g. Round 2 unlocks in 5 minutes. Check your problem descriptions."
                className="flex-1 bg-[var(--bg-card)] border border-[var(--border)] rounded-lg p-2 text-xs text-[var(--text-base)] focus:outline-none focus:border-[var(--accent)]"
              />
              <button
                onClick={handleBroadcast}
                className="px-4 py-2 bg-[var(--accent)] hover:bg-[var(--accent-2)] text-white text-xs font-bold rounded-lg transition cursor-pointer"
              >
                Send Broadcast
              </button>
            </div>
            {broadcastSentToast && (
              <span className="text-[11px] text-emerald-400 font-semibold block animate-in fade-in">
                ✓ Announcement broadcasted instantly to contestant environments.
              </span>
            )}
          </div>

          {/* Past Announcements */}
          <div className="space-y-2">
            <span className="text-[11px] font-mono text-[var(--text-dim)] uppercase block">
              Active Announcements Feed:
            </span>
            {activeEvent.announcements && activeEvent.announcements.length > 0 ? (
              activeEvent.announcements.map((ann) => (
                <div
                  key={ann.id}
                  className="p-3 rounded-lg bg-[var(--bg-app)] border border-[var(--border)] flex justify-between items-center text-xs"
                >
                  <div>
                    <span className="font-bold text-[var(--text-base)] block">{ann.title}</span>
                    <span className="text-[var(--text-muted)]">{ann.message}</span>
                  </div>
                  <span className="text-[10px] font-mono text-[var(--text-dim)]">
                    {new Date(ann.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-xs text-[var(--text-muted)] italic">No announcements sent yet.</p>
            )}
          </div>
        </div>
      )}

      {/* Tab 3: Participant Management Roster */}
      {activeTab === 'participants' && (
        <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-base)]">
                Registered Candidates for {activeEvent?.title}
              </h3>
              <p className="text-xs text-[var(--text-muted)]">
                Review verified identities, GitHub bindings, and submission scores.
              </p>
            </div>

            <button
              onClick={handleExportCSV}
              className="px-3 py-1.5 rounded-lg bg-[var(--bg-app)] hover:bg-[var(--bg-hover)] border border-[var(--border)] text-xs font-semibold text-[var(--text-base)] transition flex items-center gap-1.5"
            >
              <span>📥 Export CSV</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[var(--bg-app)] text-[var(--text-dim)] uppercase font-semibold text-[10px] tracking-wider border-b border-[var(--border)]">
                <tr>
                  <th className="py-2.5 px-3">Candidate</th>
                  <th className="py-2.5 px-3">GitHub / College</th>
                  <th className="py-2.5 px-3 text-center">Score</th>
                  <th className="py-2.5 px-3 text-center">Status</th>
                  <th className="py-2.5 px-3 text-center">Violations</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-subtle)]">
                {activeRegistrations.map((reg) => (
                  <tr key={reg.id} className="hover:bg-[var(--bg-hover)] transition">
                    <td className="py-3 px-3">
                      <span className="font-bold text-[var(--text-base)] block">{reg.userName}</span>
                      <span className="text-[10px] text-[var(--text-muted)] font-mono">{reg.userEmail}</span>
                    </td>
                    <td className="py-3 px-3 text-[var(--text-muted)]">
                      <div>@{reg.githubHandle || 'unlinked'}</div>
                      <div className="text-[10px] text-[var(--text-dim)]">{reg.college || 'Direct Registration'}</div>
                    </td>
                    <td className="py-3 px-3 text-center font-mono font-bold text-cyan-400">
                      {reg.totalScore}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold uppercase bg-emerald-950/60 text-emerald-400 border border-emerald-800">
                        {reg.status}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className="font-mono text-slate-400">
                        {reg.securityViolationCount} flags
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 4: Question Bank */}
      {activeTab === 'question_bank' && (
        <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[var(--border)] pb-3">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-base)]">
                Reusable CodeForge Question Bank
              </h3>
              <p className="text-xs text-[var(--text-muted)]">
                Import tested problems, testcases, and MCQs across multiple rounds and events.
              </p>
            </div>

            <input
              type="text"
              value={bankSearch}
              onChange={(e) => setBankSearch(e.target.value)}
              placeholder="Search problems by tag or title..."
              className="bg-[var(--bg-app)] border border-[var(--border)] rounded-lg px-3 py-1.5 text-xs text-[var(--text-base)] w-full sm:w-64"
            />
          </div>

          <div className="space-y-3">
            {questionBank
              .filter((q) => !bankSearch || q.title.toLowerCase().includes(bankSearch.toLowerCase()))
              .map((q) => (
                <div
                  key={q.id}
                  className="p-4 rounded-xl bg-[var(--bg-app)] border border-[var(--border)] flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                          q.difficulty === 'Easy'
                            ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                            : q.difficulty === 'Medium'
                            ? 'bg-amber-950 text-amber-400 border border-amber-800'
                            : 'bg-rose-950 text-rose-400 border border-rose-800'
                        }`}
                      >
                        {q.difficulty}
                      </span>
                      <span className="text-[10px] text-[var(--text-dim)] uppercase font-mono">{q.type}</span>
                      <h4 className="font-bold text-sm text-[var(--text-base)]">{q.title}</h4>
                    </div>

                    <p className="text-xs text-[var(--text-muted)] line-clamp-1">{q.description}</p>

                    <div className="flex items-center gap-1.5 pt-1">
                      {q.tags.map((t) => (
                        <span key={t} className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--bg-card)] text-[var(--text-dim)]">
                          #{t}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-xs font-mono text-cyan-400 font-bold">{q.points} pts</span>
                    <button
                      onClick={() => alert(`Imported "${q.title}" to active round.`)}
                      className="px-3 py-1.5 rounded-lg bg-[var(--accent)] hover:bg-[var(--accent-2)] text-white text-xs font-semibold transition cursor-pointer"
                    >
                      Import to Event
                    </button>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Tab 5: Analytics */}
      {activeTab === 'analytics' && activeEvent && (
        <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-base)]">
                Performance Analytics: {activeEvent.title}
              </h3>
              <p className="text-xs text-[var(--text-muted)]">
                Candidate submission success rates, language preferences, and drop-off analysis.
              </p>
            </div>

            <button
              onClick={handleExportCSV}
              className="px-4 py-2 bg-[var(--accent)] hover:bg-[var(--accent-2)] text-white text-xs font-bold rounded-lg transition cursor-pointer"
            >
              Export Full Report (.csv)
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-[var(--bg-app)] border border-[var(--border)] space-y-2">
              <span className="text-xs font-bold text-[var(--text-base)] block">Language Distribution</span>
              <div className="space-y-1.5 text-xs font-mono">
                <div className="flex justify-between">
                  <span>Python 3.11</span>
                  <span className="text-cyan-400 font-bold">54%</span>
                </div>
                <div className="flex justify-between">
                  <span>C++20</span>
                  <span className="text-emerald-400 font-bold">32%</span>
                </div>
                <div className="flex justify-between">
                  <span>JavaScript</span>
                  <span className="text-amber-400 font-bold">14%</span>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-[var(--bg-app)] border border-[var(--border)] space-y-2">
              <span className="text-xs font-bold text-[var(--text-base)] block">Cutoff Passing Rate</span>
              <div className="text-3xl font-extrabold text-emerald-400 font-mono pt-2">72.6%</div>
              <p className="text-[11px] text-[var(--text-muted)]">Achieved greater than round passing score</p>
            </div>

            <div className="p-4 rounded-xl bg-[var(--bg-app)] border border-[var(--border)] space-y-2">
              <span className="text-xs font-bold text-[var(--text-base)] block">Sandboxed Submissions</span>
              <div className="text-3xl font-extrabold text-cyan-400 font-mono pt-2">1,420</div>
              <p className="text-[11px] text-[var(--text-muted)]">Evaluated with 0 sandbox breakout anomalies</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

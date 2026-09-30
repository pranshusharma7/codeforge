import React, { useState, useMemo } from 'react';
import { CodeForgeEvent, EventStatus, EventType, OrganizerType } from '../../lib/eventTypes';
import { eventStore } from '../../lib/eventStore';
import { EventCard } from './EventCard';
import { EventDetailsView } from './EventDetailsView';
import { EventCreationWizard } from './EventCreationWizard';
import { OrganizerDashboard } from './OrganizerDashboard';
import { ParticipantDashboard } from './ParticipantDashboard';
import { ContestLeaderboard } from '../contest/ContestLeaderboard';
import {
  TrophyIcon,
  ShieldIcon,
  GithubIcon,
} from '../icons';

interface EventsLandingPageProps {
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
  onLaunchArena: (event: CodeForgeEvent) => void;
}

export const EventsLandingPage: React.FC<EventsLandingPageProps> = ({
  logoImg,
  authUser,
  onBackToEditor,
  onOpenAuth,
  onLaunchArena,
}) => {
  // Navigation & view states
  const [activeTab, setActiveTab] = useState<'discover' | 'my_events' | 'organizer_hub' | 'leaderboard'>('discover');
  const [selectedEventForDetails, setSelectedEventForDetails] = useState<CodeForgeEvent | null>(null);
  const [isCreatingEvent, setIsCreatingEvent] = useState(false);

  // Filters & search
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'LIVE' | 'UPCOMING' | 'COMPLETED'>('all');
  const [selectedOrganizerType, setSelectedOrganizerType] = useState<string>('all');
  const [selectedEventType, setSelectedEventType] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'starting_soon' | 'most_popular' | 'newest'>('starting_soon');

  // Load events
  const [events, setEvents] = useState<CodeForgeEvent[]>(() => eventStore.getEvents());

  const refreshEvents = () => {
    setEvents(eventStore.getEvents());
  };

  // Filtered & sorted events
  const filteredEvents = useMemo(() => {
    return events.filter((ev) => {
      // Status filter
      if (statusFilter !== 'all') {
        if (statusFilter === 'LIVE' && ev.status !== 'LIVE') return false;
        if (statusFilter === 'UPCOMING' && (ev.status !== 'UPCOMING' && ev.status !== 'REGISTRATION_OPEN')) return false;
        if (statusFilter === 'COMPLETED' && ev.status !== 'COMPLETED') return false;
      }

      // Organizer filter
      if (selectedOrganizerType !== 'all' && ev.organizer.type !== selectedOrganizerType) {
        return false;
      }

      // Event Type filter
      if (selectedEventType !== 'all' && ev.eventType !== selectedEventType) {
        return false;
      }

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = ev.title.toLowerCase().includes(q);
        const matchesDesc = ev.description.toLowerCase().includes(q);
        const matchesOrg = ev.organizer.name.toLowerCase().includes(q);
        const matchesTags = ev.tags.some((t) => t.toLowerCase().includes(q));
        return matchesTitle || matchesDesc || matchesOrg || matchesTags;
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === 'most_popular') {
        return (b.currentParticipantsCount || 0) - (a.currentParticipantsCount || 0);
      }
      if (sortBy === 'newest') {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      // starting_soon
      const timeA = new Date(`${a.startDate}T${a.startTime}:00`).getTime();
      const timeB = new Date(`${b.startDate}T${b.startTime}:00`).getTime();
      return timeA - timeB;
    });
  }, [events, statusFilter, selectedOrganizerType, selectedEventType, searchQuery, sortBy]);

  // Registration handler
  const handleRegisterEvent = (event: CodeForgeEvent) => {
    if (!authUser) {
      onOpenAuth();
      return;
    }

    eventStore.registerUser(event.id, {
      id: String(authUser.id || authUser.login || 'gh_user'),
      name: authUser.name || authUser.login || 'Contestant',
      email: authUser.email,
      github: authUser.login,
    });

    refreshEvents();
    if (selectedEventForDetails && selectedEventForDetails.id === event.id) {
      setSelectedEventForDetails({
        ...selectedEventForDetails,
        isRegistered: true,
        currentParticipantsCount: (selectedEventForDetails.currentParticipantsCount || 0) + 1,
      });
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg-app)] text-[var(--text-base)] flex flex-col font-sans select-none overflow-x-hidden">
      {/* ── Top Navigation Bar adhering to CodeForge Design Tokens ──────────── */}
      <header className="h-12 px-5 bg-[var(--bg-header)] border-b border-[var(--border)] sticky top-0 z-40 flex items-center justify-between">
        {/* Left: Brand Logo & Navigation Links */}
        <div className="flex items-center gap-5">
          <div
            onClick={onBackToEditor}
            className="flex items-center gap-2.5 cursor-pointer group hover:opacity-90 transition shrink-0"
            title="Return to CodeForge IDE Code Editor"
          >
            <img src={logoImg} alt="CodeForge" className="w-5 h-5 object-contain rounded" />
            <span className="font-bold text-sm tracking-tight text-[var(--text-base)] group-hover:text-[var(--accent)] transition">
              CodeForge
            </span>
          </div>

          <div className="h-4 w-px bg-[var(--border)] hidden sm:block" />

          {/* Navigation Tabs */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => {
                setActiveTab('discover');
                setSelectedEventForDetails(null);
                setIsCreatingEvent(false);
              }}
              className={`px-3 py-1 rounded-md text-xs font-semibold transition ${
                activeTab === 'discover' && !selectedEventForDetails && !isCreatingEvent
                  ? 'bg-[var(--accent-subtle)] text-[var(--accent)] border border-[var(--accent-border)]'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-base)] hover:bg-[var(--bg-hover)]'
              }`}
            >
              Browse Events
            </button>

            <button
              onClick={() => {
                setActiveTab('my_events');
                setSelectedEventForDetails(null);
                setIsCreatingEvent(false);
              }}
              className={`px-3 py-1 rounded-md text-xs font-semibold transition ${
                activeTab === 'my_events'
                  ? 'bg-[var(--accent-subtle)] text-[var(--accent)] border border-[var(--accent-border)]'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-base)] hover:bg-[var(--bg-hover)]'
              }`}
            >
              My Registrations
            </button>

            <button
              onClick={() => {
                setActiveTab('organizer_hub');
                setSelectedEventForDetails(null);
                setIsCreatingEvent(false);
              }}
              className={`px-3 py-1 rounded-md text-xs font-semibold transition flex items-center gap-1.5 ${
                activeTab === 'organizer_hub'
                  ? 'bg-[var(--accent-subtle)] text-[var(--accent)] border border-[var(--accent-border)]'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-base)] hover:bg-[var(--bg-hover)]'
              }`}
            >
              <span>⚙️</span>
              <span>Organizer Hub</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('leaderboard');
                setSelectedEventForDetails(null);
                setIsCreatingEvent(false);
              }}
              className={`px-3 py-1 rounded-md text-xs font-semibold transition ${
                activeTab === 'leaderboard'
                  ? 'bg-[var(--accent-subtle)] text-[var(--accent)] border border-[var(--accent-border)]'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-base)] hover:bg-[var(--bg-hover)]'
              }`}
            >
              Leaderboard
            </button>
          </div>
        </div>

        {/* Right: Actions, Create Event & Profile */}
        <div className="flex items-center gap-3">
          {/* Create Event CTA */}
          <button
            onClick={() => {
              setIsCreatingEvent(true);
              setSelectedEventForDetails(null);
            }}
            className="px-3 py-1 rounded-lg bg-[var(--accent)] hover:bg-[var(--accent-2)] text-white font-semibold text-xs transition flex items-center gap-1.5 shadow-sm shadow-blue-500/20 cursor-pointer"
          >
            <span>+</span>
            <span>Host an Event</span>
          </button>

          {/* GitHub Auth Pill */}
          {authUser ? (
            <div className="flex items-center gap-2 bg-[var(--bg-app)] border border-[var(--border)] rounded-lg px-2.5 py-1">
              {authUser.avatar_url ? (
                <img
                  src={authUser.avatar_url}
                  alt={authUser.login}
                  className="w-4 h-4 rounded-full object-cover border border-[var(--border)]"
                />
              ) : (
                <GithubIcon size={12} className="text-[var(--text-muted)]" />
              )}
              <span className="text-xs font-semibold text-[var(--text-base)]">
                {authUser.name || authUser.login}
              </span>
            </div>
          ) : (
            <button
              onClick={onOpenAuth}
              className="px-2.5 py-1 rounded-lg bg-[var(--bg-app)] hover:bg-[var(--bg-hover)] border border-[var(--border)] text-xs font-medium text-[var(--text-base)] flex items-center gap-1.5 transition"
            >
              <GithubIcon size={12} />
              <span>Login</span>
            </button>
          )}

          {/* Back to IDE Editor Button */}
          <button
            onClick={onBackToEditor}
            className="px-3 py-1 rounded-lg bg-[var(--bg-card)] hover:bg-[var(--bg-hover)] border border-[var(--border)] text-xs font-medium text-[var(--text-base)] flex items-center gap-1.5 transition cursor-pointer"
          >
            <span>←</span>
            <span>Editor</span>
          </button>
        </div>
      </header>

      {/* ── Sub-view conditional routing ──────────────────────────────────────── */}
      <main className="flex-1 w-full px-5 py-6">
        {/* View 1: Event Details Page */}
        {selectedEventForDetails ? (
          <EventDetailsView
            event={selectedEventForDetails}
            isRegistered={selectedEventForDetails.isRegistered}
            onBack={() => setSelectedEventForDetails(null)}
            onRegister={handleRegisterEvent}
            onEnterArena={onLaunchArena}
          />
        ) : isCreatingEvent ? (
          /* View 2: Multi-step Event Creation Wizard */
          <EventCreationWizard
            onEventCreated={(newEvent) => {
              setIsCreatingEvent(false);
              refreshEvents();
              setSelectedEventForDetails(newEvent);
            }}
            onCancel={() => setIsCreatingEvent(false)}
          />
        ) : activeTab === 'organizer_hub' ? (
          /* View 3: Organizer Dashboard & Live Control Deck */
          <OrganizerDashboard
            onOpenCreateWizard={() => setIsCreatingEvent(true)}
            onSelectEventToView={(ev) => setSelectedEventForDetails(ev)}
          />
        ) : activeTab === 'my_events' ? (
          /* View 4: Participant Dashboard & My Registrations */
          <ParticipantDashboard
            userId={authUser ? String(authUser.id || authUser.login) : 'usr_current'}
            onViewEventDetails={(ev) => setSelectedEventForDetails(ev)}
            onEnterArena={onLaunchArena}
          />
        ) : activeTab === 'leaderboard' ? (
          /* View 5: Global Rankings */
          <div className="max-w-6xl mx-auto space-y-4">
            <div>
              <h2 className="text-xl font-bold text-[var(--text-base)]">Global CodeForge Standings</h2>
              <p className="text-xs text-[var(--text-muted)]">
                Authoritative rankings calculated from multi-round performance, speed, and testcase coverage.
              </p>
            </div>
            <ContestLeaderboard contestId="ev-codeforge-weekly-01" contestTitle="CodeForge Grand Showdown #01" />
          </div>
        ) : (
          /* View 6: Main Event Discovery Catalog */
          <div className="max-w-6xl mx-auto space-y-6">
            {/* Hero Banner Header */}
            <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-6 sm:p-8 space-y-3 relative overflow-hidden">
              <div className="max-w-2xl space-y-2 relative z-10">
                <span className="text-[10px] font-mono uppercase font-bold tracking-wider text-[var(--accent)] bg-[var(--accent-subtle)] px-2.5 py-0.5 rounded border border-[var(--accent-border)]">
                  CodeForge Developer Events
                </span>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-[var(--text-base)] tracking-tight">
                  Compete. Build. Prove your skills.
                </h1>
                <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                  Discover coding competitions, assessments, hackathons and developer events hosted by companies,
                  colleges and communities.
                </p>
              </div>

              {/* Quick Filter Status Tabs */}
              <div className="pt-2 flex items-center gap-1.5 flex-wrap">
                {[
                  { id: 'all', label: 'All Events' },
                  { id: 'LIVE', label: 'Live Now' },
                  { id: 'UPCOMING', label: 'Upcoming' },
                  { id: 'COMPLETED', label: 'Completed' },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setStatusFilter(tab.id as any)}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                      statusFilter === tab.id
                        ? 'bg-[var(--accent)] text-white'
                        : 'bg-[var(--bg-app)] text-[var(--text-muted)] hover:text-[var(--text-base)] border border-[var(--border)]'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Search, Filter & Sort Controls Bar */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-[var(--bg-card)] p-3 rounded-xl border border-[var(--border)] text-xs">
              {/* Search Bar */}
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search events by name, organizer, or topic (e.g. DSA, Python, Hackathon)..."
                className="bg-[var(--bg-app)] border border-[var(--border)] rounded-lg px-3 py-1.5 text-xs text-[var(--text-base)] focus:outline-none focus:border-[var(--accent)] flex-1 min-w-[240px]"
              />

              {/* Filters dropdowns */}
              <div className="flex items-center gap-2 flex-wrap">
                {/* Organizer Type */}
                <select
                  value={selectedOrganizerType}
                  onChange={(e) => setSelectedOrganizerType(e.target.value)}
                  className="bg-[var(--bg-app)] border border-[var(--border)] rounded-lg px-2.5 py-1.5 text-xs text-[var(--text-base)]"
                >
                  <option value="all">All Organizers</option>
                  <option value="Company">Companies</option>
                  <option value="College">Colleges / Universities</option>
                  <option value="Coding Club">Coding Clubs</option>
                  <option value="Startup">Startups</option>
                  <option value="Organization">Organizations</option>
                </select>

                {/* Event Type */}
                <select
                  value={selectedEventType}
                  onChange={(e) => setSelectedEventType(e.target.value)}
                  className="bg-[var(--bg-app)] border border-[var(--border)] rounded-lg px-2.5 py-1.5 text-xs text-[var(--text-base)]"
                >
                  <option value="all">All Event Types</option>
                  <option value="Coding Contest">Coding Contest</option>
                  <option value="Hiring Challenge">Hiring Challenge</option>
                  <option value="College Contest">College Contest</option>
                  <option value="Hackathon">Hackathon</option>
                  <option value="DSA Contest">DSA Contest</option>
                </select>

                {/* Sort By */}
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="bg-[var(--bg-app)] border border-[var(--border)] rounded-lg px-2.5 py-1.5 text-xs text-[var(--text-base)]"
                >
                  <option value="starting_soon">Starting Soon</option>
                  <option value="most_popular">Most Enrolled</option>
                  <option value="newest">Recently Added</option>
                </select>
              </div>
            </div>

            {/* Event Cards Grid */}
            {filteredEvents.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {filteredEvents.map((event) => (
                  <EventCard
                    key={event.id}
                    event={event}
                    isRegistered={event.isRegistered}
                    onViewDetails={(ev) => setSelectedEventForDetails(ev)}
                    onRegister={handleRegisterEvent}
                    onEnterArena={onLaunchArena}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-16 bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-8 space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-[var(--bg-app)] border border-[var(--border)] flex items-center justify-center text-xl mx-auto">
                  🔍
                </div>
                <h3 className="text-sm font-bold text-[var(--text-base)]">No matching events found</h3>
                <p className="text-xs text-[var(--text-muted)] max-w-sm mx-auto">
                  Try adjusting your search query, status filters, or create a brand new event.
                </p>
                <button
                  onClick={() => setIsCreatingEvent(true)}
                  className="px-4 py-2 rounded-xl bg-[var(--accent)] hover:bg-[var(--accent-2)] text-white text-xs font-semibold transition"
                >
                  Host a New Event
                </button>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Footer adhering to CodeForge IDE aesthetics */}
      <footer className="h-10 px-5 bg-[var(--bg-header)] border-t border-[var(--border)] text-[11px] text-[var(--text-dim)] flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <img src={logoImg} alt="CodeForge" className="w-3.5 h-3.5 object-contain opacity-70" />
          <span>CodeForge Events & Assessment Platform · Enterprise Anti-Cheat Engine</span>
        </div>
        <div className="flex items-center gap-3">
          <span>Isolated Sandboxes</span>
          <span>·</span>
          <span>Server-Authoritative Clock</span>
          <span>·</span>
          <span>Role-Based Access</span>
        </div>
      </footer>
    </div>
  );
};

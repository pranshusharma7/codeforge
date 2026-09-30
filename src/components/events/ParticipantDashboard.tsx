import React, { useState, useEffect } from 'react';
import { CodeForgeEvent, EventRegistration } from '../../lib/eventTypes';
import { eventStore } from '../../lib/eventStore';
import { EventCard } from './EventCard';
import { CheckIcon, TrophyIcon, ClockIcon } from '../icons';

interface ParticipantDashboardProps {
  userId: string;
  onViewEventDetails: (event: CodeForgeEvent) => void;
  onEnterArena: (event: CodeForgeEvent) => void;
}

export const ParticipantDashboard: React.FC<ParticipantDashboardProps> = ({
  userId,
  onViewEventDetails,
  onEnterArena,
}) => {
  const [activeFilter, setActiveFilter] = useState<'all' | 'live' | 'upcoming' | 'completed'>('all');
  const [registrations, setRegistrations] = useState<EventRegistration[]>([]);
  const [allEvents, setAllEvents] = useState<CodeForgeEvent[]>([]);

  useEffect(() => {
    const regs = eventStore.getUserRegistrations(userId);
    setRegistrations(regs);
    setAllEvents(eventStore.getEvents());
  }, [userId]);

  const registeredEvents = allEvents.filter((ev) =>
    registrations.some((r) => r.eventId === ev.id) || ev.isRegistered
  );

  const filteredEvents = registeredEvents.filter((ev) => {
    if (activeFilter === 'live') return ev.status === 'LIVE';
    if (activeFilter === 'upcoming') return ev.status === 'UPCOMING' || ev.status === 'REGISTRATION_OPEN';
    if (activeFilter === 'completed') return ev.status === 'COMPLETED';
    return true;
  });

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20 animate-in fade-in duration-150">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--border)] pb-4">
        <div>
          <h2 className="text-xl font-bold text-[var(--text-base)]">My Registered Events & Scorecards</h2>
          <p className="text-xs text-[var(--text-muted)]">
            Track your registered coding competitions, assessments, live countdowns, and verified certificates.
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1 bg-[var(--bg-card)] border border-[var(--border)] p-1 rounded-xl">
          {(['all', 'live', 'upcoming', 'completed'] as const).map((filter) => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold capitalize transition ${
                activeFilter === filter
                  ? 'bg-[var(--accent)] text-white'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-base)]'
              }`}
            >
              {filter}
            </button>
          ))}
        </div>
      </div>

      {filteredEvents.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredEvents.map((event) => (
            <EventCard
              key={event.id}
              event={event}
              isRegistered={true}
              onViewDetails={onViewEventDetails}
              onRegister={() => {}}
              onEnterArena={onEnterArena}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-8 space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-[var(--bg-app)] border border-[var(--border)] flex items-center justify-center text-xl mx-auto">
            🎫
          </div>
          <h3 className="text-sm font-bold text-[var(--text-base)]">No events found in this category</h3>
          <p className="text-xs text-[var(--text-muted)] max-w-sm mx-auto">
            Browse the discovery catalog to enroll in upcoming hackathons, college contests, and hiring rounds.
          </p>
        </div>
      )}
    </div>
  );
};

import React, { useState } from 'react';
import {
  CodeForgeEvent,
  EventRound,
  EventQuestion,
  OrganizerType,
  EventType,
  EventCategory,
  EventVisibility,
  EligibilityType,
  QuestionType,
  ProblemDifficulty,
} from '../../lib/eventTypes';
import { eventStore } from '../../lib/eventStore';
import {
  CheckIcon,
  ShieldIcon,
  TrophyIcon,
  CameraIcon,
  ScreenIcon,
  MicIcon,
  LockIcon,
  AlertTriangleIcon,
} from '../icons';

interface EventCreationWizardProps {
  onEventCreated: (event: CodeForgeEvent) => void;
  onCancel: () => void;
}

export const EventCreationWizard: React.FC<EventCreationWizardProps> = ({
  onEventCreated,
  onCancel,
}) => {
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 6;

  // Step 1: Basic Info
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [logo, setLogo] = useState('https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100&h=100&fit=crop');
  const [banner, setBanner] = useState('');
  const [organizerName, setOrganizerName] = useState('My Developer Organization');
  const [organizerType, setOrganizerType] = useState<OrganizerType>('Company');
  const [category, setCategory] = useState<EventCategory>('competitive');
  const [eventType, setEventType] = useState<EventType>('Coding Contest');
  const [tagInput, setTagInput] = useState('DSA, Competitive Programming, Algorithms');

  // Step 2: Settings & Schedule
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [startTime, setStartTime] = useState('18:00');
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [endTime, setEndTime] = useState('20:00');
  const [durationMinutes, setDurationMinutes] = useState(120);
  const [maxParticipants, setMaxParticipants] = useState<number>(1000);
  const [visibility, setVisibility] = useState<EventVisibility>('public');
  const [eligibilityType, setEligibilityType] = useState<EligibilityType>('everyone');
  const [eligibilityDesc, setEligibilityDesc] = useState('Open to all developers and students worldwide.');
  const [reqName, setReqName] = useState(true);
  const [reqEmail, setReqEmail] = useState(true);
  const [reqCollege, setReqCollege] = useState(false);
  const [reqPhone, setReqPhone] = useState(false);
  const [reqGitHub, setReqGitHub] = useState(true);
  const [reqLinkedIn, setReqLinkedIn] = useState(false);

  // Step 3: Rounds
  const [rounds, setRounds] = useState<EventRound[]>([
    {
      id: 'rnd_1',
      name: 'Round 1 - Algorithmic Assessment',
      description: 'Solve programming challenges in isolated test execution sandboxes.',
      type: 'coding',
      order: 1,
      durationMinutes: 120,
      maxScore: 300,
      passingScore: 150,
      negativeMarking: false,
      languagesAllowed: ['python', 'cpp', 'javascript', 'java'],
      questions: [],
      isUnlocked: true,
    },
  ]);

  // Step 4: Questions
  const [activeRoundIdx, setActiveRoundIdx] = useState(0);
  const [newQTitle, setNewQTitle] = useState('');
  const [newQType, setNewQType] = useState<QuestionType>('coding');
  const [newQDifficulty, setNewQDifficulty] = useState<ProblemDifficulty>('Easy');
  const [newQPoints, setNewQPoints] = useState(100);
  const [newQDesc, setNewQDesc] = useState('');
  const [newQInputFormat, setNewQInputFormat] = useState('First line: N. Second line: N space-separated integers.');
  const [newQOutputFormat, setNewQOutputFormat] = useState('Print the computed integer result.');
  const [newQConstraints, setNewQConstraints] = useState('1 <= N <= 10^5');
  const [sampleInput, setSampleInput] = useState('5\n1 2 3 4 5');
  const [sampleOutput, setSampleOutput] = useState('15');
  const [hiddenInput, setHiddenInput] = useState('3\n10 20 30');
  const [hiddenOutput, setHiddenOutput] = useState('60');

  // Step 5: Scoring & Proctoring
  const [partialScoring, setPartialScoring] = useState(true);
  const [negativeMarking, setNegativeMarking] = useState(false);
  const [timePenalty, setTimePenalty] = useState(true);
  const [requireCamera, setRequireCamera] = useState(true);
  const [requireMic, setRequireMic] = useState(false);
  const [requireScreenShare, setRequireScreenShare] = useState(true);
  const [requireFullscreen, setRequireFullscreen] = useState(true);
  const [blockClipboard, setBlockClipboard] = useState(true);
  const [enableCertificates, setEnableCertificates] = useState(true);

  // Add round handler
  const handleAddRound = () => {
    const nextNum = rounds.length + 1;
    const newRound: EventRound = {
      id: `rnd_${Date.now().toString(36)}`,
      name: `Round ${nextNum} - Coding Challenge`,
      description: `Evaluation round ${nextNum}`,
      type: 'coding',
      order: nextNum,
      durationMinutes: 90,
      maxScore: 200,
      negativeMarking: false,
      languagesAllowed: ['python', 'cpp', 'javascript'],
      questions: [],
      isUnlocked: false,
    };
    setRounds([...rounds, newRound]);
  };

  // Add question to active round
  const handleAddQuestion = () => {
    if (!newQTitle.trim()) return;

    const qId = 'q_' + Math.random().toString(36).substring(2, 8);
    const newQuestion: EventQuestion = {
      id: qId,
      title: newQTitle.trim(),
      slug: newQTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      type: newQType,
      difficulty: newQDifficulty,
      points: Number(newQPoints) || 100,
      timeLimitMs: 2000,
      memoryLimitMb: 256,
      description: newQDesc || 'Implement an optimal solution satisfying all runtime constraints.',
      inputFormat: newQInputFormat,
      outputFormat: newQOutputFormat,
      constraints: newQConstraints,
      tags: ['DSA', 'Algorithms'],
      starterCode: {
        python: `import sys\n\ndef solve():\n    # Write your solution here\n    pass\n\nif __name__ == '__main__':\n    solve()\n`,
        cpp: `#include <iostream>\nusing namespace std;\n\nint main() {\n    // Write your solution here\n    return 0;\n}\n`,
        javascript: `const fs = require('fs');\n\nfunction solve() {\n    // Write your solution here\n}\nsolve();\n`
      },
      testCases: [
        {
          id: `tc_${Date.now()}_1`,
          input: sampleInput,
          expectedOutput: sampleOutput,
          explanation: 'Public Sample Case',
          isHidden: false,
        },
        {
          id: `tc_${Date.now()}_2`,
          input: hiddenInput,
          expectedOutput: hiddenOutput,
          explanation: 'Server-Side Hidden Test Case',
          isHidden: true,
        },
      ],
    };

    const updatedRounds = [...rounds];
    updatedRounds[activeRoundIdx].questions.push(newQuestion);
    setRounds(updatedRounds);

    // Reset inputs
    setNewQTitle('');
    setNewQDesc('');
  };

  // Final publish event
  const handlePublish = () => {
    const tags = tagInput.split(',').map((t) => t.trim()).filter(Boolean);

    // Ensure rounds have at least sample questions if empty
    const finalizedRounds = rounds.map((r) => {
      if (r.questions.length === 0) {
        return {
          ...r,
          questions: [eventStore.getQuestionBank()[0]],
        };
      }
      return r;
    });

    const newEvent = eventStore.createEvent({
      slug: title.toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'codeforge-event',
      title: title.trim() || 'Untitled CodeForge Event',
      description: description || 'Professional competitive programming and evaluation contest.',
      aboutMarkdown: `# ${title}\n\n${description}\n\n### Rules\n* Individual participation.\n* Solved via CodeForge sandboxed runner.`,
      logo: logo || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100&h=100&fit=crop',
      banner,
      organizer: {
        id: 'org_' + Date.now().toString(36),
        name: organizerName,
        type: organizerType,
        verification: 'verified_organizer',
        email: 'organizer@codeforge.dev',
        eventsHostedCount: 1,
        joinedYear: 2026,
      },
      eventType,
      category,
      tags: tags.length ? tags : ['Algorithms', 'DSA'],
      status: 'REGISTRATION_OPEN',
      visibility,
      eligibility: {
        type: eligibilityType,
        description: eligibilityDesc,
      },
      registrationRequirements: {
        requireName: reqName,
        requireEmail: reqEmail,
        requireCollege: reqCollege,
        requirePhone: reqPhone,
        requireGitHub: reqGitHub,
        requireLinkedIn: reqLinkedIn,
      },
      startDate,
      startTime,
      endDate,
      endTime,
      durationMinutes: Number(durationMinutes) || 120,
      registrationDeadline: `${endDate}T${endTime}:00`,
      maxParticipants: Number(maxParticipants) || 1000,
      rounds: finalizedRounds,
      rules: [
        'All submissions are evaluated in isolated sandboxes with strict CPU & memory limits.',
        'Copying code from external unauthorized resources or pasting large snippets triggers security telemetry.',
        'Webcam & screen sharing stream must remain un-interrupted during the proctored attempt.'
      ],
      scoringPolicy: {
        partialScoring,
        negativeMarking,
        timePenalty,
        tieBreaker: 'fastest_submission',
      },
      proctoring: {
        requireCamera,
        requireMicrophone: requireMic,
        requireScreenShare,
        requireFullscreen,
        blockClipboard,
        maxViolationsBeforeLock: 3,
        lockoutDurationSeconds: 15,
        autoTerminateOnExcessiveViolations: false,
      },
      certificateConfig: enableCertificates
        ? {
            enabled: true,
            title: 'Certificate of Excellence',
            criteria: 'top_10',
            signatoryName: organizerName,
            signatoryRole: 'Event Host / Lead Organizer',
          }
        : undefined,
    });

    onEventCreated(newEvent);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20 animate-in fade-in duration-150">
      {/* Top Header */}
      <div className="flex items-center justify-between border-b border-[var(--border)] pb-4">
        <div>
          <h2 className="text-xl font-bold text-[var(--text-base)]">Create Event / Assessment</h2>
          <p className="text-xs text-[var(--text-muted)]">
            Configure multi-round coding competitions, college placement tests, and developer challenges.
          </p>
        </div>
        <button
          onClick={onCancel}
          className="text-xs text-[var(--text-muted)] hover:text-[var(--text-base)] px-3 py-1.5 rounded-lg border border-[var(--border)] hover:bg-[var(--bg-hover)] transition cursor-pointer"
        >
          Cancel
        </button>
      </div>

      {/* Progress Steps Header */}
      <div className="flex items-center justify-between text-xs bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-3">
        {[
          { num: 1, label: 'Basic Info' },
          { num: 2, label: 'Settings' },
          { num: 3, label: 'Round Builder' },
          { num: 4, label: 'Questions & Tests' },
          { num: 5, label: 'Proctor & Scoring' },
          { num: 6, label: 'Publish' },
        ].map((s) => (
          <button
            key={s.num}
            onClick={() => setCurrentStep(s.num)}
            className={`flex items-center gap-2 font-medium px-2 py-1 rounded transition ${
              currentStep === s.num
                ? 'text-[var(--accent)] font-bold'
                : currentStep > s.num
                ? 'text-emerald-400'
                : 'text-[var(--text-dim)]'
            }`}
          >
            <span
              className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                currentStep === s.num
                  ? 'bg-[var(--accent)] text-white'
                  : currentStep > s.num
                  ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                  : 'bg-[var(--bg-app)] text-[var(--text-dim)] border border-[var(--border)]'
              }`}
            >
              {currentStep > s.num ? '✓' : s.num}
            </span>
            <span className="hidden sm:inline">{s.label}</span>
          </button>
        ))}
      </div>

      {/* Wizard Step Body */}
      <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-6 sm:p-8 space-y-6 text-xs text-[var(--text-base)]">
        {/* Step 1: Basic Info */}
        {currentStep === 1 && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-[var(--text-base)] uppercase tracking-wider">
              Step 1: Event Identity & Organization
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-medium text-[var(--text-muted)] mb-1">
                  Event Name *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. CodeForge Grand Hackathon 2026"
                  className="w-full bg-[var(--bg-app)] border border-[var(--border)] rounded-lg p-2.5 text-xs text-[var(--text-base)] focus:outline-none focus:border-[var(--accent)]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-[var(--text-muted)] mb-1">
                  Organizer Name *
                </label>
                <input
                  type="text"
                  value={organizerName}
                  onChange={(e) => setOrganizerName(e.target.value)}
                  placeholder="e.g. Stanford CS Society or Google Cloud"
                  className="w-full bg-[var(--bg-app)] border border-[var(--border)] rounded-lg p-2.5 text-xs text-[var(--text-base)] focus:outline-none focus:border-[var(--accent)]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-[11px] font-medium text-[var(--text-muted)] mb-1">
                  Organizer Type
                </label>
                <select
                  value={organizerType}
                  onChange={(e) => setOrganizerType(e.target.value as any)}
                  className="w-full bg-[var(--bg-app)] border border-[var(--border)] rounded-lg p-2.5 text-xs text-[var(--text-base)] focus:outline-none focus:border-[var(--accent)]"
                >
                  <option value="Company">Company</option>
                  <option value="College">College / University</option>
                  <option value="Coding Club">Coding Club</option>
                  <option value="Startup">Startup</option>
                  <option value="Community">Developer Community</option>
                  <option value="Individual">Individual Host</option>
                  <option value="Organization">Non-profit / Organization</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-[var(--text-muted)] mb-1">
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as any)}
                  className="w-full bg-[var(--bg-app)] border border-[var(--border)] rounded-lg p-2.5 text-xs text-[var(--text-base)] focus:outline-none focus:border-[var(--accent)]"
                >
                  <option value="competitive">Competitive Programming</option>
                  <option value="assessment">Technical Hiring Assessment</option>
                  <option value="hackathon">Hackathon & Sprint</option>
                  <option value="learning">Practice & Learning</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-[var(--text-muted)] mb-1">
                  Event Type
                </label>
                <select
                  value={eventType}
                  onChange={(e) => setEventType(e.target.value as any)}
                  className="w-full bg-[var(--bg-app)] border border-[var(--border)] rounded-lg p-2.5 text-xs text-[var(--text-base)] focus:outline-none focus:border-[var(--accent)]"
                >
                  <option value="Coding Contest">Coding Contest</option>
                  <option value="Hiring Challenge">Hiring Challenge</option>
                  <option value="College Contest">College Contest</option>
                  <option value="Hackathon">Hackathon</option>
                  <option value="Debugging Challenge">Debugging Challenge</option>
                  <option value="DSA Contest">DSA Contest</option>
                  <option value="Frontend Challenge">Frontend Challenge</option>
                  <option value="Backend Challenge">Backend Challenge</option>
                  <option value="Programming Assessment">Programming Assessment</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-[var(--text-muted)] mb-1">
                Event Description / Overview
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                placeholder="Describe the challenge format, target audience, and expectations..."
                className="w-full bg-[var(--bg-app)] border border-[var(--border)] rounded-lg p-2.5 text-xs text-[var(--text-base)] focus:outline-none focus:border-[var(--accent)] resize-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-medium text-[var(--text-muted)] mb-1">
                  Logo URL (Optional)
                </label>
                <input
                  type="text"
                  value={logo}
                  onChange={(e) => setLogo(e.target.value)}
                  className="w-full bg-[var(--bg-app)] border border-[var(--border)] rounded-lg p-2.5 text-xs text-[var(--text-base)] focus:outline-none focus:border-[var(--accent)]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-[var(--text-muted)] mb-1">
                  Tags (Comma-separated)
                </label>
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  placeholder="e.g. DSA, Dynamic Programming, Python, C++"
                  className="w-full bg-[var(--bg-app)] border border-[var(--border)] rounded-lg p-2.5 text-xs text-[var(--text-base)] focus:outline-none focus:border-[var(--accent)]"
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Settings & Schedule */}
        {currentStep === 2 && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-[var(--text-base)] uppercase tracking-wider">
              Step 2: Schedule & Eligibility Configuration
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-[11px] font-medium text-[var(--text-muted)] mb-1">Start Date</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full bg-[var(--bg-app)] border border-[var(--border)] rounded-lg p-2 text-xs text-[var(--text-base)]"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-[var(--text-muted)] mb-1">Start Time</label>
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full bg-[var(--bg-app)] border border-[var(--border)] rounded-lg p-2 text-xs text-[var(--text-base)]"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-[var(--text-muted)] mb-1">Duration (Mins)</label>
                <input
                  type="number"
                  value={durationMinutes}
                  onChange={(e) => setDurationMinutes(Number(e.target.value))}
                  className="w-full bg-[var(--bg-app)] border border-[var(--border)] rounded-lg p-2 text-xs text-[var(--text-base)]"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-[var(--text-muted)] mb-1">Max Participants</label>
                <input
                  type="number"
                  value={maxParticipants}
                  onChange={(e) => setMaxParticipants(Number(e.target.value))}
                  className="w-full bg-[var(--bg-app)] border border-[var(--border)] rounded-lg p-2 text-xs text-[var(--text-base)]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block text-[11px] font-medium text-[var(--text-muted)] mb-1">Visibility</label>
                <select
                  value={visibility}
                  onChange={(e) => setVisibility(e.target.value as any)}
                  className="w-full bg-[var(--bg-app)] border border-[var(--border)] rounded-lg p-2.5 text-xs text-[var(--text-base)]"
                >
                  <option value="public">Public (Listed in CodeForge Event Directory)</option>
                  <option value="private">Private (Link Access Only)</option>
                  <option value="invite_only">Invite Only (Pre-approved Candidates)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-[var(--text-muted)] mb-1">Eligibility</label>
                <select
                  value={eligibilityType}
                  onChange={(e) => setEligibilityType(e.target.value as any)}
                  className="w-full bg-[var(--bg-app)] border border-[var(--border)] rounded-lg p-2.5 text-xs text-[var(--text-base)]"
                >
                  <option value="everyone">Open to Everyone</option>
                  <option value="college_students">College Students Only</option>
                  <option value="specific_college">Specific College / Campus</option>
                  <option value="custom">Custom Eligibility Criteria</option>
                </select>
              </div>
            </div>

            <div className="pt-2">
              <label className="block text-[11px] font-medium text-[var(--text-muted)] mb-2">
                Candidate Information Required Upon Registration
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {[
                  { label: 'Full Name', val: reqName, setVal: setReqName },
                  { label: 'Email Address', val: reqEmail, setVal: setReqEmail },
                  { label: 'College / Institute', val: reqCollege, setVal: setReqCollege },
                  { label: 'Phone Number', val: reqPhone, setVal: setReqPhone },
                  { label: 'GitHub Profile', val: reqGitHub, setVal: setReqGitHub },
                  { label: 'LinkedIn Profile', val: reqLinkedIn, setVal: setReqLinkedIn },
                ].map((item, idx) => (
                  <label
                    key={idx}
                    className="flex items-center gap-2 p-2.5 rounded-lg bg-[var(--bg-app)] border border-[var(--border)] cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={item.val}
                      onChange={(e) => item.setVal(e.target.checked)}
                      className="rounded"
                    />
                    <span className="text-xs">{item.label}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Round Builder */}
        {currentStep === 3 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-[var(--text-base)] uppercase tracking-wider">
                  Step 3: Visual Round Builder
                </h3>
                <p className="text-[11px] text-[var(--text-muted)]">
                  Create sequential evaluation rounds (e.g. Round 1: Aptitude MCQ, Round 2: Coding, Round 3: Final).
                </p>
              </div>
              <button
                onClick={handleAddRound}
                className="px-3 py-1.5 rounded-lg bg-[var(--accent)] hover:bg-[var(--accent-2)] text-white text-xs font-semibold transition cursor-pointer"
              >
                + Add Round
              </button>
            </div>

            <div className="space-y-3">
              {rounds.map((round, idx) => (
                <div
                  key={round.id}
                  className="p-4 rounded-xl bg-[var(--bg-app)] border border-[var(--border)] space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-[var(--border-glow)] text-white font-bold flex items-center justify-center text-[10px]">
                        {idx + 1}
                      </span>
                      <input
                        type="text"
                        value={round.name}
                        onChange={(e) => {
                          const updated = [...rounds];
                          updated[idx].name = e.target.value;
                          setRounds(updated);
                        }}
                        className="bg-transparent font-bold text-sm text-[var(--text-base)] border-b border-transparent hover:border-[var(--border)] focus:border-[var(--accent)] focus:outline-none"
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <select
                        value={round.type}
                        onChange={(e) => {
                          const updated = [...rounds];
                          updated[idx].type = e.target.value as any;
                          setRounds(updated);
                        }}
                        className="bg-[var(--bg-card)] border border-[var(--border)] rounded px-2 py-0.5 text-xs text-[var(--text-base)]"
                      >
                        <option value="coding">Coding Round</option>
                        <option value="mcq">MCQ / Aptitude</option>
                        <option value="debugging">Debugging Round</option>
                        <option value="mixed">Mixed Challenge</option>
                      </select>

                      {rounds.length > 1 && (
                        <button
                          onClick={() => setRounds(rounds.filter((_, i) => i !== idx))}
                          className="text-rose-400 hover:text-rose-300 text-xs px-2 py-0.5"
                        >
                          ✕ Delete
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="text-[10px] text-[var(--text-dim)] uppercase block">Round Duration (mins)</label>
                      <input
                        type="number"
                        value={round.durationMinutes}
                        onChange={(e) => {
                          const updated = [...rounds];
                          updated[idx].durationMinutes = Number(e.target.value);
                          setRounds(updated);
                        }}
                        className="w-full bg-[var(--bg-card)] border border-[var(--border)] rounded p-1.5 text-xs text-[var(--text-base)]"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-[var(--text-dim)] uppercase block">Passing Score Cutoff</label>
                      <input
                        type="number"
                        value={round.passingScore || 0}
                        onChange={(e) => {
                          const updated = [...rounds];
                          updated[idx].passingScore = Number(e.target.value);
                          setRounds(updated);
                        }}
                        className="w-full bg-[var(--bg-card)] border border-[var(--border)] rounded p-1.5 text-xs text-[var(--text-base)]"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-[var(--text-dim)] uppercase block">Assigned Questions</label>
                      <span className="font-mono text-cyan-400 font-bold block pt-1.5">
                        {round.questions.length} problems
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Step 4: Questions & Test Cases */}
        {currentStep === 4 && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-[var(--text-base)] uppercase tracking-wider">
              Step 4: Question Builder & Test Case Suite
            </h3>

            {/* Target Round selector */}
            <div className="flex items-center gap-2 p-2 bg-[var(--bg-app)] rounded-lg border border-[var(--border)]">
              <span className="text-[11px] text-[var(--text-muted)] font-medium">Adding question to:</span>
              <select
                value={activeRoundIdx}
                onChange={(e) => setActiveRoundIdx(Number(e.target.value))}
                className="bg-[var(--bg-card)] border border-[var(--border)] text-xs text-[var(--text-base)] rounded px-2 py-1 font-semibold"
              >
                {rounds.map((r, i) => (
                  <option key={r.id} value={i}>
                    {r.name} ({r.questions.length} existing)
                  </option>
                ))}
              </select>
            </div>

            <div className="p-4 rounded-xl bg-[var(--bg-app)] border border-[var(--border)] space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-medium text-[var(--text-muted)] mb-1">Problem Title</label>
                  <input
                    type="text"
                    value={newQTitle}
                    onChange={(e) => setNewQTitle(e.target.value)}
                    placeholder="e.g. Dynamic Energy Matrix Sum"
                    className="w-full bg-[var(--bg-card)] border border-[var(--border)] rounded p-2 text-xs text-[var(--text-base)]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-[var(--text-muted)] mb-1">Difficulty</label>
                  <select
                    value={newQDifficulty}
                    onChange={(e) => setNewQDifficulty(e.target.value as any)}
                    className="w-full bg-[var(--bg-card)] border border-[var(--border)] rounded p-2 text-xs text-[var(--text-base)]"
                  >
                    <option value="Easy">Easy (50-100 pts)</option>
                    <option value="Medium">Medium (100-200 pts)</option>
                    <option value="Hard">Hard (200-300 pts)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-[var(--text-muted)] mb-1">Problem Statement</label>
                <textarea
                  value={newQDesc}
                  onChange={(e) => setNewQDesc(e.target.value)}
                  rows={3}
                  placeholder="Describe the problem, input format, constraints, and requirements..."
                  className="w-full bg-[var(--bg-card)] border border-[var(--border)] rounded p-2 text-xs text-[var(--text-base)] resize-none"
                />
              </div>

              {/* Test Cases */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div className="p-3 rounded-lg bg-[var(--bg-card)] border border-[var(--border)] space-y-2">
                  <span className="font-semibold text-xs text-emerald-400 block">Public Sample Test Case</span>
                  <div>
                    <label className="text-[10px] text-[var(--text-dim)] uppercase block">Sample Input</label>
                    <textarea
                      value={sampleInput}
                      onChange={(e) => setSampleInput(e.target.value)}
                      rows={2}
                      className="w-full bg-[var(--bg-app)] border border-[var(--border)] font-mono text-xs p-1.5 rounded"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-[var(--text-dim)] uppercase block">Expected Output</label>
                    <input
                      type="text"
                      value={sampleOutput}
                      onChange={(e) => setSampleOutput(e.target.value)}
                      className="w-full bg-[var(--bg-app)] border border-[var(--border)] font-mono text-xs p-1.5 rounded"
                    />
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-[var(--bg-card)] border border-[var(--border)] space-y-2">
                  <span className="font-semibold text-xs text-rose-400 block">Server-Side Hidden Test Case</span>
                  <div>
                    <label className="text-[10px] text-[var(--text-dim)] uppercase block">Hidden Input (Never sent to client)</label>
                    <textarea
                      value={hiddenInput}
                      onChange={(e) => setHiddenInput(e.target.value)}
                      rows={2}
                      className="w-full bg-[var(--bg-app)] border border-[var(--border)] font-mono text-xs p-1.5 rounded"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-[var(--text-dim)] uppercase block">Expected Output</label>
                    <input
                      type="text"
                      value={hiddenOutput}
                      onChange={(e) => setHiddenOutput(e.target.value)}
                      className="w-full bg-[var(--bg-app)] border border-[var(--border)] font-mono text-xs p-1.5 rounded"
                    />
                  </div>
                </div>
              </div>

              <button
                onClick={handleAddQuestion}
                className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-semibold transition cursor-pointer"
              >
                + Add Question to {rounds[activeRoundIdx]?.name}
              </button>
            </div>
          </div>
        )}

        {/* Step 5: Proctoring & Scoring */}
        {currentStep === 5 && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-[var(--text-base)] uppercase tracking-wider">
              Step 5: Anti-Cheat Proctoring & Scoring Policy
            </h3>

            <div className="space-y-3">
              <span className="text-xs font-semibold text-[var(--text-base)] block">Proctoring Telemetry Toggles:</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label className="flex items-center gap-3 p-3 rounded-xl bg-[var(--bg-app)] border border-[var(--border)] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={requireCamera}
                    onChange={(e) => setRequireCamera(e.target.checked)}
                    className="rounded"
                  />
                  <div>
                    <span className="font-semibold block text-xs">Webcam Verification</span>
                    <span className="text-[10px] text-[var(--text-muted)]">Live snapshot frame verification during attempt</span>
                  </div>
                </label>

                <label className="flex items-center gap-3 p-3 rounded-xl bg-[var(--bg-app)] border border-[var(--border)] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={requireScreenShare}
                    onChange={(e) => setRequireScreenShare(e.target.checked)}
                    className="rounded"
                  />
                  <div>
                    <span className="font-semibold block text-xs">Screen Capture API</span>
                    <span className="text-[10px] text-[var(--text-muted)]">Monitors window focus & screen share stream</span>
                  </div>
                </label>

                <label className="flex items-center gap-3 p-3 rounded-xl bg-[var(--bg-app)] border border-[var(--border)] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={requireFullscreen}
                    onChange={(e) => setRequireFullscreen(e.target.checked)}
                    className="rounded"
                  />
                  <div>
                    <span className="font-semibold block text-xs">Fullscreen Lock</span>
                    <span className="text-[10px] text-[var(--text-muted)]">Logs telemetry when candidate leaves fullscreen</span>
                  </div>
                </label>

                <label className="flex items-center gap-3 p-3 rounded-xl bg-[var(--bg-app)] border border-[var(--border)] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={blockClipboard}
                    onChange={(e) => setBlockClipboard(e.target.checked)}
                    className="rounded"
                  />
                  <div>
                    <span className="font-semibold block text-xs">Clipboard Telemetry</span>
                    <span className="text-[10px] text-[var(--text-muted)]">Flags external copy/paste events & large pastes</span>
                  </div>
                </label>
              </div>

              <div className="pt-2">
                <label className="flex items-center gap-3 p-3 rounded-xl bg-[var(--bg-app)] border border-[var(--border)] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={enableCertificates}
                    onChange={(e) => setEnableCertificates(e.target.checked)}
                    className="rounded"
                  />
                  <div>
                    <span className="font-semibold block text-xs">Enable CodeForge Verified Certificates</span>
                    <span className="text-[10px] text-[var(--text-muted)]">Automatically issues signed digital achievement certificates to top qualifiers</span>
                  </div>
                </label>
              </div>
            </div>
          </div>
        )}

        {/* Step 6: Review & Publish */}
        {currentStep === 6 && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-[var(--text-base)] uppercase tracking-wider">
              Step 6: Review & Final Launch
            </h3>

            <div className="p-4 rounded-xl bg-[var(--bg-app)] border border-[var(--border)] space-y-3">
              <div className="flex justify-between border-b border-[var(--border-subtle)] pb-2">
                <span className="text-[var(--text-muted)]">Event Name:</span>
                <span className="font-bold text-[var(--text-base)]">{title || 'Untitled Event'}</span>
              </div>
              <div className="flex justify-between border-b border-[var(--border-subtle)] pb-2">
                <span className="text-[var(--text-muted)]">Host / Organizer:</span>
                <span className="font-semibold text-cyan-400">{organizerName} ({organizerType})</span>
              </div>
              <div className="flex justify-between border-b border-[var(--border-subtle)] pb-2">
                <span className="text-[var(--text-muted)]">Schedule:</span>
                <span className="font-semibold text-[var(--text-base)]">{startDate} at {startTime} ({durationMinutes} mins)</span>
              </div>
              <div className="flex justify-between border-b border-[var(--border-subtle)] pb-2">
                <span className="text-[var(--text-muted)]">Rounds:</span>
                <span className="font-semibold text-[var(--text-base)]">{rounds.length} sequential rounds</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--text-muted)]">Anti-Cheat Enforcement:</span>
                <span className="font-semibold text-emerald-400">
                  {requireCamera ? 'Cam ' : ''}
                  {requireScreenShare ? '· Screen ' : ''}
                  {requireFullscreen ? '· Fullscreen' : ''}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Navigation Footer */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
          disabled={currentStep === 1}
          className="px-4 py-2 rounded-xl border border-[var(--border)] text-xs font-semibold text-[var(--text-muted)] hover:text-[var(--text-base)] disabled:opacity-30 cursor-pointer"
        >
          ← Previous
        </button>

        <div className="flex items-center gap-2">
          {currentStep < totalSteps ? (
            <button
              onClick={() => setCurrentStep(currentStep + 1)}
              className="px-5 py-2 rounded-xl bg-[var(--accent)] hover:bg-[var(--accent-2)] text-white text-xs font-bold transition cursor-pointer"
            >
              Continue →
            </button>
          ) : (
            <button
              onClick={handlePublish}
              className="px-6 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold uppercase tracking-wider shadow-lg shadow-emerald-600/20 transition cursor-pointer"
            >
              Publish Event Now 🚀
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

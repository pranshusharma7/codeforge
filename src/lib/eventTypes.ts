/**
 * CodeForge Events & Assessment Platform - Core Data Architecture
 * Supports multi-round competitive programming, college tests, hiring challenges, and hackathons.
 */

export type OrganizerType =
  | 'Company'
  | 'College'
  | 'University'
  | 'Coding Club'
  | 'Community'
  | 'Individual'
  | 'Startup'
  | 'Organization';

export type VerificationTier =
  | 'unverified'
  | 'verified_organizer'
  | 'verified_company'
  | 'verified_college'
  | 'verified_organization';

export type EventType =
  | 'Coding Contest'
  | 'Hiring Challenge'
  | 'College Contest'
  | 'Hackathon'
  | 'Debugging Challenge'
  | 'DSA Contest'
  | 'Frontend Challenge'
  | 'Backend Challenge'
  | 'AI/ML Challenge'
  | 'Programming Assessment';

export type EventCategory =
  | 'competitive'
  | 'assessment'
  | 'hackathon'
  | 'learning';

export type EventStatus =
  | 'DRAFT'
  | 'UPCOMING'
  | 'REGISTRATION_OPEN'
  | 'REGISTRATION_CLOSED'
  | 'LIVE'
  | 'PAUSED'
  | 'COMPLETED'
  | 'ARCHIVED';

export type EventVisibility = 'public' | 'private' | 'invite_only';

export type EligibilityType =
  | 'everyone'
  | 'college_students'
  | 'specific_college'
  | 'specific_country'
  | 'custom';

export type QuestionType =
  | 'coding'
  | 'mcq'
  | 'multiple_correct'
  | 'debugging'
  | 'output_prediction'
  | 'sql'
  | 'frontend'
  | 'subjective';

export type ProblemDifficulty = 'Easy' | 'Medium' | 'Hard';

export interface TestCase {
  id: string;
  input: string;
  expectedOutput: string;
  explanation?: string;
  weight?: number;
  isHidden: boolean;
}

export interface EventQuestion {
  id: string;
  title: string;
  slug: string;
  type: QuestionType;
  difficulty: ProblemDifficulty;
  points: number;
  timeLimitMs: number;
  memoryLimitMb: number;
  description: string;
  inputFormat?: string;
  outputFormat?: string;
  constraints?: string;
  explanation?: string;
  tags: string[];
  // For MCQs / Output Prediction
  options?: { id: string; text: string }[];
  correctOptionIds?: string[];
  // For Debugging / Starter Code
  starterCode?: Record<string, string>; // lang -> code
  testCases: TestCase[];
}

export interface EventRound {
  id: string;
  name: string;
  description: string;
  type: 'coding' | 'mcq' | 'debugging' | 'mixed';
  order: number;
  durationMinutes: number;
  startTime?: string;
  endTime?: string;
  passingScore?: number;
  maxScore: number;
  negativeMarking: boolean;
  negativeMarkPoints?: number;
  languagesAllowed: string[];
  questions: EventQuestion[];
  isUnlocked: boolean;
}

export interface ProctoringConfig {
  requireCamera: boolean;
  requireMicrophone: boolean;
  requireScreenShare: boolean;
  requireFullscreen: boolean;
  blockClipboard: boolean;
  maxViolationsBeforeLock: number;
  lockoutDurationSeconds: number;
  autoTerminateOnExcessiveViolations: boolean;
}

export interface PrizeItem {
  rank: string;
  reward: string;
  description?: string;
}

export interface OrganizerProfile {
  id: string;
  name: string;
  type: OrganizerType;
  verification: VerificationTier;
  avatar?: string;
  email: string;
  website?: string;
  eventsHostedCount: number;
  joinedYear: number;
}

export interface EventAnnouncement {
  id: string;
  eventId: string;
  title: string;
  message: string;
  timestamp: string;
  isPinned?: boolean;
}

export interface CodeForgeEvent {
  id: string;
  slug: string;
  title: string;
  description: string;
  aboutMarkdown: string;
  logo: string;
  banner?: string;
  organizer: OrganizerProfile;
  eventType: EventType;
  category: EventCategory;
  tags: string[];
  status: EventStatus;
  visibility: EventVisibility;
  eligibility: {
    type: EligibilityType;
    description: string;
    allowedInstitutions?: string[];
  };
  registrationRequirements: {
    requireName: boolean;
    requireEmail: boolean;
    requireCollege: boolean;
    requirePhone: boolean;
    requireGitHub: boolean;
    requireLinkedIn: boolean;
    customQuestions?: { id: string; label: string; required: boolean }[];
  };
  // Schedule
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
  durationMinutes: number;
  registrationDeadline: string;
  maxParticipants?: number;
  currentParticipantsCount: number;
  // Rounds & Questions
  rounds: EventRound[];
  // Rules & Scoring
  rules: string[];
  scoringPolicy: {
    partialScoring: boolean;
    negativeMarking: boolean;
    timePenalty: boolean;
    tieBreaker: 'fastest_submission' | 'fewest_attempts' | 'higher_accuracy';
  };
  prizes?: PrizeItem[];
  faqs?: { question: string; answer: string }[];
  proctoring: ProctoringConfig;
  certificateConfig?: {
    enabled: boolean;
    title: string;
    criteria: 'winner' | 'top_10' | 'top_20' | 'all_participants' | 'passing_score';
    signatoryName: string;
    signatoryRole: string;
  };
  announcements: EventAnnouncement[];
  createdAt: string;
  updatedAt: string;
  isRegistered?: boolean;
}

export interface EventRegistration {
  id: string;
  eventId: string;
  userId: string;
  userName: string;
  userEmail: string;
  githubHandle?: string;
  college?: string;
  registeredAt: string;
  status: 'registered' | 'checked_in' | 'disqualified' | 'completed';
  currentRoundId?: string;
  totalScore: number;
  rank?: number;
  penaltyTimeSeconds: number;
  securityViolationCount: number;
  customAnswers?: Record<string, string>;
}

export interface QuestionBankItem extends EventQuestion {
  authorId: string;
  authorName: string;
  createdAt: string;
  usedInEventsCount: number;
}

export interface EventTemplate {
  id: string;
  title: string;
  description: string;
  category: EventCategory;
  eventType: EventType;
  suggestedRounds: number;
  durationMinutes: number;
  tags: string[];
}

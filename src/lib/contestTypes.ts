/**
 * CodeForge Proctored Coding Contest & Assessment Types
 */

export type ContestCategory = 'contest' | 'interview_assessment' | 'competitive' | 'assessment';
export type ContestStatus = 'upcoming' | 'live' | 'ended';
export type ProblemDifficulty = 'Easy' | 'Medium' | 'Hard';
export type ClipboardPolicy = 'allowed' | 'blocked' | 'flagged';
export type RiskLevel = 'normal' | 'review' | 'high';

export type SecurityEventType =
  | 'TAB_SWITCH'
  | 'WINDOW_BLUR'
  | 'FULLSCREEN_EXIT'
  | 'SCREEN_SHARE_STOPPED'
  | 'CAMERA_STOPPED'
  | 'MIC_STOPPED'
  | 'COPY_EVENT'
  | 'PASTE_EVENT'
  | 'LARGE_PASTE'
  | 'MULTIPLE_SESSION_ATTEMPT'
  | 'DEVTOOLS_SUSPECTED'
  | 'DEVTOOLS_OPENED'
  | 'SESSION_RECOVERED'
  | 'SESSION_INITIALIZED'
  | 'CODE_SUBMISSION'
  | 'CONTEST_SUBMITTED_FINAL';

export interface SecurityEvent {
  id: string;
  sessionId: string;
  contestId: string;
  userId: string;
  type: SecurityEventType;
  severity?: 'info' | 'warning' | 'high';
  timestamp: string | number;
  metadata?: Record<string, any>;
}

export interface ProctoringConfig {
  requireCamera?: boolean;
  requireMic?: boolean;
  requireMicrophone?: boolean;
  requireScreenShare?: boolean;
  requireFullscreen?: boolean;
  prohibitClipboard?: boolean;
  clipboardPolicy?: ClipboardPolicy;
  maxViolationsBeforeLock?: number;
  lockoutDurationSeconds?: number;
  autoTerminateOnMaxViolations?: boolean;
  maxWarnings?: number;
  autoLockOnExit?: boolean;
}

export interface PrivacyNotice {
  dataCollected?: string[];
  whatCollected?: string[];
  purpose?: string;
  whyCollected?: string;
  retentionPolicy: string;
  whoHasAccess?: string;
  accessControl?: string;
  refusalConsequence?: string;
}

export interface SampleTestCase {
  id?: string;
  input: string;
  expectedOutput: string;
  explanation?: string;
}

export interface HiddenTestCase {
  id?: string;
  input: string;
  expectedOutput: string;
  weight?: number;
  isSecret?: boolean;
}

export interface ContestProblem {
  id: string;
  contestId?: string;
  title: string;
  slug?: string;
  difficulty: ProblemDifficulty;
  points: number;
  timeLimitMs: number;
  memoryLimitMb: number;
  description: string;
  constraints?: string | string[];
  inputFormat?: string;
  outputFormat?: string;
  sampleTestCases: SampleTestCase[];
  starterCode: {
    python: string;
    cpp?: string;
    java?: string;
    javascript?: string;
    [lang: string]: string | undefined;
  };
}

export interface Contest {
  id: string;
  title: string;
  slug?: string;
  type?: 'competitive' | 'assessment';
  category?: ContestCategory;
  status: ContestStatus;
  description: string;
  organization?: string;
  rules?: string[];
  startTime: string | number;
  endTime: string | number;
  durationMinutes: number;
  totalPoints?: number;
  registeredUsersCount?: number;
  participantCount?: number;
  isRegistered?: boolean;
  registeredUserIds?: string[];
  proctoring: ProctoringConfig;
  privacyNotice: PrivacyNotice;
  problems: ContestProblem[];
}

export interface ContestSubmission {
  id: string;
  contestId: string;
  problemId: string;
  userId: string;
  userName?: string;
  sessionId: string;
  code: string;
  language: string;
  status: 'Accepted' | 'Wrong Answer' | 'Time Limit Exceeded' | 'Runtime Error' | 'Compilation Error' | string;
  passedCount?: number;
  totalCount?: number;
  pointsEarned?: number;
  timeMs?: number;
  memoryKb?: number;
  createdAt?: string;
  testCaseResults?: any[];
  isAccepted?: boolean;
}

export interface RiskMetrics {
  overallScore: number;
  level: RiskLevel;
  totalViolations: number;
  breakdown: {
    tabSwitches: number;
    windowBlurs: number;
    fullscreenExits: number;
    screenShareDrops: number;
    cameraDrops: number;
    micDrops: number;
    copyPastes: number;
    devtoolsDetections: number;
  };
}

export interface ContestSession {
  id: string;
  contestId: string;
  userId: string;
  userName: string;
  userEmail?: string;
  userAvatar?: string;
  status: 'in_progress' | 'active' | 'submitted' | 'locked' | 'disqualified';
  startTime: string | number;
  startTimestamp?: number;
  lastHeartbeat?: number;
  ipAddress?: string;
  userAgent?: string;
  deviceInfo?: string;
  permissions: {
    cameraGranted: boolean;
    micGranted: boolean;
    screenGranted: boolean;
    fullscreenActive: boolean;
  };
  riskMetrics: RiskMetrics;
  lockedUntil?: number | null;
  submittedAt?: string;
  submissions: ContestSubmission[];
}

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  userName: string;
  avatar?: string;
  score: number;
  penaltyTimeSeconds: number;
  solvedProblemsCount: number;
  problemSubmissions: Record<string, { solved: boolean; attempts: number; timeMinutes?: number; points?: number }>;
  riskScore: number;
  proctorStatus: 'verified' | 'in_review' | 'flagged';
}

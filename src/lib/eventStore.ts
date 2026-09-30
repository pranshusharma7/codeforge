/**
 * CodeForge Events & Assessment Platform — Store & Service Layer
 * Handles persistent state for events, organizers, rounds, question banks, registrations, and live controls.
 */

import {
  CodeForgeEvent,
  EventQuestion,
  EventRegistration,
  QuestionBankItem,
  EventTemplate,
  OrganizerProfile,
  EventRound,
  EventAnnouncement,
} from './eventTypes';

const STORAGE_EVENTS_KEY = 'cf_events_v2';
const STORAGE_REGISTRATIONS_KEY = 'cf_event_registrations_v2';
const STORAGE_QUESTION_BANK_KEY = 'cf_question_bank_v2';

// ── Default Seed Question Bank ──────────────────────────────────────────────
export const SEED_QUESTION_BANK: QuestionBankItem[] = [
  {
    id: 'qb-max-subarray',
    title: 'Maximum Contiguous Energy Subarray',
    slug: 'max-contiguous-energy-subarray',
    type: 'coding',
    difficulty: 'Easy',
    points: 100,
    timeLimitMs: 1500,
    memoryLimitMb: 128,
    description: `Given an array of integer energy readings \`arr\`, find the contiguous subarray (containing at least one number) which has the largest sum and return its sum.

### Constraints:
* \`1 <= arr.length <= 10^5\`
* \`-10^4 <= arr[i] <= 10^4\``,
    inputFormat: 'First line contains integer N. The next line contains N space-separated integers.',
    outputFormat: 'Print a single integer representing the maximum subarray sum.',
    explanation: 'For input [-2, 1, -3, 4, -1, 2, 1, -5, 4], the subarray [4, -1, 2, 1] has the largest sum = 6.',
    tags: ['Arrays', 'Dynamic Programming', 'Kadane', 'DSA'],
    authorId: 'usr_codeforge_official',
    authorName: 'CodeForge Editorial',
    createdAt: '2026-01-15T10:00:00Z',
    usedInEventsCount: 14,
    starterCode: {
      python: `def solve():
    import sys
    input = sys.stdin.read
    data = input().split()
    if not data: return
    n = int(data[0])
    arr = [int(x) for x in data[1:n+1]]
    
    max_sum = arr[0]
    curr_sum = 0
    for x in arr:
        curr_sum = max(x, curr_sum + x)
        max_sum = max(max_sum, curr_sum)
    print(max_sum)

if __name__ == '__main__':
    solve()
`,
      cpp: `#include <iostream>
#include <vector>
#include <algorithm>
using namespace std;

int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);
    int n;
    if (!(cin >> n)) return 0;
    vector<long long> arr(n);
    for (int i = 0; i < n; i++) cin >> arr[i];
    long long max_sum = arr[0], curr_sum = 0;
    for (int i = 0; i < n; i++) {
        curr_sum = max(arr[i], curr_sum + arr[i]);
        max_sum = max(max_sum, curr_sum);
    }
    cout << max_sum << "\\n";
    return 0;
}
`,
      javascript: `const fs = require('fs');

function solve() {
    const input = fs.readFileSync('/dev/stdin', 'utf-8').trim().split(/\\s+/);
    if (!input || input.length < 2) return;
    const n = parseInt(input[0], 10);
    const arr = input.slice(1, n + 1).map(Number);
    let maxSum = arr[0];
    let currSum = 0;
    for (const x of arr) {
        currSum = Math.max(x, currSum + x);
        maxSum = Math.max(maxSum, currSum);
    }
    console.log(maxSum);
}

solve();
`
    },
    testCases: [
      {
        id: 'tc-maxsub-1',
        input: '9\n-2 1 -3 4 -1 2 1 -5 4',
        expectedOutput: '6',
        explanation: 'Subarray [4,-1,2,1] has sum 6',
        isHidden: false,
      },
      {
        id: 'tc-maxsub-2',
        input: '1\n1',
        expectedOutput: '1',
        isHidden: false,
      },
      {
        id: 'tc-maxsub-3',
        input: '5\n5 4 -1 7 8',
        expectedOutput: '23',
        isHidden: false,
      },
      {
        id: 'tc-maxsub-h1',
        input: '4\n-1 -2 -3 -4',
        expectedOutput: '-1',
        isHidden: true,
      },
      {
        id: 'tc-maxsub-h2',
        input: '6\n10 -20 30 -5 40 -100',
        expectedOutput: '65',
        isHidden: true,
      }
    ]
  },
  {
    id: 'qb-two-sum-target',
    title: 'Two Sum Target Frequency Matrix',
    slug: 'two-sum-target-frequency',
    type: 'coding',
    difficulty: 'Medium',
    points: 150,
    timeLimitMs: 2000,
    memoryLimitMb: 256,
    description: `Given an array of integers \`nums\` and an integer \`target\`, return indices of the two numbers such that they add up to \`target\`.
You may assume that each input would have exactly one solution, and you may not use the same element twice.
Return the indices sorted in ascending order (space-separated).`,
    inputFormat: 'First line: N and target. Second line: N integers.',
    outputFormat: 'Print: i j (where i < j).',
    tags: ['Hash Map', 'Arrays', 'Two Pointers'],
    authorId: 'usr_codeforge_official',
    authorName: 'CodeForge Editorial',
    createdAt: '2026-01-20T10:00:00Z',
    usedInEventsCount: 22,
    starterCode: {
      python: `import sys

def solve():
    data = sys.stdin.read().split()
    if not data: return
    n, target = int(data[0]), int(data[1])
    nums = [int(x) for x in data[2:n+2]]
    
    seen = {}
    for i, num in enumerate(nums):
        comp = target - num
        if comp in seen:
            print(f"{seen[comp]} {i}")
            return
        seen[num] = i

if __name__ == '__main__':
    solve()
`
    },
    testCases: [
      {
        id: 'tc-ts-1',
        input: '4 9\n2 7 11 15',
        expectedOutput: '0 1',
        isHidden: false,
      },
      {
        id: 'tc-ts-2',
        input: '3 6\n3 2 4',
        expectedOutput: '1 2',
        isHidden: false,
      },
      {
        id: 'tc-ts-h1',
        input: '5 100\n10 20 30 70 90',
        expectedOutput: '2 3',
        isHidden: true,
      }
    ]
  },
  {
    id: 'qb-mcq-os-concurrency',
    title: 'Deadlock Necessary Conditions in Operating Systems',
    slug: 'deadlock-conditions-os',
    type: 'mcq',
    difficulty: 'Easy',
    points: 25,
    timeLimitMs: 60,
    memoryLimitMb: 64,
    description: 'Which of the following is NOT one of the four Coffman conditions necessary for a deadlock to occur?',
    tags: ['Operating Systems', 'Concurrency', 'CS Fundamentals'],
    authorId: 'usr_codeforge_official',
    authorName: 'CodeForge Editorial',
    createdAt: '2026-02-01T12:00:00Z',
    usedInEventsCount: 30,
    options: [
      { id: 'opt_1', text: 'Mutual Exclusion' },
      { id: 'opt_2', text: 'Hold and Wait' },
      { id: 'opt_3', text: 'Preemptive Scheduling' },
      { id: 'opt_4', text: 'Circular Wait' },
    ],
    correctOptionIds: ['opt_3'],
    testCases: []
  },
  {
    id: 'qb-debug-off-by-one',
    title: 'Debugging: Binary Search Infinite Loop Fix',
    slug: 'debug-binary-search-loop',
    type: 'debugging',
    difficulty: 'Medium',
    points: 75,
    timeLimitMs: 1500,
    memoryLimitMb: 128,
    description: 'The provided code contains a critical bug in pointer adjustments that causes an infinite loop for missing keys. Correct the logic so it returns the 0-based index or -1.',
    tags: ['Debugging', 'Binary Search'],
    authorId: 'usr_codeforge_official',
    authorName: 'CodeForge Editorial',
    createdAt: '2026-02-10T12:00:00Z',
    usedInEventsCount: 8,
    starterCode: {
      python: `import sys

def binary_search(arr, target):
    low = 0
    high = len(arr) - 1
    while low <= high:
        mid = (low + high) // 2
        if arr[mid] == target:
            return mid
        elif arr[mid] < target:
            low = mid + 1  # Fixed
        else:
            high = mid - 1 # Fixed
    return -1

if __name__ == '__main__':
    data = sys.stdin.read().split()
    if data:
        n, target = int(data[0]), int(data[1])
        arr = [int(x) for x in data[2:n+2]]
        print(binary_search(arr, target))
`
    },
    testCases: [
      {
        id: 'tc-dbg-1',
        input: '5 7\n1 3 5 7 9',
        expectedOutput: '3',
        isHidden: false,
      },
      {
        id: 'tc-dbg-2',
        input: '4 6\n2 4 8 10',
        expectedOutput: '-1',
        isHidden: false,
      }
    ]
  }
];

// ── Default Seed Events ──────────────────────────────────────────────────────
export const SEED_EVENTS: CodeForgeEvent[] = [
  {
    id: 'ev-codeforge-weekly-01',
    slug: 'codeforge-weekly-01',
    title: 'CodeForge Grand Showdown #01',
    description: 'Weekly algorithmic competition for competitive programmers, DSA practitioners, and software engineers worldwide.',
    aboutMarkdown: `Welcome to **CodeForge Grand Showdown #01**!
Join top software engineers and competitive coders across universities and tech companies.
All submissions are evaluated against server-authoritative hidden test suites in isolated sandboxes.

### Format & Rules:
* **Round 1:** Speed DSA Challenge (3 Problems: Easy, Medium, Hard).
* **Execution Limit:** 2.0s per testcase, 256MB memory limit.
* **Proctoring:** Webcam live frame checks and screen capture telemetry enabled.
* **Tie-breaker:** Fastest cumulative accepted submission time.`,
    logo: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100&h=100&fit=crop',
    organizer: {
      id: 'org_codeforge',
      name: 'CodeForge Engineering',
      type: 'Organization',
      verification: 'verified_organization',
      email: 'events@codeforge.dev',
      website: 'https://codeforge.dev',
      eventsHostedCount: 28,
      joinedYear: 2024,
    },
    eventType: 'Coding Contest',
    category: 'competitive',
    tags: ['Algorithms', 'DSA', 'Competitive Programming', 'Global Standings'],
    status: 'LIVE',
    visibility: 'public',
    eligibility: {
      type: 'everyone',
      description: 'Open to all developers, university students, and coding enthusiasts worldwide.',
    },
    registrationRequirements: {
      requireName: true,
      requireEmail: true,
      requireCollege: false,
      requirePhone: false,
      requireGitHub: true,
      requireLinkedIn: false,
    },
    startDate: new Date(Date.now() - 35 * 60 * 1000).toISOString().split('T')[0],
    startTime: '10:00',
    endDate: new Date(Date.now() + 85 * 60 * 1000).toISOString().split('T')[0],
    endTime: '12:00',
    durationMinutes: 120,
    registrationDeadline: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
    maxParticipants: 5000,
    currentParticipantsCount: 1420,
    rounds: [
      {
        id: 'rnd-showdown-1',
        name: 'Round 1 — Algorithmic Sprint',
        description: 'Solve 3 escalating problems from array manipulation to target frequency matching.',
        type: 'coding',
        order: 1,
        durationMinutes: 120,
        maxScore: 300,
        negativeMarking: false,
        languagesAllowed: ['python', 'cpp', 'javascript', 'java'],
        isUnlocked: true,
        questions: [
          SEED_QUESTION_BANK[0],
          SEED_QUESTION_BANK[1],
        ]
      }
    ],
    rules: [
      'Individual participation only; no collaboration.',
      'All code evaluated in isolated container execution sandboxes.',
      'Webcam and screen capture telemetry must remain active during the proctored round.',
      'Exiting fullscreen or switching windows triggers security penalty telemetry.'
    ],
    scoringPolicy: {
      partialScoring: true,
      negativeMarking: false,
      timePenalty: true,
      tieBreaker: 'fastest_submission'
    },
    prizes: [
      { rank: '1st Place', reward: '$1,000 USD + CodeForge Pro Lifetime', description: 'Grand Champion Trophy & Certificate' },
      { rank: '2nd Place', reward: '$500 USD + CodeForge Pro 1 Year', description: 'Runner-up Plaque' },
      { rank: '3rd Place', reward: '$250 USD + CodeForge Pro 1 Year', description: 'Podium Finisher Certificate' },
      { rank: 'Top 10', reward: 'CodeForge Developer Swag Pack', description: 'Hoodie, stickers & mechanical keyboard' }
    ],
    faqs: [
      { question: 'What languages can I use?', answer: 'Python 3.11, C++20 (GCC 13), Node.js JavaScript 20, and Java OpenJDK 21.' },
      { question: 'Are hidden test cases shown?', answer: 'No. To ensure integrity, hidden test cases run strictly server-side.' }
    ],
    proctoring: {
      requireCamera: true,
      requireMicrophone: false,
      requireScreenShare: true,
      requireFullscreen: true,
      blockClipboard: true,
      maxViolationsBeforeLock: 3,
      lockoutDurationSeconds: 15,
      autoTerminateOnExcessiveViolations: false,
    },
    certificateConfig: {
      enabled: true,
      title: 'Certificate of Competitive Excellence',
      criteria: 'top_10',
      signatoryName: 'CodeForge Editorial Board',
      signatoryRole: 'Head of Competition Engineering',
    },
    announcements: [
      {
        id: 'ann-1',
        eventId: 'ev-codeforge-weekly-01',
        title: 'Contest is LIVE!',
        message: 'Problems are unlocked. Make sure your camera and screen sharing streams remain active.',
        timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
        isPinned: true,
      }
    ],
    createdAt: '2026-01-10T12:00:00Z',
    updatedAt: '2026-01-10T12:00:00Z',
    isRegistered: true,
  },
  {
    id: 'ev-iitd-tesseract-26',
    slug: 'iitd-tesseract-26',
    title: 'IIT Delhi Techfest: Algorush 2026',
    description: 'Inter-college competitive programming hackathon hosted by IIT Delhi Coding Club with cash prizes & interview opportunities.',
    aboutMarkdown: `**IIT Delhi Techfest: Algorush 2026** is the flagship annual coding showdown for university students across India and abroad.
Featuring 2 rounds: an initial Aptitude + CS Fundamentals screening, followed by an intense DSA Round.`,
    logo: 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=100&h=100&fit=crop',
    organizer: {
      id: 'org_iitd_club',
      name: 'IIT Delhi Computer Science Society',
      type: 'College',
      verification: 'verified_college',
      email: 'events@iitd.ac.in',
      website: 'https://iitd.ac.in',
      eventsHostedCount: 12,
      joinedYear: 2023,
    },
    eventType: 'College Contest',
    category: 'competitive',
    tags: ['College', 'IIT Delhi', 'Inter-University', 'DSA Sprint'],
    status: 'REGISTRATION_OPEN',
    visibility: 'public',
    eligibility: {
      type: 'college_students',
      description: 'Open to all undergraduate & postgraduate college students with valid student ID.',
    },
    registrationRequirements: {
      requireName: true,
      requireEmail: true,
      requireCollege: true,
      requirePhone: true,
      requireGitHub: true,
      requireLinkedIn: true,
    },
    startDate: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString().split('T')[0],
    startTime: '14:00',
    endDate: new Date(Date.now() + 52 * 60 * 60 * 1000).toISOString().split('T')[0],
    endTime: '18:00',
    durationMinutes: 240,
    registrationDeadline: new Date(Date.now() + 44 * 60 * 60 * 1000).toISOString(),
    maxParticipants: 2000,
    currentParticipantsCount: 864,
    rounds: [
      {
        id: 'rnd-iitd-1',
        name: 'Round 1 — CS Core & Aptitude Screening',
        description: '20 Questions covering OS, DBMS, Algorithms analysis, and logic puzzles.',
        type: 'mcq',
        order: 1,
        durationMinutes: 45,
        maxScore: 100,
        passingScore: 60,
        negativeMarking: true,
        negativeMarkPoints: 1,
        languagesAllowed: [],
        isUnlocked: true,
        questions: [SEED_QUESTION_BANK[2]]
      },
      {
        id: 'rnd-iitd-2',
        name: 'Round 2 — Algorithmic Championship',
        description: '4 Algorithmic problems ranging from graphs to dynamic programming.',
        type: 'coding',
        order: 2,
        durationMinutes: 180,
        maxScore: 400,
        negativeMarking: false,
        languagesAllowed: ['python', 'cpp', 'java'],
        isUnlocked: false,
        questions: [SEED_QUESTION_BANK[0], SEED_QUESTION_BANK[1]]
      }
    ],
    rules: [
      'Students must register using their official college email or upload college ID proof.',
      'Plagiarism checks are automatically executed post-contest using code syntax diffing.'
    ],
    scoringPolicy: {
      partialScoring: true,
      negativeMarking: true,
      timePenalty: true,
      tieBreaker: 'higher_accuracy'
    },
    prizes: [
      { rank: '1st Place', reward: '₹1,50,000 INR + Winner Trophy', description: 'Direct Interview Round at Sponsor Startup' },
      { rank: '2nd Place', reward: '₹75,000 INR + Runner-up Certificate' },
      { rank: '3rd Place', reward: '₹40,000 INR + Merits Certificate' }
    ],
    proctoring: {
      requireCamera: true,
      requireMicrophone: false,
      requireScreenShare: true,
      requireFullscreen: true,
      blockClipboard: true,
      maxViolationsBeforeLock: 3,
      lockoutDurationSeconds: 20,
      autoTerminateOnExcessiveViolations: false,
    },
    announcements: [],
    createdAt: '2026-02-01T10:00:00Z',
    updatedAt: '2026-02-01T10:00:00Z',
    isRegistered: false,
  },
  {
    id: 'ev-uber-systems-assessment',
    slug: 'uber-systems-assessment',
    title: 'High-Concurrency Systems & Backend Assessment',
    description: 'Official technical screening round for Senior Backend & Distributed Systems Engineering roles.',
    aboutMarkdown: `High-bar proctored technical assessment testing multi-threading, LRU caching, rate limiters, and clean algorithmic problem solving.
Candidates who pass the 75% cutoff advance directly to technical architecture interviews.`,
    logo: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=100&h=100&fit=crop',
    organizer: {
      id: 'org_uber_careers',
      name: 'Uber Recruiting & Infrastructure',
      type: 'Company',
      verification: 'verified_company',
      email: 'recruiting@uber.com',
      website: 'https://uber.com/careers',
      eventsHostedCount: 45,
      joinedYear: 2022,
    },
    eventType: 'Hiring Challenge',
    category: 'assessment',
    tags: ['Hiring', 'Systems', 'Backend', 'Full-time Opportunities'],
    status: 'LIVE',
    visibility: 'public',
    eligibility: {
      type: 'everyone',
      description: 'Candidates with 1+ years experience in backend services or systems programming.',
    },
    registrationRequirements: {
      requireName: true,
      requireEmail: true,
      requireCollege: false,
      requirePhone: true,
      requireGitHub: true,
      requireLinkedIn: true,
    },
    startDate: new Date(Date.now() - 15 * 60 * 1000).toISOString().split('T')[0],
    startTime: '09:00',
    endDate: new Date(Date.now() + 105 * 60 * 1000).toISOString().split('T')[0],
    endTime: '11:00',
    durationMinutes: 120,
    registrationDeadline: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
    maxParticipants: 500,
    currentParticipantsCount: 142,
    rounds: [
      {
        id: 'rnd-uber-1',
        name: 'Systems Implementation & Debugging',
        description: 'Complete coding challenges with strict time limits and concurrency safety.',
        type: 'coding',
        order: 1,
        durationMinutes: 120,
        maxScore: 200,
        passingScore: 150,
        negativeMarking: false,
        languagesAllowed: ['python', 'cpp', 'javascript', 'java'],
        isUnlocked: true,
        questions: [SEED_QUESTION_BANK[1], SEED_QUESTION_BANK[3]]
      }
    ],
    rules: [
      'Comprehensive proctoring: continuous webcam, microphone, and desktop screen sharing required.',
      'Any external clipboard paste over 80 characters is flagged for human proctor review.'
    ],
    scoringPolicy: {
      partialScoring: true,
      negativeMarking: false,
      timePenalty: false,
      tieBreaker: 'higher_accuracy'
    },
    proctoring: {
      requireCamera: true,
      requireMicrophone: true,
      requireScreenShare: true,
      requireFullscreen: true,
      blockClipboard: true,
      maxViolationsBeforeLock: 3,
      lockoutDurationSeconds: 15,
      autoTerminateOnExcessiveViolations: false,
    },
    announcements: [],
    createdAt: '2026-02-15T09:00:00Z',
    updatedAt: '2026-02-15T09:00:00Z',
    isRegistered: false,
  }
];

// ── Default Seed Templates ──────────────────────────────────────────────────
export const SEED_TEMPLATES: EventTemplate[] = [
  {
    id: 'tmpl-weekly-contest',
    title: 'Weekly Competitive Coding Contest',
    description: 'Standard 2-hour competitive programming match with 3-4 algorithmic problems and live rankings.',
    category: 'competitive',
    eventType: 'Coding Contest',
    suggestedRounds: 1,
    durationMinutes: 120,
    tags: ['Algorithms', 'DSA', 'Speed Coding'],
  },
  {
    id: 'tmpl-campus-placement',
    title: 'Campus Placement & College Hiring Test',
    description: '2-Round evaluation with Aptitude/MCQ screening followed by a proctored coding assessment.',
    category: 'assessment',
    eventType: 'College Contest',
    suggestedRounds: 2,
    durationMinutes: 180,
    tags: ['College', 'Placement', 'MCQ + Coding'],
  },
  {
    id: 'tmpl-hackathon-eval',
    title: '48-Hour Developer Hackathon',
    description: 'Multi-round innovation sprint with proposal review, prototype checkpoint, and final code submission.',
    category: 'hackathon',
    eventType: 'Hackathon',
    suggestedRounds: 3,
    durationMinutes: 2880,
    tags: ['Hackathon', 'Open Innovation', 'Team / Individual'],
  }
];

class EventStore {
  private events: CodeForgeEvent[] = [];
  private questionBank: QuestionBankItem[] = [];
  private registrations: EventRegistration[] = [];

  constructor() {
    this.hydrate();
  }

  private hydrate() {
    try {
      const savedEvents = localStorage.getItem(STORAGE_EVENTS_KEY);
      if (savedEvents) {
        this.events = JSON.parse(savedEvents);
      } else {
        this.events = [...SEED_EVENTS];
        this.persistEvents();
      }

      const savedBank = localStorage.getItem(STORAGE_QUESTION_BANK_KEY);
      if (savedBank) {
        this.questionBank = JSON.parse(savedBank);
      } else {
        this.questionBank = [...SEED_QUESTION_BANK];
        this.persistQuestionBank();
      }

      const savedRegs = localStorage.getItem(STORAGE_REGISTRATIONS_KEY);
      if (savedRegs) {
        this.registrations = JSON.parse(savedRegs);
      } else {
        // Initial sample registration
        this.registrations = [
          {
            id: 'reg_user_01',
            eventId: 'ev-codeforge-weekly-01',
            userId: 'usr_current',
            userName: 'Alex Chen',
            userEmail: 'alex@codeforge.dev',
            githubHandle: 'alexchen',
            college: 'Stanford University',
            registeredAt: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
            status: 'registered',
            totalScore: 0,
            penaltyTimeSeconds: 0,
            securityViolationCount: 0,
          }
        ];
        this.persistRegistrations();
      }
    } catch {
      this.events = [...SEED_EVENTS];
      this.questionBank = [...SEED_QUESTION_BANK];
      this.registrations = [];
    }
  }

  private persistEvents() {
    try {
      localStorage.setItem(STORAGE_EVENTS_KEY, JSON.stringify(this.events));
    } catch {}
  }

  private persistQuestionBank() {
    try {
      localStorage.setItem(STORAGE_QUESTION_BANK_KEY, JSON.stringify(this.questionBank));
    } catch {}
  }

  private persistRegistrations() {
    try {
      localStorage.setItem(STORAGE_REGISTRATIONS_KEY, JSON.stringify(this.registrations));
    } catch {}
  }

  // ── Public Event API ────────────────────────────────────────────────────────
  public getEvents(): CodeForgeEvent[] {
    return [...this.events];
  }

  public getEventById(id: string): CodeForgeEvent | undefined {
    return this.events.find(e => e.id === id || e.slug === id);
  }

  public createEvent(eventData: Omit<CodeForgeEvent, 'id' | 'createdAt' | 'updatedAt' | 'currentParticipantsCount' | 'announcements'>): CodeForgeEvent {
    const id = 'ev-' + Math.random().toString(36).substring(2, 8) + '-' + Date.now().toString(36);
    const newEvent: CodeForgeEvent = {
      ...eventData,
      id,
      currentParticipantsCount: 0,
      announcements: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isRegistered: false,
    };
    this.events.unshift(newEvent);
    this.persistEvents();
    return newEvent;
  }

  public updateEvent(id: string, updates: Partial<CodeForgeEvent>): CodeForgeEvent | null {
    const idx = this.events.findIndex(e => e.id === id);
    if (idx === -1) return null;
    this.events[idx] = {
      ...this.events[idx],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    this.persistEvents();
    return this.events[idx];
  }

  public deleteEvent(id: string): boolean {
    const prevLen = this.events.length;
    this.events = this.events.filter(e => e.id !== id);
    if (this.events.length !== prevLen) {
      this.persistEvents();
      return true;
    }
    return false;
  }

  // ── Registration API ────────────────────────────────────────────────────────
  public registerUser(eventId: string, user: { id: string; name: string; email?: string; github?: string; college?: string }, customAnswers?: Record<string, string>): boolean {
    const event = this.getEventById(eventId);
    if (!event) return false;

    const existing = this.registrations.find(r => r.eventId === eventId && r.userId === user.id);
    if (existing) return true; // Already registered

    const newReg: EventRegistration = {
      id: 'reg_' + Math.random().toString(36).substring(2, 9),
      eventId,
      userId: user.id,
      userName: user.name,
      userEmail: user.email || `${user.id}@codeforge.dev`,
      githubHandle: user.github,
      college: user.college,
      registeredAt: new Date().toISOString(),
      status: 'registered',
      totalScore: 0,
      penaltyTimeSeconds: 0,
      securityViolationCount: 0,
      customAnswers,
    };

    this.registrations.push(newReg);
    event.currentParticipantsCount = (event.currentParticipantsCount || 0) + 1;
    event.isRegistered = true;
    this.persistRegistrations();
    this.persistEvents();
    return true;
  }

  public isUserRegistered(eventId: string, userId: string): boolean {
    return this.registrations.some(r => r.eventId === eventId && r.userId === userId);
  }

  public getRegistrationsForEvent(eventId: string): EventRegistration[] {
    return this.registrations.filter(r => r.eventId === eventId);
  }

  public getUserRegistrations(userId: string): EventRegistration[] {
    return this.registrations.filter(r => r.userId === userId);
  }

  // ── Live Control & Announcements ────────────────────────────────────────────
  public broadcastAnnouncement(eventId: string, title: string, message: string): EventAnnouncement | null {
    const event = this.getEventById(eventId);
    if (!event) return null;

    const ann: EventAnnouncement = {
      id: 'ann_' + Date.now().toString(36),
      eventId,
      title,
      message,
      timestamp: new Date().toISOString(),
      isPinned: true,
    };

    event.announcements = [ann, ...(event.announcements || [])];
    this.persistEvents();
    return ann;
  }

  public extendEventDuration(eventId: string, extraMinutes: number): boolean {
    const event = this.getEventById(eventId);
    if (!event) return false;

    event.durationMinutes += extraMinutes;
    this.broadcastAnnouncement(
      eventId,
      'Time Extension Notice',
      `The contest duration has been extended by ${extraMinutes} minutes by the organizer.`
    );
    this.persistEvents();
    return true;
  }

  public setEventStatus(eventId: string, status: CodeForgeEvent['status']): boolean {
    const event = this.getEventById(eventId);
    if (!event) return false;
    event.status = status;
    this.persistEvents();
    return true;
  }

  // ── Question Bank API ───────────────────────────────────────────────────────
  public getQuestionBank(): QuestionBankItem[] {
    return [...this.questionBank];
  }

  public addQuestionToBank(question: Omit<QuestionBankItem, 'id' | 'createdAt' | 'usedInEventsCount'>): QuestionBankItem {
    const id = 'qb-' + Math.random().toString(36).substring(2, 8);
    const item: QuestionBankItem = {
      ...question,
      id,
      createdAt: new Date().toISOString(),
      usedInEventsCount: 0,
    };
    this.questionBank.unshift(item);
    this.persistQuestionBank();
    return item;
  }

  public deleteQuestionFromBank(id: string): boolean {
    const prev = this.questionBank.length;
    this.questionBank = this.questionBank.filter(q => q.id !== id);
    if (this.questionBank.length !== prev) {
      this.persistQuestionBank();
      return true;
    }
    return false;
  }
}

export const eventStore = new EventStore();

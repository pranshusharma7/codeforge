import React, { useState, useEffect, useRef, useMemo } from 'react';
import MonacoEditor from '@monaco-editor/react';
import { Contest, ContestProblem, ContestSession, SecurityEvent } from '../../lib/contestTypes';
import { contestService } from '../../lib/contestService';
import {
  CameraIcon,
  MicIcon,
  ScreenIcon,
  ShieldIcon,
  AlertTriangleIcon,
  LockIcon,
  PlayIcon,
  CheckIcon,
  TrophyIcon,
  ClockIcon,
  EyeIcon,
} from '../icons';

interface ContestArenaProps {
  contest: Contest;
  session: ContestSession;
  user: { id: string; name: string; email?: string };
  mediaTracks: {
    videoTrack: MediaStreamTrack | null;
    screenTrack: MediaStreamTrack | null;
    audioTrack: MediaStreamTrack | null;
  };
  onExitArena: () => void;
}

export const ContestArena: React.FC<ContestArenaProps> = ({
  contest,
  session: initialSession,
  user,
  mediaTracks,
  onExitArena,
}) => {
  const [session, setSession] = useState<ContestSession>(initialSession);
  const [activeProblemIndex, setActiveProblemIndex] = useState(0);
  const [selectedLanguage, setSelectedLanguage] = useState<'python' | 'cpp' | 'javascript'>('python');

  // Code state per problem
  const [codes, setCodes] = useState<Record<string, Record<string, string>>>(() => {
    const initial: Record<string, Record<string, string>> = {};
    contest.problems.forEach((p) => {
      initial[p.id] = {
        python: p.starterCode.python || '# Write solution here\n',
        cpp: p.starterCode.cpp || '// Write solution here\n',
        javascript: p.starterCode.javascript || '// Write solution here\n',
      };
    });
    return initial;
  });

  // Execution state
  const [isRunningSample, setIsRunningSample] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [executionResult, setExecutionResult] = useState<any>(null);
  const [activeResultTab, setActiveResultTab] = useState<'sample' | 'submission'>('sample');

  // Authoritative server countdown
  const [timeLeftSeconds, setTimeLeftSeconds] = useState<number>(0);
  const [isContestOver, setIsContestOver] = useState(false);

  // Anti-cheat notifications & lockouts
  const [securityAlerts, setSecurityAlerts] = useState<SecurityEvent[]>([]);
  const [lockoutRemaining, setLockoutRemaining] = useState<number>(0);
  const [showFinishConfirm, setShowFinishConfirm] = useState(false);
  const [contestFinished, setContestFinished] = useState(false);
  const [isCameraPipOpen, setIsCameraPipOpen] = useState(true);

  const videoElementRef = useRef<HTMLVideoElement | null>(null);
  const activeProblem: ContestProblem = contest.problems[activeProblemIndex] || contest.problems[0];

  // Initialize camera PIP stream
  useEffect(() => {
    if (mediaTracks.videoTrack && videoElementRef.current) {
      const stream = new MediaStream([mediaTracks.videoTrack]);
      videoElementRef.current.srcObject = stream;
      videoElementRef.current.play().catch(() => {});
    }
  }, [mediaTracks.videoTrack]);

  // Server-authoritative timer loop
  useEffect(() => {
    const contestEndTime = new Date(contest.endTime).getTime();

    const updateTimer = () => {
      const now = contestService.getServerNow();
      const remaining = Math.max(0, Math.floor((contestEndTime - now) / 1000));
      setTimeLeftSeconds(remaining);

      if (remaining <= 0 && !isContestOver) {
        setIsContestOver(true);
        handleAutoSubmitAndLock();
      }

      // Check lockout status
      const cached = contestService.getSession();
      if (cached) {
        setSession({ ...cached });
        if (cached.lockedUntil && cached.lockedUntil > now) {
          setLockoutRemaining(Math.ceil((cached.lockedUntil - now) / 1000));
        } else {
          setLockoutRemaining(0);
        }
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [contest.endTime, isContestOver]);

  // Subscribe to security telemetry events
  useEffect(() => {
    const unsubAlert = contestService.onSecurityAlert((event) => {
      setSecurityAlerts((prev) => [event, ...prev.slice(0, 4)]);
      const current = contestService.getSession();
      if (current) setSession({ ...current });
    });

    const unsubLock = contestService.onLockout((lockedUntil) => {
      const diff = Math.max(0, Math.ceil((lockedUntil - contestService.getServerNow()) / 1000));
      setLockoutRemaining(diff);
    });

    return () => {
      unsubAlert();
      unsubLock();
    };
  }, []);

  const handleAutoSubmitAndLock = async () => {
    await contestService.finishContest();
    setContestFinished(true);
  };

  const handleManualFinish = async () => {
    await contestService.finishContest();
    setContestFinished(true);
    setShowFinishConfirm(false);
  };

  // Run public sample test cases
  const handleRunSampleTests = async () => {
    if (!activeProblem) return;
    setIsRunningSample(true);
    setExecutionResult(null);
    setActiveResultTab('sample');

    try {
      const code = codes[activeProblem.id]?.[selectedLanguage] || '';
      const result = await contestService.submitSolution({
        contestId: contest.id,
        problemId: activeProblem.id,
        userId: user.id,
        code,
        language: selectedLanguage,
        isSampleOnly: true,
      });
      setExecutionResult(result);
    } catch (err: any) {
      setExecutionResult({
        status: 'Error',
        error: err.message || 'Execution failed',
        testCaseResults: [],
      });
    } finally {
      setIsRunningSample(false);
    }
  };

  // Submit solution to authoritative server with hidden test runner
  const handleSubmitSolution = async () => {
    if (!activeProblem || lockoutRemaining > 0) return;
    setIsSubmitting(true);
    setExecutionResult(null);
    setActiveResultTab('submission');

    try {
      const code = codes[activeProblem.id]?.[selectedLanguage] || '';
      const result = await contestService.submitSolution({
        contestId: contest.id,
        problemId: activeProblem.id,
        userId: user.id,
        code,
        language: selectedLanguage,
        isSampleOnly: false,
      });

      setExecutionResult(result);
      const current = contestService.getSession();
      if (current) setSession({ ...current });
    } catch (err: any) {
      setExecutionResult({
        status: 'Error',
        error: err.message || 'Submission failed',
        testCaseResults: [],
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatTime = (totalSec: number) => {
    const h = Math.floor(totalSec / 3600);
    const m = Math.floor((totalSec % 3600) / 60);
    const s = totalSec % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const currentCode = codes[activeProblem?.id]?.[selectedLanguage] || '';

  const solvedProblemsCount = useMemo(() => {
    const acceptedProblemIds = new Set(
      session.submissions.filter((s) => s.status === 'Accepted').map((s) => s.problemId)
    );
    return acceptedProblemIds.size;
  }, [session.submissions]);

  return (
    <div className="fixed inset-0 z-50 bg-[#0a0f1d] text-slate-100 flex flex-col font-sans select-none overflow-hidden">
      {/* Top Authoritative Bar */}
      <header className="h-14 px-4 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between z-20">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <TrophyIcon className="w-5 h-5 text-amber-400" />
            <span className="font-bold text-sm tracking-wide text-white">{contest.title}</span>
          </div>

          <div className="h-4 w-px bg-slate-700 mx-1 hidden sm:block" />

          {/* Problem Selector Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto py-1">
            {contest.problems.map((prob, idx) => {
              const isSolved = session.submissions.some((s) => s.problemId === prob.id && s.status === 'Accepted');
              const isActive = idx === activeProblemIndex;
              return (
                <button
                  key={prob.id}
                  onClick={() => {
                    setActiveProblemIndex(idx);
                    setExecutionResult(null);
                  }}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
                    isActive
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 shadow-sm'
                      : 'bg-slate-800/60 text-slate-400 hover:text-slate-200 border border-transparent'
                  }`}
                >
                  <span>{String.fromCharCode(65 + idx)}.</span>
                  <span className="max-w-[120px] truncate">{prob.title}</span>
                  {isSolved && <CheckIcon className="w-3.5 h-3.5 text-emerald-400 font-bold" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Center / Right Telemetry & Countdown */}
        <div className="flex items-center gap-4">
          {/* Server Authoritative Timer */}
          <div
            className={`px-3 py-1 rounded-xl border flex items-center gap-2 font-mono text-xs font-bold ${
              timeLeftSeconds < 600
                ? 'bg-rose-500/15 border-rose-500/40 text-rose-400 animate-pulse'
                : 'bg-slate-800/80 border-slate-700 text-cyan-300'
            }`}
          >
            <ClockIcon className="w-4 h-4 text-cyan-400" />
            <span>{formatTime(timeLeftSeconds)}</span>
          </div>

          {/* Live Proctor Status Badges */}
          <div className="hidden lg:flex items-center gap-2 text-xs">
            <span
              title="Camera Active"
              className={`p-1.5 rounded-lg border flex items-center gap-1 ${
                mediaTracks.videoTrack?.readyState === 'live'
                  ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-400'
                  : 'bg-rose-950/40 border-rose-500/40 text-rose-400'
              }`}
            >
              <CameraIcon className="w-3.5 h-3.5" />
            </span>
            <span
              title="Screen Sharing Active"
              className={`p-1.5 rounded-lg border flex items-center gap-1 ${
                mediaTracks.screenTrack?.readyState === 'live'
                  ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-400'
                  : 'bg-rose-950/40 border-rose-500/40 text-rose-400'
              }`}
            >
              <ScreenIcon className="w-3.5 h-3.5" />
            </span>
            {contest.proctoring.requireMic && (
              <span
                title="Microphone Active"
                className={`p-1.5 rounded-lg border flex items-center gap-1 ${
                  mediaTracks.audioTrack?.readyState === 'live'
                    ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-400'
                    : 'bg-rose-950/40 border-rose-500/40 text-rose-400'
                }`}
              >
                <MicIcon className="w-3.5 h-3.5" />
              </span>
            )}
          </div>

          {/* Anti-cheat Risk Indicator */}
          <div
            className={`px-2.5 py-1 rounded-lg border text-xs font-semibold flex items-center gap-1.5 ${
              session.riskMetrics.level === 'high'
                ? 'bg-rose-500/20 border-rose-500/40 text-rose-300'
                : session.riskMetrics.level === 'review'
                ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
            }`}
          >
            <ShieldIcon className="w-3.5 h-3.5" />
            <span>
              Risk: {session.riskMetrics.level.toUpperCase()} ({session.riskMetrics.overallScore}%)
            </span>
          </div>

          <button
            onClick={() => setShowFinishConfirm(true)}
            className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold border border-slate-700 transition"
          >
            Finish Contest
          </button>
        </div>
      </header>

      {/* Temporary Penalty Lockout Overlay */}
      {lockoutRemaining > 0 && (
        <div className="bg-rose-600/90 text-white px-4 py-2 text-xs font-medium flex items-center justify-between border-b border-rose-500 animate-in slide-in-from-top">
          <div className="flex items-center gap-2">
            <AlertTriangleIcon className="w-4 h-4 text-white" />
            <span>
              Proctor Lockout Active due to excessive telemetry anomalies (fullscreen exit or focus loss). Submissions
              temporarily locked for {lockoutRemaining}s.
            </span>
          </div>
          <span className="font-mono font-bold bg-black/40 px-2 py-0.5 rounded text-[11px]">
            Lock remaining: {lockoutRemaining}s
          </span>
        </div>
      )}

      {/* Main 2-Column Split Body */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left Column: Problem Details & Constraints */}
        <div className="w-1/2 border-r border-slate-800 flex flex-col bg-slate-950/40 overflow-y-auto p-6 space-y-6">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-bold text-cyan-400">Problem {String.fromCharCode(65 + activeProblemIndex)}</span>
                <span
                  className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                    activeProblem.difficulty === 'Easy'
                      ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                      : activeProblem.difficulty === 'Medium'
                      ? 'bg-amber-950 text-amber-400 border border-amber-800'
                      : 'bg-rose-950 text-rose-400 border border-rose-800'
                  }`}
                >
                  {activeProblem.difficulty}
                </span>
                <span className="text-xs text-slate-400">({activeProblem.points} pts)</span>
              </div>
              <h1 className="text-xl font-bold text-white tracking-tight">{activeProblem.title}</h1>
            </div>

            <div className="text-right text-[11px] text-slate-400">
              <div>Time Limit: {activeProblem.timeLimitMs}ms</div>
              <div>Memory Limit: {activeProblem.memoryLimitMb}MB</div>
            </div>
          </div>

          {/* Description */}
          <div className="prose prose-invert prose-sm max-w-none text-slate-300 leading-relaxed space-y-4">
            <div className="whitespace-pre-wrap">{activeProblem.description}</div>

            <div>
              <h4 className="text-xs font-bold uppercase text-slate-400 tracking-wider mb-1">Input Format</h4>
              <p className="text-xs text-slate-300 bg-slate-900/60 p-2.5 rounded-lg border border-slate-800/80">
                {activeProblem.inputFormat}
              </p>
            </div>

            <div>
              <h4 className="text-xs font-bold uppercase text-slate-400 tracking-wider mb-1">Output Format</h4>
              <p className="text-xs text-slate-300 bg-slate-900/60 p-2.5 rounded-lg border border-slate-800/80">
                {activeProblem.outputFormat}
              </p>
            </div>

            {/* Public Sample Test Cases */}
            <div>
              <h4 className="text-xs font-bold uppercase text-slate-400 tracking-wider mb-2">Sample Test Cases</h4>
              <div className="space-y-3">
                {activeProblem.sampleTestCases.map((stc, idx) => (
                  <div key={idx} className="rounded-xl border border-slate-800 bg-slate-900/60 overflow-hidden text-xs">
                    <div className="px-3 py-1.5 bg-slate-800/40 border-b border-slate-800 text-slate-400 font-medium">
                      Sample Case {idx + 1}
                    </div>
                    <div className="p-3 grid grid-cols-2 gap-3 font-mono text-[11px]">
                      <div>
                        <span className="text-slate-500 block mb-1 text-[10px] uppercase font-sans">Input</span>
                        <pre className="p-2 rounded bg-black/50 text-cyan-300 overflow-x-auto whitespace-pre">
                          {stc.input}
                        </pre>
                      </div>
                      <div>
                        <span className="text-slate-500 block mb-1 text-[10px] uppercase font-sans">Expected Output</span>
                        <pre className="p-2 rounded bg-black/50 text-emerald-300 overflow-x-auto whitespace-pre">
                          {stc.expectedOutput}
                        </pre>
                      </div>
                    </div>
                    {stc.explanation && (
                      <div className="px-3 pb-2.5 text-[11px] text-slate-400 border-t border-slate-800/50 pt-1.5">
                        <strong className="text-slate-300">Explanation:</strong> {stc.explanation}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Code Editor & Execution Runner */}
        <div className="w-1/2 flex flex-col bg-[#1e1e1e]">
          {/* Editor Controls */}
          <div className="h-10 px-4 bg-slate-900 border-b border-slate-800 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="text-slate-400">Language:</span>
              <select
                value={selectedLanguage}
                onChange={(e) => setSelectedLanguage(e.target.value as any)}
                className="bg-slate-800 border border-slate-700 text-slate-200 rounded px-2 py-0.5 text-xs focus:outline-none focus:border-cyan-500"
              >
                <option value="python">Python 3.11</option>
                <option value="cpp">C++20 (GCC 13)</option>
                <option value="javascript">JavaScript (Node.js 20)</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleRunSampleTests}
                disabled={isRunningSample || isSubmitting}
                className="px-3 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-1.5 font-medium transition cursor-pointer disabled:opacity-50"
              >
                <PlayIcon className="w-3.5 h-3.5 text-emerald-400" />
                {isRunningSample ? 'Running Samples...' : 'Run Samples'}
              </button>

              <button
                onClick={handleSubmitSolution}
                disabled={isSubmitting || isRunningSample || lockoutRemaining > 0}
                className="px-4 py-1 rounded bg-cyan-600 hover:bg-cyan-500 text-white font-semibold flex items-center gap-1.5 shadow-md shadow-cyan-600/30 transition cursor-pointer disabled:opacity-50"
              >
                <CheckIcon className="w-3.5 h-3.5" />
                {isSubmitting ? 'Evaluating Sandbox...' : 'Submit Solution'}
              </button>
            </div>
          </div>

          {/* Monaco Editor Pane */}
          <div className="flex-1 relative">
            <MonacoEditor
              height="100%"
              language={selectedLanguage === 'cpp' ? 'cpp' : selectedLanguage === 'javascript' ? 'javascript' : 'python'}
              theme="vs-dark"
              value={currentCode}
              onChange={(val) => {
                if (lockoutRemaining > 0) return;
                setCodes((prev) => ({
                  ...prev,
                  [activeProblem.id]: {
                    ...prev[activeProblem.id],
                    [selectedLanguage]: val || '',
                  },
                }));
              }}
              options={{
                fontSize: 13,
                fontFamily: "'JetBrains Mono', 'Fira Code', 'Courier New', monospace",
                lineNumbers: 'on',
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                automaticLayout: true,
                cursorBlinking: 'smooth',
                cursorSmoothCaretAnimation: 'on',
                smoothScrolling: true,
                padding: { top: 12 },
              }}
            />
          </div>

          {/* Bottom Execution & Testcase Panel */}
          <div className="h-64 border-t border-slate-800 bg-slate-950 flex flex-col">
            <div className="px-4 py-1.5 bg-slate-900 border-b border-slate-800 flex items-center justify-between text-xs">
              <div className="flex items-center gap-3 font-semibold">
                <span className={activeResultTab === 'submission' ? 'text-cyan-400' : 'text-slate-400'}>
                  {activeResultTab === 'submission' ? 'Sandbox Submission Verdict' : 'Sample Run Results'}
                </span>
                {executionResult && (
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      executionResult.status === 'Accepted'
                        ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                        : 'bg-rose-950 text-rose-400 border border-rose-800'
                    }`}
                  >
                    {executionResult.status} ({executionResult.passedCount || 0}/{executionResult.totalCount || 0} passed)
                  </span>
                )}
              </div>

              {executionResult?.pointsEarned !== undefined && (
                <div className="text-emerald-400 text-xs font-mono font-bold">
                  +{executionResult.pointsEarned} Points
                </div>
              )}
            </div>

            <div className="flex-1 p-3 overflow-y-auto font-mono text-xs space-y-2">
              {!executionResult && !isRunningSample && !isSubmitting && (
                <div className="h-full flex items-center justify-center text-slate-500 font-sans text-xs">
                  Run sample cases or submit solution to execute in sandboxed environment.
                </div>
              )}

              {(isRunningSample || isSubmitting) && (
                <div className="h-full flex flex-col items-center justify-center text-cyan-400 font-sans text-xs gap-2">
                  <div className="w-5 h-5 border-2 border-cyan-500/20 border-t-cyan-400 rounded-full animate-spin" />
                  <span>
                    {isSubmitting ? 'Evaluating against hidden test cases in sandbox...' : 'Compiling sample cases...'}
                  </span>
                </div>
              )}

              {executionResult?.testCaseResults?.map((tc: any) => (
                <div
                  key={tc.testCaseIndex}
                  className={`p-2.5 rounded-lg border ${
                    tc.status === 'AC'
                      ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-300'
                      : 'bg-rose-950/20 border-rose-500/30 text-rose-300'
                  }`}
                >
                  <div className="flex items-center justify-between font-sans text-[11px] mb-1">
                    <span className="font-semibold">
                      Test Case #{tc.testCaseIndex} {tc.isHidden ? '(Hidden Server Case)' : '(Sample)'}
                    </span>
                    <span className="font-mono text-[10px] text-slate-400">
                      {tc.timeMs}ms | {tc.status === 'AC' ? 'PASSED' : tc.status}
                    </span>
                  </div>

                  {!tc.isHidden && (
                    <div className="grid grid-cols-2 gap-2 text-[10px] font-mono mt-1 pt-1 border-t border-slate-800">
                      <div>
                        <span className="text-slate-500 block text-[9px] uppercase font-sans">Your Output</span>
                        <div className="bg-black/40 p-1.5 rounded text-slate-200">{tc.actualOutput || 'None'}</div>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[9px] uppercase font-sans">Expected</span>
                        <div className="bg-black/40 p-1.5 rounded text-emerald-300">{tc.expectedOutput}</div>
                      </div>
                    </div>
                  )}

                  {tc.isHidden && (
                    <div className="text-[10px] text-slate-400 italic">
                      [Input and expected output redacted for contest security and anti-cheat compliance]
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Floating Picture-In-Picture Proctor Camera Mirror */}
      {mediaTracks.videoTrack && (
        <div
          className={`fixed bottom-4 left-4 z-40 bg-slate-900 border border-slate-700/80 rounded-xl shadow-2xl overflow-hidden transition-all ${
            isCameraPipOpen ? 'w-48 h-36' : 'w-10 h-10'
          }`}
        >
          {isCameraPipOpen ? (
            <div className="relative w-full h-full bg-black">
              <video ref={videoElementRef} muted autoPlay playsInline className="w-full h-full object-cover" />
              <div className="absolute top-1.5 left-1.5 flex items-center gap-1 bg-black/60 backdrop-blur-sm px-1.5 py-0.5 rounded text-[9px] text-emerald-400 font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>REC</span>
              </div>
              <button
                onClick={() => setIsCameraPipOpen(false)}
                className="absolute top-1 right-1 bg-black/60 text-slate-300 hover:text-white p-1 rounded text-[10px]"
                title="Minimize Camera Mirror"
              >
                ✕
              </button>
            </div>
          ) : (
            <button
              onClick={() => setIsCameraPipOpen(true)}
              className="w-full h-full flex items-center justify-center text-cyan-400 hover:bg-slate-800"
              title="Expand Camera Mirror"
            >
              <EyeIcon className="w-4 h-4" />
            </button>
          )}
        </div>
      )}

      {/* Finish Contest Confirmation Modal */}
      {showFinishConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl p-6 shadow-2xl text-center space-y-4">
            <div className="w-12 h-12 rounded-xl bg-amber-500/20 text-amber-400 mx-auto flex items-center justify-center">
              <TrophyIcon className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white">Finalize & Submit Contest?</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              You have solved <strong>{solvedProblemsCount}</strong> of <strong>{contest.problems.length}</strong> problems.
              Submitting now will lock your session, record your final standing on the leaderboard, and finalize proctoring logs.
            </p>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={() => setShowFinishConfirm(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 transition"
              >
                Continue Solving
              </button>
              <button
                onClick={handleManualFinish}
                className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 shadow-lg shadow-cyan-500/20 transition cursor-pointer"
              >
                Confirm & Submit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Contest Completed Splash Modal */}
      {contestFinished && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in zoom-in-95">
          <div className="w-full max-w-lg bg-slate-900 border border-emerald-500/40 rounded-2xl p-8 shadow-2xl text-center space-y-5">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 mx-auto flex items-center justify-center">
              <CheckIcon className="w-8 h-8 font-bold" />
            </div>
            <h2 className="text-2xl font-bold text-white">Contest Attempt Sealed</h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              Your solutions and anti-cheat telemetry have been securely synchronized with the CodeForge authoritative server.
            </p>

            <div className="grid grid-cols-3 gap-3 p-4 bg-slate-950/60 rounded-xl border border-slate-800 text-xs">
              <div>
                <span className="text-slate-500 block text-[10px] uppercase">Solved</span>
                <span className="text-base font-bold text-cyan-400">
                  {solvedProblemsCount} / {contest.problems.length}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px] uppercase">Integrity Score</span>
                <span className="text-base font-bold text-emerald-400">
                  {100 - session.riskMetrics.overallScore}%
                </span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px] uppercase">Status</span>
                <span className="text-base font-bold text-purple-400">Submitted</span>
              </div>
            </div>

            <button
              onClick={onExitArena}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-emerald-500/20 transition cursor-pointer"
            >
              Return to Contest Hub
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

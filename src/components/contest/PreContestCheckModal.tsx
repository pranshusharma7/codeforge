import React, { useState, useEffect, useRef } from 'react';
import { Contest } from '../../lib/contestTypes';
import { contestService } from '../../lib/contestService';
import {
  CameraIcon,
  MicIcon,
  ScreenIcon,
  ShieldIcon,
  AlertTriangleIcon,
  LockIcon,
  UserCheckIcon,
  CheckIcon,
} from '../icons';

interface PreContestCheckModalProps {
  contest: Contest;
  user: { id: string; name: string; email?: string } | null;
  isOpen: boolean;
  onClose: () => void;
  onStartSession: (session: any, streamRef: { videoTrack: MediaStreamTrack | null; screenTrack: MediaStreamTrack | null; audioTrack: MediaStreamTrack | null }) => void;
  onOpenAuth: () => void;
}

export const PreContestCheckModal: React.FC<PreContestCheckModalProps> = ({
  contest,
  user,
  isOpen,
  onClose,
  onStartSession,
  onOpenAuth,
}) => {
  const [cameraGranted, setCameraGranted] = useState(false);
  const [micGranted, setMicGranted] = useState(false);
  const [screenGranted, setScreenGranted] = useState(false);
  const [fullscreenGranted, setFullscreenGranted] = useState(false);
  const [activeTab, setActiveTab] = useState<'privacy' | 'hardware'>('privacy');
  const [hasAcknowledgedPrivacy, setHasAcknowledgedPrivacy] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const videoPreviewRef = useRef<HTMLVideoElement | null>(null);
  const videoTrackRef = useRef<MediaStreamTrack | null>(null);
  const audioTrackRef = useRef<MediaStreamTrack | null>(null);
  const screenTrackRef = useRef<MediaStreamTrack | null>(null);

  // Clean up streams when modal closes
  useEffect(() => {
    return () => {
      stopAllMedia();
    };
  }, []);

  const stopAllMedia = () => {
    if (videoTrackRef.current) {
      videoTrackRef.current.stop();
      videoTrackRef.current = null;
    }
    if (audioTrackRef.current) {
      audioTrackRef.current.stop();
      audioTrackRef.current = null;
    }
    if (screenTrackRef.current) {
      screenTrackRef.current.stop();
      screenTrackRef.current = null;
    }
  };

  if (!isOpen) return null;

  // Request Camera
  const handleRequestCamera = async () => {
    try {
      setErrorMsg(null);
      const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 } });
      const track = stream.getVideoTracks()[0];
      videoTrackRef.current = track;
      if (videoPreviewRef.current) {
        videoPreviewRef.current.srcObject = stream;
        videoPreviewRef.current.play().catch(() => {});
      }
      setCameraGranted(true);

      track.onended = () => {
        setCameraGranted(false);
        contestService.recordSecurityEvent('CAMERA_STOPPED', { reason: 'device_disconnected' });
      };
    } catch (err: any) {
      setErrorMsg('Camera access was denied or device is unavailable. Please check browser permissions.');
      setCameraGranted(false);
    }
  };

  // Request Microphone
  const handleRequestMic = async () => {
    try {
      setErrorMsg(null);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const track = stream.getAudioTracks()[0];
      audioTrackRef.current = track;
      setMicGranted(true);

      track.onended = () => {
        setMicGranted(false);
        contestService.recordSecurityEvent('MIC_STOPPED', { reason: 'mic_disconnected' });
      };
    } catch (err: any) {
      setErrorMsg('Microphone access was denied. Please allow audio permission in browser.');
      setMicGranted(false);
    }
  };

  // Request Screen Share
  const handleRequestScreen = async () => {
    try {
      setErrorMsg(null);
      const stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: false });
      const track = stream.getVideoTracks()[0];
      screenTrackRef.current = track;
      setScreenGranted(true);

      track.onended = () => {
        setScreenGranted(false);
        contestService.recordSecurityEvent('SCREEN_SHARE_STOPPED', { reason: 'user_ended_screen_share' });
      };
    } catch (err: any) {
      setErrorMsg('Screen sharing was cancelled or denied. A shared screen/window is required for proctored contests.');
      setScreenGranted(false);
    }
  };

  // Fullscreen trigger
  const handleRequestFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      }
      setFullscreenGranted(true);
    } catch (err: any) {
      setErrorMsg('Fullscreen mode could not be entered. Please enable fullscreen permission.');
    }
  };

  const isAllReady =
    user &&
    hasAcknowledgedPrivacy &&
    (!contest.proctoring.requireCamera || cameraGranted) &&
    (!contest.proctoring.requireMic || micGranted) &&
    (!contest.proctoring.requireScreenShare || screenGranted);

  const handleStart = async () => {
    if (!user) {
      onOpenAuth();
      return;
    }

    if (contest.proctoring.requireFullscreen && !fullscreenGranted) {
      await handleRequestFullscreen();
    }

    setIsStarting(true);
    setErrorMsg(null);

    const result = await contestService.startSession({
      contestId: contest.id,
      user,
      permissions: {
        cameraGranted,
        micGranted,
        screenGranted,
        fullscreenActive: !!document.fullscreenElement || fullscreenGranted,
      },
    });

    setIsStarting(false);

    if (result.error) {
      if (result.code === 'DUPLICATE_SESSION') {
        setErrorMsg('Another active attempt was detected on your account. Click "Force Session Recovery" below if you refreshed your browser.');
      } else {
        setErrorMsg(result.error);
      }
      return;
    }

    if (result.session) {
      onStartSession(result.session, {
        videoTrack: videoTrackRef.current,
        screenTrack: screenTrackRef.current,
        audioTrack: audioTrackRef.current,
      });
      onClose();
    }
  };

  const handleForceRecovery = async () => {
    if (!user) return;
    setIsStarting(true);
    setErrorMsg(null);

    const result = await contestService.startSession({
      contestId: contest.id,
      user,
      permissions: {
        cameraGranted,
        micGranted,
        screenGranted,
        fullscreenActive: true,
      },
      forceRecovery: true,
    });

    setIsStarting(false);
    if (result.session) {
      onStartSession(result.session, {
        videoTrack: videoTrackRef.current,
        screenTrack: screenTrackRef.current,
        audioTrack: audioTrackRef.current,
      });
      onClose();
    } else {
      setErrorMsg(result.error || 'Failed to recover session');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-[#0f172a] border border-cyan-500/30 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 text-white font-bold">
              <ShieldIcon className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white tracking-wide">{contest.title}</h2>
                <span className="text-[11px] font-semibold uppercase px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-400 border border-cyan-800/50">
                  {contest.type === 'competitive' ? 'Contest' : 'Assessment'}
                </span>
              </div>
              <p className="text-xs text-slate-400">Pre-flight Security Verification & Transparency Check</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white text-lg font-mono p-1 rounded-lg hover:bg-slate-800 transition"
          >
            ✕
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-slate-800 bg-slate-950/60 px-6 pt-2">
          <button
            onClick={() => setActiveTab('privacy')}
            className={`pb-2.5 px-4 text-xs font-semibold uppercase tracking-wider border-b-2 transition ${
              activeTab === 'privacy'
                ? 'border-cyan-400 text-cyan-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            1. Transparent Privacy Notice
          </button>
          <button
            onClick={() => setActiveTab('hardware')}
            className={`pb-2.5 px-4 text-xs font-semibold uppercase tracking-wider border-b-2 transition ${
              activeTab === 'hardware'
                ? 'border-cyan-400 text-cyan-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            2. Device & Proctor Check
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 overflow-y-auto space-y-5 text-slate-300 text-sm flex-1">
          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2.5">
              <AlertTriangleIcon className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div className="flex-1">
                <span>{errorMsg}</span>
                {errorMsg.includes('recovery') && (
                  <button
                    onClick={handleForceRecovery}
                    className="block mt-2 px-3 py-1 bg-rose-600 hover:bg-rose-500 text-white font-medium rounded-lg text-xs transition"
                  >
                    Force Session Recovery
                  </button>
                )}
              </div>
            </div>
          )}

          {!user && (
            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center justify-between">
              <div className="flex items-center gap-2">
                <UserCheckIcon className="w-4 h-4 text-amber-400" />
                <span>Authentication is required to bind your contest attempt to your official profile.</span>
              </div>
              <button
                onClick={onOpenAuth}
                className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg transition"
              >
                Sign In
              </button>
            </div>
          )}

          {activeTab === 'privacy' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3">
                <h3 className="font-semibold text-white flex items-center gap-2 text-sm">
                  <ShieldIcon className="w-4 h-4 text-cyan-400" />
                  What Data is Collected & How It is Handled
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  <div className="bg-slate-950/50 p-3 rounded-lg border border-slate-800/80">
                    <span className="text-cyan-400 font-semibold block mb-1">Required Telemetry:</span>
                    <ul className="list-disc list-inside space-y-1 text-slate-400">
                      {(contest.privacyNotice.dataCollected || contest.privacyNotice.whatCollected || []).map((item, idx) => (
                        <li key={idx}>{item}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="bg-slate-950/50 p-3 rounded-lg border border-slate-800/80">
                    <span className="text-cyan-400 font-semibold block mb-1">Purpose & Retention:</span>
                    <p className="text-slate-400 mb-2">{contest.privacyNotice.purpose}</p>
                    <p className="text-slate-400 text-[11px] leading-relaxed">{contest.privacyNotice.retentionPolicy}</p>
                  </div>
                </div>

                <div className="bg-slate-950/50 p-3 rounded-lg border border-slate-800/80 text-xs">
                  <span className="text-cyan-400 font-semibold block mb-1">Access & Refusal Notice:</span>
                  <p className="text-slate-400 mb-1">
                    <strong>Who can inspect:</strong> {contest.privacyNotice.whoHasAccess}
                  </p>
                  <p className="text-slate-400">
                    <strong>If you decline:</strong> {contest.privacyNotice.refusalConsequence}
                  </p>
                </div>
              </div>

              <label className="flex items-center gap-3 p-3 rounded-xl bg-slate-900/60 border border-slate-800 cursor-pointer hover:bg-slate-800/50 transition">
                <input
                  type="checkbox"
                  checked={hasAcknowledgedPrivacy}
                  onChange={(e) => {
                    setHasAcknowledgedPrivacy(e.target.checked);
                    if (e.target.checked) setActiveTab('hardware');
                  }}
                  className="w-4 h-4 rounded text-cyan-500 focus:ring-cyan-500 bg-slate-950 border-slate-700"
                />
                <span className="text-xs text-slate-300">
                  I have read and consent to the transparent proctoring policy for this competitive attempt.
                </span>
              </label>
            </div>
          )}

          {activeTab === 'hardware' && (
            <div className="space-y-4">
              <p className="text-xs text-slate-400">
                Configure your media devices. You will have full visibility of what is monitored at all times.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Camera Card */}
                {contest.proctoring.requireCamera && (
                  <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CameraIcon className="w-4 h-4 text-cyan-400" />
                        <span className="font-semibold text-white text-xs">Webcam Stream</span>
                      </div>
                      {cameraGranted ? (
                        <span className="flex items-center gap-1 text-[11px] text-emerald-400 bg-emerald-950/50 px-2 py-0.5 rounded-full border border-emerald-800/60">
                          <CheckIcon className="w-3 h-3" /> Ready
                        </span>
                      ) : (
                        <span className="text-[11px] text-amber-400 bg-amber-950/50 px-2 py-0.5 rounded-full border border-amber-800/60">
                          Required
                        </span>
                      )}
                    </div>
                    <div className="h-28 rounded-lg bg-black border border-slate-800 overflow-hidden flex items-center justify-center relative">
                      <video
                        ref={videoPreviewRef}
                        muted
                        autoPlay
                        playsInline
                        className={`w-full h-full object-cover ${cameraGranted ? 'block' : 'hidden'}`}
                      />
                      {!cameraGranted && (
                        <div className="text-center p-2">
                          <CameraIcon className="w-6 h-6 text-slate-600 mx-auto mb-1" />
                          <p className="text-[11px] text-slate-500">Camera preview inactive</p>
                        </div>
                      )}
                    </div>
                    <button
                      onClick={handleRequestCamera}
                      className="w-full py-1.5 px-3 rounded-lg bg-cyan-600/30 hover:bg-cyan-600/50 text-cyan-300 border border-cyan-500/40 text-xs font-medium transition"
                    >
                      {cameraGranted ? 'Retest Camera' : 'Enable Camera'}
                    </button>
                  </div>
                )}

                {/* Screen Share Card */}
                {contest.proctoring.requireScreenShare && (
                  <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <ScreenIcon className="w-4 h-4 text-indigo-400" />
                        <span className="font-semibold text-white text-xs">Screen Sharing</span>
                      </div>
                      {screenGranted ? (
                        <span className="flex items-center gap-1 text-[11px] text-emerald-400 bg-emerald-950/50 px-2 py-0.5 rounded-full border border-emerald-800/60">
                          <CheckIcon className="w-3 h-3" /> Active
                        </span>
                      ) : (
                        <span className="text-[11px] text-amber-400 bg-amber-950/50 px-2 py-0.5 rounded-full border border-amber-800/60">
                          Required
                        </span>
                      )}
                    </div>
                    <div className="h-28 rounded-lg bg-black/60 border border-slate-800 p-3 flex flex-col justify-center items-center text-center">
                      <ScreenIcon className="w-6 h-6 text-slate-600 mb-1" />
                      <p className="text-[11px] text-slate-400">
                        Select Entire Screen or CodeForge Window via browser screen share dialog.
                      </p>
                    </div>
                    <button
                      onClick={handleRequestScreen}
                      className="w-full py-1.5 px-3 rounded-lg bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 border border-indigo-500/40 text-xs font-medium transition"
                    >
                      {screenGranted ? 'Re-select Screen' : 'Share Screen'}
                    </button>
                  </div>
                )}

                {/* Microphone Card */}
                {contest.proctoring.requireMic && (
                  <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <MicIcon className="w-4 h-4 text-purple-400" />
                        <span className="font-semibold text-white text-xs">Audio Microphone</span>
                      </div>
                      {micGranted ? (
                        <span className="flex items-center gap-1 text-[11px] text-emerald-400 bg-emerald-950/50 px-2 py-0.5 rounded-full border border-emerald-800/60">
                          <CheckIcon className="w-3 h-3" /> Ready
                        </span>
                      ) : (
                        <span className="text-[11px] text-amber-400 bg-amber-950/50 px-2 py-0.5 rounded-full border border-amber-800/60">
                          Required
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400">
                      Proctoring configuration requires audio monitoring for ambient room sound detection.
                    </p>
                    <button
                      onClick={handleRequestMic}
                      className="w-full py-1.5 px-3 rounded-lg bg-purple-600/30 hover:bg-purple-600/50 text-purple-300 border border-purple-500/40 text-xs font-medium transition"
                    >
                      {micGranted ? 'Microphone Active' : 'Allow Microphone'}
                    </button>
                  </div>
                )}

                {/* Fullscreen Card */}
                {contest.proctoring.requireFullscreen && (
                  <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <LockIcon className="w-4 h-4 text-cyan-400" />
                        <span className="font-semibold text-white text-xs">Fullscreen Lock</span>
                      </div>
                      {fullscreenGranted ? (
                        <span className="flex items-center gap-1 text-[11px] text-emerald-400 bg-emerald-950/50 px-2 py-0.5 rounded-full border border-emerald-800/60">
                          <CheckIcon className="w-3 h-3" /> Confirmed
                        </span>
                      ) : (
                        <span className="text-[11px] text-slate-400 bg-slate-800 px-2 py-0.5 rounded-full">
                          On Launch
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400">
                      The contest will enforce Fullscreen Mode upon entering. Exiting fullscreen logs a telemetry penalty.
                    </p>
                    <button
                      onClick={handleRequestFullscreen}
                      className="w-full py-1.5 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-medium transition"
                    >
                      Test Fullscreen
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-900/90 border-t border-slate-800 flex items-center justify-between">
          <div className="text-xs text-slate-400 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Server Clock Synced</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              Cancel
            </button>
            <button
              onClick={handleStart}
              disabled={!isAllReady || isStarting}
              className={`px-5 py-2 rounded-xl text-xs font-bold tracking-wide uppercase shadow-lg transition flex items-center gap-2 ${
                isAllReady && !isStarting
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white shadow-cyan-500/25 cursor-pointer'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
              }`}
            >
              {isStarting ? (
                <>
                  <span className="w-3 h-3 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  Binding Session...
                </>
              ) : (
                'Enter Contest Arena'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

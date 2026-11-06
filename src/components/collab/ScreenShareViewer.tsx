import React, { useRef, useEffect, useState } from 'react';
import { Monitor, MonitorOff, Maximize2, Minimize2, X, AlertCircle } from 'lucide-react';

interface ScreenShareViewerProps {
  stream: MediaStream | null;
  sharerUsername?: string;
  isMyShare?: boolean;
  onStopShare?: () => void;
  onClose?: () => void;
}

export const ScreenShareViewer: React.FC<ScreenShareViewerProps> = ({
  stream,
  sharerUsername = 'Developer',
  isMyShare = false,
  onStopShare,
  onClose,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  return (
    <div
      ref={containerRef}
      style={{
        background: 'var(--bg-panel)',
        borderColor: 'var(--border)',
        color: 'var(--text-base)',
      }}
      className="w-full h-full flex flex-col rounded-xl border overflow-hidden relative select-none"
    >
      {/* Top control bar */}
      <div
        style={{
          background: 'var(--bg-header)',
          borderColor: 'var(--border)',
        }}
        className="h-10 px-3 border-b flex items-center justify-between gap-2 shrink-0"
      >
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <Monitor className="w-3.5 h-3.5 text-violet-400 shrink-0" />
          <span className="text-xs font-bold truncate">
            {isMyShare ? 'You are sharing your screen' : `${sharerUsername}'s Screen`}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          {isMyShare && onStopShare && (
            <button
              onClick={onStopShare}
              className="px-2.5 py-1 rounded-md bg-red-500/15 hover:bg-red-500/25 border border-red-500/30 text-red-400 text-xs font-semibold flex items-center gap-1 transition-colors"
            >
              <MonitorOff className="w-3.5 h-3.5" />
              <span>Stop Share</span>
            </button>
          )}

          <button
            onClick={toggleFullscreen}
            style={{ color: 'var(--text-muted)' }}
            className="p-1 rounded hover:bg-black/10 transition-colors"
            title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>

          {onClose && (
            <button
              onClick={onClose}
              style={{ color: 'var(--text-muted)' }}
              className="p-1 rounded hover:bg-black/10 transition-colors"
              title="Close Viewer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Video stream container */}
      <div className="flex-1 bg-black flex items-center justify-center overflow-hidden relative">
        {stream ? (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted={isMyShare} // prevent local audio feedback loop
            className="w-full h-full object-contain"
          />
        ) : (
          <div className="text-center p-6 text-slate-500 text-xs flex flex-col items-center gap-2">
            <AlertCircle className="w-8 h-8 text-slate-600" />
            <span>Waiting for video stream...</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default ScreenShareViewer;


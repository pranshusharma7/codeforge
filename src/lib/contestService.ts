// Client-Side Contest & Anti-Cheat Telemetry Engine
// Manages synchronized server time, session lifecycle, media streams,
// browser telemetry events, and sandboxed test execution.

import { ContestSession, SecurityEvent, SecurityEventType } from './contestTypes';

class ContestService {
  private serverTimeOffset = 0; // serverTimestamp - Date.now()
  private isTimeSynced = false;
  private currentSession: ContestSession | null = null;
  private heartbeatInterval: any = null;
  private telemetryListenersAttached = false;
  private onSecurityAlertCallbacks: Array<(event: SecurityEvent) => void> = [];
  private onLockoutCallbacks: Array<(lockedUntil: number) => void> = [];

  constructor() {
    this.syncServerTime();
    this.restoreCachedSession();
  }

  // Authoritative server clock sync
  public async syncServerTime(): Promise<number> {
    try {
      const start = Date.now();
      const res = await fetch('/api/contest/time');
      const roundTrip = Date.now() - start;
      if (res.ok) {
        const data = await res.json();
        // Adjust for network latency (roundTrip / 2)
        const adjustedServerTime = data.timestamp + Math.floor(roundTrip / 2);
        this.serverTimeOffset = adjustedServerTime - Date.now();
        this.isTimeSynced = true;
      }
    } catch {
      // Fallback: zero offset if offline
      this.serverTimeOffset = 0;
    }
    return this.getServerNow();
  }

  // Returns current server-authoritative timestamp in milliseconds
  public getServerNow(): number {
    return Date.now() + this.serverTimeOffset;
  }

  public getSession(): ContestSession | null {
    return this.currentSession;
  }

  private restoreCachedSession() {
    try {
      const saved = localStorage.getItem('cf_contest_session');
      if (saved) {
        this.currentSession = JSON.parse(saved);
      }
    } catch {}
  }

  private saveCachedSession(session: ContestSession | null) {
    this.currentSession = session;
    try {
      if (session) {
        localStorage.setItem('cf_contest_session', JSON.stringify(session));
      } else {
        localStorage.removeItem('cf_contest_session');
      }
    } catch {}
  }

  // Register for contest
  public async registerContest(contestId: string, user: { id: string; name: string; email?: string }): Promise<boolean> {
    try {
      const res = await fetch('/api/contest/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'register',
          contestId,
          userId: user.id,
          userName: user.name,
          userEmail: user.email,
        }),
      });
      return res.ok;
    } catch {
      return true; // Graceful offline/local mode
    }
  }

  // Start secure contest session
  public async startSession(params: {
    contestId: string;
    user: { id: string; name: string; email?: string };
    permissions: {
      cameraGranted: boolean;
      micGranted: boolean;
      screenGranted: boolean;
      fullscreenActive: boolean;
    };
    forceRecovery?: boolean;
  }): Promise<{ session?: ContestSession; error?: string; code?: string }> {
    await this.syncServerTime();

    try {
      const res = await fetch('/api/contest/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'start',
          contestId: params.contestId,
          userId: params.user.id,
          userName: params.user.name,
          userEmail: params.user.email,
          permissions: params.permissions,
          forceRecovery: !!params.forceRecovery,
          deviceInfo: `${navigator.platform} | ${navigator.userAgent.slice(0, 80)}`,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        return { error: data.error || 'Failed to start session', code: data.code };
      }

      this.saveCachedSession(data.session);
      this.startHeartbeat();
      this.attachTelemetryListeners();
      return { session: data.session };
    } catch (err: any) {
      // Local fallback session if network blips
      const fallbackSession: ContestSession = {
        id: 'ses_local_' + Math.random().toString(36).substring(2, 9),
        contestId: params.contestId,
        userId: params.user.id,
        userName: params.user.name,
        userEmail: params.user.email || 'user@codeforge.dev',
        status: 'in_progress',
        startTime: new Date(this.getServerNow()).toISOString(),
        startTimestamp: this.getServerNow(),
        lastHeartbeat: this.getServerNow(),
        ipAddress: '127.0.0.1',
        userAgent: navigator.userAgent,
        deviceInfo: navigator.platform,
        permissions: params.permissions,
        riskMetrics: {
          overallScore: 0,
          level: 'normal',
          totalViolations: 0,
          breakdown: {
            tabSwitches: 0,
            windowBlurs: 0,
            fullscreenExits: 0,
            screenShareDrops: 0,
            cameraDrops: 0,
            micDrops: 0,
            copyPastes: 0,
            devtoolsDetections: 0,
          },
        },
        submissions: [],
      };
      this.saveCachedSession(fallbackSession);
      this.attachTelemetryListeners();
      return { session: fallbackSession };
    }
  }

  // Heartbeat to keep session alive and detect remote locks
  private startHeartbeat() {
    if (this.heartbeatInterval) clearInterval(this.heartbeatInterval);
    this.heartbeatInterval = setInterval(async () => {
      if (!this.currentSession || this.currentSession.status !== 'in_progress') return;

      try {
        const res = await fetch('/api/contest/session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'heartbeat',
            sessionId: this.currentSession.id,
            contestId: this.currentSession.contestId,
          }),
        });

        if (res.ok) {
          const data = await res.json();
          if (data.isLocked && data.lockedUntil) {
            this.currentSession.lockedUntil = data.lockedUntil;
            this.notifyLockout(data.lockedUntil);
          }
        }
      } catch {}
    }, 15000);
  }

  // End / submit contest
  public async finishContest(): Promise<boolean> {
    if (!this.currentSession) return false;
    try {
      await fetch('/api/contest/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'submit_contest',
          sessionId: this.currentSession.id,
          contestId: this.currentSession.contestId,
        }),
      });
      if (this.currentSession) {
        this.currentSession.status = 'submitted';
        this.saveCachedSession(this.currentSession);
      }
    } catch {}

    this.detachTelemetryListeners();
    if (this.heartbeatInterval) clearInterval(this.heartbeatInterval);
    return true;
  }

  // Record a security event with risk telemetry
  public async recordSecurityEvent(
    type: SecurityEventType,
    metadata: Record<string, any> = {}
  ): Promise<void> {
    if (!this.currentSession) return;

    const event: SecurityEvent = {
      id: 'sec_' + Math.random().toString(36).substring(2, 8),
      contestId: this.currentSession.contestId,
      sessionId: this.currentSession.id,
      userId: this.currentSession.userId,
      type,
      timestamp: new Date(this.getServerNow()).toISOString(),
      metadata,
    };

    // Notify registered UI alerts
    this.notifySecurityAlert(event);

    // Update local risk metrics immediately for instant UI feedback
    const bd = this.currentSession.riskMetrics.breakdown;
    if (type === 'TAB_SWITCH') bd.tabSwitches++;
    if (type === 'WINDOW_BLUR') bd.windowBlurs++;
    if (type === 'FULLSCREEN_EXIT') bd.fullscreenExits++;
    if (type === 'SCREEN_SHARE_STOPPED') bd.screenShareDrops++;
    if (type === 'CAMERA_STOPPED') bd.cameraDrops++;
    if (type === 'MIC_STOPPED') bd.micDrops++;
    if (type === 'PASTE_EVENT' || type === 'LARGE_PASTE') bd.copyPastes++;
    if (type === 'DEVTOOLS_OPENED') bd.devtoolsDetections++;
    this.currentSession.riskMetrics.totalViolations++;

    const weightMap: Record<string, number> = {
      SCREEN_SHARE_STOPPED: 35,
      CAMERA_STOPPED: 30,
      MIC_STOPPED: 20,
      FULLSCREEN_EXIT: 15,
      TAB_SWITCH: 12,
      WINDOW_BLUR: 8,
      LARGE_PASTE: 25,
      PASTE_EVENT: 10,
      COPY_EVENT: 5,
      DEVTOOLS_OPENED: 30,
    };

    const addScore = weightMap[type] || 5;
    this.currentSession.riskMetrics.overallScore = Math.min(100, this.currentSession.riskMetrics.overallScore + addScore);
    const score = this.currentSession.riskMetrics.overallScore;
    this.currentSession.riskMetrics.level = score >= 60 ? 'high' : score >= 30 ? 'review' : 'normal';

    this.saveCachedSession(this.currentSession);

    // Transmit to authoritative server
    try {
      const res = await fetch('/api/contest/telemetry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: this.currentSession.id,
          contestId: this.currentSession.contestId,
          userId: this.currentSession.userId,
          event: type,
          metadata,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.lockedUntil) {
          this.currentSession.lockedUntil = data.lockedUntil;
          this.notifyLockout(data.lockedUntil);
        }
      }
    } catch {}
  }

  // Telemetry event listeners setup
  public attachTelemetryListeners() {
    if (this.telemetryListenersAttached || typeof window === 'undefined') return;
    this.telemetryListenersAttached = true;

    // 1. Visibility change
    document.addEventListener('visibilitychange', this.handleVisibilityChange);

    // 2. Window Blur / Focus
    window.addEventListener('blur', this.handleWindowBlur);
    window.addEventListener('focus', this.handleWindowFocus);

    // 3. Fullscreen exit detection
    document.addEventListener('fullscreenchange', this.handleFullscreenChange);

    // 4. Clipboard operations
    document.addEventListener('copy', this.handleCopy);
    document.addEventListener('paste', this.handlePaste);

    // 5. Devtools shortcut inspection
    window.addEventListener('keydown', this.handleKeydown);
  }

  public detachTelemetryListeners() {
    if (!this.telemetryListenersAttached || typeof window === 'undefined') return;
    this.telemetryListenersAttached = false;

    document.removeEventListener('visibilitychange', this.handleVisibilityChange);
    window.removeEventListener('blur', this.handleWindowBlur);
    window.removeEventListener('focus', this.handleWindowFocus);
    document.removeEventListener('fullscreenchange', this.handleFullscreenChange);
    document.removeEventListener('copy', this.handleCopy);
    document.removeEventListener('paste', this.handlePaste);
    window.removeEventListener('keydown', this.handleKeydown);
  }

  private handleVisibilityChange = () => {
    if (document.hidden) {
      this.recordSecurityEvent('TAB_SWITCH', { action: 'hidden' });
    }
  };

  private handleWindowBlur = () => {
    this.recordSecurityEvent('WINDOW_BLUR', { reason: 'window_lost_focus' });
  };

  private handleWindowFocus = () => {
    // Focus recovered
  };

  private handleFullscreenChange = () => {
    if (!document.fullscreenElement) {
      this.recordSecurityEvent('FULLSCREEN_EXIT', { reason: 'user_exited_fullscreen' });
    }
  };

  private handleCopy = (e: ClipboardEvent) => {
    this.recordSecurityEvent('COPY_EVENT', {
      length: window.getSelection()?.toString().length || 0,
    });
  };

  private handlePaste = (e: ClipboardEvent) => {
    const text = e.clipboardData?.getData('text') || '';
    if (text.length > 80) {
      this.recordSecurityEvent('LARGE_PASTE', { length: text.length, snippet: text.slice(0, 30) });
    } else {
      this.recordSecurityEvent('PASTE_EVENT', { length: text.length });
    }
  };

  private handleKeydown = (e: KeyboardEvent) => {
    // Detect F12 or Cmd+Opt+I / Ctrl+Shift+I
    if (
      e.key === 'F12' ||
      ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'I' || e.key === 'i' || e.key === 'J' || e.key === 'j' || e.key === 'C' || e.key === 'c'))
    ) {
      this.recordSecurityEvent('DEVTOOLS_OPENED', { key: e.key });
    }
  };

  // Submit code to server-side runner
  public async submitSolution(params: {
    contestId: string;
    problemId: string;
    userId: string;
    code: string;
    language: string;
    isSampleOnly?: boolean;
  }) {
    const res = await fetch('/api/contest/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId: this.currentSession?.id || 'sample-session',
        contestId: params.contestId,
        problemId: params.problemId,
        userId: params.userId,
        code: params.code,
        language: params.language,
        isSampleOnly: !!params.isSampleOnly,
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Submission failed');
    }

    return await res.json();
  }

  // Subscribe to security alerts for UI display
  public onSecurityAlert(cb: (event: SecurityEvent) => void) {
    this.onSecurityAlertCallbacks.push(cb);
    return () => {
      this.onSecurityAlertCallbacks = this.onSecurityAlertCallbacks.filter(c => c !== cb);
    };
  }

  private notifySecurityAlert(event: SecurityEvent) {
    this.onSecurityAlertCallbacks.forEach(cb => cb(event));
  }

  public onLockout(cb: (lockedUntil: number) => void) {
    this.onLockoutCallbacks.push(cb);
    return () => {
      this.onLockoutCallbacks = this.onLockoutCallbacks.filter(c => c !== cb);
    };
  }

  private notifyLockout(lockedUntil: number) {
    this.onLockoutCallbacks.forEach(cb => cb(lockedUntil));
  }

  public clearSession() {
    this.detachTelemetryListeners();
    if (this.heartbeatInterval) clearInterval(this.heartbeatInterval);
    this.saveCachedSession(null);
  }
}

export const contestService = new ContestService();

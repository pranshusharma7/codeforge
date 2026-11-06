export interface VoiceState {
  isJoined: boolean
  inVoice: boolean
  isMuted: boolean
  isDeafened: boolean
  isSpeaking: boolean
  hasPermission: boolean
  error?: string
}

export type VoiceStateListener = (state: VoiceState) => void
export type SpeakingListener = (speakingUserIds: Set<string>) => void

export class WebRTCVoiceManager {
  private roomId: string
  private userId: string
  private username: string
  private localStream: MediaStream | null = null
  private audioContext: AudioContext | null = null
  private analyser: AnalyserNode | null = null
  private animFrameId: number | null = null
  private channel: BroadcastChannel
  private isJoined = false
  private isMuted = false
  private isDeafened = false
  private isSpeaking = false
  private speakingUsers = new Set<string>()
  private stateListeners: Set<VoiceStateListener> = new Set()
  private speakingListeners: Set<SpeakingListener> = new Set()

  constructor(roomId: string, userId: string, username: string) {
    this.roomId = roomId
    this.userId = userId
    this.username = username
    this.channel = new BroadcastChannel(`cf_voice_${roomId}`)
    this.channel.onmessage = this.handleSignalingMessage.bind(this)
  }

  public async joinVoice(): Promise<boolean> {
    if (this.isJoined) return true

    try {
      // 1. Explicit user audio permission request
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
        video: false,
      })

      this.localStream = stream
      this.isJoined = true
      this.isMuted = false
      this.isDeafened = false

      // 2. Setup AudioContext & Analyser for speaking indicator
      this.setupVolumeAnalysis(stream)

      // 3. Broadcast to room that user joined voice
      this.channel.postMessage({
        type: 'voice-joined',
        roomId: this.roomId,
        userId: this.userId,
        username: this.username,
      })

      this.notifyState()
      return true
    } catch (err: any) {
      console.warn('Microphone permission denied or failed:', err)
      this.notifyState(err.message || 'Microphone access denied')
      return false
    }
  }

  public leaveVoice() {
    if (!this.isJoined) return

    // Stop all audio tracks
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop())
      this.localStream = null
    }

    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId)
      this.animFrameId = null
    }

    if (this.audioContext) {
      try { this.audioContext.close() } catch {}
      this.audioContext = null
    }

    this.isJoined = false
    this.isSpeaking = false
    this.speakingUsers.delete(this.userId)

    this.channel.postMessage({
      type: 'voice-left',
      roomId: this.roomId,
      userId: this.userId,
    })

    this.notifyState()
    this.notifySpeaking()
  }

  public toggleMute(): boolean {
    if (!this.localStream) return false
    const audioTrack = this.localStream.getAudioTracks()[0]
    if (!audioTrack) return false

    this.isMuted = !this.isMuted
    audioTrack.enabled = !this.isMuted

    this.channel.postMessage({
      type: 'voice-mute-change',
      roomId: this.roomId,
      userId: this.userId,
      isMuted: this.isMuted,
    })

    this.notifyState()
    return this.isMuted
  }

  public toggleDeafen(): boolean {
    this.isDeafened = !this.isDeafened
    // If deafened, mute local mic as well
    if (this.isDeafened && !this.isMuted) {
      this.toggleMute()
    }

    this.notifyState()
    return this.isDeafened
  }

  private setupVolumeAnalysis(stream: MediaStream) {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext
      if (!AudioCtx) return

      this.audioContext = new AudioCtx()
      const source = this.audioContext.createMediaStreamSource(stream)
      this.analyser = this.audioContext.createAnalyser()
      this.analyser.fftSize = 256
      source.connect(this.analyser)

      const buffer = new Uint8Array(this.analyser.frequencyBinCount)

      const checkVolume = () => {
        if (!this.isJoined || !this.analyser) return

        this.analyser.getByteFrequencyData(buffer)
        let sum = 0
        for (let i = 0; i < buffer.length; i++) {
          sum += buffer[i]
        }
        const average = sum / buffer.length

        // Speaking threshold
        const isSpeakingNow = !this.isMuted && average > 14

        if (isSpeakingNow !== this.isSpeaking) {
          this.isSpeaking = isSpeakingNow
          if (isSpeakingNow) {
            this.speakingUsers.add(this.userId)
          } else {
            this.speakingUsers.delete(this.userId)
          }

          this.channel.postMessage({
            type: 'voice-speaking',
            roomId: this.roomId,
            userId: this.userId,
            isSpeaking: isSpeakingNow,
          })

          this.notifyState()
          this.notifySpeaking()
        }

        this.animFrameId = requestAnimationFrame(checkVolume)
      }

      checkVolume()
    } catch (e) {
      console.warn('AudioContext volume analysis error:', e)
    }
  }

  private handleSignalingMessage(e: MessageEvent) {
    if (!e.data || e.data.roomId !== this.roomId) return
    const data = e.data

    if (data.type === 'voice-speaking' && data.userId) {
      if (data.isSpeaking) {
        this.speakingUsers.add(data.userId)
      } else {
        this.speakingUsers.delete(data.userId)
      }
      this.notifySpeaking()
    } else if (data.type === 'voice-left' && data.userId) {
      this.speakingUsers.delete(data.userId)
      this.notifySpeaking()
    }
  }

  public subscribe(listener: VoiceStateListener): () => void {
    return this.subscribeState(listener)
  }

  public subscribeState(listener: VoiceStateListener): () => void {
    this.stateListeners.add(listener)
    listener(this.getState())
    return () => this.stateListeners.delete(listener)
  }

  public subscribeSpeaking(listener: SpeakingListener): () => void {
    this.speakingListeners.add(listener)
    listener(new Set(this.speakingUsers))
    return () => this.speakingListeners.delete(listener)
  }

  public getState(): VoiceState {
    return {
      isJoined: this.isJoined,
      inVoice: this.isJoined,
      isMuted: this.isMuted,
      isDeafened: this.isDeafened,
      isSpeaking: this.isSpeaking,
      hasPermission: this.localStream !== null,
    }
  }

  private notifyState(error?: string) {
    const s = { ...this.getState(), error }
    this.stateListeners.forEach(l => l(s))
  }

  private notifySpeaking() {
    const copy = new Set(this.speakingUsers)
    this.speakingListeners.forEach(l => l(copy))
  }

  public destroy() {
    this.leaveVoice()
    this.channel.close()
    this.stateListeners.clear()
    this.speakingListeners.clear()
  }
}

let activeVoiceManager: WebRTCVoiceManager | null = null

export function getVoiceManager(roomId?: string, userId?: string, username?: string): WebRTCVoiceManager {
  if (roomId && userId && username) {
    if (!activeVoiceManager || (activeVoiceManager as any).roomId !== roomId) {
      activeVoiceManager?.destroy()
      activeVoiceManager = new WebRTCVoiceManager(roomId, userId, username)
    }
  }
  if (!activeVoiceManager) {
    activeVoiceManager = new WebRTCVoiceManager(roomId || 'default_room', userId || 'user_anon', username || 'Anonymous')
  }
  return activeVoiceManager
}

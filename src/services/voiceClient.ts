import {
  Room,
  RoomEvent,
  Track,
  createLocalAudioTrack,
  type LocalAudioTrack,
  type RemoteParticipant,
  type RemoteTrack,
  type TranscriptionSegment,
} from 'livekit-client'
import type { LiveKitSession, VoiceUiState } from '../types/chat'

const JOIN_ATTEMPTS = 3
const RETRY_MS = 850
const SPEAKING_LEVEL = 0.015
const ANALYSER_SPEAKING_PEAK = 12

export function normalizeLiveKitUrl(raw: string): string {
  let url = raw.trim()
  if (url.startsWith('https://')) url = `wss://${url.slice('https://'.length)}`
  else if (url.startsWith('http://')) url = `ws://${url.slice('http://'.length)}`
  url = url.replace(/\/rtc\/?$/i, '').replace(/\/+$/, '')
  const parsed = new URL(url)
  if (parsed.protocol !== 'wss:' && parsed.protocol !== 'ws:') {
    throw new Error(`Unsupported LiveKit URL protocol: ${parsed.protocol}`)
  }
  return url
}

export type VoiceClientCallbacks = {
  onState: (state: VoiceUiState) => void
  onError: (message: string) => void
  onTranscription: (entry: {
    id: string
    speaker: 'user' | 'assistant'
    content: string
    final: boolean
  }) => void
}

type RemoteAudioMonitor = {
  el: HTMLAudioElement
  context: AudioContext | null
  analyser: AnalyserNode | null
  data: Uint8Array<ArrayBuffer> | null
}

export class LiveKitVoiceClient {
  private room: Room | null = null
  private monitors: RemoteAudioMonitor[] = []
  private callbacks: VoiceClientCallbacks
  private muted = false
  private connected = false
  private remoteSpeaking = false
  private localSpeaking = false
  private levelTimer: number | null = null
  private localAudioTrack: LocalAudioTrack | null = null

  constructor(callbacks: VoiceClientCallbacks) {
    this.callbacks = callbacks
  }

  async connect(session: LiveKitSession) {
    this.callbacks.onState('connecting')

    const livekitUrl = normalizeLiveKitUrl(session.url)
    let lastError: unknown

    for (let attempt = 1; attempt <= JOIN_ATTEMPTS; attempt += 1) {
      let localTrack: LocalAudioTrack | null = null
      try {
        localTrack = await createLocalAudioTrack({
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        })

        const room = new Room({
          adaptiveStream: true,
          dynacast: true,
          audioCaptureDefaults: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
        })
        this.bindRoom(room)
        await room.connect(livekitUrl, session.token, { autoSubscribe: true })
        await room.startAudio().catch(() => undefined)
        await room.localParticipant.publishTrack(localTrack, {
          source: Track.Source.Microphone,
        })

        const mic = room.localParticipant.getTrackPublication(Track.Source.Microphone)
        if (!mic?.track) {
          throw new Error(
            'Microphone could not be published to the call. Check browser permission and try again.',
          )
        }

        this.localAudioTrack = localTrack
        localTrack = null
        this.room = room
        this.connected = true
        this.muted = false
        this.startLevelMonitor()
        this.emitCallState()
        return
      } catch (error) {
        lastError = error
        localTrack?.stop()
        this.teardownRoom(false)
        if (attempt >= JOIN_ATTEMPTS) break
        await new Promise((resolve) => setTimeout(resolve, RETRY_MS * attempt))
      }
    }

    const message =
      lastError instanceof Error ? lastError.message : 'LiveKit connect failed'
    this.callbacks.onError(message)
    this.callbacks.onState('error')
    throw lastError instanceof Error ? lastError : new Error(message)
  }

  async setMuted(muted: boolean) {
    this.muted = muted
    if (this.localAudioTrack) {
      if (muted) this.localAudioTrack.mute()
      else await this.localAudioTrack.unmute()
    } else if (this.room) {
      await this.room.localParticipant.setMicrophoneEnabled(!muted)
    }
    this.emitCallState()
  }

  isMuted() {
    return this.muted
  }

  /** Keep the local mic live so the agent can hear the next turn after a reply. */
  async resumeListening() {
    if (!this.connected || !this.room || this.muted) {
      this.emitCallState()
      return
    }

    try {
      if (this.localAudioTrack) {
        await this.localAudioTrack.unmute()
      }
      await this.room.localParticipant.setMicrophoneEnabled(true)
      const mic = this.room.localParticipant.getTrackPublication(Track.Source.Microphone)
      if (!mic?.track && this.localAudioTrack) {
        await this.room.localParticipant.publishTrack(this.localAudioTrack, {
          source: Track.Source.Microphone,
        })
      }
    } catch {
      /* best-effort — call can continue even if republish races */
    }

    this.refreshSpeakingFromRoom()
    this.emitCallState()
  }

  async disconnect() {
    this.teardownRoom(true)
    this.callbacks.onState('disconnected')
  }

  private bindRoom(room: Room) {
    room.on(RoomEvent.Reconnecting, () => {
      this.callbacks.onState('connecting')
    })
    room.on(RoomEvent.Reconnected, () => {
      this.connected = true
      void room.startAudio().catch(() => undefined)
      this.emitCallState()
    })
    room.on(RoomEvent.MediaDevicesError, (error: Error) => {
      this.callbacks.onError(error.message || 'A media device error occurred.')
    })
    room.on(RoomEvent.AudioPlaybackStatusChanged, () => {
      if (!room.canPlaybackAudio) {
        void room.startAudio().catch(() => undefined)
      }
    })
    room.on(RoomEvent.Disconnected, () => {
      this.connected = false
      this.teardownRoom(false)
      this.callbacks.onState('disconnected')
    })

    room.on(
      RoomEvent.TrackSubscribed,
      (track: RemoteTrack, _pub, _participant: RemoteParticipant) => {
        if (track.kind !== Track.Kind.Audio) return
        const el = track.attach() as HTMLAudioElement
        el.autoplay = true
        el.setAttribute('playsinline', 'true')
        el.style.display = 'none'
        document.body.appendChild(el)
        void el.play().catch(() => {
          void room.startAudio().then(() => el.play().catch(() => undefined))
        })

        const monitor: RemoteAudioMonitor = {
          el,
          context: null,
          analyser: null,
          data: null,
        }
        this.setupAnalyser(monitor, track)
        this.monitors.push(monitor)
      },
    )

    room.on(RoomEvent.TrackUnsubscribed, (track: RemoteTrack) => {
      track.detach().forEach((el) => {
        try {
          el.remove()
        } catch {
          /* ignore */
        }
      })
      this.monitors = this.monitors.filter((monitor) => {
        if (monitor.el.isConnected) return true
        void monitor.context?.close()
        return false
      })
    })

    room.on(RoomEvent.ActiveSpeakersChanged, () => {
      this.refreshSpeakingFromRoom()
      this.emitCallState()
    })

    room.on(
      RoomEvent.TranscriptionReceived,
      (segments: TranscriptionSegment[], participant) => {
        const speaker: 'user' | 'assistant' = participant?.isLocal ? 'user' : 'assistant'
        for (const segment of segments) {
          const content = segment.text.trim()
          if (!content) continue
          this.callbacks.onTranscription({
            id: `${speaker}:${segment.id}`,
            speaker,
            content,
            final: segment.final,
          })
        }
      },
    )
  }

  private setupAnalyser(monitor: RemoteAudioMonitor, track: RemoteTrack) {
    try {
      const mediaTrack = track.mediaStreamTrack
      if (!mediaTrack) return
      const context = new AudioContext()
      const source = context.createMediaStreamSource(new MediaStream([mediaTrack]))
      const analyser = context.createAnalyser()
      analyser.fftSize = 512
      analyser.smoothingTimeConstant = 0.4
      source.connect(analyser)
      monitor.context = context
      monitor.analyser = analyser
      monitor.data = new Uint8Array(analyser.frequencyBinCount)
      void context.resume().catch(() => undefined)
    } catch {
      /* analyser is best-effort */
    }
  }

  private remoteAnalyserSpeaking() {
    let speaking = false
    for (const monitor of this.monitors) {
      if (!monitor.analyser || !monitor.data) continue
      monitor.analyser.getByteFrequencyData(monitor.data)
      let peak = 0
      for (const value of monitor.data) {
        if (value > peak) peak = value
      }
      if (peak >= ANALYSER_SPEAKING_PEAK) speaking = true
    }
    return speaking
  }

  private refreshSpeakingFromRoom() {
    const room = this.room
    if (!room) {
      this.localSpeaking = false
      this.remoteSpeaking = false
      return
    }
    const localId = room.localParticipant.identity
    this.localSpeaking = room.activeSpeakers.some(
      (speaker) => speaker.identity === localId && speaker.audioLevel >= SPEAKING_LEVEL,
    )
    const remoteFromSpeakers = room.activeSpeakers.some(
      (speaker) => speaker.identity !== localId && speaker.audioLevel >= SPEAKING_LEVEL,
    )
    const wasRemoteSpeaking = this.remoteSpeaking
    this.remoteSpeaking = remoteFromSpeakers || this.remoteAnalyserSpeaking()
    if (wasRemoteSpeaking && !this.remoteSpeaking && !this.muted) {
      void this.resumeListening()
    }
  }

  private startLevelMonitor() {
    this.stopLevelMonitor()
    this.levelTimer = window.setInterval(() => {
      if (!this.connected || !this.room) return
      const previousLocal = this.localSpeaking
      const previousRemote = this.remoteSpeaking
      this.refreshSpeakingFromRoom()
      if (previousLocal !== this.localSpeaking || previousRemote !== this.remoteSpeaking) {
        this.emitCallState()
      }
    }, 180)
  }

  private stopLevelMonitor() {
    if (this.levelTimer !== null) {
      window.clearInterval(this.levelTimer)
      this.levelTimer = null
    }
  }

  private emitCallState() {
    if (!this.connected) return
    if (this.muted) {
      this.callbacks.onState('muted')
      return
    }
    if (this.remoteSpeaking) {
      this.callbacks.onState('speaking')
      return
    }
    if (this.localSpeaking) {
      this.callbacks.onState('listening')
      return
    }
    this.callbacks.onState('connected')
  }

  private teardownRoom(_disconnect: boolean) {
    this.stopLevelMonitor()
    for (const monitor of this.monitors) {
      try {
        monitor.el.pause()
        monitor.el.srcObject = null
        monitor.el.remove()
      } catch {
        /* ignore */
      }
      void monitor.context?.close()
    }
    this.monitors = []
    const localTrack = this.localAudioTrack
    this.localAudioTrack = null
    try {
      localTrack?.stop()
    } catch {
      /* ignore */
    }
    const room = this.room
    this.room = null
    this.connected = false
    this.remoteSpeaking = false
    this.localSpeaking = false
    if (room) {
      try {
        void room.disconnect()
      } catch {
        /* ignore */
      }
    }
  }
}

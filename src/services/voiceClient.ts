import {
  Room,
  RoomEvent,
  Track,
  type RemoteParticipant,
  type RemoteTrack,
} from 'livekit-client'
import type { LiveKitSession, VoiceUiState } from '../types/chat'

const JOIN_ATTEMPTS = 3
const RETRY_MS = 850

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
}

export class LiveKitVoiceClient {
  private room: Room | null = null
  private audioEls: HTMLAudioElement[] = []
  private callbacks: VoiceClientCallbacks
  private muted = false
  private connected = false
  private remoteSpeaking = false
  private localSpeaking = false
  private permissionStream: MediaStream | null = null

  constructor(callbacks: VoiceClientCallbacks) {
    this.callbacks = callbacks
  }

  async connect(session: LiveKitSession) {
    this.callbacks.onState('connecting')
    await this.requestMicrophone()

    const livekitUrl = normalizeLiveKitUrl(session.url)
    let lastError: unknown

    for (let attempt = 1; attempt <= JOIN_ATTEMPTS; attempt += 1) {
      try {
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
        await room.localParticipant.setMicrophoneEnabled(true)
        this.room = room
        this.connected = true
        this.muted = false
        this.emitCallState()
        return
      } catch (error) {
        lastError = error
        this.teardownRoom(false)
        if (attempt >= JOIN_ATTEMPTS) break
        await new Promise((resolve) => setTimeout(resolve, RETRY_MS * attempt))
      }
    }

    this.releaseMicrophone()
    const message =
      lastError instanceof Error ? lastError.message : 'LiveKit connect failed'
    this.callbacks.onError(message)
    this.callbacks.onState('error')
    throw lastError instanceof Error ? lastError : new Error(message)
  }

  async setMuted(muted: boolean) {
    this.muted = muted
    if (this.room) {
      await this.room.localParticipant.setMicrophoneEnabled(!muted)
    }
    this.emitCallState()
  }

  isMuted() {
    return this.muted
  }

  async disconnect() {
    this.teardownRoom(true)
    this.releaseMicrophone()
    this.callbacks.onState('disconnected')
  }

  private async requestMicrophone() {
    this.permissionStream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
      video: false,
    })
    for (const track of this.permissionStream.getTracks()) {
      track.stop()
    }
    this.permissionStream = null
  }

  private releaseMicrophone() {
    if (this.permissionStream) {
      for (const track of this.permissionStream.getTracks()) track.stop()
      this.permissionStream = null
    }
  }

  private bindRoom(room: Room) {
    room.on(RoomEvent.Reconnecting, () => {
      this.callbacks.onState('connecting')
    })
    room.on(RoomEvent.Reconnected, () => {
      this.connected = true
      this.emitCallState()
    })
    room.on(RoomEvent.MediaDevicesError, (error: Error) => {
      this.callbacks.onError(error.message || 'A media device error occurred.')
    })
    room.on(RoomEvent.Disconnected, () => {
      this.connected = false
      this.teardownRoom(false)
      this.releaseMicrophone()
      this.callbacks.onState('disconnected')
    })

    room.on(
      RoomEvent.TrackSubscribed,
      (track: RemoteTrack, _pub, _participant: RemoteParticipant) => {
        if (track.kind !== Track.Kind.Audio) return
        const el = track.attach() as HTMLAudioElement
        el.autoplay = true
        el.style.display = 'none'
        document.body.appendChild(el)
        el.addEventListener('playing', () => {
          this.remoteSpeaking = true
          this.emitCallState()
        })
        el.addEventListener('pause', () => {
          this.remoteSpeaking = false
          this.emitCallState()
        })
        el.addEventListener('ended', () => {
          this.remoteSpeaking = false
          this.emitCallState()
        })
        void el.play().catch(() => {
          /* autoplay may require a prior user gesture — the call button is that gesture */
        })
        this.audioEls.push(el)
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
    })

    room.on(RoomEvent.ActiveSpeakersChanged, (speakers) => {
      const localId = room.localParticipant.identity
      this.localSpeaking = speakers.some((s) => s.identity === localId)
      this.remoteSpeaking = speakers.some((s) => s.identity !== localId)
      this.emitCallState()
    })
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
    this.callbacks.onState('listening')
  }

  private teardownRoom(disconnect: boolean) {
    for (const el of this.audioEls) {
      try {
        el.pause()
        el.srcObject = null
        el.remove()
      } catch {
        /* ignore */
      }
    }
    this.audioEls = []
    const room = this.room
    this.room = null
    this.connected = false
    this.remoteSpeaking = false
    this.localSpeaking = false
    if (disconnect && room) {
      try {
        void room.disconnect()
      } catch {
        /* ignore */
      }
    }
  }
}

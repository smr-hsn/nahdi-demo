import { useEffect, useState } from 'react'
import { Mic, MicOff, Minimize2, Phone, PhoneOff, X } from 'lucide-react'
import type { VoiceUiState } from '../../types/chat'

const LIVE_STATES: VoiceUiState[] = [
  'connecting',
  'connected',
  'listening',
  'speaking',
  'muted',
]

function statusLabel(state: VoiceUiState): string {
  switch (state) {
    case 'connecting':
      return 'Connecting'
    case 'connected':
      return 'Connected'
    case 'listening':
      return 'Listening'
    case 'speaking':
      return 'Assistant speaking'
    case 'muted':
      return 'Muted'
    case 'error':
      return 'Error'
    case 'disconnected':
      return 'Disconnected'
    default:
      return 'Ready'
  }
}

type CallToAssistantProps = {
  voiceState: VoiceUiState
  voiceError: string | null
  muted: boolean
  callStartedAt: number | null
  onStartCall: () => void
  onEndCall: () => void
  onToggleMute: () => void
}

export function CallToAssistant({
  voiceState,
  voiceError,
  muted,
  callStartedAt,
  onStartCall,
  onEndCall,
  onToggleMute,
}: CallToAssistantProps) {
  const inCall = LIVE_STATES.includes(voiceState)
  const isConnecting = voiceState === 'connecting'

  return (
    <div className="border-b border-white/10 bg-gradient-to-r from-navy-950 via-navy-900 to-navy-800 px-4 py-3.5 sm:px-5">
      <div className="flex items-center gap-3">
        <span
          className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${
            inCall && !isConnecting
              ? 'bg-coral-500 text-white shadow-glow'
              : 'bg-white/10 text-gold-400'
          }`}
          aria-hidden
        >
          {inCall && !isConnecting ? (
            <PhoneOff className="size-4" />
          ) : (
            <Phone className="size-4" />
          )}
        </span>

        <div className="min-w-0 flex-1">
          <p className="font-display text-[1.2rem] font-semibold leading-none text-white">
            Call to Assistant
          </p>
          <p className="mt-1.5 flex items-center gap-1.5 text-[11px] text-blush-100/70">
            <span className="relative flex size-1.5">
              {inCall && (
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-coral-400 opacity-70" />
              )}
              <span
                className={`relative inline-flex size-1.5 rounded-full ${
                  voiceState === 'error' ? 'bg-red-400' : 'bg-emerald-400'
                }`}
              />
            </span>
            {statusLabel(voiceState)}
            {callStartedAt && inCall && !isConnecting ? (
              <CallTimer startedAt={callStartedAt} />
            ) : (
              <span className="text-blush-100/50">· Voice</span>
            )}
          </p>
        </div>

        {inCall ? (
          <div className="flex shrink-0 flex-col items-end gap-1.5">
            {!isConnecting && (
              <button
                type="button"
                onClick={onToggleMute}
                className="inline-flex items-center gap-1.5 rounded-full border border-white/20 px-3 py-1.5 text-[11px] font-semibold text-white transition hover:bg-white/10"
                aria-pressed={muted}
              >
                {muted ? <MicOff className="size-3.5" /> : <Mic className="size-3.5" />}
                {muted ? 'Unmute' : 'Mute'}
              </button>
            )}
            <button
              type="button"
              onClick={onEndCall}
              className="inline-flex items-center gap-1.5 rounded-full bg-coral-500 px-3.5 py-2 text-[11px] font-semibold text-white transition hover:bg-coral-600"
            >
              <PhoneOff className="size-3.5" aria-hidden />
              {isConnecting ? 'Connecting…' : 'End call'}
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={onStartCall}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-coral-500 px-3.5 py-2.5 text-[12px] font-semibold text-white shadow-glow transition hover:bg-coral-600"
          >
            <Phone className="size-3.5" aria-hidden />
            {voiceState === 'error' ? 'Retry call' : 'Start call'}
          </button>
        )}
      </div>

      {voiceError && (
        <p className="mt-2.5 text-[11px] leading-relaxed text-blush-200/90" role="status">
          {voiceError}
        </p>
      )}
    </div>
  )
}

function CallTimer({ startedAt }: { startedAt: number }) {
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(id)
  }, [])

  const elapsed = Math.max(0, Math.floor((now - startedAt) / 1000))
  const minutes = String(Math.floor(elapsed / 60)).padStart(2, '0')
  const seconds = String(elapsed % 60).padStart(2, '0')
  return (
    <span className="tabular-nums text-blush-100/80" aria-label={`Call duration ${minutes}:${seconds}`}>
      {minutes}:{seconds}
    </span>
  )
}

type AssistantHeaderProps = {
  contextLabel: string | null
  isAvailable: boolean
  checkedAt: string | null
  onClose: () => void
  onMinimize: () => void
}

export function AssistantHeader({
  contextLabel,
  isAvailable,
  checkedAt,
  onClose,
  onMinimize,
}: AssistantHeaderProps) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-blush-200 bg-white px-4 py-3 sm:px-5">
      <div className="flex min-w-0 items-center gap-3">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-navy-900">
          <svg viewBox="0 0 24 24" className="size-4" fill="none" aria-hidden>
            <path
              d="M12 3c-2.8 3.6-4.5 6.5-4.5 9a4.5 4.5 0 1 0 9 0c0-2.5-1.7-5.4-4.5-9z"
              fill="#E8A09A"
            />
            <circle cx="12" cy="12.5" r="1.6" fill="#C9A96E" />
          </svg>
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-navy-900">
            AI Skincare Advisor
          </p>
          <div className="mt-1 flex flex-wrap items-center gap-1.5">
            {checkedAt === null ? (
              <span className="text-[11px] font-medium text-muted">Checking…</span>
            ) : isAvailable ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700">
                <span className="size-1.5 rounded-full bg-emerald-500" aria-hidden />
                Online
              </span>
            ) : (
              <span className="text-[11px] font-medium text-muted">Unavailable</span>
            )}
            {contextLabel && (
              <span className="max-w-[9.5rem] truncate rounded-full bg-blush-100 px-2 py-0.5 text-[11px] font-medium text-coral-600">
                {contextLabel}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="flex shrink-0 items-center">
        <button
          type="button"
          onClick={onMinimize}
          className="rounded-full p-2 text-muted transition hover:bg-blush-100 hover:text-navy-900"
          aria-label="Minimize assistant"
        >
          <Minimize2 className="size-4" />
        </button>
        <button
          type="button"
          onClick={onClose}
          className="rounded-full p-2 text-muted transition hover:bg-blush-100 hover:text-navy-900"
          aria-label="Close assistant"
        >
          <X className="size-4" />
        </button>
      </div>
    </div>
  )
}

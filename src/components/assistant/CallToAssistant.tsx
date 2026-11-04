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
    <div className="rounded-2xl border border-slate-700/80 bg-slate-900/80 px-3 py-2.5">
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="relative flex size-2.5 shrink-0">
            {inCall && (
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-60" />
            )}
            <span
              className={`relative inline-flex size-2.5 rounded-full ${
                voiceState === 'error' ? 'bg-red-400' : 'bg-emerald-400'
              }`}
            />
          </span>
          <div className="min-w-0">
            <p className="truncate text-xs font-semibold tracking-wide text-white">
              {inCall ? 'Voice session active' : 'Call to Assistant'}
            </p>
            <p className="mt-0.5 flex items-center gap-1.5 text-[10px] font-medium text-slate-400">
              {statusLabel(voiceState)}
              {callStartedAt && inCall && !isConnecting ? (
                <CallTimer startedAt={callStartedAt} />
              ) : (
                <span>· Voice</span>
              )}
            </p>
          </div>
        </div>

        {inCall ? (
          <div className="flex shrink-0 items-center gap-1.5">
            {!isConnecting && (
              <button
                type="button"
                onClick={onToggleMute}
                className={`rounded-full p-2 transition-colors ${muted ? 'bg-rose-500/20 text-rose-300' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}
                aria-label={muted ? 'Unmute microphone' : 'Mute microphone'}
                aria-pressed={muted}
              >
                {muted ? <MicOff className="size-3.5" /> : <Mic className="size-3.5" />}
              </button>
            )}
            <button
              type="button"
              onClick={onEndCall}
              className="inline-flex items-center gap-1.5 rounded-full bg-rose-600 px-3 py-1.5 text-[11px] font-semibold text-white shadow-md transition hover:bg-rose-700"
            >
              <PhoneOff className="size-3.5" aria-hidden />
              {isConnecting ? 'Connecting…' : 'End call'}
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={onStartCall}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-rose-500/30 bg-rose-500/15 px-3 py-1.5 text-xs font-medium text-rose-200 shadow-md transition hover:bg-rose-500/25"
          >
            <Phone className="size-3.5 fill-current text-rose-300" aria-hidden />
            {voiceState === 'error' ? 'Retry call' : 'Start call'}
          </button>
        )}
      </div>

      {inCall && !isConnecting && (
        <div className="mt-2 flex items-center justify-between rounded-xl border border-rose-500/20 bg-slate-950/80 px-3 py-2">
          <span className="flex items-center gap-2 text-[11px] font-medium text-slate-300">
            <Mic className="size-3.5 text-rose-300" aria-hidden />
            {muted ? 'Microphone muted' : 'Listening to your voice…'}
          </span>
          <span className="flex h-4 items-center gap-1" aria-hidden>
            {[0, 1, 2, 3].map((item) => (
              <span
                key={item}
                className="voice-bar w-0.5 rounded-full bg-rose-400"
                style={{ animationDelay: `${item * 0.12}s` }}
              />
            ))}
          </span>
        </div>
      )}

      {voiceError && (
        <p className="mt-2.5 text-[11px] leading-relaxed text-rose-200" role="status">
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
    <span className="tabular-nums text-slate-400" aria-label={`Call duration ${minutes}:${seconds}`}>
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
    <div className="flex items-center justify-between gap-3">
      <div className="flex min-w-0 items-center gap-3">
        <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-tr from-rose-500 to-amber-300 p-px">
          <span className="flex size-full items-center justify-center rounded-full bg-slate-950">
          <svg viewBox="0 0 24 24" className="size-4" fill="none" aria-hidden>
            <path
              d="M12 3c-2.8 3.6-4.5 6.5-4.5 9a4.5 4.5 0 1 0 9 0c0-2.5-1.7-5.4-4.5-9z"
              fill="#fda4af"
            />
            <circle cx="12" cy="12.5" r="1.6" fill="#fcd34d" />
          </svg>
          </span>
        </span>
        <div className="min-w-0">
          <p className="truncate text-xs font-semibold text-slate-100">
            AI Skincare Advisor
          </p>
          <div className="mt-1 flex flex-wrap items-center gap-1.5">
            {checkedAt === null ? (
              <span className="text-[10px] font-medium text-slate-500">Checking…</span>
            ) : isAvailable ? (
              <span className="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-400">
                <span className="size-1.5 rounded-full bg-emerald-400" aria-hidden />
                Online
              </span>
            ) : (
              <span className="text-[10px] font-medium text-slate-500">Unavailable</span>
            )}
            {contextLabel && (
              <span className="max-w-[9.5rem] truncate rounded-full border border-rose-500/20 bg-rose-500/10 px-2 py-0.5 text-[10px] font-medium text-rose-300">
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
          className="rounded-lg p-1.5 text-slate-500 transition hover:bg-slate-800 hover:text-white"
          aria-label="Minimize assistant"
        >
          <Minimize2 className="size-4" />
        </button>
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-800 hover:text-white"
          aria-label="Close assistant"
        >
          <X className="size-4" />
        </button>
      </div>
    </div>
  )
}

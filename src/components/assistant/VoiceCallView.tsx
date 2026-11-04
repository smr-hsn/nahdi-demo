import { MessageSquareText, Mic, MicOff, Phone, PhoneOff } from 'lucide-react'
import type { VoiceUiState } from '../../types/chat'

type VoiceCallViewProps = {
  voiceState: VoiceUiState
  voiceError: string | null
  muted: boolean
  onSwitchToText: () => void
  onEndCall: () => void
  onToggleMute: () => void
  onRetryCall: () => void
}

function headline(state: VoiceUiState): string {
  switch (state) {
    case 'connecting':
      return 'Connecting…'
    case 'connected':
      return 'Connected'
    case 'listening':
      return 'Listening'
    case 'speaking':
      return 'Assistant speaking'
    case 'muted':
      return 'Muted'
    case 'error':
      return 'Call error'
    case 'disconnected':
      return 'Disconnected'
    default:
      return 'Ready'
  }
}

const LIVE: VoiceUiState[] = ['connecting', 'connected', 'listening', 'speaking', 'muted']

export function VoiceCallView({
  voiceState,
  voiceError,
  muted,
  onSwitchToText,
  onEndCall,
  onToggleMute,
  onRetryCall,
}: VoiceCallViewProps) {
  const inCall = LIVE.includes(voiceState)

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-5 bg-gradient-to-b from-slate-900 to-slate-950 px-6 py-8 text-center">
      <div className="relative">
        <span
          className={`absolute inset-0 rounded-full ${
            inCall ? 'assistant-glow' : ''
          }`}
          aria-hidden
        />
        <div className="relative flex size-24 items-center justify-center rounded-full bg-gradient-to-tr from-rose-500/20 to-amber-300/10 text-rose-200 ring-1 ring-rose-300/20">
          <span className="flex size-16 items-center justify-center rounded-full bg-slate-950/80">
            <Mic className="size-7" aria-hidden />
          </span>
        </div>
      </div>

      <div>
        <p className="font-display text-2xl font-semibold text-white">
          {headline(voiceState)}
        </p>
        <p className="mt-2 max-w-xs text-sm text-slate-400">
          {voiceError ??
            (voiceState === 'speaking'
              ? 'The assistant is speaking. Audio is playing through your speakers.'
              : voiceState === 'listening'
                ? 'Microphone is live. Speak naturally about your skincare goals.'
                : voiceState === 'connecting'
                  ? 'Requesting microphone access and joining the IDRAK voice room…'
                  : voiceState === 'muted'
                    ? 'Your microphone is muted. Unmute to continue the conversation.'
                    : 'Start a call from Call to Assistant above, or return to text chat.')}
        </p>
      </div>

      {inCall && (
        <div className="flex h-8 items-end gap-1" aria-hidden>
          {[0, 1, 2, 3, 4].map((i) => (
            <span
              key={i}
              className={`voice-bar w-1 rounded-full ${
                voiceState === 'speaking' ? 'bg-amber-300' : 'bg-rose-400'
              }`}
              style={{ animationDelay: `${i * 0.12}s` }}
            />
          ))}
        </div>
      )}

      <div className="flex flex-wrap items-center justify-center gap-2">
        {voiceState === 'error' && (
          <button
            type="button"
            onClick={onRetryCall}
            className="inline-flex items-center gap-2 rounded-full bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-rose-700"
          >
            <Phone className="size-4" aria-hidden />
            Retry Call
          </button>
        )}
        {inCall && voiceState !== 'connecting' && (
          <button
            type="button"
            onClick={onToggleMute}
            className="inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-800 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700"
          >
            {muted ? <MicOff className="size-4" /> : <Mic className="size-4" />}
            {muted ? 'Unmute' : 'Mute'}
          </button>
        )}
        {inCall && (
          <button
            type="button"
            onClick={onEndCall}
            className="inline-flex items-center gap-2 rounded-full bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-rose-700"
          >
            <PhoneOff className="size-4" aria-hidden />
            End Call
          </button>
        )}
        <button
          type="button"
          onClick={onSwitchToText}
          className="inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-800 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700"
        >
          <MessageSquareText className="size-4" aria-hidden />
          Text Chat
        </button>
      </div>
    </div>
  )
}

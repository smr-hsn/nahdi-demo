import { LoaderCircle, Mars, Mic, PhoneOff, Venus } from 'lucide-react'
import { useEffect, useState } from 'react'
import type { ProductRecommendation } from '../../lib/formatAssistantMessage'
import type {
  VoiceSpeakerId,
  VoiceTranscriptEntry,
  VoiceUiState,
} from '../../types/chat'
import { ProductCard } from './ProductCard'
import { TalkingAdvisorAvatar } from './TalkingAdvisorAvatar'

type VoiceCallViewProps = {
  voiceState: VoiceUiState
  voiceError: string | null
  voiceId: VoiceSpeakerId
  onVoiceChange: (voiceId: VoiceSpeakerId) => void
  transcript: VoiceTranscriptEntry[]
  products: ProductRecommendation[]
  isFindingProducts: boolean
  productError: string | null
  onStartCall: () => void
  onEndCall: () => void
}

const LIVE_STATES: VoiceUiState[] = [
  'connecting',
  'connected',
  'listening',
  'speaking',
  'muted',
]

function statusLabel(voiceState: VoiceUiState): string {
  switch (voiceState) {
    case 'connecting':
      return 'Connecting…'
    case 'listening':
      return 'Hearing you'
    case 'speaking':
      return 'Advisor speaking'
    case 'muted':
      return 'Muted'
    case 'connected':
      return 'Listening — speak now'
    case 'error':
      return 'Unavailable'
    case 'disconnected':
      return 'Ended'
    default:
      return 'Ready to talk'
  }
}

export function VoiceCallView({
  voiceState,
  voiceError,
  voiceId,
  onVoiceChange,
  transcript,
  products,
  isFindingProducts,
  productError,
  onStartCall,
  onEndCall,
}: VoiceCallViewProps) {
  const isLive = LIVE_STATES.includes(voiceState)
  const isConnecting = voiceState === 'connecting'
  const isConnected = isLive && !isConnecting
  const canChooseVoice = !isLive
  const latestTranscript = transcript[transcript.length - 1]
  const [expiredUserTranscriptId, setExpiredUserTranscriptId] = useState<string | null>(null)

  useEffect(() => {
    if (
      !latestTranscript ||
      latestTranscript.speaker !== 'user' ||
      (voiceState !== 'connected' && voiceState !== 'speaking')
    ) {
      return
    }

    const transcriptId = latestTranscript.id
    const timeout = window.setTimeout(() => {
      setExpiredUserTranscriptId(transcriptId)
    }, voiceState === 'speaking' ? 0 : 3500)
    return () => window.clearTimeout(timeout)
  }, [latestTranscript, voiceState])

  const showAssistantTranscript =
    Boolean(latestTranscript) &&
    latestTranscript!.speaker === 'assistant' &&
    (voiceState === 'speaking' ||
      voiceState === 'connected' ||
      voiceState === 'listening')
  const showUserTranscript =
    Boolean(latestTranscript) &&
    latestTranscript!.speaker === 'user' &&
    latestTranscript!.id !== expiredUserTranscriptId &&
    (voiceState === 'listening' || voiceState === 'connected' || voiceState === 'speaking')

  const liveSpeech =
    latestTranscript && (showAssistantTranscript || showUserTranscript)
      ? latestTranscript
      : null
  const isAdvisorSpeaking = liveSpeech?.speaker === 'assistant'
  const gender = voiceId === 'female_01' ? 'female' : 'male'
  const pulseActive = voiceState === 'speaking' || voiceState === 'listening'
  const label = statusLabel(voiceState)

  return (
    <div className="assistant-scrollbar min-h-0 flex-1 touch-pan-y overflow-y-auto overscroll-contain bg-[linear-gradient(180deg,#f7f4f1_0%,#f3ebe6_48%,#efe6df_100%)] px-4 py-4 sm:px-5">
      <div className="mx-auto flex max-w-sm flex-col gap-3.5">
        <section className="relative flex flex-col items-center overflow-hidden rounded-[1.85rem] border border-white/10 bg-[#0b1228] px-4 pb-5 pt-4 text-center shadow-[0_22px_55px_rgba(11,31,58,0.28)]">
          <div
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_18%,rgba(232,106,88,0.28),transparent_42%),radial-gradient(ellipse_at_85%_80%,rgba(201,169,110,0.18),transparent_45%),radial-gradient(ellipse_at_10%_85%,rgba(56,189,248,0.12),transparent_40%),linear-gradient(160deg,#0b1228_0%,#12183a_52%,#1a1430_100%)]"
            aria-hidden="true"
          />
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.08] [background-image:radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.55)_1px,transparent_0)] [background-size:18px_18px]"
            aria-hidden="true"
          />

          <div className="relative z-10 mb-1 inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-2.5 py-1 backdrop-blur-sm">
            <span
              className={`size-1.5 rounded-full ${
                voiceState === 'speaking'
                  ? 'bg-coral-400 shadow-[0_0_8px_rgba(232,106,88,0.8)]'
                  : voiceState === 'listening'
                    ? 'bg-cyan-300 shadow-[0_0_8px_rgba(103,232,249,0.8)]'
                    : isConnected
                      ? 'bg-emerald-400'
                      : 'bg-white/40'
              } ${pulseActive ? 'animate-pulse' : ''}`}
              aria-hidden="true"
            />
            <span className="text-[10px] font-semibold tracking-[0.12em] text-white/85 uppercase">
              {label}
            </span>
          </div>

          <button
            type="button"
            onClick={isConnected ? onEndCall : onStartCall}
            disabled={isConnecting}
            className="relative z-10 rounded-full disabled:cursor-wait"
            aria-label={
              isConnecting
                ? 'Connecting to the voice assistant'
                : isConnected
                  ? 'End voice consultation'
                  : 'Start voice consultation'
            }
            title={isConnected ? 'End voice consultation' : 'Start voice consultation'}
          >
            <TalkingAdvisorAvatar
              gender={gender}
              isSpeaking={voiceState === 'speaking'}
              isListening={voiceState === 'listening'}
            />
            <span
              className={`absolute bottom-5 right-5 flex size-9 items-center justify-center rounded-full border border-white/25 text-white shadow-[0_8px_24px_rgba(0,0,0,0.35)] transition ${
                isConnected
                  ? 'bg-gradient-to-br from-rose-500 to-rose-700'
                  : 'bg-gradient-to-br from-coral-500 to-navy-900'
              }`}
            >
              {isConnecting ? (
                <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
              ) : isConnected ? (
                <PhoneOff className="size-4" aria-hidden="true" />
              ) : (
                <Mic className="size-4" aria-hidden="true" />
              )}
            </span>
          </button>

          <div
            className="relative z-10 mt-0.5 mb-3 flex h-7 items-center justify-center gap-1"
            role="img"
            aria-label={
              voiceState === 'speaking'
                ? 'Advisor speaking'
                : voiceState === 'listening'
                  ? 'Listening to your voice'
                  : 'Voice activity idle'
            }
          >
            {Array.from({ length: 13 }, (_, index) => (
              <span
                key={index}
                className={`voice-bar w-[3px] rounded-full ${
                  voiceState === 'speaking'
                    ? 'bg-gradient-to-t from-coral-500 to-gold-300'
                    : voiceState === 'listening'
                      ? 'bg-gradient-to-t from-cyan-500 to-teal-200'
                      : 'bg-white/20'
                } ${pulseActive ? 'voice-bar-active' : ''}`}
                style={{ animationDelay: `${index * 0.06}s` }}
                aria-hidden="true"
              />
            ))}
          </div>

          <p className="relative z-10 mb-3 max-w-[16rem] text-[11px] leading-relaxed text-white/55">
            {isConnecting
              ? 'Connecting secure audio…'
              : isConnected
                ? voiceState === 'speaking'
                  ? 'Advisor is responding — captions appear below when available.'
                  : 'Speak clearly about your skin goal. Product picks appear below after the reply.'
                : 'Tap the advisor to start a live voice consultation.'}
          </p>

          <div className="relative z-10 flex items-center justify-center gap-1.5 rounded-full border border-white/10 bg-white/5 p-1 backdrop-blur-sm">
            <button
              type="button"
              onClick={() => onVoiceChange('female_01')}
              disabled={!canChooseVoice}
              aria-label="Female voice"
              aria-pressed={voiceId === 'female_01'}
              title="Female voice"
              className={`flex size-7 items-center justify-center rounded-full border transition disabled:cursor-not-allowed disabled:opacity-50 ${
                voiceId === 'female_01'
                  ? 'border-coral-300/60 bg-coral-400/15 text-coral-200'
                  : 'border-transparent text-white/50 hover:border-white/25 hover:text-white'
              }`}
            >
              <Venus className="size-3.5" aria-hidden="true" />
            </button>
            <select
              value={voiceId}
              onChange={(event) => {
                const selectedVoice = event.currentTarget.value
                if (selectedVoice === 'female_01' || selectedVoice === 'male_01') {
                  onVoiceChange(selectedVoice)
                }
              }}
              disabled={!canChooseVoice}
              aria-label="Choose voice"
              className="h-7 max-w-32 rounded-full border-0 bg-transparent px-1.5 text-[10px] font-medium text-white outline-none transition focus-visible:ring-1 focus-visible:ring-gold-300/60 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <option value="female_01" className="bg-[#12183a] text-white">
                Female · English
              </option>
              <option value="male_01" className="bg-[#12183a] text-white">
                Male · English
              </option>
            </select>
            <button
              type="button"
              onClick={() => onVoiceChange('male_01')}
              disabled={!canChooseVoice}
              aria-label="Male voice"
              aria-pressed={voiceId === 'male_01'}
              title="Male voice"
              className={`flex size-7 items-center justify-center rounded-full border transition disabled:cursor-not-allowed disabled:opacity-50 ${
                voiceId === 'male_01'
                  ? 'border-cyan-300/60 bg-cyan-300/15 text-cyan-200'
                  : 'border-transparent text-white/50 hover:border-white/25 hover:text-white'
              }`}
            >
              <Mars className="size-3.5" aria-hidden="true" />
            </button>
          </div>
        </section>

        {(liveSpeech || voiceError) && (
          <div
            className={`flex h-12 min-w-0 items-center gap-2.5 rounded-2xl border px-3.5 shadow-[0_8px_24px_rgba(11,31,58,0.06)] transition-colors ${
              isAdvisorSpeaking
                ? 'border-coral-200/80 bg-gradient-to-r from-white via-blush-50 to-gold-300/25'
                : 'border-blush-100 bg-white/90 backdrop-blur-sm'
            }`}
            aria-live="polite"
            aria-relevant="text"
          >
            {voiceError ? (
              <p className="min-w-0 truncate text-xs leading-relaxed text-red-700" role="alert">
                {voiceError}
              </p>
            ) : liveSpeech ? (
              <>
                <span className="shrink-0 rounded-full bg-navy-900 px-2 py-0.5 text-[9px] font-bold tracking-[0.12em] text-white uppercase">
                  {liveSpeech.speaker === 'assistant' ? 'IDRAK' : 'You'}
                </span>
                <p
                  className={`min-w-0 text-xs leading-relaxed text-navy-800 ${
                    isAdvisorSpeaking ? 'voice-marquee-viewport' : 'truncate'
                  }`}
                  title={liveSpeech.content}
                >
                  {isAdvisorSpeaking ? (
                    <span className="voice-marquee-track">
                      <span className="voice-marquee-item">{liveSpeech.content}</span>
                      <span className="voice-marquee-item" aria-hidden="true">
                        {liveSpeech.content}
                      </span>
                    </span>
                  ) : (
                    <>
                      {liveSpeech.content}
                      {!liveSpeech.final && (
                        <span className="ml-1 inline-block size-1.5 animate-pulse rounded-full bg-coral-500 align-middle" />
                      )}
                    </>
                  )}
                </p>
              </>
            ) : null}
          </div>
        )}

        {productError && (
          <p
            className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-800"
            role="alert"
          >
            {productError}
          </p>
        )}
        {isFindingProducts && products.length === 0 && (
          <p
            className="inline-flex items-center gap-1.5 text-xs text-muted"
            role="status"
          >
            <LoaderCircle className="size-3.5 animate-spin" aria-hidden="true" />
            Finding matching Nahdi products…
          </p>
        )}
        {products.length > 0 ? (
          <div
            className="assistant-scrollbar -mx-1 flex gap-2.5 overflow-x-auto px-1 pb-1"
            role="list"
            aria-label="Products recommended by the voice advisor"
          >
            {products.map((product, index) => (
              <ProductCard
                key={product.url ?? `${product.name}-${index}`}
                product={product}
                variant="voice"
              />
            ))}
          </div>
        ) : !isFindingProducts && !productError ? (
          <p className="rounded-2xl border border-dashed border-blush-200 bg-white/70 px-3.5 py-3 text-xs leading-relaxed text-muted shadow-soft">
            Product picks appear here when the advisor recommends them.
          </p>
        ) : null}
      </div>
    </div>
  )
}

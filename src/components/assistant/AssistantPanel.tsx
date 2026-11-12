import { useEffect, useId, useMemo, useRef } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { getProductRecommendations } from '../../lib/formatAssistantMessage'
import type {
  ChatMessage,
  ChatMode,
  VoiceTranscriptEntry,
  VoiceSpeakerId,
  VoiceUiState,
} from '../../types/chat'
import { useVisualViewportInset } from '../../hooks/useVisualViewportInset'
import { AssistantHeader } from './AssistantHeader'
import { ChatInput } from './ChatInput'
import { MessageList } from './MessageList'
import { VoiceCallView } from './VoiceCallView'

type AssistantPanelProps = {
  isOpen: boolean
  suggestedQuestions: string[]
  messages: ChatMessage[]
  voiceTranscript: VoiceTranscriptEntry[]
  voiceProductMessage: ChatMessage | null
  isFindingVoiceProducts: boolean
  voiceProductError: string | null
  isSending: boolean
  mode: ChatMode
  voiceId: VoiceSpeakerId
  voiceState: VoiceUiState
  voiceError: string | null
  onClose: () => void
  onReset: () => void
  onSend: (value: string) => void
  onModeChange: (mode: ChatMode) => void
  onVoiceChange: (voiceId: VoiceSpeakerId) => void
  onStartVoice: () => void
  onEndVoice: () => void
}

export function AssistantPanel({
  isOpen,
  suggestedQuestions,
  messages,
  voiceTranscript,
  voiceProductMessage,
  isFindingVoiceProducts,
  voiceProductError,
  isSending,
  mode,
  voiceId,
  voiceState,
  voiceError,
  onClose,
  onReset,
  onSend,
  onModeChange,
  onVoiceChange,
  onStartVoice,
  onEndVoice,
}: AssistantPanelProps) {
  const titleId = useId()
  const panelRef = useRef<HTMLDivElement>(null)
  const reduceMotion = useReducedMotion()
  useVisualViewportInset(panelRef, isOpen)
  const voiceProducts = useMemo(
    () =>
      voiceProductMessage
        ? getProductRecommendations(
            voiceProductMessage.content,
            voiceProductMessage.products,
          )
        : [],
    [voiceProductMessage],
  )

  useEffect(() => {
    if (!isOpen) return

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [isOpen, onClose])

  useEffect(() => {
    if (!isOpen) return

    const root = document.documentElement
    const body = document.body
    const previousRootOverflow = root.style.overflow
    const previousBodyOverflow = body.style.overflow
    root.style.overflow = 'hidden'
    body.style.overflow = 'hidden'

    return () => {
      root.style.overflow = previousRootOverflow
      body.style.overflow = previousBodyOverflow
    }
  }, [isOpen])

  useEffect(() => {
    if (isOpen) panelRef.current?.focus()
  }, [isOpen])

  const hasSentMessage = messages.some((message) => message.role === 'user')

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.button
            type="button"
            aria-label="Dismiss assistant overlay"
            className="pointer-events-auto fixed inset-0 z-[70] bg-navy-950/25 backdrop-blur-[2px] md:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            tabIndex={-1}
            initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 28, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 18, scale: 0.96 }}
            transition={{
              duration: reduceMotion ? 0.12 : 0.32,
              ease: [0.22, 1, 0.36, 1],
            }}
            className="pointer-events-auto fixed z-[80] flex flex-col overflow-hidden border border-blush-200 bg-cream text-navy-900 shadow-[0_24px_60px_-15px_rgba(11,31,58,0.28)] outline-none max-md:inset-x-0 max-md:bottom-0 max-md:h-[min(100dvh,900px)] max-md:rounded-t-[1.75rem] max-md:pb-[max(env(safe-area-inset-bottom),var(--keyboard-inset,0px))] md:bottom-5 md:right-5 md:h-[min(760px,calc(100dvh-40px))] md:w-[min(440px,calc(100vw-2.5rem))] md:rounded-[1.75rem]"
          >
            <h2 id={titleId} className="sr-only">
              AI Skincare Advisor
            </h2>

            <div className="border-b border-blush-200 bg-white px-3.5 py-3">
              <AssistantHeader
                mode={mode}
                onModeChange={onModeChange}
                onReset={onReset}
                onClose={onClose}
              />
            </div>

            <div className="relative min-h-0 flex-1 overflow-hidden">
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={mode}
                  initial={reduceMotion ? { opacity: 0 } : { opacity: 0, x: 24 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={reduceMotion ? { opacity: 0 } : { opacity: 0, x: -12 }}
                  transition={{
                    duration: reduceMotion ? 0.12 : 0.32,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                  className="absolute inset-0 flex min-h-0 flex-col"
                >
                  {mode === 'voice' ? (
                    <VoiceCallView
                      voiceState={voiceState}
                      voiceError={voiceError}
                      voiceId={voiceId}
                      onVoiceChange={onVoiceChange}
                      transcript={voiceTranscript}
                      products={voiceProducts}
                      isFindingProducts={isFindingVoiceProducts}
                      productError={voiceProductError}
                      onStartCall={onStartVoice}
                      onEndCall={onEndVoice}
                    />
                  ) : (
                    <>
                      <MessageList
                        messages={messages}
                        isSending={isSending}
                        suggestedQuestions={suggestedQuestions}
                        showSuggestions
                        collapseSuggestions={hasSentMessage}
                        onSelectQuestion={onSend}
                      />
                      <ChatInput
                        disabled={isSending}
                        onSend={onSend}
                        onStartVoice={onStartVoice}
                      />
                    </>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

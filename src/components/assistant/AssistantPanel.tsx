import { useEffect, useId, useRef } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import type { ChatMessage, VoiceUiState } from '../../types/chat'
import { useVisualViewportInset } from '../../hooks/useVisualViewportInset'
import { CallToAssistant, AssistantHeader } from './CallToAssistant'
import { ChatInput } from './ChatInput'
import { MessageList } from './MessageList'
import { VoiceCallView } from './VoiceCallView'

type AssistantPanelProps = {
  isOpen: boolean
  contextLabel: string | null
  suggestedQuestions: string[]
  messages: ChatMessage[]
  isSending: boolean
  mode: 'text' | 'voice'
  voiceState: VoiceUiState
  voiceError: string | null
  muted: boolean
  callStartedAt: number | null
  isAvailable: boolean
  checkedAt: string | null
  onClose: () => void
  onSend: (value: string) => void
  onStartVoice: () => void
  onEndVoice: () => void
  onToggleMute: () => void
  onSwitchToText: () => void
}

export function AssistantPanel({
  isOpen,
  contextLabel,
  suggestedQuestions,
  messages,
  isSending,
  mode,
  voiceState,
  voiceError,
  muted,
  callStartedAt,
  isAvailable,
  checkedAt,
  onClose,
  onSend,
  onStartVoice,
  onEndVoice,
  onToggleMute,
  onSwitchToText,
}: AssistantPanelProps) {
  const titleId = useId()
  const panelRef = useRef<HTMLDivElement>(null)
  useVisualViewportInset(panelRef, isOpen)

  useEffect(() => {
    if (!isOpen) return

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [isOpen, onClose])

  useEffect(() => {
    if (isOpen) panelRef.current?.focus()
  }, [isOpen])

  const showSuggestions =
    mode === 'text' && messages.filter((m) => m.role === 'user').length === 0

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
            initial={{ opacity: 0, y: 28, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 18, scale: 0.96 }}
            transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
            className="pointer-events-auto fixed z-[80] flex flex-col overflow-hidden border border-blush-200/70 bg-white shadow-lift outline-none max-md:inset-x-0 max-md:bottom-0 max-md:h-[min(90dvh,760px)] max-md:rounded-t-[1.75rem] max-md:pb-[max(env(safe-area-inset-bottom),var(--keyboard-inset,0px))] md:bottom-8 md:right-6 md:h-[min(720px,calc(100dvh-5.5rem))] md:w-[440px] md:rounded-[1.75rem]"
          >
            <h2 id={titleId} className="sr-only">
              AI Skincare Advisor
            </h2>

            <CallToAssistant
              voiceState={voiceState}
              voiceError={voiceError}
              muted={muted}
              callStartedAt={callStartedAt}
              onStartCall={onStartVoice}
              onEndCall={onEndVoice}
              onToggleMute={onToggleMute}
            />

            <AssistantHeader
              contextLabel={contextLabel}
              isAvailable={isAvailable}
              checkedAt={checkedAt}
              onClose={onClose}
              onMinimize={onClose}
            />

            {mode === 'voice' ? (
              <VoiceCallView
                voiceState={voiceState}
                voiceError={voiceError}
                muted={muted}
                onSwitchToText={onSwitchToText}
                onEndCall={onEndVoice}
                onToggleMute={onToggleMute}
                onRetryCall={onStartVoice}
              />
            ) : (
              <>
                <MessageList
                  messages={messages}
                  isSending={isSending}
                  suggestedQuestions={suggestedQuestions}
                  showSuggestions={showSuggestions}
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
        </>
      )}
    </AnimatePresence>
  )
}

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
            initial={{ opacity: 0, y: 28, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 18, scale: 0.96 }}
            transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
            className="pointer-events-auto fixed z-[80] flex flex-col overflow-hidden border border-slate-700/80 bg-slate-900 text-slate-100 shadow-2xl shadow-rose-950/25 outline-none max-md:inset-x-0 max-md:bottom-0 max-md:h-[min(90dvh,760px)] max-md:rounded-t-[1.75rem] max-md:pb-[max(env(safe-area-inset-bottom),var(--keyboard-inset,0px))] md:bottom-5 md:right-5 md:h-[min(640px,85vh)] md:w-[min(420px,calc(100vw-2.5rem))] md:rounded-[1.75rem]"
          >
            <h2 id={titleId} className="sr-only">
              AI Skincare Advisor
            </h2>

            <div className="space-y-2.5 border-b border-slate-800/80 bg-gradient-to-b from-slate-950/95 to-slate-900/95 p-3.5">
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
            </div>

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
        </>
      )}
    </AnimatePresence>
  )
}

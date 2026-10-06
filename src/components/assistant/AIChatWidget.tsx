import { AnimatePresence, motion } from 'framer-motion'
import { useAssistant } from '../../context/AssistantContext'
import { useChatSession } from '../../hooks/useChatSession'
import { AssistantLauncher } from './AssistantLauncher'
import { AssistantPanel } from './AssistantPanel'

export function AIChatWidget() {
  const { isOpen, openAssistant, closeAssistant, suggestedQuestions, contextLabel } =
    useAssistant()

  const {
    messages,
    isSending,
    mode,
    voiceState,
    voiceError,
    muted,
    callStartedAt,
    availability,
    sendMessage,
    beginVoiceCall,
    hangUpVoiceCall,
    toggleMute,
    switchToText,
  } = useChatSession(contextLabel, isOpen)

  return (
    <div className="pointer-events-none fixed inset-0 z-[80]">
      <AssistantPanel
        isOpen={isOpen}
        contextLabel={contextLabel}
        suggestedQuestions={suggestedQuestions}
        messages={messages}
        isSending={isSending}
        mode={mode}
        voiceState={voiceState}
        voiceError={voiceError}
        muted={muted}
        callStartedAt={callStartedAt}
        isAvailable={availability.available}
        checkedAt={availability.checkedAt}
        onClose={closeAssistant}
        onSend={(value) => void sendMessage(value)}
        onStartVoice={() => void beginVoiceCall()}
        onEndVoice={() => void hangUpVoiceCall()}
        onToggleMute={() => void toggleMute()}
        onSwitchToText={switchToText}
      />

      <div className="pointer-events-auto absolute bottom-[max(1.25rem,env(safe-area-inset-bottom))] right-[max(1.25rem,env(safe-area-inset-right))]">
        <AnimatePresence mode="wait">
          {!isOpen && (
            <motion.div
              key="launcher"
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.85 }}
              transition={{ duration: 0.2 }}
            >
              <AssistantLauncher onOpen={() => openAssistant()} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

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
    voiceTranscript,
    voiceProductMessage,
    isFindingVoiceProducts,
    voiceProductError,
    isSending,
    mode,
    setMode,
    voiceId,
    setVoiceId,
    voiceState,
    voiceError,
    sendMessage,
    beginVoiceCall,
    hangUpVoiceCall,
    resetSession,
  } = useChatSession(contextLabel)

  const closeAssistantPanel = () => {
    if (
      ['connecting', 'connected', 'listening', 'speaking', 'muted'].includes(voiceState)
    ) {
      void hangUpVoiceCall()
    }
    closeAssistant()
  }

  return (
    <div className="pointer-events-none fixed inset-0 z-[80]">
      <AssistantPanel
        isOpen={isOpen}
        suggestedQuestions={suggestedQuestions}
        messages={messages}
        voiceTranscript={voiceTranscript}
        voiceProductMessage={voiceProductMessage}
        isFindingVoiceProducts={isFindingVoiceProducts}
        voiceProductError={voiceProductError}
        isSending={isSending}
        mode={mode}
        voiceId={voiceId}
        voiceState={voiceState}
        voiceError={voiceError}
        onClose={closeAssistantPanel}
        onReset={resetSession}
        onSend={(value) => void sendMessage(value)}
        onModeChange={setMode}
        onVoiceChange={setVoiceId}
        onStartVoice={() => void beginVoiceCall()}
        onEndVoice={() => void hangUpVoiceCall()}
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

import { useEffect, useRef } from 'react'
import type { ChatMessage } from '../../types/chat'
import { MessageBubble } from './MessageBubble'
import { SuggestedQuestions } from './SuggestedQuestions'
import { TypingIndicator } from './TypingIndicator'
import { WelcomeMessage } from './WelcomeMessage'

type MessageListProps = {
  messages: ChatMessage[]
  isSending: boolean
  suggestedQuestions: string[]
  showSuggestions: boolean
  onSelectQuestion: (question: string) => void
}

export function MessageList({
  messages,
  isSending,
  suggestedQuestions,
  showSuggestions,
  onSelectQuestion,
}: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null)
  const scrollerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [messages, isSending, showSuggestions])

  return (
    <div
      ref={scrollerRef}
      className="flex-1 space-y-4 overflow-y-auto overscroll-contain bg-gradient-to-b from-blush-50 to-cream px-4 py-5 sm:px-5"
      aria-live="polite"
      aria-relevant="additions"
    >
      <WelcomeMessage />

      {messages.map((message) => (
        <MessageBubble key={message.id} message={message} />
      ))}

      {isSending && <TypingIndicator />}

      {showSuggestions && !isSending && (
        <SuggestedQuestions
          questions={suggestedQuestions}
          disabled={isSending}
          onSelect={onSelectQuestion}
        />
      )}

      <div ref={bottomRef} />
    </div>
  )
}

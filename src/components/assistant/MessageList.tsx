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
  collapseSuggestions: boolean
  onSelectQuestion: (question: string) => void
}

export function MessageList({
  messages,
  isSending,
  suggestedQuestions,
  showSuggestions,
  collapseSuggestions,
  onSelectQuestion,
}: MessageListProps) {
  const scrollerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const scroller = scrollerRef.current
    scroller?.scrollTo({ top: scroller.scrollHeight, behavior: 'smooth' })
  }, [messages, isSending, showSuggestions])

  return (
    <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden bg-gradient-to-b from-cream via-blush-50 to-white">
      <div
        ref={scrollerRef}
        className="assistant-scrollbar min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain px-4 py-4 pb-12 sm:px-5"
        aria-live="polite"
        aria-relevant="additions"
      >
        <WelcomeMessage />

        {messages.map((message) => (
          <MessageBubble key={message.id} message={message} />
        ))}

        {isSending && <TypingIndicator />}

      </div>

      {showSuggestions && (
        <SuggestedQuestions
          questions={suggestedQuestions}
          disabled={isSending}
          collapsed={collapseSuggestions}
          onSelect={onSelectQuestion}
        />
      )}
    </div>
  )
}

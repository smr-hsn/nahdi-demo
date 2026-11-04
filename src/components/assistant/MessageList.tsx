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
  const bottomRef = useRef<HTMLDivElement>(null)
  const scrollerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [messages, isSending, showSuggestions])

  return (
    <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950">
      <div
        ref={scrollerRef}
        className="assistant-scrollbar min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain px-4 py-4 pb-16 sm:px-5"
        aria-live="polite"
        aria-relevant="additions"
      >
        <WelcomeMessage />

        {messages.map((message) => (
          <MessageBubble key={message.id} message={message} />
        ))}

        {isSending && <TypingIndicator />}

        <div ref={bottomRef} />
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

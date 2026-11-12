export function TypingIndicator() {
  return (
    <div
      className="inline-flex items-center gap-2 rounded-2xl rounded-bl-md border border-blush-200 bg-white px-3.5 py-2.5 shadow-soft"
      role="status"
      aria-live="polite"
      aria-label="Assistant is preparing a response"
    >
      <span className="flex items-center gap-1" aria-hidden>
        <span className="typing-dot size-1.5 rounded-full bg-coral-500" />
        <span className="typing-dot size-1.5 rounded-full bg-coral-500 [animation-delay:0.15s]" />
        <span className="typing-dot size-1.5 rounded-full bg-coral-500 [animation-delay:0.3s]" />
      </span>
      <span className="text-[11px] font-medium text-muted">Preparing a response…</span>
    </div>
  )
}

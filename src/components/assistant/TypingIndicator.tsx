export function TypingIndicator() {
  return (
    <div
      className="inline-flex items-center gap-1 rounded-2xl rounded-bl-md border border-slate-700/80 bg-slate-800 px-3.5 py-3"
      role="status"
      aria-live="polite"
      aria-label="Assistant is typing"
    >
      <span className="typing-dot size-1.5 rounded-full bg-rose-400" />
      <span className="typing-dot size-1.5 rounded-full bg-rose-400 [animation-delay:0.15s]" />
      <span className="typing-dot size-1.5 rounded-full bg-rose-400 [animation-delay:0.3s]" />
    </div>
  )
}

import { MessageSquareText, RotateCcw, Mic, X } from 'lucide-react'
import type { ChatMode } from '../../types/chat'

type AssistantHeaderProps = {
  mode: ChatMode
  onModeChange: (mode: ChatMode) => void
  onReset: () => void
  onClose: () => void
}

export function AssistantHeader({
  mode,
  onModeChange,
  onReset,
  onClose,
}: AssistantHeaderProps) {
  return (
    <div className="flex items-center justify-between gap-2">
      <div className="flex min-w-0 items-center gap-2.5">
        <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-navy-900">
          <svg viewBox="0 0 24 24" className="size-4" fill="none" aria-hidden="true">
            <path
              d="M12 3c-2.8 3.6-4.5 6.5-4.5 9a4.5 4.5 0 1 0 9 0c0-2.5-1.7-5.4-4.5-9z"
              fill="#E86A58"
            />
            <circle cx="12" cy="12.5" r="1.6" fill="#C9A96E" />
          </svg>
        </span>
        <p className="truncate text-xs font-semibold text-navy-900">
          AI Skincare Advisor
        </p>
      </div>

      <div className="flex shrink-0 items-center gap-1">
        <button
          type="button"
          onClick={onReset}
          className="rounded-lg p-2 text-muted transition hover:bg-blush-100 hover:text-navy-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-coral-500"
          aria-label="Reset conversation"
          title="Reset conversation"
        >
          <RotateCcw className="size-4" aria-hidden="true" />
        </button>

        <div
          className="flex items-center rounded-full border border-blush-200 bg-blush-50 p-0.5"
          role="group"
          aria-label="Assistant mode"
        >
          <button
            type="button"
            aria-pressed={mode === 'text'}
            onClick={() => onModeChange('text')}
            className={`inline-flex items-center gap-1 rounded-full px-2 py-1.5 text-[10px] font-semibold transition sm:px-2.5 ${
              mode === 'text'
                ? 'bg-navy-900 text-white shadow-soft'
                : 'text-muted hover:text-navy-900'
            }`}
          >
            <MessageSquareText className="size-3.5" aria-hidden="true" />
            Chat
          </button>
          <button
            type="button"
            aria-pressed={mode === 'voice'}
            onClick={() => onModeChange('voice')}
            className={`inline-flex items-center gap-1 rounded-full px-2 py-1.5 text-[10px] font-semibold transition sm:px-2.5 ${
              mode === 'voice'
                ? 'bg-navy-900 text-white shadow-soft'
                : 'text-muted hover:text-navy-900'
            }`}
          >
            <Mic className="size-3.5" aria-hidden="true" />
            Voice
          </button>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="rounded-lg p-2 text-muted transition hover:bg-blush-100 hover:text-navy-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-coral-500"
          aria-label="Close assistant"
          title="Close assistant"
        >
          <X className="size-4" aria-hidden="true" />
        </button>
      </div>
    </div>
  )
}

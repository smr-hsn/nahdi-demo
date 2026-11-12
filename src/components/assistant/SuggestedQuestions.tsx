import { useState } from 'react'

type SuggestedQuestionsProps = {
  questions: string[]
  disabled?: boolean
  collapsed?: boolean
  onSelect: (question: string) => void
}

export function SuggestedQuestions({
  questions,
  disabled,
  collapsed = false,
  onSelect,
}: SuggestedQuestionsProps) {
  const [expanded, setExpanded] = useState(false)

  if (!questions.length) return null

  return (
    <div
      className={`absolute inset-x-0 bottom-0 z-20 border-t border-blush-200 bg-white/95 px-3 sm:px-4 ${
        collapsed ? 'h-1.5' : 'h-9'
      }`}
      onMouseEnter={() => {
        if (collapsed) setExpanded(true)
      }}
      onMouseLeave={() => setExpanded(false)}
      onFocusCapture={() => {
        if (collapsed) setExpanded(true)
      }}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
          setExpanded(false)
        }
      }}
    >
      {collapsed && (
        <button
          type="button"
          onClick={() => setExpanded((current) => !current)}
          aria-label="Show suggested questions"
          className={`absolute inset-x-0 top-0 z-10 h-1.5 cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-rose-400 ${
            expanded ? 'pointer-events-none opacity-0' : ''
          }`}
        >
          <span className="mx-auto block h-0.5 w-7 rounded-full bg-blush-300" />
        </button>
      )}
      <ul
        className={`assistant-scrollbar -mx-0.5 flex items-center gap-1 overflow-x-auto px-0.5 ${
          collapsed
            ? `absolute inset-x-3 bottom-0 z-20 h-9 transition-opacity duration-150 sm:inset-x-4 ${
                expanded
                  ? 'visible opacity-100'
                  : 'invisible pointer-events-none opacity-0'
              }`
            : 'h-full'
        }`}
        role="list"
      >
        {questions.map((question) => (
          <li key={question} className="shrink-0">
            <button
              type="button"
              disabled={disabled}
              onClick={() => onSelect(question)}
              title={question}
              className="max-w-[13.5rem] truncate rounded-full border border-blush-200 bg-blush-50 px-2.5 py-0.5 text-left text-[9px] leading-4 text-navy-800 transition hover:border-coral-500/60 hover:bg-blush-100 hover:text-navy-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-coral-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {question}
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}

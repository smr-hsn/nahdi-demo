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
      className={`absolute inset-x-0 bottom-0 z-20 border-t border-slate-800/80 bg-slate-950/60 px-4 sm:px-5 ${
        collapsed ? 'h-2' : 'h-12'
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
          className={`absolute inset-x-0 top-0 z-10 h-2 cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-rose-400 ${
            expanded ? 'pointer-events-none opacity-0' : ''
          }`}
        >
          <span className="mx-auto block h-0.5 w-8 rounded-full bg-slate-600" />
        </button>
      )}
      <ul
        className={`assistant-scrollbar -mx-1 flex items-center gap-1.5 overflow-x-auto px-1 ${
          collapsed
            ? `absolute inset-x-4 bottom-0 z-20 h-12 transition-opacity duration-150 sm:inset-x-5 ${
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
              className="max-w-[15rem] rounded-full border border-slate-700 bg-slate-800/80 px-3 py-1.5 text-left text-[10px] leading-4 text-slate-300 transition hover:border-rose-400/50 hover:bg-slate-800 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-400 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {question}
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}

type SuggestedQuestionsProps = {
  questions: string[]
  disabled?: boolean
  onSelect: (question: string) => void
}

export function SuggestedQuestions({
  questions,
  disabled,
  onSelect,
}: SuggestedQuestionsProps) {
  if (!questions.length) return null

  return (
    <div className="space-y-2.5">
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">
        Suggested questions
      </p>
      <ul className="flex flex-col gap-2.5" role="list">
        {questions.map((question) => (
          <li key={question}>
            <button
              type="button"
              disabled={disabled}
              onClick={() => onSelect(question)}
              className="w-full rounded-2xl border border-blush-200 bg-white px-4 py-3 text-left text-sm leading-6 text-navy-800 transition hover:border-coral-400 hover:bg-blush-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-coral-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {question}
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}

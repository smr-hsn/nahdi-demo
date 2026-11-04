import { useId, useState, type FormEvent } from 'react'
import { Mic, Send } from 'lucide-react'

type ChatInputProps = {
  disabled?: boolean
  onSend: (value: string) => void
  onStartVoice: () => void
}

export function ChatInput({ disabled, onSend, onStartVoice }: ChatInputProps) {
  const [value, setValue] = useState('')
  const inputId = useId()

  const submit = (event: FormEvent) => {
    event.preventDefault()
    const trimmed = value.trim()
    if (!trimmed || disabled) return
    onSend(trimmed)
    setValue('')
  }

  return (
    <form
      onSubmit={submit}
      className="border-t border-slate-800 bg-slate-950/90 px-3.5 py-3 sm:px-4"
      aria-label="Send a message"
    >
      <div className="flex items-center gap-2 rounded-2xl border border-slate-700 bg-slate-900 px-2.5 py-1.5 transition focus-within:border-rose-400/60 focus-within:ring-2 focus-within:ring-rose-400/15">
        <button
          type="button"
          onClick={onStartVoice}
          className="rounded-full p-2 text-rose-300 transition hover:bg-slate-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-400"
          aria-label="Start voice call with assistant"
        >
          <Mic className="size-4" aria-hidden />
        </button>

        <label htmlFor={inputId} className="sr-only">
          Ask a skincare question
        </label>
        <input
          id={inputId}
          value={value}
          onChange={(event) => setValue(event.target.value)}
          disabled={disabled}
          placeholder={disabled ? 'Waiting for the advisor…' : 'Ask about your skin…'}
          autoComplete="off"
          aria-busy={disabled}
          className="min-w-0 flex-1 bg-transparent py-2 text-sm text-slate-100 outline-none placeholder:text-slate-500 disabled:opacity-60"
          enterKeyHint="send"
        />

        <button
          type="submit"
          disabled={disabled || !value.trim()}
          className="rounded-xl bg-rose-500 p-2.5 text-white transition hover:bg-rose-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-300 disabled:cursor-not-allowed disabled:opacity-40"
          aria-label="Send message"
        >
          <Send className="size-4" aria-hidden />
        </button>
      </div>
    </form>
  )
}

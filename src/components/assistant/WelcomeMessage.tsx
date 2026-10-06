import { WELCOME_MESSAGE } from '../../types/chat'

export function WelcomeMessage() {
  return (
    <div
      className="rounded-2xl border border-blush-200/90 bg-white/95 px-4 py-3.5 text-sm leading-6 text-navy-800 shadow-soft"
      role="status"
    >
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-coral-500">
        Welcome
      </p>
      <p className="mt-1.5">{WELCOME_MESSAGE}</p>
    </div>
  )
}

import { WELCOME_MESSAGE } from '../../types/chat'

export function WelcomeMessage() {
  return (
    <div
      className="rounded-2xl border border-slate-700/80 bg-slate-800/70 px-4 py-3.5 text-sm leading-6 text-slate-300"
      role="status"
    >
      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-rose-300">
        Your skincare advisor
      </p>
      <p className="mt-1.5">{WELCOME_MESSAGE}</p>
    </div>
  )
}

import { WELCOME_MESSAGE } from '../../types/chat'

export function WelcomeMessage() {
  return (
    <div
      className="rounded-2xl border border-blush-200 bg-white px-4 py-4 text-sm leading-6 text-navy-800 shadow-soft"
      role="status"
    >
      <p className="font-display text-lg font-semibold text-navy-900">
        A thoughtful guide to your skincare routine
      </p>
      <p className="mt-1.5 text-[13px] leading-6 text-muted">{WELCOME_MESSAGE}</p>
      <p className="mt-3 border-t border-blush-100 pt-2.5 text-[10px] font-medium uppercase tracking-[0.12em] text-coral-600">
        Powered by IDRAK · Not medical advice
      </p>
    </div>
  )
}

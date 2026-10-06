import { useAssistant } from '../context/AssistantContext'

export function Footer() {
  const { openAssistant } = useAssistant()

  return (
    <footer className="border-t border-navy-800/20 bg-navy-900 text-blush-100">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid gap-10 md:grid-cols-[1.4fr_1fr_1fr]">
          <div>
            <p className="font-display text-2xl font-semibold text-white">
              Skincare AI
            </p>
            <p className="mt-1 text-xs font-medium uppercase tracking-[0.18em] text-gold-400">
              Powered by IDRAK · Demo
            </p>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-blush-100/65">
              A premium single-page demo of an AI-powered skincare consultant.
              Original design for demonstration — not an official retailer
              site.
            </p>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold-400">
              Navigate
            </p>
            <ul className="mt-4 space-y-2.5 text-sm text-blush-100/80">
              <li>
                <a href="#home" className="transition hover:text-white">
                  Home
                </a>
              </li>
              <li>
                <a href="#categories" className="transition hover:text-white">
                  Categories
                </a>
              </li>
              <li>
                <a href="#ai-advisor" className="transition hover:text-white">
                  AI Advisor
                </a>
              </li>
              <li>
                <a href="#faq" className="transition hover:text-white">
                  FAQ
                </a>
              </li>
            </ul>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold-400">
              Experience
            </p>
            <p className="mt-4 text-sm text-blush-100/65">
              Ready to see the advisor panel?
            </p>
            <button
              type="button"
              onClick={() => openAssistant()}
              className="mt-4 inline-flex rounded-full bg-coral-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-coral-600"
            >
              Ask AI
            </button>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-2 border-t border-white/10 pb-16 pt-6 text-xs text-blush-100/45 sm:flex-row sm:items-center sm:justify-between sm:pb-8">
          <p>© 2026 Skincare AI Demo. All rights reserved.</p>
          <p>Not medical advice · Product details only when IDRAK returns them</p>
        </div>
      </div>
    </footer>
  )
}

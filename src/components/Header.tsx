import { useEffect, useState } from 'react'
import { Menu, MessageCircle, X } from 'lucide-react'
import { navLinks } from '../data/content'
import { useAssistant } from '../context/AssistantContext'

export function Header() {
  const { openAssistant } = useAssistant()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [mobileOpen])

  return (
    <header
      className={`sticky top-0 z-40 transition-all duration-300 ${
        scrolled
          ? 'border-b border-blush-200/60 bg-cream/90 shadow-soft backdrop-blur-md'
          : 'border-b border-transparent bg-transparent'
      }`}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3.5 sm:px-6 lg:px-8">
        <a href="#home" className="group flex items-center gap-3">
          <span className="flex size-10 items-center justify-center rounded-xl bg-navy-900 shadow-soft transition group-hover:scale-[1.03]">
            <svg
              viewBox="0 0 24 24"
              className="size-5"
              fill="none"
              aria-hidden
            >
              <path
                d="M12 3c-2.8 3.6-4.5 6.5-4.5 9a4.5 4.5 0 1 0 9 0c0-2.5-1.7-5.4-4.5-9z"
                fill="#E8A09A"
              />
              <circle cx="12" cy="12.5" r="1.6" fill="#C9A96E" />
            </svg>
          </span>
          <span className="leading-tight">
            <span className="block font-display text-xl font-semibold tracking-tight text-navy-900 sm:text-2xl">
              Skincare AI
            </span>
            <span className="block text-[11px] font-medium uppercase tracking-[0.18em] text-muted">
              by IDRAK · Demo
            </span>
          </span>
        </a>

        <nav className="hidden items-center gap-8 md:flex" aria-label="Primary">
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="text-sm font-medium text-navy-800/80 transition hover:text-coral-500"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => openAssistant()}
            className="inline-flex items-center gap-2 rounded-full bg-navy-900 px-4 py-2.5 text-sm font-medium text-white shadow-soft transition hover:bg-navy-800 hover:shadow-lift focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-coral-500"
          >
            <MessageCircle className="size-4 text-gold-400" aria-hidden />
            <span className="hidden sm:inline">Ask AI</span>
            <span className="sm:hidden">Ask</span>
          </button>

          <button
            type="button"
            className="inline-flex size-10 items-center justify-center rounded-full border border-blush-200 bg-white/70 text-navy-900 md:hidden"
            aria-expanded={mobileOpen}
            aria-controls="mobile-nav"
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            onClick={() => setMobileOpen((v) => !v)}
          >
            {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div
          id="mobile-nav"
          className="border-t border-blush-200 bg-cream/98 backdrop-blur-md md:hidden"
        >
          <nav className="mx-auto flex max-w-7xl flex-col gap-1 px-4 py-4" aria-label="Mobile">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="rounded-xl px-4 py-3 text-base font-medium text-navy-900 transition hover:bg-blush-100"
              >
                {link.label}
              </a>
            ))}
            <button
              type="button"
              onClick={() => {
                setMobileOpen(false)
                openAssistant()
              }}
              className="mt-2 rounded-xl bg-coral-500 px-4 py-3 text-left text-base font-medium text-white"
            >
              Talk to AI Advisor
            </button>
          </nav>
        </div>
      )}
    </header>
  )
}

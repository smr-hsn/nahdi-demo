import { motion } from 'framer-motion'
import { ArrowRight, Mic, Sparkles } from 'lucide-react'
import { useAssistant } from '../context/AssistantContext'
import { OptimizedImage } from './OptimizedImage'

const HERO_IMAGE = '/images/hero.jpg'
const HERO_ACCENT = '/images/hero-accent.jpg'
const HERO_DETAIL = '/images/hero-detail.jpg'

export function Hero() {
  const { openAssistant } = useAssistant()

  return (
    <section
      id="home"
      className="gradient-hero relative overflow-hidden scroll-mt-24"
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.28]"
        style={{
          backgroundImage:
            'radial-gradient(circle at 1px 1px, rgb(11 31 58 / 0.07) 1px, transparent 0)',
          backgroundSize: '28px 28px',
        }}
        aria-hidden
      />

      <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-4 pb-16 pt-12 sm:px-6 sm:pb-20 sm:pt-16 lg:grid-cols-2 lg:gap-16 lg:px-8 lg:pb-24 lg:pt-20">
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="max-w-xl"
        >
          <p className="mb-4 font-display text-lg italic text-coral-500 sm:text-xl">
            Skincare AI
          </p>
          <h1 className="font-display text-[2.45rem] font-semibold leading-[1.08] tracking-tight text-navy-900 text-balance sm:text-5xl lg:text-[3.5rem]">
            Discover Your Perfect Skincare, Guided by AI
          </h1>
          <p className="mt-5 max-w-md text-base leading-relaxed text-muted sm:text-lg">
            Personalized routines and thoughtful product guidance — in text or
            real-time voice — powered by IDRAK. A premium demo of your future
            skincare consultant.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => openAssistant()}
              className="inline-flex items-center gap-2 rounded-full bg-coral-500 px-6 py-3.5 text-sm font-semibold text-white shadow-glow transition hover:-translate-y-0.5 hover:bg-coral-600 hover:shadow-lift focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy-900"
            >
              Talk to AI Advisor
              <ArrowRight className="size-4" aria-hidden />
            </button>
            <a
              href="#categories"
              className="inline-flex items-center gap-2 rounded-full border border-navy-900/15 bg-white/80 px-6 py-3.5 text-sm font-semibold text-navy-900 backdrop-blur-sm transition hover:border-navy-900/30 hover:bg-white"
            >
              Explore Skincare
            </a>
          </div>

          <p className="mt-6 text-xs font-medium uppercase tracking-[0.16em] text-muted/80">
            Demo experience · Not medical advice
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.12, ease: [0.22, 1, 0.36, 1] }}
          className="relative mx-auto w-full max-w-lg lg:max-w-none"
        >
          <div className="relative">
            <div
              className="relative aspect-[4/5] overflow-hidden rounded-[2rem] bg-blush-200 shadow-lift sm:aspect-[5/6]"
              style={{
                backgroundImage: `url(${HERO_IMAGE})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }}
            >
              <OptimizedImage
                src={HERO_IMAGE}
                alt="Skincare serums, creams, and a jade roller arranged on linen"
                className="h-full w-full object-cover object-center"
                width={900}
                height={1080}
                priority
                sizes="(max-width: 1024px) 90vw, 42vw"
              />
              <div
                className="absolute inset-0 bg-gradient-to-t from-navy-900/45 via-navy-900/5 to-transparent"
                aria-hidden
              />
              <div className="absolute bottom-5 left-5 right-5 hidden sm:block lg:hidden">
                <p className="font-display text-xl text-white">Your ritual, refined</p>
              </div>
            </div>

            <div className="absolute -right-2 top-8 w-[7.5rem] overflow-hidden rounded-2xl border-[5px] border-cream shadow-lift sm:-right-4 sm:top-10 sm:w-36 lg:-right-6 lg:w-40">
              <OptimizedImage
                src={HERO_ACCENT}
                alt="Facial treatment with a nourishing mask"
                className="aspect-[3/4] h-full w-full object-cover"
                width={360}
                height={480}
                sizes="160px"
              />
            </div>

            <div className="absolute -left-2 top-[42%] hidden w-24 overflow-hidden rounded-2xl border-[5px] border-cream shadow-lift sm:block lg:-left-5 lg:w-28">
              <OptimizedImage
                src={HERO_DETAIL}
                alt=""
                className="aspect-square h-full w-full object-cover object-[20%_80%]"
                width={240}
                height={240}
                sizes="112px"
              />
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, x: -16, y: 12 }}
            animate={{ opacity: 1, x: 0, y: 0 }}
            transition={{ duration: 0.6, delay: 0.45 }}
            className="relative z-10 mt-5 sm:absolute sm:-left-4 sm:bottom-10 sm:mt-0 sm:w-[270px]"
          >
            <div className="rounded-2xl border border-white/70 bg-white/95 p-4 shadow-lift backdrop-blur-md">
              <div className="mb-3 flex items-center gap-2">
                <span className="flex size-8 items-center justify-center rounded-full bg-navy-900">
                  <Sparkles className="size-3.5 text-gold-400" aria-hidden />
                </span>
                <div>
                  <p className="text-sm font-semibold text-navy-900">
                    AI Consultation
                  </p>
                  <p className="text-[11px] text-muted">Live · IDRAK</p>
                </div>
                <span className="ml-auto flex size-7 items-center justify-center rounded-full bg-blush-100 text-coral-500">
                  <Mic className="size-3.5" aria-hidden />
                </span>
              </div>
              <div className="space-y-2">
                <div className="rounded-xl bg-blush-50 px-3 py-2 text-xs leading-relaxed text-navy-800">
                  “Help me build a gentle routine for sensitive skin.”
                </div>
                <div className="rounded-xl bg-navy-900 px-3 py-2 text-xs leading-relaxed text-blush-100">
                  Ask in text or start a live voice call — the advisor answers
                  from your catalog knowledge.
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}

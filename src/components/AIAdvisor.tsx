import { motion } from 'framer-motion'
import { MessageSquareText, Mic, Sparkles, Waves } from 'lucide-react'
import { useAssistant } from '../context/AssistantContext'

const features = [
  {
    icon: Sparkles,
    title: 'Personalized recommendations',
    body: 'Share your skin goals and preferences — the advisor shapes guidance around you, not a one-size catalog.',
  },
  {
    icon: MessageSquareText,
    title: 'Text consultation',
    body: 'Ask naturally in chat. Explore categories, concerns, and routine ideas at your own pace.',
  },
  {
    icon: Mic,
    title: 'Real-time voice',
    body: 'Designed for spoken conversations when you want hands-free, conversational skincare help.',
  },
]

export function AIAdvisor() {
  const { openAssistant } = useAssistant()

  return (
    <section
      id="ai-advisor"
      className="gradient-navy relative scroll-mt-24 overflow-hidden py-16 sm:py-20 lg:py-24"
    >
      <div
        className="pointer-events-none absolute -right-20 top-10 size-72 rounded-full bg-coral-500/10 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -left-16 bottom-0 size-64 rounded-full bg-gold-400/10 blur-3xl"
        aria-hidden
      />

      <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-2 lg:gap-16 lg:px-8">
        <motion.div
          initial={{ opacity: 0, x: -24 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.6 }}
        >
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold-400">
            AI Skincare Advisor
          </p>
          <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight text-white sm:text-4xl lg:text-5xl">
            Your personal guide to glowing confidence
          </h2>
          <p className="mt-4 max-w-lg text-base leading-relaxed text-blush-100/80 sm:text-lg">
            Discover how IDRAK can power a premium skincare consultant — from
            category exploration to personalized product direction, in text or
            voice. This page is a polished demo of the experience ahead.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => openAssistant()}
              className="inline-flex items-center gap-2 rounded-full bg-coral-500 px-6 py-3.5 text-sm font-semibold text-white shadow-glow transition hover:bg-coral-600"
            >
              Open AI Assistant
            </button>
            <button
              type="button"
              onClick={() =>
                openAssistant({
                  label: 'Voice preview',
                  questions: [
                    'Start a voice-style consultation for my skin type',
                    'Walk me through a 3-step evening routine',
                  ],
                })
              }
              className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/5 px-6 py-3.5 text-sm font-semibold text-white backdrop-blur-sm transition hover:bg-white/10"
            >
              <Mic className="size-4 text-gold-400" aria-hidden />
              Try Voice Preview
            </button>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="space-y-4"
        >
          {features.map((feature) => (
            <div
              key={feature.title}
              className="flex gap-4 rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm transition hover:bg-white/[0.08]"
            >
              <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-coral-500/20 text-coral-400">
                <feature.icon className="size-5" aria-hidden />
              </span>
              <div>
                <h3 className="font-display text-xl font-semibold text-white">
                  {feature.title}
                </h3>
                <p className="mt-1.5 text-sm leading-relaxed text-blush-100/70">
                  {feature.body}
                </p>
              </div>
            </div>
          ))}

          <div className="flex items-center gap-3 rounded-2xl border border-gold-400/20 bg-navy-950/40 px-5 py-4">
            <Waves className="size-5 text-gold-400" aria-hidden />
            <p className="text-sm text-blush-100/75">
              Text and voice both use the live IDRAK agent. Product names and
              links appear only when the knowledge base returns them.
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

import { motion } from 'framer-motion'
import {
  Droplets,
  Flame,
  Flower2,
  Shield,
  Sparkle,
  Sun,
} from 'lucide-react'
import { concerns } from '../data/content'
import { useAssistant } from '../context/AssistantContext'

const icons = [Droplets, Flame, Sparkle, Flower2, Shield, Sun]

export function Concerns() {
  const { openAssistant } = useAssistant()

  return (
    <section
      id="concerns"
      className="gradient-section scroll-mt-24 py-16 sm:py-20 lg:py-24"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-coral-500">
            Popular Concerns
          </p>
          <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight text-navy-900 sm:text-4xl lg:text-5xl">
            Start with what matters to you
          </h2>
          <p className="mt-4 text-base text-muted sm:text-lg">
            Select a concern to open the advisor with relevant questions — a
            calm starting point for personalized exploration.
          </p>
        </div>

        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {concerns.map((concern, index) => {
            const Icon = icons[index % icons.length]
            return (
              <motion.button
                key={concern.id}
                type="button"
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-30px' }}
                transition={{ duration: 0.4, delay: index * 0.04 }}
                whileHover={{ y: -3 }}
                onClick={() =>
                  openAssistant({
                    questions: concern.suggestedQuestions,
                    label: concern.name,
                  })
                }
                className="group flex items-start gap-4 rounded-2xl border border-blush-200/80 bg-white/80 p-5 text-left shadow-soft backdrop-blur-sm transition hover:border-coral-400/40 hover:shadow-lift focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-coral-500"
              >
                <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-blush-100 text-coral-500 transition group-hover:bg-coral-500 group-hover:text-white">
                  <Icon className="size-5" aria-hidden />
                </span>
                <div>
                  <h3 className="font-display text-xl font-semibold text-navy-900">
                    {concern.name}
                  </h3>
                  <p className="mt-1 text-sm leading-relaxed text-muted">
                    {concern.description}
                  </p>
                  <span className="mt-3 inline-block text-xs font-semibold uppercase tracking-wider text-coral-500 opacity-0 transition group-hover:opacity-100">
                    Ask AI →
                  </span>
                </div>
              </motion.button>
            )
          })}
        </div>
      </div>
    </section>
  )
}

import { motion } from 'framer-motion'
import { ArrowUpRight } from 'lucide-react'
import { categories } from '../data/content'
import { useAssistant } from '../context/AssistantContext'
import { OptimizedImage } from './OptimizedImage'

export function Categories() {
  const { openAssistant } = useAssistant()

  return (
    <section
      id="categories"
      className="scroll-mt-24 bg-cream py-16 sm:py-20 lg:py-24"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-coral-500">
            Skincare Categories
          </p>
          <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight text-navy-900 sm:text-4xl lg:text-5xl">
            Explore by ritual
          </h2>
          <p className="mt-4 text-base text-muted sm:text-lg">
            Tap a category to open the AI advisor with tailored suggested
            questions — no invented prices or ratings, just thoughtful guidance.
          </p>
        </div>

        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-5">
          {categories.map((category, index) => (
            <motion.button
              key={category.id}
              type="button"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{
                duration: 0.45,
                delay: index * 0.05,
                ease: [0.22, 1, 0.36, 1],
              }}
              whileHover={{ y: -4 }}
              onClick={() =>
                openAssistant({
                  questions: category.suggestedQuestions,
                  label: category.name,
                })
              }
              className="group relative overflow-hidden rounded-2xl text-left shadow-soft focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-coral-500"
            >
              <div className="aspect-[4/5] overflow-hidden">
                <OptimizedImage
                  src={category.image}
                  alt=""
                  className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
                  width={480}
                  height={600}
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                />
                <div
                  className="absolute inset-0 bg-gradient-to-t from-navy-950/85 via-navy-900/35 to-transparent"
                  aria-hidden
                />
              </div>
              <div className="absolute inset-x-0 bottom-0 p-4 sm:p-5">
                <div className="flex items-end justify-between gap-2">
                  <div>
                    <h3 className="font-display text-xl font-semibold text-white sm:text-2xl">
                      {category.name}
                    </h3>
                    <p className="mt-1 text-xs text-blush-100/85 sm:text-sm">
                      {category.description}
                    </p>
                  </div>
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur-sm transition group-hover:bg-coral-500">
                    <ArrowUpRight className="size-4" aria-hidden />
                  </span>
                </div>
              </div>
            </motion.button>
          ))}
        </div>
      </div>
    </section>
  )
}

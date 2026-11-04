import { MessageCircle, Sparkles } from 'lucide-react'
import { motion } from 'framer-motion'

type AssistantLauncherProps = {
  onOpen: () => void
}

export function AssistantLauncher({ onOpen }: AssistantLauncherProps) {
  return (
    <motion.button
      type="button"
      onClick={onOpen}
      whileHover={{ scale: 1.06 }}
      whileTap={{ scale: 0.94 }}
      className="relative flex size-16 items-center justify-center rounded-full bg-gradient-to-tr from-rose-600 to-amber-400 text-white shadow-2xl shadow-rose-950/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-300 md:h-14 md:w-auto md:gap-2 md:rounded-full md:px-4"
      aria-label="Open AI Skincare Advisor"
    >
      <span className="assistant-glow absolute inset-0 rounded-full" aria-hidden />
      <MessageCircle className="relative size-5" strokeWidth={1.75} aria-hidden />
      <span className="relative hidden text-sm font-semibold md:inline">Ask AI Advisor</span>
      <Sparkles className="absolute right-0 top-0 size-4 -translate-y-1/4 translate-x-1/4 rounded-full bg-slate-950 p-0.5 text-amber-300 md:hidden" aria-hidden />
      <span className="sr-only">Open chat assistant</span>
    </motion.button>
  )
}

import { Sparkles } from 'lucide-react'
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
      className="relative flex size-14 flex-col items-center justify-center gap-0.5 rounded-full bg-gradient-to-tr from-rose-600 to-amber-400 text-white shadow-2xl shadow-rose-950/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-300"
      aria-label="Open AI Skincare Advisor"
    >
      <span className="assistant-glow absolute inset-0 rounded-full" aria-hidden />
      <Sparkles className="relative size-4" strokeWidth={1.75} aria-hidden />
      <span className="relative text-[10px] font-bold tracking-[0.14em]">AI</span>
      <span className="sr-only">Open chat assistant</span>
    </motion.button>
  )
}

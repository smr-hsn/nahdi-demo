import { MessageCircle } from 'lucide-react'
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
      className="relative flex size-16 items-center justify-center rounded-full bg-navy-900 text-white shadow-lift focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-coral-500"
      aria-label="Open AI Skincare Advisor"
    >
      <span
        className="assistant-glow absolute inset-0 rounded-full"
        aria-hidden
      />
      <span
        className="absolute inset-0 rounded-full bg-gradient-to-br from-coral-500/40 via-transparent to-gold-400/30"
        aria-hidden
      />
      <MessageCircle className="relative size-7" strokeWidth={1.75} aria-hidden />
      <span className="sr-only">Open chat assistant</span>
    </motion.button>
  )
}

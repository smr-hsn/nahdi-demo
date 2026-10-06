import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { DEFAULT_SUGGESTED_QUESTIONS } from '../types/chat'

type AssistantContextValue = {
  isOpen: boolean
  suggestedQuestions: string[]
  contextLabel: string | null
  openAssistant: (options?: {
    questions?: string[]
    label?: string
  }) => void
  closeAssistant: () => void
  toggleAssistant: () => void
}

const AssistantContext = createContext<AssistantContextValue | null>(null)

const defaultQuestions = [...DEFAULT_SUGGESTED_QUESTIONS]

export function AssistantProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)
  const [suggestedQuestions, setSuggestedQuestions] =
    useState<string[]>(defaultQuestions)
  const [contextLabel, setContextLabel] = useState<string | null>(null)

  const openAssistant = useCallback(
    (options?: { questions?: string[]; label?: string }) => {
      if (options?.questions?.length) {
        setSuggestedQuestions(options.questions)
      } else if (!options?.label) {
        setSuggestedQuestions(defaultQuestions)
      }
      setContextLabel(options?.label ?? null)
      setIsOpen(true)
    },
    [],
  )

  const closeAssistant = useCallback(() => {
    setIsOpen(false)
  }, [])

  const toggleAssistant = useCallback(() => {
    setIsOpen((prev) => !prev)
  }, [])

  const value = useMemo(
    () => ({
      isOpen,
      suggestedQuestions,
      contextLabel,
      openAssistant,
      closeAssistant,
      toggleAssistant,
    }),
    [
      isOpen,
      suggestedQuestions,
      contextLabel,
      openAssistant,
      closeAssistant,
      toggleAssistant,
    ],
  )

  return (
    <AssistantContext.Provider value={value}>
      {children}
    </AssistantContext.Provider>
  )
}

export function useAssistant() {
  const ctx = useContext(AssistantContext)
  if (!ctx) {
    throw new Error('useAssistant must be used within AssistantProvider')
  }
  return ctx
}

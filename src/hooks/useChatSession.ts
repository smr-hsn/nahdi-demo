import { useCallback, useEffect, useRef, useState } from 'react'
import {
  createMessageId,
  getVisitorIds,
  sendChatMessage,
  startVoiceSession,
} from '../services/chatApi'
import { resetVisitorIds } from '../services/session'
import type { LiveKitVoiceClient } from '../services/voiceClient'
import type {
  ChatMessage,
  ChatMode,
  VoiceTranscriptEntry,
  VoiceSpeakerId,
  VoiceUiState,
} from '../types/chat'

export function useChatSession(contextLabel: string | null) {
  const [visitorIds, setVisitorIds] = useState(() => getVisitorIds())
  const sessionId = visitorIds.visitorId
  const voiceSessionId = visitorIds.voiceSessionId
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [voiceTranscript, setVoiceTranscript] = useState<VoiceTranscriptEntry[]>([])
  const [isSending, setIsSending] = useState(false)
  const [mode, setMode] = useState<ChatMode>('text')
  const [voiceId, setVoiceId] = useState<VoiceSpeakerId>('female_01')
  const [voiceState, setVoiceState] = useState<VoiceUiState>('ready')
  const [voiceError, setVoiceError] = useState<string | null>(null)
  const [voiceProductMessage, setVoiceProductMessage] = useState<ChatMessage | null>(null)
  const [isFindingVoiceProducts, setIsFindingVoiceProducts] = useState(false)
  const [voiceProductError, setVoiceProductError] = useState<string | null>(null)

  const sendingLock = useRef(false)
  const voiceProductRequestRef = useRef(0)
  const voiceAttemptRef = useRef(0)
  const sessionGenerationRef = useRef(0)
  const lastVoiceQuestionRef = useRef<VoiceTranscriptEntry | null>(null)
  const searchedVoiceQuestionRef = useRef<string | null>(null)
  const voiceClientRef = useRef<LiveKitVoiceClient | null>(null)

  useEffect(() => {
    return () => {
      void voiceClientRef.current?.disconnect()
    }
  }, [])

  const sendMessage = useCallback(
    async (raw: string) => {
      const content = raw.trim()
      if (!content || sendingLock.current) return

      const requestGeneration = sessionGenerationRef.current
      sendingLock.current = true
      setIsSending(true)
      setMode('text')

      const userMessage: ChatMessage = {
        id: createMessageId('user'),
        role: 'user',
        content,
        createdAt: new Date().toISOString(),
        status: 'sent',
      }

      setMessages((prev) => [...prev, userMessage])

      try {
        const result = await sendChatMessage({
          message: content,
          sessionId,
          history: [],
          contextLabel,
        })

        if (requestGeneration !== sessionGenerationRef.current) return
        if (result.ok) {
          setMessages((prev) => [...prev, result.message])
        } else {
          setMessages((prev) => [
            ...prev,
            {
              id: createMessageId('system'),
              role: 'system',
              content: result.error,
              createdAt: new Date().toISOString(),
              status: 'error',
            },
          ])
        }
      } finally {
        if (requestGeneration === sessionGenerationRef.current) {
          setIsSending(false)
          sendingLock.current = false
        }
      }
    },
    [contextLabel, sessionId],
  )

  const findVoiceProducts = useCallback(
    async (question: VoiceTranscriptEntry, response: VoiceTranscriptEntry) => {
      if (isKnowledgeBaseMiss(response.content)) {
        setVoiceProductMessage(null)
        setVoiceProductError(null)
        setIsFindingVoiceProducts(false)
        void voiceClientRef.current?.resumeListening()
        return
      }

      const requestId = ++voiceProductRequestRef.current
      const lookupPrompt = [
        'Use only the Nahdi product knowledge base.',
        'Find product-page links only for products named in this voice response. Do not substitute other products.',
        'Return the exact product name, canonical product URL, image URL if available, and concise details from the knowledge base.',
        'If no matching product page exists, say so without inventing a URL.',
        `Customer question: ${question.content.trim().slice(0, 800)}`,
        `Voice advisor response: ${response.content.trim().slice(0, 2200)}`,
      ].join('\n\n')

      setIsFindingVoiceProducts(true)
      setVoiceProductError(null)
      setVoiceProductMessage(null)
      void voiceClientRef.current?.resumeListening()
      try {
        const result = await sendChatMessage({
          message: lookupPrompt,
          sessionId: `voice-products-${crypto.randomUUID().replace(/-/g, '')}`,
          history: [],
          contextLabel,
        })
        if (
          requestId !== voiceProductRequestRef.current ||
          lastVoiceQuestionRef.current?.id !== question.id
        ) {
          return
        }
        if (result.ok) {
          if (isKnowledgeBaseMiss(result.message.content)) {
            setVoiceProductMessage(null)
          } else {
            setVoiceProductMessage(result.message)
          }
        } else {
          setVoiceProductError(result.error)
        }
      } catch (error) {
        if (requestId !== voiceProductRequestRef.current) return
        setVoiceProductError(
          error instanceof Error && error.message.trim()
            ? error.message
            : 'Unable to find verified product links for this voice response.',
        )
      } finally {
        if (requestId === voiceProductRequestRef.current) {
          setIsFindingVoiceProducts(false)
        }
        void voiceClientRef.current?.resumeListening()
      }
    },
    [contextLabel, voiceSessionId],
  )

  useEffect(() => {
    if (voiceState !== 'listening' && voiceState !== 'connected') return

    const response = voiceTranscript[voiceTranscript.length - 1]
    const question = lastVoiceQuestionRef.current
    if (
      !response ||
      response.speaker !== 'assistant' ||
      !response.final ||
      !question ||
      !question.content.trim() ||
      !response.content.trim() ||
      searchedVoiceQuestionRef.current === question.id
    ) {
      return
    }

    const questionIndex = voiceTranscript.findIndex((entry) => entry.id === question.id)
    const responseIndex = voiceTranscript.findIndex((entry) => entry.id === response.id)
    if (questionIndex === -1 || responseIndex <= questionIndex) return

    searchedVoiceQuestionRef.current = question.id

    if (isKnowledgeBaseMiss(response.content)) {
      setVoiceProductMessage(null)
      setVoiceProductError(null)
      setIsFindingVoiceProducts(false)
      voiceProductRequestRef.current += 1
      void voiceClientRef.current?.resumeListening()
      return
    }

    void findVoiceProducts(question, response)
  }, [findVoiceProducts, voiceState, voiceTranscript])

  const resetSession = useCallback(() => {
    sessionGenerationRef.current += 1
    voiceProductRequestRef.current += 1
    voiceAttemptRef.current += 1
    const client = voiceClientRef.current
    voiceClientRef.current = null
    if (client) {
      void client.disconnect().catch((error: unknown) => {
        setVoiceError(
          `The conversation was reset, but the voice connection could not be closed: ${describeVoiceError(error)}`,
        )
      })
    }

    const ids = resetVisitorIds()
    setVisitorIds(ids)
    setMessages([])
    setVoiceTranscript([])
    lastVoiceQuestionRef.current = null
    searchedVoiceQuestionRef.current = null
    setVoiceProductMessage(null)
    setIsFindingVoiceProducts(false)
    setVoiceProductError(null)
    setIsSending(false)
    sendingLock.current = false
    setVoiceError(null)
    setVoiceState('ready')
  }, [])

  const beginVoiceCall = useCallback(async () => {
    setMode('voice')
    if (voiceState === 'connecting' || voiceState === 'connected' || voiceState === 'listening' || voiceState === 'speaking' || voiceState === 'muted') {
      return
    }

    const attemptId = ++voiceAttemptRef.current
    voiceProductRequestRef.current += 1
    setVoiceTranscript([])
    lastVoiceQuestionRef.current = null
    searchedVoiceQuestionRef.current = null
    setVoiceProductMessage(null)
    setIsFindingVoiceProducts(false)
    setVoiceProductError(null)
    setVoiceError(null)
    setVoiceState('connecting')

    try {
      if (!window.isSecureContext && window.location.hostname !== 'localhost') {
        if (attemptId !== voiceAttemptRef.current) return
        setVoiceState('error')
        setVoiceError('Voice calls require a secure (HTTPS) browser context.')
        return
      }

      const session = await startVoiceSession(voiceId, {
        visitorId: sessionId,
        voiceSessionId,
      })
      if (attemptId !== voiceAttemptRef.current) return
      if (!session.ok) {
        setVoiceState('error')
        setVoiceError(session.error)
        return
      }

      const { LiveKitVoiceClient } = await import('../services/voiceClient')
      if (attemptId !== voiceAttemptRef.current) return
      const client = new LiveKitVoiceClient({
        onState: (state) => {
          if (attemptId !== voiceAttemptRef.current) return
          setVoiceState(state)
        },
        onError: (message) => {
          if (attemptId !== voiceAttemptRef.current) return
          setVoiceError(message)
        },
        onTranscription: (entry) => {
          if (attemptId !== voiceAttemptRef.current) return
          setVoiceTranscript((previous) => {
            const index = previous.findIndex((item) => item.id === entry.id)
            if (index === -1) return [...previous, entry]
            const next = [...previous]
            next[index] = {
              ...entry,
              final: entry.final || previous[index].final,
            }
            return next
          })

          if (!entry.final) return
          if (entry.speaker === 'user') {
            const isNewQuestion = lastVoiceQuestionRef.current?.id !== entry.id
            lastVoiceQuestionRef.current = entry
            if (isNewQuestion) {
              searchedVoiceQuestionRef.current = null
              setVoiceProductMessage(null)
              setVoiceProductError(null)
              setIsFindingVoiceProducts(false)
              voiceProductRequestRef.current += 1
            }
          }
        },
      })
      voiceClientRef.current = client
      await client.connect(session.livekit)
      if (attemptId !== voiceAttemptRef.current) {
        await client.disconnect()
      }
    } catch (error) {
      if (attemptId !== voiceAttemptRef.current) return
      const message = describeVoiceError(error)
      setVoiceError(message)
      setVoiceState('error')
    }
  }, [findVoiceProducts, sessionId, voiceId, voiceSessionId, voiceState])

  const hangUpVoiceCall = useCallback(async () => {
    voiceAttemptRef.current += 1
    const client = voiceClientRef.current
    voiceClientRef.current = null
    try {
      await client?.disconnect()
      setVoiceError(null)
      setVoiceState('disconnected')
    } catch (error) {
      setVoiceError(describeVoiceError(error))
      setVoiceState('error')
    }
  }, [])

  return {
    sessionId,
    messages,
    voiceTranscript,
    voiceProductMessage,
    isFindingVoiceProducts,
    voiceProductError,
    isSending,
    mode,
    setMode,
    voiceId,
    setVoiceId,
    voiceState,
    voiceError,
    sendMessage,
    beginVoiceCall,
    hangUpVoiceCall,
    resetSession,
  }
}

function isKnowledgeBaseMiss(content: string): boolean {
  const normalized = content.trim().toLowerCase().replace(/\s+/g, ' ')
  return (
    normalized.includes('could not find this information in the knowledge base') ||
    normalized.includes("couldn't find this information in the knowledge base") ||
    normalized.includes('cannot find this information in the knowledge base')
  )
}

function describeVoiceError(error: unknown): string {
  if (error instanceof DOMException) {
    if (error.name === 'NotAllowedError') {
      return 'Microphone permission is required for a voice call. Allow access and try again.'
    }
    if (error.name === 'NotFoundError') {
      return 'No microphone was found. Connect a microphone and try again.'
    }
    if (error.name === 'NotReadableError') {
      return 'The microphone is already in use by another application.'
    }
  }
  if (error instanceof Error && error.message.trim()) return error.message
  return 'Unable to connect audio. You can retry the call or continue in text chat.'
}

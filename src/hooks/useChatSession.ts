import { useCallback, useEffect, useRef, useState } from 'react'
import {
  checkAssistantAvailability,
  createMessageId,
  getVisitorIds,
  sendChatMessage,
  startVoiceSession,
} from '../services/chatApi'
import type { LiveKitVoiceClient } from '../services/voiceClient'
import type {
  AssistantAvailability,
  ChatMessage,
  ChatMode,
  VoiceUiState,
} from '../types/chat'

const AVAILABILITY_POLL_MS = 120_000

export function useChatSession(contextLabel: string | null, isOpen: boolean) {
  const [sessionId] = useState(() => getVisitorIds().visitorId)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isSending, setIsSending] = useState(false)
  const [mode, setMode] = useState<ChatMode>('text')
  const [voiceState, setVoiceState] = useState<VoiceUiState>('ready')
  const [voiceError, setVoiceError] = useState<string | null>(null)
  const [muted, setMuted] = useState(false)
  const [callStartedAt, setCallStartedAt] = useState<number | null>(null)
  const [availability, setAvailability] = useState<AssistantAvailability>({
    available: false,
    checkedAt: null,
  })

  const sendingLock = useRef(false)
  const voiceClientRef = useRef<LiveKitVoiceClient | null>(null)

  const refreshAvailability = useCallback(async () => {
    const available = await checkAssistantAvailability()
    setAvailability({ available, checkedAt: new Date().toISOString() })
    return available
  }, [])

  useEffect(() => {
    if (!isOpen) return
    void refreshAvailability()
    const id = window.setInterval(() => {
      void refreshAvailability()
    }, AVAILABILITY_POLL_MS)
    return () => window.clearInterval(id)
  }, [isOpen, refreshAvailability])

  useEffect(() => {
    return () => {
      void voiceClientRef.current?.disconnect()
    }
  }, [])

  const sendMessage = useCallback(
    async (raw: string) => {
      const content = raw.trim()
      if (!content || sendingLock.current) return

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
        setIsSending(false)
        sendingLock.current = false
      }
    },
    [contextLabel, sessionId],
  )

  const beginVoiceCall = useCallback(async () => {
    if (voiceState === 'connecting' || voiceState === 'connected' || voiceState === 'listening' || voiceState === 'speaking' || voiceState === 'muted') {
      return
    }

    setMode('voice')
    setVoiceError(null)
    setMuted(false)
    setVoiceState('connecting')

    try {
      if (!window.isSecureContext && window.location.hostname !== 'localhost') {
        setVoiceState('error')
        setVoiceError('Voice calls require a secure (HTTPS) browser context.')
        return
      }

      const session = await startVoiceSession()
      if (!session.ok) {
        setVoiceState('error')
        setVoiceError(session.error)
        return
      }

      const { LiveKitVoiceClient } = await import('../services/voiceClient')
      const client = new LiveKitVoiceClient({
        onState: (state) => {
          setVoiceState(state)
          if (state === 'listening' || state === 'speaking' || state === 'muted' || state === 'connected') {
            setCallStartedAt((prev) => prev ?? Date.now())
          }
          if (state === 'disconnected') {
            setCallStartedAt(null)
            setMode('text')
            setMuted(false)
            window.setTimeout(() => setVoiceState('ready'), 400)
          }
        },
        onError: (message) => {
          setVoiceError(message)
        },
      })
      voiceClientRef.current = client
      await client.connect(session.livekit)
    } catch (error) {
      const message = describeVoiceError(error)
      setVoiceError(message)
      setVoiceState('error')
      setCallStartedAt(null)
    }
  }, [voiceState])

  const hangUpVoiceCall = useCallback(async () => {
    await voiceClientRef.current?.disconnect()
    voiceClientRef.current = null
    setMuted(false)
    setCallStartedAt(null)
    setMode('text')
    setVoiceState('disconnected')
    window.setTimeout(() => setVoiceState('ready'), 400)
  }, [])

  const toggleMute = useCallback(async () => {
    const next = !muted
    setMuted(next)
    await voiceClientRef.current?.setMuted(next)
  }, [muted])

  const switchToText = useCallback(() => {
    const inCall = ['connecting', 'connected', 'listening', 'speaking', 'muted'].includes(
      voiceState,
    )
    if (inCall) {
      void hangUpVoiceCall()
      return
    }
    setMode('text')
    setVoiceState('ready')
    setVoiceError(null)
  }, [hangUpVoiceCall, voiceState])

  return {
    sessionId,
    messages,
    isSending,
    mode,
    setMode,
    voiceState,
    voiceError,
    muted,
    callStartedAt,
    availability,
    isApiConfigured: true,
    sendMessage,
    beginVoiceCall,
    hangUpVoiceCall,
    toggleMute,
    switchToText,
    refreshAvailability,
  }
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

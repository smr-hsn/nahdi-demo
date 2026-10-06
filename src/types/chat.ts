export type MessageRole = 'user' | 'assistant' | 'system'

export type ProductLink = {
  name: string
  url: string
  imageUrl?: string
}

export type ChatMessage = {
  id: string
  role: MessageRole
  content: string
  createdAt: string
  status?: 'sending' | 'sent' | 'error'
  products?: ProductLink[]
}

export type ChatMode = 'text' | 'voice'

export type VoiceUiState =
  | 'ready'
  | 'connecting'
  | 'connected'
  | 'listening'
  | 'speaking'
  | 'muted'
  | 'disconnected'
  | 'error'

/** @deprecated Use VoiceUiState */
export type VoiceCallState = VoiceUiState

export type SendMessageResult =
  | { ok: true; message: ChatMessage }
  | { ok: false; error: string }

export type AssistantAvailability = {
  available: boolean
  checkedAt: string | null
}

export type LiveKitSession = {
  url: string
  token: string
  roomName: string | null
  participantIdentity: string | null
  expiresIn: number | null
}

export type VoiceSessionResult =
  | { ok: true; sessionId: string; livekit: LiveKitSession }
  | { ok: false; error: string; receivedKeys?: string[] }

export const DEFAULT_SUGGESTED_QUESTIONS = [
  "What's best for oily skin?",
  'Recommend sunscreen for sensitive skin.',
  'Suggest a skincare routine.',
  'Recommend a hydrating serum',
] as const

export const WELCOME_MESSAGE =
  'Ask about routines, skin concerns, or products — or start a voice consultation above.'

export const VISITOR_STORAGE_KEY = 'idrak_skincare_visitor_id'
export const SESSION_STORAGE_KEY = 'idrak_skincare_session_id'

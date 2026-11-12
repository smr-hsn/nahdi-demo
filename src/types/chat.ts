export type MessageRole = 'user' | 'assistant' | 'system'

export type ProductLink = {
  name: string
  url: string
  imageUrl?: string
  price?: string
  rating?: string
  ratingCount?: string
}

export type ChatMessage = {
  id: string
  role: MessageRole
  content: string
  createdAt: string
  status?: 'sending' | 'sent' | 'error'
  products?: ProductLink[]
}

export type VoiceTranscriptEntry = {
  id: string
  speaker: 'user' | 'assistant'
  content: string
  final: boolean
}

export type ChatMode = 'text' | 'voice'

export type VoiceSpeakerId = 'female_01' | 'male_01'

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

/** Live-verified: each returns product cards with working image previews. */
export const DEFAULT_SUGGESTED_QUESTIONS = [
  'Suggest products for oily acne-prone skin',
  'What is good for dark spots on the face?',
  'What cleanser is best for combination skin?',
  'Recommend a gentle cleanser for sensitive skin',
  'Suggest a moisturizer for dry skin',
  'What sunscreen is good for oily skin?',
  'Find me an eye cream for dark circles',
  'Recommend a face cream with niacinamide',
  'What face wash is gentle for acne-prone skin?',
  'Tell me about CeraVe Moisturizing Cream',
  'Which serum helps with dark spots?',
  'What toner is good for sensitive skin?',
  'What cleanser works for oily skin?',
] as const

export const WELCOME_MESSAGE =
  'Ask about routines, skin concerns, or products — or switch to Voice and tap the avatar.'

export const VISITOR_STORAGE_KEY = 'idrak_skincare_visitor_id'
export const SESSION_STORAGE_KEY = 'idrak_skincare_session_id'

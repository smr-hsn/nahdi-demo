import { useEffect, useId, useState } from 'react'

type TalkingAdvisorAvatarProps = {
  gender: 'female' | 'male'
  isSpeaking: boolean
  isListening: boolean
}

export function TalkingAdvisorAvatar({
  gender,
  isSpeaking,
  isListening,
}: TalkingAdvisorAvatarProps) {
  const [blink, setBlink] = useState(false)
  const [mouthState, setMouthState] = useState(0)
  const gradientId = useId().replace(/:/g, '')
  const isFemale = gender === 'female'
  const skinId = `${gradientId}-skin`
  const hairId = `${gradientId}-hair`
  const attireId = `${gradientId}-attire`

  useEffect(() => {
    const interval = window.setInterval(() => {
      setBlink(true)
      window.setTimeout(() => setBlink(false), 150)
    }, 3600)
    return () => window.clearInterval(interval)
  }, [])

  useEffect(() => {
    if (!isSpeaking) return

    const lipSync = window.setInterval(() => {
      setMouthState(Math.floor(Math.random() * 4))
    }, 125)
    return () => window.clearInterval(lipSync)
  }, [isSpeaking])

  const visibleMouthState = isSpeaking ? mouthState : 0

  return (
    <div className="relative flex size-56 shrink-0 select-none items-center justify-center sm:size-60">
      <span
        className={`absolute inset-1 rounded-full transition-all duration-500 ${
          isSpeaking
            ? 'animate-pulse scale-110 bg-gradient-to-tr from-coral-500/35 via-gold-300/30 to-cyan-300/20'
            : isListening
              ? 'animate-pulse scale-105 bg-cyan-400/20'
              : 'bg-white/[0.04]'
        }`}
        aria-hidden="true"
      />
      <span
        className={`absolute inset-0 rounded-full border transition-all duration-300 ${
          isSpeaking
            ? 'scale-105 border-gold-300/80 shadow-[0_0_36px_rgba(232,106,88,0.35)]'
            : isListening
              ? 'border-cyan-200/70 shadow-[0_0_28px_rgba(34,211,238,0.25)]'
              : 'border-white/15'
        }`}
        aria-hidden="true"
      />
      <span
        className="absolute inset-3 rounded-full border border-dashed border-white/12"
        aria-hidden="true"
      />

      <div className="relative size-44 overflow-hidden rounded-full border-2 border-gold-400/90 bg-gradient-to-b from-[#F9EFEA] to-[#EAD3CB] shadow-[0_0_42px_rgba(201,169,110,0.28)] sm:size-48">
        <svg viewBox="0 0 120 120" className="size-full" aria-hidden="true">
          <defs>
            <linearGradient id={skinId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={isFemale ? '#FADBC8' : '#EAC2AA'} />
              <stop offset="100%" stopColor={isFemale ? '#EDBFA7' : '#D6A68C'} />
            </linearGradient>
            <linearGradient id={hairId} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor={isFemale ? '#3B2322' : '#1E2533'} />
              <stop offset="100%" stopColor={isFemale ? '#1F1110' : '#0B1F3A'} />
            </linearGradient>
            <linearGradient id={attireId} x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor={isFemale ? '#0B1F3A' : '#142C4E'} />
              <stop offset="100%" stopColor={isFemale ? '#1B365D' : '#0B1F3A'} />
            </linearGradient>
          </defs>

          <rect width="120" height="120" fill={isFemale ? '#F9EFEA' : '#F2EAE4'} />

          {isFemale && (
            <path
              d="M25,52 C22,82 20,105 28,118 L92,118 C100,105 98,82 95,52 C95,24 25,24 25,52 Z"
              fill={`url(#${hairId})`}
            />
          )}

          <path
            d="M20,120 C24,97 41,91 60,91 C79,91 96,97 100,120 Z"
            fill={`url(#${attireId})`}
          />
          <path
            d="M44,94 Q60,106 76,94"
            fill="none"
            stroke="#C9A96E"
            strokeWidth="2.2"
            strokeLinecap="round"
          />
          <rect x="51" y="74" width="18" height="22" rx="8" fill={`url(#${skinId})`} />
          <path
            d={
              isFemale
                ? 'M37,50 C37,31 83,31 83,50 C83,70 72,83 60,83 C48,83 37,70 37,50 Z'
                : 'M36,48 C36,30 84,30 84,48 C84,69 74,84 60,84 C46,84 36,69 36,48 Z'
            }
            fill={`url(#${skinId})`}
          />

          <ellipse cx="45" cy="62" rx="6" ry="3.2" fill="#E86A58" opacity={isFemale ? '0.28' : '0.12'} />
          <ellipse cx="75" cy="62" rx="6" ry="3.2" fill="#E86A58" opacity={isFemale ? '0.28' : '0.12'} />

          {isFemale ? (
            <path
              d="M35,50 C35,24 85,24 85,50 C83,38 72,33 60,36 C48,33 38,40 35,50 Z"
              fill={`url(#${hairId})`}
            />
          ) : (
            <path
              d="M34,48 C33,23 87,23 86,48 C85,35 76,30 62,31 C47,32 37,37 34,48 Z"
              fill={`url(#${hairId})`}
            />
          )}

          <path
            d="M43,46 Q49,43 55,46"
            fill="none"
            stroke="#241818"
            strokeWidth={isFemale ? '1.8' : '2.4'}
            strokeLinecap="round"
          />
          <path
            d="M65,46 Q71,43 77,46"
            fill="none"
            stroke="#241818"
            strokeWidth={isFemale ? '1.8' : '2.4'}
            strokeLinecap="round"
          />

          {blink ? (
            <>
              <path d="M44,53 Q49,56 54,53" fill="none" stroke="#241818" strokeWidth="1.8" strokeLinecap="round" />
              <path d="M66,53 Q71,56 76,53" fill="none" stroke="#241818" strokeWidth="1.8" strokeLinecap="round" />
            </>
          ) : (
            <>
              <circle cx="49" cy="53" r="3.2" fill="#0B1F3A" />
              <circle cx="50" cy="52" r="1" fill="#FFFFFF" />
              <circle cx="71" cy="53" r="3.2" fill="#0B1F3A" />
              <circle cx="72" cy="52" r="1" fill="#FFFFFF" />
            </>
          )}

          <path
            d="M60,54 L58.5,62 Q60,63.5 62,62"
            fill="none"
            stroke="#C7927A"
            strokeWidth="1.5"
            strokeLinecap="round"
          />

          {visibleMouthState === 0 && (
            <path
              d="M52,70 Q60,75 68,70"
              fill="none"
              stroke={isFemale ? '#D65846' : '#A6635A'}
              strokeWidth="2.3"
              strokeLinecap="round"
            />
          )}
          {visibleMouthState === 1 && (
            <ellipse cx="60" cy="71" rx="5.8" ry="2.9" fill={isFemale ? '#D65846' : '#9B5850'} />
          )}
          {visibleMouthState === 2 && (
            <ellipse
              cx="60"
              cy="71.5"
              rx="4.6"
              ry="4.3"
              fill="#7A2E2E"
              stroke={isFemale ? '#E86A58' : '#A6635A'}
              strokeWidth="1.3"
            />
          )}
          {visibleMouthState === 3 && (
            <path
              d="M53,70 Q60,76 67,70 Q60,72 53,70 Z"
              fill={isFemale ? '#D65846' : '#A6635A'}
            />
          )}

          {isFemale && (
            <circle cx="36" cy="64" r="2.2" fill="#C9A96E" stroke="#FAF7F5" strokeWidth="0.8" />
          )}
        </svg>
      </div>
    </div>
  )
}

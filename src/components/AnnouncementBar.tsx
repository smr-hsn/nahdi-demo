import { Sparkles } from 'lucide-react'

export function AnnouncementBar() {
  return (
    <div className="relative z-50 overflow-hidden bg-navy-900 text-center">
      <div
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          background:
            'linear-gradient(90deg, transparent, rgb(201 169 110 / 0.25), transparent)',
        }}
        aria-hidden
      />
      <div className="relative mx-auto flex max-w-7xl items-center justify-center gap-2 px-4 py-2.5 text-[13px] font-medium tracking-wide text-blush-100">
        <Sparkles className="size-3.5 text-gold-400" aria-hidden />
        <p>
          Premium skincare AI experience —{' '}
          <span className="text-gold-300">powered by IDRAK</span>
          <span className="mx-2 text-navy-600">·</span>
          <span className="text-blush-200/80">Demo only</span>
        </p>
      </div>
    </div>
  )
}

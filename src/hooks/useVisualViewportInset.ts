import { useEffect, type RefObject } from 'react'

/** Keeps a CSS variable in sync with the on-screen keyboard / visual viewport. */
export function useVisualViewportInset(
  elementRef: RefObject<HTMLElement | null>,
  enabled: boolean,
) {
  useEffect(() => {
    if (!enabled) return
    const element = elementRef.current
    if (!element) return

    const viewport = window.visualViewport
    const sync = () => {
      const keyboardInset = viewport
        ? Math.max(0, window.innerHeight - viewport.height - viewport.offsetTop)
        : 0
      element.style.setProperty('--keyboard-inset', `${Math.round(keyboardInset)}px`)
    }

    sync()
    viewport?.addEventListener('resize', sync)
    viewport?.addEventListener('scroll', sync)
    window.addEventListener('resize', sync)
    return () => {
      viewport?.removeEventListener('resize', sync)
      viewport?.removeEventListener('scroll', sync)
      window.removeEventListener('resize', sync)
      element.style.removeProperty('--keyboard-inset')
    }
  }, [elementRef, enabled])
}

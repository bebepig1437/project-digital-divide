import { useEffect, useRef, useState } from 'react'
import { useInView } from './useInView'

// Counts up from 0 to `target` once the element is in view.
// Respects prefers-reduced-motion (jumps straight to the value).
export function useCountUp(target, duration = 1600) {
  const [ref, inView] = useInView()
  const [value, setValue] = useState(0)
  const started = useRef(false)

  useEffect(() => {
    if (!inView || started.current) return
    started.current = true

    const prefersReduced =
      typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches

    if (prefersReduced || target === 0) {
      setValue(target)
      return
    }

    const start = performance.now()
    let frame

    const tick = (now) => {
      const progress = Math.min((now - start) / duration, 1)
      // easeOutCubic
      const eased = 1 - Math.pow(1 - progress, 3)
      setValue(Math.round(eased * target))
      if (progress < 1) frame = requestAnimationFrame(tick)
    }

    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [inView, target, duration])

  return [ref, value]
}

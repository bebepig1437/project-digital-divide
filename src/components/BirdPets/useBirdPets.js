import { useEffect, useRef } from 'react'
import useLayoutMetrics from './useLayoutMetrics'
import { FOOT_FRAC } from './birdPersonalities'

/**
 * Spawns birds perched on the headline hitboxes and anchors them.
 * Triggers gentle random idle flourishes so perched birds feel lively.
 */
export function useBirdPets({ containerRef, landmarkRef, sizes, hostRefs, perchRefs }) {
  const count = sizes.length
  const onUpdateRef = useRef(null)
  const metrics = useLayoutMetrics({ containerRef, landmarkRef, onUpdateRef })

  useEffect(() => {
    const place = (m = metrics.current) => {
      if (!m || !m.perchPoints || m.perchPoints.length === 0) return
      const points = m.perchPoints
      for (let i = 0; i < count; i++) {
        const host = hostRefs.current[i]
        const perched = perchRefs.current[i]
        if (!host) continue

        // Spread birds evenly across the available headline perch points
        const p = points[Math.floor(((i + 0.5) * points.length) / count)]
        host.style.transform = `translate(${p.x.toFixed(1)}px, ${(p.y - sizes[i] * FOOT_FRAC).toFixed(1)}px)`
        if (perched) perched.classList.remove('hidden')
      }
    }

    onUpdateRef.current = place
    place()

    // Subtle random idle flourishes while perched (tilt, flick, ruffle)
    const idleInterval = setInterval(() => {
      if (typeof window === 'undefined') return
      const idx = Math.floor(Math.random() * count)
      const el = perchRefs.current[idx]
      if (!el || el.classList.contains('hidden')) return

      const flourishes = ['pdd-idle-tilt', 'pdd-idle-flick', 'pdd-idle-ruffle']
      const flourish = flourishes[Math.floor(Math.random() * flourishes.length)]
      el.classList.add(flourish)
      setTimeout(() => el.classList.remove(flourish), 500)
    }, 7000)

    return () => {
      onUpdateRef.current = null
      clearInterval(idleInterval)
    }
  }, [sizes, metrics, hostRefs, perchRefs, count])
}

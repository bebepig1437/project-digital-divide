import { useMemo, useRef } from 'react'
import PerchedBird from './PerchedBird'
import { useBirdPets } from './useBirdPets'
import { FLOCK_ORDER, PERSONALITIES } from './birdPersonalities'

export default function BirdPets({
  count = 2,
  containerRef,
  landmarkRef,
  className = 'pointer-events-none absolute inset-0 z-20 select-none',
}) {
  const hostRefs = useRef([])
  const perchRefs = useRef([])

  const smallScreen =
    typeof window !== 'undefined' && !window.matchMedia('(min-width: 640px)').matches
  const flockSize = Math.max(1, Math.min(8, smallScreen ? Math.min(count, 2) : count))
  const flock = FLOCK_ORDER.slice(0, flockSize)
  const sizes = useMemo(() => flock.map((key) => PERSONALITIES[key].size), [flockSize])

  useBirdPets({ containerRef, landmarkRef, sizes, hostRefs, perchRefs })

  return (
    <div aria-hidden="true" className={className}>
      {flock.map((key, i) => {
        const cfg = PERSONALITIES[key]
        return (
          <span
            key={`${key}-${i}`}
            ref={(el) => {
              hostRefs.current[i] = el
            }}
            className="absolute left-0 top-0 will-change-transform"
            data-bird-host={i}
            style={{
              color: cfg.tint || undefined,
              opacity: cfg.opacity,
            }}
          >
            <PerchedBird
              ref={(el) => {
                perchRefs.current[i] = el
              }}
              id={`perch-${i}`}
              size={cfg.size}
              flipX={i % 2 === 1}
              className="hidden"
            />
          </span>
        )
      })}
    </div>
  )
}

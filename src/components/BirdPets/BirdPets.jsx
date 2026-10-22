/**
 * BirdPets — little pet birds that live in a container (hero, About, 404…).
 *
 * Each bird steers toward waypoints, avoids the landmark element (usually the
 * h1), occasionally lands on it or on the container corners, rests with
 * breathing + tiny idle flourishes, then takes off again. No gravity, no
 * physics impulses: pure waypoint steering, delta-time aware, never teleports.
 *
 * Props:
 *   count        — how many birds, 1–8 (default 4). Clamped on small screens
 *                  to 2; birds are hidden entirely below the `sm` breakpoint.
 *   containerRef — ref of the element the birds fly inside (required).
 *   landmarkRef  — ref of the element birds avoid and perch on (e.g. the h1).
 *   className    — override the wrapper classes if mounting somewhere new.
 *
 * URL consumer decides the count (e.g. Home reads ?birds=N); see BirdPets README.
 */

import { useRef } from 'react'
import FlyingBird from './FlyingBird'
import PerchedBird from './PerchedBird'
import { useBirdPets } from './useBirdPets'
import { FLOCK_ORDER, PERSONALITIES } from './birdPersonalities'

export default function BirdPets({
  count = 4,
  containerRef,
  landmarkRef,
  className = 'pointer-events-none absolute inset-0 z-20 hidden select-none sm:block',
}) {
  const hostRefs = useRef([])
  const flyRefs = useRef([])
  const perchRefs = useRef([])

  const smallScreen =
    typeof window !== 'undefined' && !window.matchMedia('(min-width: 640px)').matches
  const flockSize = Math.max(
    1,
    Math.min(8, smallScreen ? Math.min(count, 2) : count)
  )
  const flock = FLOCK_ORDER.slice(0, flockSize)

  useBirdPets({
    containerRef,
    landmarkRef,
    count: flockSize,
    hostRefs,
    flyRefs,
    perchRefs,
  })

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
            style={cfg.filter ? { filter: cfg.filter } : undefined}
          >
            <FlyingBird
              ref={(el) => {
                flyRefs.current[i] = el
              }}
              id={`bird-${i}`}
              size={cfg.size}
              bankAngle={0}
            />
            <PerchedBird
              ref={(el) => {
                perchRefs.current[i] = el
              }}
              id={`perch-${i}`}
              size={cfg.size}
              className="hidden"
            />
          </span>
        )
      })}
    </div>
  )
}

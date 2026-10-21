import { useEffect, useRef, useState } from 'react'

// Three tiny birds drift behind the hero copy, loosely keeping the cursor
// company (pointer-fine devices) or wandering on their own (touch devices).
// - Transform-only RAF updates, no layout thrash.
// - Paused entirely when the hero is offscreen (IntersectionObserver).
// - Not rendered at all under prefers-reduced-motion.
const BIRDS = [
  { size: 14, opacity: 0.7, speed: 0.9, phase: 0.0, tilt: 10, driftA: 30, driftB: 22 },
  { size: 10, opacity: 0.5, speed: 1.15, phase: 2.1, tilt: -12, driftA: 22, driftB: 30, mirror: true },
  { size: 8, opacity: 0.38, speed: 1.4, phase: 4.2, tilt: 7, driftA: 38, driftB: 16 },
]

export default function HeroBirds() {
  const hostRef = useRef(null)
  const dotRefs = useRef([])
  const [reduced] = useState(() =>
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  )

  useEffect(() => {
    if (reduced) return
    const host = hostRef.current
    if (!host) return

    let raf
    let running = true
    const t0 = performance.now()
    const finePointer = window.matchMedia('(pointer: fine)').matches
    let target = null

    const io = new IntersectionObserver(([entry]) => {
      running = entry.isIntersecting
    }, { threshold: 0 })
    io.observe(host)

    const onMove = (e) => {
      const r = host.getBoundingClientRect()
      target = { x: e.clientX - r.left, y: e.clientY - r.top }
    }
    const hero = host.closest('section')
    if (finePointer) hero?.addEventListener('pointermove', onMove, { passive: true })

    const tick = (now) => {
      raf = requestAnimationFrame(tick)
      if (!running) return
      const t = (now - t0) / 1000
      const w = host.clientWidth
      const h = host.clientHeight

      for (let i = 0; i < BIRDS.length; i++) {
        const b = BIRDS[i]
        const dot = dotRefs.current[i]
        if (!dot) continue

        let tx, ty
        if (target && finePointer) {
          // Orbit the cursor loosely; each bird keeps its own rhythm.
          tx = target.x + Math.cos(t * b.speed + b.phase) * b.driftA
          ty = target.y - 26 + Math.sin(t * b.speed + b.phase) * b.driftB
        } else {
          // No cursor (touch / idle): slow wander in the upper gradient band,
          // above the headline so birds don't smudge the copy.
          tx = w / 2 + Math.sin(t * 0.32 + b.phase) * w * 0.26
          ty = h * 0.22 + Math.cos(t * 0.24 + b.phase) * 26
        }

        if (!b.cur) b.cur = { x: tx, y: ty }
        b.cur.x += (tx - b.cur.x) * 0.05
        b.cur.y += (ty - b.cur.y) * 0.05
        const flap = Math.sin(t * 9 + b.phase) * 3
        dot.style.transform =
          `translate3d(${b.cur.x - b.size / 2}px, ${b.cur.y + flap}px, 0) rotate(${b.tilt}deg)` +
          (b.mirror ? ' scaleX(-1)' : '')
      }
    }
    raf = requestAnimationFrame(tick)

    return () => {
      cancelAnimationFrame(raf)
      io.disconnect()
      hero?.removeEventListener('pointermove', onMove)
    }
  }, [reduced])

  if (reduced) return null

  return (
    <div ref={hostRef} className="hero-bird-flock" aria-hidden="true">
      {BIRDS.map((b, i) => (
        <span
          key={i}
          ref={(n) => (dotRefs.current[i] = n)}
          className="bird-dot"
          style={{ opacity: b.opacity }}
        >
          <svg
            width={b.size}
            height={Math.round(b.size * 0.58)}
            viewBox="0 0 24 14"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            className="bird-glyph"
          >
            <path className="bird-wing" d="M2 11 C5.5 5 9.5 5 12 9 C14.5 5 18.5 5 22 11" />
          </svg>
        </span>
      ))}
    </div>
  )
}

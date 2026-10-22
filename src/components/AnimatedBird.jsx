/**
 * AnimatedBird — the hero bird: one design language, zero libraries.
 *
 * Byte-identical path data to the lucide `Bird` icon (installed
 * lucide-react v0.456.0): same viewBox, strokeWidth 2, round caps/joins.
 * The icon's wing is already a distinct path, so the art is regrouped as
 *   <g class="pdd-bird-body">  eye, body/head curve, beak, legs
 *   <g class="pdd-bird-wing">  the wing arc
 * and CSS articulates the wing around the shoulder joint (7, 18 in
 * view-box units — set in index.css).
 *
 * Idle states (props):
 *   state 'perched'  wing folded; slow scaleY breathing on the body only.
 *   state 'flapping' wing rotates -28..+12deg (~0.55s, fast downstroke)
 *                    with a 1.5deg body counter-rotation.
 *
 * Hop flight (flightIntervalMs set; Tier 1+2):
 *   Every random interval in [min, max] the bird takes off along a CSS
 *   Motion Path (offset-path / offset-distance), banking with
 *   `offset-rotate: auto`, and lands on a new perch on the enclosing
 *   <h1>'s top edge. JS touches takeoff and landing only; the flight is
 *   one CSS animation whose duration is re-rolled per flight from a
 *   weighted set. Curve shape per flight: 'arc' | 'swoop' | 's-curve'.
 *   Wing effort changes phase mid-air via classes toggled by setTimeout
 *   at 20% / 80% of the flight (all timers created only for moving
 *   birds; animationend — not timers — is the authoritative landing
 *   signal). A landing adds a 102% overshoot keyframe before re-perch.
 *   10% of flights exit through the top of the view (the hero section
 *   no longer clips); the bird perches off-screen and takes a short
 *   re-entry hop 3-7s later. prefers-reduced-motion never schedules a
 *   timer — the bird just stays perched. Falls back to never flying if
 *   the browser lacks offset-path support.
 * Never a requestAnimationFrame loop; never a layout-thrashing read.
 */

import { useEffect, useLayoutEffect, useRef, useState } from 'react'

const STATE_CLASS = {
  perched: 'pdd-bird-perched',
  flapping: 'pdd-bird-flapping',
}

const EDGE_PAD = 20 // keep perches this far from the headline's L/R edges
const MIN_HOP = 40 // minimum horizontal hop distance
const TOUCHDOWN_MS = 90 // overshoot keyframe (offset-distance 100→102→100%)

const DEFAULT_INTERVAL = [20000, 45000]
const DEFAULT_DURATIONS = [[1000, 0.2], [1800, 0.6], [3200, 0.2]]
const DEFAULT_CURVES = [['arc', 0.5], ['swoop', 0.3], ['s-curve', 0.2]]

const rand = (a, b) => a + Math.random() * (b - a)
const randInt = (a, b) => Math.round(rand(a, b))
const real = (n) => Number(n.toFixed(1))
const lerp = (a, b, t) => a + (b - a) * t
/* ---- birdBus: formation flying (Tier 3) ----
 * Module-level by design so a leader and its follower — separate component
 * instances — share one flight plan. Leader publishes the serialized plan at
 * takeoff; the follower copies the curve shape and lands offset from the
 * leader's destination, so both arcs are congruent and never cross.
 * Guards against the classic overlaps:
 *   - followerIsBusy: a follower mid-flight ignores a second leader takeoff
 *   - the plan is cleared on landing so nothing stale is ever followed
 *   - resetBirdBus() wipes ghost state after Fast Refresh in dev
 */
const birdBus = { plan: null, followerBusy: false }
export const resetBirdBus = () => {
  birdBus.plan = null
  birdBus.followerBusy = false
}
// Dev helper: hot reload leaves ghost bus state; expose a reset hook.
if (import.meta.env?.DEV && typeof window !== 'undefined') {
  window.__resetBirdBus = resetBirdBus
}
/** Leader side. */
function publishFlightPlan(plan) {
  birdBus.plan = plan
}
function clearFlightPlan() {
  birdBus.plan = null
}

/** Pick from [value, weight] pairs. */
const pickWeighted = (pairs = []) => {
  let r = Math.random()
  for (const [v, w] of pairs) {
    r -= w
    if (r <= 0) return v
  }
  return pairs[0]?.[0]
}

const reducedMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

const supportsOffsetPath = () =>
  typeof CSS !== 'undefined' && CSS.supports('offset-path', 'path("M 0 0 L 1 1")')

/* ---- Path serialization: one writer for every curve shape ---- */

/** 'arc': one quadratic whose control point sits `lift` px above the chord. */
function arcPath(p0, p1, lift) {
  return `path("M ${real(p0.x)} ${real(p0.y)} Q ${real((p0.x + p1.x) / 2)} ${real(Math.min(p0.y, p1.y) - lift)} ${real(p1.x)} ${real(p1.y)}")`
}

/** 'swoop': cubic with both controls `dip` px below the chord (dive & recover). */
function swoopPath(p0, p1, dip) {
  return (
    `path("M ${real(p0.x)} ${real(p0.y)}` +
    ` C ${real(lerp(p0.x, p1.x, 0.33))} ${real((p0.y + p1.y) / 2 + dip)}` +
    ` ${real(lerp(p0.x, p1.x, 0.67))} ${real((p0.y + p1.y) / 2 + dip)}` +
    ` ${real(p1.x)} ${real(p1.y)}")`
  )
}

/** 's-curve': two quadratics through the midpoint; one control above, one below. */
function sCurvePath(p0, p1, lift, dip, flip) {
  const mx = real((p0.x + p1.x) / 2)
  const my = real((p0.y + p1.y) / 2)
  const up = real(my - lift / 2)
  const down = real(my + dip / 2)
  const cy1 = flip ? down : up
  const cy2 = flip ? up : down
  return (
    `path("M ${real(p0.x)} ${real(p0.y)}` +
    ` Q ${real(lerp(p0.x, p1.x, 0.25))} ${cy1} ${mx} ${my}` +
    ` Q ${real(lerp(p0.x, p1.x, 0.75))} ${cy2} ${real(p1.x)} ${real(p1.y)}")`
  )
}

const serialize = (curve, p0, p1, o) =>
  curve === 'swoop' ? swoopPath(p0, p1, o.dip)
  : curve === 's-curve' ? sCurvePath(p0, p1, o.lift, o.dip, o.flip)
  : arcPath(p0, p1, o.lift)

/* ---- Flight planning ---- */

/** Random perch on the headline's top edge, at least MIN_HOP away. */
function pickPerch(from, maxX) {
  const minX = EDGE_PAD
  for (let i = 0; i < 40; i++) {
    const x = minX + Math.random() * (maxX - minX)
    const y = real(rand(-9, -3))
    if (Math.abs(x - from.x) >= MIN_HOP) return { x, y }
  }
  return { x: from.x - minX < maxX - from.x ? maxX : minX, y: real(rand(-9, -3)) }
}

/**
 * Where a flight ends. Normal flights land on the top edge. With
 * `exitChance` (default 10%) the destination is past the top of the
 * viewport — an off-view perch the user never sees, followed (at
 * landing) by a short re-entry hop back into view.
 */
function pickDestination(from, maxX, exitChance, heroClips, exitYMax) {
  if (Math.random() < exitChance) {
    return {
      dest: heroClips
        ? { x: rand(EDGE_PAD, maxX), y: real(-rand(80, exitYMax)) } // inside hero, dramatic rise
        : { x: rand(EDGE_PAD, maxX), y: real(-exitYMax - rand(20, 120)) }, // off-view
      isExit: !heroClips,
    }
  }
  return { dest: pickPerch(from, maxX), isExit: false }
}

/**
 * Tier 4 cross-flight: one wide two-quadratic path from edge to edge that
 * passes exactly through `mid` (the CTA-clearance waypoint). The dip is a
 * waypoint in the curve, never a flight segment or a landing spot, so the
 * bird cannot fold its wings or re-take off mid-arc.
 */
function crossPath(p0, p1, mid) {
  const c1 = { x: real(lerp(p0.x, mid.x, 0.62)), y: real(mid.y + 12) } // dive in
  const c2 = { x: real(lerp(mid.x, p1.x, 0.45)), y: real(Math.max(mid.y * 0.45, p1.y + 6)) } // rise out
  return (
    `path("M ${real(p0.x)} ${real(p0.y)}` +
    ` Q ${c1.x} ${c1.y} ${real(mid.x)} ${real(mid.y)}` +
    ` Q ${c2.x} ${c2.y} ${real(p1.x)} ${real(p1.y)}")`
  )
}

/** First CTA anchor below the h1 (next-sibling walk, ≤4 hops). */
function findCtaAnchor(h1) {
  let n = h1.nextElementSibling
  for (let i = 0; n && i < 4; i++) {
    const a = n.querySelector?.('a')
    if (a) return a
    n = n.nextElementSibling
  }
  return null
}

export default function AnimatedBird({
  size = 17,
  state = 'perched',
  className = '',
  id,
  flightIntervalMs = 0, // [min, max] or nonzero number; 0 disables flight
  flightDurationsMs = DEFAULT_DURATIONS,
  arcLift = [20, 140],
  curves = DEFAULT_CURVES,
  curveType = null, // force 'arc' | 'swoop' | 's-curve'
  exitChance = 0.1,
  startXFrac = null, // initial perch as fraction of headline width; null = right edge
  startY = -8,
  followOf = null, // Tier 3: the bird whose takeoff we may shadow
  followChance = 0.85, // probability we take a published plan
  followDelayMs = 400, // hop after the leader departs
  crossFlights = false, // Tier 4: every 4th-5th flight, cross the whole headline
  crossDurationMs = 3800,
  crossDipPx = 40, // clearance above the CTA row at the dip
}) {
  const elRef = useRef(null)
  const posRef = useRef(null)
  const destRef = useRef(null)
  const flightRef = useRef(null)
  const timersRef = useRef([]) // per-bird instances: untied from other birds
  const scheduledRef = useRef(null)
  const visibleRef = useRef(true)
  const earlyRef = useRef(null) // { delayMs } one-shot re-entry override
  const publishedRef = useRef(null) // flight plan this bird published (leader)
  const crossStateRef = useRef({ count: 0, every: 4 }) // Tier 4 counter
  const [pos, setPos] = useState(null)
  const [flight, setFlight] = useState(null) // { phase, path, durationMs }

  const flightOn = !!flightIntervalMs

  // Reduce motion => never create a single timer. Flight CSS is also dead.
  const canFly = () => flightOn && posRef.current && !reducedMotion() && supportsOffsetPath()

  // ---- followers: poll the bus; only act while idle ----
  const checkFlightPlan = () => {
    if (!followOf || !birdBus.plan || birdBus.followerBusy || flightRef.current) return
    // Only the assigned leader's plan — never an unrelated bird's — and only
    // while it is fresh: a plan older than ~1.2s is the leader already mid-air.
    if (birdBus.plan.leaderId !== followOf) return
    if (Date.now() - birdBus.plan.t > 1200) return
    if (Math.random() > followChance) return
    if (!canFly()) return
    const el = elRef.current
    const h1 = el?.closest('h1')
    if (!h1) return
    const w = h1.getBoundingClientRect().width
    const maxX = Math.max(EDGE_PAD, w - size - EDGE_PAD)
    // Formation vector: destination rides +24px, -10px off the leader's
    // landing point; the curve shape (jitter) is copied verbatim so both
    // arcs are congruent and never cross. Out of bounds => don't follow.
    const dest = { x: real(birdBus.plan.dest.x + 24), y: real(birdBus.plan.dest.y - 10) }
    if (dest.x < EDGE_PAD || dest.x > maxX) return
    const plan = birdBus.plan
    birdBus.plan = null // consume: one follower, one use
    birdBus.followerBusy = true
    flightRef.current = { dest, isExit: false }
    destRef.current = dest
    at(followDelayMs, () => {
      if (flightRef.current && canFly()) {
        at(0.2 * plan.durationMs, () => setFlightPhase('glide'))
        at(0.8 * plan.durationMs, () => setFlightPhase('landing'))
        setFlight({
          phase: 'takeoff',
          path: serialize(plan.curve, posRef.current, dest, plan.jitter),
          durationMs: plan.durationMs,
        })
      } else {
        // Leader landed / conditions changed before our delayed hop: release.
        birdBus.followerBusy = false
        flightRef.current = null
      }
    })
  }
  // One bounded poller per follower (no RAF; cheap at N=1 follower).
  useEffect(() => {
    if (!flightOn || !followOf) return undefined
    const iv = setInterval(checkFlightPlan, 150)
    return () => clearInterval(iv)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flightOn, followOf, followChance, followDelayMs, size])

  // ---- timers: only these two helpers ever create timeouts ----
  const clearTimers = () => {
    timersRef.current.forEach(clearTimeout)
    timersRef.current = []
    if (scheduledRef.current) clearTimeout(scheduledRef.current)
    scheduledRef.current = null
  }
  const at = (ms, fn) => {
    const t = setTimeout(fn, ms)
    timersRef.current.push(t)
    return t
  }
  const setScheduled = (fn, ms) => {
    if (scheduledRef.current) clearTimeout(scheduledRef.current)
    scheduledRef.current = setTimeout(fn, ms)
  }

  useEffect(() => clearTimers, []) // unmount: clear this bird's timers only

  // ---- scheduling ----
  const takeoff = (forced) => {
    if (flightRef.current || !canFly()) return
    const el = elRef.current
    const h1 = el?.closest('h1')
    if (!h1) return
    const w = h1.getBoundingClientRect().width
    const maxX = Math.max(EDGE_PAD, w - size - EDGE_PAD)

    // Hero clipping check: only the section itself may clip (we dropped
    // its overflow-hidden; this stays as a runtime guard if it returns).
    const section = h1.closest('section')
    const clips =
      !!section && getComputedStyle(section).overflow !== 'visible'
    // Headroom above the h1 when clipped = distance to the section top.
    let exitYMax = 260
    if (clips && section) {
      exitYMax = Math.max(
        60,
        h1.getBoundingClientRect().top - section.getBoundingClientRect().top - 30
      )
    }

    const from = posRef.current

    // Tier 4: every 4th-5th self-scheduled flight, a wide cross-flight —
    // edge to edge over the CTAs, dipping crossDipPx above them at the
    // midpoint. CTA box is measured fresh at takeoff (it can move on
    // scroll/resize); hidden/zero-rect CTA => normal hop, count sticks.
    if (!forced && crossFlights) {
      const cs = crossStateRef.current
      cs.count += 1
      if (cs.count >= cs.every) {
        const ctaAnchor = findCtaAnchor(h1)
        if (ctaAnchor) {
          const cta = ctaAnchor.getBoundingClientRect()
          const h1r = h1.getBoundingClientRect()
          if (cta.width > 0 && cta.top > h1r.top) {
            const dipY = real(cta.top - h1r.top - crossDipPx)
            const dipX = real(w / 2 + rand(-40, 40))
            // Land on a random headline letter on the opposite half.
            const leftStart = from.x < w / 2
            const lo = leftStart ? w / 2 + 30 : EDGE_PAD + 10
            const hi = leftStart ? maxX - 10 : w / 2 - 30
            const dest = { x: real(Math.max(lo, Math.min(hi, rand(lo, hi)))), y: real(rand(-9, -3)) }
            cs.count = 0
            cs.every = Math.random() < 0.5 ? 4 : 5
            destRef.current = dest
            flightRef.current = { dest, isExit: false }
            at(0.2 * crossDurationMs, () => setFlightPhase('glide'))
            at(0.8 * crossDurationMs, () => setFlightPhase('landing'))
            setFlight({
              phase: 'takeoff',
              path: crossPath(from, dest, { x: dipX, y: dipY }),
              durationMs: crossDurationMs,
            })
            return
          }
        }
      }
    }

    const { dest, isExit } =
      forced || pickDestination(from, maxX, exitChance, clips, exitYMax)
    const curve = curveType || pickWeighted(curves)
    const jitter = { lift: rand(arcLift[0], arcLift[1]), dip: rand(20, 40), flip: Math.random() < 0.5 }
    const durationMs = forced?.durationMs ?? pickWeighted(flightDurationsMs)

    destRef.current = dest
    flightRef.current = { dest, isExit }
    if (!followOf) {
      // Tier 3: leaders publish their plan for their follower to ride.
      // leaderId ties the plan to this bird so followOf never matches a stranger.
      const pub = { curve, jitter, durationMs, dest, t: Date.now(), leaderId: id }
      publishedRef.current = pub
      publishFlightPlan(pub)
    }
    at(0.2 * durationMs, () => setFlightPhase('glide'))
    at(0.8 * durationMs, () => setFlightPhase('landing'))
    setFlight({ phase: 'takeoff', path: serialize(curve, from, dest, jitter), durationMs })
  }
  const takeoffRef = useRef(null)
  takeoffRef.current = takeoff

  const setFlightPhase = (phase) =>
    setFlight((f) => (f ? { ...f, phase } : f))

  const scheduleNext = () => {
    if (!canFly()) return
    if (!visibleRef.current) return
    const [lo, hi] = Array.isArray(flightIntervalMs) ? flightIntervalMs : [flightIntervalMs, flightIntervalMs]
    const delay = earlyRef.current ?? rand(lo, hi)
    earlyRef.current = null
    setScheduled(takeoffRef.current, delay)
  }

  // ---- initial perch ----
  useLayoutEffect(() => {
    if (!flightOn) return
    const h1 = elRef.current?.closest('h1')
    if (!h1) return
    const w = h1.getBoundingClientRect().width
    const x = startXFrac == null ? w - size - 10 : w * startXFrac - size / 2
    const p = { x: real(Math.max(EDGE_PAD, x)), y: startY }
    posRef.current = p
    setPos(p)
  }, [flightOn, size, startXFrac, startY])

  // ---- run loop wiring: one IntersectionObserver + resurrection for HMR ----
  // HOT-RELOAD SAFETY: Fast Refresh recreates the svg element mid-flight,
  // which cancels the running CSS animation; no animationend fires and the
  // bird would stay in is-landing forever (blocking all later flights).
  // heal-zombie: if we think we are flying but no animation is live, land.
  const healZombie = () => {
    if (!flightRef.current) return
    const anims = elRef.current?.getAnimations?.() || []
    if (!anims.some((a) => a.playState === 'running')) {
      const dest = flightRef.current.dest
      clearTimers()
      flightRef.current = null
      setFlight(null)
      if (publishedRef.current) {
        clearFlightPlan()
        publishedRef.current = null
      }
      if (followOf) birdBus.followerBusy = false // was the follower: release
      if (dest) {
        posRef.current = dest
        setPos(dest)
      }
    }
  }

  useEffect(() => {
    if (!flightOn) return undefined
    const h1 = elRef.current?.closest('h1')
    if (!h1) return undefined
    const io = new IntersectionObserver(
      ([entry]) => {
        visibleRef.current = entry.isIntersecting
        if (entry.isIntersecting) {
          healZombie()
          if (!flightRef.current) scheduleNext()
        } else {
          // Scroll-away mid-flight: kill pending timers; the running CSS
          // animation finishes on its own and lands via animationend.
          timersRef.current.forEach(clearTimeout)
          timersRef.current = []
          if (scheduledRef.current) clearTimeout(scheduledRef.current)
          scheduledRef.current = null
        }
      },
      { threshold: 0.1 }
    )
    io.observe(h1)
    return () => io.disconnect()
  }, [flightOn, flight !== null, flight?.path])

  // prefers-reduced-motion toggled mid-session: on → kill every pending
  // timer (canFly() will refuse future takeoffs); off → re-arm the idle
  // schedule. Without this, a timer that fires while reduce is on
  // consumes itself and the bird never flies again.
  useEffect(() => {
    if (!flightOn) return undefined
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const onChange = () => {
      if (mq.matches) {
        clearTimers()
      } else if (!flightRef.current) {
        scheduleNext()
      }
    }
    mq.addEventListener?.('change', onChange)
    return () => mq.removeEventListener?.('change', onChange)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flightOn])

  // Resize mid-flight: cancel in place (snap home), recompute next takeoff.
  useEffect(() => {
    if (!flightOn) return undefined
    const onResize = () => {
      if (flightRef.current) {
        clearTimers()
        flightRef.current = null
        setFlight(null)
        if (publishedRef.current) {
          clearFlightPlan()
          publishedRef.current = null
        }
        if (followOf) birdBus.followerBusy = false
      }
      const h1 = elRef.current?.closest('h1')
      const p = posRef.current
      if (!h1 || !p) return
      const w = h1.getBoundingClientRect().width
      const clamped = {
        x: Math.min(Math.max(EDGE_PAD, p.x), Math.max(EDGE_PAD, w - size - EDGE_PAD)),
        y: Math.max(p.y, -9),
      }
      posRef.current = clamped
      setPos(clamped)
    }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [flightOn, size])

  // ---- landing: animationend is authoritative ----
  const onAnimationEnd = (e) => {
    if (e.animationName === 'pdd-bird-flight') {
      setFlight((f) => (f ? { ...f, phase: 'touchdown' } : f))
    } else if (e.animationName === 'pdd-bird-touchdown') {
      const cur = flightRef.current
      clearTimers()
      flightRef.current = null
      setFlight(null)
      if (publishedRef.current) {
        clearFlightPlan()
        publishedRef.current = null
      }
      if (followOf) birdBus.followerBusy = false // was the follower: release
      if (cur?.dest) {
        const clamped = { ...cur.dest }
        posRef.current = clamped
        setPos(clamped)
        // Exits land off-view: come back quickly instead of waiting a full interval.
        earlyRef.current = cur.isExit ? rand(3000, 7000) : null
        if (earlyRef.current) scheduleNext()
      }
    }
  }

  const wrapperStyle = flightOn
    ? {
        transform: flight || !pos ? 'translate(0, 0)' : `translate(${pos.x}px, ${pos.y}px)`,
        visibility: pos ? 'visible' : 'hidden',
        ...(flight ? { '--flight-path': flight.path, '--flight-dur': `${flight.durationMs}ms` } : {}),
      }
    : undefined

  const flightClass =
    flight === null ? '' : `is-flying is-${flight.phase}` // takeoff|glide|landing|touchdown

  return (
    <svg
      ref={elRef}
      data-bird={id || undefined}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`pdd-bird ${STATE_CLASS[state] ?? STATE_CLASS.perched} ${flightClass} ${className}`}
      style={wrapperStyle}
      onAnimationEnd={onAnimationEnd}
      aria-hidden="true"
    >
      <g className="pdd-bird-body">
        <path d="M16 7h.01" />
        <path d="M3.4 18H12a8 8 0 0 0 8-8V7a4 4 0 0 0-7.28-2.3L2 20" />
        <path d="m20 7 2 .5-2 .5" />
        <path d="M10 18v3" />
        <path d="M14 17.75V21" />
      </g>
      <g className="pdd-bird-wing">
        <path d="M7 18a6 6 0 0 0 3.84-10.61" />
      </g>
    </svg>
  )
}

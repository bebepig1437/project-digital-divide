/**
 * BirdFlock — waypoint-steering flock of birds in the hero.
 *
 * Single RAF loop, delta-time aware (dt normalized to 60fps frames). No gravity,
 * no impulses, no bounce: each bird has a DESTINATION and steers toward it
 * (Reynolds-style arrive/seek), picks a new waypoint when it arrives, and
 * occasionally perches on the headline or hero corners with real arrival
 * behavior (no teleporting).
 *
 * Frame model:
 *   desired  = normalize(target - position) * maxSpeed
 *   steering = (desired - velocity) * steerStrength
 *   velocity += steering * dt
 *   velocity  = clampMagnitude(velocity, speedLimit)
 *   position += velocity * dt
 *
 * States: flying (steer + repulsion) -> arriving (slowing descent onto a perch,
 * arrival radius 6px + speed 0.3, 4s safety timeout) -> perched (still, breathing,
 * rests) -> flying. SVG swap is DOM-level (hidden toggles); React never
 * re-renders per frame.
 *
 * Flapping is state-driven: wings flap continuously while flying or arriving at
 * the personality's cadence, and stop when perched (PerchedBird SVG shows).
 *
 * Gates preserved: prefers-reduced-motion -> static perched birds, no RAF;
 * IntersectionObserver pause offscreen; pointer-events none; hidden below sm;
 * ?birds=4 renders 4; personalities + hue filters kept.
 */

import { useEffect, useRef } from 'react'
import FlyingBird from './FlyingBird'
import PerchedBird from './PerchedBird'

// Steering constants
const TARGET_ARRIVE_RADIUS = 30 // px: waypoint considered reached
const INSET = 60 // px: targets stay this far inside the hero
const H1_REJECT_DIST = 80 // px: sampled targets must stay this far off the h1
const SELF_REJECT_DIST = 120 // px: targets must be at least this far from the bird
const SAMPLE_TRIES = 10
const SUBROUTE_CHANCE = 0.3
const SUBROUTE_WAYPOINTS = [1, 2]
const SUBROUTE_OFFSET = 80 // px perpendicular offset for mid-flight direction changes
const REPULSION_PAD = 50 // px: expanded headline box for curving away
const REPULSION_BEND = 0.8 // how hard the desired direction bends away in the pad
const ARRIVE_RADIUS = 6 // px: close enough to land
const ARRIVE_SPEED = 0.3 // px/frame: slow enough to land
const ARRIVE_SAFETY_MS = 4000
const ARRIVE_TERM_FACTOR = 0.1 // desiredSpeed = min(maxSpeed, dist * factor)
const DART_SPEED = 4.5
const DART_DECAY_MS = 1500 // overspeed allowed while dart velocity bleeds off
const HOVER_DECAY = 0.92 // per-frame velocity decay while hovering
const HOVER_MS = 500
const TAKEOFF_SPEED = 1.5
const DT_MAX = 1.33 // caps per-frame displacement at 4.5 * 1.33 ≈ 5.98px < 6px
const FOOT_FRAC = 0.42 // distance from perched bird center down to its feet

const rand = (min, max) => min + Math.random() * (max - min)
const clamp = (val, min, max) => Math.max(min, Math.min(max, val))
const clampMag = (vx, vy, max) => {
  const m = Math.hypot(vx, vy)
  if (m <= max || m === 0) return [vx, vy]
  const s = max / m
  return [vx * s, vy * s]
}

const isReducedMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

const PERSONALITIES = {
  wanderer: {
    size: 24,
    maxSpeed: 2.2,
    steerStrength: 0.06,
    wingDur: '450ms',
    maxBank: 40,
    perchEvery: [12000, 20000],
    rest: [5000, 8000],
    filter: null,
  },
  hummer: {
    size: 20,
    maxSpeed: 3.6,
    steerStrength: 0.12,
    wingDur: '220ms',
    maxBank: 50,
    perchEvery: [12000, 20000],
    rest: [5000, 8000],
    dart: [2500, 4000],
    filter: 'hue-rotate(15deg) brightness(1.1)',
  },
  glider: {
    size: 28,
    maxSpeed: 1.4,
    steerStrength: 0.04,
    wingDur: '600ms',
    maxBank: 30,
    perchEvery: [15000, 25000],
    rest: [8000, 12000],
    filter: 'hue-rotate(-15deg) opacity(0.85)',
  },
}

const FLOCK_ORDER = ['wanderer', 'hummer', 'glider', 'wanderer']

// Start positions (fraction of hero) so the default pair spreads out.
const START_SLOTS = [
  { xFrac: 0.12, yFrac: 0.24 },
  { xFrac: 0.85, yFrac: 0.3 },
  { xFrac: 0.2, yFrac: 0.72 },
  { xFrac: 0.78, yFrac: 0.66 },
]

export default function BirdFlock({ heroRef, h1Ref, count = 2 }) {
  const hostRefs = useRef([])
  const flyRefs = useRef([])
  const perchRefs = useRef([])

  useEffect(() => {
    const heroEl = heroRef?.current
    if (!heroEl) return undefined

    let rafId = null
    let inView = true
    let reduced = isReducedMotion()

    // ---- geometry ------------------------------------------------------
    const measureGeometry = () => {
      const heroRect = heroEl.getBoundingClientRect()
      const h1El = h1Ref?.current || heroEl.querySelector('h1')
      const h1Rect = h1El ? h1El.getBoundingClientRect() : null
      return {
        w: heroRect.width,
        h: heroRect.height,
        h1: h1Rect
          ? {
              left: h1Rect.left - heroRect.left,
              right: h1Rect.right - heroRect.left,
              top: h1Rect.top - heroRect.top,
              bottom: h1Rect.bottom - heroRect.top,
            }
          : null,
      }
    }

    const geom0 = measureGeometry()
    if (geom0.w <= 0 || geom0.h <= 0) return undefined
    const W0 = Math.max(geom0.w, 320)
    const H0 = Math.max(geom0.h, 240)
    const now0 = performance.now()

    // ---- birds ----------------------------------------------------------
    const flockSize = count === 4 ? 4 : 2

    const birds = FLOCK_ORDER.slice(0, flockSize).map((key, i) => {
      const cfg = PERSONALITIES[key]
      const slot = START_SLOTS[i]
      return {
        id: `bird-${i}-${key}`,
        key,
        cfg,
        x: clamp(slot.xFrac * W0, INSET, Math.max(INSET, W0 - INSET)),
        y: clamp(slot.yFrac * H0, INSET, Math.max(INSET, H0 - INSET)),
        vx: 0,
        vy: 0,
        facing: 1,
        state: 'flying', // flying | arriving | perched
        target: null,
        waypointQueue: [],
        perchIdx: -1,
        restUntil: 0,
        nextPerchAt: 0,
        nextDartAt: 0,
        dartUntil: 0,
        hoverUntil: 0,
        arriveStart: 0,
        hardApproach: false,
      }
    })

    // ---- target sampling ------------------------------------------------
    const distToRect = (px, py, r) => {
      const dx = Math.max(r.left - px, 0, px - r.right)
      const dy = Math.max(r.top - py, 0, py - r.bottom)
      return Math.hypot(dx, dy)
    }

    const samplePoint = (b, g) => {
      // Weighted thirds: left and right thirds 3x higher than the center third
      // (birds spend most of their time near the margins).
      const thirds = [
        { xMin: INSET, xMax: Math.max(INSET + 1, g.w / 3), w: 3 },
        { xMin: g.w / 3, xMax: Math.max(g.w / 3 + 1, (2 * g.w) / 3), w: 1 },
        { xMin: (2 * g.w) / 3, xMax: Math.max((2 * g.w) / 3 + 1, g.w - INSET), w: 3 },
      ]
      const totalW = thirds.reduce((s, t) => s + t.w, 0)
      let roll = Math.random() * totalW
      let third = thirds[0]
      for (const t of thirds) {
        if (roll < t.w) {
          third = t
          break
        }
        roll -= t.w
      }
      return {
        x: clamp(rand(third.xMin, third.xMax), INSET, Math.max(INSET, g.w - INSET)),
        y: clamp(rand(INSET, Math.max(INSET + 1, g.h - INSET)), INSET, Math.max(INSET, g.h - INSET)),
      }
    }

    const pickTarget = (b, g, now) => {
      let best = null
      let bestScore = -1
      for (let i = 0; i < SAMPLE_TRIES; i++) {
        const p = samplePoint(b, g)
        let ok = true
        if (g.h1 && distToRect(p.x, p.y, g.h1) < H1_REJECT_DIST) ok = false
        if (Math.hypot(p.x - b.x, p.y - b.y) < SELF_REJECT_DIST) ok = false
        if (ok) {
          best = p
          break
        }
        // remember the best-effort candidate (farthest from h1)
        const score = g.h1 ? distToRect(p.x, p.y, g.h1) : Infinity
        if (score > bestScore) {
          bestScore = score
          best = p
        }
      }
      if (!best) best = samplePoint(b, g)

      // 30% of selections: subroute to a far point on the opposite side,
      // with 1-2 intermediate waypoints offset perpendicular from the line.
      if (Math.random() < SUBROUTE_CHANCE) {
        const farX =
          b.x < g.w / 2
            ? rand(Math.max((g.w * 0.55), INSET), Math.max(INSET + 1, g.w - INSET))
            : rand(INSET, Math.max(INSET + 1, g.w * 0.45))
        const far = { x: farX, y: clamp(rand(INSET, g.h - INSET), INSET, Math.max(INSET, g.h - INSET)) }
        const dx = far.x - b.x
        const dy = far.y - b.y
        const len = Math.max(1, Math.hypot(dx, dy))
        const nWps = Math.round(rand(SUBROUTE_WAYPOINTS[0], SUBROUTE_WAYPOINTS[1]))
        const q = []
        for (let k = 1; k <= nWps; k++) {
          const t = rand(0.3, 0.7)
          const off = rand(-SUBROUTE_OFFSET, SUBROUTE_OFFSET)
          q.push({
            x: clamp(b.x + dx * t + (-dy / len) * off, INSET, Math.max(INSET + 1, g.w - INSET)),
            y: clamp(b.y + dy * t + (dx / len) * off, 0, Math.max(1, g.h)),
          })
        }
        q.push(far)
        b.waypointQueue = q
        b.target = q.shift()
      } else {
        b.waypointQueue = []
        b.target = best
      }
    }

    // ---- perch points (10) -----------------------------------------------
    // h1 top-left (-8,-8), h1 top-right (+8,-8), hero TL (+16,+16), hero TR
    // (-16,+16), plus 6 points evenly along the h1 top edge (1/7 width spacing,
    // offset -8 above). occupancy tracks which bird holds each point.
    let perchPts = []
    const buildPerches = () => {
      const g = measureGeometry()
      const oldOccupancy = perchPts.map((p) => p.occupiedBy)
      const pts = []
      if (g.h1) {
        pts.push({ x: g.h1.left - 8, y: g.h1.top - 8 })
        pts.push({ x: g.h1.right + 8, y: g.h1.top - 8 })
      }
      pts.push({ x: 16, y: 16 })
      pts.push({ x: g.w - 16, y: 16 })
      if (g.h1) {
        const span = g.h1.width / 7
        for (let k = 1; k <= 6; k++) {
          pts.push({ x: g.h1.left + k * span, y: g.h1.top - 8 })
        }
      }
      // Rebuild at the same indices so occupancy carries across resizes.
      perchPts = pts.map((p, i) => ({
        x: clamp(p.x, 4, Math.max(4, g.w - 4)),
        y: clamp(p.y, 4, Math.max(4, g.h - 4)),
        occupiedBy: oldOccupancy[i] ?? null,
      }))
      // Drop occupancy held by birds that are no longer perched.
      const perchedIds = new Set(
        birds.filter((b) => b.state === 'perched').map((b) => b.id)
      )
      perchPts.forEach((p) => {
        if (p.occupiedBy && !perchedIds.has(p.occupiedBy)) p.occupiedBy = null
      })
      return g
    }
    buildPerches()

    // ---- rendering -------------------------------------------------------
    const setFlapDur = (i) => {
      const fly = flyRefs.current[i]
      if (fly && !fly.style.getPropertyValue('--pdd-flap-dur')) {
        fly.style.setProperty('--pdd-flap-dur', birds[i].cfg.wingDur)
      }
    }

    const renderBird = (b, i) => {
      const host = hostRefs.current[i]
      const fly = flyRefs.current[i]
      const perched = perchRefs.current[i]
      if (!host) return
      host.dataset.state = b.state
      setFlapDur(i)

      const flying = b.state === 'flying' || b.state === 'arriving'
      if (fly) {
        fly.classList.toggle('is-flapping', flying && !reduced)
        fly.classList.toggle('hidden', b.state === 'perched')
      }
      if (perched) {
        perched.classList.toggle('hidden', b.state !== 'perched')
      }

      if (b.state === 'perched') {
        // Anchor convention is unified with flight: the host sits at (x, y),
        // sprite offsets come from CSS margins set at mount — no position jump
        // on landing.
        host.style.transform =
          `translate(${b.x.toFixed(1)}px, ${b.y.toFixed(1)}px)` +
          (b.facing === -1 ? ' scaleX(-1)' : '')
      } else {
        const base = clamp(
          (Math.atan2(b.vy, Math.max(Math.abs(b.vx), 0.25)) * 180) / Math.PI,
          -b.cfg.maxBank,
          b.cfg.maxBank
        )
        const bank = b.facing === -1 ? -base : base
        host.style.transform =
          `translate(${b.x.toFixed(1)}px, ${b.y.toFixed(1)}px) rotate(${bank.toFixed(1)}deg)` +
          (b.facing === -1 ? ' scaleX(-1)' : '')
      }
    }

    // ---- state transitions ----------------------------------------------
    const crossesH1 = (x1, y1, x2, y2, r) => {
      for (let s = 1; s < 20; s++) {
        const t = s / 20
        const x = x1 + (x2 - x1) * t
        const y = y1 + (y2 - y1) * t
        if (x > r.left && x < r.right && y > r.top && y < r.bottom) return true
      }
      return false
    }

    const pickPerch = (b, now) => {
      const g = measureGeometry()
      const free = perchPts.map((p, i) => ({ p, i })).filter(({ p }) => !p.occupiedBy)
      if (!free.length) {
        b.nextPerchAt = now + 3000
        return
      }
      // Approach shape: fly OVER the headline to a point 90px above the perch,
      // then descend. Only accept perches whose whole glide path avoids the h1.
      const usable = g.h1
        ? free.filter(({ p }) =>
            !crossesH1(
              b.x,
              b.y,
              clamp(p.x, 8, Math.max(8, g.w - 8)),
              clamp(p.y - 90, 8, Math.max(8, g.h - 8)),
              g.h1
            )
          )
        : free
      const pool = usable.length ? usable : free
      const chosen = pool[Math.floor(Math.random() * pool.length)]
      chosen.p.occupiedBy = b.id
      b.perchIdx = chosen.i
      // Aim the flight at where the PERCHED CENTER will sit, so the sprite
      // swap at landing involves zero positional jump.
      const perchTarget = { x: chosen.p.x, y: chosen.p.y - b.cfg.size * FOOT_FRAC }
      b.waypointQueue = [perchTarget]
      b.target = {
        x: clamp(chosen.p.x, 8, Math.max(8, g.w - 8)),
        y: clamp(chosen.p.y - 90, 8, Math.max(8, g.h - 8)),
      }
      b.state = 'flying' // 'arriving' begins when the overhead waypoint is reached
      b.arriveStart = 0
      b.hardApproach = false
      // Park the perch timer; takeOff schedules the next one.
      b.nextPerchAt = Infinity
      renderBird(b, birds.indexOf(b))
    }

    const land = (b, now) => {
      // No teleport: land only within one frame of motion (position already
      // essentially at the perch thanks to arrival steering).
      b.state = 'perched'
      b.vx = 0
      b.vy = 0
      b.restUntil = now + rand(b.cfg.rest[0], b.cfg.rest[1])
      renderBird(b, birds.indexOf(b))
    }

    const forceLand = (b) => {
      // Safety timeout: 4s in 'arriving'. Never snaps position: switches to a
      // deterministic direct approach (fixed velocity toward the perch) that
      // lands via the normal arrival check.
      b.hardApproach = true
    }

    const takeOff = (b, i, now) => {
      if (b.perchIdx >= 0 && perchPts[b.perchIdx]) {
        perchPts[b.perchIdx].occupiedBy = null
      }
      b.perchIdx = -1
      b.state = 'flying'
      const a = rand(0, Math.PI * 2)
      b.vx = Math.cos(a) * TAKEOFF_SPEED
      b.vy = Math.sin(a) * TAKEOFF_SPEED
      b.facing = b.vx >= 0 ? 1 : -1
      b.nextPerchAt = now + rand(b.cfg.perchEvery[0], b.cfg.perchEvery[1])
      if (b.cfg.dart) b.nextDartAt = now + rand(b.cfg.dart[0], b.cfg.dart[1])
      pickTarget(b, measureGeometry(), now)
      renderBird(b, i)
    }

    // steering integration for flying/arriving
    const steer = (b, now, dt, g) => {
      const t = b.target
      if (!t) {
        pickTarget(b, g, now)
        return
      }
      const dx = t.x - b.x
      const dy = t.y - b.y
      const dist = Math.hypot(dx, dy)

      // Hard approach (safety-timeout path): deterministic direct velocity,
      // no steering, no repulsion, no darts. Monotonic approach, no teleport.
      if (b.state === 'arriving' && b.hardApproach) {
        const inv0 = dist > 0.0001 ? 1 / dist : 0
        const spd = Math.min(2.5, Math.max(0.5, dist * 0.25))
        b.vx = dx * inv0 * spd
        b.vy = dy * inv0 * spd
        b.x += b.vx * dt
        b.y += b.vy * dt
        if (Math.abs(b.vx) > 0.12) b.facing = b.vx > 0 ? 1 : -1
        if (dist < ARRIVE_RADIUS) land(b, now)
        return
      }

      if (dist < TARGET_ARRIVE_RADIUS) {
        // reached the current target
        if (b.state === 'arriving') {
          if (dist < ARRIVE_RADIUS && Math.hypot(b.vx, b.vy) < ARRIVE_SPEED) {
            land(b, now)
            return
          }
        } else if (b.waypointQueue.length) {
          const next = b.waypointQueue.shift()
          b.target = next
          if (b.cfg.dart) b.hoverUntil = now + HOVER_MS // hummer hover between darts
          // The last queued waypoint before a perch target: the bird glide-in
          // begins here (over-the-top approach, then descend onto the perch).
          if (b.perchIdx >= 0 && b.waypointQueue.length === 0) {
            b.state = 'arriving'
            b.arriveStart = now
          }
        } else {
          pickTarget(b, g, now)
        }
      }

      let desiredSpeed = b.cfg.maxSpeed
      if (b.state === 'arriving') {
        desiredSpeed = Math.min(b.cfg.maxSpeed, dist * ARRIVE_TERM_FACTOR)
      }
      const inv = dist > 0.0001 ? 1 / dist : 0
      let desDirX = dx * inv
      let desDirY = dy * inv

      // Text collision = steering repulsion applied AS A DESIRED-DIRECTION
      // BEND, not as an additive force: steering instantly dampens additive
      // forces back toward the target, so the bird would tunnel straight
      // through the headline. Bending the desired direction wins that fight
      // by construction.
      const finalApproach = b.state === 'arriving' && dist <= 120
      if ((b.state === 'flying' || b.state === 'arriving') && !finalApproach && g.h1) {
        const pad = REPULSION_PAD
        // Membership: inside the EXPANDED box, i.e. within `pad` of the h1 on
        // every axis independently (raw coords, not distance-min).
        const inPadX = b.x > g.h1.left - pad && b.x < g.h1.right + pad
        const inPadY = b.y > g.h1.top - pad && b.y < g.h1.bottom + pad
        if (inPadX && inPadY) {
          const dL = b.x - g.h1.left
          const dR = g.h1.right - b.x
          const dT = b.y - g.h1.top
          const dB = g.h1.bottom - b.y
          // nearest-edge outward normal: e.g. bird above the box (dT < 0)
          // gets dn (0,-1); inside the box it exits through the nearest edge.
          const minD = Math.min(dL, dR, dT, dB)
          let ndx = 0
          let ndy = 0
          if (minD === dT) ndy = -1
          else if (minD === dB) ndy = 1
          else if (minD === dL) ndx = -1
          else ndx = 1
          const bx = (1 - REPULSION_BEND) * desDirX + REPULSION_BEND * ndx
          const by = (1 - REPULSION_BEND) * desDirY + REPULSION_BEND * ndy
          const bl = Math.max(0.0001, Math.hypot(bx, by))
          desDirX = bx / bl
          desDirY = by / bl
        }
      }

      const desX = desDirX * desiredSpeed
      const desY = desDirY * desiredSpeed
      b.vx += (desX - b.vx) * b.cfg.steerStrength * dt
      b.vy += (desY - b.vy) * b.cfg.steerStrength * dt

      // Arriving birds bleed speed so they can meet the land condition
      // (dist < 6 AND speed < 0.3) instead of overshooting the perch forever.
      if (b.state === 'arriving') {
        const damp = Math.pow(0.97, dt)
        b.vx *= damp
        b.vy *= damp
      }

      // Hummer: dart overrides velocity; hover dampens it. No darts while a
      // bird is committed to a perch.
      if (b.cfg.dart && b.perchIdx < 0) {
        if (now < b.hoverUntil) {
          const f = Math.pow(HOVER_DECAY, dt)
          b.vx *= f
          b.vy *= f
        }
        if (now >= b.nextDartAt) {
          const a = rand(0, Math.PI * 2)
          b.vx = Math.cos(a) * DART_SPEED
          b.vy = Math.sin(a) * DART_SPEED
          b.dartUntil = now + DART_DECAY_MS
          b.nextDartAt = now + rand(b.cfg.dart[0], b.cfg.dart[1])
        }
      }

      const limit = now < b.dartUntil ? DART_SPEED : b.cfg.maxSpeed
      ;[b.vx, b.vy] = clampMag(b.vx, b.vy, limit)
      b.x += b.vx * dt
      b.y += b.vy * dt

      // Hard clamp as a safety fallback (rarely fires: targets are inset)
      b.x = clamp(b.x, 0, Math.max(0, g.w - b.cfg.size))
      b.y = clamp(b.y, 0, Math.max(0, g.h - b.cfg.size))

      // Facing follows travel direction (small hysteresis avoids flicker)
      if (Math.abs(b.vx) > 0.12) b.facing = b.vx > 0 ? 1 : -1
    }

    const tick = (now) => {
      if (reduced || !inView) {
        rafId = null
        return
      }
      rafId = requestAnimationFrame(tick)

      const dt = clamp((now - lastTime) / (1000 / 60), 0.2, DT_MAX)
      lastTime = now

      const g = measureGeometry()
      if (g.w <= 0 || g.h <= 0) return

      birds.forEach((b, i) => {
        if (b.state === 'perched') {
          if (now >= b.restUntil) {
            takeOff(b, i, now)
            steer(b, now, dt, g)
          } else {
            renderBird(b, i)
            return
          }
        } else if (b.state === 'arriving') {
          // Safety timeout arms the deterministic hard approach, but steer is
          // ALWAYS called afterward — freezing here would never land the bird.
          if (now - b.arriveStart > ARRIVE_SAFETY_MS && !b.hardApproach) {
            forceLand(b)
          }
          steer(b, now, dt, g)
          if (b.state === 'arriving') {
            const d = Math.hypot(b.target.x - b.x, b.target.y - b.y)
            if (d < ARRIVE_RADIUS && Math.hypot(b.vx, b.vy) < ARRIVE_SPEED) land(b, now)
          }
        } else {
          steer(b, now, dt, g)
          if (now >= b.nextPerchAt) pickPerch(b, now)
        }
        renderBird(b, i)
      })
    }
    let lastTime = now0

    const startLoop = () => {
      if (rafId !== null || reduced || !inView) return
      lastTime = performance.now()
      rafId = requestAnimationFrame(tick)
    }
    const stopLoop = () => {
      if (rafId !== null) {
        cancelAnimationFrame(rafId)
        rafId = null
      }
    }

    // IntersectionObserver: pause the loop while the hero is out of viewport
    const io = new IntersectionObserver(
      ([entry]) => {
        inView = entry.isIntersecting
        if (inView && !reduced) startLoop()
        else stopLoop()
      },
      { threshold: 0 }
    )
    io.observe(heroEl)

    // prefers-reduced-motion: cancel the loop, static perched birds
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const onMotionChange = () => {
      reduced = mq.matches
      stopLoop()
      if (reduced) {
        // Static perched birds: settle each at a perch from its current position.
        birds.forEach((b, i) => {
          if (b.perchIdx >= 0 && perchPts[b.perchIdx]) perchPts[b.perchIdx].occupiedBy = null
          b.state = 'perched'
          b.perchIdx = Math.min(i, perchPts.length - 1)
          const p = perchPts[b.perchIdx]
          b.x = p.x
          b.y = p.y
          perchPts[b.perchIdx].occupiedBy = b.id
          renderBird(b, i)
        })
      }
    }
    mq.addEventListener?.('change', onMotionChange)

    // Perch points follow window resizes (no teleport: recompute + re-anchor)
    const onResize = () => {
      buildPerches()
      birds.forEach((b, i) => {
        if (b.state === 'perched' && b.perchIdx >= 0 && perchPts[b.perchIdx]) {
          b.x = perchPts[b.perchIdx].x
          b.y = perchPts[b.perchIdx].y
        }
        b.x = clamp(b.x, 0, Math.max(0, measureGeometry().w - b.cfg.size))
        renderBird(b, i)
      })
    }
    window.addEventListener('resize', onResize)

    // Sprite anchor offsets: both SVGs render centered on the host anchor so
    // the perched/flying swap is pixel-stable (no jump on landing).
    birds.forEach((b, i) => {
      const half = b.cfg.size / 2
      const fly = flyRefs.current[i]
      const perched = perchRefs.current[i]
      if (fly) {
        fly.style.marginLeft = `${-half}px`
        fly.style.marginTop = `${-half}px`
      }
      if (perched) {
        perched.style.marginLeft = `${-half}px`
        perched.style.marginTop = `${-half}px`
      }
    })

    // initial targets
    birds.forEach((b, i) => {
      b.nextPerchAt = now0 + rand(b.cfg.perchEvery[0], b.cfg.perchEvery[1])
      if (b.cfg.dart) b.nextDartAt = now0 + rand(b.cfg.dart[0], b.cfg.dart[1])
      b.target = null
      pickTarget(b, measureGeometry(), now0)
      if (reduced) {
        // static perched birds only
        b.state = 'perched'
        b.perchIdx = Math.min(i, perchPts.length - 1)
        const p = perchPts[b.perchIdx]
        b.x = p.x
        b.y = p.y
        perchPts[b.perchIdx].occupiedBy = b.id
      }
      renderBird(b, i)
    })

    if (!reduced && inView) startLoop()

    return () => {
      stopLoop()
      io.disconnect()
      mq.removeEventListener?.('change', onMotionChange)
      window.removeEventListener('resize', onResize)
    }
  }, [heroRef, h1Ref, count])

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-20 hidden select-none sm:block"
    >
      {FLOCK_ORDER.slice(0, count === 4 ? 4 : 2).map((key, i) => {
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

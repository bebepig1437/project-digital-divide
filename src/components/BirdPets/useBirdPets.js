/**
 * useBirdPets — waypoint-steering flock loop (single RAF, delta-time aware).
 *
 * No gravity, no impulses, no bounce: each bird has a DESTINATION and steers
 * toward it (Reynolds-style arrive/seek), picks a new waypoint when it arrives,
 * and occasionally perches on the landmark or container corners with real
 * arrival behavior (no teleporting).
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
 * idle flourishes, rests) -> flying. SVG swap is DOM-level (hidden toggles);
 * React never re-renders per frame.
 *
 * Stuck-proofing (the "bird freezes after a while" class of bugs):
 *  1. pickPerch NEVER commits to a perch whose glide path crosses the landmark
 *     pad — an unreachable perch parked the bird with nextPerchAt = Infinity
 *     forever. No usable perch now means: retry in 3-5s and keep flying.
 *  2. Flying-state arrival requires the bird to be MOVING TOWARD the target
 *     (dot(velocity, toTarget) >= 0), so a fast flyby can't spiral past forever.
 *  3. A perch commitment that still hasn't landed after PERCH_COMMIT_TIMEOUT
 *     is aborted (perch released, new cruise target, timer rescheduled).
 *  4. Liveness guard: a flying bird that travels < 2px over 3s gets a fresh
 *     random target (warns to console — if this ever fires in the wild, there
 *     is a real steering bug to find).
 *  5. target is never null while flying: an empty waypoint queue immediately
 *     re-picks inside the same frame.
 *
 * Gates: prefers-reduced-motion -> static perched birds, no RAF;
 * IntersectionObserver pause offscreen; pointer-events none (CSS); hidden
 * below sm (CSS); personalities + hue filters kept.
 */

import { useEffect } from 'react'
import {
  ARRIVE_RADIUS,
  ARRIVE_SAFETY_MS,
  ARRIVE_SPEED,
  ARRIVE_TERM_FACTOR,
  BANK_SMOOTH,
  BOOST_MS,
  BOUNCE_ANIM_MS,
  BOUNCE_COOLDOWN_MS,
  BOUNCE_FLAP_FACTOR,
  BOUNCE_RESTITUTION,
  DART_DECAY_MS,
  DART_SPEED,
  DT_MAX,
  FLARE_DIST,
  FLARE_FAST_FACTOR,
  FLOCK_ORDER,
  FOOT_FRAC,
  GLIDE_OVERHEAD,
  H1_REJECT_DIST,
  HOVER_DECAY,
  HOVER_MS,
  IDLE_ANIM_MS,
  IDLE_GAP_MAX,
  IDLE_GAP_MIN,
  INSET,
  LAND_FLARE_MS,
  PERCH_COMMIT_FRAMES,
  PERCH_RETRY_MS,
  PERSONALITIES,
  REPULSION_PAD,
  STUCK_FRAMES,
  SAMPLE_TRIES,
  SELF_REJECT_DIST,
  START_SLOTS,
  SUBROUTE_CHANCE,
  SUBROUTE_OFFSET,
  SUBROUTE_WAYPOINTS,
  TARGET_ARRIVE_RADIUS,
  TAKEOFF_START_SPEED,
  clamp,
  clampMag,
  isReducedMotion,
  rand,
} from './birdPersonalities'

export function useBirdPets({
  containerRef,
  landmarkRef,
  count = 4,
  hostRefs,
  flyRefs,
  perchRefs,
}) {
  useEffect(() => {
    const heroEl = containerRef?.current
    if (!heroEl) return undefined

    let rafId = null
    let inView = true
    let reduced = isReducedMotion()

    // ---- geometry --------------------------------------------------------
    const measureGeometry = () => {
      const heroRect = heroEl.getBoundingClientRect()
      const markEl = landmarkRef?.current || heroEl.querySelector('h1')
      const markRect = markEl ? markEl.getBoundingClientRect() : null
      return {
        w: heroRect.width,
        h: heroRect.height,
        h1: markRect
          ? {
              left: markRect.left - heroRect.left,
              right: markRect.right - heroRect.left,
              top: markRect.top - heroRect.top,
              bottom: markRect.bottom - heroRect.top,
            }
          : null,
      }
    }

    const geom0 = measureGeometry()
    if (geom0.w <= 0 || geom0.h <= 0) return undefined
    const W0 = Math.max(geom0.w, 320)
    const H0 = Math.max(geom0.h, 240)
    const now0 = performance.now()

    // ---- birds -----------------------------------------------------------
    const flockSize = Math.max(1, Math.min(8, count))

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
        committedAt: 0,
        restUntil: 0,
        nextPerchAt: 0,
        nextDartAt: 0,
        dartUntil: 0,
        hoverUntil: 0,
        arriveStart: 0,
        hardApproach: false,
        boostUntil: 0,
        flareUntil: 0,
        idleUntil: 0,
        idleKind: -1,
        nextIdleAt: 0,
        fastFlap: false,
        bank: null,
        bounceCoolUntil: 0,
        bounceAnimUntil: 0,
        noProgressFrames: 0,
        commitFrames: 0,
      }
    })

    // ---- target sampling --------------------------------------------------
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
        {
          xMin: (2 * g.w) / 3,
          xMax: Math.max((2 * g.w) / 3 + 1, g.w - INSET),
          w: 3,
        },
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
        y: clamp(
          rand(INSET, Math.max(INSET + 1, g.h - INSET)),
          INSET,
          Math.max(INSET, g.h - INSET)
        ),
      }
    }

    const pickTarget = (b, g, now) => {
      let best = null
      let bestScore = -1
      for (let i = 0; i < SAMPLE_TRIES; i++) {
        const p = samplePoint(b, g)
        let ok = true
        if (g.h1 && distToRect(p.x, p.y, g.h1) < H1_REJECT_DIST) ok = false
        if (ok && Math.hypot(p.x - b.x, p.y - b.y) < SELF_REJECT_DIST) ok = false
        // A candidate whose straight path crosses the keep-out pad strands the
        // bird in the pad-boundary equilibrium cycle (diagnosed bug 1), so
        // only pick candidates reachable without entering the keep-out box.
        if (ok && g.h1 && crossesH1(b.x, b.y, p.x, p.y, {
          left: g.h1.left - REPULSION_PAD,
          right: g.h1.right + REPULSION_PAD,
          top: g.h1.top - REPULSION_PAD,
          bottom: g.h1.bottom + REPULSION_PAD,
        })) ok = false
        if (ok) {
          best = p
          break
        }
        // Best-effort candidate: farthest from BOTH the landmark and the bird,
        // so a degenerate fallback can't park the bird on itself.
        const score =
          (g.h1 ? distToRect(p.x, p.y, g.h1) : Infinity) +
          Math.hypot(p.x - b.x, p.y - b.y)
        if (score > bestScore) {
          bestScore = score
          best = p
        }
      }
      if (!best) best = samplePoint(b, g)
      // Guard the fallback: the best-effort candidate can live inside the
      // landmark pad, where the repulsion bend reaches equilibrium and parks
      // the bird in a hover until the liveness guard rescues it. Force a
      // guaranteed-far target below (or above) the landmark band instead.
      if (g.h1 && distToRect(best.x, best.y, g.h1) < H1_REJECT_DIST) {
        const belowY = g.h1.bottom + H1_REJECT_DIST + 10
        const aboveY = g.h1.top - H1_REJECT_DIST - 10
        best = {
          x: best.x,
          y: clamp(
            belowY <= g.h - INSET ? belowY : aboveY,
            INSET,
            Math.max(INSET + 1, g.h - INSET)
          ),
        }
      }

      // 30% of selections: subroute to a far point on the opposite side,
      // with 1-2 intermediate waypoints offset perpendicular from the line.
      if (Math.random() < SUBROUTE_CHANCE) {
        const farX =
          b.x < g.w / 2
            ? rand(Math.max(g.w * 0.55, INSET), Math.max(INSET + 1, g.w - INSET))
            : rand(INSET, Math.max(INSET + 1, g.w * 0.45))
        const far = {
          x: farX,
          y: clamp(
            rand(INSET, g.h - INSET),
            INSET,
            Math.max(INSET, g.h - INSET)
          ),
        }
        // Same pad-safety rule as the fallback: a far target inside the pad
        // equilibrium-parks the bird.
        if (g.h1 && distToRect(far.x, far.y, g.h1) < H1_REJECT_DIST) {
          const belowY = g.h1.bottom + H1_REJECT_DIST + 10
          far.y = clamp(
            belowY <= g.h - INSET ? belowY : g.h1.top - H1_REJECT_DIST - 10,
            INSET,
            Math.max(INSET + 1, g.h - INSET)
          )
        }
        const dx = far.x - b.x
        const dy = far.y - b.y
        const len = Math.max(1, Math.hypot(dx, dy))
        const nWps = Math.round(rand(SUBROUTE_WAYPOINTS[0], SUBROUTE_WAYPOINTS[1]))
        const q = []
        for (let k = 1; k <= nWps; k++) {
          const t = rand(0.3, 0.7)
          const off = rand(-SUBROUTE_OFFSET, SUBROUTE_OFFSET)
          q.push({
            x: clamp(
              b.x + dx * t + (-dy / len) * off,
              INSET,
              Math.max(INSET + 1, g.w - INSET)
            ),
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

    // ---- perch points (10) -------------------------------------------------
    // Landmark top-left (-8,-8), landmark top-right (+8,-8), container TL
    // (+16,+16), container TR (-16,+16), plus 6 points evenly along the
    // landmark top edge (1/7 width spacing, offset -8 above). occupancy
    // tracks which bird holds each point.
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
        // g.h1 only carries left/right/top/bottom (no width): using .width
        // produced NaN perch scatter points that poisoned commits + birds.
        const span = (g.h1.right - g.h1.left) / 7
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

    // ---- rendering ---------------------------------------------------------
    const renderBird = (b, i, now) => {
      const host = hostRefs.current[i]
      const fly = flyRefs.current[i]
      const perched = perchRefs.current[i]
      if (!host) return
      host.dataset.state = b.state

      const flying = b.state === 'flying' || b.state === 'arriving'
      // Glider spreads its wings during the perch descent instead of flapping.
      const gliding = b.key === 'glider' && b.state === 'arriving'
      // Bounce squash: the host wrapper carries the class; the keyframes run
      // on the sprite so the per-frame translate/rotate/bank transform on the
      // host stays intact (a CSS animation on the same element would
      // overwrite it).
      const bouncing = b.state === 'flying' && now < b.bounceAnimUntil
      host.classList.toggle('is-bouncing', bouncing)
      if (fly) {
        fly.classList.toggle('is-flapping', flying && !reduced && !gliding)
        fly.classList.toggle('hidden', b.state === 'perched')
        fly.classList.toggle('pdd-glide-pose', gliding)
        // Flap cadence: speed-up near a perch (approach flare) and during the
        // bounce-recovery window.
        const wantDur = bouncing
          ? `${Math.round(parseInt(b.cfg.wingDur, 10) * BOUNCE_FLAP_FACTOR)}ms`
          : b.fastFlap
            ? `${Math.round(parseInt(b.cfg.wingDur, 10) * FLARE_FAST_FACTOR)}ms`
            : b.cfg.wingDur
        if (fly.style.getPropertyValue('--pdd-flap-dur') !== wantDur) {
          fly.style.setProperty('--pdd-flap-dur', wantDur)
        }
      }
      if (perched) {
        perched.classList.toggle('hidden', b.state !== 'perched')
        const landed = b.state === 'perched'
        const idleActive = landed && now < b.idleUntil
        perched.classList.toggle('pdd-land-flare', landed && now < b.flareUntil)
        perched.classList.toggle('pdd-idle-tilt', idleActive && b.idleKind === 0)
        perched.classList.toggle('pdd-idle-flick', idleActive && b.idleKind === 1)
        perched.classList.toggle(
          'pdd-idle-ruffle',
          idleActive && b.idleKind === 2
        )
        if (!landed) {
          perched.classList.remove(
            'pdd-land-flare',
            'pdd-idle-tilt',
            'pdd-idle-flick',
            'pdd-idle-ruffle'
          )
        }
      }

      if (b.state === 'perched') {
        // Anchor convention is unified with flight: the host sits at (x, y),
        // sprite offsets come from CSS margins set at mount — no position jump
        // on landing.
        host.style.transform =
          `translate(${b.x.toFixed(1)}px, ${b.y.toFixed(1)}px)` +
          (b.facing === -1 ? ' scaleX(-1)' : '')
      } else {
        // Rotation smoothing: the raw per-frame atan2 angle is clamped to the
        // personality limit but can still swing the full ±40..50° within one
        // frame near vertical flight (the visible wing-flap-like bank flip),
        // so the rendered bank eases toward the target bank instead.
        const baseRaw = (Math.atan2(b.vy, Math.max(Math.abs(b.vx), 0.25)) * 180) / Math.PI
        const target = clamp(baseRaw, -b.cfg.maxBank, b.cfg.maxBank)
        if (b.bank === null) b.bank = target
        else b.bank += (target - b.bank) * BANK_SMOOTH
        const base = b.bank
        const bank = b.facing === -1 ? -base : base
        host.style.transform =
          `translate(${b.x.toFixed(1)}px, ${b.y.toFixed(1)}px) rotate(${bank.toFixed(1)}deg)` +
          (b.facing === -1 ? ' scaleX(-1)' : '')
      }
    }

    const setFlapDur = (i) => {
      const fly = flyRefs.current[i]
      if (fly && !fly.style.getPropertyValue('--pdd-flap-dur')) {
        fly.style.setProperty('--pdd-flap-dur', birds[i].cfg.wingDur)
      }
    }

    // ---- state transitions -------------------------------------------------
    const crossesH1 = (x1, y1, x2, y2, r) => {
      for (let s = 1; s < 20; s++) {
        const t = s / 20
        const x = x1 + (x2 - x1) * t
        const y = y1 + (y2 - y1) * t
        if (x > r.left && x < r.right && y > r.top && y < r.bottom) return true
      }
      return false
    }

    const releasePerch = (b) => {
      if (b.perchIdx >= 0 && perchPts[b.perchIdx]) {
        if (perchPts[b.perchIdx].occupiedBy === b.id) {
          perchPts[b.perchIdx].occupiedBy = null
        }
      }
      b.perchIdx = -1
      b.committedAt = 0
    }

    // Glide route to a perch. Preferred: a direct chord from here to the
    // overhead waypoint when it clears the expanded landmark. Otherwise route
    // around by construction:
    //   [exit laterally at the bird's altitude] -> [rise along the margin,
    //   outside the landmark x-range] -> [glide at the apron (landmark.top -
    //   PAD - 20), above the repulsion box] -> [descend onto the perch].
    // Every segment occurs outside the expanded landmark rect, so the bird
    // never visibly crosses the headline — and EVERY perch is reachable, so
    // perching can't starve like it did with reject-only selection.
    const perchRoute = (b, p, g) => {
      const ox = clamp(p.x, 8, Math.max(8, g.w - 8))
      const oy = clamp(p.y - GLIDE_OVERHEAD, 8, Math.max(8, g.h - 8))
      const exPad = 20
      if (!g.h1 || !crossesH1(b.x, b.y, ox, oy, {
        left: g.h1.left - exPad,
        right: g.h1.right + exPad,
        top: g.h1.top - exPad,
        bottom: g.h1.bottom + exPad,
      })) return [{ x: ox, y: oy }]

      const leftExit = Math.abs(b.x - g.h1.left) <= Math.abs(g.h1.right - b.x)
      const exitX = clamp(leftExit ? g.h1.left - REPULSION_PAD - 30 : g.h1.right + REPULSION_PAD + 30, 8, Math.max(8, g.w - 8))
      const apronY = clamp(g.h1.top - REPULSION_PAD - 20, 8, Math.max(8, g.h - 8))
      const bandBottom = g.h1.bottom + REPULSION_PAD + 30
      const q = []
      if (b.y < bandBottom) {
        // Bird is beside/above the landmark band: reach the exit point at its
        // current altitude first (horizontal segment outside the x-range).
        q.push({ x: exitX, y: clamp(b.y, 8, Math.max(8, g.h - 8)) })
      } else {
        // Bird is below the band: drop slightly first so the lateral move
        // happens below the pad, then rise along the margin.
        q.push({ x: exitX, y: clamp(bandBottom + 10, 8, Math.max(8, g.h - 8)) })
      }
      q.push({ x: exitX, y: apronY })
      q.push({ x: ox, y: oy })
      return q
    }

    const pickPerch = (b, now, g) => {
      const free = perchPts
        .map((p, i) => ({ p, i }))
        .filter(({ p }) => !p.occupiedBy)
      if (!free.length) {
        b.nextPerchAt = now + rand(PERCH_RETRY_MS[0], PERCH_RETRY_MS[1])
        return
      }
      const chosen = free[Math.floor(Math.random() * free.length)]
      // Parked: other birds can't aim at it while we glide in.
      chosen.p.occupiedBy = b.id
      b.perchIdx = chosen.i
      b.committedAt = now
      // Aim the flight at where the PERCHED CENTER will sit, so the sprite
      // swap at landing involves zero positional jump.
      const perchTarget = { x: chosen.p.x, y: chosen.p.y - b.cfg.size * FOOT_FRAC }
      const route = perchRoute(b, chosen.p, g)
      if (route.length === 1) {
        b.waypointQueue = [perchTarget]
        b.target = route[0]
      } else {
        b.waypointQueue = [...route.slice(1), perchTarget]
        b.target = route[0]
      }
      b.state = 'flying' // 'arriving' begins when the final glide waypoint is reached
      b.arriveStart = 0
      b.hardApproach = false
      // Park the perch timer; landing schedules the next one via takeOff.
      b.nextPerchAt = Infinity
      renderBird(b, birds.indexOf(b), now)
    }

    const land = (b, now) => {
      // No teleport: land only within one frame of motion (position already
      // essentially at the perch thanks to arrival steering).
      b.state = 'perched'
      b.vx = 0
      b.vy = 0
      b.fastFlap = false
      b.restUntil = now + rand(b.cfg.rest[0], b.cfg.rest[1])
      b.flareUntil = now + LAND_FLARE_MS
      b.nextIdleAt = now + rand(IDLE_GAP_MIN, IDLE_GAP_MAX)
      b.idleUntil = 0
      renderBird(b, birds.indexOf(b), now)
    }

    const forceLand = (b) => {
      // Safety timeout: 4s in 'arriving'. Never snaps position: switches to a
      // deterministic direct approach (fixed velocity toward the perch) that
      // lands via the normal arrival check.
      b.hardApproach = true
    }

    // Straight-line reachability: the target is reachable only if the direct
    // path clears the expanded keep-out pad (otherwise steering into the pad
    // creates the pad-boundary equilibrium cycle from bug 1).
    const losClearToTarget = (b, g) => {
      const t = b.target
      if (!t || !g.h1) return true
      return !crossesH1(b.x, b.y, t.x, t.y, {
        left: g.h1.left - REPULSION_PAD,
        right: g.h1.right + REPULSION_PAD,
        top: g.h1.top - REPULSION_PAD,
        bottom: g.h1.bottom + REPULSION_PAD,
      })
    }

    const takeOff = (b, i, now) => {
      releasePerch(b)
      b.state = 'flying'
      const a = rand(0, Math.PI * 2)
      // Takeoff push: slow first frame, extra steering for BOOST_MS — a
      // visible launch arc instead of an instant jump to cruising speed.
      b.vx = Math.cos(a) * TAKEOFF_START_SPEED
      b.vy = Math.sin(a) * TAKEOFF_START_SPEED
      b.facing = Math.cos(a) >= 0 ? 1 : -1
      b.boostUntil = now + BOOST_MS
      b.nextPerchAt = now + rand(b.cfg.perchEvery[0], b.cfg.perchEvery[1])
      if (b.cfg.dart) b.nextDartAt = now + rand(b.cfg.dart[0], b.cfg.dart[1])
      pickTarget(b, measureGeometry(), now)
      renderBird(b, i, now)
    }

    // ---- steering integration for flying/arriving ---------------------------
    const steer = (b, now, dt, g, i) => {
      b.steerCount = (b.steerCount || 0) + 1
      const t = b.target
      if (!t) {
        // Never let a flying bird have nowhere to go.
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
        if (dist < ARRIVE_RADIUS) {
          land(b, now)
        } else {
          b.fastFlap = dist < FLARE_DIST
          renderBird(b, i, now)
        }
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
          // Accept a waypoint only while MOVING TOWARD it — a fast flyby that
          // just receded past the target shouldn't immediately re-pick from
          // behind itself (overshoot oscillation guard).
          const dot = b.vx * dx + b.vy * dy
          if (dot >= 0 || dist < 8) pickTarget(b, g, now)
        }
      }

      let desiredSpeed = b.cfg.maxSpeed
      if (b.state === 'arriving') {
        desiredSpeed = Math.min(b.cfg.maxSpeed, dist * ARRIVE_TERM_FACTOR)
      }
      const inv = dist > 0.0001 ? 1 / dist : 0
      let desDirX = dx * inv
      let desDirY = dy * inv

      const desX = desDirX * desiredSpeed
      const desY = desDirY * desiredSpeed
      // Takeoff boost: double steering strength for the launch arc.
      const steerMul = now < b.boostUntil ? 2 : 1
      b.vx += (desX - b.vx) * b.cfg.steerStrength * steerMul * dt
      b.vy += (desY - b.vy) * b.cfg.steerStrength * steerMul * dt

      // Arriving birds bleed speed so they can meet the land condition
      // (dist < 6 AND speed < 0.3) instead of overshooting the perch forever.
      if (b.state === 'arriving') {
        const damp = Math.pow(0.97, dt)
        b.vx *= damp
        b.vy *= damp
        b.fastFlap = dist < FLARE_DIST
      } else {
        b.fastFlap = false
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

      // Bounce physics (flying only; a landing bird is exempt): reflect off
      // the hero edges and the keep-out pad at BOUNCE_RESTITUTION energy. A
      // 300ms cooldown per bounce prevents multi-frame jitter; after the
      // bounce the target is kept if it's still reachable, otherwise
      // re-picked. Only the velocity component travelling INTO the surface
      // is inverted, so grazing contact keeps its tangential motion.
      if (b.state === 'flying' && now >= b.bounceCoolUntil) {
        const half = b.cfg.size / 2
        let hitX = false
        let hitY = false
        // Hero edges (correction: park the sprite half-body on the surface).
        if (b.x < half && b.vx < 0) {
          hitX = true
          b.x = half
        } else if (b.x > g.w - half && b.vx > 0) {
          hitX = true
          b.x = g.w - half
        }
        if (b.y < half && b.vy < 0) {
          hitY = true
          b.y = half
        } else if (b.y > g.h - half && b.vy > 0) {
          hitY = true
          b.y = g.h - half
        }
        // Keep-out pad around the landmark: nearest-face collision.
        if (!hitX && !hitY && g.h1) {
          const pl = g.h1.left - REPULSION_PAD
          const pr = g.h1.right + REPULSION_PAD
          const pt = g.h1.top - REPULSION_PAD
          const pb = g.h1.bottom + REPULSION_PAD
          if (b.x > pl && b.x < pr && b.y > pt && b.y < pb) {
            const dL = b.x - pl
            const dR = pr - b.x
            const dT = b.y - pt
            const dB = pb - b.y
            const minD = Math.min(dL, dR, dT, dB)
            if (minD === dL && b.vx < 0) {
              hitX = true
              b.x = pl
            } else if (minD === dR && b.vx > 0) {
              hitX = true
              b.x = pr
            } else if (minD === dT && b.vy < 0) {
              hitY = true
              b.y = pt
            } else if (minD === dB && b.vy > 0) {
              hitY = true
              b.y = pb
            }
          }
        }
        if (hitX) b.vx = -b.vx * BOUNCE_RESTITUTION
        if (hitY) b.vy = -b.vy * BOUNCE_RESTITUTION
        if (hitX || hitY) {
          b.bounceCoolUntil = now + BOUNCE_COOLDOWN_MS
          b.bounceAnimUntil = now + BOUNCE_ANIM_MS
          if (!losClearToTarget(b, g)) pickTarget(b, g, now)
        }
      }
      // Hard clamp as a safety fallback (rarely fires: targets are inset)
      b.x = clamp(b.x, 0, Math.max(0, g.w - b.cfg.size))
      b.y = clamp(b.y, 0, Math.max(0, g.h - b.cfg.size))

      // Facing follows travel direction (small hysteresis avoids flicker)
      if (Math.abs(b.vx) > 0.12) b.facing = b.vx > 0 ? 1 : -1
    }

    // Perched idle flourishes: a tiny one-shot CSS animation every 3-6s so a
    // perched bird never reads as "dead bird" — picked randomly per trigger.
    const maybeIdle = (b, now) => {
      if (now >= b.nextIdleAt) {
        b.idleKind = Math.floor(Math.random() * 3) // 0 tilt, 1 flick, 2 ruffle
        b.idleUntil = now + IDLE_ANIM_MS
        b.nextIdleAt = now + rand(IDLE_GAP_MIN, IDLE_GAP_MAX)
      }
    }

    // Stuck-commitment watchdog + genuine stuck detection (both SIM-TIME
    // based: suspended rAF freezes the sim but not performance.now(), so
    // wall-clock windows false-trigger and release healthy perch commits).
    const liveness = (b, now, g) => {
      // 1) A perch commitment that never lands gets aborted (the perch is
      //    released; the perch timer is rescheduled; bird keeps cruising).
      if (b.perchIdx >= 0 && b.committedAt > 0) {
        b.commitFrames = (b.commitFrames || 0) + 1
        if (b.commitFrames > PERCH_COMMIT_FRAMES) {
          releasePerch(b)
          b.hardApproach = false
          b.nextPerchAt = now + rand(PERCH_RETRY_MS[0], PERCH_RETRY_MS[1])
          pickTarget(b, g, now)
        }
      } else {
        b.commitFrames = 0
      }
      // 2) Genuinely stuck: the velocity points AWAY from the target for a
      //    full sim-second. This is the diagnosed keep-out equilibrium cycle
      //    (v oscillating while parked at the pad edge, dot < 0 the whole
      //    time). Only this failure re-picks — normal flight that merely
      //    curves keeps its target.
      if (b.state === 'flying') {
        const t = b.target
        const dot = t ? b.vx * (t.x - b.x) + b.vy * (t.y - b.y) : 1
        if (dot < 0) {
          b.noProgressFrames = (b.noProgressFrames || 0) + 1
          if (b.noProgressFrames >= STUCK_FRAMES) {
            b.noProgressFrames = 0
            b.hardApproach = false
            pickTarget(b, g, now)
          }
        } else {
          b.noProgressFrames = 0
        }
      } else {
        b.noProgressFrames = 0
      }
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
            steer(b, now, dt, g, i)
          } else {
            maybeIdle(b, now)
            renderBird(b, i, now)
            return
          }
        } else if (b.state === 'arriving') {
          // Safety timeout arms the deterministic hard approach, but steer is
          // ALWAYS called afterward — freezing here would never land the bird.
          if (now - b.arriveStart > ARRIVE_SAFETY_MS && !b.hardApproach) {
            forceLand(b)
          }
          steer(b, now, dt, g, i)
          if (b.state === 'arriving') {
            const d = Math.hypot(b.target.x - b.x, b.target.y - b.y)
            if (d < ARRIVE_RADIUS && Math.hypot(b.vx, b.vy) < ARRIVE_SPEED) {
              land(b, now)
            }
          }
        } else {
          liveness(b, now, g)
          steer(b, now, dt, g, i)
          if (b.state === 'flying' && now >= b.nextPerchAt) pickPerch(b, now, g)
        }
        renderBird(b, i, now)
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

    // IntersectionObserver: pause the loop while the container is offscreen
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
        // Static perched birds: settle each at a perch from its current
        // position.
        birds.forEach((b, i) => {
          releasePerch(b)
          b.state = 'perched'
          b.perchIdx = Math.min(i, perchPts.length - 1)
          const p = perchPts[b.perchIdx]
          b.x = p.x
          b.y = p.y
          perchPts[b.perchIdx].occupiedBy = b.id
          renderBird(b, i, performance.now())
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
        renderBird(b, i, performance.now())
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
      setFlapDur(i)
      renderBird(b, i, now0)
    })

    if (!reduced && inView) startLoop()

    return () => {
      stopLoop()
      io.disconnect()
      mq.removeEventListener?.('change', onMotionChange)
      window.removeEventListener('resize', onResize)
    }
  }, [containerRef, landmarkRef, count, hostRefs, flyRefs, perchRefs])
}

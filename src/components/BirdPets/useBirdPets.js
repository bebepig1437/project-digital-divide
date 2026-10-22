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

import { useEffect, useRef } from 'react'
import useLayoutMetrics from './useLayoutMetrics'
import {
  ARRIVE_RADIUS,
  ARRIVE_SAFETY_MS,
  ARRIVE_SPEED,
  ARRIVE_TERM_FACTOR,
  BANK_SMOOTH,
  BOOST_MS,
  BIRD_HALF_H_FRAC,
  BIRD_HALF_W_FRAC,
  BOUNCE_COOLDOWN_MS,
  BOUNCE_RESTITUTION,
  DART_DECAY_MS,
  DART_SPEED,
  DT_CAP_MS,
  FEATHER_CAP,
  FEATHER_CONE_DEG,
  FEATHER_LIFE_MS,
  FEATHER_MAX,
  FEATHER_MIN,
  FEATHER_SPEED,
  FLARE_DIST,
  FLARE_FAST_FACTOR,
  FLOCK_ORDER,
  FOOT_FRAC,
  GLIDE_OVERHEAD,
  H1_REJECT_DIST,
  HOVER_DECAY,
  LOGO_PERCH_FRACS,
  HOVER_MS,
  IDLE_ANIM_MS,
  IDLE_GAP_MAX,
  IDLE_GAP_MIN,
  INSET,
  LAND_FLARE_MS,
  RECOIL_CLEAR_AWAY_SPEED,
  RECOIL_CLEAR_MAX_MS,
  RECOIL_END_MS,
  RECOIL_HOLD_END_MS,
  RECOIL_IMPACT_MS,
  PERCH_COMMIT_FRAMES,
  PERCH_RETRY_MS,
  PATROL_CLEAR_PAD,
  PATROL_DUR_MS,
  PATROL_DRIFT,
  PATROL_EVERY_N_PICKS,
  PATROL_ORBIT_REVS,
  PATROL_R,
  PATROL_SHAPES,
  PATROL_SWEEP_EDGE_PAUSE_MS,
  PATROL_SWEEP_LEG_MS,
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
  featherLayerRef,
}) {
  const onUpdateRef = useRef(null)
  // Cached layout metrics (per-line headline rects, logo rect, hero size,
  // breakpoint perch points) — refreshed live by useLayoutMetrics; the RAF
  // loop reads this ref every frame and never measures the DOM itself.
  const metrics = useLayoutMetrics({ containerRef, landmarkRef, onUpdateRef })
  useEffect(() => {
    const heroEl = containerRef?.current
    if (!heroEl) return undefined

    let rafId = null
    let inView = true
    let reduced = isReducedMotion()

    // ---- geometry (from useLayoutMetrics) ----------------------------------
    // All rects come cached from the metrics ref — re-measured by the
    // lifecycle in useLayoutMetrics (mount, fonts.ready, img decode,
    // debounced resize, ResizeObserver, breakpoint change), never per-frame.
    // Coordinates are hero-relative; the landmark is measured PER TEXT LINE
    // so birds can fly between two headline lines. The RAF loop never
    // measures the DOM itself.
    const geom = () => {
      const m = metrics.current
      if (!m) return null
      const h1 = m.headlineRects
        ? {
            left: Math.min(...m.headlineRects.map((r) => r.left)),
            right: Math.max(...m.headlineRects.map((r) => r.right)),
            top: Math.min(...m.headlineRects.map((r) => r.top)),
            bottom: Math.max(...m.headlineRects.map((r) => r.bottom)),
            lines: m.headlineRects,
          }
        : null
      // perchSrc: breakpoint perch points from the first rendered line (no
      // points until the headline has measurable lines — birds keep flying
      // and perching retries instead).
      return {
        w: m.heroW,
        h: m.heroH,
        h1,
        logo: m.logoRect,
        buttons: Array.isArray(m.buttonRects) ? m.buttonRects : [],
        perchSrc: m.perchPoints,
      }
    }

    const geom0 = geom()
    if (!geom0 || geom0.w <= 0 || geom0.h <= 0) return undefined
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
        recoil: null, // sticky three-phase bounce state (see steer)
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

    // Proximity to the landmark = MIN distance over its per-line rects (not
    // the aggregate band): a bird flying in the gap between two headline
    // lines isn't near text.
    const distToLandmark = (px, py, g) => {
      if (!g.h1) return Infinity
      let min = Infinity
      for (const line of g.h1.lines) {
        const d = distToRect(px, py, line)
        if (d < min) min = d
      }
      return min
    }

    // Straight-path blocking against PER-LINE rects expanded by pad: a path
    // may thread the gap between two lines, but a path through any line of
    // text is blocked.
    const crossesH1Lines = (x1, y1, x2, y2, g, pad) => {
      if (!g.h1) return false
      for (const line of g.h1.lines) {
        if (crossesH1(
          x1, y1, x2, y2,
          {
            left: line.left - pad,
            right: line.right + pad,
            top: line.top - pad,
            bottom: line.bottom + pad,
          },
        )) return true
      }
      return false
    }

    // ---- swept solid-obstacle collision (slab method) -----------------------
    // The bird CENTER travels the segment (x0,y0)->(x1,y1) in one frame. The
    // obstacle rect is EXPANDED by caller-supplied ANISOTROPIC sprite
    // half-extents, so sweeping the padded center path equals sweeping the
    // sprite. Collision ⇔ the segment's time interval overlaps the box:
    // tEnter <= tExit, tExit >= 0, tEnter <= 1. The check covers the WHOLE
    // segment — a bird cannot tunnel at any frame delta, at any speed, ever.
    // The response returns the entry point (on the face) plus the outward
    // normal of the entered face, so the caller can park the bird
    // definitively outside (entry + outward x 1). No point-in-rect fallback
    // exists anywhere else in the loop.
    const sweepSegmentVsRect = (x0, y0, x1, y1, rect, padX, padY) => {
      const L = rect.left - padX
      const R = rect.right + padX
      const T = rect.top - padY
      const B = rect.bottom + padY
      const dx = x1 - x0
      const dy = y1 - y0
      let tEnterX = -Infinity
      let tExitX = Infinity
      let tEnterY = -Infinity
      let tExitY = Infinity
      if (dx === 0) {
        if (x0 < L || x0 > R) return null
      } else {
        const inv = 1 / dx
        const t1 = (L - x0) * inv
        const t2 = (R - x0) * inv
        tEnterX = Math.min(t1, t2)
        tExitX = Math.max(t1, t2)
      }
      if (dy === 0) {
        if (y0 < T || y0 > B) return null
      } else {
        const inv = 1 / dy
        const t1 = (T - y0) * inv
        const t2 = (B - y0) * inv
        tEnterY = Math.min(t1, t2)
        tExitY = Math.max(t1, t2)
      }
      // Segment STARTED inside the box: an invariant breach (unreachable
      // once the sweep is authoritative). Nearest-face determination; the
      // returned entry point sits ON the face and the caller parks the bird
      // 1px beyond it — still no launch through the far side.
      if (x0 >= L && x0 <= R && y0 >= T && y0 <= B) {
        const dL = x0 - L
        const dR = R - x0
        const dT = y0 - T
        const dB = B - y0
        const minD = Math.min(dL, dR, dT, dB)
        if (minD === dL) return { ex: L, ey: y0, nxOut: -1, nyOut: 0, startInside: true }
        if (minD === dR) return { ex: R, ey: y0, nxOut: 1, nyOut: 0, startInside: true }
        if (minD === dT) return { ex: x0, ey: T, nxOut: 0, nyOut: -1, startInside: true }
        return { ex: x0, ey: B, nxOut: 0, nyOut: 1, startInside: true }
      }
      const tEnter = Math.max(tEnterX, tEnterY)
      const tExit = Math.min(tExitX, tExitY)
      if (tEnter > tExit || tEnter > 1 || tExit < 0) return null
      const onX = tEnterX > tEnterY
      return {
        ex: x0 + dx * tEnter,
        ey: y0 + dy * tEnter,
        nxOut: onX ? (dx > 0 ? -1 : 1) : 0,
        nyOut: onX ? 0 : (dy > 0 ? -1 : 1),
        startInside: false,
      }
    }

    // Zero-length sweep: pushes a bird OUT of a padded obstacle along the
    // nearest face (used while recoil-frozen, when the bird cannot integrate).
    const pushOutIfInside = (b, rect, padX, padY) => {
      const h = sweepSegmentVsRect(b.x, b.y, b.x, b.y, rect, padX, padY)
      if (!h) return false
      b.x = h.ex + h.nxOut * 1
      b.y = h.ey + h.nyOut * 1
      return true
    }

    // The logo is solid: steering targets, patrol centers and mid-flight
    // re-targets must not sit inside it (or near its face), or the bird
    // oscillates pad-boundary-style until the liveness guard rescues it.
    const logoPadFor = (b) =>
      Math.max(b.cfg.size * BIRD_HALF_W_FRAC, b.cfg.size * BIRD_HALF_H_FRAC) +
      14
    const insideLogoPad = (g, b, x, y) => {
      if (!g.logo) return false
      const m = logoPadFor(b)
      return (
        x > g.logo.left - m &&
        x < g.logo.right + m &&
        y > g.logo.top - m &&
        y < g.logo.bottom + m
      )
    }
    // Buttons are solid: a steering target on the CTA row would park the bird
    // on the button face (pad-boundary equilibrium) until the liveness guard
    // rescued it.
    const insideButtonPad = (g, x, y, m = 14) =>
      g.buttons.some((r) => distToRect(x, y, r) < m)

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
      // Patrol trigger: every 4th target selection (~25%) starts a loop —
      // but only in 'flying' and never while committed to a perch; if the
      // startPatrol geometry check fails, normal selection falls through.
      b.pickCount = (b.pickCount || 0) + 1
      if (
        b.state === 'flying' &&
        b.perchIdx < 0 &&
        b.pickCount % PATROL_EVERY_N_PICKS === 0 &&
        startPatrol(b, g, now)
      ) {
        b.waypointQueue = []
        b.target = patrolPoint(0, b.patrolLoop)
        return
      }

      let best = null
      let bestScore = -1
      for (let i = 0; i < SAMPLE_TRIES; i++) {
        const p = samplePoint(b, g)
        let ok = true
        if (g.h1 && distToLandmark(p.x, p.y, g) < H1_REJECT_DIST) ok = false
        if (ok && Math.hypot(p.x - b.x, p.y - b.y) < SELF_REJECT_DIST) ok = false
        // The logo is solid: candidates inside it (or its approach pad)
        // would park the steering on the box face until the liveness guard
        // rescued the bird.
        if (ok && insideLogoPad(g, b, p.x, p.y)) ok = false
        if (ok && insideButtonPad(g, p.x, p.y)) ok = false
        // A candidate whose straight path crosses the keep-out pad strands the
        // bird in the pad-boundary equilibrium cycle (diagnosed bug 1), so
        // only pick candidates reachable without entering the keep-out box.
        if (ok && crossesH1Lines(b.x, b.y, p.x, p.y, g, REPULSION_PAD)) ok = false
        if (ok) {
          best = p
          break
        }
        // Best-effort candidate: farthest from BOTH the landmark and the bird,
        // so a degenerate fallback can't park the bird on itself.
        const score =
          (g.h1 ? distToLandmark(p.x, p.y, g) : Infinity) +
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
      if (g.h1 && distToLandmark(best.x, best.y, g) < H1_REJECT_DIST) {
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
      // The forced-band target can still live inside the logo pad (the logo
      // sits directly above the headline): push it clear of the solid box.
      if (insideLogoPad(g, b, best.x, best.y)) {
        best = {
          x: best.x,
          y: clamp(
            g.logo.bottom + logoPadFor(b),
            INSET,
            Math.max(INSET + 1, g.h - INSET)
          ),
        }
      }
      // Same solid rule for the CTA row: drop the forced target to the
      // nearest clear side of the button it landed on.
      if (insideButtonPad(g, best.x, best.y)) {
        const r = g.buttons.find((rr) => distToRect(best.x, best.y, rr) < 14)
        if (r) {
          const belowY = r.bottom + 20
          best = {
            x: best.x,
            y: clamp(
              belowY <= g.h - INSET ? belowY : r.top - 20,
              INSET,
              Math.max(INSET + 1, g.h - INSET)
            ),
          }
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
        if (g.h1 && distToLandmark(far.x, far.y, g) < H1_REJECT_DIST) {
          const belowY = g.h1.bottom + H1_REJECT_DIST + 10
          far.y = clamp(
            belowY <= g.h - INSET ? belowY : g.h1.top - H1_REJECT_DIST - 10,
            INSET,
            Math.max(INSET + 1, g.h - INSET)
          )
        }
        // Same solid-box rule for the far target.
        if (insideLogoPad(g, b, far.x, far.y)) {
          far.y = clamp(
            g.logo.bottom + logoPadFor(b),
            INSET,
            Math.max(INSET + 1, g.h - INSET)
          )
        }
        if (insideButtonPad(g, far.x, far.y)) {
          const r = g.buttons.find((rr) => distToRect(far.x, far.y, rr) < 14)
          if (r) {
            const belowY = r.bottom + 20
            far.y = clamp(
              belowY <= g.h - INSET ? belowY : r.top - 20,
              INSET,
              Math.max(INSET + 1, g.h - INSET)
            )
          }
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

    // ---- perch points -------------------------------------------------------
    // Breakpoint-aware headline perching, computed in useLayoutMetrics from
    // the FIRST rendered line's rects: desktop 6 points at fractions
    // [0.08..0.92] of the line, mobile 3 points at [0.15, 0.5, 0.85] (only 2
    // birds fly below sm). p.y is the LINE TOP — pickPerch lifts the anchor
    // by the landing bird's size * FOOT_FRAC so the perched sprite's feet sit
    // exactly on the letter tops. No headline (fonts still loading) → no
    // points → pickPerch retries on its 3-5s timer while birds keep flying.
    // occupancy tracks which bird holds each point.
    let perchPts = []
    let lastHeadlineCount = 0
    const buildPerches = () => {
      const g = geom()
      if (!g) return g
      const oldOccupancy = perchPts.map((p) => p.occupiedBy)
      const src = g.perchSrc || []
      // Carry HEADLINE occupancy across rebuilds with the SAME headline
      // point count (a breakpoint flip drops perches and takes perched
      // birds back to flight). Logo-slot occupancy is restored by the
      // cleanup pass below (its indices are always the same two appended).
      const keepOld = src.length > 0 && src.length === lastHeadlineCount
      lastHeadlineCount = src.length
      perchPts = src.map((p, i) => ({
        x: clamp(p.x, 4, Math.max(4, g.w - 4)),
        y: clamp(p.y, 4, Math.max(4, g.h - 4)),
        occupiedBy: keepOld ? oldOccupancy[i] ?? null : null,
      }))
      // Logo perch points: two top-edge slots, uniform members of the SAME
      // pool as the headline slots (no selection bias in either direction).
      // p.y is the logo's visible top edge — the same anchor convention as
      // headline slots, so feet rest exactly on the top edge.
      if (g.logo) {
        for (const frac of LOGO_PERCH_FRACS) {
          perchPts.push({
            x: clamp(
              g.logo.left + frac * (g.logo.right - g.logo.left),
              4,
              Math.max(4, g.w - 4)
            ),
            y: clamp(g.logo.top, 4, Math.max(4, g.h - 4)),
            isLogo: true,
            occupiedBy: null,
          })
        }
      }
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
      const inFlyingPose = b.state === 'flying' || b.state === 'arriving'
      // Bounce choreography: the host wrapper carries ONE of the three phase
      // classes (is-impacting / is-confused / is-recovering), derived per
      // frame from recoil.start — no setTimeout chain, so RAF suspension
      // can't desync the phases; keyframes run on the sprite so the per-frame
      // transform on the host stays intact.
      const recoilPhase = b.recoil ? now - b.recoil.start : Infinity
      host.classList.toggle(
        'is-impacting',
        inFlyingPose && b.recoil !== null && recoilPhase < RECOIL_IMPACT_MS
      )
      host.classList.toggle(
        'is-confused',
        inFlyingPose && b.recoil !== null && recoilPhase >= RECOIL_IMPACT_MS && recoilPhase < RECOIL_HOLD_END_MS
      )
      host.classList.toggle(
        'is-recovering',
        inFlyingPose && b.recoil !== null && recoilPhase >= RECOIL_HOLD_END_MS && recoilPhase < RECOIL_END_MS
      )
      if (fly) {
        fly.classList.toggle('is-flapping', flying && !reduced && !gliding)
        fly.classList.toggle('hidden', b.state === 'perched')
        fly.classList.toggle('pdd-glide-pose', gliding)
        // Flap cadence: speed-up near a perch (approach flare). During the
        // impact+confusion phases the wings are HELD mid-flap by CSS
        // (animation-play-state: paused under the phase classes) and keep
        // their normal duration; recovery un-pauses them.
        const wantDur = b.fastFlap
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
    // overhead waypoint when it clears the expanded landmark AND the solid
    // logo. Otherwise route around by construction:
    //   [exit laterally at the bird's altitude] -> [rise along the margin,
    //   outside every blocked x-range] -> [glide the apron above every
    //   blocked box] -> [descend onto the overhead waypoint].
    // Every segment occurs outside the blocked boxes, so the glide never
    // visibly crosses the headline or dives through the logo — and every
    // perch is reachable, so perching can't starve like reject-only
    // selection did.
    const perchRoute = (b, p, g) => {
      const ox = clamp(p.x, 8, Math.max(8, g.w - 8))
      const oy = clamp(p.y - GLIDE_OVERHEAD, 8, Math.max(8, g.h - 8))
      const bw = b.cfg.size * BIRD_HALF_W_FRAC
      const bh = b.cfg.size * BIRD_HALF_H_FRAC
      const exPad = 20
      const hitsText = g.h1 && crossesH1Lines(b.x, b.y, ox, oy, g, exPad)
      const hitsLogo =
        !!g.logo &&
        !!sweepSegmentVsRect(b.x, b.y, ox, oy, g.logo, bw + exPad, bh + exPad)
      if (!hitsText && !hitsLogo) return [{ x: ox, y: oy }]

      // Union of the blocked boxes (their keep-out pads included).
      const box = { left: Infinity, right: -Infinity, top: Infinity, bottom: -Infinity }
      const widen = (r) => {
        box.left = Math.min(box.left, r.left)
        box.right = Math.max(box.right, r.right)
        box.top = Math.min(box.top, r.top)
        box.bottom = Math.max(box.bottom, r.bottom)
      }
      if (g.h1) {
        widen({
          left: g.h1.left - REPULSION_PAD,
          right: g.h1.right + REPULSION_PAD,
          top: g.h1.top - REPULSION_PAD,
          bottom: g.h1.bottom + REPULSION_PAD,
        })
      }
      if (g.logo) {
        widen({
          left: g.logo.left - bw - exPad,
          right: g.logo.right + bw + exPad,
          top: g.logo.top - bh - exPad,
          bottom: g.logo.bottom + bh + exPad,
        })
      }
      const leftExit = Math.abs(b.x - box.left) <= Math.abs(box.right - b.x)
      const exitX = clamp(
        leftExit ? box.left - 30 : box.right + 30,
        8,
        Math.max(8, g.w - 8)
      )
      const apronY = clamp(box.top - 20, 8, Math.max(8, g.h - 8))
      const bandBottom = box.bottom + 30
      const q = []
      if (b.y < bandBottom) {
        // Bird is beside/above the blocked band: reach the exit point at
        // its current altitude first (horizontal segment outside the x-range).
        q.push({ x: exitX, y: clamp(b.y, 8, Math.max(8, g.h - 8)) })
      } else {
        // Bird is below the band: drop slightly first so the lateral move
        // happens below the pads, then rise along the margin.
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
      // Aim the flight at where the PERCHED CENTER will sit: the perch point
      // is ON the first line's top edge, and the anchor sits size*FOOT_FRAC
      // above it so the sprite swap at landing is pixel-stable AND the feet
      // rest exactly on the letter tops (never a fixed pixel offset).
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
      b.recoil = null
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
    // creates the pad-boundary equilibrium cycle from bug 1) AND the solid
    // logo box (a target behind the logo would otherwise smack its face
    // every frame until the liveness guard re-picked).
    const losClearToTarget = (b, g) => {
      const t = b.target
      if (!t) return true
      if (
        g.logo &&
        sweepSegmentVsRect(
          b.x,
          b.y,
          t.x,
          t.y,
          g.logo,
          b.cfg.size * BIRD_HALF_W_FRAC + 2,
          b.cfg.size * BIRD_HALF_H_FRAC + 2
        )
      )
        return false
      if (!g.h1) return true
      return !crossesH1Lines(b.x, b.y, t.x, t.y, g, REPULSION_PAD)
    }

    // ---- feathers ------------------------------------------------------------
    // Spawned ONLY when the colliding surface is the logo — the hero's one
    // object that visibly sheds on impact. Hero edge, headline and other
    // collisions still recoil + squash, they just don't spawn particles
    // (cheaper on the DOM, and consistent with the button/text hitboxes that
    // never spawn). Logo collisions are detected against the cached logoRect
    // from useLayoutMetrics, checked separately from headline/hero edges.
    // Spawned on collision at the bird position, flying away from the impact
    // in the reflected direction ± 22°. Purely CSS-animated: initial
    // velocity + rotation are inline custom properties feeding one keyframe,
    // and animationend removes each span — no per-feather JS loop. The
    // 18-feather cap prevents runaway accumulation on rapid collisions.
    const spawnFeathers = (b, i, angle, surface) => {
      if (surface !== 'logo') return
      if (reduced) return
      const layer = featherLayerRef?.current
      if (!layer) return
        if (layer.childElementCount >= FEATHER_CAP) return

      const host = hostRefs.current[i]
      const color = host ? getComputedStyle(host).color : 'currentColor'
      const n = Math.round(rand(FEATHER_MIN, FEATHER_MAX))
      for (let k = 0; k < n; k++) {
        const span = document.createElement('span')
        span.className = 'pdd-feather'
        const cone = (FEATHER_CONE_DEG * Math.PI) / 180
        const a = angle + rand(-cone, cone)
        const speed = rand(FEATHER_SPEED[0], FEATHER_SPEED[1]) // px/frame away from the surface
        const life = rand(FEATHER_LIFE_MS[0], FEATHER_LIFE_MS[1])
        const frames = life / 16.7
        // Keyframe end-point: velocity damped over the flight + the gravity
        // pull (0.15px/frame²) baked into the destination offset.
        const dx = Math.cos(a) * speed * frames * 0.6
        const dy = Math.sin(a) * speed * frames * 0.6 + 0.075 * frames * frames
        span.style.left = `${b.x + b.cfg.size / 2}px`
        span.style.top = `${b.y + b.cfg.size / 2}px`
        span.style.setProperty('--pdd-life', `${Math.round(life)}ms`)
        span.style.setProperty('--fdx', `${dx.toFixed(1)}px`)
        span.style.setProperty('--fdy', `${dy.toFixed(1)}px`)
        span.style.setProperty('--fstart', `${rand(-60, 60).toFixed(0)}deg`)
        span.style.setProperty('--frot', `${rand(-240, 240).toFixed(0)}deg`)
        span.style.color = color
        span.style.filter = `brightness(${rand(0.85, 1.15).toFixed(2)})`
        span.addEventListener('animationend', () => span.remove(), { once: true })
        layer.appendChild(span)
      }
    }

    const takeOff = (b, i, now) => {
      releasePerch(b)
      b.state = 'flying'
      b.recoil = null
      const a = rand(0, Math.PI * 2)
      // Takeoff push: slow first frame, extra steering for BOOST_MS — a
      // visible launch arc instead of an instant jump to cruising speed.
      b.vx = Math.cos(a) * TAKEOFF_START_SPEED
      b.vy = Math.sin(a) * TAKEOFF_START_SPEED
      b.facing = Math.cos(a) >= 0 ? 1 : -1
      b.boostUntil = now + BOOST_MS
      b.nextPerchAt = now + rand(b.cfg.perchEvery[0], b.cfg.perchEvery[1])
      if (b.cfg.dart) b.nextDartAt = now + rand(b.cfg.dart[0], b.cfg.dart[1])
      pickTarget(b, geom(), now)
      renderBird(b, i, now)
    }

    // ---- patrol loops -------------------------------------------------------
    // Every 4th target selection (25%), a flying bird traces a closed
    // parametric pattern for 2-4s instead of seeking a plain waypoint, so
    // flight has visible structure instead of pure random drift. Steering
    // forces stay physical: the hook computes the path point every frame and
    // the bird is PULLED toward it — never snapped to it.
    const patrolPoint = (s, L) => {
      const R = L.R
      switch (L.shape) {
        case 'figure8': {
          // Two connected circles: a real figure-eight, closed so the exit
          // heading matches the entry heading.
          const u = Math.PI * 2 * s
          return { x: L.cx + R * Math.sin(2 * u), y: L.cy + R * Math.sin(u) }
        }
        case 'loopDeLoop': {
          // Single vertical circle entered from below; y starts at the
          // bottom of the arc, closes level so entry/exit headings match.
          const u = Math.PI * 2 * s
          return { x: L.cx + R * Math.sin(u), y: L.cy + R * Math.cos(u) }
        }
        case 'orbit': {
          // Tight circular orbit around a fixed point.
          const u = Math.PI * 2 * s * L.revs
          return { x: L.cx + R * Math.cos(u), y: L.cy + R * Math.sin(u) }
        }
        case 'sweep': {
          // L→R→L patrol at a fixed Y: forward leg, edge hang, reverse leg,
          // edge hang (piecewise-linear parametric; steer damps velocity in
          // the hang windows so the 200ms pause reads as a deliberate census
          // break before the hard bank onto the reverse leg).
          const t = s * L.duration
          if (t < L.t1)
            return {
              x: L.leftX + (L.rightX - L.leftX) * (t / L.t1),
              y: L.fixedY,
            }
          if (t < L.t2) return { x: L.rightX, y: L.fixedY }
          if (t < L.t3)
            return {
              x: L.rightX - (L.rightX - L.leftX) * ((t - L.t2) / (L.t3 - L.t2)),
              y: L.fixedY,
            }
          return { x: L.leftX, y: L.fixedY }
        }
        default: {
          // corkscrew: horizontal circle that MIGRATES across the hero at
          // constant speed — the bird spirals while drifting.
          const u = Math.PI * 2 * s * L.revs
          return {
            x: L.cx + L.drift * s + R * Math.cos(u),
            y: L.cy + R * Math.sin(u),
          }
        }
      }
    }

    const startPatrol = (b, g, now) => {
      if (!g) return false
      const shape = PATROL_SHAPES[Math.floor(Math.random() * PATROL_SHAPES.length)]
      // Sweep (L→R→L): a horizontal pass at a FIXED, band-validated Y —
      // 3-4s per direction, a 200ms hang at each edge (velocity damped in
      // steer, then a hard bank onto the reverse leg), 6-9s total. The Y is
      // drawn only from open airspace: above or below the headline band,
      // clear of the logo box and every button pad; no valid band → no
      // sweep this pick (normal flying resumes).
      if (shape === 'sweep') {
        const mSweep = 14
        const mX = b.cfg.size * BIRD_HALF_W_FRAC + mSweep
        const mY = b.cfg.size * BIRD_HALF_H_FRAC + mSweep
        const leftX = clamp(mX, 8, Math.max(8, g.w - mX))
        const rightX = Math.max(leftX + 60, clamp(g.w - mX, leftX + 61, Math.max(leftX + 62, g.w - 8)))
        const clearAt = (y) =>
          (!g.h1 ||
            !g.h1.lines.some(
              (line) => y > line.top - mY - 10 && y < line.bottom + mY + 10
            )) &&
          (!g.logo || y < g.logo.top - mY - 10 || y > g.logo.bottom + mY + 10) &&
          !g.buttons.some((r) => y > r.top - mY - 10 && y < r.bottom + mY + 10)
        const bands = []
        if (g.h1) {
          bands.push([mY + 8, g.h1.top - mY - 10])
          bands.push([g.h1.bottom + mY + 10, g.h - mY - 8])
        } else {
          bands.push([mY + 8, g.h - mY - 8])
        }
        const valid = bands.filter(([lo, hi]) => hi - lo >= 24)
        if (!valid.length) return false
        const [lo, hi] = valid[Math.floor(Math.random() * valid.length)]
        let fixedY = rand(lo, hi)
        let tries = 0
        while (!clearAt(fixedY) && tries < 8) {
          fixedY = rand(lo, hi)
          tries += 1
        }
        if (!clearAt(fixedY)) return false
        const leg = rand(PATROL_SWEEP_LEG_MS[0], PATROL_SWEEP_LEG_MS[1])
        const t1 = leg
        const t2 = t1 + PATROL_SWEEP_EDGE_PAUSE_MS
        const t3 = t2 + leg
        b.patrolLoop = {
          shape: 'sweep',
          leftX,
          rightX,
          fixedY,
          t1,
          t2,
          t3,
          start: now,
          duration: t3 + PATROL_SWEEP_EDGE_PAUSE_MS,
        }
        b.waypointQueue = []
        b.hardApproach = false
        return true
      }
      const R = rand(PATROL_R[0], PATROL_R[1])
      const dir = b.vx >= 0 ? 1 : -1
      const drift =
        shape === 'corkscrew' ? dir * rand(PATROL_DRIFT[0], PATROL_DRIFT[1]) : 0
      const revs =
        shape === 'orbit' || shape === 'corkscrew'
          ? Math.round(rand(PATROL_ORBIT_REVS[0], PATROL_ORBIT_REVS[1]))
          : 1
      // The whole path stays within (R + |drift|/2) of the drift-adjusted
      // center, so first pick a center whose bounding circle clears every
      // headline keep-out line (and the hero edges). Never starts inside the
      // headline force field; if no candidate clears, no patrol this pick.
      const bound = R + Math.abs(drift) / 2
      const need = bound + REPULSION_PAD + PATROL_CLEAR_PAD
      const ysList = g.h1
        ? [b.y, g.h1.top - need - 8, g.h1.bottom + need + 8]
        : [b.y]
      for (const cy0 of ysList) {
        const cy = clamp(cy0, bound + 6, Math.max(bound + 7, g.h - bound - 6))
        const cxMid = clamp(b.x, bound + 6, Math.max(bound + 7, g.w - bound - 6))
        let clear = true
        if (g.h1) {
          for (const line of g.h1.lines) {
            if (
              distToRect(cxMid, cy, {
                left: line.left - REPULSION_PAD,
                right: line.right + REPULSION_PAD,
                top: line.top - REPULSION_PAD,
                bottom: line.bottom + REPULSION_PAD,
              }) < need
            ) {
              clear = false
              break
            }
          }
        }
        // The logo is solid: a loop whose bounding circle reaches it would
        // pin the bird against the face for the whole 2-4s pattern.
        if (
          clear &&
          g.logo &&
          distToRect(cxMid, cy, {
            left: g.logo.left - REPULSION_PAD,
            right: g.logo.right + REPULSION_PAD,
            top: g.logo.top - REPULSION_PAD,
            bottom: g.logo.bottom + REPULSION_PAD,
          }) < need
        ) {
          clear = false
        }
        // Buttons are solid too: a loop crossing the CTA row would pin the
        // bird on a button face for the whole pattern.
        if (
          clear &&
          g.buttons.some(
            (r) =>
              distToRect(cxMid, cy, {
                left: r.left - REPULSION_PAD,
                right: r.right + REPULSION_PAD,
                top: r.top - REPULSION_PAD,
                bottom: r.bottom + REPULSION_PAD,
              }) < need
          )
        ) {
          clear = false
        }
        if (clear) {
          b.patrolLoop = {
            shape,
            R,
            drift,
            revs,
            cx: cxMid - drift / 2,
            cy,
            start: now,
            duration: rand(PATROL_DUR_MS[0], PATROL_DUR_MS[1]),
          }
          b.waypointQueue = []
          b.hardApproach = false
          return true
        }
      }
      return false
    }

    // ---- steering integration for flying/arriving ---------------------------
    const steer = (b, now, dt, g, i) => {
      b.steerCount = (b.steerCount || 0) + 1
      // Patrol: while a loop is active it overrides waypoint selection —
      // the target is recomputed every frame from the parametric path so
      // normal steering forces carry the bird around it. Patrols only live
      // in 'flying'; on exit the normal selection resumes (this pick IS the
      // next target pick).
      if (b.patrolLoop) {
        const L = b.patrolLoop
        const s = (now - L.start) / L.duration
        if (b.state !== 'flying' || s >= 1) {
          b.patrolLoop = null
          if (b.state === 'flying' && !b.target) pickTarget(b, g, now)
        } else {
          b.target = patrolPoint(clamp(s, 0, 1), L)
          // Sweep edge-hang windows: damp velocity so the bird parks at the
          // edge for the 200ms pause, then banks hard onto the reverse leg.
          if (L.shape === 'sweep') {
            const tt = now - L.start
            if ((tt >= L.t1 && tt < L.t2) || tt >= L.t3) {
              const f = Math.pow(0.86, dt)
              b.vx *= f
              b.vy *= f
            }
          }
        }
      }
      const t = b.target
      if (!t) {
        // Never let a flying bird have nowhere to go.
        pickTarget(b, g, now)
        return
      }
      const dx = t.x - b.x
      const dy = t.y - b.y
      const dist = Math.hypot(dx, dy)

      // Sticky recoil (three-phase bounce): impact+confusion freeze the bird
      // — steering skipped, velocity stays zero, only the 1px re-push below
      // keeps it out of obstacles. At HOLD_END the parked reflected velocity
      // applies once (phase C, "fly away") and the recoil then clears ON
      // TIME ALONE: movement/dot conditions could never pass while velocity
      // is zero. The 350ms frozen floor already exceeds the old triple-ram
      // interval; a post-clear re-contact is a fresh, legitimate hit. Safety
      // cap: a bird still not moving away at 500ms gets an away-velocity.
      if (b.recoil) {
        const R = b.recoil
        const elapsed = now - R.start
        if (elapsed < RECOIL_HOLD_END_MS) {
          // Phases A+B: frozen; re-push out of any obstacle if needed.
          const fhw = b.cfg.size * BIRD_HALF_W_FRAC
          const fhh = b.cfg.size * BIRD_HALF_H_FRAC
          if (g.logo) pushOutIfInside(b, g.logo, fhw, fhh)
          for (const btn of g.buttons) pushOutIfInside(b, btn, fhw, fhh)
          if (b.state === 'flying' && g.h1) {
            const tPadY = Math.min(REPULSION_PAD, b.cfg.size * FOOT_FRAC - 1)
            for (const line of g.h1.lines) {
              pushOutIfInside(b, line, REPULSION_PAD + fhw, tPadY)
            }
          }
          b.x = clamp(b.x, fhw, Math.max(fhw, g.w - fhw))
          b.y = clamp(b.y, fhh, Math.max(fhh, g.h - fhh))
          return
        }
        if (!R.applied) {
          b.vx = R.rvx
          b.vy = R.rvy
          R.applied = true
        }
        if (elapsed >= RECOIL_CLEAR_MAX_MS) {
          // Force-clear: guarantee AWAY motion before dropping the state.
          const m = Math.hypot(b.vx, b.vy)
          if (
            b.vx * R.nx + b.vy * R.ny < 0.1 ||
            m < RECOIL_CLEAR_AWAY_SPEED
          ) {
            b.vx = R.nx * RECOIL_CLEAR_AWAY_SPEED
            b.vy = R.ny * RECOIL_CLEAR_AWAY_SPEED
          }
          b.recoil = null
        } else if (elapsed >= RECOIL_END_MS) {
          b.recoil = null
        }
        // Phase C: fall through — the reflected velocity carries the bird
        // off the surface while normal steering resumes underneath.
      }

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

      if (dist < TARGET_ARRIVE_RADIUS && !b.patrolLoop) {
        // reached the current target (patrol targets move every frame — no
        // waypoint advancement logic may fire mid-loop)
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
      if (b.cfg.dart && b.perchIdx < 0 && !b.patrolLoop) {
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
      ;[b.vx, b.vy] = clampMag(b.vx, b.vy, limit)      // Capture the pre-integration position: the swept collision below
      // tests the ENTIRE center path this frame, not the endpoint.
      const prevX = b.x
      const prevY = b.y
      b.x += b.vx * dt
      b.y += b.vy * dt

      // ---- swept solid-obstacle collision (replaces point-in-rect) --------
      // The CENTER traveled (prevX,prevY)->(b.x,b.y) this frame; the slab
      // sweep tests the entire segment (birds cannot tunnel at any frame
      // delta), and the response parks the bird DEFINITIVELY outside the
      // entry face (entry point + outward normal x 1px). Obstacles: the
      // solid logo (swept in flying AND arriving — it can never be entered,
      // ever), each headline per-line keep-out (flying, as before), and the
      // hero edges (for edges the swept check IS the clamp). The sweep runs
      // every frame regardless of cooldown: the cooldown gates only the
      // squash/feather choreography, never the position fix — the old
      // cooldown-unchecked drift plus the deep-exit push (whose face/velocity
      // sign gate never matched for approaches toward the far face) is what
      // let birds glide through the logo whole.
      // Tangential velocity is preserved on every hit, so a grazing bird
      // slides along the surface instead of stopping dead.
      const padHW = b.cfg.size * BIRD_HALF_W_FRAC
      const padHH = b.cfg.size * BIRD_HALF_H_FRAC
      let hitSurface = null
      let hitNormal = null
      const sweptHit = (rect, padX, padY, surface) => {
        const h = sweepSegmentVsRect(prevX, prevY, b.x, b.y, rect, padX, padY)
        if (!h) return null
        if (h.startInside) {
          // Invariant breach (metrics refresh / perch-anchor edge cases):
          // re-push onto the NEAREST face — never a far-side launch — and
          // warn once per bird so a live regression stays loud, not spammy.
          b.x = h.ex + h.nxOut * 1
          b.y = h.ey + h.nyOut * 1
          if (!b._sweepInvariantWarned) {
            b._sweepInvariantWarned = true
            console.warn(
              `[birdPets] sweep invariant: segment started inside the ${surface}`
            )
          }
        } else {
          b.x = h.ex + h.nxOut * 1
          b.y = h.ey + h.nyOut * 1
        }
        if (!hitSurface) {
          hitSurface = surface
          hitNormal = { nx: h.nxOut, ny: h.nyOut }
        }
        if (dbgOn) {
          b._sweepContact = {
            surface,
            x: Math.round(h.ex * 10) / 10,
            y: Math.round(h.ey * 10) / 10,
            n: `${h.nxOut},${h.nyOut}`,
            startInside: h.startInside,
          }
        }
        // Reflect only the normal component (tangential untouched).
        const nDot = b.vx * h.nxOut + b.vy * h.nyOut
        if (nDot < 0) {
          b.vx -= (1 + BOUNCE_RESTITUTION) * nDot * h.nxOut
          b.vy -= (1 + BOUNCE_RESTITUTION) * nDot * h.nyOut
        }
        return true
      }
      // Hero edges: position clamp with anisotropic sprite half-extents;
      // reflect the component moving INTO the boundary at restitution.
      if (b.x < padHW && b.vx < 0) {
        b.x = padHW
        b.vx = -b.vx * BOUNCE_RESTITUTION
        if (!hitSurface) {
          hitSurface = 'edge'
          hitNormal = { nx: 1, ny: 0 }
        }
      } else if (b.x > g.w - padHW && b.vx > 0) {
        b.x = g.w - padHW
        b.vx = -b.vx * BOUNCE_RESTITUTION
        if (!hitSurface) {
          hitSurface = 'edge'
          hitNormal = { nx: -1, ny: 0 }
        }
      }
      if (b.y < padHH && b.vy < 0) {
        b.y = padHH
        b.vy = -b.vy * BOUNCE_RESTITUTION
        if (!hitSurface) {
          hitSurface = 'edge'
          hitNormal = { nx: 0, ny: 1 }
        }
      } else if (b.y > g.h - padHH && b.vy > 0) {
        b.y = g.h - padHH
        b.vy = -b.vy * BOUNCE_RESTITUTION
        if (!hitSurface) {
          hitSurface = 'edge'
          hitNormal = { nx: 0, ny: -1 }
        }
      }
      // The logo: solid, first-class obstacle in flying AND arriving.
      if (g.logo) {
        sweptHit(g.logo, padHW, padHH, 'logo')
      }
      // Buttons: solid, flying AND arriving — same three-phase bounce as any
      // other surface (feathers stay logo-only by construction below, and
      // buttons are excluded from the perch pool by construction).
      for (const btn of g.buttons) {
        if (sweptHit(btn, padHW, padHH, 'button')) break
      }
      // Headline keep-out per line (flying only — unchanged semantics: a
      // bird can thread the gap between two lines, but a path through any
      // line of text is blocked). Vertical pad stays TIGHT (letters may be
      // approached, never clipped) and is capped below the perch anchor
      // clearance (size*FOOT_FRAC): a bird taking off FROM a perch — anchor
      // size*FOOT_FRAC above the line top — otherwise starts inside the
      // expanded box and fires the invariant. Horizontal pad adds the
      // sprite half-width so the sprite itself keeps the full tight gap at
      // the line sides.
      if (!hitSurface && b.state === 'flying' && g.h1) {
        const textPadY = Math.min(REPULSION_PAD, b.cfg.size * FOOT_FRAC - 1)
        for (const line of g.h1.lines) {
          if (sweptHit(line, REPULSION_PAD + padHW, textPadY, 'text')) break
        }
      }
      // Choreography gate: bounceCoolUntil + the sticky recoil prevent a
      // second choreography window while one is live. Position fixes above
      // are NEVER gated — only feathers/squash/frozen-hold are.
      // On a fresh hit: record the sticky recoil (entry point + outward
      // normal + REFLECTED velocity), then zero the live velocity — steer()
      // applies the parked velocity at HOLD_END (phase C) while renderBird
      // drives the is-impacting/is-confused/is-recovering class chain.
      if (hitSurface && !b.recoil && now >= b.bounceCoolUntil) {
        const N = hitNormal || { nx: 0, ny: 0 }
        b.recoil = {
          start: now,
          x: b.x,
          y: b.y,
          nx: N.nx,
          ny: N.ny,
          rvx: b.vx,
          rvy: b.vy,
          applied: false,
        }
        b.vx = 0
        b.vy = 0
        b.bounceCoolUntil = now + BOUNCE_COOLDOWN_MS
        if (dbgOn) {
          const gap = dbgJit.lastCollisionAt
            ? now - dbgJit.lastCollisionAt
            : null
          if (gap !== null) dbgJit.collisionIntervals.push(gap)
          dbgJit.lastCollisionAt = now
          console.info(
            `[bird-diag] collision bird=${i} surface=${hitSurface} t=+${Math.round(now - now0)}ms gapSinceLast=${gap === null ? 'first' : Math.round(gap) + 'ms'} normal=(${N.nx},${N.ny}) reflectV=(${b.recoil.rvx.toFixed(2)},${b.recoil.rvy.toFixed(2)})`
          )
        }
        spawnFeathers(b, i, Math.atan2(b.recoil.rvy, b.recoil.rvx), hitSurface)
        if (!losClearToTarget(b, g)) pickTarget(b, g, now)
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
      if (b.state === 'flying' && !b.patrolLoop) {
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

      // Delta-time spike cap: a long frame (tab wake-up, GC pause) can never
      // move the flock further than 2 frames @60fps — no giant-dt teleports.
      const rawDt = now - lastTime
      const dt = Math.max(
        Math.min(rawDt, DT_CAP_MS) / (1000 / 60),
        0.2
      )
      lastTime = now

      const g = geom()
      if (!g || g.w <= 0 || g.h <= 0) return

      dbgLogRects(g)
      birds.forEach((b, i) => {
        if (b.state === 'perched') {
          // §0: a slot can move under an OCCUPIED bird without a metrics
          // update firing (font swap / late hero layout settle). Re-anchor
          // gently — an exponential settle (~1s), never a teleport — so the
          // feet stay planted on the CURRENT glyph tops.
          const slot = b.perchIdx >= 0 ? perchPts[b.perchIdx] : null
          if (slot) {
            const dx = slot.x - b.x
            const dy = slot.y - b.cfg.size * FOOT_FRAC - b.y
            if (Math.abs(dx) + Math.abs(dy) > 0.5) {
              const k = 1 - Math.exp(-dt * 6)
              b.x += dx * k
              b.y += dy * k
            }
          }
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
          if (
            b.state === 'flying' &&
            !b.patrolLoop &&
            now >= b.nextPerchAt
          )
            pickPerch(b, now, g)
        }
        dbgFrame(b, i, now, g, rawDt, rawDt > DT_CAP_MS)
        renderBird(b, i, now)
      })
    }
    // TEMP-diag (?birds-debug=1): three gated probes, all REMOVED after the
    // report + confirm cycle:
    //   Bug A — any bird moving >20px in one frame logs full forensics
    //   (positions, state, sticky recoil, THAT FRAME's sweep result with
    //   entry point + normal, target, patrol, and whether the frame was a
    //   handleMetricsUpdate pass).
    //   Bug B — the first flying, non-patrolling bird samples every frame:
    //   dt raw, dt-clamped marker, per-frame position delta; summarized at
    //   the end of the window with sampled raw frames.
    //   Verification — collisions log with timestamps + inter-collision
    //   gaps; logo-inside frames counted; headline perches log the glyph
    //   anchor chain (§0).
    const dbgOn = new URLSearchParams(window.location.search).has('birds-debug')
    const dbgUntil = dbgOn ? now0 + 120000 : 0
    const dbgPrev = dbgOn ? birds.map(() => ({ x: NaN, y: NaN, inside: false })) : null
    const dbgStats = dbgOn
      ? birds.map(() => ({ inside: 0, enter: 0, exit: 0, teleports: 0 }))
      : null
    const dbgJit = dbgOn
      ? {
          n: 0,
          dtSum: 0,
          dtMin: Infinity,
          dtMax: 0,
          dtClamped: 0,
          maxDelta: 0,
          posSamples: [],
          collisionIntervals: [],
          lastCollisionAt: 0,
          reported: false,
        }
      : null
    let dbgRectsLogged = false
    let dbgMetricsMarker = 0 // set by handleMetricsUpdate, consumed per frame
    let dbgJitterBird = -1
    const dbgLogRects = (g) => {
      if (dbgRectsLogged || !dbgOn) return
      dbgRectsLogged = true
      // Element vs contained-art check: the hero logo <img> has no wrapper
      // (containerRect == imgRect by construction), so the meaningful probe
      // is rendered rect vs natural size (object-cover crop) and vs the rect
      // the collision code actually measured.
      const logoEl = [...heroEl.querySelectorAll('img')].find(
        (img) => img.getClientRects().length > 0
      )
      const r = logoEl?.getBoundingClientRect()
      const heroBox = heroEl.getBoundingClientRect()
      console.warn(
        `[bird-diag] logo bounds measured=${g.logo ? `[${g.logo.left.toFixed(1)},${g.logo.top.toFixed(1)} ${(g.logo.right - g.logo.left).toFixed(1)}x${(g.logo.bottom - g.logo.top).toFixed(1)}]` : 'null'} img=${r ? `[${(r.left - heroBox.left).toFixed(1)},${(r.top - heroBox.top).toFixed(1)} ${r.width.toFixed(1)}x${r.height.toFixed(1)}]` : 'null'} natural=${logoEl ? `${logoEl.naturalWidth}x${logoEl.naturalHeight}` : 'null'}`
      )
    }

    const dbgFrame = (b, i, now, g, rawDtMs, clampedDt) => {
      if (!dbgOn) return
      if (now > dbgUntil) {
        if (!dbgJit.reported) {
          dbgJit.reported = true
          const agg = dbgStats.reduce(
            (s, t) => ({
              teleports: s.teleports + t.teleports,
              inside: s.inside + t.inside,
            }),
            { teleports: 0, inside: 0 }
          )
          const avg = dbgJit.n ? dbgJit.dtSum / dbgJit.n : 0
          console.warn(
            `[bird-diag] SUMMARY: teleports=${agg.teleports} insideFrames=${agg.inside} ` +
              `jitter{frames=${dbgJit.n} avgDt=${avg.toFixed(1)}ms minDt=${dbgJit.dtMin === Infinity ? 'n/a' : dbgJit.dtMin.toFixed(1) + 'ms'} maxDt=${dbgJit.dtMax.toFixed(1)}ms clamped=${dbgJit.dtClamped} maxFrameDelta=${dbgJit.maxDelta.toFixed(2)}px} ` +
              `collisionGapsMs=${JSON.stringify(dbgJit.collisionIntervals.map(Math.round))} ` +
              `posSamples=${JSON.stringify(dbgJit.posSamples)}`
          )
        }
        return
      }
      const p = dbgPrev[i]
      const delta = p.x === p.x ? Math.hypot(b.x - p.x, b.y - p.y) : 0
      const rect = g.logo
      if (rect) {
        const inside =
          b.x > rect.left && b.x < rect.right && b.y > rect.top && b.y < rect.bottom
        if (inside) dbgStats[i].inside += 1
        if (!p.inside && inside) dbgStats[i].enter += 1
        else if (p.inside && !inside) dbgStats[i].exit += 1
        p.inside = inside
      }
      // Bug A forensics: any bird that jumped >20px in one frame.
      if (p.x === p.x && delta > 20) {
        dbgStats[i].teleports += 1
        console.warn(
          `[bird-diag] TELEPORT bird=${i} last=(${p.x.toFixed(1)},${p.y.toFixed(1)}) now=(${b.x.toFixed(1)},${b.y.toFixed(1)}) delta=${delta.toFixed(1)}px frameDt=${rawDtMs.toFixed(1)}ms state=${b.state} ` +
            `recoil=${b.recoil ? `active(${Math.round(now - b.recoil.start)}msAgo normal=${b.recoil.nx},${b.recoil.ny})` : 'no'} ` +
            `sweep=${b._sweepContact ? JSON.stringify(b._sweepContact) : 'none'} ` +
            `target=${b.target ? `(${b.target.x.toFixed(0)},${b.target.y.toFixed(0)})` : 'null'} ` +
            `patrol=${b.patrolLoop ? b.patrolLoop.shape : 'no'} ` +
            `metrics=${dbgMetricsMarker === now ? 'UPDATE-THIS-FRAME' : 'none'}`
        )
      }
      p.x = b.x
      p.y = b.y
      // Bug B sampling: the first flying, non-patrolling bird, every frame.
      if (dbgJitterBird < 0 && b.state === 'flying' && !b.recoil) dbgJitterBird = i
      if (i === dbgJitterBird && !b.patrolLoop) {
        dbgJit.n += 1
        dbgJit.dtSum += rawDtMs
        if (rawDtMs < dbgJit.dtMin) dbgJit.dtMin = rawDtMs
        if (rawDtMs > dbgJit.dtMax) dbgJit.dtMax = rawDtMs
        if (clampedDt) dbgJit.dtClamped += 1
        if (delta > dbgJit.maxDelta) dbgJit.maxDelta = delta
        if (dbgJit.n % 60 === 0 && dbgJit.posSamples.length < 60) {
          dbgJit.posSamples.push({
            t: Math.round(now - now0),
            dtRaw: +rawDtMs.toFixed(2),
            clamped: clampedDt,
            delta: +delta.toFixed(2),
            pos: `(${b.x.toFixed(1)},${b.y.toFixed(1)})`,
            vel: `(${b.vx.toFixed(2)},${b.vy.toFixed(2)})`,
          })
        }
      }
      // §0 glyph-anchor sample: headline perches, throttled to ~2s per bird.
      if (
        b.state === 'perched' &&
        b.perchIdx >= 0 &&
        perchPts[b.perchIdx] &&
        !perchPts[b.perchIdx].isLogo &&
        now - (b._dbgPerchLogAt || 0) > 2000
      ) {
        b._dbgPerchLogAt = now
        const anchor = perchPts[b.perchIdx]
        const feetY = b.y + b.cfg.size * FOOT_FRAC
        console.warn(
          `[bird-diag] perch bird=${i} anchor(glyphTop)=(${anchor.x.toFixed(1)},${anchor.y.toFixed(1)}) hostAnchorY=${b.y.toFixed(1)} feetY=${feetY.toFixed(1)} feetVsGlyphTop=${(feetY - anchor.y).toFixed(2)}px size=${b.cfg.size} FOOT_FRAC=${FOOT_FRAC}`
        )
      }
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
          b.y = p.y - b.cfg.size * FOOT_FRAC
          perchPts[b.perchIdx].occupiedBy = b.id
          renderBird(b, i, performance.now())
        })
      }
    }
    mq.addEventListener?.('change', onMotionChange)

    // ---- metrics-update handler ---------------------------------------------
    // useLayoutMetrics fires after every recompute (fonts, images, resize,
    // breakpoint flip). Positions clamp into the new hero rect; flying
    // targets that now sit outside the hero or inside the headline keep-out
    // are cleared (re-picked on the next tick); active patrols abort; perched
    // birds re-anchor to the rebuilt perch points; on a BREAKPOINT flip every
    // perched bird takes off and re-lands on the new breakpoint's points
    // naturally. Nothing here teleports a flying bird mid-hero.
    const handleMetricsUpdate = (_m, info) => {
      dbgMetricsMarker = performance.now()
      buildPerches()
      const g = geom()
      if (!g || g.w <= 0 || g.h <= 0) return
      birds.forEach((b, i) => {
        b.patrolLoop = null
        if (b.state === 'perched') {
          const p = b.perchIdx >= 0 ? perchPts[b.perchIdx] : null
          if (info.breakpointChanged || !p || p.occupiedBy !== b.id) {
            takeOff(b, i, performance.now())
          } else {
            // Re-anchor at the LANDING convention (anchor offset above the
            // perch point) so the sprite stays seated exactly as at landing.
            // A raw p.y anchor sinks the sprite and starts the next takeoff
            // INSIDE the text keep-out box (invariant warning source).
            b.x = p.x
            b.y = p.y - b.cfg.size * FOOT_FRAC
          }
        } else {
          b.x = clamp(b.x, 4, Math.max(4, g.w - 4))
          b.y = clamp(b.y, 4, Math.max(4, g.h - 4))
          const t = b.target
          if (
            b.state === 'flying' &&
            (!t ||
              t.x < 0 ||
              t.x > g.w ||
              t.y < 0 ||
              t.y > g.h ||
              (g.h1 && distToLandmark(t.x, t.y, g) < REPULSION_PAD + 4) ||
              insideLogoPad(g, b, t.x, t.y))
          ) {
            b.target = null
            b.waypointQueue = []
          }
        }
        renderBird(b, i, performance.now())
      })
    }

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
      pickTarget(b, geom(), now0)
      if (reduced) {
        // static perched birds only (landing anchor convention, as above)
        b.state = 'perched'
        b.perchIdx = Math.min(i, perchPts.length - 1)
        const p = perchPts[b.perchIdx]
        b.x = p.x
        b.y = p.y - b.cfg.size * FOOT_FRAC
        perchPts[b.perchIdx].occupiedBy = b.id
      }
      setFlapDur(i)
      renderBird(b, i, now0)
    })

    onUpdateRef.current = handleMetricsUpdate

    if (!reduced && inView) startLoop()

    return () => {
      stopLoop()
      io.disconnect()
      mq.removeEventListener?.('change', onMotionChange)
      onUpdateRef.current = null
    }
  }, [containerRef, landmarkRef, count, hostRefs, flyRefs, perchRefs])
}

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
 * below sm (CSS); personalities + static colour tints kept.
 *
 * Route modes: legacy multi-leg waypoint planner by default; a grid A*
 * pathfinder (birdPathfinder.js) behind ?birds-route=grid. The A/B decides
 * which becomes the default.
 */

import { useEffect, useRef } from 'react'
import useLayoutMetrics from './useLayoutMetrics'
import {
  GRID_MARGIN,
  GRID_MARGIN_MOBILE,
  buildNavGrid,
  gridLineClear,
  gridPath,
  gridStats,
  testNavRoutes,
} from './birdPathfinder'
import {
  ARRIVE_RADIUS,
  ARRIVE_SAFETY_MS,
  ARRIVE_SPEED,
  ARRIVE_SLOW_DIST,
  ARRIVE_TERM_FACTOR,
  BANK_SMOOTH,
  BOOST_MS,
  BIRD_HALF_H_FRAC,
  BIRD_HALF_W_FRAC,
  BOUNCE_COOLDOWN_MS,
  BOUNCE_RESTITUTION,
  CRASH_IMMUNE_FLIGHTS,
  CRASH_IMMUNE_MS,
  DART_DECAY_MS,
  DART_SPEED,
  DIZZY_MS,
  DIZZY_STARS_HZ,
  DIZZY_WOBBLE_DEG,
  DIZZY_WOBBLE_HZ,
  DT_CAP_MS,
  FEATHER_CAP,
  FEATHER_CONE_DEG,
  FEATHER_LIFE_MS,
  FEATHER_MAX,
  FEATHER_MIN,
  FEATHER_SPEED,
  FLARE_DIST,
  FLARE_FAST_FACTOR,
  FLIP_SPEED_GUARD,
  FLOCK_ORDER,
  FOOT_FRAC,
  GLIDE_OVERHEAD,
  H1_REJECT_DIST,
  HOVER_DECAY,
  LOGO_PERCH_FRACS,
  MIN_BOUNCE_NORM,
  MIN_PICK_DIST,
  LAUNCH_GRACE_MS,
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
  POOL_CELL_MAX_PX,
  POOL_CELL_MIN_PX,
  POOL_CLEAR_RADIUS,
  POOL_COLS,
  POOL_EDGE_INSET,
  POOL_ROWS,
  POOL_SAMPLE_N,
  PERSONALITIES,
  ROUTE_MIN_CLEARANCE,
  ROUTE_MAX_LEGS,
  ROUTE_WP_NEAR,
  ROUTE_WP_FAR,
  ROUTE_TURN_COST,
  ROUTE_TURN_COS,
  ROUTE_FINAL_CLEAR,
  ROUTE_WP_ARRIVE,
  ESCAPE_MS,
  ESCAPE_OUT_DIST,
  ESCAPE_SPEED_MUL,
  ESCAPED_PAD_REJECT_MS,
  STEER_DEADBAND,
  STEER_DEADBAND_MUL,
  STEER_SETOUT,
  RAM_CLEAR_DIST,
  RAM_FAR_PICK,
  RAM_MAX_MS,
  RAM_MIN_MS,
  RAM_WINDOW_MS,
  REPULSION_PAD,
  ROUTING_PAD_EXTRA,
  ROUTE_CORNER_DIST,
  ROUTE_CORNER_FRAMES,
  ROUTE_CORNER_MOVE,
  ROUTE_PAIR_LIMIT,
  ROUTE_POP_RADIUS,
  ROUTE_WP_RING,
  ROUTE_WP_STEP,
  STUCK_FRAMES,
  START_SLOTS,
  TARGET_ARRIVE_RADIUS,
  TAKEOFF_START_SPEED,
  ZONE_WEIGHTS,
  clamp,
  clampMag,
  isReducedMotion,
  lerpAngle,
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
            // Letter-level obstacle field; falls back to per-line rects
            // until the glyph measure has landed.
            glyphs:
              Array.isArray(m.headlineGlyphs) && m.headlineGlyphs.length
                ? m.headlineGlyphs
                : m.headlineRects,
          }
        : null
      // perchSrc: breakpoint perch points from the first rendered line (no
      // points until the headline has measurable lines — birds keep flying
      // and perching retries instead).
      return {
        w: m.heroW,
        h: m.heroH,
        h1,
        capTrim: m.capTrim,
        rawLineTop: m.rawFirstLineTop,
        elTop: m.headlineElTop,
        logo: m.logoRect,
        buttons: Array.isArray(m.buttonRects) ? m.buttonRects : [],
        // Unified obstacle pads (task step 2): every headline glyph/logo/
        // button/hero-edge with tight colRects and expanded routeRects.
        // pathBlocked/makeRoute/routingPadEdgeVec iterate this set; the
        // integration-loop sweep keeps its tight per-kind rects.
        pads: Array.isArray(m.obstaclePads) ? m.obstaclePads : [],
        perchSrc: m.perchPoints,
      }
    }

    const geom0 = geom()
    if (!geom0 || geom0.w <= 0 || geom0.h <= 0) return undefined
    const W0 = Math.max(geom0.w, 320)
    const H0 = Math.max(geom0.h, 240)
    const now0 = performance.now()
    const params = new URLSearchParams(window.location.search)
    const dbgOn = params.has('birds-debug')
    const gridMode = params.get('birds-route') === 'grid'
    // Measurement kill switch: ?birds-rams=off disables the scripted ramming
    // choreography entirely (both routing arms), so A/B captures compare
    // pure routing. Default stays ON in normal use.
    const ramsOff = params.get('birds-rams') === 'off'

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
        dizzyUntil: 0, // post-crash dizzy hold (bounce → dizzy → immunity)
        crashImmuneUntil: 0, // crash-immunity window end (0 = no immunity)
        immuneFlights: 0, // straight-line flights completed this window
        legImmune: false, // the CURRENT target is a committed immune leg
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
      for (const line of g.h1.glyphs) {
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
      for (const line of g.h1.glyphs) {
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

    // ---- proactive routing: valid-target pool + sight-line routes -----------
    // Replaces random sampling + reactive bounce (rewrite steps 4a-4d).
    // A discrete pool of obstacle-cleared lattice cells is rebuilt per metric
    // refresh, zoned and weighted; a pick samples the pool, generates the
    // shortest sight-line-cleared route (direct, or around the FIRST blocker
    // via 1-2 ring waypoints), and only commits when every leg is clear.
    // Collision becomes rare: routes never cross a solid box, so the sweep
    // only fires on world changes or genuine overshoot.

    // Minimum clearance to the nearest obstacle surface (headline keep-outs
    // at their sweep pads, solid logo/buttons raw). Feeds the crash-immunity
    // clearance filter and ram arming.
    const minDistToObstacles = (g, x, y) => {
      let min = Infinity
      for (const p of g.pads) {
        if (p.kind === 'edge') continue
        const d = distToRect(x, y, p.routeRect)
        if (d < min) min = d
      }
      return min
    }

    // Nearest ROUTING pad edge from (x, y): every obstacle swept with the
    // bird's collision pad PLUS ROUTING_PAD_EXTRA (text adds the keep-out
    // pad too). Returns { d, nx, ny } — signed distance to the pad boundary
    // (POSITIVE outside, NEGATIVE inside) and the unit vector pointing INTO
    // the pad (toward the obstacle). Outside, that vector points at the
    // boundary point; inside, it points at the nearest face's inward normal.
    // Feeds the steering deadband — a validated route passes through real
    // clearance and should never enter the pad at all; if it does (overshoot
    // or a collision push-in), chase-direction corrections are dampened
    // there instead of shoving deeper, while outward escape corrections
    // keep full strength (no wall-drag).
    const routingPadEdgeVec = (b, g, x, y) => {
      const ex = b.cfg.size * BIRD_HALF_W_FRAC + 2
      const ey = b.cfg.size * BIRD_HALF_H_FRAC + 2
      let best = { d: Infinity, nx: 0, ny: 0, id: null }
      let inside = null // deepest inside-probe: { depth, nx, ny, id } (inward normal)
      const probe = (r, id) => {
        const L = r.left - ex
        const R = r.right + ex
        const T = r.top - ey
        const B = r.bottom + ey
        const cx = clamp(x, L, R)
        const cy = clamp(y, T, B)
        const dx = cx - x
        const dy = cy - y
        const d = Math.hypot(dx, dy)
        if (d > 0.0001) {
          if (d < best.d) best = { d, nx: dx / d, ny: dy / d }
        } else if (x >= L && x <= R && y >= T && y <= B) {
          // inside the swept rect: depth to the nearest face + its INWARD normal
          const dL = x - L
          const dR = R - x
          const dT = y - T
          const dB = B - y
          const depth = Math.min(dL, dR, dT, dB)
          if (!inside || depth < inside.depth) {
            // INTO the pad = toward the obstacle: nearest face LEFT → the
            // obstacle core is to the bird's RIGHT (+x), face RIGHT → −x,
            // face TOP → +y, face BOTTOM → −y (left/top/bottom/right of the
            // pad's face list maps to l/r/t/b signs below).
            inside =
              depth === dL
                ? { depth, nx: 1, ny: 0, id: id }
                : depth === dR
                  ? { depth, nx: -1, ny: 0, id: id }
                  : depth === dT
                    ? { depth, nx: 0, ny: 1, id: id }
                    : { depth, nx: 0, ny: -1, id: id }
          }
        }
      }
      for (const p of g.pads) probe(p.routeRect, p.id)
      return inside
        ? { d: -inside.depth, nx: inside.nx, ny: inside.ny, id: inside.id }
        : best
    }

    // Sight-line test: the WHOLE segment vs EVERY pad in the unified
    // obstaclePads set (headline glyphs + full-height logo + every button +
    // hero edge pads), each at its routing view (routeRect: tight rect +
    // ROUTING_PAD_EXTRA; the logo's routeRect is the FULL element rect).
    // skipIds = pads the caller explicitly excludes (the planner recursing
    // around a ring waypoint of pad P); avoidIds = recently-escaped pads —
    // any leg crossing one is BLOCKED so routes back through it are
    // rejected, never re-planned through it.
    const pathBlocked = (g, x0, y0, x1, y1, padX, padY, skipIds, avoidIds) => {
      for (const p of g.pads) {
        if (skipIds && skipIds.has(p.id)) continue
        if (avoidIds && avoidIds.has(p.id)) return true
        if (sweepSegmentVsRect(x0, y0, x1, y1, p.routeRect, padX, padY))
          return true
      }
      return false
    }

    // Final-leg safety zone (task step 4): the terminal leg must clear every
    // non-edge routing pad edge by ROUTE_FINAL_CLEAR — targets hugging an
    // obstacle (the stuck-on-button / stuck-on-logo-bottom pattern) are
    // rejected instead of approached. Edge pads are exempt: pool targets
    // legitimately sit near a hero edge.
    const finalLegViolatingPad = (g, x0, y0, x1, y1, padX, padY) => {
      for (const p of g.pads) {
        if (p.kind === 'edge') continue
        if (
          sweepSegmentVsRect(
            x0,
            y0,
            x1,
            y1,
            p.routeRect,
            padX + ROUTE_FINAL_CLEAR,
            padY + ROUTE_FINAL_CLEAR
          )
        )
          return p
      }
      return null
    }

    const routePadXY = (b) => ({
      px: b.cfg.size * BIRD_HALF_W_FRAC + 2 + ROUTING_PAD_EXTRA,
      py: b.cfg.size * BIRD_HALF_H_FRAC + 2 + ROUTING_PAD_EXTRA,
    })

    // First blocker along the segment (lowest sweep-entry t). Edge pads are
    // never detoured around — a transit leg crossing an edge band is simply
    // rejected (the candidate dies), matching “routes near the edge are
    // rejected”.
    const firstBlocker = (g, x0, y0, x1, y1, padX, padY, skipIds, avoidIds) => {
      let blocker = null
      for (const p of g.pads) {
        if (p.kind === 'edge') continue
        if (skipIds && skipIds.has(p.id)) continue
        if (avoidIds && avoidIds.has(p.id)) continue
        const h = sweepSegmentVsRect(x0, y0, x1, y1, p.routeRect, padX, padY)
        if (h && (!blocker || h.t < blocker.h.t)) blocker = { h, pad: p }
      }
      return blocker
    }

    // Detour waypoints for one pad: near ring (8 dirs, radius half diagonal
    // + ROUTE_WP_NEAR) + far ring (4 cardinals, + ROUTE_WP_FAR), cleaned out
    // of the padded pad box, deduped, sorted by detour chord length.
    const detourWps = (b, g, pad, fx, fy, tx, ty) => {
      const r = pad.routeRect
      const cx = (r.left + r.right) / 2
      const cy = (r.top + r.bottom) / 2
      const near = Math.max(r.right - r.left, r.bottom - r.top) / 2 + ROUTE_WP_NEAR
      const far = near + ROUTE_WP_FAR
      const list = []
      for (let k = 0; k < 8; k++) {
        const a = (Math.PI / 4) * k
        list.push(cleanWp(b, g, r, cx + Math.cos(a) * near, cy + Math.sin(a) * near))
      }
      for (let k = 0; k < 4; k++) {
        const a = (Math.PI / 2) * k
        list.push(cleanWp(b, g, r, cx + Math.cos(a) * far, cy + Math.sin(a) * far))
      }
      const seen = new Set()
      const wps = []
      for (const w of list) {
        const key = `${w.x},${w.y}`
        if (seen.has(key)) continue
        seen.add(key)
        if (Math.hypot(w.x - fx, w.y - fy) <= 12) continue
        if (Math.hypot(w.x - tx, w.y - ty) <= 12) continue
        wps.push(w)
      }
      wps.sort(
        (p, q) =>
          Math.hypot(p.x - fx, p.y - fy) +
          Math.hypot(p.x - tx, p.y - ty) -
          (Math.hypot(q.x - fx, q.y - fy) + Math.hypot(q.x - tx, q.y - ty))
      )
      return wps
    }

    const routeScore = (fx, fy, pts) => {
      let len = 0
      let turns = 0
      let prevX = fx
      let prevY = fy
      let legX = 0
      let legY = 0
      for (let k = 0; k < pts.length; k++) {
        const px = pts[k].x - prevX
        const py = pts[k].y - prevY
        len += Math.hypot(px, py)
        if (k >= 1) {
          const denom = Math.max(1e-6, Math.hypot(legX, legY) * Math.hypot(px, py))
          if ((legX * px + legY * py) / denom < ROUTE_TURN_COS) turns++
        }
        legX = px
        legY = py
        prevX = pts[k].x
        prevY = pts[k].y
      }
      return { len, turns, score: len + ROUTE_TURN_COST * turns }
    }

    const planRoute = (b, g, fx, fy, tx, ty, depth, skipIds, avoidIds, isFinal) => {
      const { px, py } = routePadXY(b)
      if (!pathBlocked(g, fx, fy, tx, ty, px, py, skipIds, avoidIds)) {
        const v = isFinal
          ? finalLegViolatingPad(g, fx, fy, tx, ty, px, py)
          : null
        if (!v) return [{ x: tx, y: ty }]
        // Final leg violates the ROUTE_FINAL_CLEAR zone: try to insert ONE
        // more waypoint (a ring point of the violating pad) that restores
        // full clearance; nothing valid → reject this target (null).
        if (depth > 0) {
          for (const w of detourWps(b, g, v, fx, fy, tx, ty).slice(0, 4)) {
            if (
              !pathBlocked(g, fx, fy, w.x, w.y, px, py, null, avoidIds) &&
              !pathBlocked(g, w.x, w.y, tx, ty, px, py, null, avoidIds) &&
              !finalLegViolatingPad(g, w.x, w.y, tx, ty, px, py)
            ) {
              return [{ x: w.x, y: w.y }, { x: tx, y: ty }]
            }
          }
        }
        return null
      }
      if (depth <= 0) return null
      const blocker = firstBlocker(g, fx, fy, tx, ty, px, py, skipIds, avoidIds)
      if (!blocker) return null
      const P = blocker.pad
      const skipP = new Set(skipIds)
      skipP.add(P.id)
      // Skip-pad semantics: the from→W leg is excluded from pad P so ring
      // candidates beside P are reachable; the W→to leg re-includes every
      // pad (P honoured again downstream).
      let best = null
      let bestScore = Infinity
      for (const w of detourWps(b, g, P, fx, fy, tx, ty).slice(0, 6)) {
        const A = planRoute(b, g, fx, fy, w.x, w.y, depth - 1, skipP, avoidIds, false)
        if (!A) continue
        const B = planRoute(b, g, w.x, w.y, tx, ty, depth - 1, null, avoidIds, isFinal)
        if (!B) continue
        const combined = [...A, ...B]
        if (combined.length > ROUTE_MAX_LEGS) continue
        const { score } = routeScore(fx, fy, combined)
        if (score < bestScore) {
          bestScore = score
          best = combined
        }
      }
      return best
    }

    const zoneOf = (g, x, y) => {
      const btnTop = g.buttons.length
        ? Math.min(...g.buttons.map((r) => r.top))
        : Infinity
      const btnBottom = g.buttons.length
        ? Math.max(...g.buttons.map((r) => r.bottom))
        : -Infinity
      if (y < g.h * 0.12) return 'top-band'
      if (g.h1 && y < g.h1.top - 6) return 'above-headline'
      if (!g.h1 && y < g.h * 0.45) return 'top-band'
      if (y > g.h * 0.9 || y > btnBottom + 12) return 'bottom-band'
      if (g.h1 && y > g.h1.bottom + 6 && y < btnTop - 12) return 'below-headline'
      if (x < g.w * 0.18) return 'left-margin'
      if (x > g.w * 0.82) return 'right-margin'
      return 'center-open'
    }

    // 4a: the valid-target pool — obstacle-cleared lattice centers, zoned and
    // weighted (ZONE_WEIGHTS). Rebuilt per metric refresh; never per frame.
    let targetPool = []
    // Task step 5: pads a bird recently escaped from — routes that cross
    // them are rejected by pickTarget for ESCAPED_PAD_REJECT_MS. Map of
    // pad id → reject-until timestamp; purged on every pick.
    const escapedPads = new Map()
    const buildPool = (g) => {
      if (!g || g.w <= 0 || g.h <= 0) {
        targetPool = []
        return
      }
      const interiorW = Math.max(1, g.w - 2 * POOL_EDGE_INSET)
      const interiorH = Math.max(1, g.h - 2 * POOL_EDGE_INSET)
      // ~20x15 lattice at desktop proportions; cells clamp to 30-60px so a
      // narrow mobile hero keeps its ~30px resolution with a smaller lattice.
      const cellW = clamp(interiorW / POOL_COLS, POOL_CELL_MIN_PX, POOL_CELL_MAX_PX)
      const cellH = clamp(interiorH / POOL_ROWS, POOL_CELL_MIN_PX, POOL_CELL_MAX_PX)
      const colsN = Math.max(1, Math.floor(interiorW / cellW))
      const rowsN = Math.max(1, Math.floor(interiorH / cellH))
      const x0 = POOL_EDGE_INSET + (interiorW - (colsN - 1) * cellW) / 2
      const y0 = POOL_EDGE_INSET + (interiorH - (rowsN - 1) * cellH) / 2
      const obs = []
      // Pool cells must clear the ROUTING pads (not just the tight rects):
      // a target inside an obstacle's routing view can never satisfy the
      // planner's final-leg clearance, so it would only waste picks.
      for (const p of g.pads) {
        if (p.kind === 'edge') continue
        obs.push(p.routeRect)
      }
      const list = []
      for (let r = 0; r < rowsN; r++) {
        for (let c = 0; c < colsN; c++) {
          const x = Math.round(x0 + c * cellW)
          const y = Math.round(y0 + r * cellH)
          if (obs.some((o) => distToRect(x, y, o) < POOL_CLEAR_RADIUS)) continue
          const zone = zoneOf(g, x, y)
          list.push({ x, y, zone, weight: ZONE_WEIGHTS[zone] ?? 1 })
        }
      }
      targetPool = list
    }

    // 4e: weighted draws from the pool (roulette by zone weight).
    const samplePool = (n) => {
      let total = 0
      for (const t of targetPool) total += t.weight
      const out = []
      const k = Math.min(n, targetPool.length)
      while (out.length < k && total > 0) {
        let roll = Math.random() * total
        let pick = null
        for (const t of targetPool) {
          roll -= t.weight
          if (roll <= 0) {
            pick = t
            break
          }
        }
        if (pick) out.push(pick)
        else break
      }
      return out
    }

    // Push a candidate waypoint out of an obstacle's padded box (nearest face
    // + step). Needed because center ± ROUTE_WP_RING lands inside elongated
    // obstacles like headline lines — those candidates slide to the nearest
    // face instead of dying.
    const cleanWp = (b, g, rect, x, y) => {
      const padX = b.cfg.size * BIRD_HALF_W_FRAC + ROUTE_WP_STEP + ROUTING_PAD_EXTRA
      const padY = b.cfg.size * BIRD_HALF_H_FRAC + ROUTE_WP_STEP + ROUTING_PAD_EXTRA
      const L = rect.left - padX
      const R = rect.right + padX
      const T = rect.top - padY
      const B = rect.bottom + padY
      let px = clamp(x, 8, Math.max(8, g.w - 8))
      let py = clamp(y, 8, Math.max(8, g.h - 8))
      if (px > L && px < R && py > T && py < B) {
        const dL = px - L
        const dR = R - px
        const dT = py - T
        const dB = B - py
        const m = Math.min(dL, dR, dT, dB)
        if (m === dL) px = L - 2
        else if (m === dR) px = R + 2
        else if (m === dT) py = T - 2
        else py = B + 2
      }
      return { x: Math.round(px), y: Math.round(py) }
    }

    // ---- grid A* routing ( ?birds-route=grid ) ----------------------------
    // The grid is built lazily from the same obstaclePads the sweep uses,
    // keyed by hero size + pad rects so it rebuilds only on a real layout
    // change. Nav margins shrink on narrow heroes so corridors survive.
    let navGrid = null
    let navKey = ''
    const navStats = []
    if (dbgOn) window.__birdNav = navStats
    const navGridFor = (g) => {
      if (!g || g.w <= 0 || g.h <= 0) return null
      const margin = g.w < 640 ? GRID_MARGIN_MOBILE : GRID_MARGIN
      const spriteHalf =
        Math.max(...birds.map((b) => b.cfg.size)) * BIRD_HALF_W_FRAC
      const key = `${g.w.toFixed(0)}x${g.h.toFixed(0)}|${margin}|${g.pads
        .map((p) => {
          const r = p.colRect || p.routeRect
          return `${p.id}:${r.left.toFixed(0)},${r.top.toFixed(0)},${r.right.toFixed(0)},${r.bottom.toFixed(0)}`
        })
        .join('|')}`
      if (navGrid && key === navKey) return navGrid
      navGrid = buildNavGrid({
        width: g.w,
        height: g.h,
        pads: g.pads,
        spriteHalf,
        margin,
      })
      navKey = key
      if (dbgOn) {
        const st = gridStats(navGrid)
        const probes = testNavRoutes(navGrid)
        const ok = probes.filter((p) => p.ok).length
        console.info(
          `[bird-diag] navgrid cells=${st.cells} blocked=${st.blockedPct.toFixed(1)}% margin=${margin} half=${spriteHalf.toFixed(1)} routes=${ok}/3` +
            ` ms=${probes.map((p) => (p.ok ? p.ms.toFixed(1) : 'x')).join(',')}`
        )
        // Verification handles: read the grid probe + stats from outside.
        window.__birdGrid = navGrid
        window.__birdGridProbe = { stats: st, margin, routes: probes }
      }
      return navGrid
    }

    const gridRoute = (b, g, target) => {
      const grid = navGridFor(g)
      if (!grid) return null
      // Latency covers failures too (a hung A* is the risk we care about).
      const t0 = performance.now()
      const res = gridPath(grid, b.x, b.y, target.x, target.y)
      navStats.push(performance.now() - t0)
      if (navStats.length > 80) navStats.shift()
      if (!res) return null
      if (dbgOn) {
        console.info(
          `[bird-diag] gridroute bird=${b.id} pts=${res.points.length} exp=${res.expansions} ms=${res.ms.toFixed(2)}`
        )
      }
      return res.points
    }

    // 4d: route generation — the multi-leg planner. Every candidate route
    // is sweep-tested against the unified obstaclePads; the terminal leg is
    // additionally held to the ROUTE_FINAL_CLEAR safety zone; routes are
    // scored (total length + turn penalty) and the best up to ROUTE_MAX_LEGS
    // legs wins. Escaped pads (avoidIds) block any crossing leg, so a target
    // whose route crosses one is rejected rather than re-planned through it.
    const makeRoute = (b, g, target, avoidIds) => {
      if (gridMode) {
        const pts = gridRoute(b, g, target)
        if (!pts) return null
        // Escaped-pad policy: a grid path that crosses a recently escaped
        // pad is rejected so the bird leaves the pocket instead of looping
        // straight back into it.
        if (avoidIds && avoidIds.size) {
          const { px, py } = routePadXY(b)
          for (const p of g.pads) {
            if (!avoidIds.has(p.id)) continue
            let fx = b.x
            let fy = b.y
            for (const pt of pts) {
              if (
                sweepSegmentVsRect(fx, fy, pt.x, pt.y, p.routeRect, px, py)
              ) {
                return null
              }
              fx = pt.x
              fy = pt.y
            }
          }
        }
        return pts
      }
      const route = planRoute(
        b,
        g,
        b.x,
        b.y,
        target.x,
        target.y,
        ROUTE_MAX_LEGS,
        null,
        avoidIds,
        true
      )
      if (route && dbgOn) {
        const s = routeScore(b.x, b.y, route)
        console.info(
          `[bird-diag] route bird=${b.id} from=(${b.x.toFixed(0)},${b.y.toFixed(0)}) to=(${target.x.toFixed(0)},${target.y.toFixed(0)}) legs=${route.length} len=${s.len.toFixed(0)} turns=${s.turns} score=${s.score.toFixed(0)}`
        )
      }
      return route
    }

    const hoverFall = (b, now) => {
      // No immediately viable route: brief hover with fresh samples on the
      // throttled retry (pickTarget's repick window gates the churn). NOT an
      // immune leg: a hover target completes instantly, so it must never
      // count toward the two-flight immunity expiry.
      //
      // Pad-escape lift: an in-place target from INSIDE the routing pad
      // (post-crash pocket, bounce park-back, ram end) produces ZERO
      // progress — wedged-escape then re-picks from the same wall position
      // every 1.2s while every straight leg from that face is pad-blocked,
      // so the mill never opens. The hover target is instead lifted
      // STEER_SETOUT + 6px past the pad edge (0.8px/frame escape) along the
      // nearest face's OUTWARD normal; a bird already clear of the pad
      // keeps the plain in-place hover.
      b.waypointQueue = []
      b.legImmune = false
      b.gridPath = null
      b.gridGoal = null
      // Lift direction: the nearest-face outward normal is only the FIRST
      // candidate — if it points into a second pad (corner wedges), the lift
      // target lands in a blocked cell and the bird stays stuck. Scan 8
      // directions (primary normal first, then cardinals + diagonals) and
      // pick the first whose escape position is free of every routing pad
      // by the bird's half-extent. Last resort: the plain one-coordinate
      // override; the throttled re-pick re-tries rather than wedging.
      const g = geom()
      const edge = routingPadEdgeVec(b, g, b.x, b.y)
      const need = STEER_SETOUT + 6
      const fhw = b.cfg.size * BIRD_HALF_W_FRAC + ROUTING_PAD_EXTRA
      const fhh = b.cfg.size * BIRD_HALF_H_FRAC + ROUTING_PAD_EXTRA
      const freeAt = (ex, ey) => {
        if (ex < fhw || ey < fhh || ex > g.w - fhw || ey > g.h - fhh) return false
        for (const p of g.pads) {
          if (ex > p.routeRect.left - fhw && ex < p.routeRect.right + fhw &&
              ey > p.routeRect.top - fhh && ey < p.routeRect.bottom + fhh) {
            return false
          }
        }
        return true
      }
      const dirs = []
      if (edge.d < need) dirs.push({ x: -edge.nx, y: -edge.ny })
      dirs.push(
        { x: 0, y: -1 }, { x: 1, y: 0 }, { x: 0, y: 1 }, { x: -1, y: 0 },
        { x: 0.7071, y: -0.7071 }, { x: 0.7071, y: 0.7071 },
        { x: -0.7071, y: 0.7071 }, { x: -0.7071, y: -0.7071 }
      )
      let slug = null
      for (const d of dirs) {
        const ex = b.x + d.x * need
        const ey = b.y + d.y * need
        if (freeAt(ex, ey)) {
          slug = { x: b.x + d.x * (need + 6), y: b.y + d.y * (need + 6) }
          break
        }
      }
      if (!slug) {
        slug = edge.d < need
          ? { x: b.x - edge.nx * need, y: b.y - edge.ny * need }
          : { x: b.x, y: b.y }
      }
      b.target = slug
      b.repickHoldUntil = now + 400
    }

    // RP: pool-picked route. The old weighted-thirds sampler with rejection
    // and subroutes is fully replaced — every target now comes from the
    // obstacle-cleared pool with a sight-line-valid route.
    const pickTarget = (b, g, now) => {
      b.pickCount = (b.pickCount || 0) + 1
      b._pickVersion = (b._pickVersion || 0) + 1
      // Escaped-pad reject list: drop expired entries, keep live ones as
      // the planner's avoidIds (routes crossing them are rejected).
      let avoidIds = null
      if (escapedPads.size) {
        for (const [pid, until] of escapedPads) {
          if (until <= now) escapedPads.delete(pid)
          else {
            if (!avoidIds) avoidIds = new Set()
            avoidIds.add(pid)
          }
        }
      }

    // Patrol trigger: every 4th target selection (~25%) starts a loop —
    // but only in 'flying' and never while committed to a perch; if the
    // startPatrol geometry check fails, normal selection falls through.
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
    // Throttled hover fallback: a pick that found no route re-samples after a
    // short hold instead of churning 30 route tests per frame.
    if (now < (b.repickHoldUntil || 0)) return
    if (!targetPool.length) buildPool(g)
    if (!targetPool.length) {
      hoverFall(b, now)
      return
    }
    // Weighted samples, deduped, route-tested weight-desc: the first
    // routeable candidate is by construction the highest-weight routeable one
    // (4e).
    const uniq = [...new Set(samplePool(POOL_SAMPLE_N))]
    const cands = uniq.filter(
      (t) => Math.hypot(t.x - b.x, t.y - b.y) >= MIN_PICK_DIST
    )
    cands.sort((p, q) => q.weight - p.weight)
    // Crash immunity: while active, a target is crash-safe ONLY if its
    // route is a single straight sight line (no waypoints, no corner turns)
    // AND it clears every obstacle edge by ROUTE_MIN_CLEARANCE. Anything
    // else is refused — the picker will not route into a crash during the
    // window (scripted ramming is suspended separately in steer). No safe
    // target → the existing hover-fall retry keeps the bird drifting in
    // place until airspace opens up.
    const immune = now < b.crashImmuneUntil
    for (const c of cands) {
      if (immune && minDistToObstacles(g, c.x, c.y) < ROUTE_MIN_CLEARANCE) {
        continue
      }
      const route = makeRoute(b, g, c, avoidIds)
      // Crash-safe pick: legacy measures the leg count (one straight leg);
      // grid mode asks the same question of the grid — a direct sight line
      // with two cells of clearance.
      const immuneDirect =
        immune && route
          ? gridMode
            ? (() => {
                const grid = navGridFor(g)
                return (
                  !!grid && gridLineClear(grid, b.x, b.y, c.x, c.y, 16)
                )
              })()
            : route.length === 1
          : false
      if (route && (!immune || immuneDirect)) {
        b.target = route[0]
        b.waypointQueue = route.slice(1)
        if (gridMode) {
          // Pure-pursuit polyline: pursueGrid() projects onto it each frame
          // and steers at a 50px lookahead point.
          b.gridPath = [{ x: b.x, y: b.y }, ...route]
          b.gridGoal = { x: c.x, y: c.y }
          b.gridIdx = 0
          b.gridReplanAt = 0
        } else {
          b.gridPath = null
          b.gridGoal = null
        }
        // Straight-leg marker: only a committed immune pick completes a
        // crash-free flight (hover fallbacks don't count).
        b.legImmune = immune
        if (dbgOn && immune) {
          console.info(
            `[bird-diag] immune pick ${b.id} flight=${b.immuneFlights + 1}/${CRASH_IMMUNE_FLIGHTS} legs=1 clear=${minDistToObstacles(g, c.x, c.y).toFixed(0)}px`
          )
        }
        return
      }
    }
    hoverFall(b, now)
  }

    // ---- grid pure-pursuit follower ----------------------------------------
    // Projects the bird onto its planned polyline, steers at a 50px lookahead
    // point, and re-plans when it drifts >46px off the corridor or the route
    // has gone stale. Returns the next target, 'arrived', or null when there
    // is nothing to follow.
    const pursueGrid = (b, g, now) => {
      const path = b.gridPath
      if (!path || path.length < 2) return null
      let bestD2 = Infinity
      let bestSeg = 1
      let px = b.x
      let py = b.y
      for (let k = 1; k < path.length; k++) {
        const a = path[k - 1]
        const c = path[k]
        const vx = c.x - a.x
        const vy = c.y - a.y
        const len2 = vx * vx + vy * vy || 1
        const tt = clamp(((b.x - a.x) * vx + (b.y - a.y) * vy) / len2, 0, 1)
        const qx = a.x + vx * tt
        const qy = a.y + vy * tt
        const d2 = (b.x - qx) ** 2 + (b.y - qy) ** 2
        if (d2 < bestD2) {
          bestD2 = d2
          bestSeg = k
          px = qx
          py = qy
        }
      }
      const goal = path[path.length - 1]
      const toGoalX = goal.x - b.x
      const toGoalY = goal.y - b.y
      const goalDist = Math.hypot(toGoalX, toGoalY)
      if (
        goalDist < TARGET_ARRIVE_RADIUS &&
        b.vx * toGoalX + b.vy * toGoalY >= 0
      ) {
        return 'arrived'
      }
      if (Math.sqrt(bestD2) > 46 && now > (b.gridReplanAt || 0) + 1500) {
        b.gridReplanAt = now
        const replanned = makeRoute(b, g, b.gridGoal || goal, null)
        if (replanned) {
          b.gridPath = [{ x: b.x, y: b.y }, ...replanned]
          b.gridGoal = b.gridGoal || { x: goal.x, y: goal.y }
        } else {
          b.gridPath = null
          b.gridGoal = null
          b.waypointQueue = []
          return 'arrived'
        }
      }
      // Lookahead along the polyline from the projection. 50px is the
      // turn-radius-friendly compromise — but a lookahead that walks PAST a
      // sharp vertex makes the bird chord-cut the corner, which is how the
      // glyph wall got grazed. Corner clamp: when the walk would carry
      // `remain` beyond a vertex whose turn is sharper than 45°
      // (dot(dirBefore, dirAfter) < cos 45°), the lookahead stops AT that
      // vertex; the bird steers directly at the corner until it is crossed,
      // i.e. it turns ON the corner instead of cutting through it. Gentle
      // curves (<45°) still smooth-path.
      let remain = 50
      let cur = { x: px, y: py }
      for (let k = Math.max(1, bestSeg); k < b.gridPath.length; k++) {
        const c = b.gridPath[k]
        const dx = c.x - cur.x
        const dy = c.y - cur.y
        const d = Math.hypot(dx, dy)
        if (d >= remain) {
          const tt = remain / d
          cur = { x: cur.x + dx * tt, y: cur.y + dy * tt }
          break
        }
        remain -= d
        cur = { x: c.x, y: c.y }
        // About to cross vertex c into segment k → k+1: measure the turn.
        const n = b.gridPath[k + 1]
        if (!n) break
        const prev = b.gridPath[k - 1]
        const ix = c.x - prev.x
        const iy = c.y - prev.y
        const ox = n.x - c.x
        const oy = n.y - c.y
        const dot =
          (ix * ox + iy * oy) /
          ((Math.hypot(ix, iy) || 1) * (Math.hypot(ox, oy) || 1))
        if (dot < Math.SQRT1_2) {
          // ≥45° turn: steer AT the vertex for the duration of the turn.
          cur = { x: c.x, y: c.y }
          break
        }
      }
      b.gridIdx = bestSeg
      return cur
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
      // Only write a class when its boolean actually flips: the old code
      // toggled ~10 classes per bird per frame, invalidating style for no
      // visual change.
      const setCls = (el, name, on) => {
        if (el && el.classList.contains(name) !== on) el.classList.toggle(name, on)
      }
      host.dataset.state = b.state

      const flying = b.state === 'flying' || b.state === 'arriving'
      // Glider spreads its wings during the perch descent instead of flapping.
      const gliding = b.key === 'glider' && b.state === 'arriving'
      const inFlyingPose = b.state === 'flying' || b.state === 'arriving'
      // Post-crash dizzy: slow in-place wobble, wings folded, stars orbiting
      // (the star spans themselves live on the host via dizzyStars).
      const nowDizzy = !!b.dizzyUntil && now < b.dizzyUntil
      setCls(host, 'is-dizzy', nowDizzy)
      // Bounce choreography: the host wrapper carries ONE of the three phase
      // classes (is-impacting / is-confused / is-recovering), derived per
      // frame from recoil.start — no setTimeout chain, so RAF suspension
      // can't desync the phases; keyframes run on the sprite so the per-frame
      // transform on the host stays intact.
      const recoilPhase = b.recoil ? now - b.recoil.start : Infinity
      setCls(
        host,
        'is-impacting',
        inFlyingPose && b.recoil !== null && recoilPhase < RECOIL_IMPACT_MS
      )
      setCls(
        host,
        'is-confused',
        inFlyingPose && b.recoil !== null && recoilPhase >= RECOIL_IMPACT_MS && recoilPhase < RECOIL_HOLD_END_MS
      )
      setCls(
        host,
        'is-recovering',
        inFlyingPose && b.recoil !== null && recoilPhase >= RECOIL_HOLD_END_MS && recoilPhase < RECOIL_END_MS
      )
      if (fly) {
        setCls(fly, 'is-flapping', flying && !reduced && !gliding && !nowDizzy)
        setCls(fly, 'hidden', b.state === 'perched')
        setCls(fly, 'pdd-glide-pose', gliding)
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
        setCls(perched, 'hidden', b.state !== 'perched')
        const landed = b.state === 'perched'
        const idleActive = landed && now < b.idleUntil
        setCls(perched, 'pdd-land-flare', landed && now < b.flareUntil)
        setCls(perched, 'pdd-idle-tilt', idleActive && b.idleKind === 0)
        setCls(perched, 'pdd-idle-flick', idleActive && b.idleKind === 1)
        setCls(perched, 'pdd-idle-ruffle', idleActive && b.idleKind === 2)
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
        if (nowDizzy) {
          // Dizzy wobble: ±DIZZY_WOBBLE_DEG at DIZZY_WOBBLE_HZ around the
          // held heading — no bank smoothing (velocity is zero anyway), and
          // the smoothed bank is left stale so it re-eases post-dizzy.
          const wob =
            DIZZY_WOBBLE_DEG * Math.sin(now * 0.001 * Math.PI * 2 * DIZZY_WOBBLE_HZ)
          host.style.transform =
            `translate(${b.x.toFixed(1)}px, ${b.y.toFixed(1)}px) rotate(${wob.toFixed(1)}deg)` +
            (b.facing === -1 ? ' scaleX(-1)' : '')
          return
        }
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
    // Exact segment-vs-rect: the slab sweep (defined above) instead of 20
    // point samples — a long jump segment can hop over a small SAMPLED gap
    // between points but a letter-sized rect always intersects or not,
    // deterministically.
    const crossesH1 = (x1, y1, x2, y2, r) =>
      !!sweepSegmentVsRect(x1, y1, x2, y2, r, 0, 0)

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

    // FH: facing-commit hysteresis — a flip requires |vx| above the guard
    // sustained for 6 consecutive frames. The old single-frame 0.12 check
    // flickered beak-left/beak-right whenever a bird hovered around that
    // boundary (hard-approach descent, hover dampening).
    const updateFacing = (b) => {
      if (Math.abs(b.vx) > FLIP_SPEED_GUARD) {
        b._flipRun = (b._flipRun || 0) + 1
        if (b._flipRun >= 6) {
          const f = b.vx > 0 ? 1 : -1
          if (f !== b.facing) {
            b.facing = f
            b._flipRun = 0
          }
        }
      } else {
        b._flipRun = 0
      }
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
          b.cfg.size * BIRD_HALF_W_FRAC + 2 + ROUTING_PAD_EXTRA,
          b.cfg.size * BIRD_HALF_H_FRAC + 2 + ROUTING_PAD_EXTRA
        )
      )
        return false
      if (!g.h1) return true
      return !crossesH1Lines(b.x, b.y, t.x, t.y, g, REPULSION_PAD + ROUTING_PAD_EXTRA)
    }

    // ---- post-crash dizzy (bounce → dizzy → immunity → fresh route) ----------
    // After the sticky recoil resolves, the bird holds STATIONARY for
    // DIZZY_MS: velocity zero, a slow ±DIZZY_WOBBLE_DEG wobble at
    // DIZZY_WOBBLE_HZ (renderBird), wings folded, and three star icons
    // orbiting its head — pure DOM, CSS-animated, no per-frame JS. While
    // dizzy the bird is skipped by steering, sweeps, picking, patrol and
    // ram (stationary; nothing to sweep against). When dizzy ends, crash
    // immunity opens (see pickTarget) and a fresh route is picked.
    const dizzyStars = (b, i, on) => {
      const host = hostRefs.current[i]
      if (!host) return
      const existing = host.querySelectorAll('.pdd-bird-dizzy-stars')
      if (on && existing.length === 0) {
        const wrap = document.createElement('span')
        wrap.className = 'pdd-bird-dizzy-stars'
        for (let k = 0; k < 3; k++) {
          const star = document.createElement('span')
          star.className = 'pdd-dizzy-star'
          star.textContent = '✦'
          wrap.appendChild(star)
        }
        host.appendChild(wrap)
      } else if (!on) {
        existing.forEach((el) => el.remove())
      }
    }

    const enterDizzy = (b, i, now) => {
      b.recoil = null
      b.dizzyUntil = now + DIZZY_MS
      b.vx = 0
      b.vy = 0
      // Dizzy always resumes as flying with a fresh route: an arriving
      // glide that collided releases its perch commitment.
      if (b.perchIdx >= 0) releasePerch(b)
      if (b.state === 'arriving') b.state = 'flying'
      b.hardApproach = false
      b.patrolLoop = null
      b.ramUntil = 0
      b.ramTarget = null
      b.target = null
      b.waypointQueue = []
      b.legImmune = false
      dizzyStars(b, i, true)
      if (dbgOn) {
        console.info(
          `[bird-diag] dizzy start bird=${i} t=+${Math.round(now - now0)}ms hold=${DIZZY_MS}ms wobble=±${DIZZY_WOBBLE_DEG}deg@${DIZZY_WOBBLE_HZ}Hz stars@${DIZZY_STARS_HZ}Hz`
        )
      }
    }

    const endDizzy = (b, i, now) => {
      b.dizzyUntil = 0
      dizzyStars(b, i, false)
      b.crashImmuneUntil = now + CRASH_IMMUNE_MS
      b.immuneFlights = 0
      if (dbgOn) {
        console.info(
          `[bird-diag] dizzy end bird=${i} t=+${Math.round(now - now0)}ms immunity open: 2 straight clear flights or ${CRASH_IMMUNE_MS}ms`
        )
      }
      pickTarget(b, geom(), now)
    }

    // ---- feathers ------------------------------------------------------------
    // Spawned on EVERY solid impact — logo, headline glyphs, buttons and hero
    // edges all shed a burst at the contact point. The FEATHER_CAP ceiling
    // keeps rapid crashes from running away (18 live spans max). The burst
    // direction is the reflected velocity; colour comes from the bird's
    // computed colour so each personality sheds its own tint.
    // Spawned on collision at the bird position, flying away from the impact
    // in the reflected direction ± 22°. Purely CSS-animated: initial
    // velocity + rotation are inline custom properties feeding one keyframe,
    // and animationend removes each span — no per-feather JS loop. The
    // 18-feather cap prevents runaway accumulation on rapid collisions.
    const spawnFeathers = (b, i, angle) => {
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
        const dx = Math.cos(a) * speed * frames * 0.45
        const dy = Math.sin(a) * speed * frames * 0.45 + 0.05 * frames * frames
        span.style.left = `${b.x + b.cfg.size / 2}px`
        span.style.top = `${b.y + b.cfg.size / 2}px`
        span.style.setProperty('--pdd-life', `${Math.round(life)}ms`)
        span.style.setProperty('--fdx', `${dx.toFixed(1)}px`)
        span.style.setProperty('--fdy', `${dy.toFixed(1)}px`)
        span.style.setProperty('--fstart', `${rand(-60, 60).toFixed(0)}deg`)
        span.style.setProperty('--frot', `${rand(-140, 140).toFixed(0)}deg`)
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
      // Launch grace: the bird starts standing ON a surface anchor (glyph
      // tops / logo edge). Random takeoff heading can initially graze that
      // same surface — position fixes still run every frame, but the
      // squash/feather choreography is suppressed for the launch arc so a
      // takeoff doesn't read as "bounced off the perch it just left".
      b.launchGraceUntil = now + LAUNCH_GRACE_MS
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
            !g.h1.glyphs.some(
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
          for (const line of g.h1.glyphs) {
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
      // RM: choreographed ramming — every RAM_MIN..RAM_MAX wall-ms (shortened
      // under ?birds-debug=1 so a capture witnesses a full cycle), when the
      // bird is flying, unperched, unpatrolling and clear of every obstacle
      // by RAM_CLEAR_DIST, it overrides its route for RAM_WINDOW_MS and
      // steers straight into the nearest obstacle (a random one when the
      // nearest is farther than RAM_FAR_PICK). The impact rides the normal
      // swept-collision + sticky-recoil path; when the window expires the
      // route regenerates from scratch. SUSPENDED entirely while crash
      // immunity is open — the immunity window must end with zero scripted
      // crashes; the ram timer resumes from wherever it was.
      // Real schedule in every mode: one ram per bird at most every 90s
      // (the old debug 8-15s shortcut would have broken that policy and
      // biased the A/B capture).
      const ramSched = [RAM_MIN_MS, RAM_MAX_MS]
      if (
        !ramsOff &&
        b.state === 'flying' &&
        b.perchIdx < 0 &&
        !b.patrolLoop &&
        !b.ramUntil &&
        now >= b.crashImmuneUntil
      ) {
        if (!b.nextRamAt) b.nextRamAt = now + rand(ramSched[0], ramSched[1])
        if (now >= b.nextRamAt) {
          const rects = [
            ...(g.logo ? [g.logo] : []),
            ...g.buttons,
            ...(g.h1 ? g.h1.glyphs : []),
          ]
          let clear = rects.length > 0
          for (const o of rects) {
            if (distToRect(b.x, b.y, o) < RAM_CLEAR_DIST) {
              clear = false
              break
            }
          }
          if (clear) {
            // Planned impact: aim at the face of a solid, but only after
            // the APPROACH leg (to a point 46px off that face) passes the
            // grid. The impact itself is intentionally exempt — this is a
            // choreographed moment, not an accident.
            const grid = navGridFor(g)
            const order = [...rects].sort(
              (a, c) =>
                distToRect(b.x, b.y, a) - distToRect(b.x, b.y, c)
            )
            const trial =
              order.length > 1 &&
              distToRect(b.x, b.y, order[0]) > RAM_FAR_PICK
                ? [
                    order[Math.floor(Math.random() * order.length)],
                    ...order,
                  ]
                : order
            let ready = false
            for (const o of trial) {
              const faceX = clamp(b.x, o.left, o.right)
              const faceY = clamp(b.y, o.top, o.bottom)
              const ndx = b.x - faceX
              const ndy = b.y - faceY
              const nm = Math.hypot(ndx, ndy) || 1
              const ax = faceX + (ndx / nm) * 46
              const ay = faceY + (ndy / nm) * 46
              if (grid && !gridLineClear(grid, b.x, b.y, ax, ay)) continue
              b.ramTarget = { x: faceX, y: faceY }
              b.ramUntil = now + RAM_WINDOW_MS
              b.waypointQueue = []
              b.gridPath = null
              b.gridGoal = null
              b.nextRamAt = Infinity
              ready = true
              if (dbgOn) {
                console.info(
                  `[bird-diag] ram start bird=${i} cds=${((now - (b.lastRamAt || 0)) / 1000).toFixed(0)}s target=(${faceX.toFixed(0)},${faceY.toFixed(0)}) t=+${Math.round(now - now0)}ms`
                )
              }
              b.lastRamAt = now
              break
            }
            if (!ready) b.nextRamAt = now + 3000
          } else {
            // Not clear of the obstacle field yet: retry in 2s instead of
            // abandoning the schedule.
            b.nextRamAt = now + 2000
          }
        }
      }
      if (b.ramUntil) {
        if (now < b.ramUntil && b.ramTarget) {
          b.waypointQueue = []
          b.gridPath = null
          b.gridGoal = null
          b.target = b.ramTarget
        } else {
          if (dbgOn) {
            console.info(
              `[bird-diag] ram end bird=${i} t=+${Math.round(now - now0)}ms`
            )
          }
          b.ramUntil = 0
          b.ramTarget = null
          b.nextRamAt = now + rand(ramSched[0], ramSched[1])
          pickTarget(b, g, now)
        }
      }

      // Grid route following ( ?birds-route=grid ): steer at the lookahead
      // point on the planned polyline; arrival or drift re-plans/picks.
      if (gridMode && b.gridPath && !b.patrolLoop && !b.ramUntil) {
        if (b.perchIdx >= 0 || b.state !== 'flying') {
          b.gridPath = null
          b.gridGoal = null
        } else {
          const look = pursueGrid(b, g, now)
          if (look === 'arrived') {
            b.gridPath = null
            b.gridGoal = null
            pickTarget(b, g, now)
          } else if (look) {
            b.target = look
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
            for (const line of g.h1.glyphs) {
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
          // Bounce fully resolved → the addendum dizzy hold takes over
          // (1400ms, stars, then crash immunity opens).
          enterDizzy(b, i, now)
        } else if (elapsed >= RECOIL_END_MS) {
          enterDizzy(b, i, now)
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
        updateFacing(b)
        if (dist < ARRIVE_RADIUS) {
          land(b, now)
        } else {
          b.fastFlap = dist < FLARE_DIST
          renderBird(b, i, now)
        }
        return
      }

      if (
        dist < TARGET_ARRIVE_RADIUS &&
        !b.patrolLoop &&
        !b.ramUntil &&
        !b.gridPath
      ) {
        // reached the current target (patrol targets move every frame — no
        // waypoint advancement logic may fire mid-loop)
        if (b.state === 'arriving') {
          if (dist < ARRIVE_RADIUS && Math.hypot(b.vx, b.vy) < ARRIVE_SPEED) {
            land(b, now)
            return
          }
        } else if (b.waypointQueue.length) {
          // Intermediate waypoints are reached at ROUTE_WP_ARRIVE (15px, the
          // planner's turn radius) — or already inside TARGET_ARRIVE_RADIUS
          // and still moving toward it (overshoot guard). The final queued
          // waypoint before a perch target: the glide-in begins here.
          if (dist >= ROUTE_WP_ARRIVE && (b.vx * dx + b.vy * dy) < 0) {
            renderBird(b, i, now)
            return
          }
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
          if (dot >= 0 || dist < 8) {
            // Crash immunity flight tally: only a completed straight
            // sight-line leg counts toward the two-flight expiry — a
            // hover-fall target (dist 0, completed instantly) does not.
            if (now < b.crashImmuneUntil && b.legImmune) {
              b.legImmune = false
              b.immuneFlights = (b.immuneFlights || 0) + 1
              if (b.immuneFlights >= CRASH_IMMUNE_FLIGHTS) {
                b.crashImmuneUntil = 0
                b.immuneFlights = 0
                if (dbgOn) {
                  console.info(
                    `[bird-diag] immunity cleared by flights ${b.id} t=+${Math.round(now - now0)}ms`
                  )
                }
              } else if (dbgOn) {
                console.info(
                  `[bird-diag] immunity flight complete ${b.id} n=${b.immuneFlights}/${CRASH_IMMUNE_FLIGHTS} t=+${Math.round(now - now0)}ms`
                )
              }
            }
            pickTarget(b, g, now)
          }
        }
      }

      // Speed is CONSTANT per personality (maxSpeed) on every leg — the SM
      // near-target/corner/long-leg/hazard modulation block is deleted: speed
      // comes from the route, not from proximity (the addendum's anti-rub /
      // anti-drag rule). The single exception is the final ARRIVE_SLOW_DIST
      // (60px) of a perch approach, where the existing arrival deceleration
      // still trades speed for the land condition.
      let desiredSpeed = b.cfg.maxSpeed
      if (b.state === 'arriving' && dist < ARRIVE_SLOW_DIST) {
        desiredSpeed = Math.min(b.cfg.maxSpeed, dist * ARRIVE_TERM_FACTOR)
      }
      const inv = dist > 0.0001 ? 1 / dist : 0
      let desDirX = dx * inv
      let desDirY = dy * inv
      // Curvature guard: kill speed into hard turns so the flown arc stays
      // inside the planned corridor (the old planner only validated chords).
      if (gridMode && b.gridPath) {
        const vm = Math.hypot(b.vx, b.vy)
        if (vm > 0.15 && dist > 1) {
          const dot = (b.vx * dx + b.vy * dy) / (vm * dist)
          if (dot < 0.5) desiredSpeed *= 0.6
          else if (dot < 0.8) desiredSpeed *= 0.82
        }
        // Clearance cap: inside 45px of a blocked band the desired speed
        // scales back toward 0.5× (full speed ≥45px), so the flow never
        // rubs a wall at pace — the slowdown begins before the bird is
        // nearly touching the surface.
        const nav = navGridFor(g)
        if (nav) {
          const ci = Math.min(nav.cols - 1, Math.max(0, (b.x / nav.cell) | 0))
          const cj = Math.min(nav.rows - 1, Math.max(0, (b.y / nav.cell) | 0))
          const dClear = nav.dist[cj * nav.cols + ci]
          if (dClear < 45) desiredSpeed *= Math.max(0.5, 0.5 + dClear / 90)
        }
      }

      let desX = desDirX * desiredSpeed
      let desY = desDirY * desiredSpeed
      // Takeoff boost: double steering strength for the launch arc.
      const steerMul = now < b.boostUntil ? 2 : 1
      let mult = steerMul
      // Steering deadband (block-rubbing fix (b)): the deadband zone is the
      // interior of the routing pad — a valid sight-line route keeps the
      // bird outside it by construction, so the only way in is overshoot.
      // Inside the pad, steering corrections are dampened to
      // STEER_DEADBAND_MUL so small steering pushes can no longer charge
      // the pad edge and repeatedly re-trigger the push-out (the visible
      // rubbing); ESCAPING the pad keeps full strength, so a bird inside
      // (post-crash, post ram) retreats at full authority instead of
      // dragging along the wall. Validated routes should never be here;
      // under ?birds-debug=1 every active frame logs pad presence — more
      // than 1 per bird per 60s means route validation regressed.
      // Task step 5: an in-pad bird first enters ESCAPE mode — the desired
      // velocity is overridden to the pad's OUTWARD normal (negative of the
      // into-pad contract) at ESCAPE_SPEED_MUL × maxSpeed with FULL steer
      // force (escape overrides the deadband), until ESCAPE_MS expires or
      // the bird is ESCAPE_OUT_DIST outside; the route is then regenerated
      // with the escaped pad on the reject list.
      // Perch committals are excluded: their glide deliberately descends
      // into the perch's keep-out (the perch sits ON the surface), and a
      // dampened descent would be the wall-drag being "/eliminated". Same
      // for the launch-grace window (a takeoff starts inside the pad).
      if (
        b.state === 'flying' &&
        !b.patrolLoop &&
        !b.ramUntil &&
        b.perchIdx < 0 &&
        now >= (b.launchGraceUntil || 0)
      ) {
        const edge = routingPadEdgeVec(b, g, b.x, b.y)
        if (edge.d < 0) {
          if (now >= (b.escapeUntil || 0)) {
            b.escapeUntil = now + ESCAPE_MS
            escapedPads.set(edge.id, now + ESCAPED_PAD_REJECT_MS)
            if (dbgOn) {
              console.info(
                `[bird-diag] escape bird=${b.id} pad=${edge.id} d=${edge.d.toFixed(1)} out=(${(-edge.nx).toFixed(2)},${(-edge.ny).toFixed(2)}) t=+${Math.round(now - now0)}ms`
              )
            }
          }
          desDirX = -edge.nx
          desDirY = -edge.ny
          desiredSpeed = b.cfg.maxSpeed
          desX = desDirX * desiredSpeed * ESCAPE_SPEED_MUL
          desY = desDirY * desiredSpeed * ESCAPE_SPEED_MUL
        } else {
          if ((b.escapeUntil || 0) > now && edge.d >= ESCAPE_OUT_DIST) {
            // Succeeded early: far enough outside while the window is open.
            b.escapeUntil = 0
            b.target = null
            b.waypointQueue = []
            pickTarget(b, g, now)
          } else if (b.escapeUntil && now >= b.escapeUntil) {
            // Window expired (still inside but escape dropped the route):
            // regenerate from the new position; a persistent inside state
            // re-triggers the burst next frame rather than milling silently.
            b.escapeUntil = 0
            b.target = null
            b.waypointQueue = []
            pickTarget(b, g, now)
          }
          // Outside the pad: NO dampening. The pre-refactor design dampened
          // only the pad INTERIOR (chase corrections pushing the bird in);
          // interior frames now enter escape mode instead, which overrides
          // the deadband with full-strength outward steering (task step 6).
          // Dampening the NEAR zone was the regression the first verification
          // capture exposed (healthy 130px approaches slowed to 0.4×).
        }
      } else if (b.escapeUntil && now >= b.escapeUntil) {
        // Eligibility lost mid-escape (state change): drop the burst.
        b.escapeUntil = 0
      }
      b.vx += (desX - b.vx) * b.cfg.steerStrength * mult * dt
      b.vy += (desY - b.vy) * b.cfg.steerStrength * mult * dt

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
      // Proper hitbox: pads are the axis-aligned box of the ROTATED sprite.
      // Bank swings the art up to ~±45°, so the flat half-extents understate
      // a banked wingtip/leg by up to half the sprite's width; these cover
      // the tilted footprint exactly.
      const _bk = ((b.bank || 0) * Math.PI) / 180
      const _bs = Math.abs(Math.sin(_bk))
      const _bc = Math.abs(Math.cos(_bk))
      const padHWb = Math.max(padHW, padHW * _bc + padHH * _bs)
      const padHHb = Math.max(padHH, padHW * _bs + padHH * _bc)
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
        // MNF: then floor the OUTGOING normal component at
        // MIN_BOUNCE_NORM — a graze reflects a ~0.1px/f separation that
        // steering cancels within a frame, which produced the observed
        // ~500ms sag-bounce train along a face. The floor guarantees ≈5px
        // of clean separation while steering re-engages (a dead stop
        // grazing sideways slides at full tangential speed, untouched).
        const nDot = b.vx * h.nxOut + b.vy * h.nyOut
        if (nDot < 0) {
          b.vx -= (1 + BOUNCE_RESTITUTION) * nDot * h.nxOut
          b.vy -= (1 + BOUNCE_RESTITUTION) * nDot * h.nyOut
          const nOut = b.vx * h.nxOut + b.vy * h.nyOut
          if (nOut < MIN_BOUNCE_NORM) {
            b.vx += (MIN_BOUNCE_NORM - nOut) * h.nxOut
            b.vy += (MIN_BOUNCE_NORM - nOut) * h.nyOut
          }
        }
        return true
      }
      // Hero edges: position clamp with the rotated sprite AABB halves;
      // reflect the component moving INTO the boundary at restitution.
      if (b.x < padHWb && b.vx < 0) {
        b.x = padHWb
        b.vx = -b.vx * BOUNCE_RESTITUTION
        if (b.vx < MIN_BOUNCE_NORM) b.vx = MIN_BOUNCE_NORM
        if (!hitSurface) {
          hitSurface = 'edge'
          hitNormal = { nx: 1, ny: 0 }
        }
      } else if (b.x > g.w - padHWb && b.vx > 0) {
        b.x = g.w - padHWb
        b.vx = -b.vx * BOUNCE_RESTITUTION
        if (b.vx > -MIN_BOUNCE_NORM) b.vx = -MIN_BOUNCE_NORM
        if (!hitSurface) {
          hitSurface = 'edge'
          hitNormal = { nx: -1, ny: 0 }
        }
      }
      if (b.y < padHHb && b.vy < 0) {
        b.y = padHHb
        b.vy = -b.vy * BOUNCE_RESTITUTION
        if (b.vy < MIN_BOUNCE_NORM) b.vy = MIN_BOUNCE_NORM
        if (!hitSurface) {
          hitSurface = 'edge'
          hitNormal = { nx: 0, ny: 1 }
        }
      } else if (b.y > g.h - padHHb && b.vy > 0) {
        b.y = g.h - padHHb
        b.vy = -b.vy * BOUNCE_RESTITUTION
        if (b.vy > -MIN_BOUNCE_NORM) b.vy = -MIN_BOUNCE_NORM
        if (!hitSurface) {
          hitSurface = 'edge'
          hitNormal = { nx: 0, ny: -1 }
        }
      }
      // The logo: solid, first-class obstacle in flying AND arriving.
      // Launch grace: a takeoff from a logo-top perch carries a smoothed
      // bank whose rotated pad (up to ~13.2px) EXCEEDS the perch-anchor
      // clearance (size*FOOT_FRAC ≈ 10.08px), so the center starts INSIDE
      // the expanded box and the sweep invariant fires. Cap the vertical
      // pad at the anchor clearance for the grace window (mirrors the
      // headline textPadY cap below).
      if (g.logo) {
        const logoPadHH =
          now < (b.launchGraceUntil || 0)
            ? Math.min(padHHb, b.cfg.size * FOOT_FRAC - 1)
            : padHHb
        sweptHit(g.logo, padHWb, logoPadHH, 'logo')
      }
      // Buttons: solid, flying AND arriving — same three-phase bounce as any
      // other surface (buttons are excluded from the perch pool by design,
      // but shed feathers like every other solid hit).
      for (const btn of g.buttons) {
        if (sweptHit(btn, padHWb, padHHb, 'button')) break
      }
      // Headline keep-out LETTER BY LETTER (flying only): each glyph is its
      // own solid box, so a bird bounces off an individual letter with the
      // letter's true face normal, and the airspace left of/right of the
      // line (and over descenders' boxes) is real open space instead of a
      // full-line wall. Vertical pad floors at the sprite half-height (legs
      // graze the ink top, never cross it) and is also capped below the
      // perch-anchor clearance (size*FOOT_FRAC): a bird taking off FROM a
      // perch — anchor size*FOOT_FRAC above the ink line — must start
      // outside the expanded box or the sweep invariant fires. Horizontal
      // pad adds the rotated sprite half-width so the sprite keeps the tight
      // gap at a letter's sides.
      if (!hitSurface && b.state === 'flying' && g.h1) {
        // During launch grace a takeoff bird may still carry a big smoothed
        // bank; cap the pad at the perch-anchor clearance so its center
        // (size*FOOT_FRAC above the ink line) always starts OUTSIDE.
        const textPadY = Math.max(
          Math.min(REPULSION_PAD, b.cfg.size * FOOT_FRAC - 1),
          now < (b.launchGraceUntil || 0)
            ? Math.min(b.cfg.size * BIRD_HALF_H_FRAC, b.cfg.size * FOOT_FRAC - 1)
            : b.cfg.size * BIRD_HALF_H_FRAC
        )
        for (const glyph of g.h1.glyphs) {
          if (sweptHit(glyph, REPULSION_PAD + padHWb, textPadY, 'text')) break
        }
      }
      // Choreography gate: bounceCoolUntil + the sticky recoil prevent a
      // second choreography window while one is live. Position fixes above
      // are NEVER gated — only feathers/squash/frozen-hold are.
      // On a fresh hit: record the sticky recoil (entry point + outward
      // normal + REFLECTED velocity), then zero the live velocity — steer()
      // applies the parked velocity at HOLD_END (phase C) while renderBird
      // drives the is-impacting/is-confused/is-recovering class chain.
      if (
        hitSurface &&
        !b.recoil &&
        now >= b.bounceCoolUntil &&
        now >= (b.launchGraceUntil || 0)
      ) {
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
            `[bird-diag] collision bird=${i} surface=${hitSurface} t=+${Math.round(now - now0)}ms gapSinceLast=${gap === null ? 'first' : Math.round(gap) + 'ms'} normal=(${N.nx},${N.ny}) reflectV=(${b.recoil.rvx.toFixed(2)},${b.recoil.rvy.toFixed(2)}) tgt=${b.target ? `(${b.target.x.toFixed(0)},${b.target.y.toFixed(0)})` : 'null'} q=${b.waypointQueue.length} imm=${now < b.crashImmuneUntil} ram=${b.ramUntil > now ? 1 : 0} pos=(${b.x.toFixed(0)},${b.y.toFixed(0)})`
          )
        }
        spawnFeathers(b, i, Math.atan2(b.recoil.rvy, b.recoil.rvx))
        // Train breaker: hitting the SAME surface twice within 900ms means
        // steering is re-entering the keep-out after every bounce (the
        // observed sag-bounce train — LOS check passes because it tests the
        // direct chord to the target, while the flown ROUTE grazes the pad).
        // Re-route away instead of re-grinding the face. Deliberate repeats
        // (an active ram window riding the sticky recoil) are exempt —
        // repeated impacts are the ram's point.
        if (
          hitSurface === b._lastHitSurface &&
          !(b.ramUntil > now) &&
          now - (b._lastHitAt || 0) < 900
        ) {
          b.hardApproach = false
          // Launch OUT along the hit normal instead of re-releasing the
          // descending fetch: phase C applies the recoil velocity at
          // HOLD_END, so pointing it outward sends the bird away from the
          // face while the fresh route's steering turns it. Steering pulled
          // the weak 0.8-1.2px/f reflection straight back into the face
          // within one cooldown (~450ms) — the observed train.
          b.recoil.rvx = N.nx * 1.8
          b.recoil.rvy = N.ny * 1.8
          b.bounceCoolUntil = now + 1000
          if (dbgOn) {
            console.info(
              `[bird-diag] train-break bird=${i} surface=${hitSurface} t=+${Math.round(now - now0)}ms`
            )
          }
          pickTarget(b, g, now)
        } else if (!losClearToTarget(b, g)) {
          pickTarget(b, g, now)
        }
        b._lastHitSurface = hitSurface
        b._lastHitAt = now
      }
      // Hard clamp as a safety fallback (rarely fires: targets are inset)
      b.x = clamp(b.x, 0, Math.max(0, g.w - b.cfg.size))
      b.y = clamp(b.y, 0, Math.max(0, g.h - b.cfg.size))

      // Facing follows travel direction via hysteresis (see updateFacing)
      updateFacing(b)
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
    const liveness = (b, now, g, i) => {
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
      // 3) Wedged (pad-edge grinding): no net progress toward the current
      //    target (< ROUTE_CORNER_MOVE px delta) for ROUTE_CORNER_FRAMES
      //    (~1.2 sim-s) while still flying. The dot<0 detector above only
      //    catches birds whose velocity points AWAY; a bird sliding along a
      //    pad face keeps dot ≥ 0 while never closing distance. Deliberate
      //    near-stationary states (hummer hold, hover-fall repick window,
      //    ram override noted via ramUntil above) are excluded — their zero
      //    progress is the point, not a failure.
      const hovering =
        (b.hoverUntil ?? 0) > now || (b.repickHoldUntil ?? 0) > now
      if (
        b.state === 'flying' &&
        b.target &&
        !b.patrolLoop &&
        !b.ramUntil &&
        !hovering
      ) {
        // Measure PROGRESS over the window, not per-frame delta: normal
        // flight covers ~1-2px/frame, so a per-frame threshold can never
        // distinguish it from a stall. Reset before a fresh window.
        const distT = Math.hypot(b.target.x - b.x, b.target.y - b.y)
        if (b.cornerFrames === 0) b._cornerStartDist = distT
        b.cornerFrames = (b.cornerFrames || 0) + 1
        const progress = Math.abs(b._cornerStartDist - distT)
        if (progress >= ROUTE_CORNER_MOVE) {
          // Healthy progress since the window opened: restart the window.
          b.cornerFrames = 0
        } else if (b.cornerFrames >= ROUTE_CORNER_FRAMES) {
          // No net progress toward the target for ~1.2 sim-s: wedged.
          b.cornerFrames = 0
          b.hardApproach = false
          if (dbgOn) {
            console.info(
              `[bird-diag] wedged-escape bird=${i ?? -1} t=+${Math.round(now - now0)}ms distT=${distT.toFixed(1)}`
            )
          }
          pickTarget(b, g, now)
        }
      } else {
        b.cornerFrames = 0
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
      // Collider overlay refreshes only on geometry changes (cheap key).
      if (dbgOn && dbgOverlayKey !== `${g.logo ? g.logo.left.toFixed(1) + ',' + g.logo.top.toFixed(1) : '-'}|${g.buttons.length}`) {
        dbgOverlayKey = `${g.logo ? g.logo.left.toFixed(1) + ',' + g.logo.top.toFixed(1) : '-'}|${g.buttons.length}`
        dbgOverlay(g)
      }
      birds.forEach((b, i) => {
        // Immunity expiry: two straight flights OR 6000ms, whichever first
        // (flight counting happens in steer's arrival branch).
        if (b.crashImmuneUntil && now >= b.crashImmuneUntil) {
          b.crashImmuneUntil = 0
          b.immuneFlights = 0
          b.legImmune = false
          if (dbgOn) {
            console.info(
              `[bird-diag] immunity expired bird=${i} t=+${Math.round(now - now0)}ms`
            )
          }
        }
        // Dizzy: post-crash hold — velocity zeroed, drift suppressed, and
        // the bird is skipped by steering, sweeps, picking, patrol and ram
        // (it's stationary; nothing to sweep against). No dbgFrame: held
        // position updates the prev bookkeeping itself.
        if (b.dizzyUntil) {
          if (now >= b.dizzyUntil) {
            endDizzy(b, i, now)
          } else {
            b.vx = 0
            b.vy = 0
            b.x = clamp(b.x, 0, Math.max(0, g.w - b.cfg.size))
            b.y = clamp(b.y, 0, Math.max(0, g.h - b.cfg.size))
            const p = dbgOn ? dbgPrev[i] : null
            if (p) {
              p.x = b.x
              p.y = b.y
            }
          }
          renderBird(b, i, now)
          return
        }
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
            // Rest frames skip dbgFrame (early return), so keep the probe's
            // previous-position bookkeeping fresh here or the first flying
            // frame after takeoff compares against a stale pre-landing
            // position and reports a phantom teleport.
            const p = dbgOn ? dbgPrev[i] : null
            if (p) {
              p.x = b.x
              p.y = b.y
            }
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
          liveness(b, now, g, i)
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
    let dbgOverlayKey = ''
    let dbgMetricsMarker = 0 // set by handleMetricsUpdate, consumed per frame
    let dbgJitterBird = -1

    // ?birds-debug=1 collider overlay: thin outlines of the exact solid
    // surfaces the sweep uses (logo / buttons / headline line rects
    // headless vs glyphs), drawn in hero coordinates — makes "the hitbox
    // isn't tight on the art" observable directly instead of inferred.
    let dbgOverlayHost = null
    const dbgOverlay = (g) => {
      if (!dbgOn) return
      if (!dbgOverlayHost || !dbgOverlayHost.isConnected) {
        dbgOverlayHost = document.createElement('div')
        dbgOverlayHost.setAttribute('aria-hidden', 'true')
        dbgOverlayHost.style.cssText =
          'position:absolute;inset:0;pointer-events:none;z-index:30'
        dbgOverlayHost.className = 'pdd-birddbg-overlay'
        heroEl.appendChild(dbgOverlayHost)
      }
      const rect = (r, color) => {
        const el = document.createElement('div')
        el.style.cssText =
          `position:absolute;left:${r.left.toFixed(1)}px;top:${r.top.toFixed(1)}px;` +
          `width:${(r.right - r.left).toFixed(1)}px;height:${(r.bottom - r.top).toFixed(1)}px;` +
          `border:1px dashed ${color}`
        return el
      }
      dbgOverlayHost.replaceChildren(
        ...(g.logo ? [rect(g.logo, '#ff2d55')] : []),
        ...g.buttons.map((r) => rect(r, '#32d74b')),
        ...(g.h1 ? g.h1.glyphs.map((r) => rect(r, '#ffd60a')) : [])
      )
    }

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
          const navSorted = [...navStats].sort((a, b) => a - b)
          const navP95 = navSorted.length
            ? navSorted[Math.min(navSorted.length - 1, Math.floor(navSorted.length * 0.95))]
            : 0
          console.warn(
            `[bird-diag] SUMMARY: teleports=${agg.teleports} insideFrames=${agg.inside} ` +
              `jitter{frames=${dbgJit.n} avgDt=${avg.toFixed(1)}ms minDt=${dbgJit.dtMin === Infinity ? 'n/a' : dbgJit.dtMin.toFixed(1) + 'ms'} maxDt=${dbgJit.dtMax.toFixed(1)}ms clamped=${dbgJit.dtClamped} maxFrameDelta=${dbgJit.maxDelta.toFixed(2)}px} ` +
              `nav{n=${navStats.length} p95=${navP95.toFixed(2)}ms max=${(navSorted[navSorted.length - 1] || 0).toFixed(2)}ms} ` +
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
            `metrics=${dbgMetricsMarker === now ? 'UPDATE-THIS-FRAME' : 'none'} pick=${b._pickVersion ?? 0} dart=${b.dartUntil > now ? 'y' : 'n'} boost=${b.boostUntil > now ? 'y' : 'n'}` +
            ` trail=${JSON.stringify(b._dbgTrail || [])}`
        )
      }
      p.x = b.x
      p.y = b.y
      // 4-frame position/velocity trail for teleport forensics (kept short;
      // used only by the TELEPORT log above).
      b._dbgTrail = [
        ...(b._dbgTrail || []).slice(-3),
        `${Math.round(now - now0)}|(${b.x.toFixed(1)},${b.y.toFixed(1)})|v(${b.vx.toFixed(2)},${b.vy.toFixed(2)})|pv${b._pickVersion ?? 0}`,
      ]
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
      targetPool = [] // stale lattice after a layout change is worse than none
      const g = geom()
      if (!g || g.w <= 0 || g.h <= 0) return
      birds.forEach((b, i) => {
        b.patrolLoop = null
        if (b.state === 'perched') {
          const p = b.perchIdx >= 0 ? perchPts[b.perchIdx] : null
          if (info.breakpointChanged || !p || p.occupiedBy !== b.id) {
            takeOff(b, i, performance.now())
          } else {
            // Re-anchor WITHOUT a snap: the per-frame settle drift (exp
            // ~1s) carries the bird to the live slot position. An instant
            // position write here teleported birds across the hero when a
            // rebuild re-ordered slots under an occupant (observed live:
            // 177-578px, single frame).
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
      if (dbgOverlayHost) dbgOverlayHost.remove()
      onUpdateRef.current = null
    }
  }, [containerRef, landmarkRef, count, hostRefs, flyRefs, perchRefs])
}

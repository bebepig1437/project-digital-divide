/**
 * birdPersonalities — shared config for the BirdPets component.
 *
 * Personalities, steering constants, flock order and geometry helpers live
 * here so useBirdPets.js and BirdPets.jsx stay in sync.
 */

export const MAX_BIRDS = 8

// ---- personalities --------------------------------------------------------
// wingDur: flap cadence; maxBank: bank angle limit in degrees;
// perchEvery: how often a flying bird decides to land; rest: how long it stays.
export const PERSONALITIES = {
  wanderer: {
    size: 24,
    maxSpeed: 1.55,
    steerStrength: 0.085,
    wingDur: '450ms',
    maxBank: 40,
    perchEvery: [12000, 20000],
    rest: [5000, 8000],
    tint: null,
    opacity: 1,
  },
  hummer: {
    size: 20,
    maxSpeed: 2.5,
    steerStrength: 0.17,
    wingDur: '220ms',
    maxBank: 50,
    perchEvery: [12000, 20000],
    rest: [5000, 8000],
    dart: [2500, 4000],
    // Static tint instead of a per-frame filter: hue +15deg, slightly
    // brighter, expressed against the inherited ink so themes keep working.
    // An unsupported relative-colour value is simply ignored (no filter).
    tint: 'hsl(from currentColor calc(h + 15) s calc(l * 1.1))',
    opacity: 1,
  },
  glider: {
    size: 28,
    maxSpeed: 1.0,
    steerStrength: 0.056,
    wingDur: '600ms',
    maxBank: 30,
    perchEvery: [15000, 25000],
    rest: [8000, 12000],
    tint: 'hsl(from currentColor calc(h - 15) s l)',
    opacity: 0.85,
  },
}

// Personality cycle; slice(0, flockSize) builds any flock of 1..MAX_BIRDS.
export const FLOCK_ORDER = [
  'wanderer',
  'hummer',
  'glider',
  'wanderer',
  'hummer',
  'glider',
  'wanderer',
  'hummer',
]

// Start positions (fraction of container) so the flock spreads out.
export const START_SLOTS = [
  { xFrac: 0.12, yFrac: 0.24 },
  { xFrac: 0.85, yFrac: 0.3 },
  { xFrac: 0.2, yFrac: 0.72 },
  { xFrac: 0.78, yFrac: 0.66 },
  { xFrac: 0.32, yFrac: 0.14 },
  { xFrac: 0.62, yFrac: 0.12 },
  { xFrac: 0.08, yFrac: 0.5 },
  { xFrac: 0.92, yFrac: 0.48 },
]

// ---- steering constants ----------------------------------------------------
export const TARGET_ARRIVE_RADIUS = 30 // px: waypoint considered reached
export const INSET = 60 // px: targets stay this far inside the container
export const H1_REJECT_DIST = 80 // px: sampled targets must stay this far off the landmark
export const SELF_REJECT_DIST = 120 // px: targets must be at least this far from the bird
export const SAMPLE_TRIES = 10
export const SUBROUTE_CHANCE = 0.3
export const SUBROUTE_WAYPOINTS = [1, 2]
export const SUBROUTE_OFFSET = 80 // px perpendicular offset for mid-flight direction changes
export const REPULSION_PAD = 10 // px: keep-out box around the landmark text lines (tight: birds may read as 'near the text', never clipping letters)

// Sprite collision half-extents, ANISOTROPIC: the 24-unit art box is wider
// than it is tall (body+tail span x2.4..21.4, body+wing span y3.3..17.7), so
// padded obstacles use width/2 horizontally and height/2 vertically. A
// uniform half-size pad under-protects the long axis and over-protects the
// short one.
export const BIRD_HALF_W_FRAC = 0.4 // art half-width as a fraction of `size`
export const BIRD_HALF_H_FRAC = 0.4 // art half-height as a fraction of `size` (art truly spans y3.3..21.6: tucked legs + flap span; 0.3 let leg tips sink into wall faces)

// Logo perches: two top-edge slots at these width fractions of the logo
// rect, uniform members of the same selection pool as the headline slots.
export const LOGO_PERCH_FRACS = [0.25, 0.75]
export const ARRIVE_RADIUS = 6 // px: close enough to land
export const ARRIVE_SPEED = 0.3 // px/frame: slow enough to land
export const ARRIVE_SAFETY_MS = 4000
export const ARRIVE_TERM_FACTOR = 0.12 // desiredSpeed = min(maxSpeed, dist * factor)
export const DART_SPEED = 4.5
export const DART_DECAY_MS = 1500 // overspeed allowed while dart velocity bleeds off
export const HOVER_DECAY = 0.92 // per-frame velocity decay while hovering
export const HOVER_MS = 500
export const TAKEOFF_START_SPEED = 0.5 // first-frame launch speed (see takeOff push)
export const BOOST_MS = 300 // extra steering push after takeoff (launch arc)
export const DT_CAP_MS = 33 // delta-time spike cap: a long frame never moves the flock more than 2 frames @60fps
export const FOOT_FRAC = 0.42 // distance from perched bird center down to its feet

// ---- perch + stuck detection ----------------------------------------------
// Time constants here are in RAF ticks (sim time), not wall-clock ms: UI-throttled
// or suspended rAF freezes the sim but performance.now() keeps running, so
// wall-clock windows false-trigger the guards and release healthy perch commits.
export const PERCH_RETRY_MS = [3000, 5000] // retry delay when no glide-safe perch exists right now
export const PERCH_COMMIT_FRAMES = 720 // ~12 sim-s before committing perch is aborted (safety)
export const STUCK_FRAMES = 60 // ~1 sim-s of velocity pointing AWAY from the target = re-target
export const FLARE_DIST = 40 // px from perch where the flap cadence speeds up
export const FLARE_FAST_FACTOR = 0.66 // approach flap speed-up multiplier
export const LAND_FLARE_MS = 200 // one-shot catch-itself pop after landing
export const IDLE_GAP_MIN = 3000 // min time between perched flourishes
export const IDLE_GAP_MAX = 6000
export const IDLE_ANIM_MS = 400 // matches the CSS one-shot animations
export const GLIDE_OVERHEAD = 90 // px above a perch where the glide descent begins

// ---- bounce physics --------------------------------------------------------
export const BANK_SMOOTH = 0.15 // per-frame lerp factor for the rendered bank angle
export const BOUNCE_RESTITUTION = 0.7 // energy kept after a boundary/keep-out bounce (resume speed)
export const BOUNCE_COOLDOWN_MS = 300 // choreography gate: no NEW bounce choreography while cooling (position fixes are never gated)
// Sticky recoil phases — the "hit fence, pause confused, fly away" sequence:
//   A impact 0..IMPACT: velocity zero, squash hold, wings frozen
//   B confusion IMPACT..HOLD_END: velocity stays zero, 6Hz wobble, wing twitch
//   C recovery HOLD_END..: reflected velocity applied once, squash releases
// Recoil CLEARS on time alone at HOLD_END (the circular movement/dot checks
// can never pass while velocity is zero); the reflected velocity carries the
// bird away, so a post-clear re-collision is a legitimate fresh hit, not the
// old triple-ram (whose interval was < 250ms vs the 350ms frozen floor).
export const RECOIL_IMPACT_MS = 80 // phase A end
export const RECOIL_HOLD_END_MS = 350 // phase B end = clear time + phase C start
export const RECOIL_END_MS = 450 // phase C release end (matches the CSS timings)
export const RECOIL_CLEAR_MAX_MS = 500 // safety force-clear: a wedged bird never sits longer than this
export const RECOIL_CLEAR_AWAY_SPEED = 1.2 // px/frame velocity granted by the force-clear
export const MIN_BOUNCE_NORM = 0.8 // px/frame floor on the OUTGOING normal component after any bounce
export const LAUNCH_GRACE_MS = 280 // takeoff arc: choreography suppressed (position fixes never)
// Feather burst — logo hits only; reads as "a couple knocked loose.", not an explosion.
export const FEATHER_MIN = 1 // feathers spawned per collision (1-2: a knock-loose, not a burst)
export const FEATHER_MAX = 2
export const FEATHER_CAP = 18 // max feathers on screen (runaway accumulation guard)
export const FEATHER_LIFE_MS = [1100, 1400] // fade lifetime range (opaque ~70% of the flight — see the 70% keyframe)
export const FEATHER_CONE_DEG = 22 // half-cone around the reflected direction
export const FEATHER_SPEED = [0.55, 1.0] // px/frame away from the surface (slow float, not a burst)

// ---- patrol loops ---------------------------------------------------------
// Every PATROL_EVERY_N_PICKS-th target selection (25%), a flying bird traces
// a closed parametric loop for 2-4s before steering normally again. Shapes:
// figure8, loopDeLoop, corkscrew (horizontal circle + lateral drift), orbit,
// and sweep (L→R→L patrol: 3-4s per direction at a fixed Y, 200ms hang at
// each edge, never through the headline/logo/button airspace).
export const PATROL_EVERY_N_PICKS = 4
export const PATROL_SHAPES = [
  'figure8',
  'loopDeLoop',
  'corkscrew',
  'orbit',
  'sweep',
]
export const PATROL_DUR_MS = [2000, 4000]
export const PATROL_R = [30, 40] // loop radius (px): paths stay within this of their center
export const PATROL_DRIFT = [50, 90] // corkscrew horizontal migration over the full loop (px)
export const PATROL_ORBIT_REVS = [2, 3]
export const PATROL_CLEAR_PAD = 10 // extra clearance (px) required between a loop and the headline keep-out

// ---- sweep patrol (L→R→L) ---------------------------------------------------
export const PATROL_SWEEP_LEG_MS = [3000, 4000] // one direction's crossing (full cycle 6-9s incl. pauses)
export const PATROL_SWEEP_EDGE_PAUSE_MS = 200 // hang at each edge before the hard reverse

// ---- proactive routing model -------------------------------------------------
// Targets come from a DISCRETE VALID POOL built from the metric snapshot, not
// from per-pick random sampling. Every pool cell is pre-cleared against the
// obstacles and edges; a pick only succeeds when a SIGHT-LINE-CLEARED route to
// it exists (direct, or via 1-2 ring waypoints around the first blocker).
// Collision then becomes a rare, choreographed event instead of the steering
// model's steering-into-walls-and-bouncing routine.
export const POOL_CELL_MIN_PX = 30 // lattice cell size floor (mobile-ish worlds)
export const POOL_CELL_MAX_PX = 60 // lattice cell size ceiling (desktop worlds)
export const POOL_COLS = 20 // target lattice resolution (desktop)
export const POOL_ROWS = 15
export const POOL_EDGE_INSET = 40 // px: cells this close to a hero edge are invalid
export const POOL_CLEAR_RADIUS = 24 // px circle around a cell center that must be obstacle-free
export const POOL_SAMPLE_N = 30 // weighted samples per target pick
export const ROUTE_WP_RING = 60 // px: candidate waypoints ring the blocking obstacle's center
export const ROUTE_WP_STEP = 10 // px kept INSIDE-shy when pushing a candidate out of an obstacle pad
export const ROUTE_PAIR_LIMIT = 12 // two-waypoint candidate pairs tried per pick
export const ROUTE_POP_RADIUS = 15 // px: intermediate waypoint considered reached
export const MIN_PICK_DIST = 70 // px: a pool target closer than this to the picker is skipped

// Zone classification + weights: the picker prefers interesting airspace
// (above the headline, the margins) over the plain open bands.
export const ZONE_WEIGHTS = {
  'top-band': 2.5,
  'above-headline': 3.0,
  'left-margin': 2.0,
  'right-margin': 2.0,
  'below-headline': 1.5,
  'bottom-band': 1.0,
  'center-open': 0.8,
}

// ---- post-crash choreography: dizzy + crash immunity ----------------------
// After a collision resolves through the sticky-recoil bounce (impact →
// confused → recover), the bird holds STATIONARY for DIZZY_MS: velocity zero,
// a slow ±DIZZY_WOBBLE_DEG wobble at DIZZY_WOBBLE_HZ, wings folded, and three
// star icons orbiting its head at DIZZY_STARS_HZ (CSS: .pdd-dizzy-stars).
// Then crash immunity opens: the picker refuses any target that requires a
// waypoint turn or lies closer than ROUTE_MIN_CLEARANCE to an obstacle, and
// scripted ramming is suspended, until two straight sight-line flights
// complete or CRASH_IMMUNE_MS elapses (whichever first).
export const DIZZY_MS = 1400
export const DIZZY_WOBBLE_DEG = 6
export const DIZZY_WOBBLE_HZ = 1.5
export const DIZZY_STARS_HZ = 2
export const CRASH_IMMUNE_MS = 6000
export const CRASH_IMMUNE_FLIGHTS = 2
export const ROUTE_MIN_CLEARANCE = 160 // px to the nearest obstacle edge for a crash-safe target

// Multi-leg routing planner (task: full obstacle coverage). Route legs
// candidate waypoints ring each blocking pad's center; recursion depth is
// bounded by ROUTE_MAX_LEGS; routes are scored so shorter + straighter wins.
export const ROUTE_MAX_LEGS = 4 // max legs (segments) in a planned route
export const ROUTE_WP_NEAR = 40 // near ring: radius beyond half pad diagonal (8 dirs)
export const ROUTE_WP_FAR = 100 // far ring: extra cardinal radius (4 dirs)
export const ROUTE_TURN_COST = 80 // px-equivalent score penalty per turn
export const ROUTE_TURN_COS = 0.94 // leg-dot threshold (~20 deg) counting as a turn
export const ROUTE_FINAL_CLEAR = 30 // final-leg clearance past every routing pad edge
export const ROUTE_WP_ARRIVE = 15 // px: intermediate waypoint considered reached
export const ESCAPE_MS = 400 // in-pad emergency escape burst duration
export const ESCAPE_OUT_DIST = 40 // px outside the pad that ends the escape early
export const ESCAPE_SPEED_MUL = 1.4 // escape velocity multiplier over current speed
export const ESCAPED_PAD_REJECT_MS = 5000 // escaped pad rejects routes for this long
export const ARRIVE_SLOW_DIST = 60 // px: perched-approach deceleration is the ONLY speed modulation left

// ---- routing pad + steering deadband (no visual rubbing) -------------------
// Routes and targets are validated against a pad ROUTING_PAD_EXTRA wider
// (every side) than the collision pad, so a validated route keeps visible
// clearance to the block instead of grazing its padded boundary. A steering
// deadband dampens corrections to STEER_DEADBAND_MUL within STEER_DEADBAND
// px of a routing-pad edge (overshoot insurance; a healthy route should
// never enter it — dbg logs every active frame to expose route regressions).
export const ROUTING_PAD_EXTRA = 20
export const STEER_DEADBAND = 40
export const STEER_DEADBAND_MUL = 0.4
// Deadband per PCB, exercise 5 (this addendum, item 5): pad-dist >= STEER_SETOUT
export const STEER_SETOUT = 4

// ---- rare ramming ---------------------------------------------------------
// Ramming is CHOREOGRAPHED, never accidental: at most one ram per bird every
// RAM_COOLDOWN_MS, and only when the approach leg to a solid is grid-verified
// clear. The bird then overrides its route for 1.5s and steers into that solid
// on purpose. The hit runs the normal sweep + sticky-recoil path (feathers,
// squash, dizzy stars) and the route regenerates after recovery.
export const RAM_COOLDOWN_MS = 90000
export const RAM_MIN_MS = RAM_COOLDOWN_MS
export const RAM_MAX_MS = RAM_COOLDOWN_MS * 2
export const RAM_WINDOW_MS = 1500
export const RAM_CLEAR_DIST = 100 // px: minimum clearance from every obstacle to arm a ram
export const RAM_FAR_PICK = 400 // px: nearest obstacle beyond this → pick at random

// ---- flip + bank hygiene ----------------------------------------------------
export const FLIP_SPEED_GUARD = 0.3 // px/frame: facing only flips above this |vx|
export const ROUTE_CORNER_FRAMES = 72 // ~1.2 sim-s wedged at an obstacle before escaping
export const ROUTE_CORNER_DIST = 30 // obstacle clearance defining "wedged"
export const ROUTE_CORNER_MOVE = 10 // px of progress below which the wedged window trips

// ---- helpers ---------------------------------------------------------------
export const clamp = (val, min, max) => Math.max(min, Math.min(max, val))
// Wrap-aware angular lerp — never snaps, never crosses the long way around.
export const lerpAngle = (prev, target, k) => {
  const delta = ((target - prev + 540) % 360) - 180
  return prev + delta * k
}
export const clampMag = (vx, vy, max) => {
  const m = Math.hypot(vx, vy)
  if (m <= max || m === 0) return [vx, vy]
  const s = max / m
  return [vx * s, vy * s]
}
export const isReducedMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

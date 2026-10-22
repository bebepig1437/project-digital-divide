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
export const REPULSION_PAD = 50 // px: keep-out box around the landmark (targets/text never crossed)
export const ARRIVE_RADIUS = 6 // px: close enough to land
export const ARRIVE_SPEED = 0.3 // px/frame: slow enough to land
export const ARRIVE_SAFETY_MS = 4000
export const ARRIVE_TERM_FACTOR = 0.1 // desiredSpeed = min(maxSpeed, dist * factor)
export const DART_SPEED = 4.5
export const DART_DECAY_MS = 1500 // overspeed allowed while dart velocity bleeds off
export const HOVER_DECAY = 0.92 // per-frame velocity decay while hovering
export const HOVER_MS = 500
export const TAKEOFF_START_SPEED = 0.5 // first-frame launch speed (see takeOff push)
export const BOOST_MS = 300 // extra steering push after takeoff (launch arc)
export const DT_MAX = 1.33 // caps per-frame displacement at DART_SPEED * 1.33 ≈ 6px
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
export const BOUNCE_RESTITUTION = 0.5 // energy kept after a boundary/keep-out bounce
export const BOUNCE_COOLDOWN_MS = 300 // no re-collide with the same surface while cooling
export const BOUNCE_ANIM_MS = 250 // squash animation window (matches the CSS)
export const BOUNCE_FLAP_FACTOR = 0.5 // wing flap halved while recovering from a hit

// ---- helpers ---------------------------------------------------------------
export const rand = (min, max) => min + Math.random() * (max - min)
export const clamp = (val, min, max) => Math.max(min, Math.min(max, val))
export const clampMag = (vx, vy, max) => {
  const m = Math.hypot(vx, vy)
  if (m <= max || m === 0) return [vx, vy]
  const s = max / m
  return [vx * s, vy * s]
}
export const isReducedMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

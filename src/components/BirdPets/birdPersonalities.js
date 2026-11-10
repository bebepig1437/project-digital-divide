/**
 * birdPersonalities — shared configuration for perched pet birds.
 */

export const MAX_BIRDS = 8
export const FOOT_FRAC = 0.42 // distance from bird center down to feet baseline

export const PERSONALITIES = {
  wanderer: {
    size: 24,
    tint: null,
    opacity: 1,
  },
  hummer: {
    size: 20,
    tint: 'hsl(from currentColor calc(h + 15) s calc(l * 1.1))',
    opacity: 1,
  },
  glider: {
    size: 28,
    tint: 'hsl(from currentColor calc(h - 15) s l)',
    opacity: 0.85,
  },
}

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

/**
 * PerchedBird — lucide `Bird` icon with folded wings, used when a flock bird lands.
 *
 * Faces right by default (lucide's Bird beak points right); flipX mirrors.
 * Breathing (scaleY 0.98 loop, 4s ease-in-out) comes from the .pdd-perched class
 * in index.css — disabled under prefers-reduced-motion at the CSS level.
 * Same `size` as the flying variant so the swap doesn't jump visually.
 */

import { forwardRef } from 'react'
import { Bird } from 'lucide-react'

const PerchedBird = forwardRef(function PerchedBird(
  { size = 24, flipX = false, className = '', id },
  ref
) {
  return (
    <span
      ref={ref}
      data-bird-perched={id || undefined}
      className={`pdd-perched pointer-events-none block ${className}`}
      style={{ transform: flipX ? 'scaleX(-1)' : undefined }}
      aria-hidden="true"
    >
      <Bird size={size} strokeWidth={1.6} aria-hidden="true" />
    </span>
  )
})

export default PerchedBird

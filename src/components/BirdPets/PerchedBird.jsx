/**
 * PerchedBird — side-view perched silhouette bird, same design family as
 * FlyingBird (which it swaps with when a flock bird lands).
 *
 * Design (24px viewBox, facing right by default — beak on the right):
 *  - Body: the same horizontal oval as FlyingBird's.
 *  - Head: same rounded shape at the right end, with the same tiny triangle
 *    beak and eye dot.
 *  - Tail: same three feather strokes fanning off the left end, angled down
 *    slightly so the bird reads as resting on its legs.
 *  - Wing: folded flat against the body — a single low-arc overlay (0.5 opacity)
 *    where FlyingBird has its near wing.
 *  - Legs: two thin strokes from the body underside to a feet baseline at
 *    viewBox y≈22 so the bird sits ON the perch point (the host anchor keeps
 *    the center, so feet ≈ center + 0.42*height — see FOOT_FRAC).
 *
 * Faces right by default; flipX mirrors with scaleX(-1).
 * Rest-pose breathing + idle flourishes come from the .pdd-perched /
 * .pdd-idle-* / .pdd-land-flare classes in index.css (the loop toggles them);
 * all of them are disabled under prefers-reduced-motion at the CSS level.
 * Same `size` as the flying variant so the swap doesn't jump visually.
 */

import { forwardRef } from 'react'

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
      <svg
        data-bird-perched-svg={id || undefined}
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="pdd-perched-svg pointer-events-none block"
      >
        {/* Tail feathers (left end, fanning back and slightly down) */}
        <path d="M6.8 12.9L2.6 13.5" />
        <path d="M6.7 13.6L3.2 15.6" />
        <path d="M7 14.3L4.1 17.7" />
        {/* Body: same horizontal oval as FlyingBird's */}
        <path
          d="M12.3 10.6C15.1 10.6 17 11.7 17 13.1C17 14.5 15.1 15.6 12.3 15.6C9.5 15.6 6.9 14.6 6.9 13.2C6.9 11.7 9.5 10.6 12.3 10.6Z"
          fill="currentColor"
          fillOpacity="0.85"
        />
        {/* Head + beak + eye (identical to FlyingBird's) */}
        <path
          d="M16.1 9C17.9 9 19.1 10.2 19.1 11.7C19.1 12.9 18.1 13.9 16.7 14.1L14.9 14.3C15.6 13.5 15.8 12.5 15.5 11.4C15.7 10.2 15.9 9 16.1 9Z"
          fill="currentColor"
          fillOpacity="0.95"
        />
        <path d="M19 10.9L21.4 11.6L19.1 12.4Z" fill="currentColor" />
        <path d="M17.4 10.6h.01" strokeWidth="0.9" />
        {/* Wing folded flat along the body (one-shot overlay, no hinge) */}
        <path
          d="M9.4 12.2C11 12 14.4 12.1 15.7 12.7C14.6 14.5 11.4 14.7 9.3 13.9Z"
          fill="currentColor"
          fillOpacity="0.5"
          strokeOpacity="0.9"
        />
        {/* Legs down to the feet baseline (sits on the perch point) */}
        <path d="M11 15.4L10.8 21.6" />
        <path d="M13.7 15.4L13.9 21.6" />
        <path d="M10.8 21.6L12.4 21.6" strokeWidth="1.2" />
        <path d="M13.9 21.6L15.5 21.6" strokeWidth="1.2" />
      </svg>
    </span>
  )
})

export default PerchedBird

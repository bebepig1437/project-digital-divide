/**
 * FlyingBird — side-view flying silhouette bird (no physics; parent drives position).
 *
 * Design (24px viewBox, facing right by default):
 *  - Body: horizontal oval.
 *  - Head: small round shape on the right end, with a tiny triangle beak and eye dot.
 *  - Tail: three feather strokes fanning off the left end.
 *  - Wings: two <path> elements extending up from the body — a NEAR wing in front
 *    (drawn last, strongest) and a FAR wing behind the body (drawn first, partially
 *    hidden, lower opacity). Each wing hinges at its own shoulder joint via
 *    transform-box: view-box + per-wing transform-origin (set in index.css).
 *  - Flap (via .is-flapping): near wing sweeps 0deg -> +55deg (fast downstroke)
 *    -> -40deg (up overshoot) -> 0deg; far wing mirrored. Duration per personality
 *    via var(--pdd-flap-dur).
 *
 * Props: size, isFlapping, bankAngle (parent pre-signs it), flipX (scaleX(-1) so the
 * beak faces the travel direction), className, id.
 */

import { forwardRef } from 'react'

const FlyingBird = forwardRef(function FlyingBird(
  { size = 24, isFlapping = false, bankAngle = 0, flipX = false, className = '', id },
  ref
) {
  return (
    <svg
      ref={ref}
      id={id || undefined}
      data-bird={id || undefined}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`pdd-fly pointer-events-none block ${isFlapping ? 'is-flapping' : ''} ${className}`}
      style={{ transform: `rotate(${bankAngle}deg)${flipX ? ' scaleX(-1)' : ''}` }}
      aria-hidden="true"
    >
      {/* FAR wing (behind the body, partially hidden) — hinges at (10.9, 11.6) */}
      <g id="wing-far" className="pdd-bird-wing pdd-bird-wing-far">
        <path
          d="M10.6 11.6C8.8 9.4 8.5 6.2 9.9 4.1C11.7 5.7 12.1 9.3 11.4 11.6Z"
          fill="currentColor"
          fillOpacity="0.35"
        />
      </g>
      {/* Body + head + beak + eye + tail */}
      <g id="body" className="pdd-fly-body">
        {/* Tail feathers (left end, fanning back) */}
        <path d="M6.8 12.6L2.4 12.9" />
        <path d="M6.7 13.4L3 15" />
        <path d="M7 14.2L3.8 17.2" />
        {/* Body: horizontal oval */}
        <path
          d="M12.3 10.6C15.1 10.6 17 11.7 17 13.1C17 14.5 15.1 15.6 12.3 15.6C9.5 15.6 6.9 14.6 6.9 13.2C6.9 11.7 9.5 10.6 12.3 10.6Z"
          fill="currentColor"
          fillOpacity="0.85"
        />
        {/* Head at the right end + beak + eye */}
        <path
          d="M16.1 9C17.9 9 19.1 10.2 19.1 11.7C19.1 12.9 18.1 13.9 16.7 14.1L14.9 14.3C15.6 13.5 15.8 12.5 15.5 11.4C15.7 10.2 15.9 9 16.1 9Z"
          fill="currentColor"
          fillOpacity="0.95"
        />
        {/* Beak: tiny triangle pointing right */}
        <path d="M19 10.9L21.4 11.6L19.1 12.4Z" fill="currentColor" />
        {/* Eye dot */}
        <path d="M17.4 10.6h.01" strokeWidth="0.9" />
      </g>
      {/* NEAR wing (in front, fully drawn) — hinges at (12, 11.4) */}
      <g id="wing-near" className="pdd-bird-wing pdd-bird-wing-near">
        <path
          d="M11.6 11.4C9.6 9.0 9.2 5.5 10.8 3.3C12.7 5.1 13.1 9.0 12.4 11.4Z"
          fill="currentColor"
          fillOpacity="0.6"
          strokeOpacity="0.9"
        />
      </g>
    </svg>
  )
})

export default FlyingBird

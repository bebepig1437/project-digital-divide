# BirdPets

Tiny pet birds that live in a container: they cruise on waypoint steering, avoid
the landmark element, land on it or the container corners, rest with a breathing
loop and the occasional head-tilt/tail-flick/wing-ruffle, then take off again.
No gravity, no physics — a single `requestAnimationFrame` loop, delta-time aware,
with hard guarantees against the classic flock-name bugs: birds never teleport,
never have a null target while flying, and never commit to an unreachable perch
(glides are pre-checked against the landmark; if no clean glide exists they just
retry later). Deadlocks are watchdogged (12s perch-commitment timeout + a
liveness guard that re-targets a bird that stops moving while flying).

## Mounting

```jsx
import { useRef } from 'react'
import BirdPets from '../components/BirdPets/BirdPets.jsx'

const heroRef = useRef(null)
const h1Ref = useRef(null)

<section ref={heroRef} className="relative overflow-hidden">
  <BirdPets containerRef={heroRef} landmarkRef={h1Ref} count={4} />
  ...
</section>
```

## Props

| Prop           | Type      | Default                        | Notes                                                        |
| -------------- | --------- | ------------------------------ | ------------------------------------------------------------ |
| `count`        | number    | `4`                            | 1–8 birds (personality cycle: wanderer, hummer, glider).      |
| `containerRef` | React ref | —                              | Element the birds fly inside. **Required.**                   |
| `landmarkRef`  | React ref | —                              | Element birds avoid with a 50px force pad and perch on (pass the `h1`). |
| `className`    | string    | hero position classes          | Override when mounting outside a hero (keep `pointer-events-none`). |

Under `(min-width: 640px)` the count is clamped to 2, and the whole layer is
hidden below `sm` — four birds on a phone is too busy. `prefers-reduced-motion`
renders 4 static perched birds and never starts the RAF loop.

## Files

- `BirdPets.jsx` — exported component (rendering + sprite anchor offsets)
- `useBirdPets.js` — the RAF steering/perch/liveness loop hook
- `birdPersonalities.js` — personalities, steering constants, helpers
- `FlyingBird.jsx` — side-view flying silhouette SVG (wings hinge at their own shoulders)
- `PerchedBird.jsx` — lucide `Bird` swapped in on landing

Related CSS lives in `src/index.css` under the `pdd-bird*` / `pdd-perched` /
`pdd-fly` selectors (`?birds=N` on the Home page picks the flock size).

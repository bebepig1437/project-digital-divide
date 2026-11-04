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
| `count`        | number    | `2`                            | 1–8 birds (personality cycle: wanderer, hummer, glider).      |
| `containerRef` | React ref | —                              | Element the birds fly inside. **Required.**                   |
| `landmarkRef`  | React ref | —                              | Element birds avoid with a 50px force pad and perch on (pass the `h1`). |
| `className`    | string    | hero position classes          | Override when mounting outside a hero (keep `pointer-events-none`). |

Two birds are shown by default at both breakpoints. Below 640px the count
is capped at two; desktop `?birds=2`, `?birds=4`, and `?birds=6` override the
Home page count. `prefers-reduced-motion` renders the configured flock as
static perched birds and never starts the RAF loop.

Headline collisions use one 4px-inset rectangle per rendered line, with cap-top
and unused font-descent trim. Perch anchors retain the original line geometry.
`?birds-debug-pads=1` draws red 1px headline collision borders and logs layout-time
pad measurements, including raster-estimated ink coverage. These estimates are
not pixel-exact measurements of the rendered bird/text overlap.

The legacy planner remains the default. Grid A* is opt-in via
`?birds-route=grid`; rams are enabled unless `?birds-rams=off` is supplied.
`?birds-seed=N` seeds the simulation's random choices with an integer. Frame
and layout timing can still differ between runs, so this does not guarantee
identical trajectories or collision counts. Seed 0 is internally substituted to
`0x9E3779B9` to avoid the zero fixed point, so `?birds-seed=0` and
`?birds-seed=2654435769` produce identical streams.
The measured ship pass reduced text hits, but did not eliminate headline dwells
or establish clipping-free mobile flight. See the [verification report](../../../screenshots/birds-ship-report.md).

## Files

- `BirdPets.jsx` — exported component (rendering + sprite anchor offsets)
- `useBirdPets.js` — the RAF steering/perch/liveness loop hook
- `birdPersonalities.js` — personalities, steering constants, helpers
- `FlyingBird.jsx` — side-view flying silhouette SVG (wings hinge at their own shoulders)
- `PerchedBird.jsx` — lucide `Bird` swapped in on landing

Related CSS lives in `src/index.css` under the `pdd-bird*` / `pdd-perched` /
`pdd-fly` selectors (`?birds=N` on the Home page picks the flock size).

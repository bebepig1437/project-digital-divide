# BirdPets

Little pet birds that spawn perched on the hero headline. They sit on calculated
perch points along the text cap tops, breathing gently with subtle idle flourishes
(head-tilt, tail-flick, wing-ruffle). No flying animation or physics loops.

## Mounting

```jsx
import { useRef } from 'react'
import BirdPets from '../components/BirdPets/BirdPets.jsx'

const heroRef = useRef(null)
const h1Ref = useRef(null)

<section ref={heroRef} className="relative overflow-hidden">
  <BirdPets containerRef={heroRef} landmarkRef={h1Ref} count={2} />
  ...
</section>
```

## Props

| Prop           | Type      | Default               | Notes                                                              |
| -------------- | --------- | --------------------- | ------------------------------------------------------------------ |
| `count`        | number    | `2`                   | 1–8 birds (personality cycle: wanderer, hummer, glider).            |
| `containerRef` | React ref | —                     | Container element the birds are positioned inside. **Required.**   |
| `landmarkRef`  | React ref | —                     | Landmark element birds perch on (pass the `h1`).                   |
| `className`    | string    | hero position classes | Override when mounting outside a hero. Keeps `pointer-events-none`.|

## Hitboxes & Layout Metrics

`useLayoutMetrics.js` calculates:
- **Headline hitboxes (`headlineRects`):** per-line bounding boxes of the landmark `h1` via `Range.getClientRects()`. Includes `capTrim` measurement so birds sit exactly on the font caps.
- **Perch points (`perchPoints`):** spots along the first headline line's top edge.
- **Logo hitbox (`logoRect`):** bounding box of the hero logo image.
- **Button hitboxes (`buttonRects`):** bounding boxes of the hero action links.
- **Debug Hitbox Overlay:** visit `/?birds-debug-pads` to display visual borders around all measured hitboxes (red = headline, blue = logo, green = buttons).

## Files

- `BirdPets.jsx` — root component managing bird containers and sizes
- `PerchedBird.jsx` — side-view perched SVG bird sprite
- `useBirdPets.js` — hook anchoring birds to perch points with idle flourishes
- `useLayoutMetrics.js` — hitbox measurement and perch point calculation
- `birdPersonalities.js` — personality sizes and tints

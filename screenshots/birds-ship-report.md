# Birds: one-pass ship verification

## Outcome

The requested numerical commit gate passes: the four-bird legacy run recorded **25 text hits**, below 40 and 56.1% below the historical 57-hit baseline. The two-bird default recorded **27 text hits**, 52.6% below 57.

**This is not an all-clear on visual quality.** Both long runs still had non-perched headline dwells over six seconds. The mobile check raised possible clipping, and a natural flight between headline lines was not observed. No further tuning or routing redesign was performed in this pass.

Checkpoint commit: `6b85cd9` — `feat(birds): feathers on all crashes, stutter fixes, grid A* behind flag, four grid repairs`. Checkpoint and final-source `npm run build` both exited **0**.

## 1. Existing headline pad diagnosis (before shrinking)

The headline is **Project Digital Divide**, with **20 non-whitespace characters**. The existing colliders were per-character advance rectangles, not true painted-ink boxes. They were misleadingly named `line-0` through `line-19`. The previously reported **27 obstacles** include 20 headline pads, one logo, two buttons, and four hero edges — not 27 rendered headline lines.

| Viewport | Headline pads | Actual lines | H1 bounds | Summed pad area (px²) | Exact rectangle-union area (px²) | Estimated pad dead space |
| --- | ---: | ---: | --- | ---: | ---: | ---: |
| 1440×900 | 20 glyph | 1 | 545.375×60 | 29,095.31 | 29,080.54 | 54.78% |
| 375×667 | 20 glyph | 2 | 335×90 | 10,990.99 | 10,982.02 | 55.47% |
| 1975×1111 | 20 glyph | 1 | 545.375×60 | 29,095.31 | 29,080.54 | 54.62% |

Dead-space percentages are **canvas raster estimates**, using the rendered font, per-character DOM positions, alpha-weighted ink, and pixel-center union membership. They are not exact screenshot segmentation. Pixel-grid union estimates differ slightly from exact geometric union areas. Small variation between 1440 and 1975 arises from subpixel placement. Whitespace inside the overall h1 is a different measurement: approximately **58.43% desktop** and **83.18% mobile** of its bounding box is not ink.

## 2. Final pad geometry

Headline pads now use whole-h1 Range line rectangles, merging same-line fragments. Existing cap-top trim and original perch anchors are retained. Unused font descent is trimmed from collision geometry, followed by a 4px inward inset on all sides. Collision and route consumers share this per-line set; logo/button/edge geometry and sprite padding are unchanged.

| Viewport | Final text pads | Summed area (px²) | Area reduction | Estimated pad dead space |
| --- | ---: | ---: | ---: | ---: |
| 1440×900 | 1 line | 22,881.43 | 21.36% | 46.48% |
| 375×667 | 2 lines | 6,594.71 | 40.00% | 39.35% |
| 1975×1111 | 1 line | 22,881.43 | 21.36% | 46.54% |

Final hero-relative rectangles, `{left, top, right, bottom}`:

- 1440: `{451.3125, 270.4000, 988.6875, 312.9800}`.
- 375, line 1: `{76.6875, 238.2400, 298.2969, 261.0560}`.
- 375, line 2: `{140.2031, 283.2400, 234.7969, 299.5040}`.
- 1975: `{718.8125, 270.4000, 1256.1875, 312.9800}`.

`?birds-debug-pads=1` independently displays red 1px borders, logs each pad and area measurements on layout recomputation, and removes its overlay on unmount. The borders sit inside the glyph region by the requested 4px inset rather than extending above the caps or into unused font descent. They intentionally do not enclose every painted pixel.

### Screenshots

Captured at exact CSS viewport dimensions with headless Chromium. The shared Preview screenshot tool was attempted but could not capture because the desktop window had not drawn; Playwright captured these artifacts instead.

![1440×900 headline pad](birds-pads-1440.png)

![375×667 headline pads and two visible birds](birds-pads-375.png)

## 3. Two real-time 300-second runs

Both use **1975×1111**, device scale factor 1, the legacy planner, `birds-rams=off`, and `birds-debug=1`. The measurement harness also enables the pad overlay/diagnostics. The four-bird run explicitly supplies `birds=4`; the two-bird run has no `birds` count parameter. Recording starts after fonts and layout settle, for a full 300 seconds. No seeded randomness or fresh control run was added.

| Metric | Supplied historical legacy baseline | New pads, 4 birds | New pads, default 2 |
| --- | ---: | ---: | ---: |
| Total collisions | 99–118 | **44** | **41** |
| Text hits | 57–64 | **25** | **27** |
| Logo hits | — | 14 | 7 |
| Edge hits | — | 5 | 7 |
| Button hits | — | 0 | 0 |
| Per-bird burst episodes | 29 historical bursts* | 2 | 8 |
| Non-perched headline dwells >6s | 1 historical dwell* | **5** | **4** |
| Longest dwell | — | 10.45s | 11.20s |
| Observed >20px/frame teleports | — | 0 | 0 |
| Wedged-escape log events | — | 4 | 3 |
| Recorded frames | — | 17,989 | 17,997 |
| Measured elapsed | — | 300.002s | 300.011s |
| Observed frame rate | — | 59.96fps | 59.99fps |
| Browser exceptions | — | 0 | 0 |

*The old harness is not available for a definition audit. New burst counts are per-bird chains of collisions separated by at most two seconds. New dwell detection uses a bird center within spriteHalf + 30px of estimated glyph ink bounds, excluding perched state; intentional landing approaches are not excluded. Historical bursts/dwells are therefore not guaranteed like-for-like.

**Do not infer that two birds halved collisions.** These individual random runs recorded 41 versus 44 total collisions and 27 versus 25 text hits. Only the measured changes versus the supplied historical baseline are reported; this is not a statistically controlled improvement claim.

### Recorded events

Dwell times below are seconds after recorder start. Collision burst times are seconds after the bird simulation's mount (the recorder is armed after warm-up), so they have a different zero point.

Four birds:
- Bursts: bird 1 at 8.394–8.844s (2 hits), 15.443–17.327s (2 hits).
- Dwells: bird 0 at 38.696s for 6.233s; bird 2 at 71.378s for 6.483s, 85.544s for 8.433s, and 165.107s for 7.133s; bird 3 at 206.239s for 10.450s.

Default two:
- Bursts, all bird 1, two hits each: 10.696–11.146s; 71.877–72.327s; 182.356–184.272s; 243.586–244.036s; 249.970–250.436s; 254.953–255.403s; 258.303–258.769s; 283.368–285.285s.
- Dwells: bird 1 at 26.705s for 9.533s, 240.280s for 10.616s, and 251.729s for 7.866s; bird 0 at 262.795s for 11.200s.

## 4. Focused visual and behavior checks

- Desktop count checks: no count parameter = **2**; `birds=2` = **2**; `birds=4` = **4**; `birds=6` = **6**. All visible.
- Mobile 375×667: **2 visible birds**. The former below-640px hiding class was removed as explicitly authorized; the existing two-bird mobile count cap remains.
- Reduced motion: at 375×667 both birds remain perched with identical transforms over the two-second sample.
- Desktop 1440×900, 30-second sample: 6 non-perched near-ink bird-frames (2 flying, 4 arriving), no conservative sprite-box/ink overlaps, no headline collisions, no >6s dwell, no teleports. There is **only one rendered line**, so flight between two desktop lines is inapplicable.
- Mobile 375×667, 30-second sample: 700 near-ink bird-frames, including 676 conservative sprite-box/ink overlap flags; 7 headline collisions; one 9.50s non-perched dwell. **Clipping-free mobile flight is not verified.** The overlap probe is conservative: a square sprite half-extent is not a pixel-accurate animated SVG silhouette. It is evidence requiring caution, not an exact count of visibly clipped frames.
- No natural inter-line gap crossing was observed on mobile in that sample. The line-pad gap is approximately 22.18px; unchanged routing margins may still prevent the planner from using it. No forced route, font/layout change, or routing modification was used to manufacture a crossing.
- The two long measurements logged 3,168 and 3,229 near-ink bird-frames, respectively. Conservative sprite-box overlap flags were 1,843 and 1,273. Those figures do not establish zero actual clipping or zero inside-pad frames.
- Full-duration external frame recording covers all 300s rather than relying on the existing 120s internal debug summary.

## 5. Preservation and commit decision

- Legacy remains the default; grid A* is only enabled by `birds-route=grid`.
- Rams remain enabled by default; `birds-rams=off` still disables them for measurement.
- No changes in this pass to personality parameters, bounce/dizzy/immunity timings or responses, perch anchors/behavior, grid pathfinder implementation, or offscreen/reduced-motion gates.
- No new pathfinding architecture, deployment, or push.
- The temporary measurement script is removed after measurement. Raw recorder outputs remain ignored local evidence under `.freebuff/`, not shipped code or dependencies.
- Final-source production build: **exit 0**. `git diff --check`: **exit 0**.
- The explicit text-hit commit gate passes, so the requested `perf(birds): per-line headline pads, 2-bird default, ship-quality pass` commit is authorized. Its title is the requested label, **not certification that the visual limitations above passed**.

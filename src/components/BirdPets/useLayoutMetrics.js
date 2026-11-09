/**
 * useLayoutMetrics — single source of truth for the flock's coordinate world.
 *
 * Measures, once per layout change and NEVER per frame:
 *   - heroW / heroH    — hero-relative coordinate space the birds fly in
 *   - headlineRects    — PER-LINE rects of the landmark (Range.getClientRects)
 *   - logoRect         — the visible hero logo image, hero-relative
 *   - perchPoints      — headline perch landing points for the current breakpoint
 *   - isDesktop        — (min-width: 640px), drives the perch point count
 *
 * Everything is hero-relative, so scrolling never invalidates. All data live in
 * a useRef (never state): updating them must not re-render React, and the RAF
 * loop reads the ref directly each frame — it never touches the DOM itself.
 *
 * Recompute lifecycle:
 *   mount, document.fonts.ready, hero-image img.decode(), window resize
 *   (debounced 150ms), ResizeObserver on the hero, breakpoint (.matchMedia)
 *   change, plus one ~1.2s "settle" pass so the hero-reveal entrance transform
 *   and any font swap land before the cache is trusted.
 *
 * onUpdate(metrics, { breakpointChanged, cause }) fires after each recompute so
 * useBirdPets can clamp positions, re-validate targets and rebuild perches.
 */

import { useEffect, useRef } from 'react'
import { REPULSION_PAD, ROUTING_PAD_EXTRA } from './birdPersonalities'

const DESKTOP_MQ = '(min-width: 640px)'
const SETTLE_MS = 1200

// Tight painted-art bounds inside a logo <img>: the source art has
// transparent padding (the hummingbird does not fill its square canvas),
// so the element rect is wider than the VISIBLE art — most visibly on the
// right, where birds bounce in mid-air. This scans a downsampled copy of
// the natural image once per natural-URL (memoized below) and returns the
// opaque bounding box as per-side FRACTIONS of the element size. With
// object-cover and a square element, fractions map linearly onto the
// element rect; caller falls back to the full rect on any failure.
const ALPHA_SCAN_PX = 128 // canvas sample size per side
const ALPHA_THRESHOLD = 16 // treat alpha < 13% as padding (anti-alias fringe)
// Opaque sources (JPEG) pad their canvas with a flat background colour
// instead of transparency: the hummingbird's white margins read as
// "painted" to an alpha-only scan, so the collider stayed the full square
// and birds bounced ~22px short of the visible art (worst on the right).
// Background pixels are detected by sampling the four corners — each
// margin pixel differs from the sampled colour only by JPEG noise (~≤6),
// while art pixels differ far beyond that.
const BG_DELTA_THRESHOLD = 26 // per-channel Δ from the sampled bg colour

const alphaBoxFrac = (() => {
  const cache = new Map() // naturalWidth-currentSrc key → {l, r, t, b} fractions
  return (img) => {
    try {
      const nw = img.naturalWidth
      const nh = img.naturalHeight
      if (!nw || !nh) return null
      const key = `${img.currentSrc || img.src} ${nw}x${nh}`
      if (cache.has(key)) return cache.get(key)
      const cv = document.createElement('canvas')
      cv.width = ALPHA_SCAN_PX
      cv.height = ALPHA_SCAN_PX
      const ctx = cv.getContext('2d', { willReadFrequently: true })
      if (!ctx) return null
      // object-cover with a square source into a square element: the full
      // canvas covers the element exactly — draw natural → sample directly.
      ctx.drawImage(img, 0, 0, nw, nh, 0, 0, ALPHA_SCAN_PX, ALPHA_SCAN_PX)
      const data = ctx.getImageData(0, 0, ALPHA_SCAN_PX, ALPHA_SCAN_PX).data
      // Sample the four corners and average them as the padding colour:
      // the hummingsbird's margins are all the same flat background, so the
      // average is exact enough (each corner is within JPEG noise of it).
      let bgR = 0
      let bgG = 0
      let bgB = 0
      for (const [cx, cy] of [
        [0, 0],
        [ALPHA_SCAN_PX - 1, 0],
        [0, ALPHA_SCAN_PX - 1],
        [ALPHA_SCAN_PX - 1, ALPHA_SCAN_PX - 1],
      ]) {
        const o = (cy * ALPHA_SCAN_PX + cx) * 4
        bgR += data[o]
        bgG += data[o + 1]
        bgB += data[o + 2]
      }
      bgR /= 4
      bgG /= 4
      bgB /= 4
      const isArt = (y, x) => {
        const o = (y * ALPHA_SCAN_PX + x) * 4
        return (
          data[o + 3] >= ALPHA_THRESHOLD &&
          (Math.abs(data[o] - bgR) > BG_DELTA_THRESHOLD ||
            Math.abs(data[o + 1] - bgG) > BG_DELTA_THRESHOLD ||
            Math.abs(data[o + 2] - bgB) > BG_DELTA_THRESHOLD)
        )
      }
      let minL = ALPHA_SCAN_PX
      let maxR = -1
      let minT = ALPHA_SCAN_PX
      let maxB = -1
      for (let y = 0; y < ALPHA_SCAN_PX; y++) {
        for (let x = 0; x < ALPHA_SCAN_PX; x++) {
          if (isArt(y, x)) {
            if (x < minL) minL = x
            if (x > maxR) maxR = x
            if (y < minT) minT = y
            if (y > maxB) maxB = y
          }
        }
      }
      if (maxR < 0) return null // fully transparent source: no painted art
      const box = {
        l: minL / ALPHA_SCAN_PX,
        r: (maxR + 1) / ALPHA_SCAN_PX,
        t: minT / ALPHA_SCAN_PX,
        b: (maxB + 1) / ALPHA_SCAN_PX,
      }
      cache.set(key, box)
      return box
    } catch {
      return null // CORS/taint or readback failure: keep the element rect
    }
  }
})()

// Perch fractions along the FIRST rendered line's top edge (its width share).
// Desktop gets 6 spots for up to 6-landing birds; mobile only ever shows 2
// birds, so 3 spots along a narrower line is enough.
const PERCH_FRACS_DESKTOP = [0.08, 0.25, 0.42, 0.58, 0.75, 0.92]
const PERCH_FRACS_MOBILE = [0.15, 0.5, 0.85]

// Routing-pad expansion: tight rect + margin on every side. Used to derive
// `routeRect` views of every obstacle pad (single source, two arrays).
const expandRect = (r, m) => ({
  left: r.left - m,
  right: r.right + m,
  top: r.top - m,
  bottom: r.bottom + m,
  width: r.right - r.left + 2 * m,
  height: r.bottom - r.top + 2 * m,
})

export function useLayoutMetrics({ containerRef, landmarkRef, onUpdateRef }) {
  const metricsRef = useRef(null)

  useEffect(() => {
    const heroEl = containerRef?.current
    if (!heroEl) return undefined

    let disposed = false
    let debounceId = 0
    let lastLogoBoundKey = null
    let lastHeadlineKey = null
    let lastPadsKey = null
    const params = new URLSearchParams(window.location.search)
    const debugPads = params.has('birds-debug-pads')
    const logPads = debugPads || params.has('birds-debug')
    let padOverlay = null
    const mq = window.matchMedia(DESKTOP_MQ)
    let isDesktop = mq.matches

    const toHeroRect = (r, heroBox) => ({
      left: r.left - heroBox.left,
      right: r.right - heroBox.left,
      top: r.top - heroBox.top,
      bottom: r.bottom - heroBox.top,
      width: r.width,
      height: r.height,
    })

    const measure = (cause = 'unknown') => {
      if (disposed) return
      const heroBox = heroEl.getBoundingClientRect()
      // Collapsed/unrendered hero (e.g. display:none width): keep the previous
      // metrics — a 0-sized world would teleport the whole flock.
      if (heroBox.width <= 0 || heroBox.height <= 0) return
      const breakpointChanged = mq.matches !== isDesktop
      isDesktop = mq.matches

      // Headline: one rect per RENDERED LINE, not one block box.
      const markEl = landmarkRef?.current || heroEl.querySelector('h1')
      let headlineRects = null
      let headlineCollisionRects = null
      let capTrim = 0
      let rawFirstTop = null
      if (markEl) {
        const range = document.createRange()
        range.selectNodeContents(markEl)
        const raw = [...range.getClientRects()]
          .filter((r) => r.width > 1 && r.height > 1)
          .map((r) => toHeroRect(r, heroBox))
        // rects and perches would sit on the line box again).
        // Cap trim: Range rects hug the font's em box (font ascent..descent),
        // not the INK — the visible cap tops sit fontAscent − capHeight BELOW
        // the rect top. Measure that gap per measure pass via canvas metrics
        // for the actually rendered font ('PH' ink ascent = cap height),
        // trimming the rects' tops so the perch anchor puts feet exactly on
        // the glyph tops and the keep-out hugs the caps. Falls back to 0.
        try {
          const st = getComputedStyle(markEl)
          const ctx2d = document.createElement('canvas').getContext('2d')
          ctx2d.font = `${st.fontStyle} ${st.fontWeight} ${st.fontSize} ${st.fontFamily}`
          const mt = ctx2d.measureText('PH')
          const fontAsc = mt.fontBoundingBoxAscent
          const inkAsc = mt.actualBoundingBoxAscent
          if (
            typeof fontAsc === 'number' &&
            typeof inkAsc === 'number' &&
            fontAsc > inkAsc &&
            inkAsc > 0
          ) {
            capTrim = Math.max(0, fontAsc - inkAsc)
          }
        } catch {
          capTrim = 0
        }
        // A Range can emit multiple fragments for inline elements on one
        // visual line. Merge only fragments with the same vertical band.
        const lines = []
        for (const r of raw) {
          const line = lines.find((l) => Math.abs(l.top - r.top) < 1 && Math.abs(l.bottom - r.bottom) < 1)
          if (line) {
            line.left = Math.min(line.left, r.left)
            line.right = Math.max(line.right, r.right)
            line.width = line.right - line.left
          } else lines.push({ ...r })
        }
        const rects = lines.map((r) => ({ ...r, top: r.top + capTrim, height: r.height - capTrim }))
        rawFirstTop = raw.length ? raw[0].top : null
        if (rects.length) {
          // Change-keyed log: the element rect top is the LINE BOX (includes
          // half-leading above the glyphs); the first Range rect hugs the text
          // content box. The delta must be non-zero (~8-16px at display font
          // sizes) — equal values mean the Range API didn't produce tighter
          // rects and perches would sit on the line box again.
          const rangeKey = `${rects.length}L ${rects[0].top.toFixed(1)}/${rects[0].bottom - rects[0].top}`
          if (logPads && rangeKey !== lastHeadlineKey) {
            lastHeadlineKey = rangeKey
            const elTop = markEl.getBoundingClientRect().top - heroBox.top
            console.info(
              `[BirdPets] headline tops: line-box(el)=${elTop.toFixed(1)} range(raw)=${(rects[0].top - capTrim).toFixed(1)} capTrim=${capTrim.toFixed(1)} glyphTop(range+trim)=${rects[0].top.toFixed(1)} halfLeadingDelta=${(elTop - (rects[0].top - capTrim)).toFixed(1)}px lines=${rects.length}`
            )
          }
          headlineRects = rects
          // Preserve the original line/perch anchors. Only collision geometry
          // loses unused font descent and receives the 4px per-side inset.
          const inkBottoms = lines.map((r) => r.top)
          const st = getComputedStyle(markEl)
          const ctx = document.createElement('canvas').getContext('2d')
          if (ctx) {
            ctx.font = `${st.fontStyle} ${st.fontWeight} ${st.fontSize} ${st.fontFamily}`
            const walker = document.createTreeWalker(markEl, NodeFilter.SHOW_TEXT)
            let node
            while ((node = walker.nextNode())) {
              for (let ci = 0; ci < node.length; ci++) {
                if (/\s/.test(node.data[ci])) continue
                const cr = document.createRange()
                cr.setStart(node, ci)
                cr.setEnd(node, ci + 1)
                const pr = cr.getClientRects()[0]
                if (!pr) continue
                const hr = toHeroRect(pr, heroBox)
                const li = lines.findIndex((r) => Math.abs(r.top - hr.top) < 1)
                const mt = ctx.measureText(node.data[ci])
                if (li >= 0 && Number.isFinite(mt.fontBoundingBoxAscent) && Number.isFinite(mt.actualBoundingBoxDescent)) {
                  inkBottoms[li] = Math.max(inkBottoms[li], hr.top + mt.fontBoundingBoxAscent + mt.actualBoundingBoxDescent)
                }
              }
            }
          }
          headlineCollisionRects = rects.map((r, i) => {
            const tight = { ...r, bottom: inkBottoms[i] > r.top ? Math.min(r.bottom, inkBottoms[i]) : r.bottom }
            return expandRect(tight, -Math.min(4, (tight.right - tight.left - 1) / 2, (tight.bottom - tight.top - 1) / 2))
          })
        }
      }

      // Logo: the first hero image that actually renders (light/dark pair —
      // one of them is display:none and must not be treated as a collider).
      let logoRect = null
      let logoEl = null
      let logoAlphaBox = null
      for (const img of [...heroEl.querySelectorAll('img')]) {
        const r = img.getBoundingClientRect()
        if (r.width > 4 && r.height > 4 && img.getClientRects().length > 0) {
          logoRect = toHeroRect(r, heroBox)
          logoEl = img
          break
        }
      }
      // Tight-painted correction: inset the element rect by the scanned
      // transparent margins so the LOGO HITBOX is the visible hummingbird
      // art, not its square canvas (the art's right side has the largest
      // transparent gutter — birds used to bounce in mid-air there). Runs
      // after img.decode() in this lifecycle, so the natural pixels are
      // already available; a scan failure falls back to the element rect.
      // FULL element rect, kept alongside the tight art box: the ROUTING pad
      // must cover the whole logo footprint (full height, top to bottom —
      // the bird wedge zone), while the collision sweep keeps the tight box.
      const logoFullRect = logoRect ? { ...logoRect } : null
      if (logoEl && logoRect) {
        const box = alphaBoxFrac(logoEl)
        if (box) {
          const w = logoRect.width
          const h = logoRect.height
          logoRect = {
            ...logoRect,
            left: logoRect.left + box.l * w,
            right: logoRect.left + box.r * w,
            top: logoRect.top + box.t * h,
            bottom: logoRect.top + box.b * h,
            width: (box.r - box.l) * w,
            height: (box.b - box.t) * h,
          }
          logoAlphaBox = box
        }
      }

      // Solid collision surfaces: visible styled CTAs (a/button) inside the
      // hero. Requires real padding AND a visual affordance (background,
      // border, or shadow) — plain text links beside a button are not walls.
      const buttonRects = [...heroEl.querySelectorAll('a, button')]
        .filter((el) => {
          if (!el.getClientRects().length) return false
          const r = el.getBoundingClientRect()
          if (r.width <= 20 || r.height <= 16) return false
          const s = getComputedStyle(el)
          const pad =
            parseFloat(s.paddingTop) + parseFloat(s.paddingBottom) || 0
          const hasBg = s.backgroundColor && s.backgroundColor !== 'rgba(0, 0, 0, 0)'
          const hasBorder = (parseFloat(s.borderTopWidth) || 0) > 0
          const hasShadow = s.boxShadow && s.boxShadow !== 'none'
          return pad >= 16 && (hasBg || hasBorder || hasShadow)
        })
        .map((el) => toHeroRect(el.getBoundingClientRect(), heroBox))

      // On change-only bounds log: the measured rect must be the TIGHT
      // bounds of the visible logo art — now guaranteed by the alpha-scan
      // correction above rather than assumed (the pre-fix comment claimed
      // the element rect == painted bounds, which was false for this art).
      const boundKey = logoRect
        ? `${logoRect.left.toFixed(1)},${logoRect.top.toFixed(1)} ${(logoRect.right - logoRect.left).toFixed(1)}x${(logoRect.bottom - logoRect.top).toFixed(1)}`
        : 'none'
      if (logPads && boundKey !== lastLogoBoundKey) {
        lastLogoBoundKey = boundKey
        const ab = logoAlphaBox
          ? ` alphaBox[l=${(logoAlphaBox.l * 100).toFixed(1)}% r=${((1 - logoAlphaBox.r) * 100).toFixed(1)}% t=${(logoAlphaBox.t * 100).toFixed(1)}% b=${((1 - logoAlphaBox.b) * 100).toFixed(1)}%]`
          : ' alphaBox=none(full-rect fallback)'
        console.info(
          `[BirdPets] logo bounds measured=${boundKey}` +
            ` elementRect=${logoEl ? `${logoEl.getBoundingClientRect().width.toFixed(1)}x${logoEl.getBoundingClientRect().height.toFixed(1)}` : 'n/a'}` +
            ` natural=${logoEl ? `${logoEl.naturalWidth}x${logoEl.naturalHeight}` : 'n/a'}` + ab +
            ' (hero logo collider is the alpha-scanned painted-art box; element rect only on scan failure)'
        )
      }

      // Perch points: fractions along the first rendered line's top edge. The
      // landing anchor (moved above the surface by the per-bird FOOT_FRAC) is
      // applied at landing time with the LANDING bird's size, so any
      // personality's feet land exactly on the text tops.
      let perchPoints = []
      if (headlineRects) {
        const line = headlineRects[0]
        const fracs = isDesktop ? PERCH_FRACS_DESKTOP : PERCH_FRACS_MOBILE
        perchPoints = fracs.map((f) => ({
          x: line.left + f * (line.right - line.left),
          y: line.top,
        }))
      }

      // Diagnostic chain for the perch-anchor forensics: the RAW (untrimmed)
      // first-line Range top and the element line-box top live alongside the
      // trimmed rects so a perched bird's feet position can be attributed to
      // exactly one of: stale snapshot, wrong slot, capTrim, or Range-vs-rect.
      const rawFirstLineTop = rawFirstTop
      const headlineElTop = markEl
        ? markEl.getBoundingClientRect().top - heroBox.top
        : null

      // ---- unified obstacle pads (task: full-coverage routing) ----------
      // Single source for routing AND collision. colRect = the tight
      // collision rect (logo = the tight painted-art box that the sweeps
      // use); routeRect = the routing view (colRect + ROUTING_PAD_EXTRA)
      // — EXCEPT the logo, whose routing view is the FULL element rect + pad
      // (full height, top to bottom: routes must plan around the whole box,
      // not graze under its bottom face), and headline line rects, which
      // additionally keep their REPULSION_PAD keep-out. Hero edges join as
      // inward-facing pads so transit routes are rejected near the boundary
      // (terminal legs are exempted in the planner — pool targets
      // legitimately sit POOL_EDGE_INSET px from an edge).
      const textRects = headlineCollisionRects || []
      const W = heroBox.width
      const H = heroBox.height
      const BAND = ROUTING_PAD_EXTRA
      const obstaclePads = []
      textRects.forEach((gl, gi) => {
        obstaclePads.push({
          id: `line-${gi}`,
          kind: 'text',
          colRect: gl,
          routeRect: expandRect(gl, REPULSION_PAD + ROUTING_PAD_EXTRA),
        })
      })
      if (logoRect) {
        obstaclePads.push({
          id: 'logo',
          kind: 'logo',
          colRect: logoRect,
          routeRect: expandRect(logoFullRect || logoRect, ROUTING_PAD_EXTRA),
        })
      }
      buttonRects.forEach((r, bi) => {
        obstaclePads.push({
          id: `btn-${bi}`,
          kind: 'button',
          colRect: r,
          routeRect: expandRect(r, ROUTING_PAD_EXTRA),
        })
      })
      obstaclePads.push(
        { id: 'edge-top', kind: 'edge', colRect: null, routeRect: { left: -200, right: W + 200, top: -200, bottom: BAND, width: W + 400, height: BAND + 200 } },
        { id: 'edge-bottom', kind: 'edge', colRect: null, routeRect: { left: -200, right: W + 200, top: H - BAND, bottom: H + 200, width: W + 400, height: BAND + 200 } },
        { id: 'edge-left', kind: 'edge', colRect: null, routeRect: { left: -200, right: BAND, top: -200, bottom: H + 200, width: BAND + 200, height: H + 400 } },
        { id: 'edge-right', kind: 'edge', colRect: null, routeRect: { left: W - BAND, right: W + 200, top: -200, bottom: H + 200, width: BAND + 200, height: H + 400 } }
      )
      const routingPads = obstaclePads.map((p) => p.routeRect)
      const collisionPads = obstaclePads
        .filter((p) => p.colRect)
        .map((p) => p.colRect)
      const padsKey = obstaclePads
        .map(
          (p) =>
            `${p.id}:${p.routeRect.width.toFixed(0)}x${p.routeRect.height.toFixed(0)}@${p.routeRect.left.toFixed(0)},${p.routeRect.top.toFixed(0)}`
        )
        .join('|')
      if (logPads && padsKey !== lastPadsKey) {
        lastPadsKey = padsKey
        console.info(
          `[BirdPets] obstaclePads n=${obstaclePads.length}` +
            ` ids=${obstaclePads.map((p) => p.id).join(',')}` +
            ` logo route=${logoRect ? `${(logoFullRect || logoRect).width.toFixed(0)}x${(logoFullRect || logoRect).height.toFixed(0)} col=${logoRect.width.toFixed(0)}x${logoRect.height.toFixed(0)}` : 'none'}` +
            ` buttons=${buttonRects.length} edges=4 routingPads=${routingPads.length} collisionPads=${collisionPads.length}`
        )
      }

      if (debugPads) {
        if (!padOverlay) {
          padOverlay = document.createElement('div')
          padOverlay.className = 'pdd-headline-pads'
          padOverlay.setAttribute('aria-hidden', 'true')
          padOverlay.style.cssText = 'position:absolute;inset:0;pointer-events:none;z-index:31'
          heroEl.appendChild(padOverlay)
        }
        padOverlay.replaceChildren(...textRects.map((r, i) => {
          const el = document.createElement('div')
          el.dataset.headlinePad = `line-${i}`
          el.style.cssText = `position:absolute;box-sizing:border-box;left:${r.left}px;top:${r.top}px;width:${r.width}px;height:${r.height}px;border:1px solid red`
          return el
        }))
      }
      if (logPads && markEl) {
        // Debug-only, layout-time raster estimate; DOM rects are not ink.
        const st = getComputedStyle(markEl)
        const canvas = document.createElement('canvas')
        canvas.width = Math.ceil(heroBox.width)
        canvas.height = Math.ceil(heroBox.height)
        const ctx = canvas.getContext('2d', { willReadFrequently: true })
        ctx.font = `${st.fontStyle} ${st.fontWeight} ${st.fontSize} ${st.fontFamily}`
        ctx.fillStyle = '#fff'
        ctx.letterSpacing = st.letterSpacing
        const walker = document.createTreeWalker(markEl, NodeFilter.SHOW_TEXT)
        let node
        while ((node = walker.nextNode())) {
          for (let i = 0; i < node.length; i++) {
            if (/\s/.test(node.data[i])) continue
            const range = document.createRange()
            range.setStart(node, i)
            range.setEnd(node, i + 1)
            const r = range.getBoundingClientRect()
            const ascent = ctx.measureText(node.data[i]).fontBoundingBoxAscent
            ctx.fillText(node.data[i], r.left - heroBox.left, r.top - heroBox.top + ascent)
          }
        }
        const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height).data
        const headlinePads = obstaclePads.filter((p) => p.kind === 'text')
        let unionArea = 0
        let inkInPads = 0
        let inkArea = 0
        for (let y = 0; y < canvas.height; y++) {
          for (let x = 0; x < canvas.width; x++) {
            const ink = pixels[(y * canvas.width + x) * 4 + 3] / 255
            inkArea += ink
            if (headlinePads.some(({ colRect: r }) => x + 0.5 >= r.left && x + 0.5 < r.right && y + 0.5 >= r.top && y + 0.5 < r.bottom)) {
              unionArea++
              inkInPads += ink
            }
          }
        }
        const bounds = toHeroRect(markEl.getBoundingClientRect(), heroBox)
        const diagnostic = {
          viewport: { width: innerWidth, height: innerHeight }, cause,
          pads: headlinePads.map(({ id, colRect: r }) => ({ id, rect: { top: r.top, bottom: r.bottom, left: r.left, right: r.right }, width: r.right - r.left, height: r.bottom - r.top, kind: 'line' })),
          count: headlinePads.length,
          padArea: headlinePads.reduce((sum, { colRect: r }) => sum + (r.right - r.left) * (r.bottom - r.top), 0),
          rasterUnionArea: unionArea, bounds, renderedLines: headlineRects?.length || 0,
          estimatedInkArea: inkArea,
          estimatedDeadSpacePercent: unionArea ? 100 * (1 - inkInPads / unionArea) : null,
          headlineBoxEmptyPercent: 100 * (1 - inkArea / (bounds.width * bounds.height)),
        }
        window.__birdPads = diagnostic
        console.info('[bird-pads] ' + JSON.stringify(diagnostic))
      }

      const metrics = {
        heroW: heroBox.width,
        heroH: heroBox.height,
        headlineRects,
        headlineCollisionRects,
        logoRect,
        buttonRects,
        capTrim,
        rawFirstLineTop,
        headlineElTop,
        perchPoints,
        isDesktop,
        obstaclePads,
        routingPads,
        collisionPads,
        updatedAt: performance.now(),
      }
      metricsRef.current = metrics
      onUpdateRef?.current?.(metrics, { breakpointChanged, cause })
    }

    measure('mount')
    const settleId = setTimeout(() => measure('settle'), SETTLE_MS)
    document.fonts?.ready?.then?.(() => measure('fonts'))
    heroEl.querySelectorAll('img').forEach((img) => {
      const dec = img.decode?.()
      if (dec?.then) {
        dec.then(() => measure('img-decode')).catch(() => {})
      } else if (!img.complete) {
        img.addEventListener('load', () => measure('img-load'), { once: true })
      }
    })

    const scheduleMeasure = (cause) => {
      clearTimeout(debounceId)
      debounceId = setTimeout(() => measure(cause), 150)
    }
    let ro = null
    if ('ResizeObserver' in window) {
      ro = new ResizeObserver(() => scheduleMeasure('resize-observer'))
      ro.observe(heroEl)
    }
    const onBreakpoint = () => measure('breakpoint')
    const onResize = () => scheduleMeasure('resize')
    window.addEventListener('resize', onResize)
    mq.addEventListener?.('change', onBreakpoint)

    return () => {
      disposed = true
      padOverlay?.remove()
      if (logPads) delete window.__birdPads
      clearTimeout(debounceId)
      clearTimeout(settleId)
      ro?.disconnect()
      window.removeEventListener('resize', onResize)
      mq.removeEventListener?.('change', onBreakpoint)
    }
  }, [containerRef, landmarkRef])

  return metricsRef
}

export default useLayoutMetrics

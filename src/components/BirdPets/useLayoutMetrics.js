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

const DESKTOP_MQ = '(min-width: 640px)'
const SETTLE_MS = 1200

// Perch fractions along the FIRST rendered line's top edge (its width share).
// Desktop gets 6 spots for up to 6-landing birds; mobile only ever shows 2
// birds, so 3 spots along a narrower line is enough.
const PERCH_FRACS_DESKTOP = [0.08, 0.25, 0.42, 0.58, 0.75, 0.92]
const PERCH_FRACS_MOBILE = [0.15, 0.5, 0.85]

export function useLayoutMetrics({ containerRef, landmarkRef, onUpdateRef }) {
  const metricsRef = useRef(null)

  useEffect(() => {
    const heroEl = containerRef?.current
    if (!heroEl) return undefined

    let disposed = false
    let debounceId = 0
    let lastLogoBoundKey = null
    let lastHeadlineKey = null
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
      let capTrim = 0
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
        const rects = raw.map((r) => ({ ...r, top: r.top + capTrim }))
        if (rects.length) {
          // Change-keyed log: the element rect top is the LINE BOX (includes
          // half-leading above the glyphs); the first Range rect hugs the text
          // content box. The delta must be non-zero (~8-16px at display font
          // sizes) — equal values mean the Range API didn't produce tighter
          // rects and perches would sit on the line box again.
          const rangeKey = `${rects.length}L ${rects[0].top.toFixed(1)}/${rects[0].bottom - rects[0].top}`
          if (rangeKey !== lastHeadlineKey) {
            lastHeadlineKey = rangeKey
            const elTop = markEl.getBoundingClientRect().top - heroBox.top
            console.info(
              `[BirdPets] headline tops: line-box(el)=${elTop.toFixed(1)} range(raw)=${(rects[0].top - capTrim).toFixed(1)} capTrim=${capTrim.toFixed(1)} glyphTop(range+trim)=${rects[0].top.toFixed(1)} halfLeadingDelta=${(elTop - (rects[0].top - capTrim)).toFixed(1)}px lines=${rects.length}`
            )
          }
          headlineRects = rects
        }
      }

      // Logo: the first hero image that actually renders (light/dark pair —
      // one of them is display:none and must not be treated as a collider).
      let logoRect = null
      let logoEl = null
      for (const img of [...heroEl.querySelectorAll('img')]) {
        const r = img.getBoundingClientRect()
        if (r.width > 4 && r.height > 4 && img.getClientRects().length > 0) {
          logoRect = toHeroRect(r, heroBox)
          logoEl = img
          break
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
      // bounds of the visible logo art. The hero logos are bare <img>
      // elements (no wrapper div) with object-cover, so the element rect IS
      // the painted bounds — verified here rather than assumed.
      const boundKey = logoRect
        ? `${logoRect.left.toFixed(1)},${logoRect.top.toFixed(1)} ${(logoRect.right - logoRect.left).toFixed(1)}x${(logoRect.bottom - logoRect.top).toFixed(1)}`
        : 'none'
      if (boundKey !== lastLogoBoundKey) {
        lastLogoBoundKey = boundKey
        console.info(
          `[BirdPets] logo bounds measured=${boundKey}` +
            ` elementRect=${logoEl ? `${logoEl.getBoundingClientRect().width.toFixed(1)}x${logoEl.getBoundingClientRect().height.toFixed(1)}` : 'n/a'}` +
            ` natural=${logoEl ? `${logoEl.naturalWidth}x${logoEl.naturalHeight}` : 'n/a'}` +
            ' (hero logo is a bare object-cover <img>: element rect == painted bounds unless the source has transparent padding)'
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

      const metrics = {
        heroW: heroBox.width,
        heroH: heroBox.height,
        headlineRects,
        logoRect,
        buttonRects,
        capTrim,
        perchPoints,
        isDesktop,
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

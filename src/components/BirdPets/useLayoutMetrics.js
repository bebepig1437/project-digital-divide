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
      if (markEl) {
        const range = document.createRange()
        range.selectNodeContents(markEl)
        const rects = [...range.getClientRects()]
          .filter((r) => r.width > 1 && r.height > 1)
          .map((r) => toHeroRect(r, heroBox))
        if (rects.length) headlineRects = rects
      }

      // Logo: the first hero image that actually renders (light/dark pair —
      // one of them is display:none and must not be treated as a collider).
      let logoRect = null
      for (const img of [...heroEl.querySelectorAll('img')]) {
        const r = img.getBoundingClientRect()
        if (r.width > 4 && r.height > 4 && img.getClientRects().length > 0) {
          logoRect = toHeroRect(r, heroBox)
          break
        }
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

import { useEffect, useRef } from 'react'

const DESKTOP_MQ = '(min-width: 640px)'
const PERCH_FRACS_DESKTOP = [0.08, 0.25, 0.42, 0.58, 0.75, 0.92]
const PERCH_FRACS_MOBILE = [0.15, 0.5, 0.85]

/**
 * useLayoutMetrics — measures hitboxes (headline lines, logo, buttons) and
 * calculates headline perch points where birds sit.
 */
export default function useLayoutMetrics({ containerRef, landmarkRef, onUpdateRef }) {
  const metricsRef = useRef(null)

  useEffect(() => {
    const heroEl = containerRef?.current
    if (!heroEl) return undefined

    let disposed = false
    let debounceId = 0
    let padOverlay = null
    const mq = window.matchMedia(DESKTOP_MQ)
    let isDesktop = mq.matches
    const debugPads = new URLSearchParams(window.location.search).has('birds-debug-pads')

    const toHeroRect = (r, heroBox) => ({
      left: r.left - heroBox.left,
      right: r.right - heroBox.left,
      top: r.top - heroBox.top,
      bottom: r.bottom - heroBox.top,
      width: r.width,
      height: r.height,
    })

    const measure = () => {
      if (disposed) return
      const heroBox = heroEl.getBoundingClientRect()
      if (heroBox.width <= 0 || heroBox.height <= 0) return
      isDesktop = mq.matches

      // 1. Headline hitboxes (per-line rects via Range)
      const markEl = landmarkRef?.current || heroEl.querySelector('h1')
      let headlineRects = []
      let capTrim = 0

      if (markEl) {
        const range = document.createRange()
        range.selectNodeContents(markEl)
        const raw = [...range.getClientRects()]
          .filter((r) => r.width > 1 && r.height > 1)
          .map((r) => toHeroRect(r, heroBox))

        try {
          const st = getComputedStyle(markEl)
          const ctx2d = document.createElement('canvas').getContext('2d')
          ctx2d.font = `${st.fontStyle} ${st.fontWeight} ${st.fontSize} ${st.fontFamily}`
          const mt = ctx2d.measureText('PH')
          const fontAsc = mt.fontBoundingBoxAscent
          const inkAsc = mt.actualBoundingBoxAscent
          if (typeof fontAsc === 'number' && typeof inkAsc === 'number' && fontAsc > inkAsc && inkAsc > 0) {
            capTrim = Math.max(0, fontAsc - inkAsc)
          }
        } catch {
          capTrim = 0
        }

        const lines = []
        for (const r of raw) {
          const line = lines.find((l) => Math.abs(l.top - r.top) < 1 && Math.abs(l.bottom - r.bottom) < 1)
          if (line) {
            line.left = Math.min(line.left, r.left)
            line.right = Math.max(line.right, r.right)
            line.width = line.right - line.left
          } else {
            lines.push({ ...r })
          }
        }
        headlineRects = lines.map((r) => ({
          ...r,
          top: r.top + capTrim,
          height: r.height - capTrim,
        }))
      }

      // 2. Perch points along the top edge of the first headline line
      let perchPoints = []
      if (headlineRects.length > 0) {
        const line = headlineRects[0]
        const fracs = isDesktop ? PERCH_FRACS_DESKTOP : PERCH_FRACS_MOBILE
        perchPoints = fracs.map((f) => ({
          x: line.left + f * (line.right - line.left),
          y: line.top,
        }))
      }

      // 3. Logo hitbox
      let logoRect = null
      for (const img of heroEl.querySelectorAll('img')) {
        const r = img.getBoundingClientRect()
        if (r.width > 4 && r.height > 4 && img.getClientRects().length > 0) {
          logoRect = toHeroRect(r, heroBox)
          break
        }
      }

      // 4. Button hitboxes
      const buttonRects = [...heroEl.querySelectorAll('a, button')]
        .filter((el) => {
          if (!el.getClientRects().length) return false
          const r = el.getBoundingClientRect()
          return r.width > 20 && r.height > 16
        })
        .map((el) => toHeroRect(el.getBoundingClientRect(), heroBox))

      metricsRef.current = {
        heroW: heroBox.width,
        heroH: heroBox.height,
        headlineRects,
        logoRect,
        buttonRects,
        perchPoints,
        isDesktop,
      }

      // Debug overlay for hitboxes if ?birds-debug-pads is enabled
      if (debugPads) {
        if (!padOverlay) {
          padOverlay = document.createElement('div')
          padOverlay.className = 'pdd-headline-pads'
          padOverlay.setAttribute('aria-hidden', 'true')
          padOverlay.style.cssText = 'position:absolute;inset:0;pointer-events:none;z-index:31'
          heroEl.appendChild(padOverlay)
        }
        const boxes = [
          ...headlineRects.map((r, i) => ({ ...r, label: `headline-${i}`, border: '1px solid #ef4444' })),
          ...(logoRect ? [{ ...logoRect, label: 'logo', border: '1px solid #3b82f6' }] : []),
          ...buttonRects.map((r, i) => ({ ...r, label: `button-${i}`, border: '1px solid #10b981' })),
        ]
        padOverlay.replaceChildren(
          ...boxes.map((b) => {
            const el = document.createElement('div')
            el.dataset.pad = b.label
            el.style.cssText = `position:absolute;box-sizing:border-box;left:${b.left}px;top:${b.top}px;width:${b.width}px;height:${b.height}px;border:${b.border}`
            return el
          })
        )
      }

      onUpdateRef?.current?.(metricsRef.current)
    }

    const scheduleMeasure = () => {
      clearTimeout(debounceId)
      debounceId = setTimeout(measure, 50)
    }

    measure()
    const ro = new ResizeObserver(scheduleMeasure)
    ro.observe(heroEl)
    window.addEventListener('resize', scheduleMeasure)
    document.fonts?.ready?.then(scheduleMeasure)
    const settleTimer = setTimeout(measure, 1000)

    return () => {
      disposed = true
      clearTimeout(debounceId)
      clearTimeout(settleTimer)
      ro.disconnect()
      window.removeEventListener('resize', scheduleMeasure)
      padOverlay?.remove()
    }
  }, [containerRef, landmarkRef, onUpdateRef])

  return metricsRef
}

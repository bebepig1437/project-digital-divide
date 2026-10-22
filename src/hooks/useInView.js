import { useEffect, useRef, useState } from 'react'

// Returns [ref, inView]. Reveals fire once when the element first scrolls
// into view and stay revealed afterwards, so content does not re-fade
// every time it scrolls back on screen.
export function useInView(options = { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }) {
  const ref = useRef(null)
  const [inView, setInView] = useState(false)

  useEffect(() => {
    const node = ref.current
    if (!node) return

    // If IntersectionObserver is unavailable, just show the content.
    if (typeof IntersectionObserver === 'undefined') {
      setInView(true)
      return
    }

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setInView(true)
        observer.unobserve(node) // one-shot: no re-fade on scroll-up
      }
    }, options)

    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  return [ref, inView]
}

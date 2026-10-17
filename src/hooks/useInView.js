import { useEffect, useRef, useState } from 'react'

// Returns [ref, inView]. `inView` updates dynamically when the element
// enters and exits the viewport so reveals re-trigger smoothly on scroll up and down.
export function useInView(options = { threshold: 0.12, rootMargin: '0px 0px -50px 0px' }) {
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
      setInView(entry.isIntersecting)
    }, options)

    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  return [ref, inView]
}

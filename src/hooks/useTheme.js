import { useCallback, useEffect, useState } from 'react'

const STORAGE_KEY = 'pdd:theme'
const VALID = new Set(['light', 'dark'])

// Keep this logic in sync with the inline script in index.html.
function readPreference() {
  try {
    const value = localStorage.getItem(STORAGE_KEY)
    if (value && VALID.has(value)) return value
  } catch {
    // Storage unavailable (private mode, blocked cookies): fall back to light.
  }
  return 'light'
}

export function applyTheme(theme) {
  const dark = theme === 'dark'
  const root = document.documentElement
  root.classList.toggle('dark', dark)
  root.style.colorScheme = dark ? 'dark' : 'light'

  const meta = document.querySelector('meta[name="theme-color"]')
  if (meta) meta.content = dark ? '#0F1A21' : '#ffffff'
}

/**
 * Site theme: a light/dark preference persisted to localStorage.
 * Default is light; the browser/O-S preference is not followed until the
 * visitor explicitly toggles.
 */
export default function useTheme() {
  const [theme, setTheme] = useState(readPreference)

  useEffect(() => {
    applyTheme(theme)
    try {
      localStorage.setItem(STORAGE_KEY, theme)
    } catch {
      // Persisting is best-effort; the theme still applies for this view.
    }
  }, [theme])

  const toggle = useCallback(() => {
    setTheme((t) => (t === 'dark' ? 'light' : 'dark'))
  }, [])

  return [theme, toggle]
}

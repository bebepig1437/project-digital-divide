import { Moon, Sun } from 'lucide-react'

export default function ThemeToggle({ theme, onToggle, className = '' }) {
  const dark = theme === 'dark'
  const label = dark ? 'Switch to light mode' : 'Switch to dark mode'
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={label}
      aria-pressed={dark}
      title={label}
      className={`rounded-full p-2 text-heading transition hover:bg-brand-pale/40 hover:text-brand-teal focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-cyan ${className}`}
    >
      {dark ? <Sun size={20} /> : <Moon size={20} />}
    </button>
  )
}

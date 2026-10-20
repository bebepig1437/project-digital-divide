import { useState, useEffect } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { Menu, X } from 'lucide-react'
import { site } from '../config'
import useTheme from '../hooks/useTheme'
import ThemeToggle from './ThemeToggle'

const links = [
  { to: '/', label: 'Home' },
  { to: '/about', label: 'About Us' },
  { to: '/newsletter', label: 'Newsletter' },
]

export default function Navbar() {
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [theme, toggleTheme] = useTheme()
  const location = useLocation()

  useEffect(() => setOpen(false), [location.pathname])

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header
      className={[
        'sticky top-0 z-50 transition-colors duration-300',
        scrolled
          ? 'border-b border-line/10 bg-surface/95 backdrop-blur-md shadow-sm'
          : 'border-b border-transparent bg-transparent',
      ].join(' ')}
    >
      <nav className="container-content flex h-16 items-center justify-between md:h-20">
        <Link to="/" className="flex items-center gap-2.5 -ml-0.5 sm:-ml-2 md:-ml-4 lg:-ml-7 transition-transform hover:opacity-90">
          <img src="/logo.webp" alt="Project Digital Divide logo" className="h-9 w-9 rounded-md object-contain md:h-11 md:w-11 dark:hidden" />
          <img src="/logo-dark.jpeg" alt="Project Digital Divide logo" className="h-9 w-9 rounded-md object-contain md:h-11 md:w-11 hidden dark:block" />
          <span className="font-display text-base font-bold leading-tight text-heading md:text-lg">
            Project Digital Divide
          </span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden items-center gap-8 md:flex -mr-0.5 sm:-mr-2 md:-mr-4 lg:-mr-7">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.to === '/'}
              className={({ isActive }) =>
                [
                  'text-sm font-medium transition-colors',
                  isActive ? 'text-brand-teal font-semibold dark:text-brand-cyan' : 'text-heading/75 hover:text-heading',
                ].join(' ')
              }
            >
              {l.label}
            </NavLink>
          ))}
          <ThemeToggle theme={theme} onToggle={toggleTheme} />
          <Link to="/volunteer" className="btn-primary px-5 py-2.5">
            Volunteer
          </Link>
        </div>

        {/* Mobile toggle */}
        {/* Mobile controls: theme + menu toggle */}
        <div className="flex items-center gap-1 md:hidden -mr-0.5 sm:-mr-2">
          <ThemeToggle theme={theme} onToggle={toggleTheme} />
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="rounded-lg p-2 text-heading"
            aria-label={open ? 'Close menu' : 'Open menu'}
            aria-expanded={open}
          >
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </nav>

      {/* Mobile menu */}
      {open && (
        <div className="border-t border-line/10 bg-surface shadow-lg md:hidden">
          <div className="container-content flex flex-col gap-1 py-4">
            {links.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                end={l.to === '/'}
                className={({ isActive }) =>
                  [
                    'rounded-lg px-3 py-2.5 text-base font-medium',
                    isActive ? 'bg-brand-pale/35 text-brand-teal font-semibold dark:text-brand-cyan' : 'text-heading/80 hover:bg-brand-pale/15',
                  ].join(' ')
                }
              >
                {l.label}
              </NavLink>
            ))}
            <Link to="/volunteer" className="btn-primary mt-2 w-full">
              Volunteer
            </Link>
          </div>
        </div>
      )}
    </header>
  )
}

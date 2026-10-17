import { useState, useEffect } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { Menu, X } from 'lucide-react'
import { site } from '../config'

const links = [
  { to: '/', label: 'Home' },
  { to: '/about', label: 'About Us' },
  { to: '/newsletter', label: 'Newsletter' },
]

export default function Navbar() {
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
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
          ? 'border-b border-brand-slate/10 bg-white/90 backdrop-blur-md shadow-sm'
          : 'border-b border-transparent bg-white/0',
      ].join(' ')}
    >
      <nav className="container-content flex h-16 items-center justify-between md:h-20">
        <Link to="/" className="flex items-center gap-2.5 -ml-0.5 sm:-ml-2 md:-ml-4 lg:-ml-7 transition-transform hover:opacity-90">
          <img src="/logo.webp" alt="Project Digital Divide logo" className="h-9 w-9 rounded-md object-contain md:h-11 md:w-11" />
          <span className="font-display text-base font-bold leading-tight text-brand-slate md:text-lg">
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
                  isActive ? 'text-brand-teal font-semibold' : 'text-brand-slate/75 hover:text-brand-slate',
                ].join(' ')
              }
            >
              {l.label}
            </NavLink>
          ))}
          <Link to="/volunteer" className="btn-primary px-5 py-2.5">
            Volunteer
          </Link>
        </div>

        {/* Mobile toggle */}
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="rounded-lg p-2 text-brand-slate md:hidden -mr-0.5 sm:-mr-2"
          aria-label={open ? 'Close menu' : 'Open menu'}
          aria-expanded={open}
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </nav>

      {/* Mobile menu */}
      {open && (
        <div className="border-t border-brand-slate/10 bg-white shadow-lg md:hidden">
          <div className="container-content flex flex-col gap-1 py-4">
            {links.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                end={l.to === '/'}
                className={({ isActive }) =>
                  [
                    'rounded-lg px-3 py-2.5 text-base font-medium',
                    isActive ? 'bg-brand-pale/35 text-brand-teal font-semibold' : 'text-brand-slate/80 hover:bg-brand-pale/15',
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

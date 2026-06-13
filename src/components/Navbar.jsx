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
          ? 'border-b border-navy/10 bg-cream/85 backdrop-blur-md'
          : 'border-b border-transparent bg-cream/0',
      ].join(' ')}
    >
      <nav className="container-content flex h-16 items-center justify-between md:h-20">
        <Link to="/" className="flex items-center gap-2.5">
          <img src="/logo.webp" alt="" className="h-9 w-9 rounded-md object-contain md:h-11 md:w-11" />
          <span className="font-display text-base font-bold leading-tight text-navy md:text-lg">
            Project Digital Divide
          </span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden items-center gap-8 md:flex">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.to === '/'}
              className={({ isActive }) =>
                [
                  'text-sm font-medium transition-colors',
                  isActive ? 'text-teal-700' : 'text-navy/70 hover:text-navy',
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
          className="rounded-lg p-2 text-navy md:hidden"
          aria-label={open ? 'Close menu' : 'Open menu'}
          aria-expanded={open}
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </nav>

      {/* Mobile menu */}
      {open && (
        <div className="border-t border-navy/10 bg-cream md:hidden">
          <div className="container-content flex flex-col gap-1 py-4">
            {links.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                end={l.to === '/'}
                className={({ isActive }) =>
                  [
                    'rounded-lg px-3 py-2.5 text-base font-medium',
                    isActive ? 'bg-teal/10 text-teal-700' : 'text-navy/80 hover:bg-navy-50',
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

import { Link, useLocation } from 'react-router-dom'
import { Mail, Instagram } from 'lucide-react'
import { site } from '../config'
import ContactForm from './ContactForm'
import Reveal from './Reveal'

const contactCopy = {
  '/about': {
    title: 'Join us or reach out',
    body: "Want to donate spare gear, host a workshop in your town, or partner with us? Send a note and we'll reply shortly",
  },
  default: {
    title: "Let's get more people connected",
    body: "Want to donate old hardware, host a digital skills workshop, or partner on a project? Drop us a note and we'll get back to you.",
  },
}

export default function Footer({ showContact = true, contactTitle, contactBody }) {
  const { pathname } = useLocation()
  const content = contactCopy[pathname] || contactCopy.default
  const title = contactTitle || content.title
  const body = contactBody || content.body

  return (
    <>
      {showContact && (
        <section id="contact" className="border-t border-navy/10 bg-navy-50/40 py-20">
          <div className="container-content grid gap-10 lg:grid-cols-2 lg:items-start">
            <Reveal>
              <span className="eyebrow">Get in touch</span>
              <h2 className="mt-4 text-3xl sm:text-4xl">{title}</h2>
              <p className="mt-4 max-w-md text-lg text-muted">
                {body}
              </p>
              <a href={`mailto:${site.email}`} className="mt-6 inline-flex items-center gap-2 font-medium text-navy hover:text-teal">
                <Mail size={18} /> {site.email}
              </a>
            </Reveal>
            <Reveal delay={100}>
              <ContactForm />
            </Reveal>
          </div>
        </section>
      )}

      <footer className="bg-navy text-cream">
        <div className="container-content flex flex-col gap-8 py-12 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <img src="/logo.webp" alt="" className="h-11 w-11 rounded-md bg-white/95 object-contain p-0.5" />
            <div>
              <p className="font-display text-lg font-bold">Project Digital Divide</p>
              <p className="text-sm text-cream/60">Student-led and community-powered</p>
            </div>
          </div>

          <nav className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-cream/80">
            <Link to="/" className="hover:text-white">Home</Link>
            <Link to="/about" className="hover:text-white">About Us</Link>
            <Link to="/newsletter" className="hover:text-white">Newsletter</Link>
            <Link to="/volunteer" className="hover:text-white">Volunteer</Link>
          </nav>

          <div className="flex items-center gap-4">
            <a href={`mailto:${site.email}`} aria-label="Email" className="rounded-full bg-white/10 p-2.5 transition hover:bg-teal">
              <Mail size={18} />
            </a>
            <a href={site.socials.instagram} target="_blank" rel="noreferrer" aria-label="Instagram" className="rounded-full bg-white/10 p-2.5 transition hover:bg-teal">
              <Instagram size={18} />
            </a>
          </div>
        </div>
        <div className="border-t border-white/10">
          <div className="container-content py-5 text-center text-xs text-cream/50">
            © {new Date().getFullYear()} Project Digital Divide. All rights reserved.
          </div>
        </div>
      </footer>
    </>
  )
}

import { Link } from 'react-router-dom'
import { Mail, Instagram, Github } from 'lucide-react'
import { site } from '../config'
import ContactForm from './ContactForm'
import Reveal from './Reveal'

export default function Footer({ showContact = true }) {
  return (
    <>
      {showContact && (
        <section id="contact" className="border-t border-line/10 bg-surface py-20">
          <div className="container-content grid gap-10 lg:grid-cols-2 lg:items-start">
            <Reveal>
              <span className="eyebrow">Get in touch</span>
              <h2 className="mt-4 text-3xl font-bold text-heading sm:text-4xl">Send us a note</h2>
              <p className="mt-4 max-w-md text-lg text-muted">
                Donate a laptop or supplies, request a device for a student, host a workshop, or
                volunteer. Anything useful helps. If you'd rather pick something specific, our{' '}
                <a
                  href="https://www.amazon.com/hz/wishlist/ls/2BSB1I7207W2K?ref_=wl_share"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-brand-teal hover:underline dark:text-brand-cyan"
                >
                  Amazon wishlist
                </a>{' '}
                has the small stuff we go through fastest. Tell us what you've got and we'll reply by
                email.
              </p>
              <p className="mt-4 max-w-md text-sm text-muted">
                Don't include a student's name or school in this form. We'll ask for that by email
                once we've replied.
              </p>
            </Reveal>
            <Reveal delay={100}>
              <ContactForm />
            </Reveal>
          </div>
        </section>
      )}

      <footer className="bg-brand-slate dark:bg-[#0B141C] text-white">
        <div className="container-content flex flex-col gap-8 py-12 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <img src="/logo.webp" alt="Project Digital Divide logo" className="h-11 w-11 rounded-md bg-white object-contain p-0.5 shadow-sm dark:bg-transparent dark:shadow-none dark:hidden" />
            <img src="/logo-dark.jpeg" alt="Project Digital Divide logo" className="h-11 w-11 rounded-md object-contain p-0.5 hidden dark:block" />
            <div>
              <p className="font-display text-lg font-bold text-white">Project Digital Divide</p>
              <p className="text-sm text-brand-pale/80">Student-led in Pearland, TX · Serving Greater Houston</p>
            </div>
          </div>

          <nav className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-white/80">
            <Link to="/" className="hover:text-white transition-colors">Home</Link>
            <Link to="/about" className="hover:text-white transition-colors">About Us</Link>
            <Link to="/newsletter" className="hover:text-white transition-colors">Newsletter</Link>
            <Link to="/volunteer" className="hover:text-white transition-colors">Volunteer</Link>
          </nav>

          <div className="flex items-center gap-3">
            <a href={`mailto:${site.email}`} aria-label="Email" className="rounded-full bg-white/10 p-2 transition hover:bg-brand-cyan hover:text-heading dark:hover:text-navy-950">
              <Mail size={16} />
            </a>
            <a href={site.socials.instagram} target="_blank" rel="noreferrer" aria-label="Instagram" className="rounded-full bg-white/10 p-2 transition hover:bg-brand-cyan hover:text-heading dark:hover:text-navy-950">
              <Instagram size={16} />
            </a>
            <a href="https://github.com/bebepig1437/project-digital-divide" target="_blank" rel="noreferrer" aria-label="GitHub" className="rounded-full bg-white/10 p-2 transition hover:bg-brand-cyan hover:text-heading dark:hover:text-navy-950">
              <Github size={16} />
            </a>
          </div>
        </div>
        <div className="border-t border-white/10">
          <div className="container-content py-5 text-center text-xs text-white/50">
            © {new Date().getFullYear()} Project Digital Divide. All rights reserved.
          </div>
        </div>
      </footer>
    </>
  )
}

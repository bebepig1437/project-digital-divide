import { useRef } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { ArrowRight, Check } from 'lucide-react'
import { Helmet } from 'react-helmet-async'
import BirdFlock from '../components/BirdFlock'
import GlassImpactLedger from '../components/GlassImpactLedger'
import HardwareAcceptanceMatrix from '../components/HardwareAcceptanceMatrix'
import Reveal from '../components/Reveal'

const siteUrl = 'https://www.projectdigitaldivide.org'
const logoUrl = `${siteUrl}/logo.webp`

const objectives = [
  'Get retired laptops from school districts',
  'Set up light, simple software for schoolwork',
  'Run workshops where students set up their own laptop',
  'Work with school counselors to reach students',
  'Log every laptop so other groups can copy our process',
]

export default function Home() {
  const heroRef = useRef(null)
  const h1Ref = useRef(null)
  const { search } = useLocation()
  const birdCount = new URLSearchParams(search).get('birds') === '4' ? 4 : 2

  const meta = [
    { property: 'og:type', content: 'website' },
    { property: 'og:url', content: siteUrl },
    { property: 'og:image', content: logoUrl },
    { name: 'twitter:card', content: 'summary' },
    { name: 'twitter:image', content: logoUrl },
  ]

  return (
    <>
      <Helmet>
        <title>Project Digital Divide | Houston's Student-Run Laptop Program in Pearland, TX</title>
        <meta name="description" content="Houston-area student-run project in Pearland, Texas, taking laptops retired by school districts, setting them up with lightweight software, and getting them to students who need a computer at home — at no cost to families." />
        {meta.map((m, i) => (
          <meta key={i} {...m} />
        ))}
        <link rel="canonical" href="https://www.projectdigitaldivide.org/" />
        <meta name="twitter:title" content="Project Digital Divide | Houston's Student-Run Laptop Program" />
        <meta name="twitter:description" content="Houston-area student-run project in Pearland, Texas, taking laptops retired by school districts, setting them up with lightweight software, and getting them to students who need a computer at home — at no cost to families." />
      </Helmet>
      {/* ---- Banner (Hero) ---- */}
      <section ref={heroRef} className="hero-banner-bg relative overflow-hidden text-white">
        <BirdFlock heroRef={heroRef} h1Ref={h1Ref} count={birdCount} />
        <div className="container-content relative z-10 py-20 text-center sm:py-28">

          <img
            src="/PDD2048light.jpg"
            alt="Project Digital Divide logo"
            className="hero-reveal hero-logo mx-auto mb-8 h-28 w-28 rounded-2xl object-cover shadow-xl dark:shadow-none transition-transform duration-300 hover:scale-105 dark:hidden"
          />
          <img
            src="/PDD2048dark.jpeg"
            alt="Project Digital Divide logo"
            className="hero-reveal hero-logo mx-auto mb-8 h-28 w-28 rounded-2xl object-cover transition-transform duration-300 hover:scale-105 hidden dark:block"
          />
          <h1
            ref={h1Ref}
            className="hero-reveal relative mx-auto w-fit max-w-3xl text-4xl font-extrabold leading-tight tracking-tight text-white sm:text-5xl md:text-6xl"
          >
            Project Digital Divide
          </h1>
          <p className="hero-reveal mx-auto mt-5 max-w-xl text-lg leading-relaxed text-white/90">
            A student-run project that deploys reconditioned laptops to families across Houston.
          </p>
          <div className="hero-reveal mt-9 flex flex-wrap items-center justify-center gap-4">
            <Link
              to="/volunteer"
              className="inline-flex items-center gap-2 rounded-full bg-white px-7 py-3 text-sm font-semibold text-navy-900 shadow-md transition-all duration-200 hover:bg-brand-pale hover:shadow-lg hover:-translate-y-0.5 dark:bg-brand-cyan dark:text-navy-950 dark:hover:bg-brand-pale"
            >
              Get involved <ArrowRight size={16} />
            </Link>
            <a
              href="#mission"
              className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-6 py-3 text-sm font-semibold text-white backdrop-blur-md transition-all duration-200 hover:bg-white/20 hover:border-white/40"
            >
              Learn more
            </a>
          </div>
        </div>
      </section>

      {/* ---- Mission & Objectives ---- */}
      <section id="mission" className="bg-canvas py-20 sm:py-28">
        <div className="container-content grid gap-12 lg:grid-cols-[1.4fr_1fr] lg:items-center lg:gap-16">
          <Reveal>
            <span className="eyebrow">The problem</span>
            <h2 className="mt-4 text-3xl font-bold text-heading sm:text-4xl">
Laptops sit in closets while students go without. We <span className="text-gradient">connect the two.</span>
            </h2>
            <div className="mt-6 space-y-4 text-lg leading-relaxed text-muted">
              <p>
                School districts replace laptops on a three to five year cycle. When the cycle ends, working machines get resold or recycled. A few miles away, students do homework on parents' phones because school-issued devices stay at school and there is no computer at home.
              </p>
              <p>
Most retired laptops still work. Getting one ready for a ninth grader mostly means setting it up. We clean each one, install simple software, and get it to a student through workshops and school counselors.
              </p>
            </div>

          </Reveal>

          <Reveal delay={120}>
            <div className="relative overflow-hidden rounded-3xl border border-line/15 bg-brand-pale/15 p-7 shadow-sm transition-all duration-300 hover:shadow-md sm:p-8">
              <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-brand-slate via-brand-teal to-brand-cyan" />
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-heading">What we do</h3>
              </div>
              <ul className="mt-5 space-y-3.5">
                {objectives.map((o) => (
                  <li key={o} className="flex gap-3 text-[15px] text-ink">
                    <span className="mt-0.5 flex h-5 w-5 flex-none items-center justify-center rounded-full bg-brand-teal/15 text-brand-teal shadow-xs">
                      <Check size={13} strokeWidth={3} />
                    </span>
                    <span>{o}</span>
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ---- Element 1: Frosted Glass Impact Ledger (Operational Scale) ---- */}
      <GlassImpactLedger />

      {/* ---- Element 2: Accepted Hardware & Distribution Matrix ---- */}
      <HardwareAcceptanceMatrix />
    </>
  )
}

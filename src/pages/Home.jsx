import { useRef } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { ArrowRight, Check } from 'lucide-react'
import { Helmet } from 'react-helmet-async'
import BirdPets from '../components/BirdPets/BirdPets.jsx'
import GlassImpactLedger from '../components/GlassImpactLedger'
import HardwareAcceptanceMatrix from '../components/HardwareAcceptanceMatrix'
import Reveal from '../components/Reveal'

const siteUrl = 'https://www.projectdigitaldivide.org'
const logoUrl = `${siteUrl}/logo.webp`

const objectives = [
  'We pick up retired laptops from school districts',
  'We wipe them and install light software that runs on older machines',
  'Students learn to set up a laptop at our workshops',
  'Counselors tell us which families need one',
  'We keep notes on every step so others can repeat it',
]

export default function Home() {
  const heroRef = useRef(null)
  const h1Ref = useRef(null)
  const { search } = useLocation()
  // Flock size: 2 by default; ?birds=N accepts 1–8 (clamped, out-of-range
  // values log a warning). Small screens clamp to 2 inside BirdPets.
  let birdCount = 2
  const params = new URLSearchParams(search)
  const birdsParam = params.get('birds')
  if (birdsParam !== null) {
    const n = Number.parseInt(birdsParam, 10)
    if (Number.isNaN(n)) {
      console.warn(`[birdPets] ?birds=${birdsParam} is not a number; using 2`)
    } else {
      const clamped = Math.min(8, Math.max(1, n))
      if (clamped !== n) console.warn(`[birdPets] ?birds=${n} out of range 1-8; using ${clamped}`)
      birdCount = clamped
    }
  }

  // ?birds-seed=N accepts a non-negative decimal integer only; 1e3, 0x10, +5,
  // -1, 1.5 and non-numeric values all fall back to Math.random.
  const seedParam = params.get('birds-seed')
  const seedValue = seedParam && /^\d+$/.test(seedParam) ? Number(seedParam) : NaN
  const birdSeed =
    Number.isSafeInteger(seedValue) && seedValue <= 0xffffffff ? seedValue : null

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
        <BirdPets containerRef={heroRef} landmarkRef={h1Ref} count={birdCount} seed={birdSeed} />
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
            Three high schoolers in Pearland who fix up old school laptops and get them to kids in Houston who need one.
          </p>
          <div className="hero-reveal mt-9 flex flex-wrap items-center justify-center gap-4">
            <Link
              to="/volunteer"
              className="inline-flex items-center gap-2 rounded-full bg-white px-7 py-3 text-sm font-semibold text-navy-900 shadow-md transition-all duration-200 hover:bg-brand-pale hover:shadow-lg hover:-translate-y-0.5 dark:bg-brand-cyan dark:text-navy-950 dark:hover:bg-brand-pale"
            >
              Volunteer <ArrowRight size={16} />
            </Link>
            <Link
              to="/#contact"
              className="text-sm font-semibold text-white underline underline-offset-4 decoration-white/50 transition-colors duration-200 hover:decoration-white"
            >
              Contact us
            </Link>
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
                Districts replace laptops every few years, and good ones often get sold or recycled. Meanwhile, some kids nearby do their homework on a parent's phone.
              </p>
              <p>
Most of them still work. We clean them, set them up, and get them to students through counselors and workshops.
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

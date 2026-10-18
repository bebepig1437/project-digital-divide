import { Link } from 'react-router-dom'
import { ArrowRight, Check, Rocket } from 'lucide-react'
import GlassImpactLedger from '../components/GlassImpactLedger'
import HardwareAcceptanceMatrix from '../components/HardwareAcceptanceMatrix'
import Reveal from '../components/Reveal'

const objectives = [
  'Secure retired laptops from school district refresh cycles',
  'Configure lightweight software tuned for everyday schoolwork',
  'Run Build It, Keep It workshops where students set up their own machine',
  'Partner with school counselors for direct student referrals',
  'Log every machine to build a repeatable framework for other teams',
]

export default function Home() {
  const pilotFacts = [
    { label: 'Device model', value: 'Dell Latitude 3130' },
    { label: 'From', value: 'Alvin ISD Technology' },
    { label: 'Cost to students', value: '$0. Always.' },
    { label: 'Team size', value: '5 high school students' },
    { label: 'Reserve fleet', value: '20 units held back' },
  ]
  return (
    <>
      {/* ---- Banner (Hero with 6-point sampled horizontal gradient & dot grid) ---- */}
      <section className="hero-banner-bg relative overflow-hidden text-white">
        <div className="container-content relative py-20 text-center sm:py-28">

          <img
            src="/logo.webp"
            alt="Project Digital Divide logo"
            className="mx-auto mb-8 h-24 w-24 rounded-2xl bg-white object-contain p-1.5 shadow-xl transition-transform duration-300 hover:scale-105"
          />
          <h1 className="mx-auto max-w-3xl text-4xl font-extrabold leading-tight tracking-tight text-white sm:text-5xl md:text-6xl">
            Project Digital Divide
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-lg leading-relaxed text-white/90">
            A student-run project in Pearland, Texas. We take laptops retired by school districts, set them up with lightweight software, and get them to students who need a computer at home.
          </p>
          <div className="mt-9 flex flex-wrap items-center justify-center gap-4">
            <Link
              to="/volunteer"
              className="inline-flex items-center gap-2 rounded-full bg-white px-7 py-3 text-sm font-semibold text-brand-slate shadow-md transition-all duration-200 hover:bg-brand-pale hover:shadow-lg hover:-translate-y-0.5"
            >
              Get involved <ArrowRight size={16} />
            </Link>
            <a
              href="#mission"
              className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-6 py-3 text-sm font-semibold text-white backdrop-blur-md transition-all duration-200 hover:bg-white/20 hover:border-white/40"
            >
              See how it works
            </a>
          </div>
          <p className="mt-4 text-sm text-white/75 max-w-md mx-auto">
            Student-run. Zero cost to the families we serve. Built on a 100-unit pilot from Alvin ISD.
          </p>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-sm text-white/75">
            <Rocket size={14} className="text-brand-cyan" />
            <span className="text-brand-cyan">Pilot live</span>
          </div>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-4 text-sm text-white/75">
            {pilotFacts.map((f) => (
              <span key={f.label} className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1">
                <span className="text-brand-cyan">{f.label}</span>
                <span className="font-medium">{f.value}</span>
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ---- Mission & Objectives ---- */}
      <section id="mission" className="bg-white py-20 sm:py-28">
        <div className="container-content grid gap-12 lg:grid-cols-[1.4fr_1fr] lg:items-center lg:gap-16">
          <Reveal>
            <span className="eyebrow">The Problem &amp; The Bridge</span>
            <h2 className="mt-4 text-3xl font-bold text-brand-slate sm:text-4xl">
              The devices exist. The need exists. We build the <span className="text-gradient">logistics bridge</span> that connects them.
            </h2>
            <div className="mt-6 space-y-4 text-lg leading-relaxed text-muted">
              <p>
                School districts replace laptops on a three to five year cycle. When the cycle ends, working machines get resold or recycled. A few miles away, students do homework on parents' phones because school-issued devices stay at school and there is no computer at home.
              </p>
              <p>
                The gap between them is a logistics problem, not a technology problem. Most retired machines are in good physical condition. Getting them ready for a ninth grader is configuration, not heavy repair. We clean the hardware, install simple and responsive software, and place them with students through workshops and counselor partnerships.
              </p>
            </div>

            {/* Strategic Quote Callout */}
            <div className="mt-8 rounded-2xl border-l-4 border-brand-cyan bg-brand-pale/15 p-5 text-sm font-medium italic text-brand-slate sm:text-base">
              "The gap between surplus laptops and students without computers is a logistics bridge, not a technology problem."
            </div>
          </Reveal>

          <Reveal delay={120}>
            <div className="relative overflow-hidden rounded-3xl border border-brand-slate/15 bg-brand-pale/15 p-7 shadow-sm transition-all duration-300 hover:shadow-md sm:p-8">
              <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-brand-slate via-brand-teal to-brand-cyan" />
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-brand-slate">What we are building</h3>
                <span className="rounded-full border border-brand-teal/20 bg-brand-teal/10 px-2.5 py-0.5 font-mono text-xs font-semibold text-brand-teal">
                  Pilot Phase · 2026
                </span>
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

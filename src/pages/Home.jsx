import { Link } from 'react-router-dom'
import { ArrowRight, Check } from 'lucide-react'
import OperationsPipeline from '../components/OperationsPipeline'
import InteractiveBenchTerminal from '../components/InteractiveBenchTerminal'
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
  return (
    <>
      {/* ---- Banner (Hero with 6-point sampled horizontal gradient & dot grid) ---- */}
      <section className="hero-banner-bg relative overflow-hidden text-white">
        <div className="container-content relative py-20 text-center sm:py-28">
          <img
            src="/logo.webp"
            alt="Project Digital Divide logo"
            className="mx-auto mb-8 h-24 w-24 rounded-2xl bg-white object-contain p-1.5 shadow-xl"
          />
          <h1 className="mx-auto max-w-3xl text-4xl font-bold leading-tight text-white sm:text-5xl md:text-6xl">
            Project Digital Divide
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-lg text-white/90">
            A student-run project in Pearland, Texas. We take laptops retired by school districts, set them up with lightweight software, and get them to students who need a computer at home.
          </p>
          <div className="mt-9 flex flex-wrap items-center justify-center gap-4">
            <Link to="/volunteer" className="btn-secondary border-transparent bg-white text-brand-slate hover:bg-brand-pale hover:text-brand-slate transition shadow-sm">
              Get involved <ArrowRight size={16} />
            </Link>
            <a href="#mission" className="inline-flex items-center gap-2 text-sm font-semibold text-white/90 hover:text-white transition">
              See how it works
            </a>
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
          </Reveal>

          <Reveal delay={120}>
            <div className="rounded-3xl border border-brand-slate/10 bg-brand-pale/15 p-7 shadow-sm sm:p-8">
              <h3 className="text-lg font-bold text-brand-slate">What we are building</h3>
              <ul className="mt-5 space-y-3.5">
                {objectives.map((o) => (
                  <li key={o} className="flex gap-3 text-[15px] text-ink">
                    <span className="mt-0.5 flex h-5 w-5 flex-none items-center justify-center rounded-full bg-brand-teal/15 text-brand-teal">
                      <Check size={13} strokeWidth={3} />
                    </span>
                    {o}
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ---- Element 1: Glass Horizon Expander (Refurbishment Pipeline) ---- */}
      <OperationsPipeline />

      {/* ---- Element 2: Interactive Bench Terminal (Diagnostics & Telemetry) ---- */}
      <InteractiveBenchTerminal />

      {/* ---- Element 3: Frosted Glass Impact Ledger (Operational Scale) ---- */}
      <GlassImpactLedger />

      {/* ---- Element 4: Accepted Hardware & Triage Matrix (Donations & Salvage) ---- */}
      <HardwareAcceptanceMatrix />
    </>
  )
}

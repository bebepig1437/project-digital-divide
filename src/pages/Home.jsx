import { Link } from 'react-router-dom'
import { ArrowRight, Check } from 'lucide-react'
import OperationsPipeline from '../components/OperationsPipeline'
import InteractiveBenchTerminal from '../components/InteractiveBenchTerminal'
import GlassImpactLedger from '../components/GlassImpactLedger'
import HardwareAcceptanceMatrix from '../components/HardwareAcceptanceMatrix'
import Reveal from '../components/Reveal'

const objectives = [
  'Refurbish surplus hardware and keep usable tech out of landfills',
  'Host practical, hands-on software workshops for all ages',
  'Help local groups and non-profits switch to modern digital tools',
  'Spotlight connectivity and hardware gaps in our neighborhoods',
  'Build a lasting, student-run program that keeps running smoothly',
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
            A student project getting working computers, digital skills, and internet access to families in Pearland and Greater Houston without them
          </p>
          <div className="mt-9 flex flex-wrap items-center justify-center gap-4">
            <Link to="/volunteer" className="btn-secondary border-transparent bg-white text-brand-slate hover:bg-brand-pale hover:text-brand-slate transition shadow-sm">
              Get involved <ArrowRight size={16} />
            </Link>
            <a href="#mission" className="inline-flex items-center gap-2 text-sm font-semibold text-white/90 hover:text-white transition">
              Learn more
            </a>
          </div>
        </div>
      </section>

      {/* ---- Mission & Objectives ---- */}
      <section id="mission" className="bg-white py-20 sm:py-28">
        <div className="container-content grid gap-12 lg:grid-cols-[1.4fr_1fr] lg:items-center lg:gap-16">
          <Reveal>
            <span className="eyebrow">Our mission</span>
            <h2 className="mt-4 text-3xl font-bold text-brand-slate sm:text-4xl">
              We pair working computers with the <span className="text-gradient">practical skills</span> to actually use them
            </h2>
            <div className="mt-6 space-y-4 text-lg leading-relaxed text-muted">
              <p>
                We are a student-run team tackling the digital divide head-on. We collect used laptops and desktops, fix them up in our shop, and give them directly to local students and families who need a working machine.
              </p>
              <p>
                We run hands-on workshops on everyday computer skills, account security, and practical AI tools, and we help local non-profits modernize their day-to-day software. Hardware gets you online, but real confidence comes from knowing what to do once you're there.
              </p>
            </div>
          </Reveal>

          <Reveal delay={120}>
            <div className="rounded-3xl border border-brand-slate/10 bg-brand-pale/15 p-7 shadow-sm sm:p-8">
              <h3 className="text-lg font-bold text-brand-slate">What we're working toward</h3>
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

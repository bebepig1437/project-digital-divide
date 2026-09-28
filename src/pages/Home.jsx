import { Link } from 'react-router-dom'
import { ArrowRight, Check } from 'lucide-react'
import Pillars from '../components/Pillars'
import ImpactMetrics from '../components/ImpactMetrics'
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
      {/* ---- Banner (modest, info-forward) ---- */}
      <section className="relative overflow-hidden bg-brand-gradient">
        <div className="absolute inset-0 opacity-10 [background-image:radial-gradient(circle_at_1px_1px,white_1px,transparent_0)] [background-size:28px_28px]" />
        <div className="container-content relative py-20 text-center sm:py-28">
          <img
            src="/logo.webp"
            alt="Project Digital Divide logo"
            className="mx-auto mb-8 h-24 w-24 rounded-2xl bg-white/95 object-contain p-1.5 shadow-lg"
          />
          <h1 className="mx-auto max-w-3xl text-4xl font-bold leading-tight text-white sm:text-5xl md:text-6xl">
            Project Digital Divide
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-lg text-cream/85">
            A student project getting working computers, digital skills, and internet access to local families without them
          </p>
          <div className="mt-9 flex flex-wrap items-center justify-center gap-4">
            <Link to="/volunteer" className="btn-secondary border-transparent bg-white text-navy hover:bg-cream hover:text-navy">
              Get involved <ArrowRight size={16} />
            </Link>
            <a href="#mission" className="inline-flex items-center gap-2 text-sm font-semibold text-white/90 hover:text-white">
              Learn more
            </a>
          </div>
        </div>
      </section>

      {/* ---- Full mission ---- */}
      <section id="mission" className="bg-cream py-20 sm:py-28">
        <div className="container-content grid gap-12 lg:grid-cols-[1.4fr_1fr] lg:items-center lg:gap-16">
          <Reveal>
            <span className="eyebrow">Our mission</span>
            <h2 className="mt-4 text-3xl sm:text-4xl">
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
            <div className="rounded-2xl border border-navy/10 bg-white p-7 shadow-sm">
              <h3 className="text-lg">What we're working toward</h3>
              <ul className="mt-5 space-y-3.5">
                {objectives.map((o) => (
                  <li key={o} className="flex gap-3 text-[15px] text-ink">
                    <span className="mt-0.5 flex h-5 w-5 flex-none items-center justify-center rounded-full bg-teal/15 text-teal-700">
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

      {/* ---- Three pillars ---- */}
      <Pillars />

      {/* ---- Impact metrics (hidden until numbers are ready) ---- */}
      <ImpactMetrics />
    </>
  )
}

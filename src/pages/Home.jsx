import { Link } from 'react-router-dom'
import { ArrowRight, Check } from 'lucide-react'
import Pillars from '../components/Pillars'
import ImpactMetrics from '../components/ImpactMetrics'
import Reveal from '../components/Reveal'

const objectives = [
  'Redistribute surplus devices and help reduce e-waste',
  'Teach digital literacy with a hands-on approach for all ages',
  'Support organizations in their transition to modern digital tools',
  'Grow community awareness of the digital divide',
  'Build a sustainable, student-run model over time',
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
            A student-led initiative bringing devices, digital skills, and connectivity to
            the communities that need them most.
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
              We bridge the gap between <span className="text-gradient">access and ability</span>.
            </h2>
            <div className="mt-6 space-y-4 text-lg leading-relaxed text-muted">
              <p>
                Project Digital Divide is a student-led initiative aimed at bridging the
                digital gap through three different programs. We collect and give new life to
                computers and other gadgets by fixing them and then giving them to students,
                families, and members of the community.
              </p>
              <p>
                We run digital-skills courses covering computer basics, internet safety,
                productivity tools, and AI literacy. Beyond that, we help nonprofits, community
                groups, and small businesses adopt modern digital tools, from websites to AI
                workflows. We believe that providing access to technology is just the first
                step. The real challenge is equipping people with the skills to use it.
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

import { Cpu, HardDrive, Zap, CheckCircle2, Users, GraduationCap, Library, ShieldCheck, Sparkles } from 'lucide-react'
import { useInView } from '../hooks/useInView'

const specs = [
  {
    icon: Cpu,
    label: 'Processor',
    detail: 'Intel Pentium Silver, Celeron, or modern multi-core processors',
  },
  {
    icon: HardDrive,
    label: 'Memory & Drive',
    detail: '4GB+ RAM and working M.2 SSD or 2.5-inch SATA drive slots',
  },
  {
    icon: Zap,
    label: 'Power Delivery',
    detail: 'Matching OEM laptop AC charging bricks and power cords',
  },
  {
    icon: CheckCircle2,
    label: 'Physical Health',
    detail: 'Functional screens, responsive keyboards, and reliable battery capacity',
  },
  {
    icon: Sparkles,
    label: 'Target Baseline',
    detail: 'Dell Latitude 3130 and ruggedized district education series',
  },
]

const tracks = [
  {
    icon: Users,
    label: 'Build It, Keep It',
    detail: '3-hour interactive workshops where students set up and take home their machine',
  },
  {
    icon: GraduationCap,
    label: 'Counselor Referrals',
    detail: 'Direct donations through school staff who know household hardware needs firsthand',
  },
  {
    icon: Library,
    label: 'Community Lending',
    detail: '2-week loan rotations hosted in neighborhood community centers',
  },
  {
    icon: ShieldCheck,
    label: 'Reserve Fleet',
    detail: '20 units held back for quick troubleshooting, component swaps, and loaners',
  },
]

export default function HardwareAcceptanceMatrix() {
  const [ref, inView] = useInView()

  return (
    <section ref={ref} className="border-t border-brand-slate/10 bg-brand-pale/10 py-16 sm:py-24">
      <div className="container-content">
        <div className="mx-auto max-w-2xl text-center">
          <span className="eyebrow">Hardware &amp; Distribution</span>
          <h2 className="mt-4 text-3xl font-bold text-brand-slate sm:text-4xl">
            The hardware we take in and how it reaches students
          </h2>
          <p className="mt-3 text-base text-muted sm:text-lg">
            We focus on education laptops from district refreshes and test three distinct ways to place them in homes.
          </p>
        </div>

        <div className="mt-14 grid gap-8 md:grid-cols-2">
          {/* Card 1: What Gear Works Best */}
          <div
            className={[
              'relative flex flex-col justify-between overflow-hidden rounded-3xl border border-brand-slate/15 bg-white p-7 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-brand-teal/40 hover:shadow-lg sm:p-9',
              inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6',
            ].join(' ')}
          >
            <div className="absolute inset-x-0 top-0 h-1.5 bg-brand-cyan" />
            <div>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="rounded-full border border-brand-cyan/40 bg-brand-cyan/15 px-3 py-1 font-mono text-xs font-bold text-brand-slate">
                  HARDWARE PROFILE
                </span>
                <span className="font-mono text-xs font-semibold text-brand-teal">
                  ALVIN ISD &amp; DISTRICT SURPLUS
                </span>
              </div>

              <h3 className="mt-5 text-2xl font-bold text-brand-slate">
                What Gear Works Best
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                Education-market laptops from district refresh cycles with working screens, chargers, and batteries.
              </p>

              <div className="mt-6 space-y-3.5 border-t border-brand-slate/10 pt-6">
                {specs.map((item) => {
                  const Icon = item.icon
                  return (
                    <div key={item.label} className="flex items-start gap-3 rounded-xl border border-brand-slate/5 bg-brand-pale/10 p-3 transition-colors hover:border-brand-teal/20 hover:bg-brand-pale/20">
                      <span className="mt-0.5 flex h-7 w-7 flex-none items-center justify-center rounded-lg bg-brand-teal/15 text-brand-teal">
                        <Icon size={15} strokeWidth={2.2} />
                      </span>
                      <div>
                        <div className="text-xs font-bold uppercase tracking-wider text-brand-slate">
                          {item.label}
                        </div>
                        <div className="mt-0.5 text-xs font-medium text-brand-slate/85 sm:text-[13px]">
                          {item.detail}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="mt-8 rounded-2xl border border-brand-teal/15 bg-brand-pale/20 p-4 text-xs font-medium text-brand-slate/90">
              Focus: Laptops configured with lightweight software tailored for everyday schoolwork and web research.
            </div>
          </div>

          {/* Card 2: Three Distribution Models */}
          <div
            style={{ transitionDelay: '120ms' }}
            className={[
              'relative flex flex-col justify-between overflow-hidden rounded-3xl border border-brand-slate/15 bg-white p-7 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-brand-teal/40 hover:shadow-lg sm:p-9',
              inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6',
            ].join(' ')}
          >
            <div className="absolute inset-x-0 top-0 h-1.5 bg-brand-teal" />
            <div>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="rounded-full border border-brand-slate/20 bg-brand-slate/5 px-3 py-1 font-mono text-xs font-bold text-brand-slate">
                  PLACEMENT TRACKS
                </span>
                <span className="font-mono text-xs font-semibold text-brand-teal">
                  THREE TESTED MODELS
                </span>
              </div>

              <h3 className="mt-5 text-2xl font-bold text-brand-slate">
                How Devices Reach People
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                We test three parallel models and record which one keeps laptops in active use the longest.
              </p>

              <div className="mt-6 space-y-3.5 border-t border-brand-slate/10 pt-6">
                {tracks.map((item) => {
                  const Icon = item.icon
                  return (
                    <div key={item.label} className="flex items-start gap-3 rounded-xl border border-brand-slate/5 bg-brand-pale/10 p-3 transition-colors hover:border-brand-teal/20 hover:bg-brand-pale/20">
                      <span className="mt-0.5 flex h-7 w-7 flex-none items-center justify-center rounded-lg bg-brand-teal/15 text-brand-teal">
                        <Icon size={15} strokeWidth={2.2} />
                      </span>
                      <div>
                        <div className="text-xs font-bold uppercase tracking-wider text-brand-slate">
                          {item.label}
                        </div>
                        <div className="mt-0.5 text-xs font-medium text-brand-slate/85 sm:text-[13px]">
                          {item.detail}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="mt-8 rounded-2xl border border-brand-slate/10 bg-brand-slate/5 p-4 text-xs font-medium text-muted">
              Accountability: Every placement is logged to measure long-term device health and student use. $0 cost across all tracks.
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

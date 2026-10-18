import { Laptop, Target, Layers, HeartHandshake } from 'lucide-react'
import { useInView } from '../hooks/useInView'

const metrics = [
  {
    number: '100',
    label: 'Laptops Donated',
    tag: 'INITIAL BATCH',
    icon: Laptop,
    context: 'Dell Latitude 3130 fleet donated by Alvin ISD technology department',
  },
  {
    number: '60 to 90',
    label: 'Target Placed',
    tag: 'TARGET RANGE',
    icon: Target,
    context: 'Working computers in students\' hands by month ten of our timeline',
  },
  {
    number: '3',
    label: 'Distribution Models',
    tag: 'ACTIVE TRACKS',
    icon: Layers,
    context: 'Build workshops, school counselor referrals, and community lending libraries',
  },
  {
    number: '$0',
    label: 'Cost to Students',
    tag: 'GUARANTEE',
    icon: HeartHandshake,
    context: 'All laptops, chargers, and hands-on build sessions are completely free',
  },
]

export default function GlassImpactLedger() {
  const [ref, inView] = useInView()

  return (
    <section ref={ref} className="border-t border-brand-slate/10 bg-white py-16 sm:py-24">
      <div className="container-content">
        <div className="mx-auto max-w-2xl text-center">
          <span className="eyebrow">Project Goals</span>
          <h2 className="mt-4 text-3xl font-bold text-brand-slate sm:text-4xl">
            Concrete metrics we track and report
          </h2>
          <p className="mt-3 text-base text-muted sm:text-lg">
            Every laptop is logged from district pickup to student placement so we can measure yield rates and cost.
          </p>
        </div>

        {/* Frosted Glass Telemetry Ledger */}
        <div className="mt-14 rounded-3xl border border-brand-slate/15 bg-brand-pale/15 p-6 shadow-sm sm:p-10">
          {/* Operational Pipeline Flow Tracker */}
          <div className="mb-8 rounded-2xl border border-brand-slate/10 bg-white/80 p-4 shadow-2xs backdrop-blur-md">
            <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
              <span className="font-mono font-bold uppercase tracking-wider text-brand-slate">
                Placement Pipeline:
              </span>
              <div className="flex flex-wrap items-center gap-2 text-xs font-medium">
                <span className="rounded-lg border border-brand-slate/15 bg-brand-slate/5 px-2.5 py-1 text-brand-slate">
                  1. District Intake (100)
                </span>
                <span className="font-bold text-brand-teal">→</span>
                <span className="rounded-lg border border-brand-teal/20 bg-brand-teal/10 px-2.5 py-1 text-brand-teal font-semibold">
                  2. Bench Setup &amp; QA
                </span>
                <span className="font-bold text-brand-teal">→</span>
                <span className="rounded-lg border border-brand-cyan/30 bg-brand-cyan/20 px-2.5 py-1 font-bold text-brand-slate">
                  3. Direct Student Placement
                </span>
              </div>
            </div>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {metrics.map((m, i) => {
              const Icon = m.icon
              return (
                <div
                  key={m.label}
                  style={{ transitionDelay: `${i * 100}ms` }}
                  className={[
                    'group flex flex-col justify-between rounded-2xl border border-brand-slate/10 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:border-brand-teal/50 hover:shadow-lg',
                    inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6',
                  ].join(' ')}
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="rounded-full border border-brand-slate/15 bg-brand-slate/5 px-2.5 py-0.5 font-mono text-[11px] font-semibold tracking-wider text-brand-slate group-hover:border-brand-teal/30 group-hover:text-brand-teal transition-colors">
                        {m.tag}
                      </span>
                      <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-brand-pale/25 text-brand-slate transition-colors group-hover:bg-brand-teal group-hover:text-white">
                        <Icon size={16} strokeWidth={2.2} />
                      </span>
                    </div>

                    <div className="mt-4 font-display text-3xl font-black tracking-tight text-brand-slate sm:text-4xl">
                      {m.number}
                    </div>
                    <h3 className="mt-1 text-sm font-bold uppercase tracking-wider text-brand-teal">
                      {m.label}
                    </h3>
                  </div>

                  <p className="mt-5 border-t border-brand-slate/10 pt-4 text-xs font-medium leading-relaxed text-muted sm:text-[13px]">
                    {m.context}
                  </p>
                </div>
              )
            })}
          </div>

          <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-brand-slate/10 pt-6 text-xs text-muted">
            <span className="font-mono uppercase tracking-wider text-brand-slate/70">
              Station Location: Pearland, TX · Serving Greater Houston
            </span>
            <span className="font-mono font-semibold text-brand-teal">
              Live Verified Operational Pipeline
            </span>
          </div>
        </div>
      </div>
    </section>
  )
}

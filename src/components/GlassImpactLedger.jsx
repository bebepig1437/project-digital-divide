import { useInView } from '../hooks/useInView'

const metrics = [
  {
    number: '100+',
    label: 'Machines Ingested',
    context: 'Surplus enterprise laptops secured from district refreshes and local business drives',
  },
  {
    number: 'NIST 800-88',
    label: 'Sanitization Standard',
    context: 'Cryptographic bare-metal wipe verifying zero personal or institutional data persists',
  },
  {
    number: '$0.00',
    label: 'Cost to Families',
    context: 'Direct, permanent gifts paired with student-led hands-on maintenance workshops',
  },
  {
    number: '100%',
    label: 'Student-Operated',
    context: 'Run entirely by Pearland high schoolers logging triage, imaging, and field deployment',
  },
]

export default function GlassImpactLedger() {
  const [ref, inView] = useInView()

  return (
    <section ref={ref} className="bg-white py-16 sm:py-24">
      <div className="container-content">
        <div className="mx-auto max-w-2xl text-center">
          <span className="eyebrow">Operating Scale</span>
          <h2 className="mt-4 text-3xl font-bold text-brand-slate sm:text-4xl">
            Accountable numbers from our Pearland bench
          </h2>
          <p className="mt-3 text-base text-muted sm:text-lg">
            Every machine is logged by serial number from initial pickup to verified student placement.
          </p>
        </div>

        {/* Frosted Glass Telemetry Ledger */}
        <div className="mt-14 rounded-3xl border border-brand-slate/15 bg-brand-pale/15 p-6 shadow-sm sm:p-10">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {metrics.map((m, i) => (
              <div
                key={m.label}
                style={{ transitionDelay: `${i * 100}ms` }}
                className={[
                  'flex flex-col justify-between rounded-2xl border border-brand-slate/10 bg-white p-6 shadow-sm transition-all duration-500 hover:-translate-y-1 hover:border-brand-teal/40 hover:shadow-md',
                  inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6',
                ].join(' ')}
              >
                <div>
                  <div className="font-display text-3xl font-black tracking-tight text-brand-slate sm:text-4xl">
                    {m.number}
                  </div>
                  <h3 className="mt-2 text-sm font-bold uppercase tracking-wider text-brand-teal">
                    {m.label}
                  </h3>
                </div>
                <p className="mt-4 text-xs font-medium leading-relaxed text-muted sm:text-[13px]">
                  {m.context}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-brand-slate/10 pt-6 text-xs text-muted">
            <span className="font-mono uppercase tracking-wider text-brand-slate/70">
              Station Location: Pearland, TX · Serving Greater Houston
            </span>
            <span className="font-mono text-brand-teal font-semibold">
              Live Verified Operational Pipeline
            </span>
          </div>
        </div>
      </div>
    </section>
  )
}

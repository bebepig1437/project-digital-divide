import { useInView } from '../hooks/useInView'

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
              'flex flex-col justify-between rounded-3xl border border-brand-slate/15 bg-white p-7 shadow-sm transition-all duration-500 sm:p-9 hover:border-brand-teal/40 hover:shadow-md',
              inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6',
            ].join(' ')}
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="rounded-full border border-brand-cyan/40 bg-brand-cyan/15 px-3 py-1 font-mono text-xs font-bold text-brand-slate">
                  HARDWARE PROFILE
                </span>
                <span className="font-mono text-xs font-semibold text-brand-teal">
                  ALVIN ISD &amp; DISTRICT SURPLUS
                </span>
              </div>

              <h3 className="mt-4 text-2xl font-bold text-brand-slate">
                What Gear Works Best
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                Education-market laptops from district refresh cycles with working screens, chargers, and batteries.
              </p>

              <ul className="mt-6 space-y-3 border-t border-brand-slate/10 pt-6">
                {[
                  'Dell Latitude 3130 and similar education-model laptops',
                  'Intel Pentium Silver, Celeron, or modern multi-core processors',
                  '4GB+ RAM and working M.2 SSD or SATA drive slots',
                  'Matching OEM laptop AC charging bricks and power cords',
                  'Laptops with functional screens, keyboards, and battery health',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2.5 text-xs font-medium text-brand-slate/90 sm:text-sm">
                    <span className="mt-1 h-2 w-2 flex-none rounded-full bg-brand-cyan" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-8 rounded-xl bg-brand-pale/20 p-4 text-xs font-medium text-brand-slate/80">
              Focus: Laptops that can run a clean, lightweight system smoothly for everyday homework.
            </div>
          </div>

          {/* Card 2: Three Distribution Models */}
          <div
            style={{ transitionDelay: '120ms' }}
            className={[
              'flex flex-col justify-between rounded-3xl border border-brand-slate/15 bg-white p-7 shadow-sm transition-all duration-500 sm:p-9 hover:border-brand-teal/40 hover:shadow-md',
              inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6',
            ].join(' ')}
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="rounded-full border border-brand-slate/20 bg-brand-slate/5 px-3 py-1 font-mono text-xs font-bold text-brand-slate">
                  PLACEMENT TRACKS
                </span>
                <span className="font-mono text-xs font-semibold text-brand-teal">
                  THREE TESTED MODELS
                </span>
              </div>

              <h3 className="mt-4 text-2xl font-bold text-brand-slate">
                How Devices Reach People
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                We test three parallel models and record which one keeps laptops in active use the longest.
              </p>

              <ul className="mt-6 space-y-3 border-t border-brand-slate/10 pt-6">
                {[
                  'Build It, Keep It: 3-hour workshops where students set up their own machine',
                  'Direct donation through school partners: counselors route devices to students',
                  'Community lending library: 2-week loan rotation through neighborhood centers',
                  'Reserve fleet: 20 units held back for quick replacements and repairs',
                  'Full transparency: $0 cost to students and families across all tracks',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2.5 text-xs font-medium text-brand-slate/90 sm:text-sm">
                    <span className="mt-1 h-2 w-2 flex-none rounded-full bg-brand-teal" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-8 rounded-xl bg-brand-slate/5 p-4 text-xs font-medium text-muted">
              Accountability: Every placement is logged to measure long-term device health and student use.
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

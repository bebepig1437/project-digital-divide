import { useInView } from '../hooks/useInView'

export default function HardwareAcceptanceMatrix() {
  const [ref, inView] = useInView()

  return (
    <section ref={ref} className="border-t border-brand-slate/10 bg-brand-pale/10 py-16 sm:py-24">
      <div className="container-content">
        <div className="mx-auto max-w-2xl text-center">
          <span className="eyebrow">Intake Standards</span>
          <h2 className="mt-4 text-3xl font-bold text-brand-slate sm:text-4xl">
            What gear we refurbish and what we recycle
          </h2>
          <p className="mt-3 text-base text-muted sm:text-lg">
            Every donated machine either ends up in a student's hands or gets cleanly harvested for components with zero landfill footprint.
          </p>
        </div>

        <div className="mt-14 grid gap-8 md:grid-cols-2">
          {/* Card 1: Refurbishment Fleet */}
          <div
            className={[
              'flex flex-col justify-between rounded-3xl border border-brand-slate/15 bg-white p-7 shadow-sm transition-all duration-500 sm:p-9 hover:border-brand-teal/40 hover:shadow-md',
              inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6',
            ].join(' ')}
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="rounded-full border border-brand-cyan/40 bg-brand-cyan/15 px-3 py-1 font-mono text-xs font-bold text-brand-slate">
                  DEPLOYMENT CANDIDATES
                </span>
                <span className="font-mono text-xs font-semibold text-brand-teal">
                  PHASE 01 &amp; 02
                </span>
              </div>

              <h3 className="mt-4 text-2xl font-bold text-brand-slate">
                Refurbishment Fleet
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                Usable enterprise laptops refurbished on our bench, imaged with lightweight Linux, and gifted directly to students.
              </p>

              <ul className="mt-6 space-y-3 border-t border-brand-slate/10 pt-6">
                {[
                  'Enterprise laptops (Lenovo ThinkPad, Dell Latitude, HP EliteBook)',
                  'Processors: Intel Core 6th Gen+ or AMD Ryzen equivalent',
                  'Memory & Storage: 4GB+ RAM, working SATA or NVMe SSD slots',
                  'Chromebooks capable of Linux environment support',
                  'OEM laptop AC charging adapters and power bricks',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2.5 text-xs font-medium text-brand-slate/90 sm:text-sm">
                    <span className="mt-1 h-2 w-2 flex-none rounded-full bg-brand-cyan" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-8 rounded-xl bg-brand-pale/20 p-4 text-xs font-medium text-brand-slate/80">
              Target destination: Pearland &amp; Houston student families without home computers.
            </div>
          </div>

          {/* Card 2: Component Salvage & Zero-Landfill */}
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
                  SALVAGE &amp; RECYCLING
                </span>
                <span className="font-mono text-xs font-semibold text-muted">
                  ZERO LANDFILL
                </span>
              </div>

              <h3 className="mt-4 text-2xl font-bold text-brand-slate">
                Component Harvest
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                Damaged or non-booting devices stripped for spare parts to repair other student units, with materials safely recycled.
              </p>

              <ul className="mt-6 space-y-3 border-t border-brand-slate/10 pt-6">
                {[
                  'Working DDR3 and DDR4 SO-DIMM RAM sticks pulled for fleet upgrades',
                  'Functioning Wi-Fi cards, ribbon cables, and internal speakers saved for repairs',
                  'Mechanical hard drives with bad sectors physically degaussed and shredded',
                  'Dead or swollen lithium-ion batteries routed to certified county e-waste hubs',
                  'Cracked plastic chassis responsibly sorted for clean polymer recycling',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2.5 text-xs font-medium text-brand-slate/90 sm:text-sm">
                    <span className="mt-1 h-2 w-2 flex-none rounded-full bg-brand-teal" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-8 rounded-xl bg-brand-slate/5 p-4 text-xs font-medium text-muted">
              Guarantee: 100% data destruction before parts harvest or recycling.
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

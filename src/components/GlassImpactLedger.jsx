import Reveal from './Reveal'

// Update this date whenever the numbers below change.
const lastUpdated = 'November 9, 2026'

// Only verified figures show a value. Anything not yet counted reads "In progress".
const numbers = [
  { value: '100', label: 'Laptops received from Alvin ISD' },
  { value: 'In progress', label: 'Devices deployed' },
  { value: 'In progress', label: 'Workshops run' },
  { value: '$12', label: 'Unit cost per laptop, cleaning included' },
]

export default function GlassImpactLedger() {
  return (
    <section id="impact" className="bg-ink/5 py-16 sm:py-20">
      <div className="container-content">
        <Reveal>
          <span className="eyebrow">The pilot</span>
          <h2 className="mt-4 text-3xl font-bold text-heading sm:text-4xl">The pilot in four numbers</h2>
          <p className="mt-2 text-sm text-muted">Last updated {lastUpdated}</p>
        </Reveal>

        <Reveal delay={120}>
          <dl className="mt-10 grid grid-cols-2 gap-6 md:grid-cols-4">
            {numbers.map((n) => (
              <div key={n.label} className="flex flex-col-reverse border-l-4 border-brand-cyan pl-5">
                <dt className="mt-2 text-sm text-muted">{n.label}</dt>
                <dd className={n.value === 'In progress' ? 'text-2xl font-bold text-muted sm:text-3xl' : 'text-4xl font-extrabold text-heading sm:text-5xl'}>
                  {n.value}
                </dd>
              </div>
            ))}
          </dl>
        </Reveal>
      </div>
    </section>
  )
}

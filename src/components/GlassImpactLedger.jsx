import Reveal from './Reveal'

const numbers = [
  { value: '100', label: 'Laptops donated by Alvin ISD' },
  { value: '60\u201390', label: 'Students targeted by month 10' },
  { value: '3', label: 'Distribution models tested side by side' },
  { value: '$0', label: 'Cost to students' },
]

export default function GlassImpactLedger() {
  return (
    <section id="impact" className="bg-ink/5 py-16 sm:py-20">
      <div className="container-content">
        <Reveal>
          <span className="eyebrow">The pilot</span>
          <h2 className="mt-4 text-3xl font-bold text-brand-slate sm:text-4xl">The pilot in four numbers</h2>
        </Reveal>

        <Reveal delay={120}>
          <dl className="mt-10 grid grid-cols-2 gap-6 md:grid-cols-4">
            {numbers.map((n) => (
              <div key={n.label} className="flex flex-col-reverse border-l-4 border-brand-cyan pl-5">
                <dt className="mt-2 text-sm text-muted">{n.label}</dt>
                <dd className="text-4xl font-extrabold text-brand-slate sm:text-5xl">{n.value}</dd>
              </div>
            ))}
          </dl>
        </Reveal>
      </div>
    </section>
  )
}

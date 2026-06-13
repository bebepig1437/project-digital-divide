import { metrics } from '../data/metrics'
import { useCountUp } from '../hooks/useCountUp'

function Metric({ metric }) {
  const [ref, value] = useCountUp(metric.value)
  return (
    <div ref={ref} className="text-center">
      <div className="font-display text-5xl font-bold text-white sm:text-6xl">
        {value.toLocaleString()}
        {metric.suffix}
      </div>
      <div className="mt-2 text-sm font-medium uppercase tracking-wider text-cream/70">
        {metric.label}
      </div>
    </div>
  )
}

export default function ImpactMetrics() {
  // Only show metrics that are marked ready, never an empty/zero stat.
  const visible = metrics.filter((m) => m.ready)
  if (visible.length === 0) return null

  return (
    <section className="bg-brand-gradient py-20">
      <div className="container-content">
        <h2 className="text-center text-3xl text-white sm:text-4xl">Our impact so far</h2>
        <div className="mt-12 grid gap-12 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((m) => (
            <Metric key={m.id} metric={m} />
          ))}
        </div>
      </div>
    </section>
  )
}

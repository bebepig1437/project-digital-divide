import { Recycle, GraduationCap, RadioTower } from 'lucide-react'
import { pillars } from '../data/pillars'
import { useInView } from '../hooks/useInView'

const icons = { Recycle, GraduationCap, RadioTower }

function Pillar({ pillar, index, inView }) {
  const Icon = icons[pillar.icon]
  return (
    <article
      style={{ transitionDelay: `${index * 140}ms` }}
      className={[
        'flex flex-col items-center transition-all duration-700 ease-out motion-reduce:transition-none',
        inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8',
      ].join(' ')}
    >
      {/* The column: fills full height so every base aligns; lifts and grows gently on hover */}
      <div className="group flex h-full w-full flex-col items-center transition-transform duration-500 ease-out will-change-transform hover:-translate-y-2 hover:scale-[1.03] motion-reduce:transform-none motion-reduce:transition-none">
        {/* Capital: the top of the pillar (mirrors the base below) */}
        <div className="h-1.5 w-[118%] rounded-t-md bg-navy/75" />
        <div className="h-2.5 w-[108%] bg-navy" />
        <div className="h-1 w-full bg-brand-gradient" />

        {/* Shaft: the tall white body */}
        <div className="flex w-full flex-1 flex-col items-center bg-white px-6 pb-10 pt-9 text-center shadow-sm transition-shadow duration-500 ease-out group-hover:shadow-xl">
          <span className="font-display text-6xl font-bold leading-none text-navy/15">
            {pillar.number}
          </span>
          <div className="mt-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-navy-50 text-teal-600">
            <Icon size={28} strokeWidth={1.75} />
          </div>
          <h3 className="mt-5 text-xl">{pillar.title}</h3>
          <p className="mt-2 text-sm font-semibold text-teal-700">{pillar.tagline}</p>
          <p className="mt-4 text-[15px] leading-relaxed text-muted">{pillar.body}</p>
        </div>

        {/* Base: the foot of the pillar */}
        <div className="h-1 w-full bg-brand-gradient" />
        <div className="h-2.5 w-[108%] bg-navy" />
        <div className="h-1.5 w-[118%] rounded-b-md bg-navy/75" />
      </div>
    </article>
  )
}

export default function Pillars() {
  const [ref, inView] = useInView()

  return (
    <section ref={ref} className="bg-cream py-20 sm:py-28">
      <div className="container-content">
        <div className="mx-auto max-w-2xl text-center">
          <span className="eyebrow">Our three pillars</span>
          <h2 className="mt-4 text-3xl sm:text-4xl">Three foundations, one mission</h2>
          <p className="mt-4 text-lg text-muted">
            Access alone isn't enough. We work across three connected pillars to make
            technology reach, and truly serve, everyone.
          </p>
        </div>
      </div>

      {/* The pillars stand side by side, like columns holding up the mission.
          Wider container + larger gap so they spread across the screen. */}
      <div className="mx-auto mt-16 w-full max-w-[84rem] px-5 sm:px-8">
        <div className="grid items-stretch gap-10 md:grid-cols-3 md:gap-14 lg:gap-24">
          {pillars.map((p, i) => (
            <Pillar key={p.id} pillar={p} index={i} inView={inView} />
          ))}
        </div>
      </div>
    </section>
  )
}

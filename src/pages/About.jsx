import TeamHorizonExpander from '../components/TeamHorizonExpander'

export default function About() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-brand-pale/25 via-brand-pale/5 to-white pt-16 pb-20 sm:pt-20 sm:pb-28">
      <div className="container-content">
        <div className="mx-auto mb-12 max-w-3xl text-center">
          <span className="eyebrow">The Team</span>
          <h1 className="mt-4 text-4xl font-bold tracking-tight text-brand-slate sm:text-5xl">
            Who we are
          </h1>
          <p className="mt-5 text-lg font-medium leading-relaxed text-brand-slate/85 sm:text-xl">
            We are five high schoolers in Pearland, Texas. When school districts retire working laptops, we clean them up, configure lightweight software, and get them to students who need a computer at home.
          </p>
          <p className="mt-3 text-sm text-muted">
            Here is who owns what across our shop bench, district partnerships, and student workshops.
          </p>
        </div>

        <TeamHorizonExpander />
      </div>
    </section>
  )
}

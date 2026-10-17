import Reveal from '../components/Reveal'
import TeamHorizonExpander from '../components/TeamHorizonExpander'

export default function About() {
  return (
    <>
      {/* Hero Header */}
      <section className="relative overflow-hidden bg-gradient-to-b from-brand-pale/25 via-brand-pale/5 to-white pt-16 pb-12 sm:pt-20 sm:pb-16">
        <div className="container-content max-w-3xl text-center">
          <span className="eyebrow">About Us</span>
          <h1 className="mt-4 text-4xl font-bold tracking-tight text-brand-slate sm:text-5xl">
            Who we are
          </h1>
          <p className="mt-5 text-lg font-medium text-brand-slate/85 sm:text-xl">
            We're five high schoolers in Pearland, Texas, and we got tired of watching working laptops get thrown away.
          </p>
        </div>
      </section>

      {/* The Team Showcase */}
      <section className="border-t border-brand-slate/10 bg-brand-pale/10 py-16 sm:py-24">
        <div className="container-content">
          <div className="mx-auto mb-10 max-w-2xl text-center">
            <span className="eyebrow">The Team</span>
            <h2 className="mt-3 text-3xl font-bold text-brand-slate sm:text-4xl">
              Who owns what
            </h2>
            <p className="mt-3 text-base text-muted">
              Five team leads with distinct functions, from district outreach and hardware diagnostics to software pipeline tooling.
            </p>
          </div>

          <TeamHorizonExpander />
        </div>
      </section>
    </>
  )
}

import Reveal from '../components/Reveal'
import TeamHorizonExpander from '../components/TeamHorizonExpander'

export default function About() {
  return (
    <>
      {/* Hero Header */}
      <section className="border-b border-navy/10 bg-navy-50/40 py-16 sm:py-20">
        <div className="container-content max-w-3xl text-center">
          <span className="eyebrow">About Us</span>
          <h1 className="mt-4 text-4xl font-bold text-navy sm:text-5xl">
            Who we are
          </h1>
          <p className="mt-5 text-lg font-medium text-navy/80 sm:text-xl">
            We're five high schoolers in Pearland, Texas, and we got tired of watching working laptops get thrown away.
          </p>
        </div>
      </section>

      {/* Origin Story Narrative */}
      <section className="border-b border-navy/10 bg-white py-16 sm:py-20">
        <div className="container-content max-w-3xl">
          <Reveal>
            <div className="space-y-6 text-[16px] leading-relaxed text-muted sm:text-[17px]">
              <p>
                It started with a question: where do old school computers actually go? The answer was nowhere good. Districts refresh their devices every few years. Most of them still work. They just can't run the newest version of Windows. A few miles away, students were doing homework on their parents' phones because they didn't have anything else.
              </p>
              <p>
                So we spent four months learning how to talk to a school district. We wrote emails. We got ignored. We wrote more emails. Eventually we got a yes for 100 laptops, and then had to figure out what to do with them.
              </p>
              <p>
                What we built is a pipeline. We pick up surplus devices, log them, test them, wipe the drives to NIST 800-88 standards, and replace what's broken. Then we install an operating system that actually runs, and hand the machine to a student through a workshop where they open it up and do half the work themselves.
              </p>
              <p>
                We're still small. We've deployed about 60 devices so far. The rest are in progress. We track yield rate, cost per unit, and where every laptop ends up. The only way this matters is if it actually works, and if we can prove it.
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* The Team: Horizon Expander */}
      <section className="bg-cream py-20 sm:py-28">
        <div className="container-content">
          <div className="mx-auto mb-12 max-w-2xl text-center">
            <span className="eyebrow">The Team</span>
            <h2 className="mt-3 text-3xl font-bold text-navy sm:text-4xl">
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

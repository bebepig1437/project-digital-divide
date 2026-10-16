import Reveal from '../components/Reveal'
import TeamShowcaseMaster from '../components/team-showcase/TeamShowcaseMaster'

export default function About() {
  return (
    <>
      {/* Hero Header */}
      <section className="border-b border-navy/10 bg-navy-50/40 py-16 sm:py-20">
        <div className="container-content max-w-3xl text-center">
          <span className="eyebrow">About Us</span>
          <h1 className="mt-4 text-4xl font-bold text-navy sm:text-5xl">The students behind the project</h1>
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
                It started with a question: where do old school computers actually go? The answer was nowhere good. Districts refresh their devices every few years. Most of them still work, but they cannot run the newest version of Windows. A few miles away, students were doing homework on their parents' phones because they didn't have anything else.
              </p>
              <p>
                So we spent four months learning how to talk to a school district. We wrote emails. We got ignored. We wrote more emails. Eventually we got a yes for 100 laptops, and then had to figure out what to do with them.
              </p>
              <p>
                What we built is a pipeline. We pick up surplus devices, log them, test them, wipe the drives to NIST 800-88 standards, replace what's broken, and install an operating system that actually runs. Then we hand them to students through a workshop where they open the machine themselves and do half the work.
              </p>
              <p>
                We're still small. We've deployed about 60 devices so far. The rest are in progress. We track everything, including yield rate, cost per unit, and where each laptop ended up, because the only way this matters is if it actually works and we can prove it.
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Interactive Showcase Section (All 4 Styles) */}
      <section className="bg-cream py-20 sm:py-28">
        <div className="container-content">
          <TeamShowcaseMaster />
        </div>
      </section>
    </>
  )
}

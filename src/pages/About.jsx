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

      {/* Origin Story Narrative & Ground Reality Ledger */}
      <section className="bg-white pb-20 sm:pb-28">
        <div className="container-content">
          <div className="grid gap-12 lg:grid-cols-[1.3fr_1fr] lg:gap-14 lg:items-start">
            <Reveal>
              <div className="space-y-6 text-[16px] leading-relaxed text-muted sm:text-[17px]">
                <p className="text-lg font-medium leading-relaxed text-brand-slate sm:text-xl">
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

            <Reveal delay={120}>
              <div className="rounded-3xl border border-brand-slate/15 bg-brand-pale/15 p-7 shadow-sm sm:p-8">
                <div className="flex items-center justify-between border-b border-brand-slate/10 pb-4">
                  <span className="font-mono text-xs font-bold uppercase tracking-wider text-brand-teal">
                    Field Dispatch · Pearland, TX
                  </span>
                  <span className="flex h-2.5 w-2.5 rounded-full bg-brand-teal animate-pulse" />
                </div>

                <blockquote className="mt-5 border-l-2 border-brand-teal pl-4 text-sm font-medium italic leading-relaxed text-brand-slate/90">
                  "Districts refresh devices every few years while students do homework on parents' phones. We operate the bridge in between."
                </blockquote>

                <div className="mt-6 space-y-3.5 pt-2">
                  <div className="flex items-start gap-3 rounded-2xl border border-brand-slate/10 bg-white/80 p-3.5 shadow-xs">
                    <div className="mt-0.5 flex h-7 w-7 flex-none items-center justify-center rounded-xl bg-brand-teal/15 text-xs font-bold text-brand-teal">
                      100
                    </div>
                    <div>
                      <p className="text-xs font-bold text-brand-slate">Surplus Laptops Approved</p>
                      <p className="text-xs text-muted">First major Pearland district surplus intake batch</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 rounded-2xl border border-brand-slate/10 bg-white/80 p-3.5 shadow-xs">
                    <div className="mt-0.5 flex h-7 w-7 flex-none items-center justify-center rounded-xl bg-brand-teal/15 text-xs font-bold text-brand-teal">
                      60
                    </div>
                    <div>
                      <p className="text-xs font-bold text-brand-slate">Deployed into Student Hands</p>
                      <p className="text-xs text-muted">Active in homes for daily schoolwork and study</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 rounded-2xl border border-brand-slate/10 bg-white/80 p-3.5 shadow-xs">
                    <div className="mt-0.5 flex h-7 w-7 flex-none items-center justify-center rounded-xl bg-brand-teal/15 text-xs font-bold text-brand-teal">
                      088
                    </div>
                    <div>
                      <p className="text-xs font-bold text-brand-slate">NIST 800-88 Sanitization</p>
                      <p className="text-xs text-muted">Full cryptographic wipe standard before re-imaging</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 rounded-2xl border border-brand-slate/10 bg-white/80 p-3.5 shadow-xs">
                    <div className="mt-0.5 flex h-7 w-7 flex-none items-center justify-center rounded-xl bg-brand-teal/15 text-xs font-bold text-brand-teal">
                      $0
                    </div>
                    <div>
                      <p className="text-xs font-bold text-brand-slate">Direct Cost to Recipients</p>
                      <p className="text-xs text-muted">100% free laptops and open hardware workshops</p>
                    </div>
                  </div>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* The Team: Horizon Expander */}
      <section className="border-t border-brand-slate/10 bg-brand-pale/10 py-20 sm:py-28">
        <div className="container-content">
          <div className="mx-auto mb-12 max-w-2xl text-center">
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

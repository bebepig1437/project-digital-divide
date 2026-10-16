import { team } from '../data/team'
import Reveal from '../components/Reveal'
import PhotoPlaceholder from '../components/PhotoPlaceholder'

function MemberRow({ member, index }) {
  const flipped = index % 2 === 1

  return (
    <Reveal>
      <div
        className={`grid items-center gap-8 md:grid-cols-12 md:gap-14 ${
          flipped ? 'md:[direction:rtl]' : ''
        }`}
      >
        {/* Side Image Frame (5 Columns on Desktop) */}
        <div className="md:col-span-5 md:[direction:ltr]">
          {member.photo ? (
            <img
              src={member.photo}
              alt={member.name}
              className="aspect-[4/5] w-full rounded-2xl object-cover shadow-sm border border-navy/10"
            />
          ) : (
            <PhotoPlaceholder
              label={`${member.name} photo`}
              className="aspect-[4/5] w-full shadow-sm"
            />
          )}
        </div>

        {/* Caption & Bio (7 Columns on Desktop) */}
        <div className="md:col-span-7 md:[direction:ltr]">
          <h3 className="font-display text-2xl font-bold text-navy sm:text-3xl">
            {member.name}
          </h3>

          <div className="mt-2.5 flex flex-wrap gap-2">
            <span className="eyebrow !bg-navy-50 !text-navy font-semibold">
              {member.grade}
            </span>
            <span className="eyebrow !bg-teal/10 !text-teal-800 font-semibold">
              {member.focus}
            </span>
          </div>

          <p className="mt-5 text-[16px] leading-relaxed text-muted sm:text-[17px]">
            {member.bio}
          </p>
        </div>
      </div>
    </Reveal>
  )
}

export default function About() {
  return (
    <>
      {/* Hero Header */}
      <section className="border-b border-navy/10 bg-navy-50/40 py-16 sm:py-20">
        <div className="container-content max-w-3xl text-center">
          <span className="eyebrow">About Us</span>
          <h1 className="mt-4 text-4xl font-bold text-navy sm:text-5xl">
            The students behind the project
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

      {/* The Team: Clean Side-by-Side Images & Captions */}
      <section className="bg-cream py-20 sm:py-28">
        <div className="container-content flex flex-col gap-20 sm:gap-24">
          <div className="mx-auto max-w-2xl text-center">
            <span className="eyebrow">The Team</span>
            <h2 className="mt-3 text-3xl font-bold text-navy sm:text-4xl">
              Who owns what
            </h2>
            <p className="mt-3 text-base text-muted">
              Five team leads with distinct functions, from district outreach and hardware diagnostics to software pipeline tooling.
            </p>
          </div>

          <div className="flex flex-col gap-16 sm:gap-20">
            {team.map((member, i) => (
              <MemberRow key={member.name} member={member} index={i} />
            ))}
          </div>
        </div>
      </section>
    </>
  )
}

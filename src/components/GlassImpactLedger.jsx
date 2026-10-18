import { Laptop, Target, Layers, HeartHandshake } from 'lucide-react'
import Reveal from './Reveal'

const metrics = [
  {
    label: '100 Laptops Donated',
    sublabel: 'INITIAL BATCH',
    icon: Laptop,
    description: 'Retired fleet units from Alvin ISD, delivered with chargers and intact hardware.',
  },
  {
    label: '60 to 90 Target Placed',
    sublabel: 'TARGET RANGE',
    icon: Target,
    description: 'Students reached by month ten, with a written comparison of which deployment model held up.',
  },
  {
    label: '3 Distribution Models',
    sublabel: 'ACTIVE TRACKS',
    icon: Layers,
    description: 'Build It, Keep It workshops, counselor referrals, and a community lending library tested in parallel.',
  },
  {
    label: '$0 Cost to Students',
    sublabel: 'GUARANTEE',
    icon: HeartHandshake,
    description: 'No fees, no catches, no hidden expectations. A working machine is the only deliverable.',
  },
]

export default function GlassImpactLedger() {
  return (
    <section id="impact" className="bg-ink/5 py-20 sm:py-28">
      <div className="container-content">
        {/* ---- Section header ---- */}
        <Reveal>
          <span className="eyebrow">Operational Scale</span>
          <h2 className="mt-4 text-3xl font-bold text-brand-slate sm:text-4xl">
            A pilot with real numbers, not a slogan.
          </h2>
          <p className="mt-4 max-w-xl text-lg leading-relaxed text-muted">
            We are not claiming we solved the digital divide. We are documenting a pilot, with the same inventory discipline a serious shop would expect.
          </p>
        </Reveal>

        {/* ---- Four-glassmetric grid ---- */}
        <div className="mt-14 grid gap-5 sm:grid-cols-2">
          {metrics.map((m, i) => {
            const Icon = m.icon
            return (
              <Reveal key={m.label} delay={i * 80}>
                <article className="group relative overflow-hidden rounded-2xl border border-brand-slate/15 bg-white/80 p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-brand-teal/30 hover:shadow-md sm:p-7">
                  <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-brand-slate via-brand-teal to-brand-cyan" />
                  <div className="flex items-start gap-4">
                    <div className="flex h-11 w-11 flex-none items-center justify-center rounded-xl bg-brand-teal/10 text-brand-teal transition-transform duration-300 group-hover:bg-brand-teal/15 group-hover:scale-105">
                      <Icon size={22} strokeWidth={1.75} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-lg font-bold text-brand-slate">{m.label}</p>
                      <p className="mt-0.5 font-mono text-xs font-semibold uppercase tracking-wider text-muted">
                        {m.sublabel}
                      </p>
                      <p className="mt-2 text-sm leading-relaxed text-ink/80 sm:text-base">{m.description}</p>
                    </div>
                  </div>
                </article>
              </Reveal>
            )
          })}
        </div>

        {/* ---- Pilot facts strip ---- */}
        <Reveal delay={360}>
          <div className="mt-14 flex flex-wrap items-center gap-6 rounded-2xl border border-brand-slate/10 bg-white/70 px-6 py-4 sm:gap-8 sm:px-8 sm:py-5">
            {FACTS.map((f) => (
              <div key={f.label} className="flex items-center gap-3">
                <span className="flex h-9 w-9 flex-none items-center justify-center rounded-lg bg-brand-pale/30 text-brand-teal">
                  {f.icon}
                </span>
                <div>
                  <p className="text-sm font-semibold text-brand-slate">{f.label}</p>
                  <p className="text-xs text-muted">{f.value}</p>
                </div>
              </div>
            ))}
          </div>
        </Reveal>

        {/* ---- Pipeline strip ---- */}
        <Reveal delay={420}>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-x-3 gap-y-2 rounded-xl border border-brand-slate/10 bg-white/70 px-5 py-3.5 text-sm text-brand-slate sm:gap-x-5 sm:px-7 sm:py-4">
            <span className="font-medium">1.</span>
            <span className="font-medium">{PIPE[0].label}</span>
            <ArrowRightTiny className="h-4 w-4 text-brand-cyan" />
            <span className="font-medium">{PIPE[1].label}</span>
            <ArrowRightTiny className="h-4 w-4 text-brand-cyan" />
            <span className="font-medium">{PIPE[2].label}</span>
          </div>
        </Reveal>

        {/* ---- Privacy assurance card ---- */}
        <Reveal delay={480}>
          <div className="mt-12 overflow-hidden rounded-2xl border border-brand-slate/12 bg-white/75 p-6 shadow-sm sm:p-8">
            <div className="mb-4 flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-brand-cyan" />
              <h3 className="text-base font-bold text-brand-slate">What we collect, and what we do not</h3>
            </div>
            <ul className="space-y-3 text-sm leading-relaxed text-ink/80">
              {ASSURANCE.map((a) => (
                <li key={a.title} className="flex gap-3">
                  <span className="mt-0.5 flex h-5 w-5 flex-none items-center justify-center rounded-full bg-brand-cyan/10 text-brand-teal">
                    <Check size={12} strokeWidth={3} />
                  </span>
                  <div>
                    <p className="font-semibold text-brand-slate">{a.title}</p>
                    <p className="mt-0.5 text-muted">{a.body}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </Reveal>
      </div>
    </section>
  )
}

const ArrowRightTiny = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M5 12h14M13 5l7 7-7 7" />
  </svg>
)

const FACTS = [
  {
    label: 'Device model',
    value: 'Dell Latitude 3130',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4"><rect x="4" y="4" width="16" height="10" rx="1.5" /><path d="M6 14h12M9 14v4M12 14v4M15 14v4" /></svg>,
  },
  {
    label: 'From',
    value: 'Alvin ISD Technology',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4"><path d="M12 22s-7-4.5-7-10a7 7 0 0 1 14 0c0 5.5-7 10-7 10z" /><circle cx="12" cy="10" r="2.5" /></svg>,
  },
  {
    label: 'Cost to students',
    value: '$0. Always.',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>,
  },
  {
    label: 'Team size',
    value: '5 high school students',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4"><circle cx="9" cy="7" r="3" /><path d="M3 21v-2a4 4 0 0 1 4-4h3.3M16 3a4 4 0 0 1 4 4v2M21 21v-2a4 4 0 0 0-4-4h-3.3" /></svg>,
  },
  {
    label: 'Reserve fleet',
    value: '20 units held back',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4"><path d="M3 3h18v18H3z" /><path d="M9 3v18M15 3v18" /></svg>,
  },
]

const PIPE = [
  { label: 'District Intake (100)' },
  { label: 'Bench Setup & QA' },
  { label: 'Direct Student Placement' },
]

const ShieldCheck = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M12 22s-8-4.5-8-11a8 8 0 0 1 16 0c0 6.5-8 11-8 11z" />
    <path d="m9 12 2 2 4-4" />
  </svg>
)

const ASSURANCE = [
  {
    title: 'We track devices, not people.',
    body: 'Every machine has a log of what came in, what was installed, and where it ended up. We do not collect browsing history, files, or student accounts.',
  },
  {
    title: 'Wiped before it goes out.',
    body: 'Each machine gets a fresh operating system and a clean user profile. Returned lending-library units run the same wipe before they go out again.',
  },
  {
    title: 'No hidden telemetry.',
    body: 'The installed software does not phone home about who is using it or what they do with it. If that changes, it is a documented decision, not a quiet one.',
  },
  {
    title: '$0 cost is real.',
    body: 'There is no fee, no subscription, and no expectation of anything in return. If a unit needs a part replaced, that cost is absorbed before it reaches a student.',
  },
]

import { useState } from 'react'

const pipelinePhases = [
  {
    step: '01',
    label: 'Stage 01: Intake & Diagnostics',
    title: 'Physical Inspection & Drive Clearing',
    tag: 'HARDWARE BENCH',
    stat: '100 Laptops Received',
    statLabel: 'Alvin ISD Decommissioned Batch',
    summary:
      'Machines arrive from the district in good physical condition. We inspect the chassis, clean the fans, test battery health, verify memory, and securely clear the storage drives.',
    highlights: ['Battery health test', 'Screen and keyboard check', 'Secure drive clearing'],
    bgGradient: 'from-brand-slate via-[#123847] to-[#0d2833]',
  },
  {
    step: '02',
    label: 'Stage 02: Software Setup',
    title: 'Lightweight Systems & Study Tools',
    tag: 'TUNED FOR 4GB RAM',
    stat: '<10s Boot Time',
    statLabel: 'Fast, responsive desktop for everyday schoolwork',
    summary:
      'Older laptops often struggle under heavy operating systems. We configure clean, lightweight environments with minimal memory usage, preloading LibreOffice, safe browsers, and study tools.',
    highlights: ['Lightweight desktop environment', 'Full LibreOffice suite preinstalled', 'No background bloatware or ads'],
    bgGradient: 'from-brand-teal via-[#1c646e] to-brand-slate',
  },
  {
    step: '03',
    label: 'Stage 03: Getting Laptops to Students',
    title: 'Hands-On Workshops & Direct Placements',
    tag: 'THREE DISTRIBUTION MODELS',
    stat: '$0 Cost to Families',
    statLabel: 'Permanent machines for local students',
    summary:
      'We test three distribution models: Build It, Keep It workshops where students install their own system, direct referrals through school counselors, and community lending libraries.',
    highlights: ['Build It Keep It workshops', 'School counselor referrals', 'Community lending libraries'],
    bgGradient: 'from-[#17565F] via-[#103e45] to-[#0c2d3a]',
  },
]

export default function PipelineHorizonExpander() {
  const [active, setActive] = useState(0)

  return (
    <div className="w-full">
      {/* Outer Glassmorphic Frame mirroring the About page */}
      <div className="mx-auto max-w-6xl">
        <div className="flex h-[520px] w-full flex-col gap-3 overflow-hidden rounded-3xl border border-brand-slate/15 bg-white p-3 shadow-sm md:h-[480px] md:flex-row md:gap-3.5 md:p-3.5">
          {pipelinePhases.map((phase, i) => {
            const isExpanded = active === i

            return (
              <div
                key={phase.step}
                onClick={() => setActive(i)}
                onMouseEnter={() => setActive(i)}
                className={`relative cursor-pointer overflow-hidden rounded-2xl transition-all duration-500 ease-[cubic-bezier(0.2,0.8,0.2,1)] ${
                  isExpanded
                    ? 'flex-[5] ring-1 ring-brand-cyan/40 shadow-md'
                    : 'flex-[1] bg-brand-slate/10 hover:bg-brand-slate/20'
                }`}
              >
                {/* Background Glass Gradient Scrim */}
                <div
                  className={`absolute inset-0 bg-gradient-to-br ${phase.bgGradient} transition-opacity duration-500 ${
                    isExpanded ? 'opacity-100' : 'opacity-85'
                  }`}
                />

                {/* Ambient geometric grid lines */}
                <div className="absolute inset-0 opacity-10 [background-image:linear-gradient(to_right,white_1px,transparent_1px),linear-gradient(to_bottom,white_1px,transparent_1px)] [background-size:32px_32px]" />

                {/* Collapsed State: Vertical Step Label */}
                <div
                  className={`absolute inset-0 flex items-end justify-between p-5 transition-opacity duration-300 ${
                    isExpanded ? 'pointer-events-none opacity-0' : 'opacity-100'
                  }`}
                >
                  <span className="font-mono text-2xl font-black text-white/30 md:text-3xl">
                    {phase.step}
                  </span>
                  <p className="font-display text-sm font-bold tracking-widest text-white md:[writing-mode:vertical-rl] md:rotate-180">
                    {phase.title.split('&')[0].trim()}
                  </p>
                </div>

                {/* Expanded State: Full Details */}
                <div
                  className={`relative z-10 flex h-full flex-col justify-between p-6 text-white transition-all duration-500 sm:p-8 md:p-9 ${
                    isExpanded
                      ? 'translate-y-0 opacity-100 delay-100'
                      : 'pointer-events-none translate-y-6 opacity-0'
                  }`}
                >
                  {/* Top Bar */}
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-2xl font-black text-brand-cyan sm:text-3xl">
                        {phase.step}
                      </span>
                      <span className="font-mono text-xs font-bold uppercase tracking-wider text-brand-pale">
                        {phase.label}
                      </span>
                    </div>
                    <span className="rounded-full border border-brand-cyan/40 bg-brand-cyan/15 px-3 py-1 font-mono text-[11px] font-bold tracking-wider text-white">
                      {phase.tag}
                    </span>
                  </div>

                  {/* Middle: Headline & Summary */}
                  <div className="my-auto py-3">
                    <h3 className="font-display text-2xl font-bold tracking-tight text-white sm:text-3xl">
                      {phase.title}
                    </h3>
                    <p className="mt-3 max-w-xl text-sm leading-relaxed text-white/85 sm:text-base sm:leading-relaxed">
                      {phase.summary}
                    </p>

                    <div className="mt-5 flex flex-wrap gap-2">
                      {phase.highlights.map((h) => (
                        <span
                          key={h}
                          className="rounded-lg border border-white/15 bg-white/10 px-2.5 py-1 text-xs font-medium text-white/95 backdrop-blur-sm"
                        >
                          {h}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Bottom: Stat Callout */}
                  <div className="border-t border-white/10 pt-4">
                    <div className="font-display text-2xl font-extrabold text-white sm:text-3xl">
                      {phase.stat}
                    </div>
                    <p className="text-xs font-medium text-brand-pale/80">
                      {phase.statLabel}
                    </p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

import { useState } from 'react'
import { useInView } from '../hooks/useInView'

const terminalPhases = [
  {
    id: '01',
    label: 'Phase 01',
    title: 'Physical Triage & Storage Clearing',
    summary: 'Testing battery runtime, verifying memory, checking audio output, and wiping previous user data.',
    terminalLines: [
      { tag: '[BENCH]', text: 'Bench Station 01 online / Operator: J. De Leon' },
      { tag: '[TARGET]', text: 'Unit ID: ALV-3130-042 / Dell Latitude 3130' },
      { tag: '[HARDWARE]', text: 'Intel Pentium Silver N5030 (4 cores, 1.1 GHz base)' },
      { tag: '[STORAGE]', text: '128GB M.2 SSD cleared / eMMC storage disabled' },
      { tag: '[MEMORY]', text: '4GB DDR4 single-channel checked / 0 memory errors' },
      { tag: '[AUDIO]', text: 'Realtek ALC3246 sound & mic test: PASSED' },
      { tag: '[BATTERY]', text: 'Charge cycle health: 86% / AC charger verified' },
      { tag: '[STATUS]', text: 'HARDWARE VERIFIED FOR SOFTWARE INSTALLATION' },
    ],
  },
  {
    id: '02',
    label: 'Phase 02',
    title: 'Lightweight Software Installation',
    summary: 'Testing fast distributions like Lubuntu and Mint Xfce to guarantee smooth performance on 4GB RAM.',
    terminalLines: [
      { tag: '[SETUP]', text: 'Testing lightweight distribution image: Lubuntu (LXQt)' },
      { tag: '[MEMORY]', text: 'Idle RAM usage: 480 MB (smooth 4GB single-channel profile)' },
      { tag: '[APPS]', text: 'Preinstalled: LibreOffice, document reader, media player' },
      { tag: '[BROWSER]', text: 'Clean web browser profile / 8 schoolwork tabs active' },
      { tag: '[TEST]', text: 'Cold boot to desktop: 9.2 seconds' },
      { tag: '[DEVICE]', text: 'WiFi, trackpad, webcam, and sleep/wake checks: ALL PASSED' },
      { tag: '[STATUS]', text: 'SYSTEM CONFIGURED AND READY FOR STUDENTS' },
    ],
  },
  {
    id: '03',
    label: 'Phase 03',
    title: 'Hands-On Build Workshop & Hand-Off',
    summary: 'Students open the chassis, inspect the components, and take full ownership of their machine.',
    terminalLines: [
      { tag: '[WORKSHOP]', text: 'Event: Pearland Build It, Keep It workshop session' },
      { tag: '[STUDENT]', text: 'Ninth-grade recipient paired with student bench mentor' },
      { tag: '[HANDS-ON]', text: 'Student opened bottom chassis, inspected SSD & RAM' },
      { tag: '[BOOT]', text: 'Student booted from installation USB and finished setup' },
      { tag: '[TRAINING]', text: 'Walked through basic navigation, saved files, and updates' },
      { tag: '[COST]', text: 'Direct cost to recipient student and family: $0.00' },
      { tag: '[STATUS]', text: 'PERMANENTLY DEPLOYED FOR HOME SCHOOLWORK' },
    ],
  },
]

export default function InteractiveBenchTerminal() {
  const [activeTab, setActiveTab] = useState('01')
  const [ref, inView] = useInView()
  const current = terminalPhases.find((t) => t.id === activeTab) || terminalPhases[0]

  return (
    <section ref={ref} className="bg-white py-16 sm:py-24">
      <div className="container-content">
        <div className="mx-auto max-w-2xl text-center">
          <span className="eyebrow">Bench Inspection</span>
          <h2 className="mt-4 text-3xl font-bold text-brand-slate sm:text-4xl">
            How each laptop gets checked and configured
          </h2>
          <p className="mt-3 text-base text-muted sm:text-lg">
            Follow the step-by-step bench inspection and software setup on our Dell Latitude 3130 fleet.
          </p>
        </div>

        {/* Master-Detail Split Container with Glass Frame */}
        <div
          className={[
            'mt-14 rounded-3xl border border-brand-slate/15 bg-white p-6 shadow-sm transition-all duration-700 sm:p-9',
            inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6',
          ].join(' ')}
        >
          <div className="grid gap-6 lg:grid-cols-[1.1fr_1.3fr] lg:items-stretch">
            {/* Left: Interactive Stage Selector */}
            <div className="flex flex-col justify-between gap-3">
              {terminalPhases.map((phase) => {
                const isSelected = activeTab === phase.id
                return (
                  <button
                    key={phase.id}
                    type="button"
                    onClick={() => setActiveTab(phase.id)}
                    className={`flex flex-col text-left rounded-2xl p-5 sm:p-6 transition-all duration-200 border ${
                      isSelected
                        ? 'border-brand-teal bg-brand-pale/25 shadow-sm'
                        : 'border-brand-slate/10 bg-white hover:border-brand-slate/25 hover:bg-brand-pale/10'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold uppercase tracking-wider text-brand-teal">
                        {phase.label}
                      </span>
                      <span
                        className={`font-mono text-xs font-bold ${
                          isSelected ? 'text-brand-teal' : 'text-brand-slate/30'
                        }`}
                      >
                        // {phase.id}
                      </span>
                    </div>
                    <h3 className="mt-2 text-base font-bold text-brand-slate sm:text-lg">
                      {phase.title}
                    </h3>
                    <p className="mt-1 text-xs leading-relaxed text-muted sm:text-sm">
                      {phase.summary}
                    </p>
                  </button>
                )
              })}
            </div>

            {/* Right: Simulated Bench Terminal */}
            <div className="flex flex-col overflow-hidden rounded-2xl border border-brand-slate/80 bg-[#0c1f28] text-white shadow-md">
              {/* Traffic Light Terminal Bar */}
              <div className="flex items-center justify-between border-b border-white/10 bg-[#08171e] px-5 py-3">
                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full bg-red-500/80" />
                  <span className="h-3 w-3 rounded-full bg-yellow-500/80" />
                  <span className="h-3 w-3 rounded-full bg-green-500/80" />
                  <span className="ml-3 font-mono text-xs text-white/50">
                    pdd-bench-os // diagnostic-pipeline.sh
                  </span>
                </div>
                <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-brand-cyan">
                  BENCH ACTIVE
                </span>
              </div>

              {/* Terminal Output Body */}
              <div className="flex-1 p-6 font-mono text-xs leading-relaxed sm:text-[13px]">
                <div className="mb-4 text-white/40">
                  # Telemetry stream for selected phase:
                </div>
                <div className="space-y-2">
                  {current.terminalLines.map((line, idx) => (
                    <div key={idx} className="flex items-start gap-2.5">
                      <span
                        className={`flex-none font-bold ${
                          line.tag.includes('PASS') || line.tag.includes('STATUS')
                            ? 'text-brand-cyan'
                            : line.tag.includes('EXEC')
                            ? 'text-yellow-400'
                            : 'text-brand-teal'
                        }`}
                      >
                        {line.tag}
                      </span>
                      <span
                        className={
                          line.tag.includes('STATUS')
                            ? 'font-bold text-brand-cyan'
                            : 'text-white/90'
                        }
                      >
                        {line.text}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

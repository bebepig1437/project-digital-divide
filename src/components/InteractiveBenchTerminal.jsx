import { useState } from 'react'
import { useInView } from '../hooks/useInView'

const terminalPhases = [
  {
    id: '01',
    label: 'Phase 01',
    title: 'Bench Triage & Cryptographic Sanitization',
    summary: 'Wiping drives to federal standards, clearing fan dust, and repasting thermal compound.',
    terminalLines: [
      { tag: '[INIT]', text: 'Bench Station 02 initialized / Operator: J. De Leon' },
      { tag: '[TARGET]', text: 'Unit ID: PDD-2026-084 / Lenovo ThinkPad T480' },
      { tag: '[EXEC]', text: 'dcfldd pattern=00 status=on /dev/nvme0n1' },
      { tag: '[PASS]', text: 'NIST 800-88 Rev 1 Cryptographic Wipe Verified' },
      { tag: '[CHECK]', text: 'MemTest86 4 passes / 8GB DDR4: 0 errors detected' },
      { tag: '[BENCH]', text: 'Thermal compound renewed / CPU Delta T: -14.2°C' },
      { tag: '[STATUS]', text: 'HARDWARE CERTIFIED FOR OS FLASH' },
    ],
  },
  {
    id: '02',
    label: 'Phase 02',
    title: 'Lightweight Linux Kernel & Study Tools',
    summary: 'Stripping Windows bloat so 2017 silicon runs instantly with full offline productivity.',
    terminalLines: [
      { tag: '[INIT]', text: 'Deployment image: PDD-OS-XFCE-v2.4.img' },
      { tag: '[KERNEL]', text: 'Linux 6.8.0-pdd-minimal-x86_64' },
      { tag: '[PKGS]', text: 'Bundled: LibreOffice, Kiwix Offline Wikipedia, Scratch' },
      { tag: '[SECURITY]', text: 'Hardened Firefox profile + zero telemetry flags' },
      { tag: '[BENCH]', text: 'Cold boot to desktop: 8.6 seconds (RAM idle: 618 MB)' },
      { tag: '[PASS]', text: 'Battery cycle test: 82% healthy (>4.5 hrs runtime)' },
      { tag: '[STATUS]', text: 'WORKSTATION IMAGED AND BENCH-LOCKED' },
    ],
  },
  {
    id: '03',
    label: 'Phase 03',
    title: 'Workshop Teardown & Free Placement',
    summary: 'Direct hand-off in Pearland community centers where students open machines themselves.',
    terminalLines: [
      { tag: '[INIT]', text: 'Staging location: Pearland Community Workshop' },
      { tag: '[RECIPIENT]', text: 'Local Pearland ISD student / Family intake logged' },
      { tag: '[WORKSHOP]', text: 'Student opened bottom chassis, identified SSD & RAM' },
      { tag: '[ORIENTATION]', text: 'Taught Linux navigation, software center, safe browsing' },
      { tag: '[FINANCIAL]', text: 'Hardware cost to recipient family: $0.00' },
      { tag: '[SUPPORT]', text: 'Free lifetime diagnostic and repairs at PDD bench' },
      { tag: '[STATUS]', text: 'DEPLOYED INTO ACTIVE ACADEMIC USE' },
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
          <span className="eyebrow">Interactive Telemetry</span>
          <h2 className="mt-4 text-3xl font-bold text-brand-slate sm:text-4xl">
            Live diagnostic inspection bench
          </h2>
          <p className="mt-3 text-base text-muted sm:text-lg">
            Click any phase to inspect the exact terminal and hardware execution telemetry on our triage bench.
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

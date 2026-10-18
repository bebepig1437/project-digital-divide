import Reveal from './Reveal'

const specs = [
  ['Model', 'Dell Latitude 3130, from Alvin ISD Technology'],
  ['Processor', 'Intel Pentium Silver N5030, 1.1 GHz, 4 cores / 4 threads, 64-bit'],
  ['Memory', '4 GB DDR4 @ 2400 MHz, single-channel'],
  ['Storage', '128 GB M.2 PCIe SSD, plus soldered eMMC flash (no SATA drive)'],
  ['Graphics', 'Intel HD Graphics 605, about 64 MB video memory'],
  ['Display', '11.6-inch HD, 1366 \u00d7 768'],
  ['Audio', 'Realtek ALC3246'],
  ['BIOS', 'Version 1.43.0'],
]

const models = [
  {
    label: 'Build It, Keep It',
    detail: 'Students open the case, install the drive, and set up their own operating system in a three-hour workshop.',
  },
  {
    label: 'Counselor referrals',
    detail: 'Partner school staff route finished laptops to the students who need them most.',
  },
  {
    label: 'Community lending',
    detail: 'Laptops rotate through a library or community center on two-week loans.',
  },
]

export default function HardwareAcceptanceMatrix() {
  return (
    <section className="border-t border-brand-slate/10 bg-brand-pale/10 py-16 sm:py-24">
      <div className="container-content">
        <Reveal>
          <span className="eyebrow">Hardware &amp; Distribution</span>
          <h2 className="mt-4 text-3xl font-bold text-brand-slate sm:text-4xl">What we run, and how it reaches students</h2>
        </Reveal>

        <div className="mt-12 grid gap-10 lg:grid-cols-[1.2fr_1fr] lg:gap-14">
          <Reveal>
            <h3 className="text-lg font-bold text-brand-slate">Dell Latitude 3130 specs</h3>
            <table className="mt-4 w-full border-collapse text-sm">
              <tbody>
                {specs.map(([label, value]) => (
                  <tr key={label} className="border-t border-brand-slate/10">
                    <th scope="row" className="w-28 py-2.5 pr-4 text-left align-top font-semibold text-brand-slate">
                      {label}
                    </th>
                    <td className="py-2.5 text-ink/85">{value}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="mt-6 rounded-xl border border-brand-slate/10 bg-white/70 p-4 text-sm leading-relaxed text-muted">
              <p className="font-semibold text-brand-slate">Which operating system runs best on this hardware</p>
              <p className="mt-1">
                With 4 GB of memory, the choice of operating system matters. We are testing options now and will publish the results when testing is done.
              </p>
            </div>
          </Reveal>

          <Reveal delay={120}>
            <h3 className="text-lg font-bold text-brand-slate">Three ways to place a laptop</h3>
            <ol className="mt-4 space-y-5">
              {models.map((m, i) => (
                <li key={m.label} className="flex gap-4">
                  <span className="flex h-8 w-8 flex-none items-center justify-center rounded-full bg-brand-teal/15 text-sm font-bold text-brand-teal">
                    {i + 1}
                  </span>
                  <div>
                    <p className="font-semibold text-brand-slate">{m.label}</p>
                    <p className="mt-0.5 text-sm leading-relaxed text-muted">{m.detail}</p>
                  </div>
                </li>
              ))}
            </ol>
            <p className="mt-8 rounded-xl border border-brand-teal/15 bg-brand-pale/20 p-4 text-sm leading-relaxed text-brand-slate/90">
              Reserve fleet: 20 units are held back for parts, quick repairs, and loaners.
            </p>
          </Reveal>
        </div>
      </div>
    </section>
  )
}

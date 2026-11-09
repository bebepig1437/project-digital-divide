import Reveal from './Reveal'

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
    <section className="border-t border-line/10 bg-brand-pale/10 py-16 sm:py-24">
      <div className="container-content">
        <Reveal>
          <span className="eyebrow">Hardware &amp; Distribution</span>
          <h2 className="mt-4 text-3xl font-bold text-heading sm:text-4xl">How laptops reach students</h2>
        </Reveal>

        <div className="mt-12 grid gap-10 lg:grid-cols-[1.2fr_1fr] lg:gap-14">
          <Reveal>
            <figure>
              <img
                src="/bench-joshua.jpg"
                alt="Joshua De Leon testing laptops at the bench"
                width="1600"
                height="1066"
                loading="lazy"
                className="aspect-[4/3] w-full rounded-xl object-cover object-[50%_40%] shadow-sm"
              />
              <figcaption className="mt-2 text-pretty text-sm leading-relaxed text-muted">
                Joshua at the bench, testing Lubuntu, Linux Mint, Raspberry Pi, ChromeOS, and mini Windows 11.
              </figcaption>
            </figure>

          </Reveal>

          <Reveal delay={120}>
            <h3 className="text-lg font-bold text-heading">Three ways to place a laptop</h3>
            <ol className="mt-4 space-y-5">
              {models.map((m, i) => (
                <li key={m.label} className="flex gap-4">
                  <span className="flex h-8 w-8 flex-none items-center justify-center rounded-full bg-brand-teal/15 text-sm font-bold text-brand-teal dark:text-brand-cyan">
                    {i + 1}
                  </span>
                  <div>
                    <p className="font-semibold text-heading">{m.label}</p>
                    <p className="mt-0.5 text-sm leading-relaxed text-muted">{m.detail}</p>
                  </div>
                </li>
              ))}
            </ol>
          </Reveal>
        </div>
      </div>
    </section>
  )
}

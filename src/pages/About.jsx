import { Helmet } from 'react-helmet-async'
import TeamHorizonExpander from '../components/TeamHorizonExpander'

const siteUrl = 'https://projectdigitaldivide.org'
const logoUrl = `${siteUrl}/logo.webp`

const privacy = `We log each device's chain of custody — intake, refurbishment, and placement — but we do not collect personal data, browsing history, files, or student accounts. Every laptop is wiped and reconfigured with a clean OS before deployment; returned units receive the same treatment. No telemetry, no background data collection, and no usage tracking on installed software. There is no cost to students or families — no fees, subscriptions, or hidden charges. If a repair is needed, we absorb the cost before the device reaches a student.`

export default function About() {
  const meta = [
    { property: 'og:type', content: 'website' },
    { property: 'og:url', content: 'https://projectdigitaldivide.org/about' },
    { property: 'og:image', content: 'https://projectdigitaldivide.org/logo.webp' },
    { name: 'twitter:card', content: 'summary' },
    { name: 'twitter:image', content: 'https://projectdigitaldivide.org/logo.webp' },
  ]

  return (
    <>
      <Helmet>
        <title>About Us | Project Digital Divide</title>
        <meta name="description" content="Meet the five high schoolers in Pearland, Texas running Project Digital Divide. We clean up retired laptops, configure lightweight software, and get them to students who need a computer at home." />
        {meta.map((m, i) => (
          <meta key={i} {...m} />
        ))}
        <meta name="twitter:title" content="About Us | Project Digital Divide" />
        <meta name="twitter:description" content="Meet the five high schoolers in Pearland, Texas running Project Digital Divide. We clean up retired laptops, configure lightweight software, and get them to students who need a computer at home." />
      </Helmet>
      <section className="relative overflow-hidden bg-gradient-to-b from-brand-pale/25 via-brand-pale/5 to-white pt-16 pb-20 sm:pt-20 sm:pb-28">
      <div className="container-content">
        <div className="mx-auto mb-12 max-w-3xl text-center">
          <span className="eyebrow">The Team</span>
          <h1 className="mt-4 text-4xl font-bold tracking-tight text-brand-slate sm:text-5xl">
            Who we are
          </h1>
          <p className="mt-5 text-lg font-medium leading-relaxed text-brand-slate/85 sm:text-xl">
            We are five high schoolers in Pearland, Texas. When school districts retire working laptops, we clean them up, configure lightweight software, and get them to students who need a computer at home.
          </p>
          <p className="mt-3 text-sm text-muted">
            Here is who owns what across our shop bench, district partnerships, and student workshops.
          </p>
        </div>

        <TeamHorizonExpander />

        <div className="mx-auto mt-16 max-w-3xl">
          <h2 className="text-2xl font-bold text-brand-slate">Privacy & Commitment</h2>
          <p className="mt-6 text-base leading-relaxed text-ink/85">{privacy}</p>
        </div>
      </div>
    </section>
    </>
  )
}

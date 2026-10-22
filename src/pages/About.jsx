import { Helmet } from 'react-helmet-async'
import TeamHorizonExpander from '../components/TeamHorizonExpander'
import Testimonials from '../components/Testimonials'
import { aboutTestimonials } from '../data/testimonials'

export default function About() {
  const meta = [
    { property: 'og:type', content: 'website' },
    { property: 'og:url', content: 'https://www.projectdigitaldivide.org/about' },
    { property: 'og:image', content: 'https://www.projectdigitaldivide.org/logo.webp' },
    { name: 'twitter:card', content: 'summary' },
    { name: 'twitter:image', content: 'https://www.projectdigitaldivide.org/logo.webp' },
  ]

  return (
    <>
      <Helmet>
        <title>About Us | Project Digital Divide</title>
        <meta name="description" content="Meet the three high schoolers in Pearland, Texas running Project Digital Divide. We clean up retired laptops, configure lightweight software, and get them to students who need a computer at home." />
        {meta.map((m, i) => (
          <meta key={i} {...m} />
        ))}
        <link rel="canonical" href="https://www.projectdigitaldivide.org/about" />
        <meta name="twitter:title" content="About Us | Project Digital Divide" />
        <meta name="twitter:description" content="Meet the three high schoolers in Pearland, Texas running Project Digital Divide. We clean up retired laptops, configure lightweight software, and get them to students who need a computer at home." />
      </Helmet>
      <section className="relative overflow-hidden pt-16 pb-12 sm:pt-20 sm:pb-20">
        <div className="absolute inset-x-0 top-0 h-[300px] bg-gradient-to-b from-brand-pale/40 via-brand-pale/20 to-brand-pale/8" aria-hidden="true" />
      <div className="container-content relative">
        <div className="mx-auto mb-6 max-w-3xl text-center">
          <span className="eyebrow eyebrow-small">The Team</span>
          <h1 className="mt-4 text-4xl font-bold tracking-tight text-heading sm:text-5xl">
            Who we are
          </h1>
          <p className="mt-5 text-lg font-medium leading-relaxed text-heading/85 sm:text-xl">
            We are three high schoolers in Pearland, Texas. When school districts retire working laptops, we clean them up, configure lightweight software, and get them to students who need a computer at home.
          </p>
        </div>
      </div>
    </section>

    {/* ---- Team horizon expander ---- */}
    <div className="container-content relative mt-2 sm:mt-4 mb-8 sm:mb-10">
      <TeamHorizonExpander />
    </div>

    <Testimonials items={aboutTestimonials} />
    </>
  )
}

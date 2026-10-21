import { Helmet } from 'react-helmet-async'
import TeamHorizonExpander from '../components/TeamHorizonExpander'

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
        <link rel="canonical" href="https://projectdigitaldivide.org/about" />
        <meta name="twitter:title" content="About Us | Project Digital Divide" />
        <meta name="twitter:description" content="Meet the five high schoolers in Pearland, Texas running Project Digital Divide. We clean up retired laptops, configure lightweight software, and get them to students who need a computer at home." />
      </Helmet>
      <section className="relative overflow-hidden pt-16 pb-24 sm:pt-20 sm:pb-32">
        <div className="absolute inset-x-0 top-0 h-[300px] bg-gradient-to-b from-brand-pale/40 via-brand-pale/20 to-brand-pale/8" aria-hidden="true" />
      <div className="container-content relative">
        <div className="mx-auto mb-12 max-w-3xl text-center">
          <span className="eyebrow eyebrow-small">The Team</span>
          <h1 className="mt-4 text-4xl font-bold tracking-tight text-heading sm:text-5xl">
            Who we are
          </h1>
          <p className="mt-5 text-lg font-medium leading-relaxed text-heading/85 sm:text-xl">
            We are five high schoolers in Pearland, Texas. When school districts retire working laptops, we clean them up, configure lightweight software, and get them to students who need a computer at home.
          </p>
        </div>
      </div>
    </section>

    {/* ---- Team horizon expander ---- */}
    <div className="container-content relative mt-6 sm:mt-8 mb-8 sm:mb-10">
      <TeamHorizonExpander />
    </div>

    {/* ---- Testimonial ---- */}
    <section className="bg-canvas py-20 sm:py-28">
      <div className="container-content">
        <div className="mx-auto max-w-3xl">
          <div className="relative overflow-hidden rounded-3xl bg-surface border border-line/10 shadow-lg sm:shadow-xl p-8 sm:p-12">
            <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-brand-slate via-brand-teal to-brand-cyan" />
            <div className="relative text-center">
              <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-brand-teal/10 text-brand-teal dark:bg-brand-cyan/10 dark:text-brand-cyan" aria-hidden="true">
                <svg
                  className="h-7 w-7"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                  />
                </svg>
              </div>
              <blockquote className="text-lg leading-relaxed text-ink/95 dark:text-ink sm:text-xl">
                <p className="font-medium">
                  "What stands out most about Ms. Truong is not simply the idea itself, but her determination to turn that idea into action."
                </p>
                <p className="mt-4 font-medium">
                  "I strongly endorse Michelle Truong and Project Digital Divide. I am confident she possesses the character, leadership, and commitment necessary to successfully execute this initiative and create lasting benefits for students in need."
                </p>
              </blockquote>
              <footer className="mt-10 flex items-center justify-center gap-4">
                <div className="h-px w-20 bg-line/20" />
                <div className="text-left">
                  <p className="font-semibold text-heading">Heather Brown</p>
                  <p className="text-sm text-muted">Executive Director, Technology Services · Alvin ISD</p>
                </div>
                <div className="h-px w-20 bg-line/20" />
              </footer>
            </div>
          </div>
        </div>
      </div>
    </section>
    </>
  )
}

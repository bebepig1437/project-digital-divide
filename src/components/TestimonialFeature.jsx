import { testimonials } from '../data/testimonials'
import Reveal from './Reveal'

// Featured testimonial card. Renders one beautiful card per entry; with a
// single entry it centers as a featured pull-quote. Add more entries to
// src/data/testimonials.js and they flow into the same row.
export default function TestimonialFeature() {
  if (!testimonials || testimonials.length === 0) return null

  return (
    <section className="py-24 sm:py-32 relative overflow-hidden">
      {/* Decorative gradient glow behind the card */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-brand-pale/20 dark:bg-brand-cyan/10 blur-[120px]"></div>
      </div>

      <div className="container-content relative z-10">
        <div className="max-w-3xl mx-auto text-center">
          <span className="eyebrow eyebrow-small inline-flex items-center justify-center gap-2 sm:justify-start sm:text-left">
            <span className="w-1.5 h-1.5 rounded-full bg-brand-cyan"></span>
            Community endorsement
          </span>
          <h2 className="mt-4 text-3xl font-bold tracking-tight text-heading sm:text-4xl">
            What Alvin ISD's Technology Director says
          </h2>
          <p className="mt-6 text-lg text-muted max-w-2xl mx-auto sm:text-xl">
            Heather Brown, Executive Director of Technology Services at Alvin
            ISD, on Michelle Truong and Project Digital Divide.
          </p>
        </div>

        <div
          className="overflow-x-auto scroll-snap-type: x mandatory pb-12"
          style={{ scrollbarWidth: 'none' }}
        >
          <div className="flex gap-8 min-w-[fit-content] justify-center sm:justify-start">
            {testimonials.map((t, i) => (
              <Reveal
                key={i}
                delay={i * 80}
                as="div"
                className="min-w-[340px] shrink-0 scroll-snap-start"
              >
                <div className="relative rounded-3xl border border-line/15 bg-surface p-8 sm:p-12 shadow-xl">
                  {/* Left accent border */}
                  <div className="absolute top-0 left-0 w-1 h-full bg-brand-gradient" />
                  {/* Watermark quote mark */}
                  <div
                    className="absolute top-6 left-6 text-[5rem] text-brand-teal/10 dark:text-brand-cyan/10 leading-none select-none -translate-y-6"
                    aria-hidden="true"
                  >
                    &ldquo;
                  </div>
                  <div className="relative z-10">
                    <p className="text-xl leading-relaxed text-heading sm:text-2xl italic">
                      {t.quote}
                    </p>
                    <div className="mt-12 sm:mt-14 border-t border-line/10 pt-8 sm:pt-10">
                      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
                        <div>
                          <p className="font-semibold text-heading sm:text-lg">
                            {t.name}
                          </p>
                          <p className="mt-1 text-sm text-muted">
                            {t.role}
                          </p>
                          <p className="mt-0.5 text-sm text-muted">
                            {t.org}
                          </p>
                        </div>
                        <div className="text-right sm:text-left">
                          <p className="text-xs text-muted/60">
                            {t.location}
                          </p>
                          <p className="mt-0.5 text-xs text-muted/60">
                            {t.phone}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

import { testimonials } from '../data/testimonials'
import Reveal from './Reveal'

// Horizontal, scroll-snapped strip of testimonial cards. Grows automatically
// as entries are added to src/data/testimonials.js — no pagination, just swipe
// on mobile / scroll on desktop.
export default function TestimonialStrip() {
  if (!testimonials || testimonials.length === 0) return null

  return (
    <section className="py-20 sm:py-28">
      <div className="container-content">
        <div className="mb-12 max-w-3xl text-center">
          <span className="eyebrow eyebrow-small">What they're saying</span>
          <h2 className="mt-4 text-3xl font-bold tracking-tight text-heading sm:text-4xl">
            Community support
          </h2>
        </div>

        {/* Scrollable strip: snap-align each card, hide scrollbar but stay swipeable */}
        <div
          className="overflow-x-auto scroll-snap-type: x mandatory pb-8"
          style={{ scrollbarWidth: 'none' }}
        >
          <div className="flex gap-6 min-w-[fit-content]">
            {testimonials.map((t, i) => (
              <Reveal key={i} delay={i * 60} as="div" className="min-w-[320px] shrink-0 scroll-snap-start">
                <div className="rounded-3xl border border-line/15 bg-surface p-8 sm:p-10 shadow-sm relative">
                  {/* Watermark quote mark */}
                  <div
                    className="absolute top-4 right-4 text-[4rem] text-brand-teal/15 dark:text-brand-cyan/15 leading-none select-none"
                    aria-hidden="true"
                  >
                    &ldquo;
                  </div>
                  <div className="relative z-10">
                    <p className="text-xl leading-relaxed text-heading sm:text-2xl">
                      {t.quote}
                    </p>
                    <div className="mt-8">
                      <p className="text-sm font-semibold text-heading">
                        {t.name}
                      </p>
                      <p className="mt-1 text-sm text-muted">
                        {t.role}, {t.org}
                      </p>
                      <p className="mt-1 text-xs text-muted/60">
                        {t.location}
                      </p>
                      <p className="mt-0.5 text-xs text-muted/60">
                        {t.phone}
                      </p>
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

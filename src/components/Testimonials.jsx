import { Quote } from 'lucide-react'
import Reveal from './Reveal'

// Compact testimonial grid shared by the About and Newsletter pages.
export default function Testimonials({
  items,
  title = 'In their words',
  className = 'border-t border-line/10 bg-wash py-20',
}) {
  if (!items?.length) return null

  return (
    <section className={className}>
      <div className="container-content max-w-4xl">
        <h2 className="text-center text-3xl sm:text-4xl">{title}</h2>
        <div className="mt-12 grid gap-8 sm:grid-cols-2">
          {items.map((t, i) => (
            <Reveal key={t.quote} delay={i * 80}>
              <figure className="h-full rounded-2xl border border-line/10 bg-surface p-7 shadow-sm">
                <Quote className="text-brand-teal/40 dark:text-brand-cyan/50" size={28} />
                <blockquote className="mt-3 text-[15px] leading-relaxed text-ink">
                  "{t.quote}"
                </blockquote>
                <figcaption className="mt-5 text-sm">
                  <span className="font-semibold text-heading">{t.name}</span>
                  {t.role && <span className="text-muted"> · {t.role}</span>}
                </figcaption>
              </figure>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}

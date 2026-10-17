import { Link } from 'react-router-dom'
import { ArrowRight, Quote } from 'lucide-react'
import { posts, formatDate } from '../lib/posts'
import { testimonials } from '../data/testimonials'
import Reveal from '../components/Reveal'

export default function Newsletter() {
  return (
    <>
      <section className="relative overflow-hidden bg-gradient-to-b from-brand-pale/25 via-brand-pale/5 to-white pt-16 pb-12 sm:pt-20 sm:pb-16">
        <div className="container-content max-w-3xl text-center">
          <span className="eyebrow">Newsletter</span>
          <h1 className="mt-4 text-4xl font-bold tracking-tight text-brand-slate sm:text-5xl">News &amp; updates</h1>
          <p className="mt-5 text-lg font-medium text-brand-slate/85 sm:text-xl">
            Upcoming device drives, workshop recaps, partner projects, and updates on what our team is building
          </p>
        </div>
      </section>

      <section className="bg-white pb-20 sm:pb-28">
        <div className="container-content max-w-3xl">
          {posts.length === 0 ? (
            <div className="rounded-3xl border border-brand-slate/15 bg-brand-pale/10 p-12 text-center text-muted">
              No posts yet. Check back soon.
            </div>
          ) : (
            <div className="space-y-6">
              {posts.map((post) => (
                <Reveal key={post.slug}>
                  <Link
                    to={`/newsletter/${post.slug}`}
                    className="group block rounded-3xl border border-brand-slate/15 bg-white p-7 transition-all duration-300 hover:border-brand-teal/50 hover:shadow-md sm:p-8"
                  >
                    <div className="flex flex-wrap items-center gap-3">
                      <time className="text-xs font-semibold uppercase tracking-wider text-brand-teal">
                        {formatDate(post.date)}
                      </time>
                    </div>
                    <h2 className="mt-3 font-display text-2xl font-bold tracking-tight text-brand-slate transition-colors group-hover:text-brand-teal sm:text-3xl">
                      {post.title}
                    </h2>
                    <p className="mt-3 text-base leading-relaxed text-muted">
                      {post.excerpt}
                    </p>
                    <div className="mt-5 flex items-center gap-1.5 text-sm font-semibold text-brand-slate transition-colors group-hover:text-brand-teal">
                      <span>Read article</span>
                      <ArrowRight size={15} className="transition-transform group-hover:translate-x-1" />
                    </div>
                  </Link>
                </Reveal>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Testimonials: hidden until real ones exist in src/data/testimonials.js */}
      {testimonials.length > 0 && (
        <section className="border-t border-navy/10 bg-navy-50/40 py-20">
          <div className="container-content max-w-4xl">
            <h2 className="text-center text-3xl sm:text-4xl">In their words</h2>
            <div className="mt-12 grid gap-8 sm:grid-cols-2">
              {testimonials.map((t, i) => (
                <Reveal key={i} delay={i * 80}>
                  <figure className="h-full rounded-2xl border border-navy/10 bg-white p-7 shadow-sm">
                    <Quote className="text-teal/40" size={28} />
                    <blockquote className="mt-3 text-[15px] leading-relaxed text-ink">
                      "{t.quote}"
                    </blockquote>
                    <figcaption className="mt-5 text-sm">
                      <span className="font-semibold text-navy">{t.name}</span>
                      {t.role && <span className="text-muted"> · {t.role}</span>}
                    </figcaption>
                  </figure>
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  )
}

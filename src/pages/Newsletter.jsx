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
        <div className="container-content">
          <div className="grid gap-10 lg:grid-cols-[1.3fr_1fr] lg:gap-12 lg:items-start">
            <div>
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
                        className="group flex flex-col justify-between rounded-3xl border border-brand-slate/15 bg-white p-7 sm:p-8 shadow-sm transition-all duration-300 hover:border-brand-teal/40 hover:shadow-md"
                      >
                        <div>
                          <div className="flex items-center gap-3">
                            <span className="rounded-full border border-brand-teal/20 bg-brand-teal/10 px-3 py-0.5 text-xs font-semibold uppercase tracking-wider text-brand-teal">
                              Field Dispatch
                            </span>
                            <time className="text-xs font-medium text-muted">
                              {formatDate(post.date)}
                            </time>
                          </div>
                          <h2 className="mt-4 font-display text-2xl font-bold tracking-tight text-brand-slate transition-colors group-hover:text-brand-teal sm:text-3xl">
                            {post.title}
                          </h2>
                          <p className="mt-3 text-base leading-relaxed text-muted">
                            {post.excerpt}
                          </p>
                        </div>
                        <div className="mt-6 flex items-center justify-between border-t border-brand-slate/10 pt-4">
                          <span className="text-xs font-medium text-brand-slate/75">
                            By Student Engineering Team
                          </span>
                          <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-slate group-hover:text-brand-teal transition-colors">
                            Read article
                            <ArrowRight size={15} className="transition-transform group-hover:translate-x-1" />
                          </span>
                        </div>
                      </Link>
                    </Reveal>
                  ))}
                </div>
              )}
            </div>

            {/* Sidebar: Newsletter Scope & Topics Card */}
            <Reveal delay={120}>
              <div className="rounded-3xl border border-brand-slate/15 bg-brand-pale/15 p-7 shadow-sm sm:p-8">
                <span className="font-mono text-xs font-bold uppercase tracking-wider text-brand-teal">
                  Publication Scope
                </span>
                <h3 className="mt-2 text-xl font-bold text-brand-slate">
                  What we publish
                </h3>
                <p className="mt-2.5 text-sm leading-relaxed text-muted">
                  Zero spam, zero generic thinkpieces. We document our hands-on hardware triage, school district partnerships, and student workshop curriculums.
                </p>

                <div className="mt-6 space-y-3 border-t border-brand-slate/10 pt-5">
                  <div className="flex items-start gap-3 text-sm text-brand-slate/90">
                    <span className="mt-0.5 flex h-5 w-5 flex-none items-center justify-center rounded-full bg-brand-teal/15 text-xs font-bold text-brand-teal">✓</span>
                    <span>Triage benchmarks &amp; yield rates</span>
                  </div>
                  <div className="flex items-start gap-3 text-sm text-brand-slate/90">
                    <span className="mt-0.5 flex h-5 w-5 flex-none items-center justify-center rounded-full bg-brand-teal/15 text-xs font-bold text-brand-teal">✓</span>
                    <span>District device pickup dates &amp; drives</span>
                  </div>
                  <div className="flex items-start gap-3 text-sm text-brand-slate/90">
                    <span className="mt-0.5 flex h-5 w-5 flex-none items-center justify-center rounded-full bg-brand-teal/15 text-xs font-bold text-brand-teal">✓</span>
                    <span>Hands-on student workshop recaps</span>
                  </div>
                  <div className="flex items-start gap-3 text-sm text-brand-slate/90">
                    <span className="mt-0.5 flex h-5 w-5 flex-none items-center justify-center rounded-full bg-brand-teal/15 text-xs font-bold text-brand-teal">✓</span>
                    <span>Lightweight OS &amp; offline study setups</span>
                  </div>
                </div>

                <div className="mt-6 rounded-2xl border border-brand-slate/10 bg-white/80 p-4 shadow-xs">
                  <p className="text-xs font-semibold uppercase tracking-wider text-brand-slate">Cadence</p>
                  <p className="mt-1 text-xs text-muted">
                    Published monthly or immediately following major donation batch distributions.
                  </p>
                </div>
              </div>
            </Reveal>
          </div>
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

import { Link } from 'react-router-dom'
import { ArrowRight, Quote } from 'lucide-react'
import { posts, formatDate } from '../lib/posts'
import { testimonials } from '../data/testimonials'
import Reveal from '../components/Reveal'

export default function Newsletter() {
  return (
    <>
      <section className="border-b border-navy/10 bg-navy-50/40 py-16 sm:py-20">
        <div className="container-content max-w-3xl text-center">
          <span className="eyebrow">Newsletter</span>
          <h1 className="mt-4 text-4xl sm:text-5xl">News &amp; updates</h1>
          <p className="mt-5 text-lg text-muted">
            Device drives, workshops, partnerships, and stories from the field: everything
            we're up to, one post at a time.
          </p>
        </div>
      </section>

      <section className="bg-cream py-16 sm:py-20">
        <div className="container-content max-w-3xl">
          {posts.length === 0 ? (
            <p className="text-center text-muted">No posts yet. Check back soon.</p>
          ) : (
            <ul className="divide-y divide-navy/10">
              {posts.map((post) => (
                <li key={post.slug}>
                  <Reveal>
                    <Link
                      to={`/newsletter/${post.slug}`}
                      className="group flex flex-col gap-4 py-8 sm:flex-row sm:items-start sm:gap-8"
                    >
                      {post.image && (
                        <img
                          src={post.image}
                          alt=""
                          className="h-40 w-full rounded-xl object-cover sm:h-28 sm:w-44 sm:flex-none"
                        />
                      )}
                      <div className="flex-1">
                        <time className="text-xs font-semibold uppercase tracking-wider text-teal-700">
                          {formatDate(post.date)}
                        </time>
                        <h2 className="mt-2 text-2xl transition-colors group-hover:text-teal-700">
                          {post.title}
                        </h2>
                        <p className="mt-2 text-[15px] leading-relaxed text-muted">{post.excerpt}</p>
                        <span className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-navy">
                          Read more
                          <ArrowRight size={15} className="transition-transform group-hover:translate-x-1" />
                        </span>
                      </div>
                    </Link>
                  </Reveal>
                </li>
              ))}
            </ul>
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

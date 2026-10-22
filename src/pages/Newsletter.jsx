import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { Helmet } from 'react-helmet-async'
import { posts, formatDate } from '../lib/posts'
import { testimonials } from '../data/testimonials'
import Reveal from '../components/Reveal'
import Testimonials from '../components/Testimonials'

export default function Newsletter() {
  const meta = [
    { property: 'og:type', content: 'website' },
    { property: 'og:url', content: 'https://projectdigitaldivide.org/newsletter' },
    { property: 'og:image', content: 'https://projectdigitaldivide.org/logo.webp' },
    { name: 'twitter:card', content: 'summary' },
    { name: 'twitter:image', content: 'https://projectdigitaldivide.org/logo.webp' },
  ]

  return (
    <>
      <Helmet>
        <title>News & Updates | Project Digital Divide</title>
        <meta name="description" content="Updates on our hardware intake, student build workshops, district partnerships, and what we are learning as we build. Field dispatches from the team bridging the digital divide in Houston." />
        {meta.map((m, i) => (
          <meta key={i} {...m} />
        ))}
        <link rel="canonical" href="https://projectdigitaldivide.org/newsletter" />
        <meta name="twitter:title" content="News & Updates | Project Digital Divide" />
        <meta name="twitter:description" content="Updates on our hardware intake, student build workshops, district partnerships, and what we are learning as we build." />
      </Helmet>
      <section className="relative overflow-hidden pt-16 pb-12 sm:pt-20 sm:pb-16">
        <div className="absolute inset-x-0 top-0 h-[300px] bg-gradient-to-b from-brand-pale/40 via-brand-pale/20 to-brand-pale/8" aria-hidden="true" />
        <div className="container-content max-w-3xl text-center relative">
          <span className="eyebrow">Field Dispatches</span>
          <h1 className="mt-4 text-4xl font-bold tracking-tight text-heading sm:text-5xl">News &amp; updates</h1>
          <p className="mt-5 text-lg font-medium text-heading/85 sm:text-xl">
            Updates on our hardware intake, student build workshops, district partnerships, and what we are learning as we build.
          </p>
        </div>
      </section>

      <section className="bg-canvas pb-20 sm:pb-28">
        <div className="container-content max-w-3xl">
          {posts.length === 0 ? (
            <div className="rounded-3xl border border-line/15 bg-brand-pale/10 p-12 text-center text-muted">
              No posts yet. Check back soon.
            </div>
          ) : (
            <div className="space-y-6">
              {posts.map((post) => (
                <Reveal key={post.slug}>
                  <Link
                    to={`/newsletter/${post.slug}`}
                    className="group block rounded-3xl border border-line/15 bg-surface p-7 transition-all duration-300 hover:border-brand-teal/50 hover:shadow-md sm:p-8"
                  >
                    <div className="flex flex-wrap items-center gap-3">
                      <time className="text-xs font-semibold uppercase tracking-wider text-brand-teal dark:text-brand-cyan">
                        {formatDate(post.date)}
                      </time>
                    </div>
                    <h2 className="mt-3 font-display text-2xl font-bold tracking-tight text-heading transition-colors group-hover:text-brand-teal dark:group-hover:text-brand-pale sm:text-3xl">
                      {post.title}
                    </h2>
                    <p className="mt-3 text-base leading-relaxed text-muted">
                      {post.excerpt}
                    </p>
                    <div className="mt-5 flex items-center gap-1.5 text-sm font-semibold text-heading transition-colors group-hover:text-brand-teal dark:group-hover:text-brand-pale">
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

    </>
  )
}

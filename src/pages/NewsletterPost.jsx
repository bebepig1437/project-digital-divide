import { Link, useParams } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { ArrowLeft } from 'lucide-react'
import { Helmet } from 'react-helmet-async'
import { getPost, formatDate } from '../lib/posts'
import PhotoPlaceholder from '../components/PhotoPlaceholder'

export default function NewsletterPost() {
  const { slug } = useParams()
  const post = getPost(slug)

  if (!post) {
    return (
      <section className="container-content py-28 text-center">
        <h1 className="text-3xl">Post not found</h1>
        <Link to="/newsletter" className="btn-primary mt-6">Back to newsletter</Link>
      </section>
    )
  }

  const postUrl = `https://projectdigitaldivide.org/newsletter/${slug}`
  const imageUrl = post.image || 'https://projectdigitaldivide.org/logo.webp'
  const meta = [
    { property: 'og:type', content: 'article' },
    { property: 'og:url', content: postUrl },
    { property: 'og:image', content: imageUrl },
    { property: 'article:published_time', content: post.date },
    { name: 'twitter:card', content: 'summary_large_image' },
    { name: 'twitter:image', content: imageUrl },
  ]

  return (
    <>
      <Helmet>
        <title>{post.title} | Project Digital Divide</title>
        <meta name="description" content={post.excerpt} />
        {meta.map((m, i) => (
          <meta key={i} {...m} />
        ))}
        <link rel="canonical" href={postUrl} />
        <meta name="twitter:title" content={post.title} />
        <meta name="twitter:description" content={post.excerpt} />
      </Helmet>
      <div className="relative overflow-hidden bg-gradient-to-b from-brand-pale/25 via-brand-pale/5 to-white pt-10 pb-20 sm:pt-14 sm:pb-28">
      <article className="container-content max-w-3xl">
        <Link to="/newsletter" className="inline-flex items-center gap-1.5 text-sm font-semibold text-heading hover:text-brand-teal dark:hover:text-brand-pale transition-colors">
          <ArrowLeft size={15} /> All posts
        </Link>

        <header className="mt-8 rounded-3xl border border-line/15 bg-surface p-8 sm:p-10 shadow-sm">
          <div className="flex items-center gap-3">
            <span className="rounded-full border border-brand-teal/20 bg-brand-teal/10 px-3 py-0.5 text-xs font-semibold uppercase tracking-wider text-brand-teal dark:text-brand-cyan">
              Field Dispatch
            </span>
            <time className="text-xs font-medium text-muted">
              {formatDate(post.date)}
            </time>
          </div>
          <h1 className="mt-4 font-display text-3xl font-bold leading-tight text-heading sm:text-4xl md:text-5xl">
            {post.title}
          </h1>
          <p className="mt-4 text-base leading-relaxed text-muted sm:text-lg">
            {post.excerpt}
          </p>
        </header>

        {post.image ? (
          <img src={post.image} alt={post.title} className="mt-8 aspect-[16/9] w-full rounded-3xl object-cover shadow-sm border border-line/10" />
        ) : null}

        <div className="mt-8 rounded-3xl border border-line/15 bg-surface p-8 sm:p-12 shadow-sm">
          <div className="prose-pdd">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{post.content}</ReactMarkdown>
          </div>
        </div>
      </article>
    </div>
    </>
  )
}

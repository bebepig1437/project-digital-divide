import { Link, useParams } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { ArrowLeft } from 'lucide-react'
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

  return (
    <article className="bg-cream py-14 sm:py-20">
      <div className="container-content max-w-3xl">
        <Link to="/newsletter" className="inline-flex items-center gap-1.5 text-sm font-semibold text-navy hover:text-teal">
          <ArrowLeft size={15} /> All posts
        </Link>

        <header className="mt-6">
          <time className="text-xs font-semibold uppercase tracking-wider text-teal-700">
            {formatDate(post.date)}
          </time>
          <h1 className="mt-3 text-4xl leading-tight sm:text-5xl">{post.title}</h1>
        </header>

        {post.image ? (
          <img src={post.image} alt="" className="mt-8 aspect-[16/9] w-full rounded-2xl object-cover" />
        ) : (
          <PhotoPlaceholder label="Post image" className="mt-8 aspect-[16/9] w-full" />
        )}

        <div className="prose-pdd mt-10">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{post.content}</ReactMarkdown>
        </div>
      </div>
    </article>
  )
}

import { useState } from 'react'
import { Send, CheckCircle2, RotateCcw } from 'lucide-react'
import { SUBMIT_ENDPOINT } from '../config'

const reasons = [
  'Donate devices or supplies',
  'Request a laptop for a student',
  'Host a workshop',
  'Volunteer',
  'Partnership',
  'General inquiry',
]

export default function ContactForm() {
  const [status, setStatus] = useState('idle') // idle | sending | success | error

  async function handleSubmit(e) {
    e.preventDefault()
    setStatus('sending')
    const payload = Object.fromEntries(new FormData(e.target).entries())
    payload.form = 'contact'
    try {
      const res = await fetch(SUBMIT_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (res.ok) {
        setStatus('success')
        e.target.reset()
      } else {
        setStatus('error')
      }
    } catch {
      setStatus('error')
    }
  }

  if (status === 'success') {
    return (
      <div className="flex flex-col items-center gap-3 rounded-2xl border border-brand-teal/20 bg-surface p-10 text-center shadow-sm">
        <CheckCircle2 className="text-brand-teal" size={40} />
        <h3 className="text-xl font-bold text-heading">Thanks for reaching out!</h3>
        <p className="text-muted">We'll get back to you at the email you provided.</p>
        <button
          type="button"
          onClick={() => setStatus('idle')}
          className="mt-4 inline-flex items-center gap-2 rounded-full border border-line/20 bg-surface px-5 py-2.5 text-sm font-semibold text-heading shadow-xs transition hover:border-brand-teal hover:bg-brand-pale/15 hover:text-brand-teal dark:hover:text-brand-pale"
        >
          <RotateCcw size={15} />
          Send another message
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-4 rounded-3xl border border-line/15 bg-brand-pale/10 p-6 shadow-sm sm:p-8">
      {/* Honeypot: hidden from people, catches bots */}
      <input type="text" name="_gotcha" tabIndex={-1} autoComplete="off" aria-hidden="true" className="hidden" />
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="field-label" htmlFor="c-name">Name</label>
          <input id="c-name" name="name" required className="field-input" placeholder="Your name" />
        </div>
        <div>
          <label className="field-label" htmlFor="c-email">Email</label>
          <input id="c-email" name="email" type="email" required className="field-input" placeholder="you@email.com" />
        </div>
      </div>

      <div>
        <label className="field-label" htmlFor="c-reason">Reason for contact</label>
        <select id="c-reason" name="reason" required defaultValue="" className="field-input">
          <option value="" disabled>Select a reason…</option>
          {reasons.map((r) => (
            <option key={r} value={r}>{r}</option>
          ))}
        </select>
        <p className="mt-2 text-sm text-muted">
          We take any donation that helps the project. If you&apos;d rather pick something specific, our{' '}
          <a href="https://www.amazon.com/hz/wishlist/ls/2BSB1I7207W2K?ref_=wl_share" target="_blank" rel="noopener noreferrer" className="text-brand-teal hover:underline dark:text-brand-cyan">
            Amazon wishlist
          </a>{' '}
          has the small stuff we go through fastest.
        </p>
        <p className="mt-2 text-sm text-muted">
          Don&apos;t include a student&apos;s name or school in this form. We&apos;ll ask for that by email once we&apos;ve replied.
        </p>
      </div>

      <div>
        <label className="field-label" htmlFor="c-message">Message</label>
        <textarea id="c-message" name="message" required rows={4} className="field-input resize-y" placeholder="What you have, what you need, and roughly where you are. If you're volunteering, tell us what you'd like to help with and how many hours a week you can give. If you're requesting a device for a student, tell us your role (counselor, teacher, parent) and roughly how many students, but leave names out for now." />
      </div>

      {status === 'error' && (
        <p className="text-sm text-red-600">
          Something went wrong. Please try again, or email us directly.
        </p>
      )}

      <button type="submit" disabled={status === 'sending'} className="btn-primary w-full sm:w-auto sm:justify-self-start disabled:opacity-60">
        {status === 'sending' ? 'Sending…' : <>Send message <Send size={16} /></>}
      </button>
    </form>
  )
}

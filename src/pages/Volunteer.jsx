import { useState } from 'react'
import { Send, CheckCircle2, Mail, RotateCcw } from 'lucide-react'
import { SUBMIT_ENDPOINT, site } from '../config'
import Reveal from '../components/Reveal'

const interestAreas = [
  'Hardware testing & bench setup',
  'Build It, Keep It workshop mentoring',
  'School district outreach & partnerships',
  'Software tracking tools & data logging',
  'Wherever the team needs help',
]

export default function Volunteer() {
  const [status, setStatus] = useState('idle')

  async function handleSubmit(e) {
    e.preventDefault()
    setStatus('sending')
    const payload = Object.fromEntries(new FormData(e.target).entries())
    payload.form = 'volunteer'
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

  return (
    <>
      <section className="relative overflow-hidden bg-gradient-to-b from-brand-pale/25 via-brand-pale/5 to-white pt-16 pb-12 sm:pt-20 sm:pb-16">
        <div className="container-content max-w-3xl text-center">
          <span className="eyebrow">Get Involved</span>
          <h1 className="mt-4 text-4xl font-bold tracking-tight text-brand-slate sm:text-5xl">Join the team</h1>
          <p className="mt-5 text-lg font-medium text-brand-slate/85 sm:text-xl">
            Whether you want to help test laptops on the bench, mentor students at a build workshop, connect with local schools, or build tracking software, we would love to have you.
          </p>
        </div>
      </section>

      <section className="bg-white pb-20 sm:pb-28">
        <div className="container-content max-w-2xl">
          {status === 'success' ? (
            <Reveal>
              <div className="flex flex-col items-center gap-3 rounded-3xl border border-brand-teal/20 bg-brand-pale/10 p-12 text-center shadow-sm">
                <CheckCircle2 className="text-brand-teal" size={44} />
                <h2 className="text-2xl font-bold text-brand-slate">Application received!</h2>
                <p className="max-w-sm text-muted">
                  Thanks for wanting to help bridge the divide. We'll reach out to you soon.
                </p>
                <button
                  type="button"
                  onClick={() => setStatus('idle')}
                  className="mt-4 inline-flex items-center gap-2 rounded-full border border-brand-slate/20 bg-white px-6 py-2.5 text-sm font-semibold text-brand-slate shadow-xs transition hover:border-brand-teal hover:bg-brand-pale/15 hover:text-brand-teal"
                >
                  <RotateCcw size={15} />
                  Submit another application
                </button>
              </div>
            </Reveal>
          ) : (
            <Reveal>
              <form onSubmit={handleSubmit} className="grid gap-5 rounded-3xl border border-brand-slate/15 bg-brand-pale/10 p-7 shadow-sm sm:p-10">
                {/* Honeypot: hidden from people, catches bots */}
                <input type="text" name="_gotcha" tabIndex={-1} autoComplete="off" aria-hidden="true" className="hidden" />
                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <label className="field-label" htmlFor="v-name">Full name</label>
                    <input id="v-name" name="name" required className="field-input" placeholder="Your name" />
                  </div>
                  <div>
                    <label className="field-label" htmlFor="v-email">Email</label>
                    <input id="v-email" name="email" type="email" required className="field-input" placeholder="you@email.com" />
                  </div>
                </div>

                <div>
                  <label className="field-label" htmlFor="v-grade">Grade / age</label>
                  <input id="v-grade" name="grade_or_age" required className="field-input" placeholder="e.g. 11th grade, or 16" />
                </div>

                <div>
                  <label className="field-label" htmlFor="v-interest">Where would you like to help?</label>
                  <select id="v-interest" name="interest_area" required defaultValue="" className="field-input">
                    <option value="" disabled>Choose an area…</option>
                    {interestAreas.map((a) => (
                      <option key={a} value={a}>{a}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="field-label" htmlFor="v-skills">Relevant skills &amp; experience</label>
                  <textarea id="v-skills" name="skills_experience" rows={3} className="field-input resize-y" placeholder="e.g. laptop hardware, software setup, student mentoring, community outreach" />
                </div>

                <div>
                  <label className="field-label" htmlFor="v-availability">Availability</label>
                  <input id="v-availability" name="availability" className="field-input" placeholder="e.g. weekday afternoons, ~3 hrs/week" />
                </div>

                <div>
                  <label className="field-label" htmlFor="v-why">Why do you want to volunteer?</label>
                  <textarea id="v-why" name="why_join" rows={4} className="field-input resize-y" placeholder="Tell us what draws you to the mission." />
                </div>

                {status === 'error' && (
                  <p className="text-sm text-red-600">
                    Something went wrong. Please try again, or email us at {site.email}.
                  </p>
                )}

                <button type="submit" disabled={status === 'sending'} className="btn-primary w-full disabled:opacity-60">
                  {status === 'sending' ? 'Submitting…' : <>Submit application <Send size={16} /></>}
                </button>
              </form>
            </Reveal>
          )}

          <p className="mt-6 text-center text-sm text-muted">
            Prefer email? Reach us at{' '}
            <a href={`mailto:${site.email}`} className="inline-flex items-center gap-1 font-medium text-brand-slate hover:text-brand-teal transition-colors">
              <Mail size={14} /> {site.email}
            </a>
          </p>
        </div>
      </section>
    </>
  )
}

import { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { team } from '../data/team'
import PhotoPlaceholder from './PhotoPlaceholder'

export default function TeamCarousel() {
  const [index, setIndex] = useState(0)
  const total = team.length

  const handleNext = () => setIndex((prev) => (prev + 1) % total)
  const handlePrev = () => setIndex((prev) => (prev - 1 + total) % total)

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowRight') handleNext()
      if (e.key === 'ArrowLeft') handlePrev()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const member = team[index]

  return (
    <div className="w-full">
      {/* Name Selector Tabs */}
      <div className="mb-8 flex flex-wrap items-center justify-center gap-2">
        {team.map((m, i) => (
          <button
            key={m.name}
            onClick={() => setIndex(i)}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors duration-150 ${
              i === index
                ? 'bg-navy text-white shadow-sm'
                : 'bg-white border border-navy/10 text-navy/70 hover:bg-navy-50 hover:text-navy'
            }`}
          >
            {m.name.split(' ')[0]}
          </button>
        ))}
      </div>

      {/* Simplistic Side-by-Side Spotlight Card */}
      <div className="mx-auto max-w-4xl overflow-hidden rounded-3xl border border-navy/10 bg-white p-6 shadow-sm sm:p-10">
        <div key={member.name} className="grid items-center gap-8 md:grid-cols-12 md:gap-12 transition-opacity duration-200">
          {/* Photo Frame (5 Cols) */}
          <div className="md:col-span-5">
            {member.photo ? (
              <img
                src={member.photo}
                alt={member.name}
                className="aspect-[4/5] w-full rounded-2xl object-cover shadow-sm border border-navy/10"
              />
            ) : (
              <PhotoPlaceholder
                label={`${member.name} photo`}
                className="aspect-[4/5] w-full shadow-sm"
              />
            )}
          </div>

          {/* Caption & Bio (7 Cols) */}
          <div className="flex flex-col justify-between md:col-span-7">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="eyebrow !bg-navy-50 !text-navy font-semibold text-xs">
                  {member.grade}
                </span>
                <span className="eyebrow !bg-teal/10 !text-teal-800 font-semibold text-xs">
                  {member.focus}
                </span>
              </div>

              <h3 className="mt-3 font-display text-2xl font-bold text-navy sm:text-3xl">
                {member.name}
              </h3>

              <p className="mt-5 text-[15px] leading-relaxed text-muted sm:text-[16px]">
                {member.bio}
              </p>
            </div>

            {/* Minimalist Bottom Navigation Controls */}
            <div className="mt-8 flex items-center justify-between border-t border-navy/10 pt-5">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted">
                {index + 1} of {total}
              </span>

              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrev}
                  aria-label="Previous team member"
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-navy/15 bg-white text-navy transition-colors duration-150 hover:bg-navy-50"
                >
                  <ChevronLeft size={18} />
                </button>
                <button
                  onClick={handleNext}
                  aria-label="Next team member"
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-navy/15 bg-white text-navy transition-colors duration-150 hover:bg-navy-50"
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

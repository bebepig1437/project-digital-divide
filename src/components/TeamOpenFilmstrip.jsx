import { useRef } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { team } from '../data/team'
import PhotoPlaceholder from './PhotoPlaceholder'

export default function TeamOpenFilmstrip() {
  const scrollRef = useRef(null)

  const scroll = (direction) => {
    if (scrollRef.current) {
      const offset = direction === 'left' ? -380 : 380
      scrollRef.current.scrollBy({ left: offset, behavior: 'smooth' })
    }
  }

  return (
    <div className="w-full">
      <div className="mx-auto max-w-6xl">
        {/* Filmstrip Header Controls */}
        <div className="mb-4 flex items-center justify-end gap-2 px-1">
          <button
            type="button"
            onClick={() => scroll('left')}
            aria-label="Scroll left"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-line/15 bg-surface text-heading shadow-sm transition hover:bg-navy hover:text-white active:scale-95"
          >
            <ChevronLeft size={20} />
          </button>
          <button
            type="button"
            onClick={() => scroll('right')}
            aria-label="Scroll right"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-line/15 bg-surface text-heading shadow-sm transition hover:bg-navy hover:text-white active:scale-95"
          >
            <ChevronRight size={20} />
          </button>
        </div>

        {/* Horizontal Filmstrip Track */}
        <div
          ref={scrollRef}
          className="flex gap-5 overflow-x-auto pb-6 pt-1 scrollbar-none [scrollbar-width:none] [-ms-overflow-style:none] snap-x snap-mandatory"
        >
          {team.map((member) => (
            <div
              key={member.name}
              className="w-[300px] sm:w-[350px] flex-shrink-0 snap-start overflow-hidden rounded-3xl border border-line/10 bg-surface p-5 shadow-sm transition-all duration-300 hover:shadow-md hover:-translate-y-1"
            >
              {/* Photo Frame */}
              <div className="overflow-hidden rounded-2xl bg-raised border border-line/10">
                {member.photo ? (
                  <img
                    src={member.photo}
                    alt={member.name}
                    className="aspect-[4/5] w-full object-cover transition-transform duration-500 hover:scale-105"
                  />
                ) : (
                  <PhotoPlaceholder
                    label={`${member.name.split(' ')[0]} photo`}
                    className="aspect-[4/5] w-full"
                  />
                )}
              </div>

              {/* Text Info */}
              <div className="mt-5">
                <p className="text-xs font-semibold uppercase tracking-wider text-teal-700">
                  {member.role || member.focus}
                </p>
                <h3 className="mt-1 font-display text-xl font-bold tracking-tight text-navy sm:text-2xl">
                  {member.name}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-muted line-clamp-6">
                  {member.bio}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

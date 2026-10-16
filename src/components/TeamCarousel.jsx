import { useState, useRef, useEffect } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { team } from '../data/team'
import PhotoPlaceholder from './PhotoPlaceholder'

export default function TeamCarousel() {
  const [index, setIndex] = useState(0)
  const [dragOffset, setDragOffset] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const total = team.length

  const startX = useRef(0)
  const currentDrag = useRef(0)

  const next = () => setIndex((prev) => (prev + 1) % total)
  const prev = () => setIndex((prev) => (prev - 1 + total) % total)

  // Keyboard navigation
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'ArrowRight') next()
      if (e.key === 'ArrowLeft') prev()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  // Touch handlers for mobile swiping
  const handleTouchStart = (e) => {
    setIsDragging(true)
    startX.current = e.touches[0].clientX
    currentDrag.current = 0
  }

  const handleTouchMove = (e) => {
    if (!startX.current) return
    const diff = e.touches[0].clientX - startX.current
    currentDrag.current = diff
    setDragOffset(diff)
  }

  const handleTouchEnd = () => {
    setIsDragging(false)
    const diff = currentDrag.current
    if (diff < -50) {
      next()
    } else if (diff > 50) {
      prev()
    }
    setDragOffset(0)
    startX.current = 0
    currentDrag.current = 0
  }

  // Mouse drag handlers for desktop swiping
  const handleMouseDown = (e) => {
    setIsDragging(true)
    startX.current = e.clientX
    currentDrag.current = 0
  }

  const handleMouseMove = (e) => {
    if (!isDragging) return
    const diff = e.clientX - startX.current
    currentDrag.current = diff
    setDragOffset(diff)
  }

  const handleMouseUp = () => {
    if (!isDragging) return
    setIsDragging(false)
    const diff = currentDrag.current
    if (diff < -50) {
      next()
    } else if (diff > 50) {
      prev()
    }
    setDragOffset(0)
    startX.current = 0
    currentDrag.current = 0
  }

  const handleMouseLeave = () => {
    if (isDragging) {
      handleMouseUp()
    }
  }

  return (
    <div className="relative mx-auto max-w-5xl px-3 sm:px-14 select-none">
      {/* Side Arrow: Prev */}
      <button
        type="button"
        onClick={prev}
        aria-label="Previous team member"
        className="absolute left-0 top-1/2 z-20 -translate-y-1/2 flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-full border border-navy/15 bg-white text-navy shadow-sm transition hover:bg-navy hover:text-white hover:scale-105 active:scale-95"
      >
        <ChevronLeft className="h-5 w-5 sm:h-6 sm:w-6" />
      </button>

      {/* Side Arrow: Next */}
      <button
        type="button"
        onClick={next}
        aria-label="Next team member"
        className="absolute right-0 top-1/2 z-20 -translate-y-1/2 flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-full border border-navy/15 bg-white text-navy shadow-sm transition hover:bg-navy hover:text-white hover:scale-105 active:scale-95"
      >
        <ChevronRight className="h-5 w-5 sm:h-6 sm:w-6" />
      </button>

      {/* Overflow Viewport */}
      <div
        className="overflow-hidden rounded-3xl"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
      >
        {/* Sliding Track */}
        <div
          className={`flex ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
          style={{
            transform: `translateX(calc(-${index * 100}% + ${dragOffset}px))`,
            transition: isDragging ? 'none' : 'transform 450ms cubic-bezier(0.2, 0.8, 0.2, 1)',
          }}
        >
          {team.map((member) => (
            <div key={member.name} className="w-full flex-shrink-0">
              <div className="rounded-3xl border border-navy/10 bg-white p-6 sm:p-12 shadow-sm">
                <div className="grid items-center gap-8 md:grid-cols-12 md:gap-12">
                  {/* Photo Frame */}
                  <div className="md:col-span-5 pointer-events-none">
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

                  {/* Editorial Text */}
                  <div className="md:col-span-7 flex flex-col justify-between">
                    <div>
                      <p className="text-xs sm:text-sm font-semibold tracking-wider text-teal-700 uppercase">
                        {member.focus} · {member.grade}
                      </p>

                      <h3 className="mt-2 text-2xl font-bold tracking-tight text-navy sm:text-4xl">
                        {member.name}
                      </h3>

                      <p className="mt-5 text-[15px] sm:text-[16px] leading-relaxed text-muted">
                        {member.bio}
                      </p>
                    </div>

                    {/* Minimal Counter */}
                    <div className="mt-8 pt-6 border-t border-navy/10 flex items-center justify-between text-xs font-medium text-navy/50">
                      <span>Swipe or use arrows to browse</span>
                      <span className="font-mono text-sm text-navy/80 font-semibold">
                        {String(index + 1).padStart(2, '0')} / {String(total).padStart(2, '0')}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Minimal clean progress indicator below */}
      <div className="mx-auto mt-6 flex max-w-[200px] items-center gap-1.5 justify-center">
        {team.map((_, i) => (
          <div
            key={i}
            className={`h-1 rounded-full transition-all duration-300 ${
              i === index ? 'w-8 bg-teal-600' : 'w-2 bg-navy/15'
            }`}
          />
        ))}
      </div>
    </div>
  )
}

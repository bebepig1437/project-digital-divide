import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ChevronRight, User, Sparkles } from 'lucide-react'
import { team } from '../../data/team'

export default function TeamFilmstripSpotlight() {
  const [activeIndex, setActiveIndex] = useState(0)
  const total = team.length

  const handleNext = () => setActiveIndex((prev) => (prev + 1) % total)
  const handlePrev = () => setActiveIndex((prev) => (prev - 1 + total) % total)

  const activeMember = team[activeIndex]

  return (
    <div className="relative mx-auto w-full max-w-6xl py-8">
      {/* Header */}
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="eyebrow !text-teal">Style 2: Filmstrip Spotlight</span>
          <h3 className="mt-1 font-display text-2xl font-bold text-navy sm:text-3xl">
            Cinematic Split Screen with Scrubber
          </h3>
          <p className="mt-1 text-sm text-muted">
            Large photography-first editorial layout with bottom scrubber navigation.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handlePrev}
            aria-label="Previous lead"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-navy/15 bg-white text-navy shadow-sm transition-all hover:bg-teal hover:text-white"
          >
            <ChevronLeft size={20} />
          </button>
          <button
            onClick={handleNext}
            aria-label="Next lead"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-navy/15 bg-white text-navy shadow-sm transition-all hover:bg-teal hover:text-white"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      {/* Main Split Showcase */}
      <div className="overflow-hidden rounded-3xl border border-navy/10 bg-white p-6 shadow-xl sm:p-10">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeMember.name}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.3 }}
            className="grid gap-8 md:grid-cols-12 md:items-center md:gap-12"
          >
            {/* Left: Big Portrait Photo Frame (5 Cols) */}
            <div className="relative md:col-span-5">
              <div className="relative aspect-[4/5] w-full overflow-hidden rounded-2xl border-4 border-navy/5 bg-gradient-to-b from-navy-50 to-cream shadow-md">
                {activeMember.photo ? (
                  <img
                    src={activeMember.photo}
                    alt={activeMember.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full flex-col items-center justify-center p-6 text-center">
                    <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white text-navy shadow-md">
                      <User size={36} className="text-teal" />
                    </div>
                    <span className="mt-4 font-display text-lg font-bold text-navy">
                      {activeMember.name}
                    </span>
                    <span className="text-xs text-muted">Portrait photo frame</span>
                  </div>
                )}

                <div className="absolute bottom-3 left-3 right-3 rounded-xl bg-navy/85 px-3 py-2 text-center text-xs font-bold text-white backdrop-blur-md">
                  {activeMember.focus}
                </div>
              </div>
            </div>

            {/* Right: Rich Editorial Content (7 Cols) */}
            <div className="flex flex-col justify-between md:col-span-7">
              <div>
                <div className="flex items-center gap-2.5">
                  <span className="eyebrow !bg-navy-50 !text-navy font-bold">
                    {activeMember.grade}
                  </span>
                  <span className="eyebrow flex items-center gap-1.5 border border-teal/20 !bg-teal/10 !text-teal-800">
                    <Sparkles size={12} /> {activeMember.focus}
                  </span>
                </div>

                <h4 className="mt-4 font-display text-3xl font-extrabold tracking-tight text-navy sm:text-5xl">
                  {activeMember.name}
                </h4>

                <p className="mt-6 text-[16px] leading-relaxed text-muted sm:text-lg">
                  {activeMember.bio}
                </p>
              </div>

              {/* Progress counter */}
              <div className="mt-8 flex items-center justify-between border-t border-navy/10 pt-5 text-xs font-semibold text-muted">
                <span>Team member 0{activeIndex + 1} of 0{total}</span>
                <span className="font-mono text-teal">Project Digital Divide Lead</span>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Bottom Filmstrip Thumbnails Track */}
        <div className="mt-10 border-t border-navy/10 pt-6">
          <p className="mb-4 text-xs font-bold uppercase tracking-wider text-muted">
            Filmstrip Scrubber
          </p>

          <div className="grid grid-cols-5 gap-3">
            {team.map((member, idx) => {
              const isSelected = idx === activeIndex
              return (
                <button
                  key={member.name}
                  onClick={() => setActiveIndex(idx)}
                  className={`group relative flex flex-col items-center rounded-2xl border p-2.5 transition-all text-center ${
                    isSelected
                      ? 'border-teal bg-teal/5 shadow-md ring-2 ring-teal/30'
                      : 'border-navy/10 bg-navy-50/50 hover:border-navy/20 hover:bg-white'
                  }`}
                >
                  <div className="relative h-12 w-12 overflow-hidden rounded-xl bg-white shadow-sm">
                    {member.photo ? (
                      <img src={member.photo} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center font-display text-xs font-bold text-navy">
                        {member.name.split(' ').map((n) => n[0]).join('')}
                      </div>
                    )}
                  </div>

                  <span className="mt-2 text-xs font-bold text-navy truncate w-full">
                    {member.name.split(' ')[0]}
                  </span>
                  <span className="text-[10px] text-muted truncate w-full">
                    0{idx + 1}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

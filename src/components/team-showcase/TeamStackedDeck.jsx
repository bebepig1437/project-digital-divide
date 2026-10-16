import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ChevronRight, RotateCcw, User, Layers } from 'lucide-react'
import { team } from '../../data/team'

export default function TeamStackedDeck() {
  const [cards, setCards] = useState(team.map((m, i) => ({ ...m, originalIndex: i })))

  const handleNext = () => {
    setCards((prev) => {
      const copy = [...prev]
      const first = copy.shift()
      copy.push(first)
      return copy
    })
  }

  const handlePrev = () => {
    setCards((prev) => {
      const copy = [...prev]
      const last = copy.pop()
      copy.unshift(last)
      return copy
    })
  }

  const handleReset = () => {
    setCards(team.map((m, i) => ({ ...m, originalIndex: i })))
  }

  const topCard = cards[0]

  return (
    <div className="relative mx-auto w-full max-w-5xl py-8">
      {/* Header */}
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="eyebrow !text-teal">Style 3: 3D Stacked Deck</span>
          <h3 className="mt-1 font-display text-2xl font-bold text-navy sm:text-3xl">
            Swipeable Depth Deck
          </h3>
          <p className="mt-1 text-sm text-muted">
            Drag or throw the top card to shuffle through the team stack.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleReset}
            title="Reset stack"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-navy/15 bg-white text-navy shadow-sm transition-all hover:bg-navy-50"
          >
            <RotateCcw size={16} />
          </button>
          <button
            onClick={handlePrev}
            aria-label="Previous card"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-navy/15 bg-white text-navy shadow-sm transition-all hover:bg-teal hover:text-white"
          >
            <ChevronLeft size={20} />
          </button>
          <button
            onClick={handleNext}
            aria-label="Next card"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-navy/15 bg-white text-navy shadow-sm transition-all hover:bg-teal hover:text-white"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      {/* Stack Container */}
      <div className="relative flex h-[540px] w-full items-center justify-center sm:h-[580px]">
        {cards.map((member, index) => {
          // Only render top 3 for clean performance & visual stack
          if (index > 2) return null

          const isTop = index === 0
          const scale = 1 - index * 0.05
          const y = index * 18
          const opacity = 1 - index * 0.18
          const zIndex = 20 - index

          return (
            <motion.div
              key={member.name}
              drag={isTop ? 'x' : false}
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.25}
              onDragEnd={(e, { offset, velocity }) => {
                if (Math.abs(offset.x) > 100 || Math.abs(velocity.x) > 400) {
                  handleNext()
                }
              }}
              animate={{
                scale,
                y,
                opacity,
                rotate: isTop ? 0 : (index % 2 === 0 ? 2 : -2),
              }}
              transition={{ type: 'spring', stiffness: 260, damping: 20 }}
              style={{ zIndex }}
              className={`absolute w-full max-w-xl rounded-3xl border border-navy/15 bg-white p-7 shadow-2xl transition-shadow sm:p-9 ${
                isTop ? 'cursor-grab active:cursor-grabbing ring-4 ring-teal/15' : 'pointer-events-none'
              }`}
            >
              {/* Top Accent Bar */}
              <div className="mb-6 flex items-center justify-between border-b border-navy/10 pb-4">
                <div className="flex items-center gap-2">
                  <span className="eyebrow !bg-navy-50 !text-navy font-bold">
                    {member.grade}
                  </span>
                  <span className="eyebrow !bg-teal/10 !text-teal-800">
                    {member.focus}
                  </span>
                </div>
                <span className="flex items-center gap-1 text-xs font-mono font-bold text-muted">
                  <Layers size={13} /> {member.originalIndex + 1} / {team.length}
                </span>
              </div>

              {/* Main Content */}
              <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:gap-7">
                <div className="relative h-28 w-28 flex-shrink-0 overflow-hidden rounded-2xl border-2 border-navy/10 bg-navy-50 shadow-inner sm:h-36 sm:w-36">
                  {member.photo ? (
                    <img src={member.photo} alt={member.name} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full flex-col items-center justify-center p-2 text-center">
                      <User size={30} className="text-teal" />
                      <span className="mt-1 text-xs font-bold text-navy">{member.name.split(' ')[0]}</span>
                    </div>
                  )}
                </div>

                <div className="flex-1">
                  <h4 className="font-display text-2xl font-extrabold text-navy sm:text-3xl">
                    {member.name}
                  </h4>
                  <p className="mt-1 text-xs font-semibold text-teal">
                    {member.focus}
                  </p>
                  <p className="mt-4 text-[15px] leading-relaxed text-muted">
                    {member.bio}
                  </p>
                </div>
              </div>

              {/* Bottom Swipe Prompt */}
              {isTop && (
                <div className="mt-6 border-t border-navy/10 pt-4 text-center text-xs font-semibold text-muted/70">
                  Swipe horizontally or click arrows to see next card
                </div>
              )}
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}

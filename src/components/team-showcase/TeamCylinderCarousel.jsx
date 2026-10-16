import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ChevronRight, User } from 'lucide-react'
import { team } from '../../data/team'

export default function TeamCylinderCarousel() {
  const [activeIndex, setActiveIndex] = useState(0)
  const total = team.length

  const handleNext = () => setActiveIndex((prev) => (prev + 1) % total)
  const handlePrev = () => setActiveIndex((prev) => (prev - 1 + total) % total)

  return (
    <div className="relative mx-auto w-full max-w-6xl py-8">
      {/* Header info */}
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="eyebrow !text-teal">Style 1: 3D Curved Cylinder</span>
          <h3 className="mt-1 font-display text-2xl font-bold text-navy sm:text-3xl">
            Cylindrical Perspective Carousel
          </h3>
          <p className="mt-1 text-sm text-muted">
            Drag left or right, or click any background card to bring it front and center.
          </p>
        </div>

        <div className="flex items-center gap-2">
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

      {/* 3D Perspective Stage */}
      <div 
        className="relative flex h-[580px] w-full items-center justify-center overflow-hidden sm:h-[620px]"
        style={{ perspective: '1200px' }}
      >
        <motion.div
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.15}
          onDragEnd={(e, { offset, velocity }) => {
            const swipe = offset.x * velocity.x
            if (swipe < -60 || offset.x < -70) handleNext()
            if (swipe > 60 || offset.x > 70) handlePrev()
          }}
          className="relative flex h-full w-full items-center justify-center cursor-grab active:cursor-grabbing"
        >
          {team.map((member, index) => {
            // Calculate distance relative to activeIndex (-2, -1, 0, 1, 2)
            let offset = index - activeIndex
            if (offset > total / 2) offset -= total
            if (offset < -total / 2) offset += total

            const isCenter = offset === 0
            const absOffset = Math.abs(offset)

            // 3D positioning calculations
            const x = offset * 280
            const z = -absOffset * 150
            const rotateY = offset * -25
            const scale = Math.max(0.78, 1 - absOffset * 0.14)
            const opacity = Math.max(0.25, 1 - absOffset * 0.35)
            const zIndex = 30 - absOffset * 10

            return (
              <motion.div
                key={member.name}
                onClick={() => setActiveIndex(index)}
                animate={{
                  x,
                  z,
                  rotateY,
                  scale,
                  opacity,
                }}
                transition={{ type: 'spring', stiffness: 220, damping: 25 }}
                style={{
                  zIndex,
                  transformStyle: 'preserve-3d',
                }}
                className={`absolute w-[310px] sm:w-[380px] rounded-3xl border transition-shadow duration-300 ${
                  isCenter
                    ? 'border-teal/40 bg-white shadow-2xl shadow-navy/15 ring-4 ring-teal/15 cursor-default'
                    : 'border-navy/10 bg-white/95 shadow-lg hover:border-teal/30 hover:opacity-90 cursor-pointer'
                }`}
              >
                {/* Accent Top Bar */}
                <div className={`h-2 w-full rounded-t-3xl ${
                  isCenter ? 'bg-gradient-to-r from-teal to-navy' : 'bg-navy/10'
                }`} />

                <div className="p-6 sm:p-7">
                  {/* Photo Frame + Name Header */}
                  <div className="flex items-center gap-4">
                    <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-2xl border-2 border-navy/10 bg-navy-50">
                      {member.photo ? (
                        <img src={member.photo} alt={member.name} className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full w-full flex-col items-center justify-center text-center">
                          <User size={24} className="text-teal" />
                          <span className="text-[10px] font-bold text-navy">{member.name.split(' ')[0]}</span>
                        </div>
                      )}
                    </div>

                    <div>
                      <span className="eyebrow !bg-navy-50 !text-navy font-semibold text-[10px]">
                        {member.grade}
                      </span>
                      <h4 className="mt-1 font-display text-xl font-bold text-navy sm:text-2xl">
                        {member.name}
                      </h4>
                      <p className="text-xs font-semibold text-teal truncate max-w-[200px]">
                        {member.focus}
                      </p>
                    </div>
                  </div>

                  {/* Complete Bio (Readable directly without modals) */}
                  <div className="mt-5 border-t border-navy/10 pt-4">
                    <p className="line-clamp-6 text-[14px] leading-relaxed text-muted sm:text-[15px]">
                      {member.bio}
                    </p>
                  </div>

                  {/* Stage Number Footer */}
                  <div className="mt-5 flex items-center justify-between text-xs font-bold text-muted">
                    <span>Lead 0{index + 1} of 0{total}</span>
                    {isCenter && <span className="text-teal">Active Spotlight</span>}
                  </div>
                </div>
              </motion.div>
            )
          })}
        </motion.div>
      </div>

      {/* Pagination dots */}
      <div className="mt-6 flex justify-center gap-2">
        {team.map((m, idx) => (
          <button
            key={m.name}
            onClick={() => setActiveIndex(idx)}
            className={`h-2.5 rounded-full transition-all ${
              idx === activeIndex ? 'w-8 bg-teal' : 'w-2.5 bg-navy/20 hover:bg-navy/40'
            }`}
            aria-label={`Jump to ${m.name}`}
          />
        ))}
      </div>
    </div>
  )
}

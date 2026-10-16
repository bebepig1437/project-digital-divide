import { useState } from 'react'
import { motion } from 'framer-motion'
import { User, Sparkles } from 'lucide-react'
import { team } from '../../data/team'

export default function TeamExpandableAccordion() {
  const [expandedIndex, setExpandedIndex] = useState(0)

  return (
    <div className="relative mx-auto w-full max-w-6xl py-8">
      {/* Header */}
      <div className="mb-8">
        <span className="eyebrow !text-teal">Style 4: Expandable Accordion</span>
        <h3 className="mt-1 font-display text-2xl font-bold text-navy sm:text-3xl">
          Interactive Flex Accordion Wall
        </h3>
        <p className="mt-1 text-sm text-muted">
          Click or hover any vertical slice to expand their full profile.
        </p>
      </div>

      {/* Accordion Wall (Desktop: horizontal flex cards, Mobile: vertical stack) */}
      <div className="flex flex-col gap-3 lg:h-[520px] lg:flex-row">
        {team.map((member, index) => {
          const isExpanded = index === expandedIndex

          return (
            <motion.div
              key={member.name}
              onClick={() => setExpandedIndex(index)}
              onMouseEnter={() => setExpandedIndex(index)}
              layout
              transition={{ type: 'spring', stiffness: 240, damping: 25 }}
              className={`relative cursor-pointer overflow-hidden rounded-3xl border transition-all duration-300 ${
                isExpanded
                  ? 'border-teal/40 bg-white shadow-xl ring-2 ring-teal/20 lg:flex-[4]'
                  : 'border-navy/10 bg-white/70 hover:bg-white hover:border-navy/20 lg:flex-1'
              }`}
            >
              {/* Left Color Strip Indicator */}
              <div
                className={`absolute left-0 top-0 bottom-0 w-2 transition-colors ${
                  isExpanded ? 'bg-teal' : 'bg-navy/15'
                }`}
              />

              {isExpanded ? (
                /* Expanded Full View */
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.28 }}
                  className="flex h-full flex-col justify-between p-7 pl-9 sm:p-9 sm:pl-11"
                >
                  <div>
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="eyebrow !bg-navy-50 !text-navy font-bold">
                          {member.grade}
                        </span>
                        <span className="eyebrow !bg-teal/10 !text-teal-800">
                          {member.focus}
                        </span>
                      </div>
                      <span className="font-mono text-xs font-bold text-muted">
                        0{index + 1} / 0{team.length}
                      </span>
                    </div>

                    <div className="mt-6 flex flex-col gap-6 sm:flex-row sm:items-start sm:gap-7">
                      <div className="relative h-28 w-28 flex-shrink-0 overflow-hidden rounded-2xl border-2 border-navy/10 bg-navy-50 shadow-inner sm:h-36 sm:w-36">
                        {member.photo ? (
                          <img src={member.photo} alt={member.name} className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full w-full flex-col items-center justify-center p-2 text-center">
                            <User size={32} className="text-teal" />
                            <span className="mt-2 text-xs font-bold text-navy">{member.name.split(' ')[0]}</span>
                          </div>
                        )}
                      </div>

                      <div className="flex-1">
                        <h4 className="font-display text-2xl font-extrabold text-navy sm:text-3xl">
                          {member.name}
                        </h4>
                        <p className="mt-1 text-sm font-semibold text-teal">
                          {member.focus}
                        </p>
                        <p className="mt-4 text-[15px] leading-relaxed text-muted sm:text-[16px]">
                          {member.bio}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 border-t border-navy/10 pt-4 text-xs font-semibold text-teal flex items-center gap-1.5">
                    <Sparkles size={13} /> Active selection
                  </div>
                </motion.div>
              ) : (
                /* Collapsed Vertical Slice View */
                <div className="flex h-full items-center justify-between p-5 pl-7 lg:flex-col lg:justify-between lg:py-8">
                  <span className="font-mono text-xs font-bold text-muted">
                    0{index + 1}
                  </span>

                  <span className="font-display text-base font-bold text-navy lg:[writing-mode:vertical-rl] lg:rotate-180">
                    {member.name}
                  </span>

                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-navy-50 text-navy/60">
                    <User size={15} />
                  </div>
                </div>
              )}
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  ChevronLeft, 
  ChevronRight, 
  RotateCw, 
  Sparkles, 
  Wrench, 
  FileText, 
  Users, 
  Terminal, 
  ShieldCheck,
  User,
  ArrowRight
} from 'lucide-react'
import { team } from '../data/team'

const roleIcons = [
  FileText,    // Michelle: Narrative and media
  Users,       // Joseph: Outreach and partnerships
  Wrench,      // Joshua: Hardware and bench operations
  Terminal,    // Sahil: Software and internal systems
  ShieldCheck, // Kaleb: Software and systems testing
]

const memberKeyDetails = [
  { ownership: 'District follow-ups, case studies, media' },
  { ownership: 'First district contact, grant writing, outreach' },
  { ownership: 'Diagnostics, component replacement, drive wiping' },
  { ownership: 'Pipeline systems, intake logs, asset tracking' },
  { ownership: 'Software testing, tool validation, QA' },
]

export default function TeamOrbitalWheel() {
  const [activeIndex, setActiveIndex] = useState(0)
  const [isAutoRotating, setIsAutoRotating] = useState(false)
  const total = team.length

  const handleNext = () => setActiveIndex((prev) => (prev + 1) % total)
  const handlePrev = () => setActiveIndex((prev) => (prev - 1 + total) % total)

  // Handle keyboard arrows
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowRight') handleNext()
      if (e.key === 'ArrowLeft') handlePrev()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Auto rotation
  useEffect(() => {
    if (!isAutoRotating) return
    const timer = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % total)
    }, 5000)
    return () => clearInterval(timer)
  }, [isAutoRotating, total])

  const activeMember = team[activeIndex]
  const ActiveIcon = roleIcons[activeIndex]
  const activeDetail = memberKeyDetails[activeIndex]

  // Circular math: 360 deg divided evenly
  const angleStep = 360 / total
  const wheelRotation = -activeIndex * angleStep

  return (
    <div className="relative mx-auto w-full max-w-7xl px-2 sm:px-4">
      {/* Top Controls Header */}
      <div className="mb-12 flex flex-wrap items-end justify-between gap-6 border-b border-navy/10 pb-6">
        <div>
          <span className="eyebrow flex items-center gap-2 font-semibold !text-teal">
            <Sparkles size={14} /> The Five Team Leads
          </span>
          <h2 className="mt-2 font-display text-3xl font-extrabold tracking-tight text-navy sm:text-4xl lg:text-5xl">
            Who Builds, Tests &amp; Runs PDD
          </h2>
          <p className="mt-2 text-base text-muted sm:text-lg">
            Click any member or swipe cards to explore each person's role and hands-on work.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsAutoRotating(!isAutoRotating)}
            className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-bold tracking-wide transition-all ${
              isAutoRotating
                ? 'bg-teal text-white shadow-md shadow-teal/20'
                : 'border border-navy/15 bg-white text-navy hover:bg-navy-50'
            }`}
          >
            <RotateCw size={14} className={isAutoRotating ? 'animate-spin' : ''} />
            {isAutoRotating ? 'Auto Rotating' : 'Auto Play'}
          </button>

          <div className="flex items-center gap-1.5">
            <button
              onClick={handlePrev}
              aria-label="Previous member"
              className="flex h-11 w-11 items-center justify-center rounded-full border border-navy/15 bg-white text-navy shadow-sm transition-all hover:border-teal hover:bg-teal hover:text-white"
            >
              <ChevronLeft size={22} />
            </button>
            <button
              onClick={handleNext}
              aria-label="Next member"
              className="flex h-11 w-11 items-center justify-center rounded-full border border-navy/15 bg-white text-navy shadow-sm transition-all hover:border-teal hover:bg-teal hover:text-white"
            >
              <ChevronRight size={22} />
            </button>
          </div>
        </div>
      </div>

      {/* Main Showcase Section */}
      <div className="grid items-center gap-12 xl:grid-cols-12 xl:gap-16">
        
        {/* Large Rotating Orbital Wheel Stage (5 Cols on XL) */}
        <div className="relative flex items-center justify-center xl:col-span-5">
          <div className="relative flex h-[380px] w-[380px] items-center justify-center sm:h-[480px] sm:w-[480px] lg:h-[520px] lg:w-[520px]">
            
            {/* Outer Subtle Radial Glow */}
            <div className="absolute inset-4 rounded-full bg-gradient-to-tr from-teal/10 via-transparent to-navy/5 blur-2xl" />

            {/* Orbital Guide Rings */}
            <div className="absolute inset-0 rounded-full border border-dashed border-teal/30" />
            <div className="absolute inset-10 rounded-full border border-navy/10 sm:inset-12" />
            <div className="absolute inset-24 rounded-full border border-navy/5 sm:inset-28" />

            {/* Center Logo Hub */}
            <div className="relative z-10 flex h-28 w-28 flex-col items-center justify-center rounded-full border-4 border-white bg-white p-3 shadow-2xl sm:h-36 sm:w-36">
              <img
                src="/logo.webp"
                alt="Project Digital Divide"
                className="h-14 w-14 object-contain sm:h-20 sm:w-20"
              />
              <span className="mt-1 font-display text-[11px] font-bold tracking-tight text-navy sm:text-xs">
                Project Digital Divide
              </span>
            </div>

            {/* Rotating Orbital Track Container */}
            <motion.div
              className="absolute inset-0"
              animate={{ rotate: wheelRotation }}
              transition={{ type: 'spring', stiffness: 50, damping: 14 }}
            >
              {team.map((member, i) => {
                const nodeAngle = i * angleStep
                const isSelected = i === activeIndex
                const Icon = roleIcons[i]
                
                // Responsive orbit radius
                const radius = 195

                return (
                  <div
                    key={member.name}
                    className="absolute left-1/2 top-1/2 -ml-10 -mt-10 sm:-ml-12 sm:-mt-12"
                    style={{
                      transform: `rotate(${nodeAngle}deg) translate(${radius}px) rotate(-${nodeAngle}deg)`,
                    }}
                  >
                    {/* Counter-rotate avatar so it always stays perfectly upright */}
                    <motion.button
                      onClick={() => setActiveIndex(i)}
                      animate={{ rotate: -wheelRotation }}
                      transition={{ type: 'spring', stiffness: 50, damping: 14 }}
                      whileHover={{ scale: 1.12 }}
                      whileTap={{ scale: 0.95 }}
                      className={`group relative flex h-20 w-20 items-center justify-center rounded-full border-4 transition-all duration-300 sm:h-24 sm:w-24 ${
                        isSelected
                          ? 'border-teal bg-white shadow-2xl shadow-teal/30 ring-8 ring-teal/20 scale-110 z-20'
                          : 'border-white bg-navy-50 text-navy/70 shadow-lg hover:border-teal/50 hover:shadow-xl z-10'
                      }`}
                      aria-label={`Select ${member.name}`}
                    >
                      {/* Photo or Initials Avatar */}
                      {member.photo ? (
                        <img
                          src={member.photo}
                          alt={member.name}
                          className="h-full w-full rounded-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full flex-col items-center justify-center rounded-full bg-gradient-to-br from-navy-50 to-cream p-1 text-center">
                          <span className="font-display text-sm font-extrabold text-navy sm:text-base">
                            {member.name.split(' ').map((n) => n[0]).join('')}
                          </span>
                          <span className="text-[10px] font-semibold text-teal truncate max-w-[56px]">
                            {member.name.split(' ')[0]}
                          </span>
                        </div>
                      )}

                      {/* Small Station Tag */}
                      <span className={`absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold shadow ${
                        isSelected ? 'bg-teal text-white' : 'bg-navy text-white'
                      }`}>
                        0{i + 1}
                      </span>
                    </motion.button>
                  </div>
                )
              })}
            </motion.div>
          </div>
        </div>

        {/* Big Spotlight Profile Card (7 Cols on XL with Swipe Gestures) */}
        <div className="xl:col-span-7">
          <motion.div
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.2}
            onDragEnd={(e, { offset, velocity }) => {
              const swipe = Math.abs(offset.x) * velocity.x
              if (swipe < -100 || offset.x < -80) {
                handleNext()
              } else if (swipe > 100 || offset.x > 80) {
                handlePrev()
              }
            }}
            className="cursor-grab active:cursor-grabbing"
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={activeMember.name}
                initial={{ opacity: 0, x: 25 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -25 }}
                transition={{ duration: 0.32, ease: 'easeOut' }}
                className="relative overflow-hidden rounded-3xl border border-navy/15 bg-white p-7 shadow-xl sm:p-10"
              >
                {/* Decorative Top Accent Bar */}
                <div className="absolute left-0 top-0 h-2 w-full bg-gradient-to-r from-teal via-navy to-teal" />

                {/* Top Badges & Stage Counter */}
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span className="rounded-full bg-navy px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-white">
                      {activeMember.grade}
                    </span>
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-teal/30 bg-teal/10 px-3.5 py-1 text-xs font-bold text-teal-800">
                      <ActiveIcon size={14} /> {activeMember.focus}
                    </span>
                  </div>
                  <span className="font-mono text-sm font-bold text-muted">
                    0{activeIndex + 1} / 0{total}
                  </span>
                </div>

                {/* Member Profile Layout: Large Photo Frame + Bio */}
                <div className="mt-8 grid gap-8 sm:grid-cols-[180px_1fr] lg:grid-cols-[210px_1fr]">
                  
                  {/* Photo Frame (Handles uploaded image or polished portrait placeholder) */}
                  <div className="relative aspect-[4/5] w-full overflow-hidden rounded-2xl border-2 border-navy/10 bg-gradient-to-b from-navy-50 to-cream shadow-inner">
                    {activeMember.photo ? (
                      <img
                        src={activeMember.photo}
                        alt={activeMember.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full flex-col items-center justify-center p-5 text-center">
                        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white text-navy shadow-sm">
                          <User size={32} className="text-teal" />
                        </div>
                        <span className="mt-3 font-display text-sm font-bold text-navy">
                          {activeMember.name}
                        </span>
                        <span className="mt-1 text-[11px] font-semibold text-muted">
                          Photo coming soon
                        </span>
                      </div>
                    )}

                    <div className="absolute bottom-2 left-2 right-2 rounded-lg bg-navy/85 px-2.5 py-1.5 text-center text-[11px] font-semibold text-white backdrop-blur-sm">
                      {activeMember.focus}
                    </div>
                  </div>

                  {/* Bio & Scope Details */}
                  <div className="flex flex-col justify-between">
                    <div>
                      <h3 className="font-display text-3xl font-extrabold tracking-tight text-navy sm:text-4xl">
                        {activeMember.name}
                      </h3>

                      {/* Primary Ownership Pill */}
                      <div className="mt-3 inline-flex items-center gap-2 rounded-xl bg-navy-50/80 px-3.5 py-2 text-xs font-semibold text-navy">
                        <span className="text-teal font-bold uppercase tracking-wider">Owns:</span>
                        <span>{activeDetail.ownership}</span>
                      </div>

                      {/* Full Human Bio */}
                      <p className="mt-5 text-[16px] leading-relaxed text-muted sm:text-[17px]">
                        {activeMember.bio}
                      </p>
                    </div>

                    {/* Drag / Swipe Helper Prompt */}
                    <div className="mt-6 flex items-center gap-2 text-xs font-medium text-muted/70">
                      <span>Swipe card or use arrows to view next lead</span>
                      <ArrowRight size={13} />
                    </div>
                  </div>
                </div>

                {/* Bottom Quick Thumbnail Strip */}
                <div className="mt-10 border-t border-navy/10 pt-6">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <span className="text-xs font-bold uppercase tracking-wider text-muted">
                      Jump to any lead
                    </span>

                    {/* Direct clickable avatars */}
                    <div className="flex items-center gap-2.5">
                      {team.map((m, idx) => (
                        <button
                          key={m.name}
                          onClick={() => setActiveIndex(idx)}
                          className={`group relative flex h-10 items-center gap-2 rounded-full px-3 transition-all ${
                            idx === activeIndex
                              ? 'bg-teal text-white shadow-md'
                              : 'bg-navy/5 text-navy hover:bg-navy/10'
                          }`}
                        >
                          <span className="text-xs font-bold">
                            {m.name.split(' ')[0]}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </motion.div>
        </div>
      </div>
    </div>
  )
}

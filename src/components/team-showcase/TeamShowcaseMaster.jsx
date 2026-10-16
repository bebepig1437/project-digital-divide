import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, Layers, Sliders, Film, Eye } from 'lucide-react'
import TeamCylinderCarousel from './TeamCylinderCarousel'
import TeamFilmstripSpotlight from './TeamFilmstripSpotlight'
import TeamStackedDeck from './TeamStackedDeck'
import TeamExpandableAccordion from './TeamExpandableAccordion'

const SHOWCASE_STYLES = [
  { id: 'cylinder', label: '1. 3D Curved Cylinder', icon: Sliders },
  { id: 'filmstrip', label: '2. Filmstrip Spotlight', icon: Film },
  { id: 'deck', label: '3. 3D Stacked Deck', icon: Layers },
  { id: 'accordion', label: '4. Expandable Accordion', icon: Sparkles },
  { id: 'all', label: 'View All 4 Stacked', icon: Eye },
]

export default function TeamShowcaseMaster() {
  const [selectedStyle, setSelectedStyle] = useState('cylinder')

  return (
    <div className="w-full">
      {/* Interactive Style Switcher Pill Bar */}
      <div className="mx-auto mb-12 flex max-w-4xl flex-col items-center justify-center text-center">
        <span className="eyebrow !text-teal flex items-center gap-1.5">
          <Sparkles size={13} /> Interactive Showcase Selector
        </span>
        <h2 className="mt-2 font-display text-3xl font-extrabold text-navy sm:text-4xl">
          Four Creative Showcase Designs
        </h2>
        <p className="mt-2 text-sm text-muted sm:text-base">
          Click any button below to switch between all four interactive showcase models in real time.
        </p>

        {/* The Selector Tabs */}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-2 rounded-2xl border border-navy/10 bg-white p-2 shadow-sm">
          {SHOWCASE_STYLES.map((tab) => {
            const Icon = tab.icon
            const isSelected = selectedStyle === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setSelectedStyle(tab.id)}
                className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition-all sm:text-sm ${
                  isSelected
                    ? 'bg-navy text-white shadow-md'
                    : 'text-navy/70 hover:bg-navy-50 hover:text-navy'
                }`}
              >
                <Icon size={15} className={isSelected ? 'text-teal' : 'text-navy/50'} />
                {tab.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Render Selected View or All Stacked */}
      <div className="relative">
        <AnimatePresence mode="wait">
          {selectedStyle === 'all' ? (
            /* Render all 4 sequentially down the page */
            <motion.div
              key="all-stacked"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-24 divide-y divide-navy/10"
            >
              <div className="pt-4"><TeamCylinderCarousel /></div>
              <div className="pt-20"><TeamFilmstripSpotlight /></div>
              <div className="pt-20"><TeamStackedDeck /></div>
              <div className="pt-20"><TeamExpandableAccordion /></div>
            </motion.div>
          ) : (
            /* Render active style with smooth transitions */
            <motion.div
              key={selectedStyle}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.28 }}
            >
              {selectedStyle === 'cylinder' && <TeamCylinderCarousel />}
              {selectedStyle === 'filmstrip' && <TeamFilmstripSpotlight />}
              {selectedStyle === 'deck' && <TeamStackedDeck />}
              {selectedStyle === 'accordion' && <TeamExpandableAccordion />}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

import { useState } from 'react'
import { team } from '../data/team'
import PhotoPlaceholder from './PhotoPlaceholder'

export default function TeamHorizonExpander() {
  const [active, setActive] = useState(1) // Default to Joseph Hu (index 1)

  return (
    <div className="w-full">
      <div className="mx-auto max-w-6xl">
        {/* Panoramic Horizontal Expander */}
        <div className="flex h-[560px] w-full flex-col gap-3 overflow-hidden rounded-3xl border border-navy/10 bg-white p-3 shadow-sm md:h-[620px] md:flex-row md:gap-3.5 md:p-3.5">
          {team.map((member, i) => {
            const isExpanded = active === i

            return (
              <div
                key={member.name}
                onClick={() => setActive(i)}
                onMouseEnter={() => setActive(i)}
                className={`relative cursor-pointer overflow-hidden rounded-2xl transition-all duration-500 ease-[cubic-bezier(0.2,0.8,0.2,1)] ${
                  isExpanded
                    ? 'flex-[6] bg-navy-50/40 ring-1 ring-navy/10'
                    : 'flex-[1] bg-navy-50/80 hover:bg-navy-50'
                }`}
              >
                {/* Background Image / Placeholder */}
                <div className="absolute inset-0">
                  {member.photo ? (
                    <img
                      src={member.photo}
                      alt={member.name}
                      className={`h-full w-full object-cover transition-all duration-700 ${
                        isExpanded ? 'scale-100 filter-none' : 'scale-105 opacity-60 grayscale hover:opacity-80'
                      }`}
                    />
                  ) : (
                    <PhotoPlaceholder
                      label={`${member.name.split(' ')[0]} photo`}
                      className={`h-full w-full rounded-2xl transition-all duration-500 ${
                        isExpanded ? 'opacity-100' : 'opacity-40'
                      }`}
                    />
                  )}
                  {/* Subtle dark gradient overlay for text legibility when expanded */}
                  <div
                    className={`absolute inset-0 bg-gradient-to-t from-navy/95 via-navy/60 to-transparent transition-opacity duration-500 ${
                      isExpanded ? 'opacity-90' : 'opacity-50'
                    }`}
                  />
                </div>

                {/* Collapsed State: Vertical Name Label */}
                <div
                  className={`absolute inset-0 flex items-end p-4 transition-opacity duration-300 ${
                    isExpanded ? 'pointer-events-none opacity-0' : 'opacity-100'
                  }`}
                >
                  <p className="font-display text-sm font-bold tracking-wide text-white md:[writing-mode:vertical-rl] md:rotate-180">
                    {member.name}
                  </p>
                </div>

                {/* Expanded State: Full Bio & Details */}
                <div
                  className={`relative z-10 flex h-full flex-col justify-end p-6 text-white transition-all duration-500 sm:p-8 md:p-10 ${
                    isExpanded
                      ? 'translate-y-0 opacity-100 delay-100'
                      : 'pointer-events-none translate-y-6 opacity-0'
                  }`}
                >
                  <p className="text-xs font-semibold uppercase tracking-wider text-teal-300 sm:text-sm">
                    {member.role || member.focus}
                  </p>
                  <h3 className="mt-1 font-display text-2xl font-bold tracking-tight text-white sm:text-4xl">
                    {member.name}
                  </h3>
                  <p className="mt-3 max-w-2xl text-sm leading-relaxed text-cream/90 sm:text-base sm:leading-relaxed">
                    {member.bio}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

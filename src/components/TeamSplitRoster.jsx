import { useState } from 'react'
import { team } from '../data/team'
import PhotoPlaceholder from './PhotoPlaceholder'

export default function TeamSplitRoster() {
  const [selected, setSelected] = useState(1) // Default to Joseph Hu

  const currentMember = team[selected]

  return (
    <div className="w-full">
      <div className="mx-auto max-w-6xl overflow-hidden rounded-3xl border border-navy/10 bg-white p-6 shadow-sm sm:p-10 lg:p-12">
        <div className="grid items-start gap-10 md:grid-cols-12 md:gap-12">
          {/* Left: Dynamic Portrait Stage */}
          <div className="md:col-span-5">
            <div className="relative overflow-hidden rounded-2xl border border-navy/10 bg-navy-50/50 shadow-inner">
              {currentMember.photo ? (
                <img
                  key={currentMember.name}
                  src={currentMember.photo}
                  alt={currentMember.name}
                  className="aspect-[4/5] w-full object-cover transition-opacity duration-300"
                />
              ) : (
                <PhotoPlaceholder
                  key={currentMember.name}
                  label={`${currentMember.name} photo`}
                  className="aspect-[4/5] w-full"
                />
              )}
            </div>
          </div>

          {/* Right: Interactive Roster */}
          <div className="flex flex-col md:col-span-7">
            <div className="divide-y divide-navy/10">
              {team.map((member, i) => {
                const isSelected = selected === i

                return (
                  <div
                    key={member.name}
                    onClick={() => setSelected(i)}
                    onMouseEnter={() => setSelected(i)}
                    className={`cursor-pointer py-4 transition-all duration-200 ${
                      isSelected ? 'bg-navy-50/40 px-4 rounded-xl' : 'hover:pl-2'
                    }`}
                  >
                    <div className="flex items-baseline justify-between gap-4">
                      <h3
                        className={`font-display text-xl font-bold transition-colors ${
                          isSelected ? 'text-teal-700 sm:text-2xl' : 'text-navy/80 hover:text-navy sm:text-xl'
                        }`}
                      >
                        {member.name}
                      </h3>
                      <span className="text-xs font-semibold uppercase tracking-wider text-muted sm:text-sm">
                        {member.focus}
                      </span>
                    </div>

                    {/* Expanded bio for active member */}
                    <div
                      className={`grid transition-all duration-300 ease-in-out ${
                        isSelected ? 'grid-rows-[1fr] opacity-100 pt-3' : 'grid-rows-[0fr] opacity-0'
                      }`}
                    >
                      <div className="overflow-hidden">
                        <p className="text-sm leading-relaxed text-muted sm:text-[15px]">
                          {member.bio}
                        </p>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

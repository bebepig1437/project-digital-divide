import { useState } from 'react'
import { team } from '../data/team'
import PhotoPlaceholder from './PhotoPlaceholder'

export default function TeamBentoGrid() {
  const [selected, setSelected] = useState(1) // Default to Joseph Hu

  const hero = team[selected]
  const others = team.map((m, idx) => ({ ...m, originalIndex: idx })).filter((_, idx) => idx !== selected)

  return (
    <div className="w-full">
      <div className="mx-auto max-w-6xl">
        <div className="grid gap-5 md:grid-cols-12">
          {/* Main Hero Card (7 Cols) */}
          <div className="overflow-hidden rounded-3xl border border-line/10 bg-surface p-6 shadow-sm sm:p-10 md:col-span-7 flex flex-col justify-between">
            <div>
              <div className="mb-6 overflow-hidden rounded-2xl bg-raised border border-line/10">
                {hero.photo ? (
                  <img
                    key={hero.name}
                    src={hero.photo}
                    alt={hero.name}
                    className="aspect-[16/10] w-full object-cover sm:aspect-[16/9]"
                  />
                ) : (
                  <PhotoPlaceholder
                    key={hero.name}
                    label={`${hero.name} photo`}
                    className="aspect-[16/10] w-full sm:aspect-[16/9]"
                  />
                )}
              </div>

              <p className="text-xs font-semibold uppercase tracking-wider text-teal-700 sm:text-sm">
                {hero.role || hero.focus}
              </p>
              <h3 className="mt-1 font-display text-2xl font-bold tracking-tight text-navy sm:text-4xl">
                {hero.name}
              </h3>
              <p className="mt-4 text-sm leading-relaxed text-muted sm:text-base sm:leading-relaxed">
                {hero.bio}
              </p>
            </div>
          </div>

          {/* 4 Compact Companion Cards (5 Cols, 2x2 Grid) */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:col-span-5">
            {others.map((member) => (
              <button
                key={member.name}
                type="button"
                onClick={() => setSelected(member.originalIndex)}
                className="group flex flex-col overflow-hidden rounded-2xl border border-line/10 bg-surface p-4 text-left shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-teal/40 hover:shadow-md"
              >
                <div className="mb-3 overflow-hidden rounded-xl bg-raised border border-line/10">
                  {member.photo ? (
                    <img
                      src={member.photo}
                      alt={member.name}
                      className="aspect-[4/3] w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <PhotoPlaceholder
                      label={`${member.name.split(' ')[0]} photo`}
                      className="aspect-[4/3] w-full"
                    />
                  )}
                </div>
                <p className="font-display text-base font-bold text-navy group-hover:text-teal-700 transition-colors">
                  {member.name}
                </p>
                <p className="mt-0.5 text-xs font-medium text-muted line-clamp-1">
                  {member.focus}
                </p>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

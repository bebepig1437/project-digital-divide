import { team } from '../data/team'
import Reveal from '../components/Reveal'
import PhotoPlaceholder from '../components/PhotoPlaceholder'

function MemberRow({ member, index }) {
  const flipped = index % 2 === 1
  return (
    <Reveal>
      <div className={`grid items-center gap-8 md:grid-cols-2 md:gap-14 ${flipped ? 'md:[direction:rtl]' : ''}`}>
        {/* Photo */}
        <div className="md:[direction:ltr]">
          {member.photo ? (
            <img
              src={member.photo}
              alt={member.name}
              className="aspect-[4/5] w-full rounded-2xl object-cover shadow-sm"
            />
          ) : (
            <PhotoPlaceholder label={`${member.name} photo`} className="aspect-[4/5] w-full" />
          )}
        </div>

        {/* Bio */}
        <div className="md:[direction:ltr]">
          <h2 className="text-2xl sm:text-3xl">{member.name}</h2>
          <div className="mt-2 flex flex-wrap gap-2">
            <span className="eyebrow !bg-navy-50 !text-navy">{member.grade}</span>
            <span className="eyebrow">{member.focus}</span>
          </div>
          <p className="mt-5 text-[15px] leading-relaxed text-muted">{member.bio}</p>
        </div>
      </div>
    </Reveal>
  )
}

export default function About() {
  return (
    <>
      <section className="border-b border-navy/10 bg-navy-50/40 py-16 sm:py-20">
        <div className="container-content max-w-3xl text-center">
          <span className="eyebrow">About us</span>
          <h1 className="mt-4 text-4xl sm:text-5xl">The students behind the mission</h1>
          <p className="mt-5 text-lg text-muted">
            We're a team of high schoolers who each found our own way to the same conviction:
            that access to technology, and the skills to use it, shouldn't depend on where
            you live or what you can afford.
          </p>
        </div>
      </section>

      <section className="bg-cream py-20 sm:py-24">
        <div className="container-content flex flex-col gap-20 sm:gap-24">
          {team.map((member, i) => (
            <MemberRow key={member.name} member={member} index={i} />
          ))}
        </div>
      </section>
    </>
  )
}

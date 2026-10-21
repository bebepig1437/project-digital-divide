import { useInView } from '../hooks/useInView'

// Wraps children in a subtle fade-up reveal when scrolled into view.
// `delay` (ms) staggers sibling reveals. Kept deliberately quiet:
// 6px lift and 400ms so sections settle without drawing attention.
export default function Reveal({ children, delay = 0, className = '', as: Tag = 'div' }) {
  const [ref, inView] = useInView()

  return (
    <Tag
      ref={ref}
      style={{ transitionDelay: `${delay}ms` }}
      className={[
        'transition-all duration-[400ms] ease-out motion-reduce:transition-none',
        inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-1.5',
        className,
      ].join(' ')}
    >
      {children}
    </Tag>
  )
}

import { ImageIcon } from 'lucide-react'

// A clearly-marked stand-in for a real photo.
// When you have the real image, replace usages with:
//   <img src="/path/to/photo.jpg" alt="..." className="..." />
export default function PhotoPlaceholder({ label = 'Photo', className = '', rounded = 'rounded-2xl' }) {
  return (
    <div
      className={[
        'flex flex-col items-center justify-center gap-2 border border-dashed border-navy/20',
        'bg-navy-50/60 text-navy/40',
        rounded,
        className,
      ].join(' ')}
    >
      <ImageIcon size={28} strokeWidth={1.5} />
      <span className="px-3 text-center text-xs font-medium uppercase tracking-wider">
        {label}
      </span>
    </div>
  )
}

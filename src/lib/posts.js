// Loads every Markdown file in src/content/posts at build time,
// parses its frontmatter, and exposes them newest-first.

const files = import.meta.glob('../content/posts/*.md', {
  query: '?raw',
  import: 'default',
  eager: true,
})

// Minimal YAML-ish frontmatter parser (key: value pairs only).
function parseFrontmatter(raw) {
  const match = /^---\s*\n([\s\S]*?)\n---\s*\n?([\s\S]*)$/.exec(raw)
  if (!match) return { data: {}, content: raw.trim() }

  const data = {}
  for (const line of match[1].split('\n')) {
    const idx = line.indexOf(':')
    if (idx === -1) continue
    const key = line.slice(0, idx).trim()
    let value = line.slice(idx + 1).trim().replace(/^["']|["']$/g, '')
    data[key] = value
  }
  return { data, content: match[2].trim() }
}

export const posts = Object.entries(files)
  .map(([path, raw]) => {
    const slug = path.split('/').pop().replace(/\.md$/, '')
    const { data, content } = parseFrontmatter(raw)
    return { slug, image: null, ...data, content }
  })
  .sort((a, b) => new Date(b.date) - new Date(a.date))

export function getPost(slug) {
  return posts.find((p) => p.slug === slug)
}

export function formatDate(date) {
  if (!date) return ''
  // Parse YYYY-MM-DD as a LOCAL date so it doesn't shift a day in negative-offset timezones.
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(date).trim())
  const d = m ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])) : new Date(date)
  if (isNaN(d)) return date
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
}

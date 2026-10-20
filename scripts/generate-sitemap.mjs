import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'

const SITE = 'https://projectdigitaldivide.org'
const POSTS_DIR = join(process.cwd(), 'src/content/posts')
const OUT = join(process.cwd(), 'public/sitemap.xml')

// Static routes that never change.
const staticRoutes = [
  { loc: '/', changefreq: 'weekly', priority: '1.0' },
  { loc: '/about', changefreq: 'monthly', priority: '0.8' },
  { loc: '/newsletter', changefreq: 'weekly', priority: '0.8' },
  { loc: '/volunteer', changefreq: 'monthly', priority: '0.8' },
]

// Minimal YAML-ish frontmatter parser (matches src/lib/posts.js).
function parseFrontmatter(raw) {
  const match = /^---\s*\n([\s\S]*?)\n---\s*\n?([\s\S]*)$/.exec(raw)
  if (!match) return { data: {} }
  const data = {}
  for (const line of match[1].split('\n')) {
    const idx = line.indexOf(':')
    if (idx === -1) continue
    const key = line.slice(0, idx).trim()
    let value = line.slice(idx + 1).trim().replace(/^["']|["']$/g, '')
    data[key] = value
  }
  return { data }
}

function escapeXml(unsafe) {
  return String(unsafe)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

function urlEntry(loc, changefreq, priority) {
  const fullLoc = loc.startsWith('http') ? loc : SITE + loc
  return `  <url>\n    <loc>${escapeXml(fullLoc)}</loc>\n    <changefreq>${changefreq}</changefreq>\n    <priority>${priority}</priority>\n  </url>`
}

try {
  const postRoutes = []
  const files = readdirSync(POSTS_DIR).filter((f) => f.endsWith('.md'))
  for (const file of files) {
    const raw = readFileSync(join(POSTS_DIR, file), 'utf8')
    const { data } = parseFrontmatter(raw)
    const slug = file.replace(/\.md$/, '')
    // Only include posts that have a date (published).
    if (!data.date) continue
    postRoutes.push({
      loc: `/newsletter/${slug}`,
      changefreq: 'monthly',
      priority: '0.7',
    })
  }

  // Newest posts first.
  postRoutes.sort((a, b) => {
    const da = new Date(a.loc.split('/').pop())
    const db = new Date(b.loc.split('/').pop())
    return db - da
  })

  const allRoutes = [...staticRoutes, ...postRoutes]
  const urlXml = allRoutes.map((r) => urlEntry(r.loc, r.changefreq, r.priority)).join('\n')

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlXml}
</urlset>
`

  writeFileSync(OUT, sitemap)
  console.log(`Generated ${OUT} with ${allRoutes.length} URLs (${staticRoutes.length} static + ${postRoutes.length} posts)`)
} catch (err) {
  console.error('Failed to generate sitemap:', err.message)
  process.exit(1)
}

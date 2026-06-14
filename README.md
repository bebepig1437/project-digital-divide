# Project Digital Divide

Website for **Project Digital Divide (PDD)**, a student-led nonprofit bridging the digital
divide through three programs: device refurbishment and donation, digital-literacy education
(with an AI focus), and broadband-access advocacy.

## Tech stack

- [Vite](https://vite.dev/) + [React](https://react.dev/) (JSX)
- [React Router](https://reactrouter.com/) for multi-page routing
- [Tailwind CSS](https://tailwindcss.com/) for styling
- [lucide-react](https://lucide.dev/) icons
- Markdown-powered newsletter (`react-markdown` + `remark-gfm`)
- [Formspree](https://formspree.io/) for contact + volunteer form submissions

## Getting started

```bash
npm install      # install dependencies
npm run dev      # start the local dev server (http://localhost:5173)
npm run build    # production build to dist/
npm run preview  # preview the production build
```

## Project structure

```
public/logo.webp        PDD logo
src/
  config.js             Email, Formspree IDs, social links (edit before launch)
  data/                 Pillars, impact metrics, team bios, testimonials
  content/posts/        Newsletter posts (one Markdown file per event)
  components/           Navbar, Footer, Pillars, ImpactMetrics, forms, etc.
  pages/                Home, About, Newsletter, Volunteer
```

## Editing content (no React needed)

- **Add a newsletter post:** copy a file in `src/content/posts/`, edit its frontmatter and body.
- **Update impact numbers:** edit `src/data/metrics.js` (set `ready: true` to show a metric).
- **Edit team members:** edit `src/data/team.js`.
- **Add testimonials:** add entries to `src/data/testimonials.js`.

## Before launch

Fill in the `TODO` placeholders, primarily in `src/config.js` (PDD email, Formspree form IDs,
Instagram URL), plus real photos and impact numbers.

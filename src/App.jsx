import { Routes, Route } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import Layout from './components/Layout'
import ErrorBoundary from './components/ErrorBoundary'
import Home from './pages/Home'
import About from './pages/About'
import Newsletter from './pages/Newsletter'
import NewsletterPost from './pages/NewsletterPost'
import Volunteer from './pages/Volunteer'

const siteUrl = 'https://projectdigitaldivide.org'
const logoUrl = `${siteUrl}/logo.webp`

const defaultMeta = [
  { property: 'og:type', content: 'website' },
  { property: 'og:url', content: siteUrl },
  { property: 'og:image', content: logoUrl },
  { name: 'twitter:card', content: 'summary' },
  { name: 'twitter:image', content: logoUrl },
]

export default function App() {
  return (
    <ErrorBoundary>
      <Helmet>
        <title>Project Digital Divide | Houston's Student-Run Laptop Program in Pearland, TX</title>
        <meta name="description" content="Houston-area student-run project in Pearland, Texas, taking laptops retired by school districts, setting them up with lightweight software, and getting them to students who need a computer at home — at no cost to families." />
        {defaultMeta.map((m, i) => (
          <meta key={i} {...m} />
        ))}
        <meta name="twitter:title" content="Project Digital Divide | Houston's Student-Run Laptop Program" />
        <meta name="twitter:description" content="Houston-area student-run project in Pearland, Texas, taking laptops retired by school districts, setting them up with lightweight software, and getting them to students who need a computer at home — at no cost to families." />
      </Helmet>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/newsletter" element={<Newsletter />} />
          <Route path="/newsletter/:slug" element={<NewsletterPost />} />
          <Route path="/volunteer" element={<Volunteer />} />
          <Route path="*" element={<Home />} />
        </Route>
      </Routes>
    </ErrorBoundary>
  )
}

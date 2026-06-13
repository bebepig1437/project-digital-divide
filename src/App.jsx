import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Home from './pages/Home'
import About from './pages/About'
import Newsletter from './pages/Newsletter'
import NewsletterPost from './pages/NewsletterPost'
import Volunteer from './pages/Volunteer'

export default function App() {
  return (
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
  )
}

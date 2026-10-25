# Project Digital Divide

[![Live Website](https://img.shields.io/badge/Live_Site-projectdigitaldivide.org-0d9488?style=for-the-badge&logo=google-chrome&logoColor=white)](https://projectdigitaldivide.org)
[![Vercel Deployment](https://img.shields.io/badge/Deployed_on-Vercel-black?style=for-the-badge&logo=vercel)](https://projectdigitaldivide.org)

**Project Digital Divide** is a student-run project that deploys reconditioned laptops to families across Houston. We are based in Pearland, Texas, and serve the Greater Houston area.

**Mission:** Project Digital Divide is a student-run project focused on educational equity surrounding STEM. After receiving a generous donation of 100 retired laptops from our AlvinISD’s technology department, we've started building the setup process for the devices: installing operating systems, basic tools, and guardrails before they reach students who don't have a computer at home. We're documenting every step along the way, so the next team has a data-backed precedent to work from. Additionally, we plan to develop workshops on computer engineering to increase STEM opportunities in underserved areas, ultimately bridging the digital and educational divide.

Our website: https://projectdigitaldivide.org

## The problem

School districts replace their laptops on a three-to-five-year cycle. When the cycle ends, working machines get resold or recycled. A few miles away, students do homework on their parents' phones because school-issued devices stay at school and there is no computer at home.

Those two facts sit next to each other. The devices exist. The need exists. What is missing is the process that connects them: taking retired machines, installing an operating system, basic tools, and guardrails, and handing them to a student. Project Digital Divide exists to build that process and to write down how it works.

## What we produce

### Device refurbishment and donation

Getting a machine from "retired by the district" to "usable by a ninth grader" is installation and configuration, not repair. Devices arrive in good physical condition — drives work, screens work, keyboards work, batteries hold a charge for the most part. What they lack is an operating system anyone can use, a set of basic tools, and the guardrails that keep a first-time user out of trouble.

### Operating systems under trial

Five operating systems are in the trial:

- **ChromeOS Flex** — deployment candidate and the easiest recipient experience. Runs well on this hardware, and recipients already know the interface. The open question is tracking: unmanaged Flex devices report nothing (no location, no telemetry, no inventory), while managed enrollment requires a per-device Chrome Enterprise Upgrade license ($40–$50 per device per year for education) that the team does not yet have budgeted.
- **Windows 11 mini** — comparison only. The Pentium Silver N5030 lacks firmware TPM 2.0 and is not on Microsoft's approved CPU list, so Windows 11 is not officially supported. Redistributing a modified Windows image to students is a licensing problem; a real deployment would need an official ISO and a legitimate license per device.
- **Lubuntu** — Ubuntu-based with LXQt desktop, expected fleet default. Idle memory runs around 350–500 MB. Standard Ubuntu underneath, so every Ubuntu troubleshooting guide applies — which matters when the person debugging is a high school student at 9 pm.
- **Linux Mint with Xfce** — the most polished and familiar option (Xfce edition specifically). Idle memory around 500 MB. Graphical update manager and Timeshift snapshots reduce support burden. Secondary image aimed at older recipients or parents.
- **Raspberry Pi Desktop** — Debian-based, heavily cut down, clean and simple for low-memory hardware. Alternative lightweight candidate, contingent on audio and WiFi checks on Gemini Lake silicon.

Peppermint OS was on the previous list and has been dropped: it ships with almost nothing installed and expects the user to build up their own system, which is a barrier for workshop recipients.

### Benchmark structure (two tiers)

**Tier 1: Reference machines (the paired test)** — 3 machines (the healthiest units), all 5 OSes on each, 15 installs total. Cold boot time (10 boots, discard first, median of runs 2–10), idle RAM after 5 minutes at desktop, PassMark CPU score. Hardware checks before any timing: WiFi, trackpad, audio, webcam, suspend/resume.

**Tier 2: Field validation ("Does it hold")** — 15 total (3 per OS, mixed hardware condition). 5 boots to check for driver stutters, one PassMark `-i 1` run to confirm ballpark score. If a machine scores 20% below its reference peer, the machine is pulled for bench attention.

### Deployment models (run in parallel, compared against each other)

**Build It, Keep It.** Over about three hours, a student opens the case, installs the drive, boots from a USB, and installs the OS themselves. We supervise; they do the work. Highest engagement, lowest throughput.

**Direct donation through a school partner.** We hand finished devices to a counselor or social worker who routes them to students who need one. Fastest way to move volume; reaches families the workshop model misses.

**Lending library.** Devices live at a library or community center and check out on a two-week loan. Most efficient per device, hardest to operate — which is why we are treating it as the interesting part and documenting the edge cases (accounts, wiping between users, transparency, district rules, damage, non-return, shared-device privacy) in a public problem log.

### Documentation as a deliverable

Every device is logged from intake to deployment: what came in, condition, what was installed, what broke, what it cost, where it ended up. The dataset answers practical questions — which OS runs best on this hardware, which deployment model keeps devices in use longest, what a usable unit actually costs. These are questions every small refurbishment program guesses at; our goal is to stop guessing.

Artifacts: a six-to-eight-page case study, a framework document another team can follow, an intake tracker, and a solved-problems log.

## STEM workshops

We plan to develop workshops on computer engineering to increase STEM opportunities in underserved areas. The workshops give students hands-on experience opening a machine, installing an operating system, and configuring software — the same bench work that prepares donated devices. Ultimately, this bridges the digital and educational divide by giving students both the hardware and the skills to use it.

## Technical stack

- **Vite** + **React** (JSX) — frontend build tool and UI library
- **React Router** — multi-page client-side routing
- **Tailwind CSS** — styling
- **lucide-react** — icons
- **react-markdown** + **remark-gfm** — Markdown-powered newsletter
- **Vercel Serverless Function** (`/api/submit.js`, powered by Resend) — contact and volunteer forms

## File tree

```
project-digital-divide/
├── public/
│   ├── logo.webp          # PDD bird logo (also served as /logo.webp favicon and og:image)
│   ├── logo.png
│   ├── sitemap.xml        # auto-generated at build time; lists every indexable route
│   └── robots.txt         # allows all crawlers; points to sitemap
├── src/
│   ├── main.jsx           # app entry point
│   ├── App.jsx            # React Router routes + default meta tags
│   ├── config.js          # site email, socials, submit endpoint
│   ├── index.css          # Tailwind base styles
│   ├── data/
│   │   ├── team.js        # team bios (Michelle, Joseph, Joshua active; Sahil, Kaleb inactive)
│   │   ├── metrics.js     # impact metrics
│   │   └── testimonials.js
│   ├── content/posts/     # newsletter posts (one Markdown file per event)
│   ├── components/
│   │   ├── Navbar.jsx     # site navigation + logo
│   │   ├── Footer.jsx     # contact + social links + logo
│   │   ├── ContactForm.jsx
│   │   ├── TeamHorizonExpander.jsx
│   │   ├── GlassImpactLedger.jsx
│   │   ├── HardwareAcceptanceMatrix.jsx
│   │   ├── PhotoPlaceholder.jsx
│   │   └── Reveal.jsx, ErrorBoundary.jsx, Layout.jsx, ImpactMetrics.jsx, ...
│   ├── pages/
│   │   ├── Home.jsx       # hero banner, mission, objectives
│   │   ├── About.jsx      # team bios ("Who we are")
│   │   ├── Newsletter.jsx # field dispatches index
│   │   ├── NewsletterPost.jsx # individual post page
│   │   └── Volunteer.jsx  # volunteer application form
│   └── hooks/
├── api/
│   └── submit.js          # Vercel serverless form handler
├── scripts/
│   └── generate-sitemap.mjs  # build-time sitemap generator from src/content/posts
├── vercel.json            # SPA rewrite rules
├── vite.config.js         # Vite config + dev API middleware
├── tailwind.config.js
├── postcss.config.js
└── package.json
```

## Getting started

```bash
npm install      # install dependencies
npm run dev      # start the local dev server (http://localhost:5173)
npm run build    # production build to dist/ (also regenerates public/sitemap.xml)
npm run preview  # preview the production build
```

## Editing content (no React needed)

- **Add a newsletter post:** copy a file in `src/content/posts/`, edit its frontmatter (`title`, `date`, `excerpt`, `image`) and body.
- **Update impact numbers:** edit `src/data/metrics.js`.
- **Edit team members:** edit `src/data/team.js`.
- **Add testimonials:** add entries to `src/data/testimonials.js`.

## Get involved

- **Volunteer:** hardware testing & bench setup, workshop mentoring, school district outreach, software tracking tools, or wherever the team needs help. Apply at https://projectdigitaldivide.org/volunteer
- **Donate laptops or supplies:** we accept retired laptops, isopropyl alcohol (70%+), cotton swabs, microfiber cloths, and compressed air.
- **Refer a student or family:** if a student needs a computer at home, contact us.
- **Host a workshop:** we run Build It, Keep It workshops and can partner with schools and community centers.

Email: projectdigitaldivide.org@gmail.com

---

### About this project (for search indexing)

Project Digital Divide is a student-led nonprofit in Pearland, Texas, bridging the digital divide across Greater Houston through device refurbishment, digital-literacy education, and STEM workshops. We refurbish retired school district laptops — installing operating systems, basic tools, and guardrails — and deploy them at no cost to students who do not have a computer at home. Our work focuses on educational equity surrounding STEM, computer engineering workshops for underserved areas, and building a data-backed framework other student teams can replicate. Keywords: student laptop project, digital divide Houston, Pearland Texas, educational equity STEM, laptop refurbishment nonprofit, Alvin ISD, Build It Keep It, computer engineering workshop, bridging the digital divide, ChromeOS Flex, Lubuntu, Linux Mint, Raspberry Pi Desktop, Windows 11 mini.

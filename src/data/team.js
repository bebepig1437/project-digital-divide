// About Us team member bios.
// Rendered as alternating photo/text rows.
// Drop real headshots into /public (e.g. /team/sahil.jpg) and set `photo`.
// `active: false` keeps a member's copy in the file while hiding them from
// the About roster (Sahil and Kaleb are not currently active leads).

export const team = [
  {
    name: 'Michelle Truong',
    active: true,
    focus: 'Narrative & Workshops',
    photo: '/team/michelle.jpg',
    bio: "Michelle opened the district conversation that secured our first 100 laptops. She sent the initial inquiry to Alvin ISD's superintendent, followed the thread through the technology services office, and stayed on it through four months of reviews until the board approved the transfer. Beyond district communications, she writes the narrative sections of our grant proposals, manages our social media updates, and designs the curriculum for student build workshops. She tracks bench metrics to produce clear case studies, making sure our setup procedures and deployment counts are documented accurately.",
  },
  {
    name: 'Joseph Hu',
    active: true,
    focus: 'Operations & Web',
    photo: '/team/joseph.jpg',
    bio: "Joseph manages project operations, team structure, and our website codebase. He builds the internal systems for tracking milestones, organizes volunteer onboarding, and coordinates who is doing what between build sessions to keep the project organized. On the outreach side, he runs the pipeline to identify district technology contacts, drafts grant applications, and keeps follow-up conversations moving so communications do not stall. When something breaks on the site or an operational bottleneck appears, Joseph handles it.",
  },
  {
    name: 'Joshua De Leon',
    active: true,
    focus: 'Hardware & Systems',
    photo: '/team/joshua.jpg',
    bio: "Joshua runs bench operations and system testing in Pearland. Every donated laptop passes through his hands: physical intake, motherboard diagnostics, cleaning, swapping broken components, and running operating system benchmarks to verify which setups hold up under daily student use. He spends his time testing charging circuits, checking battery health, and configuring the software image on our Dell Latitude 3130s. He also handles hardware pickups, manages spare parts storage, and runs final quality control before any machine is deployed.",
  },
  {
    name: 'Sahil Mohammed',
    active: false,
    focus: 'Software Tooling and Systems',
    photo: null,
    bio: "Sahil builds the internal software we run on: intake tracking, asset states, and deployment logs. While a spreadsheet works for the first batch of devices, Sahil builds the tracking tools that turn our logs into an accountable, repeatable dataset that other student teams can follow.",
  },
  {
    name: 'Kaleb Wu',
    active: false,
    focus: 'Software Tooling and Testing',
    photo: null,
    bio: "Kaleb works alongside Sahil on building and testing our internal tracking software. He focuses on hardware validation and logging tools that track each machine from district intake to student hand-off, ensuring our yield rates and bench data remain accurate and consistent.",
  },
]

// =============================================================
//  PDD site configuration: EDIT THESE before launch.
//  Everything the team needs to wire up lives here.
// =============================================================

export const site = {
  name: 'Project Digital Divide',
  shortName: 'PDD',

  email: 'projectdigitaldivide.org@gmail.com',

  socials: {
    // TODO: paste the real Instagram URL once the account is live.
    instagram: 'https://instagram.com/',
  },
}

// Backend endpoint that emails form submissions.
// Implemented as a Vercel serverless function in /api/submit.js (uses Resend).
export const SUBMIT_ENDPOINT = '/api/submit'

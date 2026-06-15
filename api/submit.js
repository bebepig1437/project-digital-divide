// Vercel serverless function: emails contact + volunteer form submissions
// to the PDD inbox using the Resend API (https://resend.com).
//
// Required environment variable (set in Vercel project settings + local .env):
//   RESEND_API_KEY   your Resend API key
// Optional:
//   TO_EMAIL         recipient (defaults to the org Gmail)
//   FROM_EMAIL       verified sender (defaults to Resend's onboarding sender)

const TO_EMAIL = process.env.TO_EMAIL || 'projectdigitaldivide.org@gmail.com'
const FROM_EMAIL = process.env.FROM_EMAIL || 'Project Digital Divide <onboarding@resend.dev>'

function escapeHtml(value = '') {
  return String(value).replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c],
  )
}

function isEmail(value) {
  return typeof value === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    console.error('RESEND_API_KEY is not set')
    return res.status(500).json({ error: 'Email service is not configured.' })
  }

  // Body arrives parsed on Vercel, but may be a raw string in other runtimes.
  let body = req.body
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body)
    } catch {
      body = {}
    }
  }
  body = body || {}

  // Honeypot: bots fill hidden fields. Pretend success so they don't retry.
  if (body._gotcha) return res.status(200).json({ ok: true })

  const formType = body.form === 'volunteer' ? 'volunteer' : 'contact'
  const name = (body.name || '').toString().trim()
  const email = (body.email || '').toString().trim()

  if (!name || !isEmail(email)) {
    return res.status(400).json({ error: 'Please provide your name and a valid email.' })
  }

  let subject
  let rows
  if (formType === 'volunteer') {
    subject = `New volunteer application: ${name}`
    rows = [
      ['Name', name],
      ['Email', email],
      ['Grade / age', body.grade_or_age],
      ['Interest area', body.interest_area],
      ['Skills & experience', body.skills_experience],
      ['Availability', body.availability],
      ['Why they want to volunteer', body.why_join],
    ]
  } else {
    subject = `New contact message: ${body.reason || 'General'} (${name})`
    rows = [
      ['Name', name],
      ['Email', email],
      ['Reason', body.reason],
      ['Message', body.message],
    ]
  }

  const filled = rows.filter(([, value]) => value && value.toString().trim())
  const text = filled.map(([label, value]) => `${label}: ${value}`).join('\n')
  const html = `
    <div style="font-family: -apple-system, system-ui, sans-serif; color:#1E293B;">
      <h2 style="color:#1E3A5F; margin:0 0 16px;">${escapeHtml(subject)}</h2>
      <table style="border-collapse:collapse; font-size:15px;">
        ${filled
          .map(
            ([label, value]) => `
          <tr>
            <td style="padding:6px 16px 6px 0; font-weight:600; color:#2E9D94; vertical-align:top; white-space:nowrap;">${escapeHtml(label)}</td>
            <td style="padding:6px 0; white-space:pre-wrap;">${escapeHtml(value)}</td>
          </tr>`,
          )
          .join('')}
      </table>
    </div>`

  try {
    const resendRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: [TO_EMAIL],
        reply_to: email,
        subject,
        text,
        html,
      }),
    })

    if (!resendRes.ok) {
      const detail = await resendRes.text()
      console.error('Resend error', resendRes.status, detail)
      return res.status(502).json({ error: 'Failed to send the message. Please try again.' })
    }

    return res.status(200).json({ ok: true })
  } catch (err) {
    console.error('submit handler error', err)
    return res.status(500).json({ error: 'Unexpected error. Please try again.' })
  }
}

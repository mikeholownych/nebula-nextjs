/**
 * Nebula subscription onboarding email helpers.
 * Called from the Stripe webhook when a new subscription is created.
 */

import type { PlanKey } from '@/app/lib/subscription-plans'

const PLATFORM_API = (process.env.PLATFORM_API_URL ?? 'http://127.0.0.1:8001').replace(/\/$/, '')

interface EmailPayload {
  to: string
  subject: string
  text: string
  html: string
}

// Delivery rides the platform API transactional outbox (channel 'email',
// drained by the same worker that delivers kit sends and audit results).
// The previous direct /email/send endpoint does not exist; enqueueing is the
// proven durable path, including retry/backoff after provider failures.
async function sendEmail(payload: EmailPayload): Promise<boolean> {
  try {
    const secret = (process.env.INTERNAL_API_SECRET || '').trim()
    if (!secret) {
      console.error('[subscription-emails] INTERNAL_API_SECRET not configured')
      return false
    }
    const res = await fetch(`${PLATFORM_API}/api/outbox/enqueue`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${secret}`,
      },
      signal: AbortSignal.timeout(15_000),
      body: JSON.stringify({
        channel: 'email',
        recipient: payload.to,
        payload: {
          subject: payload.subject,
          body: payload.html,
          from_email: 'audits@nebulacomponents.com',
          content_type: 'text/html',
        },
      }),
    })
    if (!res.ok) {
      console.error('[subscription-emails] Enqueue rejected:', res.status)
    }
    return res.ok
  } catch (err) {
    console.error('[subscription-emails] Enqueue failed:', err)
    return false
  }
}

const PLAN_FEATURES: Record<string, { name: string; bullets: string[] }> = {
  pro: {
    name: 'Pro',
    bullets: [
      'Unlimited audits (fair use 20/month)',
      'Weekly page monitoring with score-drop alerts',
      'Historical score tracking and before/after comparisons',
      'PDF report export',
    ],
  },
  growth: {
    name: 'Growth',
    bullets: [
      'Multi-page audits (10 URLs)',
      '5 team seats',
      'White-label PDF reports',
      'API access for programmatic audits',
      'Competitor page monitoring',
    ],
  },
  agency: {
    name: 'Agency',
    bullets: [
      '25 isolated client workspaces',
      'Full white-label with custom report domain',
      'Unlimited team seats',
      'Kit reseller margin (30% off)',
      'Dedicated onboarding support',
    ],
  },
}

export async function sendSubscriptionWelcome(
  email: string,
  plan: PlanKey,
): Promise<boolean> {
  const planInfo = PLAN_FEATURES[plan] ?? { name: plan, bullets: [] }
  const bulletsText = planInfo.bullets.map(b => `  • ${b}`).join('\n')
  const bulletsHtml = planInfo.bullets.map(b => `<li>${b}</li>`).join('\n')

  const subject = `Your Nebula ${planInfo.name} plan is active`
  const text = `Your Nebula ${planInfo.name} plan is active.

What's included:
${bulletsText}

Set up your first monitored page:
→ nebulacomponents.com/workspace

Run your first audit:
→ nebulacomponents.com/audit

If you have questions, reply to this email.

- Mike
Nebula Components
nebulacomponents.com`

  const html = `
<p>Your Nebula ${planInfo.name} plan is active.</p>
<p><strong>What's included:</strong></p>
<ul>
${bulletsHtml}
</ul>
<p><strong>Next steps:</strong></p>
<ol>
  <li><a href="https://nebulacomponents.com/audit">Run your first audit</a> - paste your landing page URL, get 9 signals scored in under 2 minutes</li>
  <li><a href="https://nebulacomponents.com/workspace">Set up page monitoring</a> - add your page to get weekly score-drop alerts</li>
</ol>
<p>If you have questions, reply to this email.</p>
<p>- Mike<br>Nebula Components</p>`

  return sendEmail({ to: email, subject, text, html })
}

/**
 * Schedule the 48-hour first-value email.
 *
 * The actual send is handled by the nightly cron at
 * scripts/subscription_first_value_email.py which queries for subscriptions
 * created 47–49 hours ago and calls the platform API directly. This function
 * exists as an explicit hook so the webhook handler documents the intent and
 * so the scheduler can be replaced with a queued task if needed.
 *
 * It is a no-op in the webhook - the cron is authoritative.
 */
export function scheduleFirstValueEmail(
  _email: string,
  _plan: PlanKey,
): void {
  // Scheduling is handled by the cron job at
  // nebula/scripts/subscription_first_value_email.py.
  // The cron fires daily and queries subscriptions.created_at for the 47-49h window.
  // Nothing to enqueue here; the subscription row is already persisted.
}

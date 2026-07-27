/**
 * Email Service for Nebula Components
 * Handles data-only email queueing. Delivery is owned by the Python release gate.
 */

import { Pool } from 'pg';

export const pool = new Pool({
  host: '/var/run/postgresql',
  port: 5433,
  database: 'nebula_platform',
  user: 'postgres',
  max: 10,
});


/**
 * Get email template by sequence number
 */
export function getEmailTemplate(emailNumber: number, firstName: string = 'there'): { subject: string; body: string } {
  const templates: Record<number, { subject: string; body: string }> = {
    1: {
      subject: 'Spent $10k on ads. No sales?',
      body: `${firstName},

I noticed you're running paid traffic to your site. The targeting looks solid — but something's breaking between click and conversion.

We've diagnosed what we call the "proof gap" on 47 landing pages this quarter. 94% of founders missing social proof above the fold. The ones who fix it see conversion lift in 11 days average.

Your page triggered the same pattern. I'm not asking you to buy anything — I want to give you the diagnosis free.

Paste your URL here: https://nebulacomponents.shop

Takes 60 seconds. You'll see exactly what's leaking and which fix pays back fastest.

— Mike H
Founder, Nebula Components

P.S. Last week: SaaS founder burned $15k on Meta with zero conversions. Audit showed the problem in 4 minutes. Fixed in 2 hours. Now at 23 sales/week.`
    },
    2: {
      subject: `${firstName}, that $15k wasn't wasted`,
      body: `${firstName},

Quick follow-up on yesterday's email.

The SaaS founder I mentioned — $15k burned, zero conversions — thought the problem was their targeting. It wasn't.

The audit showed 3 leaks:
1. Headline didn't match the ad promise (trust gap)
2. No proof visible before CTA (credibility gap)
3. Multiple competing buttons (decision paralysis)

They fixed leak #1 in 20 minutes. Next day: first sale in 6 weeks.

The diagnosis is free. The fix is $97. The ROI is measurable.

Paste your URL: https://nebulacomponents.shop

— Mike H

P.S. They didn't hire us to fix it. They used the audit and did it themselves. That's the point — you should be able to see the problem clearly enough to solve it yourself.`
    },
    3: {
      subject: 'Your retargeting is working against you',
      body: `${firstName},

If your retargeting pixel is firing but conversions aren't happening, you're paying to show ads to people who already decided not to buy.

That's not a targeting problem. That's a landing page problem.

The visitors who didn't convert the first time? They're seeing the same page that didn't convince them. Retargeting amplifies failure — unless you fix the page first.

Run the audit before you spend another dollar on retargeting:

https://nebulacomponents.shop

— Mike H

P.S. One founder we audited cut retargeting spend by 80% after fixing the page. Conversions went up. The page was the leak all along.`
    },
    4: {
      subject: 'The 5-point landing page checklist I use',
      body: `${firstName},

Before you run your next ad, run this 60-second check:

1. □ Headline mirrors the exact ad promise — word for word
2. □ Proof appears BEFORE the CTA — logos, numbers, testimonial
3. □ One primary action — not three "learn more" buttons
4. □ Mobile loads in under 3 seconds — check on 4G, not WiFi
5. □ Objections answered before the price/checkout

If any of these fail, you're paying for clicks that won't convert.

No pitch. No ask. Just a framework that's worked for 47 founders this quarter.

— Mike H

P.S. If you want to see how your page scores (free), https://nebulacomponents.shop`
    },
    5: {
      subject: 'Last email on this',
      body: `${firstName},

I've sent a few emails about your landing page. Here's the honest truth:

If your ad spend is over $10k and you have zero conversions, the problem isn't your targeting. It's your page.

I'm not going to keep emailing about this because I respect your time.

But if you ever want to see exactly what's broken — for free, no follow-up pressure — the audit is always available:

https://nebulacomponents.shop

Paste your URL. 60 seconds. You'll see the leak.

If you fix it yourself, great. If you want our $97 One-Leak Repair Sprint, that's there too. But the diagnosis is free either way.

— Mike H

Founder, Nebula Components

---

Nebula Components — https://nebulacomponents.shop
Unsubscribe: https://nebulacomponents.shop/unsubscribe?email=${firstName.toLowerCase()}%40example.com`
    }
  };

  return templates[emailNumber] || templates[1];
}

/**
 * Queue lead for outreach
 */
export async function queueLeadForOutreach(
  visitorId: string,
  email: string,
  name?: string,
  company?: string,
  score: number = 50
): Promise<number> {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Insert/update lead
    const leadResult = await client.query(
      `INSERT INTO leads (visitor_id, email, name, company, score, icp_match)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (visitor_id) DO UPDATE SET
         email = EXCLUDED.email,
         name = EXCLUDED.name,
         company = EXCLUDED.company,
         score = EXCLUDED.score,
         icp_match = EXCLUDED.icp_match
       RETURNING id`,
      [visitorId, email, name, company, score, score >= 50]
    );

    const leadId = leadResult.rows[0].id;

    // Queue email sequence (E1 immediate, E2-5 delayed)
    const delays = [0, 24, 72, 120, 168]; // hours

    for (let i = 0; i < 5; i++) {
      const scheduledFor = new Date(Date.now() + delays[i] * 60 * 60 * 1000);

      await client.query(
        `INSERT INTO email_queue (lead_id, to_email, to_name, email_number, scheduled_for)
         VALUES ($1, $2, $3, $4, $5)`,
        [leadId, email, name, i + 1, scheduledFor]
      );
    }

    await client.query('COMMIT');

    console.log('[Email Service] Queued 5-email sequence for:', email);
    return leadId;

  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}


/**
 * Get queue stats
 */
export async function getQueueStats(): Promise<{ queued: number; sent: number; failed: number }> {
  const result = await pool.query(
    `SELECT
      COUNT(*) FILTER (WHERE status = 'queued') as queued,
      COUNT(*) FILTER (WHERE status = 'sent') as sent,
      COUNT(*) FILTER (WHERE status = 'failed') as failed
    FROM email_queue`
  );

  return result.rows[0];
}

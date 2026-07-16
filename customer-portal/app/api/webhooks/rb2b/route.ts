import { NextRequest, NextResponse } from 'next/server';

/**
 * RB2B Webhook Endpoint
 * Receives visitor identification events from RB2B (Resolve B2B)
 * Triggers outreach sequence for ICP-matched visitors
 */

interface RB2BWebhookPayload {
  event: 'visitor_identified' | 'visitor_updated';
  visitor: {
    id: string;
    email?: string;
    name?: string;
    company?: string;
    linkedin_url?: string;
    first_visit: string;
    last_visit: string;
    visit_count: number;
    page_views: string[];
    utm_source?: string;
    utm_campaign?: string;
    utm_medium?: string;
  };
  session: {
    id: string;
    started_at: string;
    pages: string[];
    duration_seconds: number;
    device?: string;
    country?: string;
  };
}

interface LeadScore {
  score: number;
  triggers: string[];
  icp_match: boolean;
  outreach_priority: 'high' | 'medium' | 'low';
}

export async function POST(request: NextRequest) {
  try {
    const body: RB2BWebhookPayload = await request.json();

    console.log('[RB2B Webhook] Received:', body.event, 'for visitor:', body.visitor.id);

    // Lead scoring
    const leadScore = calculateLeadScore(body);

    console.log('[RB2B Webhook] Lead score:', leadScore);

    // If high-priority ICP match, trigger outreach
    if (leadScore.icp_match && leadScore.outreach_priority === 'high') {
      await triggerOutreachSequence(body.visitor, leadScore);
    }

    // Store in database (implement with PostgreSQL)
    await storeLead(body, leadScore);

    return NextResponse.json({
      success: true,
      visitor_id: body.visitor.id,
      lead_score: leadScore.score,
      icp_match: leadScore.icp_match,
      triggers: leadScore.triggers,
    });

  } catch (error) {
    console.error('[RB2B Webhook] Error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

/**
 * Calculate lead score based on Nebula's ICP criteria
 * ICP: "Spent $10k+ on ads, zero conversions"
 */
function calculateLeadScore(webhook: RB2BWebhookPayload): LeadScore {
  let score = 0;
  const triggers: string[] = [];

  // UTM signals (ad traffic)
  if (webhook.visitor.utm_source) {
    if (['facebook', 'meta', 'google', 'linkedin', 'twitter', 'x'].includes(webhook.visitor.utm_source.toLowerCase())) {
      score += 10;
      triggers.push('paid_traffic_source');
    }
  }

  // Page view patterns indicating pain
  const painPages = webhook.visitor.page_views.filter(page =>
    page.includes('audit') ||
    page.includes('pricing') ||
    page.includes('case-studies') ||
    page.includes('learning-centre')
  );

  if (painPages.length >= 3) {
    score += 15;
    triggers.push('high_intent_pages');
  }

  // Multiple visits = consideration
  if (webhook.visitor.visit_count >= 3) {
    score += 10;
    triggers.push('repeat_visitor');
  }

  // Session duration > 60s = engaged
  if (webhook.session.duration_seconds > 60) {
    score += 5;
    triggers.push('engaged_session');
  }

  // Identified email = high value
  if (webhook.visitor.email) {
    score += 20;
    triggers.push('identified_email');
  }

  // Company identified
  if (webhook.visitor.company) {
    score += 10;
    triggers.push('identified_company');
  }

  // UTM campaign with spend indicator
  if (webhook.visitor.utm_campaign?.includes('launch') ||
      webhook.visitor.utm_campaign?.includes('scale') ||
      webhook.visitor.utm_campaign?.includes('growth')) {
    score += 15;
    triggers.push('growth_campaign_detected');
  }

  // Pages that suggest ad spend pain
  const adPainPages = webhook.visitor.page_views.filter(page =>
    page.includes('google-ads') ||
    page.includes('meta-ads') ||
    page.includes('facebook-ads') ||
    page.includes('clicks-no-sales')
  );

  if (adPainPages.length > 0) {
    score += 25;
    triggers.push('ad_spend_pain_signal');
  }

  // Determine ICP match
  const icp_match = score >= 50 || triggers.includes('ad_spend_pain_signal');

  // Assign priority
  let outreach_priority: 'high' | 'medium' | 'low';
  if (score >= 60) {
    outreach_priority = 'high';
  } else if (score >= 30) {
    outreach_priority = 'medium';
  } else {
    outreach_priority = 'low';
  }

  return { score, triggers, icp_match, outreach_priority };
}

/**
 * Trigger outreach sequence for high-priority ICP
 */
async function triggerOutreachSequence(visitor: RB2BWebhookPayload['visitor'], leadScore: LeadScore) {
  if (!visitor.email) {
    console.log('[Outreach] No email for visitor, skipping sequence');
    return;
  }

  console.log('[Outreach] Triggering sequence for:', visitor.email);

  try {
    // Call email service to queue sequence
    const response = await fetch('http://localhost:3000/api/email/process', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        visitor_id: visitor.id,
        email: visitor.email,
        name: visitor.name,
        company: visitor.company,
        score: leadScore.score,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Queue failed: ${error}`);
    }

    const result = await response.json();
    console.log('[Outreach] Queued:', result);

  } catch (error) {
    console.error('[Outreach] Error:', error);
    throw error;
  }
}

/**
 * Store lead in database
 */
async function storeLead(webhook: RB2BWebhookPayload, leadScore: LeadScore) {
  // TODO: Implement PostgreSQL storage
  // INSERT INTO leads (visitor_id, email, company, score, triggers, icp_match, created_at)
  // VALUES (...)

  console.log('[Storage] Storing lead:', webhook.visitor.id, 'Score:', leadScore.score);
}

// Health check
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    endpoint: 'rb2b_webhook',
    version: '1.0.0',
  });
}

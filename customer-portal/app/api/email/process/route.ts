import { NextResponse } from 'next/server';
import { processEmailQueue, getQueueStats, queueLeadForOutreach } from '../../../lib/email-service';

/**
 * Email Queue Processor API
 * Called by cron job every 5 minutes
 */

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action') || 'process';

  try {
    if (action === 'stats') {
      const stats = await getQueueStats();
      return NextResponse.json(stats);
    }

    if (action === 'process') {
      const result = await processEmailQueue();
      return NextResponse.json({
        success: true,
        processed: result.sent + result.failed,
        sent: result.sent,
        failed: result.failed,
      });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });

  } catch (error) {
    console.error('[Email Processor] Error:', error);
    return NextResponse.json(
      { error: 'Processing failed', details: String(error) },
      { status: 500 }
    );
  }
}

/**
 * Manual trigger for testing
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { visitor_id, email, name, company, score } = body;

    if (!visitor_id || !email) {
      return NextResponse.json(
        { error: 'visitor_id and email are required' },
        { status: 400 }
      );
    }

    const leadId = await queueLeadForOutreach(
      visitor_id,
      email,
      name,
      company,
      score || 50
    );

    return NextResponse.json({
      success: true,
      lead_id: leadId,
      message: '5-email sequence queued',
    });

  } catch (error) {
    console.error('[Email Processor] Queue error:', error);
    return NextResponse.json(
      { error: 'Queue failed', details: String(error) },
      { status: 500 }
    );
  }
}

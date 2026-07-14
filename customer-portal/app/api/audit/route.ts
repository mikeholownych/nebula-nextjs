import { NextRequest, NextResponse } from 'next/server';

interface AuditRequest {
  url: string;
  email: string;
  goal: string;
  adSpend?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: AuditRequest = await request.json();
    const { url, email, goal } = body;

    // Basic validation
    if (!url || !email) {
      return NextResponse.json(
        { error: 'URL and email are required.' },
        { status: 400 }
      );
    }

    // Validate URL format
    try {
      new URL(url);
    } catch {
      return NextResponse.json(
        { error: 'Please enter a valid URL.' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Please enter a valid email address.' },
        { status: 400 }
      );
    }

    // In a real implementation, you would:
    // 1. Queue the audit job
    // 2. Send email to Mailgun/SendGrid
    // 3. Store lead in database
    
    // For now, simulate success and redirect
    console.log('[Audit API] Received request:', { url, email, goal });

    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 500));

    // Return success with redirect to thank-you page
    return NextResponse.json({
      success: true,
      redirect: '/thank-you?email=' + encodeURIComponent(email)
    });
  } catch (error) {
    console.error('[Audit API] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error. Please try again.' },
      { status: 500 }
    );
  }
}

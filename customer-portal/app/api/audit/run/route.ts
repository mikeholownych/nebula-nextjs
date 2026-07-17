import { NextRequest, NextResponse } from 'next/server';

/**
 * Proxy to FastAPI platform API for audit processing
 * Routes POST requests to localhost:8001/audit/run
 */

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Forward to local FastAPI
    const response = await fetch('http://127.0.0.1:8001/audit/run', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Audit processing failed', status: response.status },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Audit API proxy error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function GET() {
  // Health check - proxy to FastAPI health endpoint
  try {
    const response = await fetch('http://127.0.0.1:8001/audit/health');
    const data = await response.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json(
      { status: 'error', message: 'Audit API not available' },
      { status: 503 }
    );
  }
}

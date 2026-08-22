import { NextRequest, NextResponse } from "next/server";
import { readCappedJson } from "@/app/lib/request-limits";

/**
 * POST /api/analytics
 * Server-side GA4 event tracking (for sensitive events like purchases)
 */

const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || "";
const GA_API_SECRET = process.env.GA_API_SECRET; // Set in Vercel/env

interface GAEvent {
  name: string;
  params?: Record<string, string | number | boolean>;
}

export async function POST(request: NextRequest) {
  try {
    const parsed = await readCappedJson<{ events: GAEvent[]; client_id?: string }>(request);
    if (!parsed.ok) return parsed.response;
    const body = parsed.body;
    const { events, client_id } = body;

    if (!events || !Array.isArray(events)) {
      return NextResponse.json(
        { error: "Invalid payload: 'events' array required" },
        { status: 400 }
      );
    }

    // Check consent server-side (client should check before sending)
    // This endpoint is for server-side measurement only

    // If we have GA API secret, use Measurement Protocol
    if (GA_API_SECRET && client_id) {
      const measurementPayload = {
        client_id,
        events: events.map(event => ({
          name: event.name,
          params: event.params || {},
        })),
      };

      // Fire to GA4 Measurement Protocol
      await fetch(
        `https://www.google-analytics.com/mp/collect?measurement_id=${GA_MEASUREMENT_ID}&api_secret=${GA_API_SECRET}`,
        {
          method: "POST",
          signal: AbortSignal.timeout(5_000),
          body: JSON.stringify(measurementPayload),
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // GA4 Measurement Protocol forwarding is the primary analytics path.
    // Local DB analytics_events table not implemented - PostHog covers behavioral analytics.

    return NextResponse.json({ success: true, events_received: events.length });
  } catch (error: unknown) {
    console.error("Analytics error:", error);
    return NextResponse.json(
      { error: "Failed to track events" },
      { status: 500 }
    );
  }
}

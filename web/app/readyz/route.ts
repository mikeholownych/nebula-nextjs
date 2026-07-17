export const dynamic = 'force-dynamic';

export async function GET() {
  // only checks environment settings, no secret exposure
  const missing: string[] = [];
  const siteUrl = process.env.NEXTAUTH_URL || process.env.SITE_URL;
  if (!siteUrl) missing.push('SITE_URL');
  
  if (missing.length > 0) {
    return Response.json(
      { status: 'unhealthy', missing },
      { status: 503, headers: { 'Cache-Control': 'no-store, max-age=0' } }
    );
  }
  
  return Response.json({ status: 'ok' }, {
    status: 200,
    headers: { 'Cache-Control': 'no-store, max-age=0' },
  });
}
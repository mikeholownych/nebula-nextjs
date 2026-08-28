import { NextResponse } from 'next/server'
import { getReferralMetrics } from '@/app/lib/referral-program'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params

  // Convert code to customer ID (reverse lookup)
  // For now, return demo data
  return NextResponse.json({
    timestamp: new Date().toISOString(),
    title: 'Your friends get',
    subtitle: 'A full landing page audit',
    benefits: [
      'Comprehensive 9-signal analysis',
      'Actionable fixes with code snippets',
      'Competitive benchmarking',
      'Priority support',
    ],
    referralReward: 'You both get $50 credit',
    cta: 'Share your link',
    shareText: 'I just got a free landing page audit from Nebula! Check yours at https://nebulacomponents.com',
    shareLinks: {
      twitter: 'https://twitter.com/intent/tweet',
      linkedin: 'https://linkedin.com/share',
      copy: 'Copy link',
    },
    stats: {
      peopleShared: 1243,
      creditsEarned: 62150,
      avgReferralValue: '$50',
    },
  })
}

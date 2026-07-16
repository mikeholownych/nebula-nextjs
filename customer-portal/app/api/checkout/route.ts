import { NextRequest, NextResponse } from 'next/server'

// In production, use environment variables for Stripe secret key
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, items } = body

    if (!email) {
      return NextResponse.json({ error: 'Email required' }, { status: 400 })
    }

    if (!items || items.length === 0) {
      return NextResponse.json({ error: 'No items in cart' }, { status: 400 })
    }

    const totalAmount = items.reduce((sum: number, item: { price: number }) => sum + item.price, 0)

    // Create Stripe checkout session
    const response = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${STRIPE_SECRET_KEY}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        'payment_method_types[]': 'card',
        'customer_email': email,
        'line_items[0][price_data][currency]': 'usd',
        'line_items[0][price_data][unit_amount]': totalAmount.toString(),
        'line_items[0][price_data][product_data][name]': items.map((i: { type: string }) => i.type).join(' + '),
        'line_items[0][quantity]': '1',
        'mode': 'payment',
        'success_url': `${process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'}/thank-you?session_id={CHECKOUT_SESSION_ID}`,
        'cancel_url': `${process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'}/checkout`,
        'metadata[purchase_type]': items[0].type,
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      console.error('[Checkout API] Stripe error:', error)
      
      // For demo without Stripe, simulate successful session
      if (STRIPE_SECRET_KEY === 'sk_test_placeholder') {
        console.log('[Checkout API] Demo mode — simulating checkout')
        return NextResponse.json({
          success: true,
          sessionId: `demo_session_${Date.now()}`,
          url: `/thank-you?session=demo&total=${totalAmount}`,
        })
      }

      return NextResponse.json({ error: 'Checkout failed' }, { status: 500 })
    }

    const session = await response.json()
    return NextResponse.json({
      success: true,
      sessionId: session.id,
      url: session.url,
    })
  } catch (error) {
    console.error('[Checkout API] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

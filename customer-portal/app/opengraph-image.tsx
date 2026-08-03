import { ImageResponse } from 'next/og'

export const alt = 'Nebula Components — diagnose landing-page conversion leaks before they burn more ad spend'
export const size = {
  width: 1200,
  height: 630,
}
export const contentType = 'image/png'

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '64px 72px',
          color: '#ffffff',
          background:
            'radial-gradient(circle at 86% 18%, rgba(0,194,160,0.28), transparent 34%), #050505',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div
              style={{
                width: 34,
                height: 34,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 9,
                background: '#00c2a0',
                color: '#050505',
                fontSize: 24,
                fontWeight: 900,
              }}
            >
              N
            </div>
            <div style={{ display: 'flex', fontSize: 27, fontWeight: 750, letterSpacing: '-0.02em' }}>
              Nebula Components
            </div>
          </div>
          <div
            style={{
              display: 'flex',
              border: '1px solid rgba(0,194,160,0.55)',
              borderRadius: 999,
              padding: '10px 18px',
              color: '#33d4b8',
              fontSize: 16,
              fontWeight: 650,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
            }}
          >
            Evidence-backed diagnosis
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', maxWidth: 960 }}>
          <div style={{ display: 'flex', color: '#33d4b8', fontSize: 22, fontWeight: 650, marginBottom: 20 }}>
            For founders burning cash on ads
          </div>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              fontSize: 68,
              lineHeight: 1.04,
              fontWeight: 820,
              letterSpacing: '-0.045em',
            }}
          >
            <div style={{ display: 'flex' }}>Your ads are fine.</div>
            <div style={{ display: 'flex' }}>
              Your landing page has&nbsp;<span style={{ color: '#00c2a0' }}>a leak.</span>
            </div>
          </div>
          <div style={{ display: 'flex', marginTop: 24, color: '#9e9e9e', fontSize: 25 }}>
            Find the failure before it burns another dollar.
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingTop: 22,
            borderTop: '1px solid rgba(255,255,255,0.08)',
            color: '#9e9e9e',
            fontSize: 18,
          }}
        >
          <div style={{ display: 'flex' }}>9-signal audit → One-Leak Repair Sprint</div>
          <div style={{ display: 'flex', color: '#00c2a0', fontWeight: 650 }}>nebulacomponents.com</div>
        </div>
      </div>
    ),
    size,
  )
}

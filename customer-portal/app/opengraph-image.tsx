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
          color: '#f8fafc',
          background:
            'radial-gradient(circle at 86% 18%, rgba(16,185,129,0.25), transparent 31%), linear-gradient(135deg, #05080d 0%, #0b1220 58%, #071810 100%)',
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
                background: '#10b981',
                color: '#03130d',
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
              border: '1px solid rgba(16,185,129,0.55)',
              borderRadius: 999,
              padding: '10px 18px',
              color: '#6ee7b7',
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
          <div style={{ display: 'flex', color: '#6ee7b7', fontSize: 22, fontWeight: 650, marginBottom: 20 }}>
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
              Your landing page has&nbsp;<span style={{ color: '#6ee7b7' }}>a leak.</span>
            </div>
          </div>
          <div style={{ display: 'flex', marginTop: 24, color: '#a7b2c4', fontSize: 25 }}>
            Find the failure before it burns another dollar.
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingTop: 22,
            borderTop: '1px solid rgba(148,163,184,0.2)',
            color: '#94a3b8',
            fontSize: 18,
          }}
        >
          <div style={{ display: 'flex' }}>Leak diagnosis → prioritized fix path</div>
          <div style={{ display: 'flex', color: '#d1fae5', fontWeight: 650 }}>nebulacomponents.shop</div>
        </div>
      </div>
    ),
    size,
  )
}

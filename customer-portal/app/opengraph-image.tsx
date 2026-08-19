import { ImageResponse } from 'next/og'

export const alt = 'Nebula Components - inspect failed page conditions before spending more on ads'
export const size = {
  width: 1200,
  height: 630,
}
export const contentType = 'image/png'

/**
 * SignalMark - 3×3 grid of conversion-signal dots, matching the brand
 * glyph in components/NebulaMark.tsx (NebulaLogo decorative pattern:
 * top row pass, middle mixed, bottom neutral).
 */
function SignalMark({ size = 32 }: { size?: number }) {
  const pattern: ('pass' | 'neutral')[] = [
    'pass', 'pass', 'pass',
    'pass', 'pass', 'neutral',
    'neutral', 'neutral', 'neutral',
  ]
  const dot = Math.round(size * 0.19)
  return (
    <div
      style={{
        width: size,
        height: size,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
      }}
    >
      {[0, 1, 2].map((row) => (
        <div key={row} style={{ display: 'flex', justifyContent: 'space-between' }}>
          {[0, 1, 2].map((col) => {
            const state = pattern[row * 3 + col]
            return (
              <div
                key={col}
                style={{
                  width: dot,
                  height: dot,
                  borderRadius: '50%',
                  background: state === 'pass' ? '#c7ff2f' : 'rgba(158,158,158,0.25)',
                }}
              />
            )
          })}
        </div>
      ))}
    </div>
  )
}

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
          background: '#080909',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <SignalMark size={34} />
            <div style={{ display: 'flex', fontSize: 27, fontWeight: 750, letterSpacing: '-0.02em' }}>
              Nebula Components
            </div>
          </div>
          <div
            style={{
              display: 'flex',
              border: '1px solid rgba(199,255,47,0.45)',
              borderRadius: 6,
              padding: '10px 18px',
              color: '#c7ff2f',
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
          <div style={{ display: 'flex', color: '#c7ff2f', fontSize: 22, fontWeight: 650, marginBottom: 20 }}>
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
              Your landing page has&nbsp;<span style={{ color: '#c7ff2f' }}>a leak.</span>
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
          <div style={{ display: 'flex', color: '#c7ff2f', fontWeight: 650 }}>nebulacomponents.com</div>
        </div>
      </div>
    ),
    size,
  )
}

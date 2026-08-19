import React from 'react'

/**
 * SignalHorizon - Foreground diagnostic waveform and calibration terrain overlay.
 * Adapts Questly's bottom silhouette grounding layer into a unique, proprietary
 * technical measurement horizon for Nebula.
 */
export const SignalHorizon: React.FC = () => {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute bottom-0 left-0 z-20 w-full select-none overflow-hidden h-20 sm:h-28 lg:h-36 flex items-end"
    >
      {/* Deep gradient fade at the very bottom */}
      <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-bg to-transparent z-10" />

      {/* SVG Diagnostic Signal Terrain */}
      <svg
        viewBox="0 0 1440 120"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="none"
        className="w-full h-full opacity-60 transition-opacity"
      >
        <defs>
          {/* Chartreuse glow gradient */}
          <linearGradient id="portal-signal-glow" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#c7ff2f" stopOpacity="0.25" />
            <stop offset="50%" stopColor="#c7ff2f" stopOpacity="0.06" />
            <stop offset="100%" stopColor="#080909" stopOpacity="0" />
          </linearGradient>

          {/* Secondary cyan/blue diagnostic gradient */}
          <linearGradient id="portal-signal-blue" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#080909" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Background Signal Area Fill */}
        <path
          d="M0,120 L0,85 Q60,65 120,80 T240,60 T360,95 T480,45 T600,75 T720,30 T840,70 T960,40 T1080,85 T1200,55 T1320,70 T1440,50 L1440,120 Z"
          fill="url(#portal-signal-glow)"
        />

        {/* Secondary Oscilloscope Area */}
        <path
          d="M0,120 L0,95 Q80,85 160,100 T320,75 T480,90 T640,65 T800,85 T960,60 T1120,95 T1280,75 T1440,80 L1440,120 Z"
          fill="url(#portal-signal-blue)"
        />

        {/* Primary High-Precision Diagnostic Stroke */}
        <path
          d="M0,85 Q60,65 120,80 T240,60 T360,95 T480,45 T600,75 T720,30 T840,70 T960,40 T1080,85 T1200,55 T1320,70 T1440,50"
          stroke="#c7ff2f"
          strokeWidth="1.5"
          strokeOpacity="0.7"
        />

        {/* Secondary Calibration Scanline */}
        <path
          d="M0,95 Q80,85 160,100 T320,75 T480,90 T640,65 T800,85 T960,60 T1120,95 T1280,75 T1440,80"
          stroke="#3b82f6"
          strokeWidth="1"
          strokeOpacity="0.4"
          strokeDasharray="4 3"
        />

        {/* Diagnostic Measurement Nodes */}
        <circle cx="480" cy="45" r="3" fill="#c7ff2f" className="animate-pulse" />
        <circle cx="720" cy="30" r="3.5" fill="#c7ff2f" className="animate-ping" opacity="0.6" />
        <circle cx="720" cy="30" r="2.5" fill="#c7ff2f" />
        <circle cx="960" cy="40" r="3" fill="#c7ff2f" />
        <circle cx="1200" cy="55" r="2.5" fill="#3b82f6" />
      </svg>
    </div>
  )
}

export default SignalHorizon

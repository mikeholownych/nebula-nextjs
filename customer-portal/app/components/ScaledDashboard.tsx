'use client'

import React, { useEffect, useRef, useState } from 'react'
import { DashboardMockup } from './DashboardMockup'

const DESIGN_WIDTH = 896
const DESIGN_HEIGHT = 612

export const ScaledDashboard: React.FC = () => {
  const outerRef = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(1)

  useEffect(() => {
    const element = outerRef.current
    if (!element) return

    const updateScale = (width: number) => setScale(Math.min(1, width / DESIGN_WIDTH))
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) updateScale(entry.contentRect.width)
    })

    updateScale(element.offsetWidth)
    observer.observe(element)
    return () => observer.disconnect()
  }, [])

  return (
    <div ref={outerRef} className="absolute inset-0 overflow-hidden">
      <div
        className="absolute left-1/2 top-0 w-[896px] origin-top"
        style={{
          height: `${DESIGN_HEIGHT}px`,
          transform: `translateX(-50%) scale(${scale})`,
        }}
      >
        <DashboardMockup />
      </div>
    </div>
  )
}

export default ScaledDashboard

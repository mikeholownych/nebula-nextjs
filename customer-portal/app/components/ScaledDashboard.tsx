'use client'

import React, { useRef, useState, useEffect } from 'react'
import { DashboardMockup } from './DashboardMockup'

const DESIGN_WIDTH = 896

/**
 * ScaledDashboard wraps the fixed-width 896px DashboardMockup in a dynamic
 * ResizeObserver scale container that shrinks proportionally on smaller viewports
 * without horizontal overflow.
 */
export const ScaledDashboard: React.FC = () => {
  const outerRef = useRef<HTMLDivElement>(null)
  const innerRef = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(1)
  const [containerHeight, setContainerHeight] = useState<number | undefined>(undefined)

  useEffect(() => {
    const el = outerRef.current
    if (!el) return

    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const availableWidth = entry.contentRect.width
        const newScale = Math.min(1, availableWidth / DESIGN_WIDTH)
        setScale(newScale)

        if (innerRef.current) {
          const naturalHeight = innerRef.current.offsetHeight
          setContainerHeight(naturalHeight * newScale)
        }
      }
    })

    ro.observe(el)

    if (innerRef.current) {
      const naturalHeight = innerRef.current.offsetHeight
      const initialScale = Math.min(1, el.offsetWidth / DESIGN_WIDTH)
      setScale(initialScale)
      setContainerHeight(naturalHeight * initialScale)
    }

    return () => ro.disconnect()
  }, [])

  return (
    <div
      ref={outerRef}
      className="relative w-full flex justify-center overflow-visible"
      style={{ height: containerHeight ? `${containerHeight}px` : 'auto' }}
    >
      <div
        ref={innerRef}
        className="w-[896px] shrink-0 origin-top"
        style={{
          transform: `scale(${scale})`,
          transition: 'transform 100ms ease-out',
        }}
      >
        <DashboardMockup />
      </div>
    </div>
  )
}

export default ScaledDashboard

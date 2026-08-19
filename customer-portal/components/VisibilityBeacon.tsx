'use client'

/**
 * VisibilityBeacon Component
 *
 * Implements Phase 16 Frontend Visibility Instrumentation:
 * Elements are only classified as "exposed" when they achieve >= 50% viewport
 * visibility continuously for >= 500ms.
 */

import React, { useEffect, useRef } from 'react'
import { trackVisibilityExposure } from '@/app/lib/client-funnel'

interface VisibilityBeaconProps {
  beaconId: string
  eventName: 'audit_cta_exposed' | 'repair_sprint_exposed'
  properties?: Record<string, unknown>
  children?: React.ReactNode
  className?: string
  as?: React.ElementType
}

export default function VisibilityBeacon({
  beaconId,
  eventName,
  properties = {},
  children,
  className = '',
  as: Component = 'div',
}: VisibilityBeaconProps) {
  const elementRef = useRef<HTMLElement | null>(null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const hasTriggeredRef = useRef<boolean>(false)

  useEffect(() => {
    const el = elementRef.current
    if (!el || typeof window === 'undefined' || !('IntersectionObserver' in window)) {
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
            // Start 500ms continuous dwell timer
            if (!timerRef.current && !hasTriggeredRef.current) {
              timerRef.current = setTimeout(() => {
                if (!hasTriggeredRef.current) {
                  hasTriggeredRef.current = true
                  trackVisibilityExposure(beaconId, eventName, {
                    ...properties,
                    cta_id: beaconId,
                    visible_ratio: entry.intersectionRatio,
                  })
                  observer.disconnect()
                }
              }, 500)
            }
          } else {
            // Cancel timer if element exits before 500ms
            if (timerRef.current) {
              clearTimeout(timerRef.current)
              timerRef.current = null
            }
          }
        }
      },
      {
        threshold: [0.5],
      }
    )

    observer.observe(el)

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
      }
      observer.disconnect()
    }
  }, [beaconId, eventName, properties])

  return (
    <Component
      ref={(node: HTMLElement | null) => {
        elementRef.current = node
      }}
      data-visibility-beacon={beaconId}
      className={className}
    >
      {children}
    </Component>
  )
}

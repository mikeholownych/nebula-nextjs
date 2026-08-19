/**
 * Canonical Analytics Registry & Governance Rules
 *
 * Source of truth: config/analytics-registry.json
 */

import registryData from '@/config/analytics-registry.json'

export type EventStage =
  | 'acquisition'
  | 'engagement'
  | 'audit_intake'
  | 'audit_execution'
  | 'result_view'
  | 'result_engagement'
  | 'monetization'
  | 'checkout'
  | 'purchase'

export type SourceOfTruth = 'client' | 'server_api' | 'server_worker' | 'payment_webhook'

export type PrivacyClassification =
  | 'PUBLIC'
  | 'PSEUDONYMOUS'
  | 'PERSONAL'
  | 'SENSITIVE'
  | 'PROHIBITED'

export type CardinalityTier = 'bounded' | 'low' | 'medium' | 'high'

export type FailureReason =
  | 'invalid_url'
  | 'unsupported_scheme'
  | 'blocked_target'
  | 'fetch_timeout'
  | 'crawl_failure'
  | 'script_error'
  | 'internal_error'
  | 'rate_limited'
  | 'quota_exceeded'
  | 'checkout_provider_error'
  | 'audit_not_eligible'
  | 'audit_not_unlocked'
  | 'payment_declined'
  | 'session_expired'
  | 'not_found'
  | 'network_error'
  | 'invalid_payload'
  | 'unknown'

export interface EventDefinition {
  name: string
  version: number
  stage: EventStage
  source_of_truth: SourceOfTruth
  description: string
  funnel_critical: boolean
  ga4_projectable: boolean
  ga4_event_name: string
  persisted_internally: boolean
  privacy_classification: PrivacyClassification
  cardinality: CardinalityTier
  deduplication_rule: string
  required_properties: string[]
  allowed_properties: string[]
}

export interface RegistrySchema {
  version: string
  name: string
  description: string
  failure_reasons: FailureReason[]
  prohibited_properties: string[]
  events: EventDefinition[]
}

export const CANONICAL_REGISTRY = registryData as RegistrySchema

export const EVENT_MAP = new Map<string, EventDefinition>(
  CANONICAL_REGISTRY.events.map((e) => [e.name, e as EventDefinition]),
)

export const VALID_FAILURE_REASONS = new Set<string>(CANONICAL_REGISTRY.failure_reasons)
export const PROHIBITED_PROPERTIES = new Set<string>(CANONICAL_REGISTRY.prohibited_properties)

export function getEventDefinition(eventName: string): EventDefinition | undefined {
  return EVENT_MAP.get(eventName)
}

export function isCanonicalEvent(eventName: string): boolean {
  return EVENT_MAP.has(eventName)
}

export interface ValidationResult {
  valid: boolean
  errors: string[]
}

export function validateEventPayload(
  eventName: string,
  properties: Record<string, unknown> = {},
): ValidationResult {
  const def = getEventDefinition(eventName)
  const errors: string[] = []

  if (!def) {
    errors.push(`Unknown canonical event: "${eventName}"`)
    return { valid: false, errors }
  }

  // Check prohibited properties
  for (const key of Object.keys(properties)) {
    const lowerKey = key.toLowerCase()
    if (PROHIBITED_PROPERTIES.has(lowerKey)) {
      errors.push(`Prohibited property "${key}" in event "${eventName}"`)
    }
  }

  // Check required properties
  for (const req of def.required_properties) {
    if (properties[req] === undefined || properties[req] === null || properties[req] === '') {
      errors.push(`Missing required property "${req}" for event "${eventName}"`)
    }
  }

  // Check failure reasons if present
  if (properties.reason_code) {
    const reason = String(properties.reason_code)
    if (!VALID_FAILURE_REASONS.has(reason)) {
      errors.push(`Invalid normalized failure reason "${reason}" for event "${eventName}"`)
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}

/**
 * Sanitize properties for GA4 projection to prevent PII and unbounded cardinality.
 */
export function sanitizeForGA4(
  eventName: string,
  properties: Record<string, unknown>,
): Record<string, string | number | boolean> {
  const sanitized: Record<string, string | number | boolean> = {}

  for (const [key, val] of Object.entries(properties)) {
    if (val === undefined || val === null) continue
    const lowerKey = key.toLowerCase()

    // Exclude prohibited fields
    if (PROHIBITED_PROPERTIES.has(lowerKey)) continue

    // Normalize primitive values
    if (typeof val === 'boolean' || typeof val === 'number') {
      sanitized[key] = val
    } else if (typeof val === 'string') {
      // Avoid sending full URLs with tokens/secrets to GA4
      if (key === 'page_url' || key === 'url') {
        try {
          const u = new URL(val)
          sanitized[key] = `${u.origin}${u.pathname}`.slice(0, 200)
        } catch {
          sanitized[key] = val.slice(0, 100)
        }
      } else {
        sanitized[key] = val.slice(0, 100)
      }
    }
  }

  return sanitized
}

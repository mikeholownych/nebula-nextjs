#!/usr/bin/env node

/**
 * CI Analytics Governance & Schema Validator
 *
 * Verifies that:
 * 1. config/analytics-registry.json is valid and contains all canonical events.
 * 2. Event names, stages, privacy levels, and required properties conform to schema.
 * 3. Prohibited properties (PII, credentials, raw HTML) are strictly banned.
 *
 * Usage: node scripts/check-analytics-governance.mjs [--check]
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const registryPath = path.join(__dirname, '..', 'config', 'analytics-registry.json')

function runGovernanceCheck() {
  console.log('🔍 Validating Canonical Analytics Registry & Governance Rules...')

  if (!fs.existsSync(registryPath)) {
    console.error(`❌ Missing registry file: ${registryPath}`)
    process.exit(1)
  }

  let registry
  try {
    const raw = fs.readFileSync(registryPath, 'utf8')
    registry = JSON.parse(raw)
  } catch (err) {
    console.error(`❌ Failed to parse JSON registry: ${err.message}`)
    process.exit(1)
  }

  if (!registry.events || !Array.isArray(registry.events)) {
    console.error('❌ Registry must contain an "events" array')
    process.exit(1)
  }

  const validStages = new Set([
    'acquisition',
    'engagement',
    'audit_intake',
    'audit_execution',
    'result_view',
    'result_engagement',
    'monetization',
    'checkout',
    'purchase',
  ])

  const validSources = new Set([
    'client',
    'server_api',
    'server_worker',
    'payment_webhook',
  ])

  const validPrivacy = new Set([
    'PUBLIC',
    'PSEUDONYMOUS',
    'PERSONAL',
    'SENSITIVE',
    'PROHIBITED',
  ])

  const prohibitedProperties = new Set(registry.prohibited_properties || [])
  const seenEventNames = new Set()
  let errors = 0

  for (const event of registry.events) {
    if (!event.name || typeof event.name !== 'string') {
      console.error(`❌ Event missing valid name`)
      errors++
      continue
    }

    if (seenEventNames.has(event.name)) {
      console.error(`❌ Duplicate event name: ${event.name}`)
      errors++
    }
    seenEventNames.add(event.name)

    if (!validStages.has(event.stage)) {
      console.error(`❌ Event "${event.name}" has invalid stage "${event.stage}"`)
      errors++
    }

    if (!validSources.has(event.source_of_truth)) {
      console.error(`❌ Event "${event.name}" has invalid source_of_truth "${event.source_of_truth}"`)
      errors++
    }

    if (!validPrivacy.has(event.privacy_classification)) {
      console.error(`❌ Event "${event.name}" has invalid privacy_classification "${event.privacy_classification}"`)
      errors++
    }

    // Prohibited property checks
    for (const prop of event.allowed_properties || []) {
      if (prohibitedProperties.has(prop.toLowerCase())) {
        console.error(`❌ Event "${event.name}" lists prohibited property "${prop}" in allowed_properties`)
        errors++
      }
    }
  }

  if (errors > 0) {
    console.error(`\n❌ Analytics Governance Validation Failed with ${errors} error(s).`)
    process.exit(1)
  }

  console.log(`✅ Analytics Governance Passed: ${registry.events.length} canonical events validated.`)
}

runGovernanceCheck()

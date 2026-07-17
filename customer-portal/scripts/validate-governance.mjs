#!/usr/bin/env node

/**
 * Governance Validation Script
 *
 * Validates that all public routes have owners, claims have evidence,
 * and data fields have lawful basis.
 *
 * Exit codes:
 *   0 - All checks pass
 *   1 - One or more validation failures
 */

import { existsSync, readdirSync, readFileSync, statSync } from 'fs';
import { join, relative } from 'path';
const ROOT = process.cwd();
const DOCS_GOVERNANCE = join(ROOT, 'docs/governance');

// Validation result accumulator
const results = {
  passed: [],
  warnings: [],
  failed: []
};

function log(message, level = 'info') {
  const prefix = level === 'error' ? '✗' : level === 'warn' ? '⚠' : '✓';
  console.log(`${prefix} ${message}`);
}

function pass(message) {
  results.passed.push(message);
  log(message, 'info');
}

function warn(message) {
  results.warnings.push(message);
  log(message, 'warn');
}

function fail(message) {
  results.failed.push(message);
  log(message, 'error');
}

// ============================================================================
// ROUTE REGISTER VALIDATION
// ============================================================================

function validateRouteRegister() {
  console.log('\n=== ROUTE_REGISTER.md Validation ===\n');

  const registerPath = join(DOCS_GOVERNANCE, 'ROUTE_REGISTER.md');
  if (!existsSync(registerPath)) {
    fail('ROUTE_REGISTER.md not found');
    return;
  }

  const content = readFileSync(registerPath, 'utf-8');

  // Check for required sections
  const requiredSections = [
    '## App Router Pages',
    '## API Routes',
    '## Archive Routes',
    '## Validation Rules'
  ];

  for (const section of requiredSections) {
    if (content.includes(section)) {
      pass(`Found section: ${section}`);
    } else {
      fail(`Missing section: ${section}`);
    }
  }

  // Check for UNASSIGNED owners in production routes
  const unassignedMatches = content.match(/\*\*UNASSIGNED\*\*/g);
  if (unassignedMatches) {
    warn(`Found ${unassignedMatches.length} routes with UNASSIGNED owner`);
  } else {
    pass('All production routes have assigned owners');
  }

  // Check archive routes have quarantine-task1 owner
  const archiveRoutes = (content.match(/quarantine-task1/g) || []).length;
  if (archiveRoutes >= 26) {
    pass(`All ${archiveRoutes} archive routes have quarantine-task1 owner`);
  } else {
    warn(`Expected 26+ archive routes, found ${archiveRoutes} with quarantine-task1 owner`);
  }

  // Check archive routes have noindex documentation
  const archiveNoindexSection = content.match(/### Archive Routes[\s\S]*?### Production Routes|---/);
  if (archiveNoindexSection && archiveNoindexSection[0].includes('| No | No |')) {
    pass('Archive routes have noindex/nofollow documented');
  } else if (content.includes('| `/accessible-nebula`') && content.includes('| No | No |')) {
    pass('Archive routes have noindex/nofollow documented');
  } else {
    fail('Archive routes missing noindex documentation');
  }
}

// ============================================================================
// CLAIM REGISTER VALIDATION
// ============================================================================

function validateClaimRegister() {
  console.log('\n=== CLAIM_REGISTER.md Validation ===\n');

  const registerPath = join(DOCS_GOVERNANCE, 'CLAIM_REGISTER.md');
  if (!existsSync(registerPath)) {
    fail('CLAIM_REGISTER.md not found');
    return;
  }

  const content = readFileSync(registerPath, 'utf-8');

  // Check for excluded claims section
  if (content.includes('## Excluded Claims')) {
    pass('Found Excluded Claims section');
  } else {
    fail('Missing Excluded Claims section');
  }

  // Check for removed fabricated claims (should be in Excluded Claims section, not Active Claims)
  const excludedSection = content.match(/## Excluded Claims[\s\S]*?## /);
  const activeClaimsSection = content.match(/## Active Claims[\s\S]*?## Excluded/);

  const fabricatedClaims = [
    '60-second audit',
    '$2.3M in recovered revenue',
    '200+ landing pages',
    '450+ case studies',
    '4.9/5 customer rating'
  ];

  for (const claim of fabricatedClaims) {
    // Should be in Excluded Claims section
    if (excludedSection && excludedSection[0].includes(claim)) {
      pass(`Excluded claim documented: ${claim}`);
    } else if (activeClaimsSection && activeClaimsSection[0].includes(claim)) {
      fail(`Fabricated claim in active section: ${claim}`);
    } else {
      pass(`Removed fabricated claim: ${claim}`);
    }
  }

  // Check for Stripe Price ID evidence
  if (content.includes('Stripe Price ID') || content.includes('Stripe Dashboard')) {
    pass('Price claims have Stripe evidence');
  } else {
    warn('Price claims missing Stripe evidence');
  }

  // Check approval workflow
  if (content.includes('## Approval Workflow')) {
    pass('Approval workflow documented');
  } else {
    fail('Missing approval workflow section');
  }
}

// ============================================================================
// DATA REGISTER VALIDATION
// ============================================================================

function validateDataRegister() {
  console.log('\n=== DATA_REGISTER.md Validation ===\n');

  const registerPath = join(DOCS_GOVERNANCE, 'DATA_REGISTER.md');
  if (!existsSync(registerPath)) {
    fail('DATA_REGISTER.md not found');
    return;
  }

  const content = readFileSync(registerPath, 'utf-8');

  // Check for required sections
  const requiredSections = [
    '## Data Fields',
    '## Processors',
    '## Retention Policies',
    '## Data Subject Rights'
  ];

  for (const section of requiredSections) {
    if (content.includes(section)) {
      pass(`Found section: ${section}`);
    } else {
      fail(`Missing section: ${section}`);
    }
  }

  // Check for lawful basis
  if (content.includes('Legitimate interest') || content.includes('Explicit consent')) {
    pass('Lawful basis documented for data fields');
  } else {
    fail('No lawful basis documented');
  }

  // Check for AgentMail processor
  if (content.includes('AgentMail')) {
    pass('AgentMail documented as processor');
  } else {
    warn('AgentMail not documented as processor');
  }

  // Check for retention periods
  if (content.includes('90 days') || content.includes('7 years')) {
    pass('Retention periods documented');
  } else {
    fail('Missing retention periods');
  }
}

// ============================================================================
// LEGAL REVIEW CHECKLIST VALIDATION
// ============================================================================

function validateLegalChecklist() {
  console.log('\n=== LEGAL_REVIEW_CHECKLIST.md Validation ===\n');

  const checklistPath = join(DOCS_GOVERNANCE, 'LEGAL_REVIEW_CHECKLIST.md');
  if (!existsSync(checklistPath)) {
    fail('LEGAL_REVIEW_CHECKLIST.md not found');
    return;
  }

  const content = readFileSync(checklistPath, 'utf-8');

  // Check for pending reviews
  const pendingCount = (content.match(/\*\*PENDING\*\*/g) || []).length;
  if (pendingCount > 0) {
    warn(`Found ${pendingCount} items pending legal review`);
  } else {
    pass('No pending legal review items');
  }

  // Check for counsel sign-off section
  if (content.includes('## Counsel Sign-Off')) {
    pass('Counsel sign-off section exists');
  } else {
    fail('Missing counsel sign-off section');
  }

  // Check for specific legal review areas
  const reviewAreas = [
    'Privacy Policy',
    'Terms of Service',
    'Refund/Guarantee',
    'CAN-SPAM'
  ];

  for (const area of reviewAreas) {
    if (content.includes(area)) {
      pass(`Legal review area documented: ${area}`);
    } else {
      fail(`Missing legal review area: ${area}`);
    }
  }
}

// ============================================================================
// FILE SYSTEM VALIDATION
// ============================================================================

function validateGovernanceFiles() {
  console.log('\n=== Governance Files Existence ===\n');

  const requiredFiles = [
    'ROUTE_REGISTER.md',
    'CLAIM_REGISTER.md',
    'DATA_REGISTER.md',
    'LEGAL_REVIEW_CHECKLIST.md'
  ];

  for (const file of requiredFiles) {
    const filePath = join(DOCS_GOVERNANCE, file);
    if (existsSync(filePath)) {
      pass(`Found ${file}`);
    } else {
      fail(`Missing ${file}`);
    }
  }

  // Check .legacy/ARCHIVE_INVENTORY.md exists
  const archiveInventory = join(ROOT, '.legacy/ARCHIVE_INVENTORY.md');
  if (existsSync(archiveInventory)) {
    pass('Found .legacy/ARCHIVE_INVENTORY.md');
  } else {
    fail('Missing .legacy/ARCHIVE_INVENTORY.md');
  }
}

// ============================================================================
// RUN ALL VALIDATIONS
// ============================================================================

console.log('='.repeat(60));
console.log('GOVERNANCE VALIDATION');
console.log('='.repeat(60));

validateGovernanceFiles();
validateRouteRegister();
validateClaimRegister();
validateDataRegister();
validateLegalChecklist();

// ============================================================================
// SUMMARY
// ============================================================================

console.log('\n' + '='.repeat(60));
console.log('VALIDATION SUMMARY');
console.log('='.repeat(60));

console.log(`\nPassed: ${results.passed.length}`);
console.log(`Warnings: ${results.warnings.length}`);
console.log(`Failed: ${results.failed.length}`);

if (results.failed.length > 0) {
  console.log('\nFailed checks:');
  results.failed.forEach(f => console.log(`  - ${f}`));
  process.exit(1);
} else {
  console.log('\n✓ All governance validations passed');
  process.exit(0);
}

#!/usr/bin/env node
/**
 * Nebula Conversion & AI Citation CI Gate
 * Run in GitHub Actions or pre-commit hooks to verify conversion hygiene and schema readiness.
 *
 * Usage:
 *   node scripts/check-conversion-ci.mjs --dir ./out
 *   node scripts/check-conversion-ci.mjs --file ./out/index.html
 */

import fs from 'fs'
import path from 'path'

function findHtmlFiles(dir) {
  let results = []
  if (!fs.existsSync(dir)) return results
  const list = fs.readdirSync(dir)
  for (const file of list) {
    const filePath = path.join(dir, file)
    const stat = fs.statSync(filePath)
    if (stat && stat.isDirectory()) {
      results = results.concat(findHtmlFiles(filePath))
    } else if (filePath.endsWith('.html')) {
      results.push(filePath)
    }
  }
  return results
}

function auditHtmlContent(content, filename) {
  const issues = []

  // 1. Headline check (H1 presence)
  if (!/<h1[\s>]/i.test(content)) {
    issues.push({ signal: 'Headline', issue: 'Missing <h1> heading tag' })
  }

  // 2. Mobile Viewport check
  if (!/name=["']viewport["']/i.test(content)) {
    issues.push({ signal: 'Mobile Viewport', issue: 'Missing viewport meta tag for mobile responsiveness' })
  }

  // 3. CTA check (Button or Link with action)
  if (!/<button[\s>]/i.test(content) && !/class=["'][^"']*btn[^"']*["']/i.test(content) && !/<a[\s>]/i.test(content)) {
    issues.push({ signal: 'CTA Clarity', issue: 'No observable call-to-action button or conversion link found' })
  }

  // 4. Schema / JSON-LD check (AI Citation readiness)
  if (!/type=["']application\/ld\+json["']/i.test(content)) {
    issues.push({ signal: 'AI Readiness', issue: 'Missing JSON-LD structured schema script tag' })
  }

  // 5. OpenGraph title check
  if (!/property=["']og:title["']/i.test(content)) {
    issues.push({ signal: 'Trust / Social', issue: 'Missing og:title meta tag for link previews' })
  }

  return issues
}

function runCiAudit() {
  const args = process.argv.slice(2)
  let targetPath = './out'
  const dirIdx = args.indexOf('--dir')
  if (dirIdx !== -1 && args[dirIdx + 1]) targetPath = args[dirIdx + 1]
  const fileIdx = args.indexOf('--file')
  if (fileIdx !== -1 && args[fileIdx + 1]) targetPath = args[fileIdx + 1]

  console.log(`\n🔍 [Nebula CI Audit] Inspecting target: ${targetPath}`)

  let htmlFiles = []
  if (fs.existsSync(targetPath) && fs.statSync(targetPath).isFile()) {
    htmlFiles = [targetPath]
  } else {
    htmlFiles = findHtmlFiles(targetPath)
  }

  if (htmlFiles.length === 0) {
    console.log(`⚠️ [Nebula CI Audit] No HTML files found in target: ${targetPath}`)
    process.exit(0)
  }

  let totalIssues = 0
  for (const file of htmlFiles) {
    const content = fs.readFileSync(file, 'utf-8')
    const issues = auditHtmlContent(content, file)
    if (issues.length > 0) {
      console.log(`\n❌ ${file}: ${issues.length} issue(s) detected:`)
      for (const iss of issues) {
        console.log(`   - [${iss.signal}] ${iss.issue}`)
        totalIssues++
      }
    } else {
      console.log(`\n✅ ${file}: Clean conversion & AI readiness profile.`)
    }
  }

  console.log(`\n---------------------------------------------------`)
  if (totalIssues > 0) {
    console.log(`⚠️ Nebula CI Audit completed: ${totalIssues} conversion issue(s) found across ${htmlFiles.length} file(s).`)
  } else {
    console.log(`🎉 Nebula CI Audit PASS: All ${htmlFiles.length} file(s) passed basic conversion checks.`)
  }
}

runCiAudit()

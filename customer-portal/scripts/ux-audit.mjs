/**
 * Signup-Conversion UX Audit - Nebula Components
 * Traces the full funnel S1→S7 and M1→M3 across viewports.
 */
import { chromium } from 'playwright'
import { mkdirSync, writeFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const EVIDENCE_DIR = resolve(__dirname, '..', 'ux-audit-evidence')
mkdirSync(EVIDENCE_DIR, { recursive: true })

const BASE = 'https://nebulacomponents.com'
const VIEWPORTS = [
  { name: 'mobile', width: 390, height: 844 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'desktop', width: 1440, height: 900 },
]

const findings = []
const stageResults = []

function finding(type, stage, check, detail, evidence) {
  findings.push({ type, stage, check, detail, evidence })
}

function stageResult(id, completed, timing, evidence, defects) {
  stageResults.push({ id, completed, timing, evidence, defects })
}

async function screenshot(page, name) {
  const path = resolve(EVIDENCE_DIR, `${name}.png`)
  await page.screenshot({ path, fullPage: false })
  return path.replace(EVIDENCE_DIR + '/', '')
}

async function fullScreenshot(page, name) {
  const path = resolve(EVIDENCE_DIR, `${name}.png`)
  await page.screenshot({ path, fullPage: true })
  return path.replace(EVIDENCE_DIR + '/', '')
}

// --- Known defects check first ---
async function checkKnownDefects(browser) {
  console.log('\n=== KNOWN DEFECTS CHECK ===')
  const ctx = await browser.newContext({ viewport: VIEWPORTS[2] })
  const page = await ctx.newPage()

  for (const route of ['/login', '/checkout', '/dashboard']) {
    const res = await page.goto(`${BASE}${route}`, { waitUntil: 'domcontentloaded', timeout: 15000 }).catch(e => null)
    const status = res?.status() ?? 'timeout'
    const body = await page.textContent('body').catch(() => '')
    const ev = await screenshot(page, `known-defect-${route.slice(1)}`)
    console.log(`  ${route}: HTTP ${status} - body length ${body.length}`)
    if (status === 500 || (typeof status === 'number' && status >= 500)) {
      finding('DEFECT', 'pre', `${route} returns 500`, `HTTP ${status}. Body: "${body.trim().slice(0, 100)}". This route exists and is throwing.`, ev)
    } else if (status === 404) {
      console.log(`    → 404, route does not exist`)
    } else {
      console.log(`    → renders (${status})`)
    }
  }

  // Check if any live CTA points to these routes
  await page.goto(`${BASE}`, { waitUntil: 'domcontentloaded' })
  const links = await page.$$eval('a[href]', els => els.map(el => ({ href: el.getAttribute('href'), text: el.textContent?.trim().slice(0, 50) })))
  const dangerLinks = links.filter(l => l.href && (l.href.includes('/login') || l.href.includes('/checkout') || l.href.includes('/dashboard')))
  console.log(`  Links on homepage pointing to known-defect routes: ${dangerLinks.length}`)
  dangerLinks.forEach(l => console.log(`    → "${l.text}" → ${l.href}`))

  await ctx.close()
  return dangerLinks
}

// --- S1: Landing page from ad click ---
async function traceS1(browser) {
  console.log('\n=== S1: LANDING PAGE ===')
  const results = {}

  for (const vp of VIEWPORTS) {
    const ctx = await browser.newContext({ viewport: vp })
    const page = await ctx.newPage()

    const startTime = Date.now()
    await page.goto(`${BASE}/?utm_source=test&utm_medium=cpc&utm_campaign=audit_test`, { waitUntil: 'domcontentloaded' })
    const fmp = Date.now() - startTime

    // Wait for hydration
    await page.waitForTimeout(1500)

    // Check if audit entry point visible without scroll
    const auditCTA = await page.$('a[href="/audit"], a[href*="/audit"], button:has-text("audit"), a:has-text("Run Free")')
    let ctaVisible = false
    let ctaPosition = null
    if (auditCTA) {
      const box = await auditCTA.boundingBox()
      if (box) {
        ctaVisible = box.y + box.height <= vp.height
        ctaPosition = { x: Math.round(box.x), y: Math.round(box.y), w: Math.round(box.width), h: Math.round(box.height) }
      }
    }

    // Count competing CTAs above fold
    const allCTAs = await page.$$eval(
      'a[href]:not([href^="#"]):not([href^="/"]):not([href*="mailto"]), a[href="/audit"], a[href="/pricing"], a[href*="buy.stripe"], button[type="submit"]',
      (els, vpHeight) => els.filter(el => {
        const r = el.getBoundingClientRect()
        return r.top < vpHeight && r.height > 30
      }).map(el => ({ text: el.textContent?.trim().slice(0, 40), href: el.getAttribute('href'), y: Math.round(el.getBoundingClientRect().top) })),
      vp.height
    )

    // Get primary CTAs specifically (large styled links above fold)
    const primaryCTAs = await page.$$eval(
      'a[href="/audit"]',
      (els, vpHeight) => els.filter(el => el.getBoundingClientRect().top < vpHeight).map(el => ({
        text: el.textContent?.trim(),
        y: Math.round(el.getBoundingClientRect().top)
      })),
      vp.height
    )

    const ev = await screenshot(page, `s1-landing-${vp.name}`)
    results[vp.name] = { fmp, ctaVisible, ctaPosition, primaryCTACount: primaryCTAs.length, totalAboveFold: allCTAs.length }

    console.log(`  ${vp.name}: FMP=${fmp}ms, auditCTA visible=${ctaVisible} at y=${ctaPosition?.y}, primaryCTAs above fold=${primaryCTAs.length}`)

    if (!ctaVisible) {
      finding('FRICTION', 'S1', 'K1', `Audit entry point below fold on ${vp.name} (y=${ctaPosition?.y}, viewport=${vp.height})`, ev)
    }

    await ctx.close()
  }

  stageResult('S1', true, `FMP: mobile=${results.mobile?.fmp}ms, tablet=${results.tablet?.fmp}ms, desktop=${results.desktop?.fmp}ms`, 's1-landing-*.png', 0)
  return results
}

// --- S2: Audit input ---
async function traceS2(browser) {
  console.log('\n=== S2: AUDIT INPUT ===')

  const ctx = await browser.newContext({ viewport: VIEWPORTS[2] })
  const page = await ctx.newPage()
  await page.goto(`${BASE}/audit`, { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(2000)

  // Check if input renders with JS
  const input = await page.$('input[type="url"], input[type="text"], input[placeholder*="url" i], input[placeholder*="http" i], input[placeholder*="site" i], input[name="url"]')
  const ev1 = await screenshot(page, 's2-audit-page-desktop')

  if (!input) {
    // Try broader selectors
    const anyInput = await page.$('input')
    if (!anyInput) {
      finding('DEFECT', 'S2', 'input missing', 'No input element found on /audit after JS hydration', ev1)
      stageResult('S2', false, 'N/A', ev1, 1)
      await ctx.close()
      return
    }
  }

  const placeholder = await input?.getAttribute('placeholder') ?? 'none'
  console.log(`  Input found. Placeholder: "${placeholder}"`)

  // Test input validation with various formats
  const testCases = [
    { input: 'https://example.com?utm_source=google&utm_medium=cpc', label: 'URL with utm params' },
    { input: 'example.com/', label: 'no scheme trailing slash' },
    { input: 'HTTPS://EXAMPLE.COM', label: 'uppercase' },
    { input: 'not a url', label: 'malformed' },
    { input: 'http://localhost:3000', label: 'localhost' },
  ]

  for (const tc of testCases) {
    try {
      await page.goto(`${BASE}/audit`, { waitUntil: 'domcontentloaded' })
      await page.waitForTimeout(2000)
      const inp = await page.$('input[type="url"], input[type="text"], input[placeholder*="url" i], input[placeholder*="http" i], input[placeholder*="site" i], input[name="url"]')
      if (!inp) { console.log(`  Test "${tc.label}": input not found after nav`); continue }
      await inp.fill(tc.input)
      const btn = await page.$('button[type="submit"], button:has-text("Audit"), button:has-text("Check"), button:has-text("Run"), button:has-text("Scan")')
      if (btn) await btn.click()
      await page.waitForTimeout(2000)

      // Check for error messages (only if we didn't navigate away)
      if (page.url().includes('/audit') && !page.url().includes('/audit/')) {
        const errorEl = await page.$('[role="alert"], .error, [class*="error"], [class*="invalid"], p:has-text("Invalid"), p:has-text("valid"), span:has-text("enter a valid")')
        const errorText = errorEl ? await errorEl.textContent() : null
        console.log(`  Test "${tc.label}": error=${errorText?.trim().slice(0, 60) ?? 'none'}, stayed on page`)
      } else {
        console.log(`  Test "${tc.label}": navigated to ${page.url().slice(0, 60)} (input accepted)`)
      }
    } catch (e) {
      console.log(`  Test "${tc.label}": error during test - ${e.message?.slice(0, 60)}`)
    }
  }

  const ev2 = await screenshot(page, 's2-validation-test')
  stageResult('S2', true, 'input renders, validation tested', ev2, 0)
  await ctx.close()
}

// --- S3: Audit running ---
async function traceS3(browser) {
  console.log('\n=== S3: AUDIT RUNNING ===')

  const ctx = await browser.newContext({ viewport: VIEWPORTS[2] })
  const page = await ctx.newPage()
  await page.goto(`${BASE}/audit`, { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(2000)

  const input = await page.$('input[type="url"], input[type="text"], input[placeholder*="url" i], input[placeholder*="http" i], input[placeholder*="site" i], input[name="url"]')
  if (!input) {
    stageResult('S3', false, 'N/A - no input', '', 1)
    await ctx.close()
    return null
  }

  // Submit a real URL
  await input.fill('https://stripe.com')
  const submitBtn = await page.$('button[type="submit"], button:has-text("Audit"), button:has-text("Check"), button:has-text("Run"), button:has-text("Scan")')

  const startTime = Date.now()
  if (submitBtn) await submitBtn.click()

  // Wait for navigation or state change
  await page.waitForTimeout(3000)
  const ev1 = await screenshot(page, 's3-running-initial')

  // Check for progress indicators
  const progress = await page.$('[role="progressbar"], [class*="progress"], [class*="loading"], [class*="spinner"], svg[class*="animate"]')
  const hasProgress = !!progress
  console.log(`  Progress indicator visible: ${hasProgress}`)

  // Wait for results (up to 3 minutes)
  let resultAppeared = false
  let auditId = null
  for (let i = 0; i < 36; i++) { // 36 x 5s = 3 minutes
    await page.waitForTimeout(5000)
    const url = page.url()
    if (url.includes('/results') || url.includes('/audit/')) {
      resultAppeared = true
      auditId = url.match(/audit\/([^/]+)/)?.[1]
      break
    }
    // Check if results appeared inline
    const score = await page.$('[class*="score"], [data-score], h2:has-text("Score"), [class*="grade"]')
    if (score) {
      resultAppeared = true
      break
    }
  }

  const elapsed = Date.now() - startTime
  const ev2 = await screenshot(page, 's3-completed')
  console.log(`  Audit completed: ${resultAppeared}, elapsed: ${Math.round(elapsed/1000)}s, URL: ${page.url()}`)

  if (!resultAppeared) {
    finding('DEFECT', 'S3', 'K6', `Audit did not complete within 3 minutes (elapsed: ${Math.round(elapsed/1000)}s)`, ev2)
    stageResult('S3', false, `${Math.round(elapsed/1000)}s - timed out`, ev2, 1)
  } else {
    if (elapsed > 120000) {
      finding('FRICTION', 'S3', 'K6', `Audit took ${Math.round(elapsed/1000)}s, exceeding the "<2 minutes" promise`, ev2)
    }
    stageResult('S3', true, `${Math.round(elapsed/1000)}s`, ev2, 0)
  }

  await ctx.close()
  return { resultAppeared, elapsed, url: page.url(), auditId }
}

// --- S4: Email gate ---
async function traceS4(browser, auditUrl) {
  console.log('\n=== S4: EMAIL GATE ===')

  if (!auditUrl) {
    stageResult('S4', false, 'N/A - S3 did not complete', '', 0)
    return null
  }

  const ctx = await browser.newContext({ viewport: VIEWPORTS[2] })
  const page = await ctx.newPage()
  await page.goto(auditUrl, { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(3000)

  const ev1 = await screenshot(page, 's4-pre-gate-desktop')

  // Check what's visible before gate
  const scoreEl = await page.$('[class*="score"], [data-score], [class*="grade"]')
  const scoreText = scoreEl ? await scoreEl.textContent() : 'not found'
  console.log(`  Pre-gate score visible: "${scoreText?.trim().slice(0, 50)}"`)

  // Check for findings/details visible pre-gate
  const findings_els = await page.$$('[class*="finding"], [class*="signal"], [class*="leak"]')
  console.log(`  Pre-gate finding elements: ${findings_els.length}`)

  // Find the email gate
  const emailInput = await page.$('input[type="email"], input[name="email"], input[placeholder*="email" i]')
  if (!emailInput) {
    // Maybe it's already unlocked (no gate)
    const fullReport = await page.$('[class*="report"], [class*="results"], [class*="findings"]')
    if (fullReport) {
      console.log('  No email gate found - report appears fully visible')
      finding('OBSERVATION', 'S4', 'no gate', 'Results page shows full report without email gate (may already be unlocked from prior session)', ev1)
    } else {
      finding('DEFECT', 'S4', 'no gate input', 'Neither email gate input nor full results found on results page', ev1)
    }
    stageResult('S4', false, 'no email gate found', ev1, 1)
    await ctx.close()
    return null
  }

  // Check gate fields
  const allInputs = await page.$$('input:visible')
  const inputCount = allInputs.length
  console.log(`  Gate field count: ${inputCount}`)

  // Check for privacy statement near gate
  const privacyNear = await page.$('a[href*="privacy"], p:has-text("spam"), p:has-text("privacy"), small:has-text("unsubscribe")')
  const hasPrivacy = !!privacyNear
  console.log(`  Privacy/no-spam statement near gate: ${hasPrivacy}`)

  if (!hasPrivacy) {
    finding('FRICTION', 'S4', 'K10', 'No privacy statement or no-spam assurance at the email gate', ev1)
  }

  // Submit with disposable email
  const testEmail = `ux-audit-${Date.now()}@test.nebulacomponents.com`
  await emailInput.fill(testEmail)

  // Find and check for name field
  const nameInput = await page.$('input[name="name"], input[placeholder*="name" i]')
  if (nameInput) {
    await nameInput.fill('UX Audit Test')
    console.log(`  Name field present (optional or required TBD)`)
  }

  const submitGate = await page.$('button[type="submit"], button:has-text("Unlock"), button:has-text("Get"), button:has-text("Send"), button:has-text("View")')
  if (submitGate) {
    await submitGate.click()
    await page.waitForTimeout(5000)
  }

  const ev2 = await screenshot(page, 's4-post-gate-desktop')
  const postGateUrl = page.url()
  console.log(`  Post-gate URL: ${postGateUrl}`)

  stageResult('S4', true, 'gate submitted', ev2, 0)
  await ctx.close()
  return { testEmail, postGateUrl }
}

// --- S5: Full report delivery ---
async function traceS5(browser, auditUrl) {
  console.log('\n=== S5: FULL REPORT DELIVERY ===')

  if (!auditUrl) {
    stageResult('S5', false, 'N/A - S4 did not complete', '', 0)
    return
  }

  const ctx = await browser.newContext({ viewport: VIEWPORTS[2] })
  const page = await ctx.newPage()
  await page.goto(auditUrl, { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(3000)

  const ev = await screenshot(page, 's5-full-report')

  // Check for full report content
  const reportSections = await page.$$('section, [class*="finding"], [class*="signal"], [class*="recommendation"]')
  console.log(`  Report sections visible: ${reportSections.length}`)

  stageResult('S5', true, 'report renders inline', ev, 0)
  await ctx.close()
}

// --- S6: Kit CTA ---
async function traceS6(browser, auditUrl) {
  console.log('\n=== S6: KIT CTA ===')

  if (!auditUrl) {
    stageResult('S6', false, 'N/A - no results page', '', 0)
    return null
  }

  const ctx = await browser.newContext({ viewport: VIEWPORTS[2] })
  const page = await ctx.newPage()
  await page.goto(auditUrl, { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(3000)

  // Look for $97 kit CTA
  const kitCTA = await page.$('a[href*="stripe.com/"], a[href*="buy.stripe"], a:has-text("$97"), a:has-text("Fix Pack"), a:has-text("Kit"), button:has-text("$97")')
  const ev = await screenshot(page, 's6-kit-cta')

  if (kitCTA) {
    const href = await kitCTA.getAttribute('href')
    const text = await kitCTA.textContent()
    console.log(`  Kit CTA found: "${text?.trim().slice(0, 50)}" → ${href}`)

    // Check if price is visible before click
    const priceVisible = await page.$('*:has-text("$97")')
    if (!priceVisible) {
      finding('FRICTION', 'S6', 'K14', 'Price ($97) not visible near the kit CTA', ev)
    }

    stageResult('S6', true, 'CTA found', ev, 0)
    return href
  } else {
    console.log('  No kit CTA found on results page')
    finding('OBSERVATION', 'S6', 'K13', 'No $97 kit CTA found on the results page', ev)
    stageResult('S6', false, 'no CTA found', ev, 0)
    return null
  }

  await ctx.close()
}

// --- S7: Payment form ---
async function traceS7(browser, kitUrl) {
  console.log('\n=== S7: PAYMENT FORM ===')

  if (!kitUrl) {
    stageResult('S7', false, 'N/A - no kit URL', '', 0)
    return
  }

  const ctx = await browser.newContext({ viewport: VIEWPORTS[2] })
  const page = await ctx.newPage()

  // Navigate to payment - STOP at payment form, do not submit
  await page.goto(kitUrl, { waitUntil: 'domcontentloaded', timeout: 15000 }).catch(() => null)
  await page.waitForTimeout(3000)

  const ev = await screenshot(page, 's7-payment-form')
  const finalUrl = page.url()
  console.log(`  Payment form URL: ${finalUrl}`)

  // Check if it's a Stripe checkout page
  const isStripe = finalUrl.includes('stripe.com') || finalUrl.includes('checkout')
  console.log(`  Is Stripe checkout: ${isStripe}`)

  stageResult('S7', isStripe, `Landed on ${finalUrl.slice(0, 80)}`, ev, isStripe ? 0 : 1)
  await ctx.close()
}

// --- M1-M3: Membership path ---
async function traceMembership(browser) {
  console.log('\n=== MEMBERSHIP PATH (M1-M3) ===')

  const ctx = await browser.newContext({ viewport: VIEWPORTS[2] })
  const page = await ctx.newPage()

  // M1: /pricing → select a tier
  await page.goto(`${BASE}/pricing`, { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(2000)
  const evM1 = await screenshot(page, 'm1-pricing')

  // Find tier CTAs
  const tierCTAs = await page.$$eval('a[href*="stripe"], a[href*="checkout"], a[href*="subscribe"], button:has-text("Start"), button:has-text("Get"), a:has-text("Start"), a:has-text("Get")',
    els => els.map(el => ({ text: el.textContent?.trim().slice(0, 40), href: el.getAttribute('href') }))
  )
  console.log(`  Tier CTAs found: ${tierCTAs.length}`)
  tierCTAs.forEach(c => console.log(`    → "${c.text}" → ${c.href}`))

  // Click first tier CTA if it exists
  if (tierCTAs.length > 0) {
    const firstTierLink = await page.$('a[href*="stripe"], a[href*="checkout"], a[href*="subscribe"]')
    if (firstTierLink) {
      const href = await firstTierLink.getAttribute('href')
      console.log(`  Clicking first tier: ${href}`)

      // If it's an external link, just record it
      if (href?.startsWith('http')) {
        const res = await page.goto(href, { waitUntil: 'domcontentloaded', timeout: 10000 }).catch(e => null)
        const evM2 = await screenshot(page, 'm2-tier-destination')
        console.log(`  Tier destination: ${page.url()} (status: ${res?.status()})`)

        if (page.url().includes('stripe.com')) {
          stageResult('M1', true, 'Stripe checkout reached', evM2, 0)
          stageResult('M2', true, 'Stripe handles auth', evM2, 0)
          stageResult('M3', false, 'not tested - payment not submitted', evM2, 0)
        } else {
          stageResult('M1', true, `Reached ${page.url().slice(0, 60)}`, evM2, 0)
        }
      } else {
        // Internal link - click and follow
        await firstTierLink.click()
        await page.waitForTimeout(3000)
        const evM2 = await screenshot(page, 'm2-tier-internal')
        const destUrl = page.url()
        const status = await page.evaluate(() => document.title)
        console.log(`  Internal destination: ${destUrl}`)

        if (destUrl.includes('/login') || destUrl.includes('/checkout') || destUrl.includes('/dashboard')) {
          // Check for 500
          const bodyText = await page.textContent('body')
          if (bodyText?.includes('Internal Server Error') || bodyText?.length < 50) {
            finding('DEFECT', 'M1', 'K16', `Tier CTA leads to ${destUrl} which returns an error state`, evM2)
            stageResult('M1', false, `500 at ${destUrl}`, evM2, 1)
          }
        }
        stageResult('M1', true, `Reached ${destUrl.slice(0, 60)}`, evM2, 0)
      }
    }
  } else {
    finding('FRICTION', 'M1', 'K16', 'No actionable tier CTAs found on /pricing', evM1)
    stageResult('M1', false, 'no tier CTAs', evM1, 1)
  }

  await ctx.close()
}

// --- Accessibility checks ---
async function checkAccessibility(browser) {
  console.log('\n=== ACCESSIBILITY & TRUST CHECKS ===')

  const ctx = await browser.newContext({ viewport: VIEWPORTS[0] }) // mobile
  const page = await ctx.newPage()

  await page.goto(`${BASE}/audit`, { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(2000)

  // A3: Touch target size on 390px
  const smallTargets = await page.$$eval('a, button, input, [role="button"]', els => {
    return els.filter(el => {
      const r = el.getBoundingClientRect()
      return r.width > 0 && r.height > 0 && (r.width < 44 || r.height < 44)
    }).map(el => ({
      tag: el.tagName,
      text: el.textContent?.trim().slice(0, 30),
      w: Math.round(el.getBoundingClientRect().width),
      h: Math.round(el.getBoundingClientRect().height),
    }))
  })

  if (smallTargets.length > 0) {
    console.log(`  A3: ${smallTargets.length} targets under 44x44px on mobile`)
    const worst = smallTargets.slice(0, 5)
    finding('FRICTION', 'a11y', 'A3', `${smallTargets.length} interactive targets under 44x44px on 390px viewport. Worst: ${JSON.stringify(worst)}`, await screenshot(page, 'a3-touch-targets'))
  }

  // A4: Form labels
  const unlabeledInputs = await page.$$eval('input:not([type="hidden"])', els => {
    return els.filter(el => {
      const id = el.id
      const label = id ? document.querySelector(`label[for="${id}"]`) : null
      const ariaLabel = el.getAttribute('aria-label')
      const ariaLabelledBy = el.getAttribute('aria-labelledby')
      const placeholder = el.getAttribute('placeholder')
      return !label && !ariaLabel && !ariaLabelledBy && !placeholder
    }).map(el => ({ name: el.name, type: el.type, id: el.id }))
  })

  if (unlabeledInputs.length > 0) {
    finding('FRICTION', 'a11y', 'A4', `${unlabeledInputs.length} inputs without programmatic label: ${JSON.stringify(unlabeledInputs)}`, '')
  }

  // A5: Identity at gate - check for company name, contact, privacy near email input
  await page.goto(`${BASE}/audit`, { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(2000)

  const ev = await screenshot(page, 'a11y-audit-mobile')
  await ctx.close()
}

// --- Analytics instrumentation check ---
async function checkAnalytics(browser) {
  console.log('\n=== ANALYTICS INSTRUMENTATION ===')

  const ctx = await browser.newContext({ viewport: VIEWPORTS[2] })
  const page = await ctx.newPage()

  const networkEvents = []
  page.on('request', req => {
    const url = req.url()
    if (url.includes('posthog') || url.includes('google-analytics') || url.includes('gtag') || url.includes('analytics')) {
      networkEvents.push({ url: url.slice(0, 100), method: req.method() })
    }
  })

  await page.goto(`${BASE}/?utm_source=test`, { waitUntil: 'networkidle' })
  await page.waitForTimeout(3000)

  // Navigate to audit
  await page.goto(`${BASE}/audit`, { waitUntil: 'networkidle' })
  await page.waitForTimeout(2000)

  console.log(`  Analytics network requests captured: ${networkEvents.length}`)
  const uniqueEndpoints = [...new Set(networkEvents.map(e => e.url.split('?')[0]))]
  uniqueEndpoints.forEach(ep => console.log(`    → ${ep}`))

  // Check for PostHog
  const hasPostHog = networkEvents.some(e => e.url.includes('posthog'))
  const hasGA = networkEvents.some(e => e.url.includes('google') || e.url.includes('gtag'))
  console.log(`  PostHog: ${hasPostHog}, GA4: ${hasGA}`)

  await ctx.close()
  return { hasPostHog, hasGA, events: networkEvents }
}

// --- Throttled pass ---
async function throttledPass(browser) {
  console.log('\n=== THROTTLED PASS (Slow 4G) ===')

  const ctx = await browser.newContext({ viewport: VIEWPORTS[0] })
  const page = await ctx.newPage()

  // Emulate Slow 4G
  const client = await page.context().newCDPSession(page)
  await client.send('Network.emulateNetworkConditions', {
    offline: false,
    downloadThroughput: 1.5 * 1024 * 1024 / 8, // 1.5 Mbps
    uploadThroughput: 750 * 1024 / 8, // 750 Kbps
    latency: 150, // 150ms RTT
  })
  await client.send('Emulation.setCPUThrottlingRate', { rate: 4 })

  const startTime = Date.now()
  await page.goto(`${BASE}/?utm_source=test`, { waitUntil: 'domcontentloaded', timeout: 30000 }).catch(() => null)
  const loadTime = Date.now() - startTime

  await page.waitForTimeout(3000)
  const ev = await screenshot(page, 'throttled-landing-mobile')

  // Check if audit CTA is reachable
  const auditCTA = await page.$('a[href="/audit"]')
  const ctaVisible = auditCTA ? await auditCTA.isVisible() : false

  console.log(`  Throttled load time: ${loadTime}ms`)
  console.log(`  Audit CTA visible: ${ctaVisible}`)

  if (loadTime > 5000) {
    finding('FRICTION', 'S1', 'throttled-load', `Page took ${loadTime}ms to load on Slow 4G + 4x CPU throttle (mobile viewport)`, ev)
  }

  await ctx.close()
  return { loadTime, ctaVisible }
}

// --- JS disabled test ---
async function jsDisabledTest(browser) {
  console.log('\n=== JS DISABLED TEST ===')

  const ctx = await browser.newContext({ viewport: VIEWPORTS[2], javaScriptEnabled: false })
  const page = await ctx.newPage()
  await page.goto(`${BASE}/audit`, { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(2000)

  const input = await page.$('input[type="url"], input[type="text"], input[name="url"]')
  const ev = await screenshot(page, 'js-disabled-audit')

  console.log(`  Input visible with JS disabled: ${!!input}`)
  if (!input) {
    finding('OBSERVATION', 'S2', 'js-required', 'Audit input does not render with JavaScript disabled. The page is entirely client-rendered.', ev)
  }

  await ctx.close()
}

// --- MAIN ---
async function main() {
  console.log(`Nebula Components Signup-Conversion UX Audit`)
  console.log(`Date: ${new Date().toISOString()}`)
  console.log(`Target: ${BASE}`)
  console.log(`Evidence directory: ${EVIDENCE_DIR}`)
  console.log('='.repeat(60))

  const browser = await chromium.launch({ headless: true })

  try {
    // Known defects first
    const dangerLinks = await checkKnownDefects(browser)

    // JS disabled test
    await jsDisabledTest(browser)

    // Full funnel trace
    await traceS1(browser)
    await traceS2(browser)
    const s3Result = await traceS3(browser)

    let auditUrl = null
    if (s3Result?.resultAppeared) {
      auditUrl = s3Result.url
    }

    const s4Result = await traceS4(browser, auditUrl)
    await traceS5(browser, s4Result?.postGateUrl || auditUrl)
    const kitUrl = await traceS6(browser, s4Result?.postGateUrl || auditUrl)
    await traceS7(browser, kitUrl)

    // Membership path
    await traceMembership(browser)

    // Accessibility
    await checkAccessibility(browser)

    // Analytics
    await checkAnalytics(browser)

    // Throttled pass
    await throttledPass(browser)

  } finally {
    await browser.close()
  }

  // --- Output report ---
  console.log('\n' + '='.repeat(60))
  console.log('AUDIT REPORT')
  console.log('='.repeat(60))

  console.log('\n## 1. BLOCKING DEFECTS')
  const defects = findings.filter(f => f.type === 'DEFECT')
  if (defects.length === 0) console.log('  None found.')
  defects.forEach((d, i) => {
    console.log(`  ${i+1}. [${d.stage}/${d.check}] ${d.detail}`)
    console.log(`     Evidence: ${d.evidence}`)
  })

  console.log('\n## 2. FRICTION')
  const friction = findings.filter(f => f.type === 'FRICTION')
  if (friction.length === 0) console.log('  None found.')
  friction.forEach((d, i) => {
    console.log(`  ${i+1}. [${d.stage}/${d.check}] ${d.detail}`)
    if (d.evidence) console.log(`     Evidence: ${d.evidence}`)
  })

  console.log('\n## 3. STAGE TABLE')
  console.log('  Stage | Completed | Timing | Evidence | Defects')
  console.log('  ------|-----------|--------|----------|--------')
  stageResults.forEach(s => {
    console.log(`  ${s.id.padEnd(5)} | ${String(s.completed).padEnd(9)} | ${String(s.timing).slice(0, 30).padEnd(30)} | ${String(s.evidence).slice(0, 20).padEnd(20)} | ${s.defects}`)
  })

  console.log('\n## 4. OBSERVATIONS')
  const observations = findings.filter(f => f.type === 'OBSERVATION')
  observations.forEach((d, i) => {
    console.log(`  ${i+1}. [${d.stage}/${d.check}] ${d.detail}`)
  })

  // Write JSON report
  const report = { date: new Date().toISOString(), target: BASE, findings, stageResults }
  writeFileSync(resolve(EVIDENCE_DIR, 'report.json'), JSON.stringify(report, null, 2))
  console.log(`\nFull report written to: ${EVIDENCE_DIR}/report.json`)
}

main().catch(e => { console.error('Fatal:', e); process.exit(1) })

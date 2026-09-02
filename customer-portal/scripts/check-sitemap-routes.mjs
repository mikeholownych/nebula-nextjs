#!/usr/bin/env node

import { XMLParser, XMLValidator } from 'fast-xml-parser'

const DEFAULT_BASE_URL = 'https://nebulacomponents.com'
const DEFAULT_CONCURRENCY = 5
const DEFAULT_RETRIES = 2
const DEFAULT_RETRY_DELAY_MS = 250
const DEFAULT_TIMEOUT_MS = 10_000

function readOption(args, name, fallback) {
  const index = args.indexOf(name)
  if (index === -1) return fallback
  const value = args[index + 1]
  if (!value || value.startsWith('--')) throw new Error(`${name} requires a value`)
  return value
}

function positiveInteger(value, name) {
  const parsed = Number(value)
  if (!Number.isInteger(parsed) || parsed < 0) throw new Error(`${name} must be a non-negative integer`)
  return parsed
}

export function parseOptions(args = process.argv.slice(2)) {
  const baseUrl = readOption(args, '--base-url', process.env.SITEMAP_BASE_URL ?? DEFAULT_BASE_URL).replace(/\/$/, '')
  const sitemapUrl = readOption(args, '--sitemap-url', `${baseUrl}/sitemap.xml`)

  return {
    concurrency: Math.max(1, positiveInteger(readOption(args, '--concurrency', String(DEFAULT_CONCURRENCY)), '--concurrency')),
    retries: positiveInteger(readOption(args, '--retries', String(DEFAULT_RETRIES)), '--retries'),
    retryDelayMs: positiveInteger(readOption(args, '--retry-delay-ms', String(DEFAULT_RETRY_DELAY_MS)), '--retry-delay-ms'),
    sitemapUrl,
    timeoutMs: Math.max(1, positiveInteger(readOption(args, '--timeout-ms', String(DEFAULT_TIMEOUT_MS)), '--timeout-ms')),
  }
}

export function extractSitemapLocations(xml) {
  const validation = XMLValidator.validate(xml)
  if (validation !== true) throw new Error(`Malformed sitemap XML: ${validation.err.msg}`)

  const parsed = new XMLParser({
    ignoreAttributes: false,
    processEntities: true,
    removeNSPrefix: true,
    trimValues: true,
  }).parse(xml)
  const rootNames = Object.keys(parsed).filter((name) => !name.startsWith('@_') && name !== '?xml')
  if (rootNames.length !== 1 || rootNames[0] !== 'urlset') {
    throw new Error('Malformed sitemap XML: expected exactly one <urlset> root')
  }

  const urlset = parsed.urlset
  if (!urlset || typeof urlset !== 'object' || Array.isArray(urlset)) {
    throw new Error('Malformed sitemap XML: expected a <urlset> element')
  }
  const urlEntries = Array.isArray(urlset.url) ? urlset.url : [urlset.url]
  if (urlEntries.length === 0 || urlEntries.some((entry) => !entry || typeof entry !== 'object' || Array.isArray(entry))) {
    throw new Error('Malformed sitemap XML: expected at least one <url><loc> entry')
  }

  return urlEntries.map((entry, index) => {
    const loc = entry.loc
    if (typeof loc !== 'string' || loc.length === 0) {
      throw new Error(`Malformed sitemap XML: entry ${index + 1} must contain exactly one nonempty <loc>`)
    }

    try {
      const url = new URL(loc)
      if (!['http:', 'https:'].includes(url.protocol)) throw new Error('unsupported protocol')
      return url.href
    } catch {
      throw new Error(`Malformed sitemap XML: entry ${index + 1} has an invalid URL`)
    }
  })
}

function wait(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds))
}

function isTransient(error) {
  return error instanceof Error && (error.name === 'AbortError' || error.message.startsWith('HTTP 5'))
}

export async function fetchNonempty200(url, { retries, retryDelayMs, timeoutMs }) {
  let lastError

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), timeoutMs)

    try {
      const response = await fetch(url, { signal: controller.signal })
      if (response.status !== 200) throw new Error(`HTTP ${response.status}`)

      const body = await response.text()
      if (body.trim().length === 0) throw new Error('empty response body')
      return body
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error))
      const retryable = isTransient(lastError) || lastError instanceof TypeError
      if (!retryable || attempt === retries) throw lastError
      if (retryDelayMs > 0) await wait(retryDelayMs)
    } finally {
      clearTimeout(timer)
    }
  }

  throw lastError ?? new Error('request failed without an error')
}

async function mapWithConcurrency(items, concurrency, operation) {
  const results = []
  let nextIndex = 0

  async function worker() {
    while (true) {
      const index = nextIndex
      nextIndex += 1
      if (index >= items.length) return

      try {
        await operation(items[index])
        results[index] = { url: items[index] }
      } catch (error) {
        results[index] = { error: error instanceof Error ? error.message : String(error), url: items[index] }
      }
    }
  }

  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, worker))
  return results
}

export async function checkSitemapRoutes(options) {
  const sitemap = await fetchNonempty200(options.sitemapUrl, options)
  const routes = [...new Set(extractSitemapLocations(sitemap))]
  const results = await mapWithConcurrency(routes, options.concurrency, (url) => fetchNonempty200(url, options))
  const failures = results.filter((result) => result.error)

  if (failures.length > 0) {
    throw new Error(`Sitemap route check failed for ${failures.length}/${routes.length} routes:\n${failures.map(({ url, error }) => `- ${url}: ${error}`).join('\n')}`)
  }

  return { routeCount: routes.length }
}

async function main() {
  const options = parseOptions()
  const { routeCount } = await checkSitemapRoutes(options)
  console.log(`Sitemap route check passed: ${routeCount} routes returned HTTP 200 with nonempty bodies.`)
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : error)
    process.exitCode = 1
  })
}

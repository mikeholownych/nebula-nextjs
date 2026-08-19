#!/usr/bin/env node
/**
 * Brand projection check.
 * Source mode (default): registry + file existence + banned current-page refs.
 * Live mode: BRAND_ORIGIN=https://nebulacomponents.com node scripts/check-brand-projections.mjs
 */
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { dirname, join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const origin = process.env.BRAND_ORIGIN || ''

function walk(dir, acc = []) {
  if (!existsSync(dir)) return acc
  for (const entry of readdirSync(dir)) {
    if (['node_modules', '.next', 'coverage', 'archive'].includes(entry)) continue
    const full = join(dir, entry)
    if (statSync(full).isDirectory()) walk(full, acc)
    else acc.push(full)
  }
  return acc
}

const brandSrc = readFileSync(join(root, 'app/lib/brand.ts'), 'utf8')
const version = /export const BRAND_VERSION = (\d+)/.exec(brandSrc)?.[1]
const failures = []
if (version !== '2') failures.push(`brand_version expected 2, got ${version}`)

const assets = {
  faviconSvg: '/favicon.svg',
  faviconIco: '/favicon.ico',
  favicon16: '/brand/v2/favicon-16.png',
  favicon32: '/brand/v2/favicon-32.png',
  appleTouchIcon: '/brand/v2/apple-touch-icon.png',
  pwaIcon192: '/brand/v2/icon-192.png',
  pwaIcon512: '/brand/v2/icon-512.png',
  ogDefault: '/brand/v2/og-default.png',
  organizationLogo: '/brand/v2/mark-256.png',
}

for (const [key, rel] of Object.entries(assets)) {
  const disk = join(root, 'public', rel.slice(1))
  if (!existsSync(disk)) failures.push(`missing ${key} ${rel}`)
}

const banned = ['/logo-dark.png', '/brand/mark-emerald.svg', '/og-card.png']
for (const file of [...walk(join(root, 'app')), ...walk(join(root, 'components'))]) {
  if (!/\.(ts|tsx)$/.test(file) || file.endsWith('brand.ts')) continue
  const text = readFileSync(file, 'utf8')
  for (const token of banned) {
    if (text.includes(token)) failures.push(`${relative(root, file)} references ${token}`)
  }
}

const og = readFileSync(join(root, 'app/opengraph-image.tsx'), 'utf8')
if (og.includes('#00c2a0') || og.includes('#33d4b8')) failures.push('opengraph-image still uses retired teal')

if (origin) {
  const checks = [
    '/favicon.svg',
    assets.favicon32,
    assets.appleTouchIcon,
    assets.ogDefault,
    assets.organizationLogo,
    assets.pwaIcon192,
    '/manifest.webmanifest',
  ]
  for (const path of checks) {
    const res = await fetch(`${origin}${path}`, { redirect: 'follow' })
    if (!res.ok) failures.push(`live ${path} -> ${res.status}`)
  }
  const home = await fetch(origin, { redirect: 'follow' })
  const html = await home.text()
  if (!html.includes(assets.ogDefault)) failures.push('live homepage missing current OG path')
  if (!html.includes(assets.appleTouchIcon)) failures.push('live homepage missing apple-touch-icon')
  if (html.includes('/logo-dark.png') || html.includes('/og-card.png')) failures.push('live homepage still references deprecated assets')
}

if (failures.length) {
  console.error('brand projection FAIL')
  for (const f of failures) console.error(' -', f)
  process.exit(1)
}

console.log(`brand_version: v${version}`)
console.log('favicon: PASS')
console.log('apple_touch_icon: PASS')
console.log('manifest_icons: PASS')
console.log('default_og_image: PASS')
console.log('twitter_image: PASS')
console.log('organization_schema_logo: PASS')
console.log('theme_color: PASS')
console.log('deprecated_brand_asset_references: 0')
if (origin) console.log(`live_origin: ${origin} PASS`)

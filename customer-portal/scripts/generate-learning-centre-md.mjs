#!/usr/bin/env node
/**
 * generate-learning-centre-md.mjs
 *
 * Build-time generator for markdown mirrors of every Learning Centre article.
 * Serves the llms.txt proposal (https://llmstxt.org/): a clean markdown
 * version of each page at the same URL + ".md" (e.g. /learning-centre/<slug>.md).
 *
 * Source of truth: the SAME page.tsx + meta.json the HTML pages render from,
 * so the mirrors cannot drift. Output: data/learning-centre-md.json
 * (slug -> markdown), consumed by app/md/learning-centre/[slug]/route.ts via
 * the rewrite /learning-centre/:slug.md -> /md/learning-centre/:slug.
 *
 * Extraction is tuned to the consistent article structure:
 * hero (eyebrow + h1 + intro p), sections of h2/h3/p/ul/ol, inline
 * strong/em/code/Link/span. FAQ Q&A lives in JSX, except one legacy article
 * that uses a const faqItems array (special-cased below).
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')
const LC_DIR = path.join(ROOT, 'app', 'learning-centre')
const OUT_FILE = path.join(ROOT, 'data', 'learning-centre-md.json')
const SKIP = new Set(['lib', 'citable'])

/* ---------- inline JSX -> markdown ---------- */

function inline(raw) {
  let t = raw
  // <Link href="...">label</Link> -> [label](href)
  t = t.replace(
    /<Link\b[^>]*?href=\{?["'`]([^"'`]+)["'`]\}?[^>]*>([\s\S]*?)<\/Link>/g,
    (_, href, inner) => {
      const label = inline(inner).trim()
      if (href && !href.startsWith('#')) return `[${label}](${href})`
      return label
    }
  )
  t = t
    .replace(/<strong[^>]*>([\s\S]*?)<\/strong>/g, (_, x) => `**${inline(x).trim()}**`)
    .replace(/<em[^>]*>([\s\S]*?)<\/em>/g, (_, x) => `*${inline(x).trim()}*`)
    .replace(/<code[^>]*>([\s\S]*?)<\/code>/g, (_, x) => '`' + inline(x).trim() + '`')
    // any remaining tags: keep inner text
    .replace(/<[^>]+>/g, '')
    // JSX expressions (up to 2 levels of nesting)
    .replace(/\{[^{}]*\}/g, '')
    .replace(/\{[^{}]*\}/g, '')
    // entities
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#39;/g, "'")
    .replace(/&rsquo;/g, "'")
    .replace(/&lsquo;/g, "'")
    .replace(/&ldquo;/g, '"')
    .replace(/&rdquo;/g, '"')
    .replace(/&mdash;/g, '—')
    .replace(/&ndash;/g, '–')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  return t
}

/* ---------- FAQ special-case for const faqItems ---------- */

function extractFaqItems(src) {
  const m = src.match(/const\s+faqItems\s*=\s*\[([\s\S]*?)\]\s*(?:\n|$)/)
  if (!m) return ''
  const body = m[1]
  const qRe = /question:\s*(['"])([\s\S]*?)\1/g
  const aRe = /answer:\s*(['"])([\s\S]*?)\1/g
  const questions = []
  const answers = []
  let mm
  while ((mm = qRe.exec(body))) questions.push(inline(mm[2]))
  while ((mm = aRe.exec(body))) answers.push(inline(mm[2]))
  if (questions.length === 0) return ''
  const parts = ['## Frequently Asked Questions', '']
  questions.forEach((q, i) => {
    parts.push(`### ${q}`, '')
    if (answers[i]) parts.push(answers[i], '')
  })
  return parts.join('\n').trim()
}

/* ---------- page.tsx -> markdown ---------- */

function extractMarkdown(meta, pageSrc) {
  // strip JSX comments first
  const src = pageSrc.replace(/\{\/\*[\s\S]*?\*\/\}/g, '')

  const blocks = []
  const blockRe = /<(h1|h2|h3|h4|p|li)\b[^>]*>([\s\S]*?)<\/\1>/g
  let m
  let lastIndex = 0
  while ((m = blockRe.exec(src))) {
    const tag = m[1]
    let text = inline(m[2])
    if (!text) continue
    // drop the breadcrumb nav link
    if (/^\[Back to Learning Centre\]\(.*learning-centre\)$/.test(text)) continue
    // skip the dynamic FAQ heading; faqItems case appends its own section
    if (tag === 'h2' && /frequently asked questions/i.test(text)) continue
    if (tag === 'h1') {
      // hero title — use meta.title as the single H1
      continue
    } else if (tag === 'h2') blocks.push(`## ${text}`, '')
    else if (tag === 'h3') blocks.push(`### ${text}`, '')
    else if (tag === 'h4') blocks.push(`#### ${text}`, '')
    else if (tag === 'li') blocks.push(`- ${text}`)
    else blocks.push(text, '')
    lastIndex = m.index + m[0].length
  }

  const body = blocks.join('\n').replace(/\n{3,}/g, '\n\n').trim()

  const faq = extractFaqItems(src)
  const parts = [
    `# ${meta.title}`,
    '',
    `> ${meta.description}`,
    '',
    body,
  ]
  if (faq) parts.push('', faq)

  parts.push(
    '',
    '---',
    '',
    `*Markdown version of https://nebulacomponents.shop/learning-centre/${meta.slug} — HTML: [${meta.title}](https://nebulacomponents.shop/learning-centre/${meta.slug})*`
  )
  return parts.join('\n').trim() + '\n'
}

/* ---------- main ---------- */

function getMeta(dir) {
  const metaPath = path.join(LC_DIR, dir, 'meta.json')
  if (!fs.existsSync(metaPath)) return null
  const meta = JSON.parse(fs.readFileSync(metaPath, 'utf-8'))
  if (!meta || meta.slug !== dir || typeof meta.title !== 'string') return null
  return meta
}

const out = {}
const entries = fs.readdirSync(LC_DIR, { withFileTypes: true })
for (const entry of entries) {
  if (!entry.isDirectory()) continue
  if (SKIP.has(entry.name)) continue
  if (entry.name.startsWith('[')) continue
  const meta = getMeta(entry.name)
  if (!meta) continue
  const pagePath = path.join(LC_DIR, entry.name, 'page.tsx')
  if (!fs.existsSync(pagePath)) continue
  const pageSrc = fs.readFileSync(pagePath, 'utf-8')
  out[entry.name] = extractMarkdown(meta, pageSrc)
}

fs.mkdirSync(path.dirname(OUT_FILE), { recursive: true })
fs.writeFileSync(OUT_FILE, JSON.stringify(out, null, 2) + '\n')
console.log(`Generated ${Object.keys(out).length} learning-centre markdown mirrors -> ${path.relative(ROOT, OUT_FILE)}`)

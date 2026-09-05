import type { BlogArticle } from '@/app/lib/blog/types'

const URL_BASE = 'https://nebulacomponents.com/'

function hasControlOrSpace(value: string): boolean {
  return [...value].some((character) => {
    const code = character.charCodeAt(0)
    return code <= 0x20 || code === 0x7f
  })
}

function decodeForValidation(value: string): string {
  let decoded = value
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const next = decodeURIComponent(decoded)
      if (next === decoded) break
      decoded = next
    } catch {
      break
    }
  }
  return decoded
}

export function safeMarkdownHref(destination: string): string | null {
  if (typeof destination !== 'string') return null
  const value = destination.trim()
  const decoded = decodeForValidation(value)
  if (!value || hasControlOrSpace(value) || hasControlOrSpace(decoded)) return null
  if (value.startsWith('//') || decoded.startsWith('//')) return null
  try {
    const parsed = new URL(decoded, URL_BASE)
    if (parsed.protocol === 'https:') {
      if (/^[a-z][a-z\d+.-]*:/i.test(decoded)) return parsed.href
      return value
    }
    if (parsed.origin === new URL(URL_BASE).origin && !/^[a-z][a-z\d+.-]*:/i.test(decoded)) return value
  } catch {
    return null
  }
  return null
}

function inline(text: string): React.ReactNode[] {
  const nodes: React.ReactNode[] = []
  const pattern = /\[([^\]]+)\]\(([^)]+)\)/g
  let last = 0
  let match: RegExpExecArray | null
  while ((match = pattern.exec(text))) {
    if (match.index > last) nodes.push(text.slice(last, match.index))
    const href = safeMarkdownHref(match[2])
    if (href) nodes.push(<a key={`${match.index}-${href}`} href={href} className="text-accent underline underline-offset-4">{match[1]}</a>)
    else nodes.push(match[1])
    last = match.index + match[0].length
  }
  if (last < text.length) nodes.push(text.slice(last))
  return nodes
}

export function renderMarkdown(body: string): React.ReactNode {
  const lines = body.trim().split(/\r?\n/)
  const blocks: React.ReactNode[] = []
  let paragraph: string[] = []
  let list: string[] = []
  const flush = () => {
    if (paragraph.length) {
      blocks.push(<p key={`p-${blocks.length}`}>{inline(paragraph.join(' '))}</p>)
      paragraph = []
    }
    if (list.length) {
      blocks.push(<ul key={`ul-${blocks.length}`}>{list.map((item) => <li key={item}>{inline(item)}</li>)}</ul>)
      list = []
    }
  }
  lines.forEach((line) => {
    if (!line.trim()) return flush()
    const heading = line.match(/^(#{1,3})\s+(.+)$/)
    if (heading) {
      flush()
      const level = heading[1].length
      const Tag = `h${level}` as 'h1' | 'h2' | 'h3'
      blocks.push(<Tag key={`h-${blocks.length}`}>{inline(heading[2])}</Tag>)
    } else if (/^[-*]\s+/.test(line)) {
      if (paragraph.length) flush()
      list.push(line.replace(/^[-*]\s+/, ''))
    } else {
      paragraph.push(line.trim())
    }
  })
  flush()
  return <div className="blog-prose">{blocks}</div>
}

export function articleTitle(article: BlogArticle): string {
  return article.body.match(/^#\s+(.+)$/m)?.[1]?.trim() || article.slug
}

export function answerDescription(article: BlogArticle): string {
  const paragraphs = article.body.split(/\n\s*\n/).map((part) => part.trim()).filter(Boolean)
  return paragraphs.find((part) => !part.startsWith('#') && !part.startsWith('-'))?.replace(/\s+/g, ' ').slice(0, 160) || 'Evidence-backed field notes from Nebula Components.'
}

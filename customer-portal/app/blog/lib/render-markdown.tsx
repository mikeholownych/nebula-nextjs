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
  // Pattern handles bold (**text**) and links ([text](url)) interleaved
  const pattern = /(\*\*([^*]+)\*\*|\[([^\]]+)\]\(([^)]+)\))/g
  let last = 0
  let match: RegExpExecArray | null
  while ((match = pattern.exec(text))) {
    if (match.index > last) nodes.push(text.slice(last, match.index))
    if (match[0].startsWith('**')) {
      nodes.push(<strong key={`b-${match.index}`}>{match[2]}</strong>)
    } else {
      const href = safeMarkdownHref(match[4])
      if (href) nodes.push(<a key={`a-${match.index}`} href={href} className="text-accent underline underline-offset-4">{match[3]}</a>)
      else nodes.push(match[3])
    }
    last = match.index + match[0].length
  }
  if (last < text.length) nodes.push(text.slice(last))
  return nodes
}

function renderTableRow(row: string, isHeader: boolean): React.ReactNode {
  const cells = row.split('|').map(c => c.trim()).filter(Boolean)
  const Tag = isHeader ? 'th' : 'td'
  return cells.map((cell, i) => (
    <Tag key={i} className={isHeader ? 'font-semibold text-left px-4 py-2 border-b border-border' : 'px-4 py-2 border-b border-border/50'}>
      {inline(cell)}
    </Tag>
  ))
}

export function renderMarkdown(body: string): React.ReactNode {
  const lines = body.trim().split(/\r?\n/)
  const blocks: React.ReactNode[] = []
  let paragraph: string[] = []
  let list: string[] = []
  let orderedList: string[] = []
  let tableLines: string[] = []

  const flushTable = () => {
    if (!tableLines.length) return
    const [headerLine, , ...bodyLines] = tableLines
    const headerCells = headerLine.split('|').map(c => c.trim()).filter(Boolean)
    blocks.push(
      <div key={`table-${blocks.length}`} className="overflow-x-auto my-6">
        <table className="w-full text-sm">
          <thead className="bg-surface/50">
            <tr>{headerCells.map((cell, i) => <th key={i} className="font-semibold text-left px-4 py-2 border-b border-border">{inline(cell)}</th>)}</tr>
          </thead>
          <tbody>
            {bodyLines.filter(l => l.trim() && !l.match(/^[\s|:-]+$/)).map((row, ri) => (
              <tr key={ri} className="even:bg-surface/20">{renderTableRow(row, false)}</tr>
            ))}
          </tbody>
        </table>
      </div>
    )
    tableLines = []
  }

  const flush = () => {
    flushTable()
    if (paragraph.length) {
      blocks.push(<p key={`p-${blocks.length}`} className="mb-4 leading-relaxed">{inline(paragraph.join(' '))}</p>)
      paragraph = []
    }
    if (list.length) {
      blocks.push(<ul key={`ul-${blocks.length}`} className="my-4 list-disc pl-6 space-y-1">{list.map((item, i) => <li key={i}>{inline(item)}</li>)}</ul>)
      list = []
    }
    if (orderedList.length) {
      blocks.push(<ol key={`ol-${blocks.length}`} className="my-4 list-decimal pl-6 space-y-1">{orderedList.map((item, i) => <li key={i}>{inline(item)}</li>)}</ol>)
      orderedList = []
    }
  }

  lines.forEach((line) => {
    // Blank line
    if (!line.trim()) {
      if (!tableLines.length) flush()
      return
    }

    // Table row
    if (line.trim().startsWith('|')) {
      if (paragraph.length || list.length || orderedList.length) flush()
      tableLines.push(line)
      return
    }

    // If we were in a table and hit a non-table line, flush it
    if (tableLines.length) flushTable()

    // Headings
    const heading = line.match(/^(#{1,3})\s+(.+)$/)
    if (heading) {
      flush()
      const level = heading[1].length
      const Tag = `h${level}` as 'h1' | 'h2' | 'h3'
      const classes = level === 2
        ? 'mt-10 mb-4 text-2xl font-semibold tracking-tight'
        : level === 3
        ? 'mt-6 mb-2 text-lg font-semibold'
        : 'mt-8 mb-4 text-3xl font-semibold'
      blocks.push(<Tag key={`h-${blocks.length}`} className={classes}>{inline(heading[2])}</Tag>)
      return
    }

    // Unordered list
    if (/^[-*]\s+/.test(line)) {
      if (paragraph.length) flush()
      if (orderedList.length) flush()
      list.push(line.replace(/^[-*]\s+/, ''))
      return
    }

    // Ordered list
    if (/^\d+\.\s+/.test(line)) {
      if (paragraph.length) flush()
      if (list.length) flush()
      orderedList.push(line.replace(/^\d+\.\s+/, ''))
      return
    }

    // Paragraph continuation
    if (list.length || orderedList.length) flush()
    paragraph.push(line.trim())
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

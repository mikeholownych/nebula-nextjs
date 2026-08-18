/**
 * Nebula audit PDF report generator.
 * Uses PDFKit (Node.js, server-side only) to produce a branded A4 PDF.
 * Called from /api/audit/[id]/pdf route.
 *
 * Layout:
 *   Page 1: Header + score + grade + signal scorecard
 *   Page 2+: Findings detail (one section per failing signal)
 *   Last section: Re-audit note + methodology
 */

import PDFDocument from 'pdfkit'

// ── Brand tokens ──────────────────────────────────────────────────────────
const COLORS = {
  bg: '#0a0a0a',
  accent: '#c7ff2f',
  white: '#ffffff',
  fg: '#e5e7eb',
  muted: '#6b7280',
  border: '#1f2937',
  fail: '#ef4444',
  warn: '#f59e0b',
  pass: '#c7ff2f',
  dark: '#111827',
}

const SIGNAL_LABELS: Record<string, string> = {
  message_match:    'Message Match',
  trust:            'Trust Signals',
  mobile_cta:       'Mobile CTA',
  load_time:        'Load Speed',
  cta_clarity:      'CTA Clarity',
  above_fold:       'Above-Fold Content',
  ad_signals:       'Ad Signal Continuity',
  seo_foundations:  'SEO Foundations',
  ai_readiness:     'AI Readiness',
}

export interface AuditFinding {
  key: string
  label?: string
  impact?: number
  effort?: number
  issue?: string
  fix?: string
  quadrant?: string
}

export interface AuditReportData {
  auditId: string
  url: string
  score: number
  grade: string
  findings: AuditFinding[]
  createdAt?: string
  customerName?: string
  planLabel?: string
}

function statusColor(score: number): string {
  if (score >= 7) return COLORS.pass
  if (score >= 5) return COLORS.warn
  return COLORS.fail
}

function statusLabel(score: number): string {
  if (score >= 7) return 'PASS'
  if (score >= 5) return 'WARN'
  return 'FAIL'
}

export function generateAuditPDF(data: AuditReportData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = []
    const doc = new PDFDocument({
      size: 'A4',
      margins: { top: 48, bottom: 48, left: 48, right: 48 },
      info: {
        Title: `Nebula Audit Report - ${data.url}`,
        Author: 'Nebula Components',
        Subject: 'Landing Page Conversion Audit',
        Keywords: '9-signal, landing page, conversion, audit',
        Creator: 'nebulacomponents.com',
      },
    })

    const W = 595 - 96  // A4 width minus margins
  const ACCENT = COLORS.accent

  // ── Page 1: Header ───────────────────────────────────────────────────────
  // Dark header bar
  doc.rect(0, 0, 595, 80).fill(COLORS.dark)

  doc.font('Helvetica-Bold').fontSize(11).fillColor(ACCENT)
    .text('NEBULA COMPONENTS', 48, 20)
  doc.font('Helvetica').fontSize(10).fillColor(COLORS.muted)
    .text('9-Signal Landing Page Audit Report', 48, 36)
  doc.font('Helvetica').fontSize(9).fillColor(COLORS.muted)
    .text(`nebulacomponents.com`, 48, 52)

  // Score + Grade badges (right side)
  const badgeY = 16
  // Score badge
  doc.rect(595 - 48 - 100, badgeY, 90, 48).fill('#1a1a1a')
  doc.font('Helvetica-Bold').fontSize(24)
    .fillColor(statusColor(data.score / 10))
    .text(`${data.score}`, 595 - 48 - 100 + 10, badgeY + 8, { width: 48 })
  doc.font('Helvetica').fontSize(11).fillColor(COLORS.muted)
    .text('/100', 595 - 48 - 100 + 46, badgeY + 16)
  // Grade badge
  doc.rect(595 - 48 - 44, badgeY, 44, 48).fill('#1a1a1a')
  doc.font('Helvetica-Bold').fontSize(26)
    .fillColor(statusColor(data.score / 10))
    .text(data.grade, 595 - 48 - 44 + 8, badgeY + 8)

  let y = 100

  // URL + meta
  doc.font('Helvetica-Bold').fontSize(14).fillColor(COLORS.white)
    .text(data.url, 48, y, { width: W * 0.75 })
  y += 22
  doc.font('Helvetica').fontSize(9).fillColor(COLORS.muted)
    .text([
      `Audit ID: ${data.auditId}`,
      data.createdAt ? `Generated: ${new Date(data.createdAt).toLocaleDateString('en-CA')}` : '',
      data.planLabel ? `Plan: ${data.planLabel}` : '',
    ].filter(Boolean).join('   ·   '), 48, y)
  y += 24

  // Divider
  doc.rect(48, y, W, 1).fill(COLORS.border)
  y += 20

  // ── Signal Scorecard Table ─────────────────────────────────────────────
  doc.font('Helvetica-Bold').fontSize(12).fillColor(COLORS.white)
    .text('9-Signal Scorecard', 48, y)
  y += 18

  // Table header
  doc.rect(48, y, W, 24).fill(COLORS.dark)
  doc.font('Helvetica-Bold').fontSize(9).fillColor(COLORS.muted)
  doc.text('SIGNAL', 56, y + 7)
  doc.text('SCORE', 280, y + 7)
  doc.text('STATUS', 340, y + 7)
  doc.text('FINDING', 420, y + 7)
  y += 24

  // Build signal scores from findings
  const signalScores: Record<string, { score: number; finding?: AuditFinding }> = {}
  for (const finding of data.findings) {
    const key = finding.key || ''
    const s = typeof finding.impact === 'number' ? Math.round(finding.impact * 2) : 5
    signalScores[key] = { score: Math.min(10, Math.max(1, s)), finding }
  }

  const signals = Object.keys(SIGNAL_LABELS)
  let rowAlt = false
  for (const sig of signals) {
    const label = SIGNAL_LABELS[sig] || sig
    const entry = signalScores[sig]
    const score = entry?.score ?? 8
    const color = statusColor(score)
    const status = statusLabel(score)
    const issue = entry?.finding?.issue ?? '-'

    if (rowAlt) doc.rect(48, y, W, 32).fill('#0f0f0f')
    rowAlt = !rowAlt

    doc.font('Helvetica').fontSize(10).fillColor(COLORS.fg)
      .text(label, 56, y + 6, { width: 210 })

    doc.font('Helvetica-Bold').fontSize(10).fillColor(color)
      .text(`${score}/10`, 280, y + 6)

    // Status pill
    doc.rect(335, y + 4, 60, 18).fill(color + '22').stroke(color)
    doc.strokeColor(color).lineWidth(0.5)
    doc.rect(335, y + 4, 60, 18).stroke()
    doc.font('Helvetica-Bold').fontSize(8).fillColor(color)
      .text(status, 337, y + 9, { width: 56, align: 'center' })

    // Finding snippet
    const snippet = issue.length > 55 ? issue.slice(0, 52) + '…' : issue
    doc.font('Helvetica').fontSize(8).fillColor(COLORS.muted)
      .text(snippet, 420, y + 6, { width: W - 420 + 48 })

    y += 32

    if (y > 720) {
      doc.addPage()
      y = 48
    }
  }

  y += 16
  doc.rect(48, y, W, 1).fill(COLORS.border)
  y += 20

  // ── Findings Detail ────────────────────────────────────────────────────
  const failFindings = data.findings.filter(f => {
    const s = signalScores[f.key]?.score ?? 8
    return s < 7
  })

  if (failFindings.length > 0) {
    doc.font('Helvetica-Bold').fontSize(12).fillColor(COLORS.white)
      .text('Findings & Recommendations', 48, y)
    y += 18

    for (const finding of failFindings) {
      if (y > 700) { doc.addPage(); y = 48 }

      const label = SIGNAL_LABELS[finding.key] || finding.key
      const score = signalScores[finding.key]?.score ?? 5
      const color = statusColor(score)
      const isTopLeak = finding.quadrant === 'quick_win' && score <= 3

      // Section header
      doc.rect(48, y, W, 28).fill(COLORS.dark)
      if (isTopLeak) {
        doc.rect(48, y, 3, 28).fill(COLORS.warn)
        doc.font('Helvetica-Bold').fontSize(10).fillColor(COLORS.warn)
          .text('★ TOP LEAK', 58, y + 8)
        doc.font('Helvetica-Bold').fontSize(10).fillColor(COLORS.white)
          .text(label, 118, y + 8)
      } else {
        doc.rect(48, y, 3, 28).fill(color)
        doc.font('Helvetica-Bold').fontSize(10).fillColor(COLORS.white)
          .text(label, 58, y + 8)
      }
      doc.font('Helvetica-Bold').fontSize(10).fillColor(color)
        .text(`${score}/10`, W - 10, y + 8, { align: 'right' })
      y += 32

      // Issue
      if (finding.issue) {
        doc.font('Helvetica-Bold').fontSize(9).fillColor(COLORS.muted)
          .text('ISSUE', 56, y)
        y += 13
        doc.font('Helvetica').fontSize(10).fillColor(COLORS.fg)
          .text(finding.issue, 56, y, { width: W - 16 })
        y += doc.heightOfString(finding.issue, { width: W - 16 }) + 8
      }

      // Fix
      if (finding.fix) {
        doc.font('Helvetica-Bold').fontSize(9).fillColor(ACCENT)
          .text('FIX', 56, y)
        y += 13
        doc.font('Helvetica').fontSize(10).fillColor(COLORS.fg)
          .text(finding.fix, 56, y, { width: W - 16 })
        y += doc.heightOfString(finding.fix, { width: W - 16 }) + 16
      }

      doc.rect(48, y, W, 0.5).fill(COLORS.border)
      y += 16
    }
  }

  // ── Footer / Methodology ───────────────────────────────────────────────
  if (y > 680) { doc.addPage(); y = 48 }
  y += 8

  doc.rect(48, y, W, 0.5).fill(COLORS.border)
  y += 16

  doc.font('Helvetica-Bold').fontSize(9).fillColor(COLORS.muted)
    .text('METHODOLOGY', 48, y)
  y += 14
  doc.font('Helvetica').fontSize(8).fillColor(COLORS.muted)
    .text(
      'Scores are derived from automated analysis of the public HTML, JavaScript, and rendered DOM of the submitted URL. Each of the 9 signals is scored 1–10 based on observable page conditions. Scores reflect page state at time of audit. The audit does not promise conversion lift; it documents specific page conditions.',
      48, y, { width: W },
    )
  y += 40

  doc.rect(48, y, W, 0.5).fill(COLORS.border)
  y += 12

  doc.font('Helvetica').fontSize(8).fillColor(COLORS.muted)
    .text(
      `Generated by Nebula Components - nebulacomponents.com - Audit ID: ${data.auditId} - Licensed for internal use.`,
      48, y, { width: W, align: 'center' },
    )

    doc.on('data', (chunk: Buffer) => chunks.push(chunk))
    doc.on('end', () => resolve(Buffer.concat(chunks)))
    doc.on('error', reject)
    doc.end()
  })
}

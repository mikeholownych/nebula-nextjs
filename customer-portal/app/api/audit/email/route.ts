import { NextRequest, NextResponse } from 'next/server'
import { writeFile, readFile, mkdir } from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'

// Simple JSONL-based email storage (no database required)
const EMAILS_FILE = path.join(process.cwd(), 'audit_emails.jsonl')

interface EmailEntry {
  auditId: string
  email: string
  timestamp: string
  userAgent?: string
}

export async function POST(request: NextRequest) {
  try {
    const { auditId, email } = await request.json()

    if (!auditId || !email) {
      return NextResponse.json(
        { error: 'Audit ID and email required' },
        { status: 400 }
      )
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Valid email required' },
        { status: 400 }
      )
    }

    // Ensure directory exists
    const dir = path.dirname(EMAILS_FILE)
    if (!existsSync(dir)) {
      await mkdir(dir, { recursive: true })
    }

    // Append email to JSONL file
    const entry: EmailEntry = {
      auditId,
      email: email.toLowerCase(),
      timestamp: new Date().toISOString(),
      userAgent: request.headers.get('user-agent') || undefined,
    }

    await writeFile(EMAILS_FILE, JSON.stringify(entry) + '\n', { flag: 'a' })

    // Store in audit file that email was captured
    const auditsFile = path.join(process.cwd(), 'audits.jsonl')
    if (existsSync(auditsFile)) {
      const audits = (await readFile(auditsFile, 'utf-8')).split('\n').filter(Boolean)
      const updatedAudits = audits.map(line => {
        const audit = JSON.parse(line)
        if (audit.auditId === auditId) {
          return JSON.stringify({ ...audit, emailCaptured: email, emailCapturedAt: entry.timestamp })
        }
        return line
      })
      await writeFile(auditsFile, updatedAudits.join('\n') + '\n')
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Email capture error:', error)
    return NextResponse.json(
      { error: 'Failed to save email' },
      { status: 500 }
    )
  }
}

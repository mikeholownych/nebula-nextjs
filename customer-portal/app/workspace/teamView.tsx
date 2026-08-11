'use client'

import { useCallback, useEffect, useState } from 'react'

interface TeamMember {
  email: string
  role: string
  invitationStatus: string
  invitedAt?: string | null
  joinedAt?: string | null
}

interface TeamViewProps {
  email: string
}

export default function TeamView({ email }: TeamViewProps) {
  const [members, setMembers] = useState<TeamMember[]>([])
  const [loading, setLoading] = useState(true)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<'viewer' | 'editor'>('viewer')
  const [inviteMsg, setInviteMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null)
  const [sending, setSending] = useState(false)

  const loadTeam = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/workspace/team?email=${encodeURIComponent(email)}`)
      const data = await res.json()
      setMembers(data.members || [])
    } catch {
      setMembers([{ email, role: 'owner', invitationStatus: 'accepted' }])
    } finally {
      setLoading(false)
    }
  }, [email])

  useEffect(() => {
    if (email) loadTeam()
  }, [email, loadTeam])

  const sendInvite = async () => {
    if (!inviteEmail.trim() || sending) return
    const target = inviteEmail.trim().toLowerCase()

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(target)) {
      setInviteMsg({ text: 'Enter a valid email address', type: 'error' })
      return
    }

    setSending(true)
    setInviteMsg(null)

    try {
      const res = await fetch('/api/workspace/team', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ownerEmail: email, inviteEmail: target, role: inviteRole }),
      })
      const data = await res.json()

      if (res.ok) {
        setInviteMsg({ text: data.message || `Invitation sent to ${target}`, type: 'success' })
        setInviteEmail('')
        loadTeam()
      } else {
        setInviteMsg({ text: data.error || 'Failed to send invite', type: 'error' })
      }
    } catch {
      setInviteMsg({ text: 'Network error - try again', type: 'error' })
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="space-y-8 max-w-2xl">
      {/* Current team members */}
      <section>
        <h2 className="text-xl font-bold mb-4">Team Members</h2>
        {loading ? (
          <p className="text-fg-muted text-sm">Loading…</p>
        ) : (
          <div className="bg-bg-elevated border border-border rounded-lg divide-y divide-border">
            {members.map((m) => (
              <div key={m.email} className="flex items-center justify-between px-5 py-4">
                <div>
                  <p className="text-sm font-medium text-fg">{m.email}</p>
                  <p className="text-xs text-fg-dim mt-0.5">
                    {m.invitationStatus === 'pending'
                      ? `Invited ${m.invitedAt ? new Date(m.invitedAt).toLocaleDateString() : ''}`
                      : m.joinedAt
                      ? `Joined ${new Date(m.joinedAt).toLocaleDateString()}`
                      : 'Owner'}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {m.invitationStatus === 'pending' && (
                    <span className="text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full bg-signal-fail/10 text-signal-fail border border-signal-fail/20">
                      Pending
                    </span>
                  )}
                  <span className="text-xs font-semibold uppercase tracking-wide px-2.5 py-1 rounded-full bg-accent-dim text-accent border border-accent/20">
                    {m.role}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Invite section */}
      <section>
        <h2 className="text-xl font-bold mb-1">Invite Team Member</h2>
        <p className="text-sm text-fg-muted mb-4">
          Add collaborators to your workspace - they&apos;ll receive an email invitation.
        </p>
        <div className="bg-bg-elevated border border-border rounded-lg p-5 space-y-3">
          <div className="flex gap-3">
            <input
              type="email"
              value={inviteEmail}
              onChange={(e) => {
                setInviteEmail(e.target.value)
                setInviteMsg(null)
              }}
              onKeyDown={(e) => e.key === 'Enter' && sendInvite()}
              placeholder="colleague@company.com"
              className="flex-1 rounded-lg border border-border bg-bg-panel px-4 py-2.5 text-sm text-fg placeholder-fg-dim focus:border-accent focus:outline-none"
            />
            <select
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value as 'viewer' | 'editor')}
              className="rounded-lg border border-border bg-bg-panel px-3 py-2.5 text-sm text-fg focus:border-accent focus:outline-none"
            >
              <option value="viewer">Viewer</option>
              <option value="editor">Editor</option>
            </select>
            <button
              onClick={sendInvite}
              disabled={sending}
              className="rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-bg hover:bg-accent-light transition-colors whitespace-nowrap disabled:opacity-50"
            >
              {sending ? 'Sending…' : 'Send invite'}
            </button>
          </div>
          {inviteMsg && (
            <p className={`text-sm ${inviteMsg.type === 'error' ? 'text-danger' : 'text-accent'}`}>
              {inviteMsg.text}
            </p>
          )}
        </div>
      </section>

      {/* Client Portal section */}
      <section>
        <h2 className="text-xl font-bold mb-1">Client Portal</h2>
        <p className="text-sm text-fg-muted mb-4">
          Share read-only audit reports with clients or stakeholders.
        </p>
        <div className="bg-bg-elevated border border-border rounded-lg p-5">
          <div className="flex items-start gap-3">
            <span className="text-2xl">&#x1F517;</span>
            <div>
              <p className="text-sm font-medium text-fg mb-1">Shareable report links</p>
              <p className="text-sm text-fg-muted">
                Shareable read-only report links are available from the{' '}
                <span className="text-accent font-medium">Reports</span> tab. Each link
                gives your client a branded view of audit findings without workspace access.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Roles */}
      <section>
        <h2 className="text-xl font-bold mb-4">Roles</h2>
        <div className="grid gap-3">
          {[
            {
              role: 'Owner',
              icon: '\u{1F451}',
              desc: 'Full access - manage workspace, billing, team members, and all audits.',
            },
            {
              role: 'Editor',
              icon: '\u{270F}\u{FE0F}',
              desc: 'Can run audits and manage recommendations, but cannot change billing or team settings.',
            },
            {
              role: 'Viewer',
              icon: '\u{1F441}\u{FE0F}',
              desc: 'Read-only access to reports and audit results. Ideal for clients or stakeholders.',
            },
          ].map(({ role, icon, desc }) => (
            <div
              key={role}
              className="bg-bg-elevated border border-border rounded-lg px-5 py-4 flex items-start gap-3"
            >
              <span className="text-xl">{icon}</span>
              <div>
                <p className="text-sm font-semibold text-fg">{role}</p>
                <p className="text-sm text-fg-muted mt-0.5">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}

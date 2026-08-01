'use client'

import { useState, useRef, useEffect } from 'react'
import { WorkspaceAudit } from './WorkspaceClient'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

const SUGGESTED_QUESTIONS = [
  'Why did my score drop?',
  'Which fix will have the most impact?',
  'Show all CTA issues across my pages',
  'What should I work on today?',
]

interface AssistantViewProps {
  email: string
  audits: WorkspaceAudit[]
}

export default function AssistantView({ email, audits }: AssistantViewProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  const recentAuditIds = audits
    .filter((a) => a.status === 'completed')
    .slice(0, 5)
    .map((a) => a.id)

  const send = async (question: string) => {
    if (!question.trim() || loading) return
    const q = question.trim()
    setInput('')
    setMessages((prev) => [...prev, { role: 'user', content: q }])
    setLoading(true)

    try {
      const res = await fetch('/api/workspace/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, question: q, auditIds: recentAuditIds }),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({ answer: 'Request failed.' }))
        setMessages((prev) => [
          ...prev,
          { role: 'assistant', content: err.answer || err.error || 'Something went wrong.' },
        ])
        return
      }

      const data = await res.json()
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: data.answer || 'No answer returned.' },
      ])
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: 'Could not reach the assistant. Check your connection and try again.',
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    send(input)
  }

  return (
    <div className="flex flex-col h-[calc(100vh-260px)] min-h-[500px]">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-xl font-bold text-white">AI Assistant</h2>
        <p className="text-sm text-gray-400 mt-1">
          Ask questions grounded in your real audit data. Every answer references your actual
          findings.
        </p>
        {recentAuditIds.length === 0 && (
          <p className="mt-2 text-sm text-amber-400">
            No completed audits found. Run an audit first to get data-grounded answers.
          </p>
        )}
      </div>

      {/* Chat thread */}
      <div className="flex-1 overflow-y-auto rounded-lg border border-gray-800 bg-[#080808] p-4 space-y-4 mb-4">
        {messages.length === 0 && !loading && (
          <div className="flex flex-col items-center justify-center h-full text-center py-10">
            <div className="text-3xl mb-3">&#x1F4CA;</div>
            <p className="text-gray-400 text-sm max-w-sm">
              Ask a question about your audits. Try one of the suggestions below, or type your own.
            </p>
          </div>
        )}

        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {msg.role === 'assistant' && (
              <div className="flex-shrink-0 w-7 h-7 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 text-xs font-bold mt-0.5">
                AI
              </div>
            )}
            <div
              className={`max-w-[75%] rounded-lg px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${
                msg.role === 'user'
                  ? 'bg-emerald-500/10 text-white border border-emerald-500/20'
                  : 'bg-gray-800/60 text-gray-100 border border-gray-700/50'
              }`}
            >
              {msg.content}
            </div>
            {msg.role === 'user' && (
              <div className="flex-shrink-0 w-7 h-7 rounded-full bg-gray-700 flex items-center justify-center text-gray-300 text-xs font-bold mt-0.5">
                You
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="flex gap-3 justify-start">
            <div className="flex-shrink-0 w-7 h-7 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 text-xs font-bold mt-0.5">
              AI
            </div>
            <div className="bg-gray-800/60 border border-gray-700/50 rounded-lg px-4 py-3 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce [animation-delay:-0.3s]" />
              <span className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce [animation-delay:-0.15s]" />
              <span className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce" />
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Suggested question chips */}
      {messages.length === 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {SUGGESTED_QUESTIONS.map((q) => (
            <button
              key={q}
              onClick={() => send(q)}
              disabled={loading || recentAuditIds.length === 0}
              className="px-3 py-1.5 rounded-full text-xs font-medium bg-gray-800 border border-gray-700 text-gray-300 hover:border-emerald-500/50 hover:text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {q}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={
            recentAuditIds.length === 0
              ? 'No audit data yet — run an audit first'
              : 'Ask about your audit data…'
          }
          disabled={loading || recentAuditIds.length === 0}
          className="flex-1 rounded-lg border border-gray-700 bg-[#0d0d0d] px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:border-emerald-500 focus:outline-none disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={loading || !input.trim() || recentAuditIds.length === 0}
          className="rounded-lg bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-black hover:bg-emerald-400 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Send
        </button>
      </form>
    </div>
  )
}

'use client'

import { useEffect, useState } from 'react'

const NEWSLETTER_API = 'https://api.nebulacomponents.com'

export default function UnsubscribePage() {
  const [icon, setIcon] = useState('✉️')
  const [description, setDescription] = useState('')
  const [buttonText, setButtonText] = useState('Unsubscribe')
  const [buttonDisabled, setButtonDisabled] = useState(false)
  const [buttonVisible, setButtonVisible] = useState(true)
  const [statusText, setStatusText] = useState('')
  const [statusClass, setStatusClass] = useState('')
  const [email, setEmail] = useState('')
  const [finePrintHtml, setFinePrintHtml] = useState(
    `Changed your mind? <a href="/" className="text-accent hover:underline">Run a free audit</a> at any time.<br/>
     If you believe this was sent in error, contact hello@nebulacomponents.com.`,
  )
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const emailFromUrl = params.get('email') || ''

    if (emailFromUrl && emailFromUrl.includes('@')) {
      // Auto-process when email is in URL
      setEmail(emailFromUrl)
      setDescription(`Processing your unsubscribe request for ${emailFromUrl}...`)
      setButtonVisible(false)
      setStatusText('Processing...')
      setStatusClass('status-processing')

      fetch(`${NEWSLETTER_API}/api/newsletter/unsubscribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailFromUrl }),
      })
        .then((r) => r.json())
        .then((data) => {
          if (data.status === 'unsubscribed') {
            setIcon('✅')
            setDescription('You have been successfully unsubscribed from Nebula Components email communications.')
            setStatusClass('status-done')
            setStatusText(`Unsubscribed: ${emailFromUrl}`)
            setFinePrintHtml(
              `If this was a mistake, you can <a href="/" className="text-accent hover:underline">run another free audit</a> at any time - we'll only send what you request.`
            )
          } else {
            throw new Error('Unexpected response')
          }
        })
        .catch((err) => {
          setIcon('❌')
          setDescription('There was an error processing your request. Please try again or email us directly.')
          setStatusClass('status-error')
          setStatusText(`Error: ${err.message}`)
          setButtonVisible(true)
          setButtonText('Try Again')
          setFinePrintHtml(
            `Email us at hello{'\u0040'}nebulacomponents.com to unsubscribe.`
          )
        })
    } else {
      // No email in URL - show manual form
      setDescription('Enter the email address you want to unsubscribe.')
      setButtonText('Submit')
    }
  }, [])

  const handleUnsub = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const emailInput = email.trim()
    if (!emailInput || !emailInput.includes('@')) {
      setStatusClass('status-error')
      setStatusText('Enter a valid email address.')
      return
    }

    setButtonDisabled(true)
    setButtonText('Processing...')

    fetch(`${NEWSLETTER_API}/api/newsletter/unsubscribe`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: emailInput.trim() }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.status === 'unsubscribed') {
          setIcon('✅')
          setDescription('You have been successfully unsubscribed.')
          setStatusClass('status-done')
          setStatusText(`Unsubscribed: ${emailInput.trim()}`)
          setButtonVisible(false)
        } else {
          throw new Error('Unexpected response')
        }
      })
      .catch((err) => {
        setStatusClass('status-error')
        setStatusText(`Error: ${err.message}`)
        setButtonDisabled(false)
        setButtonText('Try Again')
      })
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg">
      <div className="bg-bg-panel border border-border rounded-2xl p-12 max-w-xl w-[90%] text-center">
        <div className="text-5xl mb-4">{icon}</div>
        <h1 className="text-2xl font-bold text-fg mb-3">Manage Email Preferences to Stop Unwanted Updates Easily</h1>
        <p className="text-fg-muted mb-6">{description}</p>

        {buttonVisible && (
          <form onSubmit={handleUnsub} className="mx-auto max-w-md text-left">
            <label htmlFor="unsubscribe-email" className="mb-2 block text-sm font-semibold text-fg">
              Email address
            </label>
            <input
              id="unsubscribe-email"
              name="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@company.com"
              autoComplete="email"
              required
              className="mb-3 w-full rounded-xl border border-fg-muted/30 bg-bg px-4 py-3 text-fg placeholder:text-fg-muted focus:border-accent focus:outline-none"
            />
            <button
              type="submit"
              disabled={buttonDisabled}
              className="w-full rounded-xl border-none bg-accent px-8 py-3.5 text-base font-semibold text-bg transition-all hover:opacity-85 hover:bg-accent disabled:cursor-default disabled:opacity-50"
            >
              {buttonText}
            </button>
          </form>
        )}

        {statusText && (
          <div
            className={`mt-4 font-semibold ${
              statusClass === 'status-done'
                ? 'text-accent'
                : statusClass === 'status-error'
                ? 'text-danger'
                : 'text-fg-muted'
            }`}
          >
            {statusText}
          </div>
        )}

        <p
          className="text-fg-muted text-sm mt-6"
          dangerouslySetInnerHTML={{ __html: finePrintHtml }}
        />
      </div>
    </div>
  )
}

'use client'

import { useEffect, useState } from 'react'

export default function UnsubscribePage() {
  const [icon, setIcon] = useState('✉️')
  const [description, setDescription] = useState('')
  const [buttonText, setButtonText] = useState('Unsubscribe')
  const [buttonDisabled, setButtonDisabled] = useState(false)
  const [buttonVisible, setButtonVisible] = useState(true)
  const [statusText, setStatusText] = useState('')
  const [statusClass, setStatusClass] = useState('')
  const [finePrintHtml, setFinePrintHtml] = useState(
    `Changed your mind? <a href="/" className="text-indigo-400 hover:underline">Run a free audit</a> at any time.<br/>
     If you believe this was sent in error, <a href="mailto:ops@launchcrate.io" className="text-indigo-400 hover:underline">contact us</a>.`
  )
  const [emailFromUrl, setEmailFromUrl] = useState('')

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const email = params.get('email') || ''
    setEmailFromUrl(email)

    if (email && email.includes('@')) {
      // Auto-process when email is in URL
      setDescription(`Processing your unsubscribe request for ${email}...`)
      setButtonVisible(false)
      setStatusText('Processing...')
      setStatusClass('status-processing')

      fetch('/api/unsubscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
        .then((r) => r.json())
        .then((data) => {
          if (data.status === 'unsubscribed') {
            setIcon('✅')
            setDescription('You have been successfully unsubscribed from Nebula Components email communications.')
            setStatusClass('status-done')
            setStatusText(`Unsubscribed: ${email}`)
            setFinePrintHtml(
              `If this was a mistake, you can <a href="/" className="text-indigo-400 hover:underline">run another free audit</a> at any time — we'll only send what you request.`
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
            `Email us at <a href="mailto:ops@launchcrate.io" className="text-indigo-400 hover:underline">ops@launchcrate.io</a> to unsubscribe.`
          )
        })
    } else {
      // No email in URL - show manual form
      setDescription('Enter the email address you want to unsubscribe.')
      setButtonText('Submit')
    }
  }, [])

  const handleUnsub = () => {
    const emailInput = prompt('Enter your email address:')
    if (!emailInput || !emailInput.includes('@')) return

    setButtonDisabled(true)
    setButtonText('Processing...')

    fetch('/api/unsubscribe', {
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
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0f]">
      <div className="bg-[#12121c] border border-[#1e1e2e] rounded-2xl p-12 max-w-xl w-[90%] text-center">
        <div className="text-5xl mb-4">{icon}</div>
        <h1 className="text-2xl font-bold text-[#f8fafc] mb-3">
          Unsubscribe from Nebula Components
        </h1>
        <p className="text-[#94a3b8] mb-6">{description}</p>

        {buttonVisible && (
          <button
            onClick={handleUnsub}
            disabled={buttonDisabled}
            className="inline-block bg-[#4f46e5] text-white font-semibold py-3.5 px-8 rounded-xl border-none cursor-pointer text-base transition-all hover:bg-[#5254cc] disabled:opacity-50 disabled:cursor-default"
          >
            {buttonText}
          </button>
        )}

        {statusText && (
          <div
            className={`mt-4 font-semibold ${
              statusClass === 'status-done'
                ? 'text-green-500'
                : statusClass === 'status-error'
                ? 'text-red-500'
                : 'text-[#94a3b8]'
            }`}
          >
            {statusText}
          </div>
        )}

        <p
          className="text-[#94a3b8] text-sm mt-6"
          dangerouslySetInnerHTML={{ __html: finePrintHtml }}
        />
      </div>
    </div>
  )
}

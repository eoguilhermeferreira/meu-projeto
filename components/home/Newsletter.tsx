'use client'

import { useState } from 'react'

export function Newsletter() {
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return
    setSubmitted(true)
  }

  return (
    <section className="newsletter-section">
      <p className="section-label" style={{ textAlign: 'center' }}>Newsletter</p>
      <h2 className="newsletter-section__title">
        Primeiro a Saber.
      </h2>
      <p style={{ color: 'var(--keni-neutral-600)', maxWidth: 400, margin: '0 auto' }}>
        Receba lançamentos exclusivos, ofertas e novidades antes de todo mundo.
      </p>

      {submitted ? (
        <div style={{
          marginTop: 'var(--keni-space-8)',
          background: 'var(--keni-color-black)',
          color: 'var(--keni-color-white)',
          borderRadius: 'var(--keni-radius-md)',
          padding: 'var(--keni-space-6)',
          maxWidth: 460,
          margin: 'var(--keni-space-8) auto 0',
          textAlign: 'center',
        }}>
          <p style={{ fontWeight: 700, marginBottom: 4 }}>Você está na lista!</p>
          <p style={{ fontSize: 'var(--keni-text-sm)', opacity: 0.8 }}>Fique de olho na sua caixa de entrada.</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="newsletter-section__form">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="newsletter-section__input"
            placeholder="seu@email.com"
            required
            aria-label="Seu e-mail"
          />
          <button type="submit" className="keni-btn keni-btn--primary" style={{ flexShrink: 0 }}>
            Inscrever
          </button>
        </form>
      )}

      <p style={{
        marginTop: 'var(--keni-space-4)',
        fontSize: 'var(--keni-text-xs)',
        color: 'var(--keni-neutral-500)',
      }}>
        Sem spam. Cancele quando quiser. Consulte nossa{' '}
        <a href="/privacidade" style={{ color: 'inherit', textDecoration: 'underline' }}>
          Política de Privacidade
        </a>.
      </p>
    </section>
  )
}

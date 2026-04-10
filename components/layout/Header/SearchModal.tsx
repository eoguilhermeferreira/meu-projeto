'use client'

import { useEffect, useRef, useState } from 'react'
import { Search, X, TrendingUp } from 'lucide-react'
import Link from 'next/link'

interface SearchModalProps {
  onClose: () => void
}

const TRENDING = [
  { label: 'Air Velocity', href: '/nav/air-velocity' },
  { label: 'Tênis de corrida', href: '/nav/corrida/calcados' },
  { label: 'Leggings femininas', href: '/nav/feminino/leggings' },
  { label: 'Jaqueta corta-vento', href: '/nav/jaquetas' },
  { label: 'Outlet KENI', href: '/nav/outlet' },
]

export function SearchModal({ onClose }: SearchModalProps) {
  const [query, setQuery] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [onClose])

  return (
    <>
      {/* Backdrop */}
      <div
        style={{
          position: 'fixed',
          inset: 0,
          background: 'var(--keni-bg-overlay)',
          zIndex: 'calc(var(--keni-z-header) + 9)',
        }}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div
        className="search-modal"
        style={{ zIndex: 'calc(var(--keni-z-header) + 10)' }}
        role="dialog"
        aria-label="Buscar produtos"
      >
        <div style={{ maxWidth: 720, margin: '0 auto' }}>
          {/* Input */}
          <div className="search-modal__input-wrap">
            <Search size={20} color="var(--keni-neutral-500)" />
            <input
              ref={inputRef}
              type="search"
              className="search-modal__input"
              placeholder="Buscar tênis, roupas, acessórios..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label="Campo de busca"
            />
            <button
              onClick={onClose}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--keni-neutral-500)',
                display: 'flex',
                alignItems: 'center',
              }}
              aria-label="Fechar busca"
            >
              <X size={20} />
            </button>
          </div>

          {/* Trending */}
          {!query && (
            <div style={{ marginTop: 'var(--keni-space-6)' }}>
              <p style={{
                fontSize: 'var(--keni-text-xs)',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                color: 'var(--keni-neutral-500)',
                marginBottom: 'var(--keni-space-3)',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}>
                <TrendingUp size={14} />
                Em Alta
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--keni-space-2)' }}>
                {TRENDING.map((t) => (
                  <Link
                    key={t.label}
                    href={t.href}
                    onClick={onClose}
                    style={{
                      padding: '8px 16px',
                      background: 'var(--keni-neutral-100)',
                      borderRadius: 'var(--keni-radius-pill)',
                      fontSize: 'var(--keni-text-sm)',
                      color: 'var(--keni-color-black)',
                      textDecoration: 'none',
                      transition: 'background var(--keni-duration-fast)',
                    }}
                  >
                    {t.label}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}

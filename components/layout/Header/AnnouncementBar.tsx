'use client'

import { useState, useEffect, useCallback } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import Link from 'next/link'

interface AnnouncementItem {
  id: string
  title: string
  subtitle: string
  linkText: string
  linkHref: string
}

const announcements: AnnouncementItem[] = [
  {
    id: '1',
    title: 'FRETE GRÁTIS',
    subtitle: 'em compras acima de R$ 299.',
    linkText: 'Comprar agora',
    linkHref: '/nav/novidades',
  },
  {
    id: '2',
    title: 'NOVO DROP',
    subtitle: 'Coleção Velocity chegou.',
    linkText: 'Ver coleção',
    linkHref: '/nav/lancamentos',
  },
  {
    id: '3',
    title: 'ATÉ 40% OFF',
    subtitle: 'no outlet de temporada.',
    linkText: 'Ver ofertas',
    linkHref: '/nav/colecao/outlet',
  },
  {
    id: '4',
    title: 'CARTÃO PRESENTE',
    subtitle: 'para presentes de última hora.',
    linkText: 'Saiba mais',
    linkHref: '/sc/cartao-presente',
  },
]

export function AnnouncementBar() {
  const [current, setCurrent] = useState(0)
  const [paused, setPaused] = useState(false)

  const next = useCallback(() => {
    setCurrent((prev) => (prev + 1) % announcements.length)
  }, [])

  const prev = useCallback(() => {
    setCurrent((prev) => (prev - 1 + announcements.length) % announcements.length)
  }, [])

  useEffect(() => {
    if (paused) return
    const timer = setInterval(next, 4000)
    return () => clearInterval(timer)
  }, [paused, next])

  const item = announcements[current]

  return (
    <div
      className="announcement-bar"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      role="region"
      aria-label="Anúncios"
    >
      <button
        onClick={prev}
        aria-label="Item anterior"
        className="announcement-bar__arrow"
      >
        <ChevronLeft size={14} />
      </button>

      <div className="announcement-bar__content" aria-live="polite">
        <p style={{ display: 'flex', gap: '4px', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center' }}>
          <strong style={{ fontWeight: 700 }}>{item.title}</strong>
          <span style={{ color: 'var(--keni-neutral-600)' }}>{item.subtitle}</span>
          <Link href={item.linkHref} className="announcement-bar__link">
            {item.linkText}
          </Link>
        </p>
      </div>

      <button
        onClick={next}
        aria-label="Próximo item"
        className="announcement-bar__arrow"
      >
        <ChevronRight size={14} />
      </button>
    </div>
  )
}

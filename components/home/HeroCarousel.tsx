'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface HeroSlide {
  id: string
  eyebrow: string
  title: string
  subtitle: string
  ctaPrimary: { label: string; href: string }
  ctaSecondary?: { label: string; href: string }
  bg: string
  bgAlt: string
  align?: 'left' | 'center' | 'right'
}

const SLIDES: HeroSlide[] = [
  {
    id: '1',
    eyebrow: 'Nova Coleção 2026',
    title: 'VELOCITY\nPRO MAX',
    subtitle: 'Tecnologia de ponta para quem nunca para.',
    ctaPrimary: { label: 'Comprar Agora', href: '/nav/velocity-pro' },
    ctaSecondary: { label: 'Saiba Mais', href: '/sc/velocity-pro' },
    bg: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=1600&q=80',
    bgAlt: 'Tênis KENI Velocity Pro Max em fundo escuro dinâmico',
    align: 'left',
  },
  {
    id: '2',
    eyebrow: 'Coleção Feminina',
    title: 'MOVE\nFREE',
    subtitle: 'Performance sem limites. Estilo sem concessões.',
    ctaPrimary: { label: 'Ver Coleção', href: '/nav/feminino' },
    bg: 'https://images.unsplash.com/photo-1584735175315-9d5df23be620?w=1600&q=80',
    bgAlt: 'Mulher atleta com tênis KENI em movimento',
    align: 'left',
  },
  {
    id: '3',
    eyebrow: 'Outlet — Até 40% Off',
    title: 'PREÇOS\nIMPERDÍVEIS',
    subtitle: 'Modelos selecionados com desconto exclusivo.',
    ctaPrimary: { label: 'Ver Ofertas', href: '/nav/outlet' },
    bg: 'https://images.unsplash.com/photo-1552346154-21d32810aba3?w=1600&q=80',
    bgAlt: 'Seleção de tênis KENI em display',
    align: 'left',
  },
]

export function HeroCarousel() {
  const [current, setCurrent] = useState(0)
  const [paused, setPaused] = useState(false)

  const next = useCallback(() => {
    setCurrent((prev) => (prev + 1) % SLIDES.length)
  }, [])

  const prev = useCallback(() => {
    setCurrent((prev) => (prev - 1 + SLIDES.length) % SLIDES.length)
  }, [])

  useEffect(() => {
    if (paused) return
    const timer = setInterval(next, 6000)
    return () => clearInterval(timer)
  }, [paused, next])

  const slide = SLIDES[current]

  return (
    <div
      className="hero-carousel"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      role="region"
      aria-label="Destaques e campanhas"
      aria-roledescription="carrossel"
    >
      {/* Slides */}
      {SLIDES.map((s, i) => (
        <div
          key={s.id}
          className="hero-slide"
          style={{ opacity: i === current ? 1 : 0, zIndex: i === current ? 1 : 0 }}
          role="group"
          aria-roledescription="slide"
          aria-label={`${i + 1} de ${SLIDES.length}: ${s.title.replace('\n', ' ')}`}
          aria-hidden={i !== current}
        >
          {/* Background */}
          <img
            src={s.bg}
            alt={s.bgAlt}
            className="hero-slide__bg"
            loading={i === 0 ? 'eager' : 'lazy'}
          />
          <div className="hero-slide__overlay" aria-hidden="true" />

          {/* Content */}
          <div className="hero-slide__content">
            <p className="hero-slide__eyebrow">{s.eyebrow}</p>
            <h2
              className="hero-slide__title"
              style={{ whiteSpace: 'pre-line' }}
            >
              {s.title}
            </h2>
            <p className="hero-slide__subtitle">{s.subtitle}</p>
            <div className="hero-slide__ctas">
              <Link href={s.ctaPrimary.href} className="keni-btn keni-btn--primary">
                {s.ctaPrimary.label}
              </Link>
              {s.ctaSecondary && (
                <Link href={s.ctaSecondary.href} className="keni-btn keni-btn--outline">
                  {s.ctaSecondary.label}
                </Link>
              )}
            </div>
          </div>
        </div>
      ))}

      {/* Arrows */}
      <button
        onClick={prev}
        className="hero-carousel__arrow hero-carousel__arrow--prev"
        aria-label="Slide anterior"
      >
        <ChevronLeft size={20} />
      </button>
      <button
        onClick={next}
        className="hero-carousel__arrow hero-carousel__arrow--next"
        aria-label="Próximo slide"
      >
        <ChevronRight size={20} />
      </button>

      {/* Dots */}
      <div className="hero-carousel__nav" role="tablist" aria-label="Selecionar slide">
        {SLIDES.map((s, i) => (
          <button
            key={s.id}
            onClick={() => setCurrent(i)}
            className={`hero-carousel__dot ${i === current ? 'hero-carousel__dot--active' : ''}`}
            role="tab"
            aria-selected={i === current}
            aria-label={`Ir para slide ${i + 1}`}
          />
        ))}
      </div>
    </div>
  )
}

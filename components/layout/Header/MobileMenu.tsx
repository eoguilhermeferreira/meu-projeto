'use client'

import { useState } from 'react'
import Link from 'next/link'
import { X, ChevronRight, ChevronLeft, User, ShoppingBag } from 'lucide-react'
import { KeniLogo } from '@/components/ui/KeniLogo'

interface MobileMenuProps {
  onClose: () => void
}

const TOP_ITEMS = [
  { label: 'Novidades', href: '/nav/novidades' },
  { label: 'Masculino', href: '/nav/masculino' },
  { label: 'Feminino', href: '/nav/feminino' },
  { label: 'Infantil', href: '/nav/infantil' },
  {
    label: 'Ofertas',
    href: '/nav/outlet',
    highlight: true,
  },
  { label: 'Lançamentos', href: '/nav/lancamentos' },
]

const BOTTOM_ITEMS = [
  { label: 'Minha Conta', href: '/conta', icon: <User size={18} /> },
  { label: 'Meu Carrinho', href: '/carrinho', icon: <ShoppingBag size={18} /> },
  { label: 'Ajuda', href: '/ajuda' },
  { label: 'Localizar Loja', href: '/lojas' },
]

export function MobileMenu({ onClose }: MobileMenuProps) {
  return (
    <div className="mobile-menu" role="dialog" aria-modal="true" aria-label="Menu de navegação">
      {/* Backdrop */}
      <div
        className="mobile-menu__backdrop"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div className="mobile-menu__panel">
        {/* Header */}
        <div className="mobile-menu__header">
          <KeniLogo width={60} />
          <button
            onClick={onClose}
            className="keni-header__action-btn"
            aria-label="Fechar menu"
          >
            <X size={20} />
          </button>
        </div>

        {/* Nav */}
        <nav className="mobile-menu__nav" aria-label="Menu principal">
          {TOP_ITEMS.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="mobile-menu__item"
              onClick={onClose}
              style={item.highlight ? { color: 'var(--keni-color-red-primary)', fontWeight: 700 } : {}}
            >
              {item.label}
              <ChevronRight size={16} color="var(--keni-neutral-400)" />
            </Link>
          ))}

          <div style={{ height: 1, background: 'var(--keni-neutral-200)', margin: '8px 0' }} />

          {BOTTOM_ITEMS.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="mobile-menu__item"
              onClick={onClose}
              style={{ fontSize: 'var(--keni-text-sm)', color: 'var(--keni-neutral-600)' }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                {item.icon && item.icon}
                {item.label}
              </span>
              <ChevronRight size={14} color="var(--keni-neutral-400)" />
            </Link>
          ))}
        </nav>

        {/* Footer */}
        <div className="mobile-menu__footer">
          <p style={{ fontSize: 'var(--keni-text-xs)', color: 'var(--keni-neutral-500)', textAlign: 'center' }}>
            © 2026 KENI. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </div>
  )
}

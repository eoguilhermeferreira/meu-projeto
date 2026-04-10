'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Search, User, ShoppingBag, Menu } from 'lucide-react'
import { AnnouncementBar } from './AnnouncementBar'
import { MegaMenu } from './MegaMenu'
import { MobileMenu } from './MobileMenu'
import { SearchModal } from './SearchModal'
import { KeniLogo } from '@/components/ui/KeniLogo'

export function Header() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const cartCount = 0 // Placeholder — integrar com Zustand

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 4)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Bloquear scroll ao abrir menu/modal
  useEffect(() => {
    if (mobileMenuOpen || searchOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [mobileMenuOpen, searchOpen])

  return (
    <>
      <AnnouncementBar />

      <header
        className={`keni-header ${isScrolled ? 'keni-header--scrolled' : ''}`}
        role="banner"
      >
        {/* Logo */}
        <Link href="/" aria-label="KENI — Ir para a página inicial" className="keni-header__logo">
          <KeniLogo />
        </Link>

        {/* Mega Menu — desktop */}
        <nav className="keni-header__nav" aria-label="Navegação principal">
          <MegaMenu />
        </nav>

        {/* Ações */}
        <div className="keni-header__actions">
          <button
            onClick={() => setSearchOpen(true)}
            aria-label="Buscar"
            className="keni-header__action-btn"
          >
            <Search size={20} />
          </button>

          <Link href="/conta" aria-label="Minha conta" className="keni-header__action-btn">
            <User size={20} />
          </Link>

          <Link
            href="/carrinho"
            aria-label={`Carrinho${cartCount > 0 ? ` — ${cartCount} itens` : ''}`}
            className="keni-header__action-btn"
            style={{ textDecoration: 'none' }}
          >
            <ShoppingBag size={20} />
            {cartCount > 0 && (
              <span className="keni-header__cart-badge" aria-hidden="true">
                {cartCount}
              </span>
            )}
          </Link>

          {/* Hambúrguer — mobile */}
          <button
            className="keni-header__action-btn keni-header__menu-toggle"
            onClick={() => setMobileMenuOpen(true)}
            aria-label="Abrir menu de navegação"
            aria-expanded={mobileMenuOpen}
          >
            <Menu size={20} />
          </button>
        </div>
      </header>

      {mobileMenuOpen && (
        <MobileMenu onClose={() => setMobileMenuOpen(false)} />
      )}

      {searchOpen && (
        <SearchModal onClose={() => setSearchOpen(false)} />
      )}
    </>
  )
}

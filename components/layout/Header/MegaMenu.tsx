'use client'

import { useState, useRef } from 'react'
import Link from 'next/link'

interface NavColumn {
  label: string
  items: { label: string; href: string; highlight?: boolean }[]
}

interface NavItem {
  label: string
  href?: string
  highlight?: boolean
  children?: NavColumn[]
}

const NAV_ITEMS: NavItem[] = [
  {
    label: 'Novidades',
    children: [
      {
        label: 'Calçados',
        items: [
          { label: 'Tênis de Corrida', href: '/nav/corrida/calcados' },
          { label: 'Tênis Casual', href: '/nav/casual/calcados' },
          { label: 'Chuteiras', href: '/nav/chuteiras' },
          { label: 'Sandálias', href: '/nav/sandalias' },
          { label: 'Ver Tudo em Calçados', href: '/nav/calcados', highlight: true },
        ],
      },
      {
        label: 'Roupas',
        items: [
          { label: 'Camisetas', href: '/nav/camisetas' },
          { label: 'Calças & Leggings', href: '/nav/calcas-leggings' },
          { label: 'Jaquetas', href: '/nav/jaquetas' },
          { label: 'Moletons', href: '/nav/moletons' },
          { label: 'Ver Tudo em Roupas', href: '/nav/roupas', highlight: true },
        ],
      },
      {
        label: 'Acessórios',
        items: [
          { label: 'Bonés & Gorros', href: '/nav/bones-gorros' },
          { label: 'Meias', href: '/nav/meias' },
          { label: 'Mochilas', href: '/nav/mochilas' },
          { label: 'Ver Tudo', href: '/nav/acessorios', highlight: true },
        ],
      },
    ],
  },
  {
    label: 'Masculino',
    children: [
      {
        label: 'Calçados',
        items: [
          { label: 'Tênis', href: '/nav/masculino/calcados' },
          { label: 'Chuteiras', href: '/nav/masculino/chuteiras' },
          { label: 'Sandálias', href: '/nav/masculino/sandalias' },
          { label: 'Ver Tudo', href: '/nav/masculino/calcados', highlight: true },
        ],
      },
      {
        label: 'Roupas',
        items: [
          { label: 'Camisetas', href: '/nav/masculino/camisetas' },
          { label: 'Shorts', href: '/nav/masculino/shorts' },
          { label: 'Moletons', href: '/nav/masculino/moletons' },
          { label: 'Calças', href: '/nav/masculino/calcas' },
          { label: 'Ver Tudo', href: '/nav/masculino/roupas', highlight: true },
        ],
      },
    ],
  },
  {
    label: 'Feminino',
    children: [
      {
        label: 'Calçados',
        items: [
          { label: 'Tênis', href: '/nav/feminino/calcados' },
          { label: 'Chuteiras', href: '/nav/feminino/chuteiras' },
          { label: 'Sandálias', href: '/nav/feminino/sandalias' },
          { label: 'Ver Tudo', href: '/nav/feminino/calcados', highlight: true },
        ],
      },
      {
        label: 'Roupas',
        items: [
          { label: 'Leggings', href: '/nav/feminino/leggings' },
          { label: 'Tops & Sutiãs', href: '/nav/feminino/tops' },
          { label: 'Jaquetas', href: '/nav/feminino/jaquetas' },
          { label: 'Ver Tudo', href: '/nav/feminino/roupas', highlight: true },
        ],
      },
    ],
  },
  {
    label: 'Infantil',
    children: [
      {
        label: 'Por Idade',
        items: [
          { label: 'Bebê (0–2 anos)', href: '/nav/bebe' },
          { label: 'Kids (3–7 anos)', href: '/nav/kids' },
          { label: 'Juvenil (8–15 anos)', href: '/nav/juvenil' },
          { label: 'Ver Tudo', href: '/nav/infantil', highlight: true },
        ],
      },
      {
        label: 'Tipo',
        items: [
          { label: 'Calçados Infantis', href: '/nav/infantil/calcados' },
          { label: 'Roupas Infantis', href: '/nav/infantil/roupas' },
          { label: 'Acessórios Infantis', href: '/nav/infantil/acessorios' },
        ],
      },
    ],
  },
  {
    label: 'Ofertas',
    href: '/nav/outlet',
    highlight: true,
  },
  {
    label: 'Lançamentos',
    href: '/nav/lancamentos',
  },
]

export function MegaMenu() {
  const [activeItem, setActiveItem] = useState<string | null>(null)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleMouseEnter = (label: string) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    setActiveItem(label)
  }

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => setActiveItem(null), 150)
  }

  return (
    <ul
      className="keni-megamenu"
      role="menubar"
      onMouseLeave={handleMouseLeave}
    >
      {NAV_ITEMS.map((item) => {
        const isActive = activeItem === item.label
        return (
          <li
            key={item.label}
            className={`keni-megamenu__item ${isActive ? 'keni-megamenu__item--active' : ''}`}
            role="none"
            onMouseEnter={() => handleMouseEnter(item.label)}
          >
            {item.href ? (
              <Link
                href={item.href}
                className="keni-megamenu__trigger"
                style={item.highlight ? { color: 'var(--keni-color-red-primary)', fontWeight: 700 } : {}}
                role="menuitem"
              >
                {item.label}
              </Link>
            ) : (
              <button
                className="keni-megamenu__trigger"
                role="menuitem"
                aria-haspopup="true"
                aria-expanded={isActive}
              >
                {item.label}
              </button>
            )}

            {/* Dropdown panel */}
            {item.children && isActive && (
              <div
                className="keni-megamenu__panel"
                role="menu"
                onMouseEnter={() => {
                  if (timeoutRef.current) clearTimeout(timeoutRef.current)
                }}
              >
                {item.children.map((col) => (
                  <div key={col.label}>
                    <p className="keni-megamenu__column-title">{col.label}</p>
                    <ul className="keni-megamenu__column-list" role="none">
                      {col.items.map((link) => (
                        <li key={link.label} role="none">
                          <Link
                            href={link.href}
                            className={`keni-megamenu__link ${link.highlight ? 'keni-megamenu__link--see-all' : ''}`}
                            role="menuitem"
                            onClick={() => setActiveItem(null)}
                          >
                            {link.label}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}
          </li>
        )
      })}
    </ul>
  )
}

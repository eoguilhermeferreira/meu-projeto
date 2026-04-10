'use client'

import Link from 'next/link'
import { Heart } from 'lucide-react'

interface Product {
  id: string
  name: string
  subtitle: string
  price: number
  originalPrice?: number
  colors: number
  image: string
  imageAlt: string
  href: string
  badge?: string
  isNew?: boolean
}

const PRODUCTS: Product[] = [
  {
    id: '1',
    name: 'KENI Velocity Pro',
    subtitle: 'Tênis de Corrida',
    price: 649.99,
    colors: 4,
    image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&q=80',
    imageAlt: 'KENI Velocity Pro — tênis de corrida premium',
    href: '/produtos/velocity-pro',
    badge: 'Novo',
    isNew: true,
  },
  {
    id: '2',
    name: 'KENI Street Flow',
    subtitle: 'Tênis Lifestyle',
    price: 449.99,
    colors: 6,
    image: 'https://images.unsplash.com/photo-1608231387042-66d1773d3028?w=600&q=80',
    imageAlt: 'KENI Street Flow — tênis lifestyle urbano',
    href: '/produtos/street-flow',
  },
  {
    id: '3',
    name: 'KENI Terra Force',
    subtitle: 'Tênis Trail Running',
    price: 589.99,
    originalPrice: 749.99,
    colors: 3,
    image: 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=600&q=80',
    imageAlt: 'KENI Terra Force — tênis trail running',
    href: '/produtos/terra-force',
    badge: '-21%',
  },
  {
    id: '4',
    name: 'KENI Air K Classic',
    subtitle: 'Tênis Casual',
    price: 389.99,
    colors: 8,
    image: 'https://images.unsplash.com/photo-1600185365483-26d7a4cc7519?w=600&q=80',
    imageAlt: 'KENI Air K Classic — tênis clássico casual',
    href: '/produtos/air-k-classic',
  },
]

function ProductCard({ product }: { product: Product }) {
  return (
    <article>
      <Link href={product.href} className="product-card">
        <div className="product-card__image-wrap">
          <img
            src={product.image}
            alt={product.imageAlt}
            className="product-card__image"
            loading="lazy"
          />
          {product.badge && (
            <span className="product-card__badge">{product.badge}</span>
          )}
          <button
            className="product-card__wishlist"
            aria-label={`Adicionar ${product.name} aos favoritos`}
            onClick={(e) => {
              e.preventDefault()
              // TODO: integrar wishlist
            }}
          >
            <Heart size={16} />
          </button>
          <button className="quick-add-btn" aria-label={`Adicionar ${product.name} ao carrinho`}>
            Adicionar
          </button>
        </div>

        <h3 className="product-card__name">{product.name}</h3>
        <p className="product-card__subtitle">{product.subtitle}</p>
        <p className="product-card__colors">
          {product.colors} {product.colors === 1 ? 'cor' : 'cores'}
        </p>
        <div className="product-card__price">
          {product.originalPrice && (
            <span className="product-card__price--original">
              R$ {product.originalPrice.toFixed(2).replace('.', ',')}
            </span>
          )}
          <span className={product.originalPrice ? 'product-card__price--sale' : ''}>
            R$ {product.price.toFixed(2).replace('.', ',')}
          </span>
        </div>
      </Link>
    </article>
  )
}

export function FeaturedProducts() {
  return (
    <section className="keni-section">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 32 }}>
        <div>
          <p className="section-label">Destaques</p>
          <h2 className="section-title" style={{ marginBottom: 0 }}>Em Alta</h2>
        </div>
        <Link
          href="/nav/lancamentos"
          className="keni-btn keni-btn--outline-dark"
          style={{ padding: '10px 20px', fontSize: 13 }}
        >
          Ver Tudo
        </Link>
      </div>

      <div className="product-grid">
        {PRODUCTS.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  )
}

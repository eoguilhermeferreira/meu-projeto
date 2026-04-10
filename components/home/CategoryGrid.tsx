import Link from 'next/link'

interface CategoryItem {
  label: string
  href: string
  image: string
  imageAlt: string
}

const CATEGORIES: CategoryItem[] = [
  {
    label: 'Masculino',
    href: '/nav/masculino',
    image: 'https://images.unsplash.com/photo-1571945192935-7ba7dc8c5d49?w=600&q=80',
    imageAlt: 'Tênis masculino KENI',
  },
  {
    label: 'Feminino',
    href: '/nav/feminino',
    image: 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=600&q=80',
    imageAlt: 'Tênis feminino KENI',
  },
  {
    label: 'Corrida',
    href: '/nav/corrida',
    image: 'https://images.unsplash.com/photo-1508215885820-4585e56135c8?w=600&q=80',
    imageAlt: 'Tênis de corrida KENI',
  },
  {
    label: 'Infantil',
    href: '/nav/infantil',
    image: 'https://images.unsplash.com/photo-1607522370275-f6fd21bcfe59?w=600&q=80',
    imageAlt: 'Tênis infantil KENI',
  },
]

export function CategoryGrid() {
  return (
    <section className="keni-section">
      <p className="section-label">Explore</p>
      <h2 className="section-title">Categorias</h2>

      <div className="category-grid">
        {CATEGORIES.map((cat) => (
          <Link key={cat.label} href={cat.href} className="category-card">
            <img
              src={cat.image}
              alt={cat.imageAlt}
              className="category-card__image"
              loading="lazy"
            />
            <div className="category-card__overlay" aria-hidden="true" />
            <span className="category-card__label">{cat.label}</span>
          </Link>
        ))}
      </div>
    </section>
  )
}

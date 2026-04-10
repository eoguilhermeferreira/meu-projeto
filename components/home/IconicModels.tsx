import Link from 'next/link'

interface IconModel {
  name: string
  href: string
  image: string
  imageAlt: string
}

const MODELS: IconModel[] = [
  {
    name: 'Velocity Pro',
    href: '/nav/velocity-pro',
    image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&q=80',
    imageAlt: 'KENI Velocity Pro',
  },
  {
    name: 'Street Flow',
    href: '/nav/street-flow',
    image: 'https://images.unsplash.com/photo-1608231387042-66d1773d3028?w=400&q=80',
    imageAlt: 'KENI Street Flow',
  },
  {
    name: 'Air K Classic',
    href: '/nav/air-k-classic',
    image: 'https://images.unsplash.com/photo-1600185365483-26d7a4cc7519?w=400&q=80',
    imageAlt: 'KENI Air K Classic',
  },
  {
    name: 'Terra Force',
    href: '/nav/terra-force',
    image: 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=400&q=80',
    imageAlt: 'KENI Terra Force',
  },
  {
    name: 'Sprint Zero',
    href: '/nav/sprint-zero',
    image: 'https://images.unsplash.com/photo-1552346154-21d32810aba3?w=400&q=80',
    imageAlt: 'KENI Sprint Zero',
  },
  {
    name: 'Urban Edge',
    href: '/nav/urban-edge',
    image: 'https://images.unsplash.com/photo-1516478177764-9fe5bd7e9717?w=400&q=80',
    imageAlt: 'KENI Urban Edge',
  },
]

export function IconicModels() {
  return (
    <section className="keni-section" style={{ background: 'var(--keni-neutral-50)', maxWidth: 'none', padding: 'var(--keni-space-16) var(--keni-space-8)' }}>
      <div style={{ maxWidth: 1280, margin: '0 auto' }}>
        <p className="section-label">Ícones KENI</p>
        <h2 className="section-title">Modelos Clássicos</h2>

        <div className="icon-models">
          {MODELS.map((model) => (
            <Link key={model.name} href={model.href} className="icon-model-card">
              <img
                src={model.image}
                alt={model.imageAlt}
                className="icon-model-card__image"
                loading="lazy"
              />
              <span className="icon-model-card__name">{model.name}</span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}

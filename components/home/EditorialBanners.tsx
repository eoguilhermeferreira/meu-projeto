import Link from 'next/link'

export function EditorialBanners() {
  return (
    <section className="keni-section keni-section--full" style={{ padding: '0 var(--keni-space-6) var(--keni-space-16)' }}>
      <div style={{ maxWidth: 1280, margin: '0 auto' }}>
        {/* Full width banner */}
        <div
          className="editorial-banner editorial-banner--full"
          style={{
            borderRadius: 'var(--keni-radius-md)',
            overflow: 'hidden',
            aspectRatio: '21/7',
            marginBottom: 'var(--keni-space-4)',
            minHeight: 280,
          }}
        >
          <img
            src="https://images.unsplash.com/photo-1556906781-9a414e2a9c86?w=1600&q=80"
            alt="Coleção KENI Running Season 2026"
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            loading="lazy"
          />
          <div className="editorial-banner__content">
            <p className="editorial-banner__eyebrow">Running Season 2026</p>
            <h2 className="editorial-banner__title">
              CORRA MAIS<br />LONGE
            </h2>
            <Link href="/nav/corrida" className="keni-btn keni-btn--primary" style={{ alignSelf: 'flex-start' }}>
              Explorar Corrida
            </Link>
          </div>
        </div>

        {/* Dual banners */}
        <div className="dual-banner">
          <div className="dual-banner__item">
            <img
              src="https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800&q=80"
              alt="Coleção Feminina KENI"
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
              loading="lazy"
            />
            <div className="editorial-banner__content">
              <p className="editorial-banner__eyebrow">Coleção Feminina</p>
              <h3 className="editorial-banner__title">
                MOVE<br />FREE
              </h3>
              <Link href="/nav/feminino" className="keni-btn keni-btn--outline" style={{ alignSelf: 'flex-start' }}>
                Ver Feminino
              </Link>
            </div>
          </div>

          <div className="dual-banner__item">
            <img
              src="https://images.unsplash.com/photo-1571945192935-7ba7dc8c5d49?w=800&q=80"
              alt="Outlet KENI — até 40% de desconto"
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
              loading="lazy"
            />
            <div className="editorial-banner__content">
              <p className="editorial-banner__eyebrow">Outlet — Até 40% Off</p>
              <h3 className="editorial-banner__title">
                PREÇOS<br />ÉPICOS
              </h3>
              <Link href="/nav/outlet" className="keni-btn keni-btn--red" style={{ alignSelf: 'flex-start' }}>
                Ver Ofertas
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

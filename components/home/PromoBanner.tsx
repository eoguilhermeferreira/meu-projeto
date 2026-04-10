export function PromoBanner() {
  return (
    <div className="promo-strip" role="note" aria-label="Promoção ativa">
      <strong>BLACK KENI</strong> — Até 50% OFF em produtos selecionados.{' '}
      <a
        href="/nav/outlet"
        style={{ color: 'inherit', fontWeight: 700, textDecoration: 'underline' }}
      >
        Aproveitar agora
      </a>
    </div>
  )
}

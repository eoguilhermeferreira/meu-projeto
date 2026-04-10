import Link from 'next/link'
import { Globe, Play, Share2 } from 'lucide-react'
import { KeniLogo } from '@/components/ui/KeniLogo'

const footerLinks = [
  {
    title: 'Empresa',
    items: [
      { label: 'Sobre a KENI', href: '/sobre' },
      { label: 'Trabalhe Conosco', href: '/carreiras' },
      { label: 'Imprensa', href: '/imprensa' },
      { label: 'Sustentabilidade', href: '/sustentabilidade' },
    ],
  },
  {
    title: 'Ajuda',
    items: [
      { label: 'Central de Ajuda', href: '/ajuda' },
      { label: 'Status do Pedido', href: '/pedido/status' },
      { label: 'Trocas e Devoluções', href: '/trocas' },
      { label: 'Guia de Tamanhos', href: '/tamanhos' },
      { label: 'Contato', href: '/contato' },
    ],
  },
  {
    title: 'Loja',
    items: [
      { label: 'Lançamentos', href: '/nav/lancamentos' },
      { label: 'Masculino', href: '/nav/masculino' },
      { label: 'Feminino', href: '/nav/feminino' },
      { label: 'Infantil', href: '/nav/infantil' },
      { label: 'Outlet', href: '/nav/outlet' },
    ],
  },
  {
    title: 'Conta',
    items: [
      { label: 'Minha Conta', href: '/conta' },
      { label: 'Favoritos', href: '/conta/favoritos' },
      { label: 'Meus Pedidos', href: '/conta/pedidos' },
      { label: 'Cartão Presente', href: '/sc/cartao-presente' },
      { label: 'App KENI', href: '/app' },
    ],
  },
]

const paymentMethods = ['Visa', 'Master', 'Pix', 'Boleto', 'Amex']

export function Footer() {
  return (
    <footer className="keni-footer" role="contentinfo">
      <div className="keni-footer__grid">
        {footerLinks.map((col) => (
          <div key={col.title}>
            <h3 className="keni-footer__col-title">{col.title}</h3>
            <ul className="keni-footer__links">
              {col.items.map((item) => (
                <li key={item.label}>
                  <Link href={item.href} className="keni-footer__link">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* Bottom bar */}
      <div className="keni-footer__bottom" style={{ maxWidth: 1280, margin: '40px auto 0', padding: '24px 0 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
          <KeniLogo color="#ffffff" width={48} />
          <p className="keni-footer__legal">
            © 2026 KENI Artigos Esportivos Ltda. Todos os direitos reservados.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
          {/* Pagamentos */}
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {paymentMethods.map((method) => (
              <span
                key={method}
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  background: 'var(--keni-neutral-700)',
                  color: 'var(--keni-neutral-300)',
                  padding: '3px 8px',
                  borderRadius: 4,
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                }}
              >
                {method}
              </span>
            ))}
          </div>

          {/* Social */}
          <div className="keni-footer__social">
            <a
              href="https://instagram.com"
              target="_blank"
              rel="noopener noreferrer"
              className="keni-footer__social-btn"
              aria-label="KENI no Instagram (nova aba)"
            >
              <Globe size={16} />
            </a>
            <a
              href="https://youtube.com"
              target="_blank"
              rel="noopener noreferrer"
              className="keni-footer__social-btn"
              aria-label="KENI no YouTube (nova aba)"
            >
              <Play size={16} />
            </a>
            <a
              href="https://twitter.com"
              target="_blank"
              rel="noopener noreferrer"
              className="keni-footer__social-btn"
              aria-label="KENI no X / Twitter (nova aba)"
            >
              <Share2 size={16} />
            </a>
          </div>
        </div>
      </div>

      {/* Legal links */}
      <div style={{
        maxWidth: 1280,
        margin: '0 auto',
        paddingTop: 16,
        display: 'flex',
        gap: 16,
        flexWrap: 'wrap',
      }}>
        {['Política de Privacidade', 'Termos de Uso', 'Política de Cookies', 'LGPD'].map((item) => (
          <Link
            key={item}
            href="#"
            style={{ fontSize: 11, color: 'var(--keni-neutral-600)', textDecoration: 'none' }}
          >
            {item}
          </Link>
        ))}
      </div>
    </footer>
  )
}

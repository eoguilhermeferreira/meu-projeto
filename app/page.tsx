import { Header } from '@/components/layout/Header/Header'
import { Footer } from '@/components/layout/Footer/Footer'
import { HeroCarousel } from '@/components/home/HeroCarousel'
import { CategoryGrid } from '@/components/home/CategoryGrid'
import { FeaturedProducts } from '@/components/home/FeaturedProducts'
import { EditorialBanners } from '@/components/home/EditorialBanners'
import { IconicModels } from '@/components/home/IconicModels'
import { Newsletter } from '@/components/home/Newsletter'
import { PromoBanner } from '@/components/home/PromoBanner'

export default function HomePage() {
  return (
    <>
      <Header />
      <main id="main-content">
        <HeroCarousel />
        <PromoBanner />
        <CategoryGrid />
        <FeaturedProducts />
        <EditorialBanners />
        <IconicModels />
        <Newsletter />
      </main>
      <Footer />
    </>
  )
}

import type { Metadata } from 'next'

import { getHomeData } from '@/lib/home'
import { HeroBanner } from '@/components/storefront/HeroBanner'
import { SectionHeading } from '@/components/storefront/SectionHeading'
import { ProductCard } from '@/components/storefront/ProductCard'
import { CategoryCard } from '@/components/storefront/CategoryCard'
import { Button } from '@/components/ui/button'
import React from 'react'
import Link from 'next/link'

export const metadata: Metadata = {
  title: {
    default: 'Spartacus | Premium Activewear',
    template: '%s | Spartacus',
  },
  description:
    'Spartacus — premium activewear and gym clothing engineered for the modern athlete.',
}

export default async function HomePage() {
  const { products, categories } = await getHomeData()

  const heroProducts = products.slice(0, 3)
  const heroImage =
    heroProducts[0]?.gallery?.[0]?.image && typeof heroProducts[0].gallery[0].image !== 'string'
      ? heroProducts[0].gallery[0].image
      : null

  const bestSellers = products.slice(0, 4)

  return (
    <div className="flex flex-col">
      <HeroBanner
        eyebrow="New Drop"
        title="Forge your strongest self"
        subtitle="High-performance activewear engineered for training that demands more. Cut, fit and fabric built to move with you."
        image={heroImage}
        primaryLabel="Shop the collection"
        primaryHref="/products"
        secondaryLabel="Explore"
        secondaryHref="#collections"
      />

      {/* Best sellers */}
      <section className="mx-auto w-full max-w-7xl px-6 py-16 md:px-12">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <SectionHeading eyebrow="Most wanted" title="Best Sellers" />
          <Button asChild variant="ghost" className="mb-8 text-sm">
            <Link href="/products">View all →</Link>
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-x-6 gap-y-10 md:grid-cols-4">
          {bestSellers.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      {/* Promotional banner */}
      <section className="mx-auto w-full max-w-7xl px-6 pb-16 md:px-12">
        <div className="relative overflow-hidden rounded-lg bg-neutral-950 px-8 py-14 text-center text-white md:py-20">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(190,40,34,0.35),transparent_60%)]" />
          <div className="relative z-10 flex flex-col items-center gap-4">
            <span className="text-xs font-semibold uppercase tracking-[0.3em] text-brand">
              Members only
            </span>
            <h2 className="max-w-xl text-3xl font-black uppercase leading-tight md:text-5xl">
              Unleash the drop
            </h2>
            <p className="max-w-md text-sm text-white/70 md:text-base">
              Join the Spartacus community for early access to drops and special offers.
            </p>
            <Button asChild size="lg" className="mt-2 bg-brand text-white hover:bg-brand/90">
              <Link href="/create-account">Join now</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Collections */}
      <section id="collections" className="mx-auto w-full max-w-7xl px-6 pb-20 md:px-12">
        <SectionHeading eyebrow="Shop by category" title="Discover more" />
        <div className="grid grid-cols-2 gap-5 md:grid-cols-4">
          {categories.map((category) => (
            <CategoryCard key={category.id} category={category} />
          ))}
        </div>
      </section>
    </div>
  )
}
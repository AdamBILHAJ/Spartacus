import type { Media, Product, Variant } from '@/payload-types'

import { Media as MediaComponent } from '@/components/Media'
import { Price } from '@/components/Price'
import Link from 'next/link'
import React from 'react'

export type ProductCardProps = {
  product: Partial<Product>
  className?: string
}

/**
 * Storefront product tile used in grids on the home page and PLP.
 * Maps directly onto the Payload `Product` type.
 */
export function ProductCard({ product, className }: ProductCardProps) {
  const image =
    product.gallery?.[0]?.image && typeof product.gallery[0].image !== 'string'
      ? product.gallery[0].image
      : ((product.meta?.image as Media | undefined) ?? null)

  const variants = product.variants?.docs
  const basePrice = product.priceInUSD

  let price = basePrice

  if (variants && variants.length > 0) {
    const variant = variants[0] as Variant | undefined
    if (variant && typeof variant.priceInUSD === 'number') price = variant.priceInUSD
  }

  return (
    <Link
      className={className ?? 'group flex flex-col gap-3'}
      href={`/products/${product.slug}`}
    >
      <div className="relative aspect-square w-full overflow-hidden rounded-lg bg-muted">
        {image ? (
          <MediaComponent
            className="h-full w-full"
            imgClassName="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
            resource={image}
          />
        ) : null}
      </div>

      <div className="flex items-start justify-between gap-4">
        <p className="line-clamp-2 flex-1 text-sm font-medium leading-snug text-foreground">
          {product.title}
        </p>
        {typeof price === 'number' ? (
          <Price amount={price} className="text-sm font-semibold text-foreground" />
        ) : null}
      </div>
    </Link>
  )
}
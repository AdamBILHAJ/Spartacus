import type { Category } from '@/payload-types'

import Link from 'next/link'
import React from 'react'

export type CategoryCardProps = {
  category: Category
  image?: MediaImage
  priority?: boolean
}

type MediaImage = {
  url?: string | null
  alt?: string | null
}

/**
 * Promotional category tile linking to the filtered product listing.
 * Accepts an optional media object for the backdrop image.
 */
export function CategoryCard({ category, image, priority }: CategoryCardProps) {
  const hasImage = Boolean(image?.url)

  return (
    <Link
      className="group relative block overflow-hidden rounded-lg bg-muted"
      href={`/products?category=${category.id}`}
    >
      <div className="aspect-[4/5] w-full">
        {hasImage && image?.url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            alt={image.alt || category.title}
            className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
            loading={priority ? 'eager' : 'lazy'}
            src={image.url}
          />
        ) : null}
      </div>

      <div className="absolute inset-0 flex items-end bg-gradient-to-t from-black/70 via-black/10 to-transparent p-5">
        <div>
          <h3 className="text-lg font-semibold uppercase tracking-[0.15em] text-white">
            {category.title}
          </h3>
          <span className="mt-1 inline-flex items-center text-xs font-medium uppercase tracking-widest text-white/80 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
            Shop now →
          </span>
        </div>
      </div>
    </Link>
  )
}
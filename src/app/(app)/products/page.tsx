import type { Metadata } from 'next'

import { ProductCard } from '@/components/storefront/ProductCard'
import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { Where } from 'payload'
import React from 'react'

export const metadata: Metadata = {
  title: 'Shop',
  description: 'Browse the full Spartacus activewear collection.',
}

type SearchParams = { [key: string]: string | string[] | undefined }

type Props = {
  searchParams: Promise<SearchParams>
}

export default async function ProductsPage({ searchParams }: Props) {
  const { q: searchValue, sort, category } = await searchParams
  const payload = await getPayload({ config: configPromise })

  let searchProductIDs: (string | number)[] | null = null

  if (searchValue) {
    const searchResults = await payload.find({
      collection: 'search',
      draft: false,
      overrideAccess: false,
      limit: 200,
      where: {
        title: {
          like: searchValue,
        },
      },
    })

    searchProductIDs = searchResults.docs
      .map((doc) => {
        const value = typeof doc.doc === 'object' ? doc.doc?.value : doc.doc
        return value && typeof value === 'object' ? value.id : value
      })
      .filter((id): id is number => typeof id === 'number')
  }

  const whereConditions: Where[] = [{ _status: { equals: 'published' } }]

  if (category) {
    whereConditions.push({ categories: { contains: category } })
  }

  if (searchValue) {
    if (searchProductIDs && searchProductIDs.length > 0) {
      whereConditions.push({ id: { in: searchProductIDs } })
    } else {
      whereConditions.push({ title: { like: searchValue } })
    }
  }

  const products = await payload.find({
    collection: 'products',
    draft: false,
    overrideAccess: false,
    select: {
      title: true,
      slug: true,
      gallery: true,
      categories: true,
      meta: true,
      priceInUSD: true,
      priceInUSDEnabled: true,
    },
    where: {
      and: whereConditions,
    },
    ...(sort ? { sort } : { sort: 'title' }),
  })

  const resultsText = products.docs.length > 1 ? 'results' : 'result'

  return (
    <div>
      {searchValue ? (
        <p className="mb-4 text-sm text-muted-foreground">
          {products.docs?.length === 0
            ? 'There are no products that match '
            : `Showing ${products.docs.length} ${resultsText} for `}
          <span className="font-bold text-foreground">&quot;{searchValue}&quot;</span>
        </p>
      ) : null}

      {!searchValue && products.docs?.length === 0 && (
        <p className="mb-4 text-sm text-muted-foreground">
          No products found. Please try different filters.
        </p>
      )}

      {products?.docs.length > 0 ? (
        <div className="grid grid-cols-2 gap-x-6 gap-y-10 lg:grid-cols-3">
          {products.docs.map((product) => {
            return <ProductCard key={product.id} product={product} />
          })}
        </div>
      ) : null}
    </div>
  )
}
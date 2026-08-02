import { Grid } from '@/components/Grid'
import { ProductGridItem } from '@/components/ProductGridItem'
import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { Where } from 'payload'
import React from 'react'

export const metadata = {
  description: 'Search for products in the store.',
  title: 'Shop',
}

type SearchParams = { [key: string]: string | string[] | undefined }

type Props = {
  searchParams: Promise<SearchParams>
}

export default async function ShopPage({ searchParams }: Props) {
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

    // Map out extracted doc IDs from search results
    searchProductIDs = searchResults.docs
      .map((doc) => {
        const value = typeof doc.doc === 'object' ? doc.doc?.value : doc.doc
        return value && typeof value === 'object' ? value.id : value
      })
      .filter((id): id is number => typeof id === 'number')
  }

  // Build conditional filters dynamically
  const whereConditions: Where[] = [{ _status: { equals: 'published' } }]

  if (category) {
    whereConditions.push({ categories: { contains: category } })
  }

  if (searchValue) {
    if (searchProductIDs && searchProductIDs.length > 0) {
      whereConditions.push({ id: { in: searchProductIDs } })
    } else {
      // Fallback: direct title search on products if search collection is empty or out of sync
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
      priceInUSD: true,
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
        <p className="mb-4">
          {products.docs?.length === 0
            ? 'There are no products that match '
            : `Showing ${products.docs.length} ${resultsText} for `}
          <span className="font-bold">&quot;{searchValue}&quot;</span>
        </p>
      ) : null}

      {!searchValue && products.docs?.length === 0 && (
        <p className="mb-4">No products found. Please try different filters.</p>
      )}

      {products?.docs.length > 0 ? (
        <Grid className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.docs.map((product) => {
            return <ProductGridItem key={product.id} product={product} />
          })}
        </Grid>
      ) : null}
    </div>
  )
}
import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { unstable_cache } from 'next/cache'

type HomeData = {
  products: any[]
  categories: any[]
}

const fetchHomeData = async () => {
  const payload = await getPayload({ config: configPromise })

  const [products, categories] = await Promise.all([
    payload.find({
      collection: 'products',
      depth: 2,
      limit: 8,
      overrideAccess: false,
      sort: '-createdAt',
      where: { _status: { equals: 'published' } },
    }),
    payload.find({
      collection: 'categories',
      depth: 1,
      limit: 12,
      overrideAccess: false,
      sort: 'title',
    }),
  ])

  return {
    products: products.docs as any[],
    categories: categories.docs as any[],
  } satisfies HomeData
}

// Cache the storefront data so the CMS keeps the storefront in sync
// without forcing a rebuild on every deploy.
export const getHomeData = () =>
  unstable_cache(fetchHomeData, ['spartacus-home'], { revalidate: 300 })()
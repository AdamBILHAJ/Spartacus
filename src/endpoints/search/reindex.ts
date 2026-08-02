import type { Payload, PayloadRequest } from 'payload'
import type { Product } from '@/payload-types'
import { convertLexicalToPlaintext } from '@payloadcms/richtext-lexical/plaintext'

// Mirrors the `beforeSync` used by `@payloadcms/plugin-search` in `src/plugins/index.ts`
// so fields written during a manual re-index match what the plugin produces on change.
const toSearchDocument = (doc: Partial<Product>) => {
  const plainTextDescription = doc.description
    ? convertLexicalToPlaintext(doc.description as unknown as any)
    : ''

  return {
    title: doc.title || '',
    description: plainTextDescription,
  }
}

export const reindexSearch = async ({
  payload,
  req,
}: {
  payload: Payload
  req: PayloadRequest
}): Promise<{ indexed: number; skipped: number }> => {
  payload.logger.info('Re-indexing products into the search collection...')

  const PAGE_SIZE = 100
  let indexed = 0
  let skipped = 0
  let page = 1
  let hasNextPage = true

  while (hasNextPage) {
    const result = await payload.find({
      collection: 'products',
      req,
      draft: false,
      overrideAccess: true,
      limit: PAGE_SIZE,
      page,
      where: {
        _status: {
          equals: 'published',
        },
      },
    })

    for (const product of result.docs) {
      const existing = await payload.find({
        collection: 'search',
        req,
        draft: false,
        overrideAccess: true,
        limit: 1,
        where: {
          'doc.relationTo': {
            equals: 'products',
          },
          'doc.value': {
            equals: product.id,
          },
        },
      })

      const searchData = {
        ...toSearchDocument(product),
        doc: {
          relationTo: 'products' as const,
          value: product.id,
        },
        priority: 0,
      }

      if (existing.docs.length > 0) {
        await payload.update({
          collection: 'search',
          req,
          id: existing.docs[0].id,
          data: searchData,
        })
      } else {
        await payload.create({
          collection: 'search',
          req,
          data: searchData,
        })
      }

      indexed += 1
    }

    skipped += PAGE_SIZE - result.docs.length
    hasNextPage = result.hasNextPage
    page += 1
  }

  payload.logger.info(`Indexed ${indexed} products into the search collection.`)

  return { indexed, skipped }
}
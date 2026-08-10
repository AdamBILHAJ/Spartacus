import { getPayload } from 'payload'
import config from '../../src/payload.config.js'

/**
 * Seeds (and cleans up) a *published* Page with slug `404`.
 *
 * This is used to verify that an unauthorized request to /admin still returns a
 * hard 404 even when a real CMS page exists at /404 — i.e. the proxy returns an
 * explicit 404 status instead of rewriting to /404, so a slug-404 page can
 * never turn an unauthorized admin request into a 200 with real content.
 */
export async function seedSlug404Page(): Promise<number> {
  const payload = await getPayload({ config })

  await deleteSlug404Page(payload)

  const page = await payload.create({
    collection: 'pages',
    overrideAccess: true,
    // disableRevalidate keeps the Pages `afterChange` revalidatePage hook from
    // calling revalidatePath(), which throws outside a Next render context
    // ("static generation store missing") when seeding from the CLI e2e runner.
    context: { disableRevalidate: true },
    data: {
      title: 'Not Found Mask',
      slug: '404',
      _status: 'published',
      hero: {
        type: 'lowImpact',
      },
      layout: [{ blockType: 'cta' }],
    },
  })

  return page.id
}

export async function cleanupSlug404Page(): Promise<void> {
  const payload = await getPayload({ config })
  await deleteSlug404Page(payload)
}

async function deleteSlug404Page(payload: Awaited<ReturnType<typeof getPayload>>): Promise<void> {
  await payload.delete({
    collection: 'pages',
    overrideAccess: true,
    context: { disableRevalidate: true },
    where: {
      slug: {
        equals: '404',
      },
    },
  })
}
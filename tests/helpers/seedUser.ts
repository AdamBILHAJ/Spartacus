import { getPayload } from 'payload'
import config from '../../src/payload.config.js'

export interface SeedTestUserOptions {
  email?: string
  password?: string
  roles?: ('admin' | 'customer')[]
}

export const testUser = {
  email: 'dev@payloadcms.com',
  password: 'test',
  // The proxy gate requires the `roles` claim to include `admin`, so the
  // seeded test user must be an admin or every /admin request returns 404.
  roles: ['admin'] as ('admin' | 'customer')[],
}

function resolveUser(options: SeedTestUserOptions = {}) {
  return {
    email: options.email ?? testUser.email,
    password: options.password ?? testUser.password,
    roles: options.roles ?? testUser.roles,
  }
}

/**
 * Seeds a test user for e2e tests (defaults to `testUser` if no options).
 *
 * IMPORTANT: this uses Payload's trusted local API with `overrideAccess: true`.
 * It must NOT be routed through the public REST create endpoint — the `roles`
 * field on the Users collection is guarded by `adminOnlyFieldAccess`, so a
 * public/unauthenticated create silently strips the admin role and the seeded
 * user would be created without admin privileges (every admin-only API call
 * such as /api/variantTypes would then correctly return 403).
 */
export async function seedTestUser(options: SeedTestUserOptions = {}): Promise<void> {
  const payload = await getPayload({ config })
  const data = resolveUser(options)

  // Delete existing test user if any
  await payload.delete({
    collection: 'users',
    where: {
      email: {
        equals: data.email,
      },
    },
  })

  // Create fresh test user.
  // overrideAccess bypasses the admin-only field access on `roles`, which is
  // required because no admin exists yet at seed time (the payload.create with
  // default access is public for create, but the roles field itself is locked
  // down to admins only).
  await payload.create({
    collection: 'users',
    data,
    overrideAccess: true,
  })
}

/**
 * Cleans up a test user after tests (defaults to `testUser` if no options).
 */
export async function cleanupTestUser(options: SeedTestUserOptions = {}): Promise<void> {
  const payload = await getPayload({ config })
  const data = resolveUser(options)

  await payload.delete({
    collection: 'users',
    where: {
      email: {
        equals: data.email,
      },
    },
  })
}
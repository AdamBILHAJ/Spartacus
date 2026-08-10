import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { checkRole } from '@/access/utilities'

/**
 * Secures the Payload CMS admin panel behind the shared login endpoint.
 *
 * Every user (customer and admin) logs in through the same Payload auth flow,
 * which issues a signed JWT in the `payload-token` cookie backed by a DB
 * session (`sid`). This proxy guards the `/admin` surface so ONLY users whose
 * current session claims the `admin` role can reach the CMS. Everyone else —
 * no cookie, expired/invalid cookie, a revoked session, or a valid customer
 * session — receives a 404 (never a redirect, so the CMS surface stays hidden).
 *
 * We delegate authentication to Payload's own `payload.auth()` rather than
 * verifying the JWT signature by hand. This is deliberate:
 *  - Payload validates the HS256 signature against PAYLOAD_SECRET.
 *  - Payload ALSO checks that the JWT's `sid` claim still maps to an active DB
 *    session, so a revoked session is rejected at the edge instead of being
 *    accepted for up to 14 days purely on signature validity.
 *
 * The `roles` field on Users is marked `saveToJWT: true`, so `payload.auth()`
 * returns the `roles` claim the admin gate relies on.
 *
 * NOTE: This file runs on the Node.js Proxy runtime (Next.js 16 default), not
 * Edge — it instantiates Payload and touches the DB on every /admin request,
 * which is only possible on the Node runtime.
 */
let payload: Awaited<ReturnType<typeof getPayload>> | null = null

// Fail loudly instead of silently rejecting every /admin request. If this
// throws at module load the build/dev server refuses to start; if the module
// is only evaluated lazily it throws on the first /admin request.
if (!process.env.PAYLOAD_SECRET) {
  throw new Error(
    '[proxy] PAYLOAD_SECRET is not set. Refusing to run the /admin gate because every ' +
      'request would be rejected regardless of validity. Set PAYLOAD_SECRET (must match the ' +
      'secret used by the Payload config) before deploying.',
  )
}

async function getAdminPayload() {
  payload ??= await getPayload({ config: configPromise })

  return payload
}

export default async function proxy(request: NextRequest) {
  const { user } = await (await getAdminPayload()).auth({ headers: request.headers })

  // No user -> anonymous, expired, invalid, or revoked session -> 404.
  // This applies to `/admin/login` too: admins authenticate through the unified
  // storefront login (`/login` or `/api/users/login`), never the Payload UI,
  // so the CMS entry point stays fully hidden from public view.
  if (!user) {
    return unauthorized()
  }

  // Fail closed: only a user holding an active admin session passes.
  if (!checkRole(['admin'], user)) {
    return unauthorized()
  }

  return NextResponse.next()
}

// Real 404 with a plain body. Intentionally NOT a rewrite to /404: a CMS page
// could be published under slug `404`, and rewriting would turn an unauthorized
// admin request into a 200 with that page's real content.
function unauthorized() {
  return new NextResponse('Not Found', { status: 404 })
}

export const config = {
  matcher: ['/admin/:path*'],
}
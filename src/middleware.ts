import { NextResponse, type NextRequest } from 'next/server'
import jwt from 'jsonwebtoken'

/**
 * Secures the Payload CMS admin panel behind the shared login endpoint.
 *
 * Every user (customer and admin) logs in through the same Payload auth flow,
 * which issues a signed JWT in the `payload-token` cookie. This middleware
 * guards the `/admin` surface so ONLY users whose token carries the `admin`
 * role can reach the CMS. Everyone else — no cookie, expired/invalid cookie,
 * or a valid customer session — receives a 404 (never a redirect).
 *
 * Token shape (HS256, signed by Payload with PAYLOAD_SECRET):
 *   {
 *     id, collection: 'users', email,
 *     roles: ['admin' | 'customer', ...]  // only present because the `roles`
 *                                         // field in Users is marked saveToJWT
 *   }
 *
 * We verify the HS256 signature before trusting any claim. A base64 "decode"
 * alone would be forgeable; `jwt.verify` fails closed on tampered tokens.
 */
export function middleware(request: NextRequest) {
  const token = request.cookies.get('payload-token')?.value

  // No token → anonymous or unauthenticated → 404.
  // This applies to `/admin/login` too: admins authenticate through the unified
  // storefront login (`/login` or `/api/users/login`), never the Payload UI,
  // so the CMS entry point stays fully hidden from public view.
  if (!token) {
    return notFound(request)
  }

  const secret = process.env.PAYLOAD_SECRET

  try {
    // Verify signature + expiry, restrict algorithm to HS256 (matches Payload's
    // SignJWT HS256). Throws on tampering, wrong secret, or expired tokens.
    const decoded = jwt.verify(token, secret || '', { algorithms: ['HS256'] })

    if (typeof decoded !== 'object' || decoded === null) {
      return notFound(request)
    }

    const { collection, roles } = decoded as { collection?: string; roles?: string[] }

    // Fail closed: only a token from the `users` collection that explicitly
    // claims the `admin` role passes.
    if (collection !== 'users' || !Array.isArray(roles) || !roles.includes('admin')) {
      return notFound(request)
    }

    return NextResponse.next()
  } catch {
    // Invalid signature, expired token, or any verification error → 404.
    return notFound(request)
  }
}

// Render the 404 page for the original request URL without leaking that the
// path exists (keeps the CMS surface hidden from probing).
function notFound(request: NextRequest) {
  return NextResponse.rewrite(new URL('/404', request.url))
}

export const config = {
  matcher: ['/admin/:path*'],
  // jsonwebtoken relies on Node's crypto; the Edge runtime cannot run it.
  runtime: 'nodejs',
}

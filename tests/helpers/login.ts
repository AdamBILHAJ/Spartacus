import type { Page } from '@playwright/test'
import { expect } from '@playwright/test'

export interface LoginOptions {
  page: Page
  serverURL?: string
  user: {
    email: string
    password: string
  }
}

/**
 * Authenticates the user against the shared Payload auth endpoint and stores
 * the resulting `payload-token` session cookie in the browser context.
 *
 * /admin/login (the Payload admin UI login) is intentionally gated behind the
 * proxy and returns 404, so all authentication must happen through the unified
 * storefront login API instead.
 */
export async function login({
  page,
  serverURL = 'http://localhost:3000',
  user,
}: LoginOptions): Promise<void> {
  const response = await page.request.post(`${serverURL}/api/users/login`, {
    data: {
      email: user.email,
      password: user.password,
    },
  })

  expect(response.ok()).toBe(true)

  // Set-Cookie from the login response is applied to the shared browser context.
  expect((await page.context().cookies()).some((c) => c.name === 'payload-token')).toBe(true)
}
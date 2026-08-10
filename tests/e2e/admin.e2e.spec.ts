import { test, expect, Page } from '@playwright/test'
import { login } from '../helpers/login'
import { seedTestUser, cleanupTestUser, testUser } from '../helpers/seedUser'
import { seedSlug404Page, cleanupSlug404Page } from '../helpers/seedPage404'

test.describe('Admin Panel', () => {
  // The Payload admin panel is compiled on-demand in dev; the first navigation
  // triggers a full Turbopack compile that can exceed Playwright's 30s default.
  test.setTimeout(180_000)

  let page: Page

  test.beforeAll(async ({ browser }, testInfo) => {
    await seedTestUser()

    const context = await browser.newContext()
    page = await context.newPage()

    await login({ page, user: testUser })
  })

  test.afterAll(async () => {
    await cleanupTestUser()
  })

  test('can navigate to dashboard', async () => {
    // Warm-up request: triggers the on-demand Turbopack compile of the admin
    // panel server-side so the browser navigation below completes quickly.
    await page.request.get('http://localhost:3000/admin')

    await page.goto('http://localhost:3000/admin', { waitUntil: 'domcontentloaded' })
    await expect(page).toHaveURL('http://localhost:3000/admin')
    const dashboardArtifact = page.locator('span[title="Dashboard"]').first()
    await expect(dashboardArtifact).toBeVisible()
  })

  test('can navigate to list view', async () => {
    await page.goto('http://localhost:3000/admin/collections/users', {
      waitUntil: 'domcontentloaded',
    })
    await expect(page).toHaveURL('http://localhost:3000/admin/collections/users')
    const listViewArtifact = page.locator('h1', { hasText: 'Users' }).first()
    await expect(listViewArtifact).toBeVisible()
  })

  test('can navigate to edit view', async () => {
    await page.goto('http://localhost:3000/admin/collections/users/create', {
      waitUntil: 'domcontentloaded',
    })
    await expect(page).toHaveURL(/\/admin\/collections\/users\/[a-zA-Z0-9-_]+/)
    const editViewArtifact = page.locator('input[name="email"]')
    await expect(editViewArtifact).toBeVisible()
  })

  test('revoked session is rejected at the edge', async ({ browser }) => {
    // Fresh context so we can hand-place cookies.
    const context = await browser.newContext()
    const revPage = await context.newPage()

    // Login via the unified API and capture the issued token.
    const loginResponse = await revPage.request.post('http://localhost:3000/api/users/login', {
      data: {
        email: testUser.email,
        password: testUser.password,
      },
    })
    expect(loginResponse.ok()).toBe(true)

    const setCookie = loginResponse.headers()['set-cookie']
    expect(setCookie).toBeTruthy()
    const token = setCookie.split(';')[0].split('=')[1]

    // Log out via the storefront: this revokes the DB session server-side and
    // clears the cookie in the browser (the LogoutPage POSTs to /api/users/logout).
    await revPage.goto('http://localhost:3000/logout')
    await expect(revPage.locator('h1', { hasText: /Logged out|already logged out/ })).toBeVisible()

    // Re-apply the now-stale (revoked) token by hand.
    await context.addCookies([
      {
        name: 'payload-token',
        value: token,
        url: 'http://localhost:3000',
      },
    ])

    // The proxy must reject the revoked session even though the JWT is still
    // cryptographically valid and unexpired.
    const response = await context.request.get('http://localhost:3000/admin')
    expect(response.status()).toBe(404)
  })

  test('page with slug 404 cannot mask /admin as 200', async ({ browser }) => {
    await seedSlug404Page()

    try {
      // No cookies -> fully unauthenticated.
      const context = await browser.newContext()

      const response = await context.request.get('http://localhost:3000/admin')
      expect(response.status()).toBe(404)
    } finally {
      await cleanupSlug404Page()
    }
  })
})
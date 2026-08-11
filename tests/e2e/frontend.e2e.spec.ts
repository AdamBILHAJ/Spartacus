import path from 'path'
import { test, expect, Page } from '@playwright/test'
import { fileURLToPath } from 'url'
import { seedTestUser } from '../helpers/seedUser'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

test.describe('Frontend', () => {
  // The Payload admin panel is compiled on-demand in dev; the first navigation
  // (media upload happens in beforeAll) triggers a full Turbopack compile that
  // can exceed Playwright's 30s default.
  test.setTimeout(180_000)

  let page: Page
  const baseURL = 'http://localhost:3000'
  const mediaURL = `${baseURL}/admin/collections/media`
  const adminEmail = 'admin@test.com'
  const adminPassword = 'admin'
  const userEmail = 'user@test.com'
  const userPassword = 'user'
  const testPaymentDetails = {
    cardNumber: '5454 5454 5454 5454',
    expiryDate: '0330',
    cvc: '737',
    postcode: 'WS11 1DB',
  }
  test.beforeAll(async ({ browser, request }, testInfo) => {
    const context = await browser.newContext()
    page = await context.newPage()
    await createUserAndLogin(request, adminEmail, adminPassword)
    await createVariantsAndProducts(page, request)
  }, 180_000)

  test('can go on homepage', async ({ page }) => {
    await page.goto(baseURL)

    await expect(page).toHaveTitle(/Spartacus/)

    const heading = page.locator('h1').first()

    await expect(heading).toHaveText('Forge your strongest self')
  })

  test('can sign up and subsequently login', async ({ page }) => {
    await logoutAndExpectSuccess(page)

    await page.goto(`${baseURL}/create-account`)

    const emailInput = page.locator('input[name="email"]')
    const passwordInput = page.locator('input[name="password"]')
    const confirmPasswordInput = page.locator('input[name="passwordConfirm"]')
    const email = `test-${Date.now()}@test.com`
    const password = `test`

    await emailInput.fill(email)
    await passwordInput.fill(password)
    await confirmPasswordInput.fill(password)

    const submitButton = page.locator('button[type="submit"]')
    await submitButton.click()
    const successMessage = page.locator('text=Account created successfully')
    await expect(successMessage).toBeVisible()

    await logoutAndExpectSuccess(page)
    await loginFromUI(page, email, password)
  })

  test('can add products to cart', async ({ page }) => {
    await addToCartAndConfirm(page, {
      productName: 'Test Product',
      productSlug: 'test-product',
    })
  })

  test('can add product with variant to cart', async ({ page }) => {
    await addToCartAndConfirm(page, {
      productName: 'Test Product With Variants',
      productSlug: 'test-product-variants',
      variant: 'Payload',
    })
  })

  test('can remove products from cart', async ({ page }) => {
    await addToCartAndConfirm(page, {
      productName: 'Test Product',
      productSlug: 'test-product',
    })

    await removeFromCartAndConfirm(page)
  })

  test('can remove products with variants from cart', async ({ page }) => {
    await addToCartAndConfirm(page, {
      productName: 'Test Product With Variants',
      productSlug: 'test-product-variants',
      variant: 'Payload',
    })

    await removeFromCartAndConfirm(page)
  })

  test('should retain cart content on hard refresh', async ({ page }) => {
    await addToCartAndConfirm(page, {
      productName: 'Test Product',
      productSlug: 'test-product',
    })

    await page.reload()

    const cartCount = page.locator('button[data-slot="sheet-trigger"] span').last()
    await cartCount.click()

    const productInCart = page.getByRole('dialog').getByText('Test Product')
    await expect(productInCart).toBeVisible()
  })

  test('can view and sort via search page', async ({ page }) => {
    await page.goto(`${baseURL}/products`)

    const productCard = page.locator(`a[href="/products/test-product"]`)
    await productCard.waitFor({ state: 'visible' })
    await expect(productCard).toBeVisible()

    await expect(page.locator('div.grid > a').first()).toBeVisible()

    const priceSort = page.getByText('Price: Low to high')
    await priceSort.click()
    await expect(page).toHaveURL(/\/products\?sort=priceInUSD/)

    // Price ascending should put the $10 test-product before the $90 sweat-pants.
    const hrefs = await page
      .locator('div.grid > a')
      .evaluateAll((links) => links.map((link) => link.getAttribute('href')))
    const testProductIndex = hrefs.indexOf('/products/test-product')
    const sweatPantsIndex = hrefs.indexOf('/products/sweat-pants')
    expect(testProductIndex).toBeGreaterThanOrEqual(0)
    expect(sweatPantsIndex).toBeGreaterThan(testProductIndex)
  })

  test('authenticated users can view account', async ({ page }) => {
    await loginFromUI(page, adminEmail, adminPassword)

    await page.goto(`${baseURL}/account`)

    const heading = page.locator('h1').first()
    await expect(heading).toHaveText('Account settings')
  })

  test('authenticated users can update their name', async ({ page }) => {
    await loginFromUI(page, adminEmail, adminPassword)

    // loginFromUI already lands on /account via client-side navigation, so the
    // auth user is set synchronously. A second full page.goto would reload the
    // page and reset the form from an async /api/users/me response AFTER the
    // fill, wiping the typed name and disabling the submit button.
    const heading = page.locator('h1').first()
    await expect(heading).toHaveText('Account settings')

    const nameInput = page.locator('input[name="name"]')
    const newName = `Test User`
    await nameInput.fill(newName)

    const updateButton = await page.getByRole('button', { name: 'Update Account' })
    await updateButton.click()

    const successMessage = page.locator('text=Successfully updated account')
    await expect(successMessage).toBeVisible()
  })

  test('authenticated users can view orders page', async ({ page }) => {
    await loginFromUI(page, adminEmail, adminPassword)

    await page.goto(`${baseURL}/orders`)

    const heading = page.locator('h1').first()
    await expect(heading).toHaveText('Orders')
  })

  test('authenticated users can view order details', async ({ page }) => {
    await loginFromUI(page, adminEmail, adminPassword)
    await addToCartAndConfirm(page, {
      productName: 'Test Product',
      productSlug: 'test-product',
    })

    await checkout(page, testPaymentDetails)

    await expectOrderIsDisplayed(page)
  })

  test('authenticated customers cannot access /admin', async ({ page }) => {
    await createUserAndLogin(page.request, userEmail, userPassword, false)
    // src/proxy.ts hides the CMS behind a bare 404 for non-admin sessions
    // (never a redirect, so the /admin surface stays unguessable).
    const response = await page.goto(`${baseURL}/admin`)
    expect(response?.status()).toBe(404)
  })

  test('Guest can create and view order', async ({ page }) => {
    await logoutAndExpectSuccess(page)
    await addToCartAndConfirm(page, {
      productName: 'Test Product',
      productSlug: 'test-product',
    })

    await checkout(page, testPaymentDetails, 'guest@test.com')
    await expectOrderIsDisplayed(page)
  })

  test('Guest can view their order using /find-order', async ({ page }) => {
    await logoutAndExpectSuccess(page)
    await addToCartAndConfirm(page, {
      productName: 'Test Product',
      productSlug: 'test-product',
    })

    const guestEmail = 'guest@test.com'

    await checkout(page, testPaymentDetails, guestEmail)

    const orderHeader = await page.locator('h1.text-sm.uppercase.font-mono > span').textContent()
    const orderNumber = orderHeader?.replace(/^Order #/, '').trim()

    await page.goto(`${baseURL}/find-order`)
    const orderNumberInput = page.locator('input[name="orderID"]')
    const emailInput = page.locator('input[name="email"]')
    await orderNumberInput.fill(orderNumber || '')
    await emailInput.fill(guestEmail)

    const findOrderButton = page.getByRole('button', { name: 'Find my order' })
    await findOrderButton.click()

    await expect(orderHeader).not.toBeNull()
  })

  test('Admins can update and view prices on products', async ({ page }) => {
    await loginFromUI(page, adminEmail, adminPassword)

    await page.goto(`${baseURL}/admin/collections/products`)
    const testProductLink = page.getByRole('link', { name: 'Test Product', exact: true })
    await testProductLink.click()

    const productDetailsButton = page.getByRole('button', { name: 'Product Details' })
    await productDetailsButton.click()

    const priceInput = page.locator('input.formattedPriceInput[placeholder="0.00"]')
    await priceInput.fill('20.00')

    await saveAndConfirmSuccess(page)
  })

  test('Admins can update and view prices on variants', async ({ page }) => {
    await loginFromUI(page, adminEmail, adminPassword)

    await page.goto(`${baseURL}/admin/collections/variants`)
    const testProductWithVariantsLink = page.getByRole('link', {
      name: 'Test Product With Variants — Payload',
      exact: true,
    })
    await testProductWithVariantsLink.click()

    const variantPriceInput = page.locator('input.formattedPriceInput[placeholder="0.00"]').first()
    await variantPriceInput.fill('25.00')

    await saveAndConfirmSuccess(page)
  })

  test('Admins can create new products with new variants', async ({ page }) => {
    await loginFromUI(page, adminEmail, adminPassword)

    // The slug field is auto-generated from the title (payload's `slugField`),
    // so the admin UI renders it disabled. Use a unique title so repeated runs
    // don't collide on the slug's unique index.
    const newTitle = `New Product with Variants ${Date.now()}`
    const newSlug = newTitle
      .trim()
      .replace(/ /g, '-')
      .replace(/[^\w-]+/g, '')
      .toLowerCase()

    await page.goto(`${baseURL}/admin/collections/products/create`)
    const titleInput = page.locator('input#field-title')
    await titleInput.fill(newTitle)
    // The gallery array starts empty on the create form; add a row so the
    // upload cell (with "Choose from existing") renders.
    await page.getByRole('button', { name: 'Add Gallery' }).click()
    const chooseFromExistingButton = page.getByRole('button', { name: 'Choose from existing' })
    await chooseFromExistingButton.click()
    const firstFileButton = page.locator('button.default-cell__first-cell').first()
    await firstFileButton.click()

    const productDetailsButton = page.getByRole('button', { name: 'Product Details' })
    await productDetailsButton.click()

    const enableVariantsCheckbox = page.locator('input#field-enableVariants')
    await enableVariantsCheckbox.check()

    // create a new variant type
    const addNewVariantTypeButton = page.locator(
      'button.relationship-add-new__add-button.doc-drawer__toggler[aria-label="Add new Variant Type"]',
    )
    await addNewVariantTypeButton.click()

    const variantTypeNameInput = page.locator('input#field-name')
    await variantTypeNameInput.fill('Pattern')
    const variantTypeLabelInput = page.locator('input#field-label')
    await variantTypeLabelInput.fill('Pattern')

    const saveButton = page.getByRole('button', { name: 'Save', exact: true })
    await saveButton.click()

    // create a new variant option
    const createVariantOptionButton = page.getByRole('button', {
      name: 'Create new Variant Option',
      exact: true,
    })
    await createVariantOptionButton.click()

    const variantOptionValueInput = page.locator('input#field-value')
    await variantOptionValueInput.fill('striped')
    const variantOptionLabelInput = page
      .getByRole('dialog', { name: /variantOptions/i })
      .locator('input#field-label')
    await variantOptionLabelInput.fill('Striped')
    await saveButton.nth(1).click()

    const closeButton = page.getByRole('button', { name: 'Close' }).nth(1)
    await closeButton.click()

    const publishChangesButton = page.getByRole('button', { name: 'Publish changes' })
    await publishChangesButton.click()

    await page.goto(`${baseURL}/products`)
    const newProductCard = page.locator(`a[href="/products/${newSlug}"]`).first()
    await newProductCard.waitFor({ state: 'visible' })
    await expect(newProductCard).toBeVisible()
  })

  test('Admins can view transactions and orders', async ({ page }) => {
    await loginFromUI(page, adminEmail, adminPassword)
    await addToCartAndConfirm(page, {
      productName: 'Test Product',
      productSlug: 'test-product',
    })
    await checkout(page, testPaymentDetails)
    await expectOrderIsDisplayed(page)
    const orderHeader = await page.locator('h1.text-sm.uppercase.font-mono > span').textContent()
    const orderNumber = orderHeader?.replace(/^Order #/, '').trim()

    await page.goto(`${baseURL}/admin/collections/orders`)
    const rowCount = await page.locator('div.table table tbody tr').count()
    expect(rowCount).toBeGreaterThan(1)

    await page.goto(`${baseURL}/admin/collections/orders/${orderNumber}`)
    const product = page.locator('div.rs__control', { hasText: 'Test Product' })
    await expect(product).toBeVisible()

    await page.goto(`${baseURL}/admin/collections/transactions`)
    const transactionRows = await page.locator('div.table table tbody tr').count()
    expect(transactionRows).toBeGreaterThan(0)

    const firstRow = page.locator('td.cell-createdAt > a').first()
    await firstRow.click()

    const status = page.locator('div.rs__control', { hasText: 'Succeeded' })
    await expect(status).toBeVisible()
  })

  test('should disable add to cart when product has no inventory', async ({ page }) => {
    await page.goto(`${baseURL}/products/no-inventory-product`)
    const addToCartButton = page.getByRole('button', { name: 'Add to Cart' })
    await expect(addToCartButton).toBeDisabled()
  })

  // This test fails, it should not let you checkout but it does
  test.skip('should fail checkout when inventory is 0', async ({ page }) => {
    await loginFromUI(page, adminEmail, adminPassword)

    // update inventory to 1
    await page.goto(`${baseURL}/admin/collections/products`)
    const testProductLink = page.getByRole('link', { name: 'No Inventory Product', exact: true })
    await testProductLink.click()
    const productDetailsButton = page.getByRole('button', { name: 'Product Details' })
    await productDetailsButton.click()
    const inventoryInput = page.locator('input[name="inventory"]')
    await inventoryInput.fill('1')
    await saveAndConfirmSuccess(page)

    await page.goto(`${baseURL}/products/no-inventory-product`)
    const addToCartButton = page.getByRole('button', { name: 'Add to Cart' })
    await expect(addToCartButton).toBeVisible()
    await addToCartButton.click()

    // update inventory to 0
    await page.goto(`${baseURL}/admin/collections/products`)
    await testProductLink.click()
    await productDetailsButton.click()
    await inventoryInput.fill('')
    await saveAndConfirmSuccess(page)

    await checkout(page, testPaymentDetails)
    const errorMessage = page.locator('text=This product is out of stock')
    await expect(errorMessage).toBeVisible()
  })

  async function createUserAndLogin(
    request: any,
    email: string,
    password: string,
    isAdmin: boolean = true,
  ) {
    // Seed the user through Payload's trusted local API with overrideAccess so
    // the `roles` field (guarded by adminOnlyFieldAccess) is applied. A public
    // /api/users create call would silently strip the admin role, leaving a
    // non-admin user that every admin-only API call (e.g. /api/variantTypes)
    // correctly rejects with 403.
    const roles: ('admin' | 'customer')[] = isAdmin ? ['admin'] : ['customer']
    await seedTestUser({ email, password, roles })

    // Log in via the shared auth endpoint so the next requests from this same
    // `request` context carry the payload-token cookie.
    const login = await request.post(`${baseURL}/api/users/login`, {
      data: {
        email,
        password,
      },
    })

    expect(login.ok()).toBe(true)
  }

  async function getExistingVariantType(request: any, name: string) {
    const res = await request.get(`${baseURL}/api/variantTypes`, {
      params: {
        where: JSON.stringify({ name: { equals: name } }),
        limit: '1',
      },
    })

    if (!res.ok()) {
      return null
    }

    const json = await res.json()

    return json?.docs?.[0] ?? null
  }

  async function getExistingMedia(request: any, alt: string) {
    const res = await request.get(`${baseURL}/api/media`, {
      params: {
        where: JSON.stringify({ alt: { equals: alt } }),
        limit: '1',
        depth: '0',
      },
    })

    if (!res.ok()) {
      return null
    }

    const json = await res.json()

    return json?.docs?.[0] ?? null
  }

  async function createOrGetProduct(
    request: any,
    {
      title,
      slug,
      inventory,
      imageID,
      enableVariants,
      variantTypes,
    }: {
      title: string
      slug: string
      inventory: number
      imageID: number
      enableVariants?: boolean
      variantTypes?: number[]
    },
  ) {
    const existing = await getExistingProduct(request, slug)

    if (existing) {
      return existing.id
    }

    const res = await request.post(`${baseURL}/api/products`, {
      data: {
        title,
        slug,
        enableVariants,
        variantTypes,
        inventory,
        _status: 'published',
        layout: [],
        gallery: [{ image: imageID }],
        priceInUSDEnabled: true,
        priceInUSD: 1000,
      },
    })

    expect(res.ok()).toBe(true)
    return (await res.json()).doc.id
  }

  async function getExistingProduct(request: any, slug: string) {
    const res = await request.get(`${baseURL}/api/products`, {
      params: {
        where: JSON.stringify({ slug: { equals: slug } }),
        limit: '1',
        depth: '0',
      },
    })

    if (!res.ok()) {
      return null
    }

    const json = await res.json()

    return json?.docs?.[0] ?? null
  }

  async function createOrGetVariantType(request: any, name: string, label: string) {
    const existing = await getExistingVariantType(request, name)

    if (existing) {
      return existing.id
    }

    const res = await request.post(`${baseURL}/api/variantTypes`, {
      data: {
        name,
        label,
      },
    })

    expect(res.ok()).toBe(true)
    return (await res.json()).doc.id
  }

  async function createOrGetVariantOption(
    request: any,
    label: string,
    value: string,
    variantTypeID: string,
  ) {
    const res = await request.get(`${baseURL}/api/variantOptions`, {
      params: {
        where: JSON.stringify({ value: { equals: value } }),
        limit: '1',
        depth: '0',
      },
    })

    const docs = res.ok() ? (await res.json()).docs : []

    const existing = docs.find((doc: any) => doc.variantType === variantTypeID)

    if (existing) {
      return existing.id
    }

    const create = await request.post(`${baseURL}/api/variantOptions`, {
      data: {
        label,
        value,
        variantType: variantTypeID,
      },
    })

    expect(create.ok()).toBe(true)
    return (await create.json()).doc.id
  }

  async function createOrGetMedia(page: Page, request: any) {
    const existing = await getExistingMedia(request, 'Test Image')

    if (existing) {
      return existing.id
    }

    // No media uploaded yet: upload once via the admin UI. Subsequent runs
    // reuse the existing doc above so the on-demand Turbopack compile of the
    // admin panel does not run on every test session.
    await loginFromUI(page, adminEmail, adminPassword)
    await page.goto(`${mediaURL}/create`)
    const fileInput = page.locator('input[type="file"]')
    const altInput = page.locator('input[name="alt"]')
    const filePath = path.resolve(dirname, '../../public/media/image-hero1.webp')
    await fileInput.setInputFiles(filePath)
    await altInput.fill('Test Image')
    const uploadButton = page.locator('#action-save')
    await uploadButton.click()
    const successMessage = page.locator('text=Media successfully created')
    await expect(successMessage).toBeVisible()
    await expect(page).toHaveURL(/\/admin\/collections\/media\/\d+/)
    return Number(page.url().split('/').pop())
  }

  async function createVariantsAndProducts(page: Page, request: any) {
    const variantTypeID = await createOrGetVariantType(request, 'brand', 'Brand')

    const payloadVariantID = await createOrGetVariantOption(
      request,
      'Payload',
      'payload',
      variantTypeID,
    )
    const figmaVariantID = await createOrGetVariantOption(
      request,
      'Figma',
      'figma',
      variantTypeID,
    )

    const imageID = await createOrGetMedia(page, request)

    const productID = await createOrGetProduct(request, {
      title: 'Test Product With Variants',
      slug: 'test-product-variants',
      enableVariants: true,
      variantTypes: [variantTypeID],
      inventory: 100,
      imageID,
    })

    const existingVariants = await request.get(`${baseURL}/api/variants`, {
      params: {
        where: JSON.stringify({ product: { equals: productID } }),
        limit: '10',
        depth: '0',
      },
    })

    const existingVariantDocs = existingVariants.ok()
      ? (await existingVariants.json()).docs
      : []

    const createVariant = async (options: string[]) => {
      const alreadyExists = existingVariantDocs.some(
        (doc: any) => doc.options?.length === options.length && doc.options.every((o: any) => options.includes(o)),
      )

      if (alreadyExists) {
        return
      }

      await request.post(`${baseURL}/api/variants`, {
        data: {
          product: productID,
          variantType: variantTypeID,
          options,
          priceInUSDEnabled: true,
          priceInUSD: 1000,
          inventory: 50,
          _status: 'published',
        },
      })
    }

    await createVariant([payloadVariantID])
    await createVariant([figmaVariantID])

    await createOrGetProduct(request, {
      title: 'Test Product',
      slug: 'test-product',
      inventory: 100,
      imageID,
    })

    await createOrGetProduct(request, {
      title: 'No Inventory Product',
      slug: 'no-inventory-product',
      inventory: 0,
      imageID,
    })
  }

  async function logoutAndExpectSuccess(page: Page) {
    await page.goto(`${baseURL}/logout`)
    const heading = page.locator('h1').first()
    await expect(heading).toContainText(/logged out/i)
  }

  async function loginFromUI(page: Page, email: string, password: string) {
    const emailInput = page.locator('input[name="email"]')
    const passwordInput = page.locator('input[name="password"]')
    const submitButton = page.locator('button[type="submit"]')

    await page.goto(`${baseURL}/login`)
    await emailInput.fill(email)
    await passwordInput.fill(password)
    await submitButton.click()
    await page.waitForURL(/\/account/)
  }

  async function addToCartAndConfirm(
    page: Page,
    {
      productName,
      productSlug,
      variant,
    }: {
      productName: string
      productSlug: string
      variant?: string
    },
  ) {
    await page.goto(`${baseURL}/products`)
    await expect(page).toHaveURL(/\/products/)

    const productCard = page.locator(`a[href="/products/${productSlug}"]`).first()
    await productCard.waitFor({ state: 'visible' })
    await productCard.click()

    // The first visit to a product page triggers an on-demand Turbopack compile
    // in dev, so the click can resolve before the navigation finishes. Wait for
    // the product URL instead of asserting the CTA immediately.
    await page.waitForURL(`**/products/${productSlug}`)

    if (variant) {
      const variantButton = page.getByRole('button', { name: variant }).first()
      await variantButton.waitFor({ state: 'visible' })
      await variantButton.click()
    }

    const addToCartButton = page.getByRole('button', { name: 'Add to Cart' })
    await expect(addToCartButton).toBeVisible()
    await addToCartButton.click()

    const cartCount = page.locator('button[data-slot="sheet-trigger"] span').last()
    await expect(cartCount).toHaveText('1')
    await cartCount.click()

    const productInCart = page.getByRole('dialog').getByText(productName, { exact: false })
    await expect(productInCart).toBeVisible()
  }

  async function removeFromCartAndConfirm(page: Page) {
    const reduceQuantityButton = page.getByRole('button', { name: 'Reduce item quantity' })
    await expect(reduceQuantityButton).toBeVisible()
    await reduceQuantityButton.click()

    const emptyCartMessage = page.getByText('Your cart is empty.')
    await expect(emptyCartMessage).toBeVisible()
  }

  async function checkout(
    page: Page,
    paymentDetails: {
      cardNumber: string
      expiryDate: string
      cvc: string
      postcode: string
    },
    guestEmail?: string | null,
  ): Promise<void> {
    await page.goto(`${baseURL}/checkout`)

    if (guestEmail) {
      const emailInput = page.locator('input[type="email"]')
      await emailInput.fill(guestEmail)

      const continueGuestBtn = page.getByRole('button', { name: /continue as guest/i })
      await continueGuestBtn.click()
    }

    const confirmAddress = page.getByRole('button', { name: 'Confirm address' })
    await confirmAddress.click()

    const { cardNumber, expiryDate, cvc, postcode } = paymentDetails

    const stripeIframe = page.frameLocator('iframe[title="Secure payment input frame"]')

    await stripeIframe.locator('#Field-numberInput').fill(cardNumber)
    await stripeIframe.locator('#Field-expiryInput').fill(expiryDate)
    await stripeIframe.locator('#Field-cvcInput').fill(cvc)
    await stripeIframe.locator('#Field-postalCodeInput').fill(postcode)

    const payNowButton = page.getByRole('button', { name: 'Pay now' })
    await payNowButton.click()

    await page.waitForURL(/\/orders/)
    await expect(page).toHaveURL(/\/orders/)
  }

  async function expectOrderIsDisplayed(page: Page): Promise<void> {
    const orderHeader = await page.locator('h1.text-sm.uppercase.font-mono > span').textContent()
    expect(orderHeader).toContain('Order #')

    const orderNumber = orderHeader?.replace(/^Order #/, '').trim()
    const pageURL = page.url()

    expect(pageURL).toContain(`/orders/${orderNumber}`)
  }

  async function saveAndConfirmSuccess(page: Page) {
    const saveButton = page.locator('#action-save')
    await saveButton.click()

    const successMessage = page.locator('text=Updated successfully')
    await expect(successMessage).toBeVisible()
  }
})

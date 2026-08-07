import type { Footer } from '@/payload-types'

import { FooterMenu } from '@/components/Footer/menu'
import { getCachedGlobal } from '@/utilities/getGlobals'
import { LogoWordmark } from '@/components/icons/logo'
import Link from 'next/link'
import React, { Suspense } from 'react'

const { COMPANY_NAME, SITE_NAME } = process.env

export async function Footer() {
  const footer: Footer = await getCachedGlobal('footer', 1)()
  const menu = footer.navItems || []
  const currentYear = new Date().getFullYear()
  const copyrightName = COMPANY_NAME || SITE_NAME || 'Spartacus'
  const skeleton = 'w-full h-6 animate-pulse rounded bg-neutral-200 dark:bg-neutral-700'

  return (
    <footer className="bg-neutral-950 text-neutral-400">
      <div className="container">
        <div className="flex flex-col gap-10 border-b border-neutral-800 py-14 md:flex-row md:justify-between">
          <div className="max-w-sm">
            <Link className="inline-flex items-center" href="/">
              <LogoWordmark className="text-white" />
            </Link>
            <p className="mt-4 text-sm leading-relaxed">
              Premium activewear engineered for the modern athlete. Train hard, train different.
            </p>
          </div>

          <Suspense
            fallback={
              <div className="flex h-[188px] w-[200px] flex-col gap-2">
                <div className={skeleton} />
                <div className={skeleton} />
                <div className={skeleton} />
                <div className={skeleton} />
                <div className={skeleton} />
                <div className={skeleton} />
              </div>
            }
          >
            <FooterMenu menu={menu} />
          </Suspense>

          <div className="flex flex-col gap-3 text-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-white">Support</p>
            <Link className="transition-colors hover:text-white" href="/account">
              My account
            </Link>
            <Link className="transition-colors hover:text-white" href="/cart">
              Cart
            </Link>
            <Link className="transition-colors hover:text-white" href="/products">
              Shop
            </Link>
          </div>
        </div>

        <div className="flex flex-col items-center justify-between gap-3 py-6 text-xs md:flex-row">
          <p>
            &copy; {currentYear} {copyrightName}. All rights reserved.
          </p>
          <p className="uppercase tracking-[0.2em] text-neutral-600">Forge your body. Spartacus.</p>
        </div>
      </div>
    </footer>
  )
}
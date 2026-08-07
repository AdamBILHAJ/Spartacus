'use client'
import { CMSLink } from '@/components/Link'
import { Cart } from '@/components/Cart'
import { OpenCartButton } from '@/components/Cart/OpenCart'
import Link from 'next/link'
import React, { Suspense } from 'react'

import { MobileMenu } from './MobileMenu'
import type { Header } from 'src/payload-types'

import { LogoWordmark } from '@/components/icons/logo'
import { Search } from '@/components/Search'
import { SearchIcon } from 'lucide-react'
import { usePathname } from 'next/navigation'
import { cn } from '@/utilities/cn'

type Props = {
  header: Header
}

export function HeaderClient({ header }: Props) {
  const menu = header.navItems || []
  const pathname = usePathname()

  return (
    <div className="bg-background">
      <nav className="flex items-center justify-between gap-4 container py-4">
        <div className="flex flex-1 items-center">
          <div className="block flex-none md:hidden">
            <Suspense fallback={null}>
              <MobileMenu menu={menu} />
            </Suspense>
          </div>
          <Suspense
            fallback={
              <Link
                className="hidden items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground md:flex lg:text-base"
                href="/products"
              >
                <SearchIcon className="h-4 w-4" />
                Search
              </Link>
            }
          >
            <Search className="hidden w-56 md:block" />
          </Suspense>
        </div>

        <div className="flex items-center justify-center">
          <Link className="flex items-center gap-2" href="/">
            <LogoWordmark />
          </Link>
        </div>

        <div className="flex flex-1 items-center justify-end gap-4">
          <Suspense fallback={<OpenCartButton />}>
            <Cart />
          </Suspense>
        </div>
      </nav>

      {menu.length ? (
        <div className="hidden border-t md:block">
          <nav className="container">
            <ul className="flex items-center justify-center gap-8 py-3">
              {menu.map((item) => (
                <li key={item.id}>
                  <CMSLink
                    {...item.link}
                    size={'clear'}
                    className={cn('navLink relative', {
                      active:
                        item.link.url && item.link.url !== '/'
                          ? pathname.includes(item.link.url)
                          : false,
                    })}
                    appearance="nav"
                  />
                </li>
              ))}
            </ul>
          </nav>
        </div>
      ) : null}
    </div>
  )
}
import type { Metadata } from 'next'

import { Categories } from '@/components/layout/search/Categories'
import { FilterList } from '@/components/layout/search/filter'
import { sorting } from '@/lib/constants'
import { Search } from '@/components/Search'
import React, { Suspense } from 'react'

export const metadata: Metadata = {
  title: 'Shop',
  description: 'Browse the full Spartacus activewear collection.',
}

export default function ProductsLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={null}>
      <div className="mx-auto w-full max-w-7xl px-6 py-12 md:px-12">
        <header className="mb-10 flex flex-col gap-2">
          <h1 className="text-4xl font-black uppercase tracking-tight text-foreground md:text-5xl">
            Shop All
          </h1>
          <p className="text-sm text-muted-foreground">
            Premium activewear for training, lifting and everyday movement.
          </p>
        </header>

        <div className="flex flex-col items-start justify-between gap-8 md:flex-row md:gap-16">
          <aside className="flex w-full flex-none flex-col gap-8 md:w-56">
            <Categories />
            <FilterList list={sorting} title="Sort by" />
          </aside>

          <div className="w-full min-h-screen">
            <Search className="mb-8 md:hidden" />
            {children}
          </div>
        </div>
      </div>
    </Suspense>
  )
}
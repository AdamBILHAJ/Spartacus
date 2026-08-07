import type { Media } from '@/payload-types'

import { Button } from '@/components/ui/button'
import Link from 'next/link'
import React from 'react'

export type HeroBannerProps = {
  eyebrow?: string
  title: string
  subtitle?: string
  image?: Media
  primaryLabel?: string
  primaryHref?: string
  secondaryLabel?: string
  secondaryHref?: string
}

/**
 * Full-bleed hero banner for the top of the home page.
 * Displays rich copy over a dimmed product/collection image.
 */
export function HeroBanner({
  eyebrow = 'New Drop',
  title,
  subtitle,
  image,
  primaryLabel = 'Shop now',
  primaryHref = '/products',
  secondaryLabel,
  secondaryHref,
}: HeroBannerProps) {
  return (
    <section className="relative flex min-h-[68vh] w-full items-end overflow-hidden bg-neutral-950">
      {image?.url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          alt={image.alt}
          className="absolute inset-0 h-full w-full object-cover opacity-70"
          src={image.url}
        />
      ) : (
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_20%,rgba(190,40,34,0.35),transparent_60%)]" />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/30 to-transparent" />

      <div className="relative z-10 mx-auto flex w-full max-w-7xl flex-col items-start gap-6 px-6 py-24 md:px-12">
        {eyebrow ? (
          <span className="text-xs font-semibold uppercase tracking-[0.3em] text-brand">
            {eyebrow}
          </span>
        ) : null}
        <h1 className="max-w-2xl text-4xl font-black uppercase leading-[0.95] tracking-tight text-white sm:text-5xl md:text-7xl">
          {title}
        </h1>
        {subtitle ? <p className="max-w-md text-base text-white/75 md:text-lg">{subtitle}</p> : null}
        <div className="flex flex-wrap items-center gap-3 pt-2">
          <Button asChild size="lg" className="bg-brand text-white hover:bg-brand/90">
            <Link href={primaryHref}>{primaryLabel}</Link>
          </Button>
          {secondaryLabel && secondaryHref ? (
            <Button asChild size="lg" variant="outline" className="border-white/40 text-white hover:bg-white/10">
              <Link href={secondaryHref}>{secondaryLabel}</Link>
            </Button>
          ) : null}
        </div>
      </div>
    </section>
  )
}
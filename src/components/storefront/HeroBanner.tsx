import type { StaticImageData } from 'next/image'
import type { Media } from '@/payload-types'

import { Button } from '@/components/ui/button'
import Image from 'next/image'
import Link from 'next/link'
import React from 'react'

export type HeroBannerProps = {
  eyebrow?: string
  title: string
  subtitle?: string
  image?: Media | StaticImageData
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
  const isStaticLogo = !!image && 'src' in image
  const src = isStaticLogo ? (image as StaticImageData).src : (image as Media | undefined)?.url
  const alt = isStaticLogo ? 'Spartacus' : ((image as Media | undefined)?.alt ?? 'Spartacus')

  return (
    <section className="relative flex min-h-[68vh] w-full flex-col items-center justify-center overflow-hidden bg-neutral-950">
      {/* Ambient gold glow */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_25%,rgba(198,164,94,0.22),transparent_60%)]" />
      <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/40 to-transparent" />

      <div className="relative z-10 flex w-full max-w-7xl flex-col items-center gap-6 px-6 py-24 text-center md:px-12">
        {src ? (
          <div className="relative h-[26vh] w-full max-w-3xl">
            <Image
              alt={alt}
              fill
              priority
              sizes="(max-width: 768px) 100vw, 60vw"
              src={src}
              className="object-contain"
            />
          </div>
        ) : null}
        {eyebrow ? (
          <span className="text-xs font-semibold uppercase tracking-[0.3em] text-brand">
            {eyebrow}
          </span>
        ) : null}
        <h1 className="max-w-2xl text-4xl font-black uppercase leading-[0.95] tracking-tight text-white sm:text-5xl md:text-7xl">
          {title}
        </h1>
        {subtitle ? <p className="max-w-md text-base text-white/75 md:text-lg">{subtitle}</p> : null}
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
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
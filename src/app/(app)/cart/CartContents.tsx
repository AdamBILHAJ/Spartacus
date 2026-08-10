'use client'

import { Price } from '@/components/Price'
import { Button } from '@/components/ui/button'
import { useCart } from '@payloadcms/plugin-ecommerce/client/react'
import { ShoppingCart } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import React from 'react'
import { DeleteItemButton } from '@/components/Cart/DeleteItemButton'
import { EditItemQuantityButton } from '@/components/Cart/EditItemQuantityButton'
import { Product } from '@/payload-types'

export function CartContents() {
  const { cart } = useCart()

  return (
    <div className="mx-auto w-full max-w-5xl px-6 py-12 md:px-12">
      <h1 className="mb-8 text-4xl font-black uppercase tracking-tight text-foreground md:text-5xl">
        Your Cart
      </h1>

      {!cart || cart?.items?.length === 0 ? (
        <div className="flex flex-col items-center gap-4 py-20 text-center">
          <ShoppingCart className="h-16 w-16 text-muted-foreground" />
          <p className="text-2xl font-bold text-foreground">Your cart is empty.</p>
          <Button asChild>
            <Link href="/products">Start shopping</Link>
          </Button>
        </div>
      ) : (
        <div className="flex flex-col gap-10 lg:flex-row lg:items-start">
          <ul className="flex-1 divide-y divide-border rounded-lg border bg-card">
            {cart?.items?.map((item, i) => {
              const product = item.product
              const variant = item.variant

              if (typeof product !== 'object' || !item || !product || !product.slug)
                return <React.Fragment key={i} />

              const metaImage =
                product.meta?.image && typeof product.meta.image === 'object'
                  ? product.meta.image
                  : undefined
              const firstGalleryImage =
                typeof product.gallery?.[0]?.image === 'object'
                  ? product.gallery[0].image
                  : undefined

              let image = firstGalleryImage || metaImage
              let price = product.priceInUSD
              const isVariant = Boolean(variant) && typeof variant === 'object'

              if (isVariant) {
                price = variant?.priceInUSD
                const imageVariant = product.gallery?.find(
                  (g: { variantOption?: (number | { id: number }) | null }) => {
                    if (!g.variantOption) return false
                    const variantOptionID =
                      typeof g.variantOption === 'object' ? g.variantOption.id : g.variantOption
                    return variant?.options?.some(
                      (option: number | { id: number }) =>
                        typeof option === 'object'
                          ? option.id === variantOptionID
                          : option === variantOptionID,
                    )
                  },
                )
                if (imageVariant && typeof imageVariant.image === 'object')
                  image = imageVariant.image
              }

              return (
                <li className="flex gap-4 p-4" key={i}>
                  <Link
                    className="relative h-24 w-24 overflow-hidden rounded-md border border-border bg-muted"
                    href={`/products/${(item.product as Product)?.slug}`}
                  >
                    {image?.url ? (
                      <Image
                        alt={image?.alt || product?.title || ''}
                        className="h-full w-full object-cover"
                        fill
                        sizes="96px"
                        src={image.url}
                      />
                    ) : null}
                  </Link>

                  <div className="flex flex-1 flex-col justify-between py-1">
                    <div>
                      <Link
                        className="font-medium text-foreground hover:underline"
                        href={`/products/${(item.product as Product)?.slug}`}
                      >
                        {product?.title}
                      </Link>
                      {isVariant && variant ? (
                        <p className="mt-1 text-sm capitalize text-muted-foreground">
                          {variant.options
                            ?.map((option: number | { label: string }) =>
                              typeof option === 'object' ? option.label : null,
                            )
                            .join(', ')}
                        </p>
                      ) : null}
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="flex h-9 flex-row items-center rounded-lg border">
                        <EditItemQuantityButton item={item} type="minus" />
                        <p className="w-6 text-center text-sm">{item.quantity}</p>
                        <EditItemQuantityButton item={item} type="plus" />
                      </div>
                      <DeleteItemButton item={item} />
                    </div>
                  </div>

                  <div className="flex items-start">
                    {typeof price === 'number' ? (
                      <Price amount={price} className="text-sm font-semibold text-foreground" />
                    ) : null}
                  </div>
                </li>
              )
            })}
          </ul>

          <aside className="w-full lg:w-80">
            <div className="rounded-lg border bg-card p-6">
              <h2 className="mb-4 text-lg font-bold text-foreground">Order summary</h2>
              {typeof cart?.subtotal === 'number' ? (
                <div className="mb-6 flex items-center justify-between border-b border-border pb-4">
                  <p className="text-sm text-muted-foreground">Subtotal</p>
                  <Price amount={cart.subtotal} className="text-base font-bold text-foreground" />
                </div>
              ) : null}
              <Button asChild size="lg" className="w-full">
                <Link href="/checkout">Proceed to Checkout</Link>
              </Button>
              <Button asChild size="lg" variant="ghost" className="mt-2 w-full">
                <Link href="/products">Continue shopping</Link>
              </Button>
            </div>
          </aside>
        </div>
      )}
    </div>
  )
}
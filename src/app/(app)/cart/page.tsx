import { type Metadata } from 'next'

import { CartContents } from './CartContents'

export const metadata: Metadata = {
  title: 'Your Cart',
  description: 'Review the items in your Spartacus shopping cart.',
}

export default function CartPage() {
  return <CartContents />
}
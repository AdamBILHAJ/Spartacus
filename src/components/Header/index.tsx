import { getCachedGlobal } from '@/utilities/getGlobals'

import { AnnouncementBar } from '@/components/storefront/AnnouncementBar'
import './index.css'
import { HeaderClient } from './index.client'

const ANNOUNCEMENTS = [
  'Free shipping on orders over $150',
  'New Spartacus Drop — Shop Now',
  'Members get 10% off first order',
]

export async function Header() {
  const header = await getCachedGlobal('header', 1)()

  return (
    <>
      <AnnouncementBar messages={ANNOUNCEMENTS} />
      <HeaderClient header={header} />
    </>
  )
}

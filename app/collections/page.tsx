import { getIdentity } from '../../lib/cfAccess'
import { redirect } from 'next/navigation'
import CollectionsClient from './CollectionsClient'

export default async function CollectionsPage() {
  const user = await getIdentity()
  if (!user) redirect('/')

  const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/collections`, {
    headers: {
      // Forward Cloudflare Access headers in server component
      Cookie: `CF_Authorization=${process.env.CF_AUTHORIZATION || ''}`,
    },
    cache: 'no-store',
  })

  const collections = res.ok ? await res.json() : []

  return <CollectionsClient initialCollections={collections} />
}

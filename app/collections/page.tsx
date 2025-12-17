import { getIdentity } from '../../lib/cfAccess'
import { redirect } from 'next/navigation'
import CollectionsClient from './CollectionsClient'

export default async function CollectionsPage() {
  const user = await getIdentity()
  if (!user) redirect('/')

  return <CollectionsClient />
}

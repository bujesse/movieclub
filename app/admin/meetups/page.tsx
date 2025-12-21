import { getIdentity } from '../../../lib/cfAccess'
import MeetupsAdminClient from './MeetupsAdminClient'

export default async function AdminMeetupsPage() {
  const me = await getIdentity()

  if (!me?.isAdmin) {
    return (
      <section className="section">
        <div className="container">
          <p className="title is-4">Meetups</p>
          <p className="subtitle has-text-danger">Admin access required.</p>
        </div>
      </section>
    )
  }

  return <MeetupsAdminClient />
}

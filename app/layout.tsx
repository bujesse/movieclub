import 'bulma/css/bulma.min.css'
import './globals.css'
import Header from './Header'
import { getIdentity } from '../lib/cfAccess'
import CurrentUserProvider from './CurrentUserProvider'
import { prisma } from '../lib/prisma'

export const metadata = {
  title: 'Movie Club',
  description: 'Share and vote on movies with your friends',
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const id = await getIdentity()
  const me = id ? { email: id.email ?? null, name: id.name ?? null } : null

  let voteCount = 0
  if (me?.email) {
    voteCount = await prisma.vote.count({
      where: { userId: me.email },
    })
  }

  const nextMeetup = await prisma.meetup.findFirst({
    where: { date: { gt: new Date() } },
    orderBy: { date: 'asc' },
    select: { date: true },
  })
  const nextMeetupIso = nextMeetup?.date ? nextMeetup.date.toISOString() : null

  return (
    <html lang="en" className="has-navbar-fixed-top">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="color-scheme" content="dark" />
        <title>Movie Club</title>
      </head>
      <body>
        {/* Sticky Header */}
        <CurrentUserProvider user={me}>
          <Header voteCount={voteCount} nextMeetupIso={nextMeetupIso} />

          {/* Main Content */}
          <main className="container" style={{ minHeight: '75vh' }}>
            {children}
          </main>
        </CurrentUserProvider>
      </body>
    </html>
  )
}

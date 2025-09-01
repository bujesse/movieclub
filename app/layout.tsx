import 'bulma/css/bulma.min.css'
import './globals.css'
import Header from './Header'
import { getIdentity } from '../lib/cfAccess'
import CurrentUserProvider from './CurrentUserProvider'
import { prisma } from '../lib/prisma'
import { VotesProvider } from './VotesProvider'

export const metadata = {
  title: 'Movie Club',
  description: 'Share and vote on movies with your friends',
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const id = await getIdentity()
  const me = id ? { email: id.email ?? null, name: id.name ?? null } : null

  // Meetup is always the next upcoming one
  const nextMeetup = await prisma.meetup.findFirst({
    where: { date: { gt: new Date() } },
    orderBy: { date: 'asc' },
    select: { id: true, date: true },
  })
  const nextMeetupIso = nextMeetup?.date?.toISOString() ?? null

  // Votes are scoped to user + meetup
  let voteCount = 0
  if (me?.email && nextMeetup?.id) {
    voteCount = await prisma.vote.count({ where: { userId: me.email, meetupId: nextMeetup.id } })
  }

  return (
    <html lang="en" className="has-navbar-fixed-top">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="color-scheme" content="dark" />
      </head>
      <body>
        {/* Sticky Header */}
        <CurrentUserProvider user={me}>
          <VotesProvider initialUsed={voteCount}>
            <Header nextMeetupIso={nextMeetupIso} />

            {/* Main Content */}
            <main className="container" style={{ minHeight: '75vh' }}>
              {children}
            </main>
          </VotesProvider>
        </CurrentUserProvider>
      </body>
    </html>
  )
}

import 'bulma/css/bulma.min.css'
import './global.css'
import Header from './Header'
import { getIdentity } from '../lib/cfAccess'
import CurrentUserProvider from './CurrentUserProvider'
import { VotesProvider } from './VotesProvider'
import { NextMeetupProvider } from './NextMeetupContext'
import { ListsPageProvider } from './ListsPageContext'
import { loadRootData } from '../lib/loadRootData'
import { Suspense } from 'react'

export const metadata = {
  title: 'Movie Club',
  description: 'Share and vote on movies with your friends',
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const id = await getIdentity()
  const me = id
    ? { email: id.email ?? null, name: id.name ?? null, isAdmin: id.isAdmin === true }
    : { email: 'anon', name: 'anon', isAdmin: false }

  const { nextMeetup, voteCount } = await loadRootData(me?.email)

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
            <NextMeetupProvider nextMeetup={nextMeetup}>
              <ListsPageProvider>
                <Suspense fallback={<div className="navbar is-fixed-top is-spaced is-dark" />}>
                  <Header />
                </Suspense>

                {/* Main Content */}
                <main className="container" style={{ minHeight: '75vh' }}>
                  {children}
                </main>
              </ListsPageProvider>
            </NextMeetupProvider>
          </VotesProvider>
        </CurrentUserProvider>
      </body>
    </html>
  )
}

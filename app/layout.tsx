import 'bulma/css/bulma.min.css'
import './globals.css'

export const metadata = {
  title: 'Movie Club',
  description: 'Share and vote on movies with your friends',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="color-scheme" content="dark" />
        <title>Movie Club</title>
      </head>
      <body>
        {/* Sticky Header */}
        <header className="section has-background-dark">
          <nav className="container is-flex is-justify-content-space-between is-align-items-center">
            <h1 className="title has-text-white is-4" style={{ margin: 0 }}>
              Movie Club
            </h1>
            <ul className="is-flex">
              <li className="mr-3">
                <a className="has-text-white" href="/">
                  Home
                </a>
              </li>
              <li>
                <a className="has-text-white" href="/about">
                  About
                </a>
              </li>
            </ul>
          </nav>
        </header>

        {/* Main Content */}
        <main className="container" style={{ minHeight: '75vh' }}>
          {children}
        </main>

        {/* Footer */}
        <footer className="footer has-background-dark has-text-white">
          <div className="container has-text-centered">
            <p>&copy; {new Date().getFullYear()} Movie Club. All rights reserved.</p>
          </div>
        </footer>
      </body>
    </html>
  )
}

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
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/npm/@picocss/pico@2/css/pico.violet.min.css"
        />
        <title>Hello world!</title>
      </head>
      <body>
        {/* Sticky Header */}
        <header className="container-fluid">
          <nav className="container flex justify-between items-center">
            <h1 style={{ margin: 0 }}>🎬 Movie Club</h1>
            <ul>
              <li>
                <a href="/">Home</a>
              </li>
              <li>
                <a href="/about">About</a>
              </li>
            </ul>
          </nav>
        </header>

        {/* Main Content */}
        <main className="container" style={{ minHeight: '75vh', paddingTop: '2rem' }}>
          {children}
        </main>

        {/* Footer */}
        <footer className="container-fluid">
          <div className="container">
          </div>
        </footer>
      </body>
    </html>
  )
}

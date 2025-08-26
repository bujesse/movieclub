export const metadata = {
  title: 'Movie Club',
  description: 'Share and vote on movies with your friends',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="stylesheet" href="https://unpkg.com/@picocss/pico@1.*/css/pico.min.css" />
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
            <p style={{ textAlign: 'center', color: 'var(--muted-color)' }}>
              &copy; {new Date().getFullYear()} Movie Club · Built with Pico + Next.js
            </p>
          </div>
        </footer>
      </body>
    </html>
  )
}

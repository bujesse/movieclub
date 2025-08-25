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
        <header>
          <nav>
            <h1>🎬 Movie Club</h1>
          </nav>
        </header>
        <main>{children}</main>
        <footer>
          <p>&copy; 2025 Movie Club</p>
        </footer>
      </body>
    </html>
  )
}

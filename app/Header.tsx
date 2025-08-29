'use client'

import { useCurrentUser } from './CurrentUserProvider'

const MAX_VOTES = 3

export default function Header({ voteCount }: { voteCount: number }) {
  const me = useCurrentUser()
  const display = me?.name ?? (me?.email ? me.email.split('@')[0] : null)

  return (
    <nav
      className="navbar is-fixed-top is-spaced is-dark"
      role="navigation"
      aria-label="main navigation"
    >
      <div className="navbar-brand custom-navbar">
        <a className="navbar-item" href="/">
          <strong>🍿 Movie Club</strong>
        </a>
        <div className="navbar-item is-right">
          <p>{display}</p>
          <span className="tag is-info is-light">
            Votes: {voteCount}/{MAX_VOTES}
          </span>
        </div>
      </div>
      <style jsx>{`
        .custom-navbar {
          display: flex;
          flex: 1 1;
          justify-content: space-between;
        }
      `}</style>
    </nav>
  )
}

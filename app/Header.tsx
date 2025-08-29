'use client'

import { useCurrentUser } from './CurrentUserProvider'

export default function Header() {
  const me = useCurrentUser()
  const display = me?.name ?? (me?.email ? me.email.split('@')[0] : null)

  return (
    <header className="section has-background-dark">
      <nav className="container is-flex is-justify-content-space-between is-align-items-center">
        <h1 className="title has-text-white is-4" style={{ margin: 0 }}>
          Movie Club
        </h1>
        <ul className="is-flex">
          <li className="mr-3">
            <a className="has-text-white" href="/">
              {display ? <span>{display}</span> : <span>Guest</span>}
            </a>
          </li>
        </ul>
      </nav>
    </header>
  )
}

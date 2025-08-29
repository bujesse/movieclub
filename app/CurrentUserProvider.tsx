// app/CurrentUserProvider.tsx  (Client)
'use client'
import { createContext, useContext } from 'react'

type Me = { email: string; name: string | null } | null
const Ctx = createContext<Me>(null)

export default function CurrentUserProvider({
  user,
  children,
}: {
  user: Me
  children: React.ReactNode
}) {
  return <Ctx.Provider value={user}>{children}</Ctx.Provider>
}

export function useCurrentUser() {
  return useContext(Ctx)
}

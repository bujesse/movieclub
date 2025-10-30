'use client'

import { createContext, useContext, useEffect, useState } from 'react'

type Me = { email: string; name: string | null; isAdmin: boolean }
type CtxType = {
  user: Me
  isAdmin: boolean
  isAdminMode: boolean
  setAdminMode: (v: boolean) => void
  toggleAdminMode: () => void
}
const Ctx = createContext<CtxType | null>(null)

export default function CurrentUserProvider({
  user,
  children,
}: {
  user: Me
  children: React.ReactNode
}) {
  const [isAdminMode, setIsAdminMode] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem('isAdminMode') === '1'
    setIsAdminMode(saved)
  }, [])

  useEffect(() => {
    localStorage.setItem('isAdminMode', isAdminMode ? '1' : '0')
  }, [isAdminMode])

  const toggleAdminMode = () => setIsAdminMode((v) => !v)
  const isAdmin = user.isAdmin === true

  return (
    <Ctx.Provider
      value={{ user, isAdmin, isAdminMode, setAdminMode: setIsAdminMode, toggleAdminMode }}
    >
      {children}
    </Ctx.Provider>
  )
}

export function useCurrentUser() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useCurrentUser must be used inside provider')
  return ctx
}

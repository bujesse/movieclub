import 'server-only'
import { headers, cookies } from 'next/headers'
import type { NextRequest } from 'next/server'
import { createRemoteJWKSet, jwtVerify, type JWTPayload } from 'jose'

const DOMAIN = process.env.CF_ACCESS_DOMAIN
const AUDIENCE = process.env.CF_ACCESS_AUD
if (!DOMAIN || !AUDIENCE) {
  throw new Error('Missing CF_ACCESS_DOMAIN or CF_ACCESS_AUD env vars.')
}

const ISSUER = `https://${DOMAIN}`
const JWKS = createRemoteJWKSet(new URL(`${ISSUER}/cdn-cgi/access/certs`))

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? '')
  .split(',')
  .map((s) => s.trim().toLowerCase())
  .filter(Boolean)

function computeIsAdmin(email?: string, claims?: Record<string, unknown>) {
  const e = email?.toLowerCase()
  if (!e) return false
  if (ADMIN_EMAILS.includes(e)) return true
  const roles = (claims?.roles as string[] | undefined) ?? []
  const groups = (claims?.groups as string[] | undefined) ?? []
  return roles.includes('admin') || groups.includes('admin')
}

export type CfIdentity = {
  sub?: string
  email: string
  name?: string
  iss?: string
  aud?: string | string[]
  exp?: number
  iat?: number
  nbf?: number
  custom?: {
    preferred_username?: string
  }
  claims?: JWTPayload & Record<string, unknown> // full raw claims
  isAdmin?: boolean // Not actually part of the JWT
}

const HEADER = 'Cf-Access-Jwt-Assertion'
const COOKIE = 'CF_Authorization'

async function verify(token: string): Promise<CfIdentity> {
  const { payload } = await jwtVerify(token, JWKS, { issuer: ISSUER, audience: AUDIENCE })
  const p = payload as Record<string, unknown>

  const sub = p.sub as string | undefined
  if (!sub) throw new Error('Invalid token: missing sub')

  const email = p.email as string

  const name =
    (p.name as string | undefined) ??
    (p.nickname as string | undefined) ??
    (p.preferred_username as string | undefined)

  return {
    sub,
    email,
    name,
    isAdmin: computeIsAdmin(email, payload as any),
    iss: (p.iss as string) ?? ISSUER,
    aud: (p.aud as string | string[]) ?? AUDIENCE,
    exp: p.exp as number | undefined,
    iat: p.iat as number | undefined,
    nbf: p.nbf as number | undefined,
    claims: payload as CfIdentity['claims'],
  }
}

/** Server Components / Server Actions: read from Next.js headers/cookies */
export async function getIdentity(): Promise<CfIdentity | null> {
  const dev = checkDev()
  if (dev) return dev

  const h = await headers()
  let token = h.get(HEADER)
  if (!token) {
    const c = await cookies()
    token = c.get(COOKIE)?.value ?? null
  }
  return token ? await verify(token) : null
}

/** Route Handlers: read from the incoming request (works with NextRequest) */
export async function getIdentityFromRequest(
  req: NextRequest | Request
): Promise<CfIdentity | null> {
  const dev = checkDev()
  if (dev) return dev

  const headerToken = req.headers.get(HEADER)
  let cookieToken: string | null = null

  // NextRequest has a cookies() API; plain Request does not.
  if ('cookies' in req && typeof (req as NextRequest).cookies?.get === 'function') {
    cookieToken = (req as NextRequest).cookies.get(COOKIE)?.value ?? null
  }

  const token = headerToken ?? cookieToken
  return token ? await verify(token) : null
}

function checkDev() {
  if (process.env.NODE_ENV !== 'production') {
    return {
      email: process.env.DEV_EMAIL ?? 'dev.user@gmail.com',
      name: process.env.DEV_NAME ?? 'Dev User',
      isAdmin: computeIsAdmin(process.env.DEV_EMAIL),
      custom: {
        preferred_username: process.env.DEV_NAME ?? 'dev',
      },
    }
  }
  return null
}

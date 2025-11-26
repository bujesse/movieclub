export const ROUTES = {
  HOME: '/',
  LISTS: '/lists',
  ARCHIVE: '/archive',
  HOW_IT_WORKS: '/how-it-works',
} as const

export type Route = (typeof ROUTES)[keyof typeof ROUTES]

export function isActiveRoute(pathname: string, route: Route): boolean {
  return pathname === route
}

export function shouldShowFilterControls(pathname: string): boolean {
  return pathname === ROUTES.HOME || pathname === ROUTES.LISTS
}

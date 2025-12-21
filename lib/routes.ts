export const ROUTES = {
  HOME: '/',
  LISTS: '/lists',
  COLLECTIONS: '/collections',
  ARCHIVE: '/archive',
  HOW_IT_WORKS: '/how-it-works',
  ADMIN_MEETUPS: '/admin/meetups',
} as const

export type Route = (typeof ROUTES)[keyof typeof ROUTES]

export function isActiveRoute(pathname: string, route: Route): boolean {
  return pathname === route
}

export function shouldShowFilterControls(pathname: string): boolean {
  return pathname === ROUTES.HOME || pathname === ROUTES.LISTS || pathname === ROUTES.ARCHIVE
}

/**
 * Build a URL with current filter/sort query parameters preserved
 */
export function buildRouteWithParams(
  route: Route,
  currentParams: URLSearchParams,
  filter?: string,
  sort?: string
): string {
  const params = new URLSearchParams(currentParams)

  // Update or set filter/sort if provided
  if (filter && filter !== 'all') {
    params.set('filter', filter)
  }
  if (sort && sort !== 'default') {
    params.set('sort', sort)
  }

  const queryString = params.toString()
  return queryString ? `${route}?${queryString}` : route
}

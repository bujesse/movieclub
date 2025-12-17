/**
 * Next.js instrumentation file - runs once on server startup
 * https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
 */

export function register() {
  // Enable global BigInt serialization for all API routes
  // @ts-ignore - BigInt doesn't have toJSON in TypeScript types
  BigInt.prototype.toJSON = function () {
    return this.toString()
  }
}

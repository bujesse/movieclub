# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A self-hosted Next.js web app for creating, sharing, and voting on movie recommendation lists. Designed for small movie club groups to track favorite movies and vote on lists for each meetup.

**Stack:** Next.js 15 (App Router), React 19, Prisma (SQLite), TypeScript, Bulma CSS

## Development Commands

```bash
# Install dependencies
npm install

# Setup database (first time)
cp .env.example .env  # Then edit with your values
npm run prisma:migrate

# Development
npm run dev              # Start dev server (http://localhost:3000)
npm run dev-debug        # Start with Node inspector on port 9230

# Database
npm run prisma:generate  # Generate Prisma Client
npm run prisma:migrate   # Run migrations
npm run prisma:studio    # Open Prisma Studio (--browser=none)

# Build & Production
npm run build
npm start
npm run lint
```

## Authentication Architecture

Uses **Cloudflare Access** (Zero Trust) for authentication—no login UI is needed. Authentication flow:

1. JWT tokens are extracted from `Cf-Access-Jwt-Assertion` header or `CF_Authorization` cookie
2. Tokens are verified against Cloudflare's JWKS endpoint
3. User identity (email, name, admin status) is extracted from verified JWT
4. In development, falls back to `DEV_EMAIL` and `DEV_NAME` from `.env`

**Key files:**

- `lib/cfAccess.ts`: Authentication logic with two entry points:
  - `getIdentity()`: For Server Components/Actions (uses Next.js `headers()`/`cookies()`)
  - `getIdentityFromRequest()`: For Route Handlers (uses `Request` object)

## Data Model & Meetup Voting System

### Core Concepts

**Meetup-Based Voting**: The app centers around recurring meetups. Each meetup has:

- A date (stored in UTC)
- Optional selected movie list (what was picked for that meetup)
- Associated votes (scoped to that meetup)

**Nomination System**:

- Users can nominate lists for the next meetup (see `lib/config.ts` for `MAX_NOMINATIONS_PER_USER`)
- Nominations are scoped to a specific meetup
- Each user can only have one active nomination per meetup
- Nominating a new list automatically removes any previous nomination
- Only nominated lists appear on the main voting page

**Vote Scoping**:

- Users have a max of 3-4 votes **per meetup** (see `lib/config.ts` for `MAX_VOTES`)
- Votes are tied to a specific `meetupId` to track votes across time
- Votes can only be cast on nominated lists (on the main page)
- "Current votes" = votes for the next upcoming meetup without a selected list
- "All-time votes" = total votes a list has received across all meetups

**Schema relationships** (`prisma/schema.prisma`):

```
MovieList (1) ──< (n) Movie       // Lists contain movies
MovieList (1) ──< (n) Vote        // Lists receive votes
MovieList (1) ──< (n) Nomination  // Lists receive nominations
Vote (n) ──> (1) Meetup           // Votes are scoped to meetup
Nomination (n) ──> (1) Meetup     // Nominations are scoped to meetup
MovieList (1) ──o (0-1) Meetup    // Meetup may select one list
Movie (n) ──< (n) Seen            // Track which users have seen movies
```

### Key Database Helpers

`lib/dbHelpers.ts` contains critical helpers that use raw SQL for SQLite datetime comparisons:

- `getNextMeetupWithoutList()`: Returns the next upcoming meetup that hasn't selected a list yet (where voting happens)
- `getNextMeetupWithList()`: Returns the next upcoming meetup that has a selected list
- `getPastMeetupLists()`: Returns all past meetup lists, ordered by date descending

**Important**: These helpers use `datetime()` SQLite function for proper date comparisons and accept either `PrismaClient` or `Prisma.TransactionClient`.

## Architecture Patterns

### React Context Providers

The app uses a nested provider structure in `app/layout.tsx`:

```
CurrentUserProvider       # User identity from Cloudflare Access
└─ VotesProvider         # Tracks vote count for current user
   └─ NextMeetupProvider # Next meetup data & countdown
      └─ ListsPageProvider  # Filter/sort state for lists page
```

### Data Enrichment Pattern

Lists fetched from the database are "enriched" with computed data:

1. **Base query**: Fetch lists with `movies` and `votes` (scoped to current meetup)
2. **Enrichment** (`lib/enrichLists.ts`):
   - Add `votesTotal`: All-time vote count across all meetups
   - For each movie, add:
     - `seenBy`: Array of user emails who marked it as seen
     - `seenCount`: Number of users who've seen it
     - `hasSeen`: Boolean for current user
3. **Duplicate flagging** (`app/page.tsx`):
   - Mark movies that appear in multiple lists
   - Used for visual indicators

### API Route Patterns

All API routes follow this pattern:

1. Extract user identity via `getIdentityFromRequest(req)`
2. Return 401 if not authenticated
3. Use Prisma for database operations
4. Use transactions for vote operations (to enforce limits and maintain consistency)

**Example**: `app/api/lists/[id]/vote/route.ts`

- POST: Create vote (enforces MAX_VOTES limit for current meetup)
- DELETE: Remove vote
- Both return current meetup score and all-time score

**Nomination API**: `app/api/lists/[id]/nominate/route.ts`

- POST: Create nomination (removes any previous nomination by this user for the current meetup)
- DELETE: Remove nomination
- Both operate within transactions to ensure consistency

## Page Structure

The app has three main pages:

1. **Home Page** (`app/page.tsx`): Nominated Lists
   - Shows only lists that have been nominated for the next meetup
   - Displays voting UI (upvote button with vote counts)
   - Users can vote on nominated lists
   - Includes filter/sort controls

2. **All Lists Page** (`app/lists/page.tsx`): Browse & Nominate
   - Shows all movie lists (not tied to a meetup)
   - Displays nomination UI (nominate button with star icon)
   - Users can nominate lists for the next meetup (removes previous nomination)
   - Users can create, edit, and delete their own lists
   - Includes filter/sort controls

3. **Archive Page** (`app/archive/page.tsx`): Past Meetups
   - Shows lists that were selected for past meetups
   - Read-only view with historical vote counts
   - No voting or nomination UI

## TMDB Integration

Movie data comes from The Movie Database (TMDB):

- Search happens client-side via autocomplete
- When creating/editing lists, only `tmdbId` is required
- Additional movie details (runtime, actors, directors) are fetched server-side and saved to database
- Proxy endpoint: `app/api/tmdb/[...path]/route.ts` (forwards to TMDB API with auth)
- Helper functions in `lib/tmdb.ts`:
  - `searchTmdb()`: Search movies via proxy
  - `saveMovieDetails()`: Fetch and save full movie details + credits
  - `tmdbImage()`: Generate image URLs

## Sorting & Filtering

Default list sort order (see `app/api/lists/route.ts`):

1. Current meetup votes (descending)
2. All-time votes (descending)
3. Creation date (ascending - oldest first)

Client-side sorting options (`app/page.tsx`):

- Most/Least seen (based on avg `seenCount` per movie in list)
- Creation date (ascending/descending)
- All-time votes

Filters:

- All Lists
- My Lists (created by current user)
- Voted (lists current user has voted for)

## Important Notes

- **SQLite datetime handling**: Use raw SQL with `datetime()` function for date comparisons. Prisma's date filtering doesn't work reliably with SQLite.
- **Vote transactions**: Always use `$transaction` when creating/deleting votes to ensure vote limits are enforced correctly.
- **Meetup selection**: Admin users can pick a list for a meetup via `/api/admin/pick-movie` endpoint.
- **Server-only code**: Files importing Cloudflare Access or Prisma should use `'use server'` or `import 'server-only'` directive.

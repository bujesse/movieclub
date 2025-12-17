-- AlterTable: Change budget and revenue columns from INT to BIGINT
-- This is a safe operation as BIGINT can hold all INT values
-- Solves the issue where large movie revenues (e.g. $2.8B) exceed INT max value

-- SQLite doesn't have ALTER COLUMN, so we need to recreate the table
-- IMPORTANT: Must backup junction tables first due to foreign key constraints

-- Disable foreign keys temporarily
PRAGMA foreign_keys = OFF;

-- Create backups
CREATE TABLE "GlobalMovie_backup" AS SELECT * FROM "GlobalMovie";
CREATE TABLE "MovieListMovie_backup" AS SELECT * FROM "MovieListMovie";
CREATE TABLE "CollectionMovie_backup" AS SELECT * FROM "CollectionMovie";

-- Drop the old GlobalMovie table
DROP TABLE "GlobalMovie";

-- Recreate GlobalMovie with BIGINT columns
CREATE TABLE "GlobalMovie" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "tmdbId" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "originalTitle" TEXT,
    "originalLanguage" TEXT,
    "releaseDate" DATETIME,
    "overview" TEXT,
    "voteAverage" REAL,
    "voteCount" INTEGER,
    "posterPath" TEXT,
    "backdropPath" TEXT,
    "genres" TEXT,
    "runtime" INTEGER,
    "popularity" INTEGER,
    "budget" BIGINT,
    "revenue" BIGINT,
    "original_language" TEXT,
    "directors" TEXT,
    "actors" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- Restore GlobalMovie data
INSERT INTO "GlobalMovie" SELECT * FROM "GlobalMovie_backup";

-- Drop and recreate junction tables to update foreign key references
DROP TABLE "MovieListMovie";
CREATE TABLE "MovieListMovie" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "movieListId" INTEGER NOT NULL,
    "movieId" INTEGER NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "MovieListMovie_movieListId_fkey" FOREIGN KEY ("movieListId") REFERENCES "MovieList" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "MovieListMovie_movieId_fkey" FOREIGN KEY ("movieId") REFERENCES "GlobalMovie" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

DROP TABLE "CollectionMovie";
CREATE TABLE "CollectionMovie" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "collectionId" INTEGER NOT NULL,
    "movieId" INTEGER NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CollectionMovie_collectionId_fkey" FOREIGN KEY ("collectionId") REFERENCES "Collection" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "CollectionMovie_movieId_fkey" FOREIGN KEY ("movieId") REFERENCES "GlobalMovie" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Restore junction table data
INSERT INTO "MovieListMovie" SELECT * FROM "MovieListMovie_backup";
INSERT INTO "CollectionMovie" SELECT * FROM "CollectionMovie_backup";

-- Drop backups
DROP TABLE "GlobalMovie_backup";
DROP TABLE "MovieListMovie_backup";
DROP TABLE "CollectionMovie_backup";

-- Recreate indexes
CREATE UNIQUE INDEX "GlobalMovie_tmdbId_key" ON "GlobalMovie"("tmdbId");
CREATE INDEX "GlobalMovie_tmdbId_idx" ON "GlobalMovie"("tmdbId");
CREATE INDEX "GlobalMovie_title_idx" ON "GlobalMovie"("title");
CREATE INDEX "GlobalMovie_releaseDate_idx" ON "GlobalMovie"("releaseDate");

CREATE UNIQUE INDEX "MovieListMovie_movieListId_movieId_key" ON "MovieListMovie"("movieListId", "movieId");
CREATE INDEX "MovieListMovie_movieListId_idx" ON "MovieListMovie"("movieListId");
CREATE INDEX "MovieListMovie_movieId_idx" ON "MovieListMovie"("movieId");

CREATE UNIQUE INDEX "CollectionMovie_collectionId_movieId_key" ON "CollectionMovie"("collectionId", "movieId");
CREATE INDEX "CollectionMovie_collectionId_idx" ON "CollectionMovie"("collectionId");
CREATE INDEX "CollectionMovie_movieId_idx" ON "CollectionMovie"("movieId");

-- Re-enable foreign keys
PRAGMA foreign_keys = ON;

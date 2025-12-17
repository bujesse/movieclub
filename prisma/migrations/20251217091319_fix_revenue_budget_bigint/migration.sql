-- AlterTable: Change budget and revenue columns from INT to BIGINT
-- This is a safe operation as BIGINT can hold all INT values
-- Solves the issue where large movie revenues (e.g. $2.8B) exceed INT max value

-- SQLite doesn't have ALTER COLUMN, so we need to recreate the table
-- Create backup
CREATE TABLE "GlobalMovie_backup" AS SELECT * FROM "GlobalMovie";

-- Drop the old table
DROP TABLE "GlobalMovie";

-- Recreate with BIGINT columns
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

-- Restore data
INSERT INTO "GlobalMovie" SELECT * FROM "GlobalMovie_backup";

-- Drop backup
DROP TABLE "GlobalMovie_backup";

-- Recreate indexes
CREATE UNIQUE INDEX "GlobalMovie_tmdbId_key" ON "GlobalMovie"("tmdbId");
CREATE INDEX "GlobalMovie_tmdbId_idx" ON "GlobalMovie"("tmdbId");
CREATE INDEX "GlobalMovie_title_idx" ON "GlobalMovie"("title");
CREATE INDEX "GlobalMovie_releaseDate_idx" ON "GlobalMovie"("releaseDate");

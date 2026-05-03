/*
  Warnings:

  - You are about to alter the column `isGlobal` on the `Collection` table. The data in that column could be lost. The data in that column will be cast from `Int` to `Boolean`.
  - You are about to alter the column `actors` on the `GlobalMovie` table. The data in that column could be lost. The data in that column will be cast from `String` to `Json`.
  - You are about to alter the column `directors` on the `GlobalMovie` table. The data in that column could be lost. The data in that column will be cast from `String` to `Json`.
  - You are about to alter the column `genres` on the `GlobalMovie` table. The data in that column could be lost. The data in that column will be cast from `String` to `Json`.

*/
-- AlterTable
ALTER TABLE "MovieList" ADD COLUMN "deletedAt" DATETIME;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Collection" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "letterboxdUrl" TEXT,
    "createdBy" TEXT NOT NULL,
    "isGlobal" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" DATETIME,
    "lastSyncedAt" DATETIME,
    "movieCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Collection" ("createdAt", "createdBy", "description", "id", "isGlobal", "lastSyncedAt", "letterboxdUrl", "movieCount", "name", "updatedAt") SELECT "createdAt", "createdBy", "description", "id", "isGlobal", "lastSyncedAt", "letterboxdUrl", "movieCount", "name", "updatedAt" FROM "Collection";
DROP TABLE "Collection";
ALTER TABLE "new_Collection" RENAME TO "Collection";
CREATE INDEX "Collection_createdBy_idx" ON "Collection"("createdBy");
CREATE INDEX "Collection_isGlobal_idx" ON "Collection"("isGlobal");
CREATE INDEX "Collection_deletedAt_idx" ON "Collection"("deletedAt");
CREATE TABLE "new_GlobalMovie" (
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
    "genres" JSONB,
    "runtime" INTEGER,
    "popularity" INTEGER,
    "budget" BIGINT,
    "revenue" BIGINT,
    "original_language" TEXT,
    "directors" JSONB,
    "actors" JSONB,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_GlobalMovie" ("actors", "backdropPath", "budget", "createdAt", "directors", "genres", "id", "originalLanguage", "originalTitle", "original_language", "overview", "popularity", "posterPath", "releaseDate", "revenue", "runtime", "title", "tmdbId", "updatedAt", "voteAverage", "voteCount") SELECT "actors", "backdropPath", "budget", "createdAt", "directors", "genres", "id", "originalLanguage", "originalTitle", "original_language", "overview", "popularity", "posterPath", "releaseDate", "revenue", "runtime", "title", "tmdbId", "updatedAt", "voteAverage", "voteCount" FROM "GlobalMovie";
DROP TABLE "GlobalMovie";
ALTER TABLE "new_GlobalMovie" RENAME TO "GlobalMovie";
CREATE UNIQUE INDEX "GlobalMovie_tmdbId_key" ON "GlobalMovie"("tmdbId");
CREATE INDEX "GlobalMovie_tmdbId_idx" ON "GlobalMovie"("tmdbId");
CREATE INDEX "GlobalMovie_title_idx" ON "GlobalMovie"("title");
CREATE INDEX "GlobalMovie_releaseDate_idx" ON "GlobalMovie"("releaseDate");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "MovieList_deletedAt_idx" ON "MovieList"("deletedAt");

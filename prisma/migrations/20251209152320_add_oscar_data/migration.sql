-- CreateTable
CREATE TABLE "OscarNomination" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "tmdbId" INTEGER,
    "imdbId" TEXT NOT NULL,
    "ceremony" INTEGER NOT NULL,
    "year" TEXT NOT NULL,
    "class" TEXT NOT NULL,
    "canonicalCategory" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "nomId" TEXT NOT NULL,
    "film" TEXT NOT NULL,
    "name" TEXT,
    "nominees" TEXT,
    "nomineeIds" TEXT,
    "winner" BOOLEAN NOT NULL DEFAULT false,
    "detail" TEXT,
    "note" TEXT,
    "citation" TEXT,
    "multifilmNomination" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "OscarMovieSummary" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "tmdbId" INTEGER NOT NULL,
    "imdbId" TEXT NOT NULL,
    "totalNominations" INTEGER NOT NULL DEFAULT 0,
    "totalWins" INTEGER NOT NULL DEFAULT 0,
    "categoryBreakdown" JSONB,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE INDEX "OscarNomination_tmdbId_idx" ON "OscarNomination"("tmdbId");

-- CreateIndex
CREATE INDEX "OscarNomination_imdbId_idx" ON "OscarNomination"("imdbId");

-- CreateIndex
CREATE UNIQUE INDEX "OscarNomination_nomId_key" ON "OscarNomination"("nomId");

-- CreateIndex
CREATE UNIQUE INDEX "OscarMovieSummary_tmdbId_key" ON "OscarMovieSummary"("tmdbId");

-- CreateIndex
CREATE INDEX "OscarMovieSummary_tmdbId_idx" ON "OscarMovieSummary"("tmdbId");

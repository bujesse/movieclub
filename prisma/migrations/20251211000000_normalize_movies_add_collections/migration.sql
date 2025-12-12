-- CreateTable: GlobalMovie (normalized movie table)
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
    "budget" INTEGER,
    "revenue" INTEGER,
    "original_language" TEXT,
    "directors" TEXT,
    "actors" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable: MovieListMovie (junction table)
CREATE TABLE "MovieListMovie" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "movieListId" INTEGER NOT NULL,
    "movieId" INTEGER NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "MovieListMovie_movieListId_fkey" FOREIGN KEY ("movieListId") REFERENCES "MovieList" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "MovieListMovie_movieId_fkey" FOREIGN KEY ("movieId") REFERENCES "GlobalMovie" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable: Collection
CREATE TABLE "Collection" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "letterboxdUrl" TEXT,
    "createdBy" TEXT NOT NULL,
    "isGlobal" INTEGER NOT NULL DEFAULT 0,
    "lastSyncedAt" DATETIME,
    "movieCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable: CollectionMovie (junction table)
CREATE TABLE "CollectionMovie" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "collectionId" INTEGER NOT NULL,
    "movieId" INTEGER NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CollectionMovie_collectionId_fkey" FOREIGN KEY ("collectionId") REFERENCES "Collection" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "CollectionMovie_movieId_fkey" FOREIGN KEY ("movieId") REFERENCES "GlobalMovie" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Migrate data: Deduplicate Movie records into GlobalMovie
-- For each unique tmdbId, take the most recently updated record
INSERT INTO "GlobalMovie" (
    "tmdbId", "title", "originalTitle", "originalLanguage", "releaseDate",
    "overview", "voteAverage", "voteCount", "posterPath", "backdropPath",
    "genres", "runtime", "popularity", "budget", "revenue",
    "original_language", "directors", "actors", "createdAt", "updatedAt"
)
SELECT
    "tmdbId",
    MAX("title") as "title",
    MAX("originalTitle") as "originalTitle",
    MAX("originalLanguage") as "originalLanguage",
    MAX("releaseDate") as "releaseDate",
    MAX("overview") as "overview",
    MAX("voteAverage") as "voteAverage",
    MAX("voteCount") as "voteCount",
    MAX("posterPath") as "posterPath",
    MAX("backdropPath") as "backdropPath",
    MAX("genres") as "genres",
    MAX("runtime") as "runtime",
    MAX("popularity") as "popularity",
    MAX("budget") as "budget",
    MAX("revenue") as "revenue",
    MAX("original_language") as "original_language",
    MAX("directors") as "directors",
    MAX("actors") as "actors",
    MIN("createdAt") as "createdAt",
    MAX("updatedAt") as "updatedAt"
FROM "Movie"
GROUP BY "tmdbId";

-- Migrate data: Populate MovieListMovie junction from old Movie table
INSERT INTO "MovieListMovie" ("movieListId", "movieId", "order", "createdAt")
SELECT
    m."movieListId",
    gm."id",
    0,
    m."createdAt"
FROM "Movie" m
INNER JOIN "GlobalMovie" gm ON m."tmdbId" = gm."tmdbId";

-- CreateIndex
CREATE UNIQUE INDEX "GlobalMovie_tmdbId_key" ON "GlobalMovie"("tmdbId");
CREATE INDEX "GlobalMovie_tmdbId_idx" ON "GlobalMovie"("tmdbId");
CREATE INDEX "GlobalMovie_title_idx" ON "GlobalMovie"("title");
CREATE INDEX "GlobalMovie_releaseDate_idx" ON "GlobalMovie"("releaseDate");

CREATE UNIQUE INDEX "MovieListMovie_movieListId_movieId_key" ON "MovieListMovie"("movieListId", "movieId");
CREATE INDEX "MovieListMovie_movieListId_idx" ON "MovieListMovie"("movieListId");
CREATE INDEX "MovieListMovie_movieId_idx" ON "MovieListMovie"("movieId");

CREATE INDEX "Collection_createdBy_idx" ON "Collection"("createdBy");
CREATE INDEX "Collection_isGlobal_idx" ON "Collection"("isGlobal");

CREATE UNIQUE INDEX "CollectionMovie_collectionId_movieId_key" ON "CollectionMovie"("collectionId", "movieId");
CREATE INDEX "CollectionMovie_collectionId_idx" ON "CollectionMovie"("collectionId");
CREATE INDEX "CollectionMovie_movieId_idx" ON "CollectionMovie"("movieId");

-- Drop old Movie table
DROP TABLE "Movie";

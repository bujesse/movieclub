-- CreateTable
CREATE TABLE "MovieList" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "createdBy" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Movie" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "movieListId" INTEGER NOT NULL,
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
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Movie_movieListId_fkey" FOREIGN KEY ("movieListId") REFERENCES "MovieList" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Vote" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "movieListId" INTEGER NOT NULL,
    "userId" TEXT NOT NULL,
    "value" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "meetupId" INTEGER NOT NULL,
    CONSTRAINT "Vote_movieListId_fkey" FOREIGN KEY ("movieListId") REFERENCES "MovieList" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Vote_meetupId_fkey" FOREIGN KEY ("meetupId") REFERENCES "Meetup" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Meetup" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "date" DATETIME,
    "movieListId" INTEGER,
    CONSTRAINT "Meetup_movieListId_fkey" FOREIGN KEY ("movieListId") REFERENCES "MovieList" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "MovieList_createdBy_idx" ON "MovieList"("createdBy");

-- CreateIndex
CREATE INDEX "MovieList_createdAt_idx" ON "MovieList"("createdAt");

-- CreateIndex
CREATE INDEX "Movie_tmdbId_idx" ON "Movie"("tmdbId");

-- CreateIndex
CREATE INDEX "Movie_title_idx" ON "Movie"("title");

-- CreateIndex
CREATE INDEX "Movie_releaseDate_idx" ON "Movie"("releaseDate");

-- CreateIndex
CREATE UNIQUE INDEX "Movie_movieListId_tmdbId_key" ON "Movie"("movieListId", "tmdbId");

-- CreateIndex
CREATE INDEX "Vote_userId_meetupId_idx" ON "Vote"("userId", "meetupId");

-- CreateIndex
CREATE UNIQUE INDEX "Vote_movieListId_userId_meetupId_key" ON "Vote"("movieListId", "userId", "meetupId");

-- CreateIndex
CREATE UNIQUE INDEX "Meetup_movieListId_key" ON "Meetup"("movieListId");

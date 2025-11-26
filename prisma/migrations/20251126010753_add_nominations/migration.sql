-- CreateTable
CREATE TABLE "Nomination" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "movieListId" INTEGER NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "meetupId" INTEGER NOT NULL,
    CONSTRAINT "Nomination_movieListId_fkey" FOREIGN KEY ("movieListId") REFERENCES "MovieList" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Nomination_meetupId_fkey" FOREIGN KEY ("meetupId") REFERENCES "Meetup" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "Nomination_movieListId_meetupId_idx" ON "Nomination"("movieListId", "meetupId");

-- CreateIndex
CREATE INDEX "Nomination_userId_meetupId_idx" ON "Nomination"("userId", "meetupId");

-- CreateIndex
CREATE UNIQUE INDEX "Nomination_userId_meetupId_key" ON "Nomination"("userId", "meetupId");

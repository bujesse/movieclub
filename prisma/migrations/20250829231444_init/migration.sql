-- AlterTable
ALTER TABLE "MovieList" ADD COLUMN "description" TEXT;

-- CreateTable
CREATE TABLE "Meetup" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "date" DATETIME,
    "movieListId" INTEGER,
    CONSTRAINT "Meetup_movieListId_fkey" FOREIGN KEY ("movieListId") REFERENCES "MovieList" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Meetup_movieListId_key" ON "Meetup"("movieListId");

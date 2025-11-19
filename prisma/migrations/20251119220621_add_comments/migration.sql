-- CreateTable
CREATE TABLE "Comment" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "movieListId" INTEGER NOT NULL,
    "userId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Comment_movieListId_fkey" FOREIGN KEY ("movieListId") REFERENCES "MovieList" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "Comment_movieListId_idx" ON "Comment"("movieListId");

-- CreateIndex
CREATE INDEX "Comment_userId_idx" ON "Comment"("userId");

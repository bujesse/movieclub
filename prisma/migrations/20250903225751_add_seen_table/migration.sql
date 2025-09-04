-- CreateTable
CREATE TABLE "Seen" (
    "userId" TEXT NOT NULL,
    "tmdbId" INTEGER NOT NULL,
    "firstSeenAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeenAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY ("userId", "tmdbId")
);

-- CreateIndex
CREATE INDEX "Seen_tmdbId_idx" ON "Seen"("tmdbId");

-- CreateIndex
CREATE INDEX "Seen_userId_idx" ON "Seen"("userId");

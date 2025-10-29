-- AlterTable
ALTER TABLE "Movie" ADD COLUMN "actors" JSONB;
ALTER TABLE "Movie" ADD COLUMN "budget" INTEGER;
ALTER TABLE "Movie" ADD COLUMN "directors" JSONB;
ALTER TABLE "Movie" ADD COLUMN "original_language" TEXT;
ALTER TABLE "Movie" ADD COLUMN "popularity" INTEGER;
ALTER TABLE "Movie" ADD COLUMN "revenue" INTEGER;
ALTER TABLE "Movie" ADD COLUMN "runtime" INTEGER;

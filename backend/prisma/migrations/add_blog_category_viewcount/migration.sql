-- AlterTable BlogPost
ALTER TABLE "BlogPost" ADD COLUMN "category" TEXT;
ALTER TABLE "BlogPost" ADD COLUMN "viewCount" INTEGER NOT NULL DEFAULT 0;

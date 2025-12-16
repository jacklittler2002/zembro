-- AlterTable
ALTER TABLE "Company" ADD COLUMN     "isArchived" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isFavorited" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "notes" TEXT;

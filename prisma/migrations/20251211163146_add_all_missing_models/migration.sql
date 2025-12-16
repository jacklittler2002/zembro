-- CreateEnum
CREATE TYPE "CompanySize" AS ENUM ('MICRO', 'SMALL', 'SMB', 'MIDMARKET', 'ENTERPRISE');

-- AlterTable
ALTER TABLE "Company" ADD COLUMN     "addressRaw" TEXT,
ADD COLUMN     "businessType" TEXT,
ADD COLUMN     "facebookUrl" TEXT,
ADD COLUMN     "hqCity" TEXT,
ADD COLUMN     "hqCountry" TEXT,
ADD COLUMN     "idealCustomerNotes" TEXT,
ADD COLUMN     "industry" TEXT,
ADD COLUMN     "instagramUrl" TEXT,
ADD COLUMN     "keywords" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "linkedinUrl" TEXT,
ADD COLUMN     "sizeBucket" "CompanySize",
ADD COLUMN     "twitterUrl" TEXT;

-- AlterTable
ALTER TABLE "Contact" ADD COLUMN     "isLikelyDecisionMaker" BOOLEAN NOT NULL DEFAULT false;

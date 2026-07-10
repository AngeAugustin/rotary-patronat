-- AlterTable
ALTER TABLE "members" ADD COLUMN     "sponsorFirstName" TEXT,
ADD COLUMN     "sponsorLastName" TEXT;

-- AlterTable
ALTER TABLE "membership_applications" ADD COLUMN     "sponsorFirstName" TEXT,
ADD COLUMN     "sponsorLastName" TEXT;

-- Add coordinator role and assign users to a region when needed.
ALTER TYPE "Role" ADD VALUE 'COORDINATOR';

ALTER TABLE "User"
ADD COLUMN "regionId" TEXT;

ALTER TABLE "User"
ADD CONSTRAINT "User_regionId_fkey"
FOREIGN KEY ("regionId") REFERENCES "Region"("id")
ON DELETE SET NULL
ON UPDATE CASCADE;

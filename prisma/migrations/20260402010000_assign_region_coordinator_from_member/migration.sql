ALTER TABLE "Region"
ADD COLUMN "coordinatorMemberId" TEXT;

ALTER TABLE "Region"
ADD CONSTRAINT "Region_coordinatorMemberId_key" UNIQUE ("coordinatorMemberId");

ALTER TABLE "Region"
ADD CONSTRAINT "Region_coordinatorMemberId_fkey"
FOREIGN KEY ("coordinatorMemberId") REFERENCES "Member"("id")
ON DELETE SET NULL
ON UPDATE CASCADE;

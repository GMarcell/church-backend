/*
  Warnings:

  - You are about to drop the column `status` on the `Member` table. All the data in the column will be lost.
  - Added the required column `role` to the `Member` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "MemberRole" AS ENUM ('FAMILY_HEAD', 'WIFE', 'CHILD', 'OTHER');

-- AlterTable
ALTER TABLE "Member" DROP COLUMN "status",
ADD COLUMN     "role" "MemberRole" NOT NULL;

-- DropEnum
DROP TYPE "MemberStatus";

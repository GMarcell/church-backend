/*
  Warnings:

  - You are about to drop the `Giving` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `status` to the `Member` table without a default value. This is not possible if the table is not empty.
  - Made the column `birthDate` on table `Member` required. This step will fail if there are existing NULL values in that column.

*/
-- CreateEnum
CREATE TYPE "MemberStatus" AS ENUM ('FAMILY_HEAD', 'WIFE', 'CHILD', 'OTHER');

-- DropForeignKey
ALTER TABLE "Giving" DROP CONSTRAINT "Giving_memberId_fkey";

-- AlterTable
ALTER TABLE "Member" ADD COLUMN     "status" "MemberStatus" NOT NULL,
ALTER COLUMN "birthDate" SET NOT NULL;

-- DropTable
DROP TABLE "Giving";

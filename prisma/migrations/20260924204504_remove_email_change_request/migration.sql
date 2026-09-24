/*
  Warnings:

  - You are about to drop the `EmailChangeRequest` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "EmailChangeRequest" DROP CONSTRAINT "EmailChangeRequest_userId_fkey";

-- DropTable
DROP TABLE "EmailChangeRequest";

/*
  Warnings:

  - You are about to drop the column `comment` on the `Expense` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Expense" DROP COLUMN "comment",
ADD COLUMN     "comments" TEXT;

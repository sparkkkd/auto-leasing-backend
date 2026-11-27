/*
  Warnings:

  - You are about to drop the column `note` on the `Expense` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Expense" DROP COLUMN "note",
ADD COLUMN     "comment" TEXT,
ADD COLUMN     "notes" TEXT[];

/*
  Warnings:

  - The `notes` column on the `clients` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `notes` column on the `deals` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `notes` column on the `investors` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the column `comment` on the `payments` table. All the data in the column will be lost.
  - You are about to drop the column `paidAt` on the `payments` table. All the data in the column will be lost.
  - Added the required column `finalCarPrice` to the `deals` table without a default value. This is not possible if the table is not empty.
  - Added the required column `firstPayment` to the `deals` table without a default value. This is not possible if the table is not empty.
  - Added the required column `monthlyPayment` to the `deals` table without a default value. This is not possible if the table is not empty.
  - Added the required column `term` to the `deals` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `documents` table without a default value. This is not possible if the table is not empty.
  - Added the required column `paymentDate` to the `payments` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "ExpenseType" AS ENUM ('CAR', 'RENT', 'OTHER');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "CarStatus" ADD VALUE 'IN_PURCHASE';
ALTER TYPE "CarStatus" ADD VALUE 'FOR_ISSUE';
ALTER TYPE "CarStatus" ADD VALUE 'SEIZED';

-- AlterEnum
ALTER TYPE "DealStatus" ADD VALUE 'TERMINATED';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "DocumentType" ADD VALUE 'PTS';
ALTER TYPE "DocumentType" ADD VALUE 'STS';
ALTER TYPE "DocumentType" ADD VALUE 'INSURANCE';
ALTER TYPE "DocumentType" ADD VALUE 'INVESTMENT_CONTRACT';
ALTER TYPE "DocumentType" ADD VALUE 'DCP';

-- DropForeignKey
ALTER TABLE "deals" DROP CONSTRAINT "deals_carId_fkey";

-- DropForeignKey
ALTER TABLE "deals" DROP CONSTRAINT "deals_clientId_fkey";

-- DropForeignKey
ALTER TABLE "deals" DROP CONSTRAINT "deals_investorId_fkey";

-- DropForeignKey
ALTER TABLE "documents" DROP CONSTRAINT "documents_dealId_fkey";

-- DropForeignKey
ALTER TABLE "documents" DROP CONSTRAINT "documents_paymentId_fkey";

-- DropForeignKey
ALTER TABLE "payments" DROP CONSTRAINT "payments_dealId_fkey";

-- DropIndex
DROP INDEX "deals_carId_key";

-- AlterTable
ALTER TABLE "cars" ADD COLUMN     "clientId" TEXT,
ADD COLUMN     "comments" TEXT,
ADD COLUMN     "equipment" TEXT,
ADD COLUMN     "notes" TEXT[],
ADD COLUMN     "showroom" TEXT,
ALTER COLUMN "vin" DROP NOT NULL;

-- AlterTable
ALTER TABLE "clients" ADD COLUMN     "comments" TEXT,
DROP COLUMN "notes",
ADD COLUMN     "notes" TEXT[];

-- AlterTable
ALTER TABLE "deals" ADD COLUMN     "comments" TEXT,
ADD COLUMN     "contractScanId" TEXT,
ADD COLUMN     "finalCarPrice" DECIMAL(65,30) NOT NULL,
ADD COLUMN     "firstPayment" DECIMAL(65,30) NOT NULL,
ADD COLUMN     "investorContractScanId" TEXT,
ADD COLUMN     "monthlyPayment" DECIMAL(65,30) NOT NULL,
ADD COLUMN     "term" INTEGER NOT NULL,
DROP COLUMN "notes",
ADD COLUMN     "notes" TEXT[];

-- AlterTable
ALTER TABLE "documents" ADD COLUMN     "carId" TEXT,
ADD COLUMN     "clientId" TEXT,
ADD COLUMN     "comments" TEXT,
ADD COLUMN     "expiresAt" TIMESTAMP(3),
ADD COLUMN     "investorId" TEXT,
ADD COLUMN     "notes" TEXT[],
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "investors" ADD COLUMN     "comments" TEXT,
DROP COLUMN "notes",
ADD COLUMN     "notes" TEXT[];

-- AlterTable
ALTER TABLE "payments" DROP COLUMN "comment",
DROP COLUMN "paidAt",
ADD COLUMN     "comments" TEXT,
ADD COLUMN     "notes" TEXT[],
ADD COLUMN     "paymentDate" TIMESTAMP(3) NOT NULL;

-- CreateTable
CREATE TABLE "Expense" (
    "id" TEXT NOT NULL,
    "type" "ExpenseType" NOT NULL,
    "note" TEXT NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL,
    "carId" TEXT,
    "authorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Expense_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "cars" ADD CONSTRAINT "cars_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deals" ADD CONSTRAINT "deals_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deals" ADD CONSTRAINT "deals_investorId_fkey" FOREIGN KEY ("investorId") REFERENCES "investors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deals" ADD CONSTRAINT "deals_carId_fkey" FOREIGN KEY ("carId") REFERENCES "cars"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deals" ADD CONSTRAINT "deals_contractScanId_fkey" FOREIGN KEY ("contractScanId") REFERENCES "documents"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deals" ADD CONSTRAINT "deals_investorContractScanId_fkey" FOREIGN KEY ("investorContractScanId") REFERENCES "documents"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_dealId_fkey" FOREIGN KEY ("dealId") REFERENCES "deals"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_investorId_fkey" FOREIGN KEY ("investorId") REFERENCES "investors"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_dealId_fkey" FOREIGN KEY ("dealId") REFERENCES "deals"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "payments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_carId_fkey" FOREIGN KEY ("carId") REFERENCES "cars"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_carId_fkey" FOREIGN KEY ("carId") REFERENCES "cars"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

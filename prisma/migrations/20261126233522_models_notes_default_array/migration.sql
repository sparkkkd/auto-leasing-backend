-- AlterTable
ALTER TABLE "Expense" ALTER COLUMN "notes" SET DEFAULT ARRAY[]::TEXT[];

-- AlterTable
ALTER TABLE "cars" ALTER COLUMN "notes" SET DEFAULT ARRAY[]::TEXT[];

-- AlterTable
ALTER TABLE "clients" ALTER COLUMN "notes" SET DEFAULT ARRAY[]::TEXT[];

-- AlterTable
ALTER TABLE "deals" ALTER COLUMN "notes" SET DEFAULT ARRAY[]::TEXT[];

-- AlterTable
ALTER TABLE "documents" ALTER COLUMN "notes" SET DEFAULT ARRAY[]::TEXT[];

-- AlterTable
ALTER TABLE "investors" ALTER COLUMN "notes" SET DEFAULT ARRAY[]::TEXT[];

-- AlterTable
ALTER TABLE "payments" ALTER COLUMN "notes" SET DEFAULT ARRAY[]::TEXT[];

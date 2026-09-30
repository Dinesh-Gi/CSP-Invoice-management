-- AlterTable
ALTER TABLE "Transaction" ADD COLUMN     "sourceRow" INTEGER,
ALTER COLUMN "transactionType" DROP NOT NULL,
ALTER COLUMN "invoiceStatus" DROP NOT NULL;

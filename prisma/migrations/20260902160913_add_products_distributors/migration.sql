/*
  Warnings:

  - You are about to drop the column `distributor` on the `Transaction` table. All the data in the column will be lost.
  - You are about to drop the column `license` on the `Transaction` table. All the data in the column will be lost.
  - You are about to alter the column `buyPrice` on the `Transaction` table. The data in that column could be lost. The data in that column will be cast from `Decimal(18,2)` to `Decimal(18,4)`.
  - You are about to alter the column `sellPrice` on the `Transaction` table. The data in that column could be lost. The data in that column will be cast from `Decimal(18,2)` to `Decimal(18,4)`.
  - You are about to alter the column `proratePrice` on the `Transaction` table. The data in that column could be lost. The data in that column will be cast from `Decimal(18,2)` to `Decimal(18,4)`.
  - A unique constraint covering the columns `[name]` on the table `Customer` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `productId` to the `Transaction` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Transaction" DROP COLUMN "distributor",
DROP COLUMN "license",
ADD COLUMN     "distributorId" INTEGER,
ADD COLUMN     "periodLabel" TEXT,
ADD COLUMN     "productId" INTEGER NOT NULL,
ALTER COLUMN "buyPrice" SET DATA TYPE DECIMAL(18,4),
ALTER COLUMN "sellPrice" SET DATA TYPE DECIMAL(18,4),
ALTER COLUMN "proratePrice" SET DATA TYPE DECIMAL(18,4);

-- CreateTable
CREATE TABLE "Product" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Distributor" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Distributor_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Product_name_key" ON "Product"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Distributor_name_key" ON "Distributor"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Customer_name_key" ON "Customer"("name");

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_distributorId_fkey" FOREIGN KEY ("distributorId") REFERENCES "Distributor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

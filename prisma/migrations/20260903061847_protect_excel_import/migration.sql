/*
  Warnings:

  - A unique constraint covering the columns `[sourceRow]` on the table `Transaction` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Transaction_sourceRow_key" ON "Transaction"("sourceRow");

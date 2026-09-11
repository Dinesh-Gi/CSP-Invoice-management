-- CreateTable
CREATE TABLE "Customer" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Customer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Transaction" (
    "id" SERIAL NOT NULL,
    "customerId" INTEGER NOT NULL,
    "transactionDate" TIMESTAMP(3) NOT NULL,
    "poNumber" TEXT,
    "transactionType" TEXT NOT NULL,
    "license" TEXT NOT NULL,
    "buyPrice" DECIMAL(18,2) NOT NULL,
    "sellPrice" DECIMAL(18,2) NOT NULL,
    "proratePrice" DECIMAL(18,2),
    "prorateDays" INTEGER,
    "subscriptionStart" TIMESTAMP(3),
    "subscriptionEnd" TIMESTAMP(3),
    "quantity" INTEGER NOT NULL,
    "distributor" TEXT,
    "invoiceStatus" TEXT NOT NULL,
    "paymentStatus" TEXT,
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Transaction_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

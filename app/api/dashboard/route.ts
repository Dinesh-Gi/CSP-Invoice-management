import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth/session";

export async function GET() {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json(
        {
          success: false,
          message: "Authentication required.",
        },
        { status: 401 }
      );
    }

    const transactions = await prisma.transaction.findMany({
      orderBy: {
        transactionDate: "desc",
      },
      include: {
        customer: {
          select: {
            name: true,
          },
        },
        product: {
          select: {
            name: true,
          },
        },
        distributor: {
          select: {
            name: true,
          },
        },
      },
    });

    const detailedTransactions = transactions.map((transaction) => {
      const buyPrice = Number(transaction.buyPrice);
      const sellPrice = Number(transaction.sellPrice);

      const proratePrice =
        transaction.proratePrice !== null
          ? Number(transaction.proratePrice)
          : null;

      const quantity = Number(transaction.quantity);

      const revenue =
        proratePrice !== null && proratePrice !== 0
          ? proratePrice * quantity
          : sellPrice * quantity;

      const profit = (sellPrice - buyPrice) * quantity;

      const margin =
        buyPrice !== 0 ? ((sellPrice - buyPrice) / buyPrice) * 100 : 0;

      return {
        id: transaction.id,
        sourceRow: transaction.sourceRow,
        date: transaction.transactionDate,
        customer: transaction.customer.name,
        product: transaction.product.name,
        distributor: transaction.distributor?.name ?? null,
        poNumber: transaction.poNumber,
        transactionType: transaction.transactionType,
        buyPrice,
        sellPrice,
        proratePrice,
        quantity,
        revenue,
        profit,
        margin,
        invoiceStatus: transaction.invoiceStatus,
        paymentStatus: transaction.paymentStatus,
        remarks: transaction.remarks,
        subscriptionStart: transaction.subscriptionStart,
        subscriptionEnd: transaction.subscriptionEnd,
        prorateDays: transaction.prorateDays,
        periodLabel: transaction.periodLabel,
      };
    });

    const totalRevenue = detailedTransactions.reduce(
      (sum, transaction) => sum + transaction.revenue,
      0
    );

    const totalProfit = detailedTransactions.reduce(
      (sum, transaction) => sum + transaction.profit,
      0
    );

    const totalQuantity = detailedTransactions.reduce(
      (sum, transaction) => sum + transaction.quantity,
      0
    );

    const overallMargin =
      totalRevenue !== 0 ? (totalProfit / totalRevenue) * 100 : 0;

    const invoiceMap = new Map<
      string,
      { count: number; revenue: number }
    >();

    const paymentMap = new Map<
      string,
      { count: number; revenue: number }
    >();

    const transactionTypeMap = new Map<
      string,
      { count: number; revenue: number; profit: number }
    >();

    const customerMap = new Map<
      string,
      {
        transactions: number;
        quantity: number;
        revenue: number;
        profit: number;
      }
    >();

    const productMap = new Map<
      string,
      {
        transactions: number;
        quantity: number;
        revenue: number;
        profit: number;
      }
    >();

    const distributorMap = new Map<
      string,
      {
        transactions: number;
        quantity: number;
        revenue: number;
        profit: number;
      }
    >();

    const monthlyMap = new Map<
      string,
      { revenue: number; profit: number }
    >();

    for (const transaction of detailedTransactions) {
      const invoiceStatus = transaction.invoiceStatus?.trim() || "Not Set";
      const paymentStatus = transaction.paymentStatus?.trim() || "Not Set";
      const transactionType =
        transaction.transactionType?.trim() || "Not Set";

      const invoiceExisting = invoiceMap.get(invoiceStatus) || {
        count: 0,
        revenue: 0,
      };
      invoiceExisting.count += 1;
      invoiceExisting.revenue += transaction.revenue;
      invoiceMap.set(invoiceStatus, invoiceExisting);

      const paymentExisting = paymentMap.get(paymentStatus) || {
        count: 0,
        revenue: 0,
      };
      paymentExisting.count += 1;
      paymentExisting.revenue += transaction.revenue;
      paymentMap.set(paymentStatus, paymentExisting);

      const typeExisting = transactionTypeMap.get(transactionType) || {
        count: 0,
        revenue: 0,
        profit: 0,
      };
      typeExisting.count += 1;
      typeExisting.revenue += transaction.revenue;
      typeExisting.profit += transaction.profit;
      transactionTypeMap.set(transactionType, typeExisting);

      const customerExisting = customerMap.get(transaction.customer) || {
        transactions: 0,
        quantity: 0,
        revenue: 0,
        profit: 0,
      };
      customerExisting.transactions += 1;
      customerExisting.quantity += transaction.quantity;
      customerExisting.revenue += transaction.revenue;
      customerExisting.profit += transaction.profit;
      customerMap.set(transaction.customer, customerExisting);

      const productExisting = productMap.get(transaction.product) || {
        transactions: 0,
        quantity: 0,
        revenue: 0,
        profit: 0,
      };
      productExisting.transactions += 1;
      productExisting.quantity += transaction.quantity;
      productExisting.revenue += transaction.revenue;
      productExisting.profit += transaction.profit;
      productMap.set(transaction.product, productExisting);

      const distributorName = transaction.distributor || "Not Assigned";
      const distributorExisting =
        distributorMap.get(distributorName) || {
          transactions: 0,
          quantity: 0,
          revenue: 0,
          profit: 0,
        };
      distributorExisting.transactions += 1;
      distributorExisting.quantity += transaction.quantity;
      distributorExisting.revenue += transaction.revenue;
      distributorExisting.profit += transaction.profit;
      distributorMap.set(distributorName, distributorExisting);

      const date = new Date(transaction.date);
      const monthKey = `${date.getFullYear()}-${String(
        date.getMonth() + 1
      ).padStart(2, "0")}`;

      const monthlyExisting = monthlyMap.get(monthKey) || {
        revenue: 0,
        profit: 0,
      };
      monthlyExisting.revenue += transaction.revenue;
      monthlyExisting.profit += transaction.profit;
      monthlyMap.set(monthKey, monthlyExisting);
    }

    const invoiceStatuses = Array.from(invoiceMap.entries())
      .map(([name, value]) => ({
        name,
        count: value.count,
        revenue: value.revenue,
      }))
      .sort((a, b) => b.count - a.count);

    const paymentStatuses = Array.from(paymentMap.entries())
      .map(([name, value]) => ({
        name,
        count: value.count,
        revenue: value.revenue,
      }))
      .sort((a, b) => b.count - a.count);

    const transactionTypes = Array.from(transactionTypeMap.entries())
      .map(([name, value]) => ({
        name,
        count: value.count,
        revenue: value.revenue,
        profit: value.profit,
      }))
      .sort((a, b) => b.revenue - a.revenue);

    const revenueByCustomer = Array.from(customerMap.entries())
      .map(([name, value]) => ({
        name,
        transactions: value.transactions,
        quantity: value.quantity,
        revenue: value.revenue,
        profit: value.profit,
      }))
      .sort((a, b) => b.revenue - a.revenue);

    const revenueByProduct = Array.from(productMap.entries())
      .map(([name, value]) => ({
        name,
        transactions: value.transactions,
        quantity: value.quantity,
        revenue: value.revenue,
        profit: value.profit,
      }))
      .sort((a, b) => b.revenue - a.revenue);

    const revenueByDistributor = Array.from(distributorMap.entries())
      .map(([name, value]) => ({
        name,
        transactions: value.transactions,
        quantity: value.quantity,
        revenue: value.revenue,
        profit: value.profit,
      }))
      .sort((a, b) => b.revenue - a.revenue);

    const monthlyTrend = Array.from(monthlyMap.entries())
      .map(([month, value]) => {
        const [year, monthNumber] = month.split("-");
        const date = new Date(
          Number(year),
          Number(monthNumber) - 1,
          1
        );

        return {
          month: date.toLocaleDateString("en-IN", {
            month: "short",
            year: "numeric",
          }),
          revenue: value.revenue,
          profit: value.profit,
          sortKey: month,
        };
      })
      .sort((a, b) => a.sortKey.localeCompare(b.sortKey))
      .map(({ sortKey: _sortKey, ...item }) => item);

    const actionRequired = detailedTransactions.filter((transaction) => {
      const invoiceStatus =
        transaction.invoiceStatus?.trim().toLowerCase() || "";

      const paymentStatus =
        transaction.paymentStatus?.trim().toLowerCase() || "";

      const invoiceNeedsAction = invoiceStatus !== "invoice sent";
      const paymentNeedsAction = paymentStatus === "no";

      return invoiceNeedsAction || paymentNeedsAction;
    });

    return NextResponse.json({
      success: true,

      summary: {
        totalRevenue,
        totalProfit,
        overallMargin,
        totalTransactions: detailedTransactions.length,
        totalQuantity,
        actionRequiredCount: actionRequired.length,
      },

      invoiceStatuses,
      paymentStatuses,
      transactionTypes,
      revenueByCustomer,
      revenueByProduct,
      revenueByDistributor,
      monthlyTrend,
      actionRequired,
      recentTransactions: detailedTransactions.slice(0, 8),
    });
  } catch (error) {
    console.error("Dashboard GET error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to load dashboard data.",
      },
      { status: 500 }
    );
  }
}

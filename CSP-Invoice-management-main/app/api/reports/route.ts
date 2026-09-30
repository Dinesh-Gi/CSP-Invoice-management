import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function calculateRevenue(
  sellPrice: number,
  proratePrice: number | null,
  quantity: number
) {
  if (proratePrice !== null && proratePrice !== 0) {
    return proratePrice * quantity;
  }

  return sellPrice * quantity;
}

function calculateProfit(
  buyPrice: number,
  sellPrice: number,
  quantity: number
) {
  return (sellPrice - buyPrice) * quantity;
}

function calculateMargin(buyPrice: number, sellPrice: number) {
  if (buyPrice === 0) {
    return 0;
  }

  return ((sellPrice - buyPrice) / buyPrice) * 100;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const fromDate = searchParams.get("fromDate");
    const toDate = searchParams.get("toDate");
    const customer = searchParams.get("customer");
    const distributor = searchParams.get("distributor");
    const invoiceStatus = searchParams.get("invoiceStatus");
    const transactionType = searchParams.get("transactionType");

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

    const filteredTransactions = transactions.filter((transaction) => {
      const transactionDate = new Date(transaction.transactionDate);

      if (fromDate) {
        const startDate = new Date(`${fromDate}T00:00:00`);

        if (transactionDate < startDate) {
          return false;
        }
      }

      if (toDate) {
        const endDate = new Date(`${toDate}T23:59:59.999`);

        if (transactionDate > endDate) {
          return false;
        }
      }

      if (
        customer &&
        transaction.customer.name.trim().toLowerCase() !==
          customer.trim().toLowerCase()
      ) {
        return false;
      }

      if (
        distributor &&
        (transaction.distributor?.name || "").trim().toLowerCase() !==
          distributor.trim().toLowerCase()
      ) {
        return false;
      }

      if (
        invoiceStatus &&
        (transaction.invoiceStatus || "Not Set").trim().toLowerCase() !==
          invoiceStatus.trim().toLowerCase()
      ) {
        return false;
      }

      if (
        transactionType &&
        (transaction.transactionType || "Not Set").trim().toLowerCase() !==
          transactionType.trim().toLowerCase()
      ) {
        return false;
      }

      return true;
    });

    const detailedTransactions = filteredTransactions.map((transaction) => {
      const buyPrice = Number(transaction.buyPrice);
      const sellPrice = Number(transaction.sellPrice);

      const proratePrice =
        transaction.proratePrice !== null
          ? Number(transaction.proratePrice)
          : null;

      const quantity = Number(transaction.quantity);

      const revenue = calculateRevenue(
        sellPrice,
        proratePrice,
        quantity
      );

      const profit = calculateProfit(
        buyPrice,
        sellPrice,
        quantity
      );

      const margin = calculateMargin(buyPrice, sellPrice);

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

    /* ---------------------------------------------------------------------- */
    /* Overall Summary                                                        */
    /* ---------------------------------------------------------------------- */

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
      totalRevenue !== 0
        ? (totalProfit / totalRevenue) * 100
        : 0;

    /* ---------------------------------------------------------------------- */
    /* Customer Summary                                                       */
    /* ---------------------------------------------------------------------- */

    const customerMap = new Map<
      string,
      {
        transactionCount: number;
        quantity: number;
        revenue: number;
        profit: number;
      }
    >();

    for (const transaction of detailedTransactions) {
      const name = transaction.customer;

      const existing = customerMap.get(name) || {
        transactionCount: 0,
        quantity: 0,
        revenue: 0,
        profit: 0,
      };

      existing.transactionCount += 1;
      existing.quantity += transaction.quantity;
      existing.revenue += transaction.revenue;
      existing.profit += transaction.profit;

      customerMap.set(name, existing);
    }

    const customerSummary = Array.from(customerMap.entries())
      .map(([name, data]) => ({
        customer: name,
        transactionCount: data.transactionCount,
        quantity: data.quantity,
        revenue: data.revenue,
        profit: data.profit,
        margin:
          data.revenue !== 0
            ? (data.profit / data.revenue) * 100
            : 0,
      }))
      .sort((a, b) => b.revenue - a.revenue);

    /* ---------------------------------------------------------------------- */
    /* Distributor Summary                                                    */
    /* ---------------------------------------------------------------------- */

    const distributorMap = new Map<
      string,
      {
        transactionCount: number;
        quantity: number;
        revenue: number;
        profit: number;
      }
    >();

    for (const transaction of detailedTransactions) {
      const name = transaction.distributor || "Not Assigned";

      const existing = distributorMap.get(name) || {
        transactionCount: 0,
        quantity: 0,
        revenue: 0,
        profit: 0,
      };

      existing.transactionCount += 1;
      existing.quantity += transaction.quantity;
      existing.revenue += transaction.revenue;
      existing.profit += transaction.profit;

      distributorMap.set(name, existing);
    }

    const distributorSummary = Array.from(distributorMap.entries())
      .map(([name, data]) => ({
        distributor: name,
        transactionCount: data.transactionCount,
        quantity: data.quantity,
        revenue: data.revenue,
        profit: data.profit,
        margin:
          data.revenue !== 0
            ? (data.profit / data.revenue) * 100
            : 0,
      }))
      .sort((a, b) => b.revenue - a.revenue);

    /* ---------------------------------------------------------------------- */
    /* Invoice Status Summary                                                 */
    /* ---------------------------------------------------------------------- */

    const invoiceStatusMap = new Map<
      string,
      {
        transactionCount: number;
        revenue: number;
        profit: number;
      }
    >();

    for (const transaction of detailedTransactions) {
      const status = transaction.invoiceStatus?.trim() || "Not Set";

      const existing = invoiceStatusMap.get(status) || {
        transactionCount: 0,
        revenue: 0,
        profit: 0,
      };

      existing.transactionCount += 1;
      existing.revenue += transaction.revenue;
      existing.profit += transaction.profit;

      invoiceStatusMap.set(status, existing);
    }

    const invoiceStatusSummary = Array.from(
      invoiceStatusMap.entries()
    )
      .map(([status, data]) => ({
        invoiceStatus: status,
        transactionCount: data.transactionCount,
        revenue: data.revenue,
        profit: data.profit,
      }))
      .sort((a, b) => b.transactionCount - a.transactionCount);

    /* ---------------------------------------------------------------------- */
    /* Transaction Type Summary                                               */
    /* ---------------------------------------------------------------------- */

    const transactionTypeMap = new Map<
      string,
      {
        transactionCount: number;
        quantity: number;
        revenue: number;
        profit: number;
      }
    >();

    for (const transaction of detailedTransactions) {
      const type = transaction.transactionType?.trim() || "Not Set";

      const existing = transactionTypeMap.get(type) || {
        transactionCount: 0,
        quantity: 0,
        revenue: 0,
        profit: 0,
      };

      existing.transactionCount += 1;
      existing.quantity += transaction.quantity;
      existing.revenue += transaction.revenue;
      existing.profit += transaction.profit;

      transactionTypeMap.set(type, existing);
    }

    const transactionTypeSummary = Array.from(
      transactionTypeMap.entries()
    )
      .map(([type, data]) => ({
        transactionType: type,
        transactionCount: data.transactionCount,
        quantity: data.quantity,
        revenue: data.revenue,
        profit: data.profit,
        margin:
          data.revenue !== 0
            ? (data.profit / data.revenue) * 100
            : 0,
      }))
      .sort((a, b) => b.revenue - a.revenue);

    /* ---------------------------------------------------------------------- */
    /* Date Summary                                                           */
    /* ---------------------------------------------------------------------- */

    const dateMap = new Map<
      string,
      {
        transactionCount: number;
        quantity: number;
        revenue: number;
        profit: number;
      }
    >();

    for (const transaction of detailedTransactions) {
      const date = new Date(transaction.date)
        .toISOString()
        .split("T")[0];

      const existing = dateMap.get(date) || {
        transactionCount: 0,
        quantity: 0,
        revenue: 0,
        profit: 0,
      };

      existing.transactionCount += 1;
      existing.quantity += transaction.quantity;
      existing.revenue += transaction.revenue;
      existing.profit += transaction.profit;

      dateMap.set(date, existing);
    }

    const dateSummary = Array.from(dateMap.entries())
      .map(([date, data]) => ({
        date,
        transactionCount: data.transactionCount,
        quantity: data.quantity,
        revenue: data.revenue,
        profit: data.profit,
        margin:
          data.revenue !== 0
            ? (data.profit / data.revenue) * 100
            : 0,
      }))
      .sort((a, b) => b.date.localeCompare(a.date));

    /* ---------------------------------------------------------------------- */
    /* Response                                                               */
    /* ---------------------------------------------------------------------- */

    return NextResponse.json({
      success: true,

      filters: {
        fromDate: fromDate || null,
        toDate: toDate || null,
        customer: customer || null,
        distributor: distributor || null,
        invoiceStatus: invoiceStatus || null,
        transactionType: transactionType || null,
      },

      summary: {
        transactionCount: detailedTransactions.length,
        totalQuantity,
        totalRevenue,
        totalProfit,
        overallMargin,
      },

      customerSummary,

      distributorSummary,

      invoiceStatusSummary,

      transactionTypeSummary,

      dateSummary,

      transactions: detailedTransactions,
    });
  } catch (error) {
    console.error("Reports GET error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to generate report data.",
      },
      {
        status: 500,
      }
    );
  }
}
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
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

    const invoices = transactions.map((transaction) => {
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

        invoiceStatus: transaction.invoiceStatus,
        paymentStatus: transaction.paymentStatus,

        remarks: transaction.remarks,

        subscriptionStart: transaction.subscriptionStart,
        subscriptionEnd: transaction.subscriptionEnd,
        prorateDays: transaction.prorateDays,
        periodLabel: transaction.periodLabel,

        createdAt: transaction.createdAt,
        updatedAt: transaction.updatedAt,
      };
    });

    const statusSummary: Record<string, number> = {};

    for (const invoice of invoices) {
      const status = invoice.invoiceStatus?.trim() || "Not Set";

      statusSummary[status] = (statusSummary[status] || 0) + 1;
    }

    const totalRevenue = invoices.reduce(
      (sum, invoice) => sum + invoice.revenue,
      0
    );

    const totalProfit = invoices.reduce(
      (sum, invoice) => sum + invoice.profit,
      0
    );

    const invoiceSent = invoices.filter(
      (invoice) =>
        invoice.invoiceStatus?.trim().toLowerCase() === "invoice sent"
    ).length;

    const pendingInvoice = invoices.filter(
      (invoice) =>
        invoice.invoiceStatus?.trim().toLowerCase() ===
        "need to send invoice"
    ).length;

    const notSet = invoices.filter(
      (invoice) => !invoice.invoiceStatus?.trim()
    ).length;

    return NextResponse.json({
      success: true,

      summary: {
        totalInvoices: invoices.length,
        invoiceSent,
        pendingInvoice,
        notSet,
        totalRevenue,
        totalProfit,
      },

      statusSummary,

      invoices,
    });
  } catch (error) {
    console.error("Invoices GET error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to load invoice data.",
      },
      {
        status: 500,
      }
    );
  }
}
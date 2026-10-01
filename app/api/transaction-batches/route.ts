import { NextResponse } from "next/server";
import { randomUUID } from "crypto";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth/session";

const WRITE_ROLES = ["ADMIN", "FINANCE", "SALES"];

type BatchItem = {
  productId: number;
  transactionType?: string | null;
  distributorId?: number | null;
  buyPrice: number;
  sellPrice: number;
  proratePrice?: number | null;
  subscriptionStart?: string | null;
  subscriptionEnd?: string | null;
  quantity: number;
};

type BatchPayload = {
  customerId: number;
  transactionDate: string;
  poNumber?: string | null;
  invoiceStatus?: string | null;
  paymentStatus?: string | null;
  remarks?: string | null;
  items: BatchItem[];
};

export async function POST(request: Request) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const role = session.role;

    if (!WRITE_ROLES.includes(role)) {
      return NextResponse.json(
        { error: "You do not have permission to create transactions." },
        { status: 403 }
      );
    }

    const body = (await request.json()) as BatchPayload;

    const {
      customerId,
      transactionDate,
      poNumber,
      invoiceStatus,
      paymentStatus,
      remarks,
      items,
    } = body;

    if (!customerId) {
      return NextResponse.json(
        { error: "Customer is required." },
        { status: 400 }
      );
    }

    if (!transactionDate) {
      return NextResponse.json(
        { error: "Transaction date is required." },
        { status: 400 }
      );
    }

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: "At least one license/product is required." },
        { status: 400 }
      );
    }

    const customer = await prisma.customer.findUnique({
      where: {
        id: Number(customerId),
      },
    });

    if (!customer) {
      return NextResponse.json(
        { error: "Customer not found." },
        { status: 400 }
      );
    }

    const productIds = items.map((item) => Number(item.productId));

    const uniqueProductIds = [...new Set(productIds)];

    const products = await prisma.product.findMany({
      where: {
        id: {
          in: uniqueProductIds,
        },
      },
      select: {
        id: true,
      },
    });

    const existingProductIds = new Set(
      products.map((product) => product.id)
    );

    for (const item of items) {
      if (!item.productId) {
        return NextResponse.json(
          { error: "Every license must have a product." },
          { status: 400 }
        );
      }

      if (!existingProductIds.has(Number(item.productId))) {
        return NextResponse.json(
          {
            error: `Product ID ${item.productId} was not found.`,
          },
          { status: 400 }
        );
      }

      if (!item.quantity || Number(item.quantity) <= 0) {
        return NextResponse.json(
          { error: "Quantity must be greater than zero." },
          { status: 400 }
        );
      }

      if (Number(item.buyPrice) < 0) {
        return NextResponse.json(
          { error: "Buy price cannot be negative." },
          { status: 400 }
        );
      }

      if (Number(item.sellPrice) < 0) {
        return NextResponse.json(
          { error: "Sell price cannot be negative." },
          { status: 400 }
        );
      }

      if (
        item.proratePrice !== null &&
        item.proratePrice !== undefined &&
        Number(item.proratePrice) < 0
      ) {
        return NextResponse.json(
          { error: "Prorate price cannot be negative." },
          { status: 400 }
        );
      }
    }

    const distributorIds = [
      ...new Set(
        items
          .map((item) => item.distributorId)
          .filter(
            (id): id is number =>
              id !== null &&
              id !== undefined &&
              Number(id) > 0
          )
          .map(Number)
      ),
    ];

    if (distributorIds.length > 0) {
      const distributors = await prisma.distributor.findMany({
        where: {
          id: {
            in: distributorIds,
          },
        },
        select: {
          id: true,
        },
      });

      const existingDistributorIds = new Set(
        distributors.map((distributor) => distributor.id)
      );

      for (const distributorId of distributorIds) {
        if (!existingDistributorIds.has(distributorId)) {
          return NextResponse.json(
            {
              error: `Distributor ID ${distributorId} was not found.`,
            },
            { status: 400 }
          );
        }
      }
    }

    const batchId = randomUUID();

    const transactions = await prisma.$transaction(
      items.map((item) =>
        prisma.transaction.create({
          data: {
            batchId,

            customerId: Number(customerId),
            productId: Number(item.productId),

            distributorId:
              item.distributorId !== null &&
              item.distributorId !== undefined &&
              Number(item.distributorId) > 0
                ? Number(item.distributorId)
                : null,

            transactionDate: new Date(transactionDate),

            poNumber: poNumber?.trim() || null,

            transactionType:
              item.transactionType?.trim() || null,

            buyPrice: Number(item.buyPrice),
            sellPrice: Number(item.sellPrice),

            proratePrice:
              item.proratePrice !== null &&
              item.proratePrice !== undefined
                ? Number(item.proratePrice)
                : null,

            subscriptionStart:
              item.subscriptionStart
                ? new Date(item.subscriptionStart)
                : null,

            subscriptionEnd:
              item.subscriptionEnd
                ? new Date(item.subscriptionEnd)
                : null,

            prorateDays: null,
            periodLabel: null,

            quantity: Number(item.quantity),

            invoiceStatus:
              invoiceStatus?.trim() || null,

            paymentStatus:
              paymentStatus?.trim() || null,

            remarks: remarks?.trim() || null,
          },
        })
      )
    );

    return NextResponse.json(
      {
        success: true,
        batchId,
        count: transactions.length,
        transactionIds: transactions.map(
          (transaction) => transaction.id
        ),
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Transaction batch creation error:", error);

    return NextResponse.json(
      {
        error: "Failed to create transaction batch.",
      },
      { status: 500 }
    );
  }
}
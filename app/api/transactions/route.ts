import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth/session";

const WRITE_ROLES = ["ADMIN", "FINANCE", "SALES"];

async function checkWriteAccess() {
  const session = await getSession();

  if (!session) {
    return {
      allowed: false,
      response: NextResponse.json(
        {
          success: false,
          message: "Authentication required.",
        },
        { status: 401 }
      ),
    };
  }

  if (!WRITE_ROLES.includes(session.role)) {
    return {
      allowed: false,
      response: NextResponse.json(
        {
          success: false,
          message: "You do not have permission to modify transactions.",
        },
        { status: 403 }
      ),
    };
  }

  return {
    allowed: true,
    session,
  };
}

/* ---------------------------------------------------------
   GET ALL TRANSACTIONS
----------------------------------------------------------*/

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
      include: {
        customer: true,
        product: true,
        distributor: true,
      },
      orderBy: {
        transactionDate: "desc",
      },
    });

    const formatted = transactions.map((transaction) => {
      const buyPrice = Number(transaction.buyPrice);
      const sellPrice = Number(transaction.sellPrice);
      const quantity = transaction.quantity;

      const revenue =
        transaction.proratePrice &&
        Number(transaction.proratePrice) !== 0
          ? Number(transaction.proratePrice) * quantity
          : sellPrice * quantity;

      const profit = (sellPrice - buyPrice) * quantity;

      const margin =
        buyPrice === 0
          ? 0
          : ((sellPrice - buyPrice) / buyPrice) * 100;

      return {
        id: transaction.id,
        sourceRow: transaction.sourceRow,
        date: transaction.transactionDate,
        customer: transaction.customer.name,
        customerId: transaction.customerId,
        product: transaction.product.name,
        productId: transaction.productId,
        distributor: transaction.distributor?.name ?? null,
        distributorId: transaction.distributorId,
        poNumber: transaction.poNumber,
        transactionType: transaction.transactionType,
        buyPrice,
        sellPrice,
        proratePrice: transaction.proratePrice,
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

    return NextResponse.json({
      success: true,
      transactions: formatted,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to fetch transactions.",
      },
      { status: 500 }
    );
  }
}

/* ---------------------------------------------------------
   CREATE NEW TRANSACTION
----------------------------------------------------------*/

export async function POST(request: Request) {
  const access = await checkWriteAccess();

  if (!access.allowed) {
    return access.response;
  }

  try {
    const body = await request.json();

    const {
      customerId,
      productId,
      distributorId,
      transactionDate,
      poNumber,
      transactionType,
      buyPrice,
      sellPrice,
      proratePrice,
      subscriptionStart,
      subscriptionEnd,
      prorateDays,
      quantity,
      invoiceStatus,
      paymentStatus,
      remarks,
    } = body;

    if (!customerId || !productId || !transactionDate) {
      return NextResponse.json(
        {
          success: false,
          message: "Customer, Product and Date are required.",
        },
        { status: 400 }
      );
    }

    let periodLabel: string | null = null;

    if (subscriptionStart && subscriptionEnd) {
      const start = new Date(subscriptionStart);
      const end = new Date(subscriptionEnd);

      periodLabel = `${start.toLocaleDateString(
        "en-GB"
      )} to ${end.toLocaleDateString("en-GB")}`;
    }

    const transaction = await prisma.transaction.create({
      data: {
        customerId: Number(customerId),
        productId: Number(productId),
        distributorId: distributorId
          ? Number(distributorId)
          : null,

        transactionDate: new Date(transactionDate),

        poNumber: poNumber || null,
        transactionType: transactionType || null,

        buyPrice: Number(buyPrice),
        sellPrice: Number(sellPrice),

        proratePrice:
          proratePrice !== "" &&
          proratePrice !== null &&
          proratePrice !== undefined
            ? Number(proratePrice)
            : null,

        subscriptionStart: subscriptionStart
          ? new Date(subscriptionStart)
          : null,

        subscriptionEnd: subscriptionEnd
          ? new Date(subscriptionEnd)
          : null,

        prorateDays:
          prorateDays !== "" &&
          prorateDays !== null &&
          prorateDays !== undefined
            ? Number(prorateDays)
            : null,

        periodLabel,

        quantity: Number(quantity),

        invoiceStatus: invoiceStatus || null,
        paymentStatus: paymentStatus || null,
        remarks: remarks || null,
      },
    });

    return NextResponse.json({
      success: true,
      transaction,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to create transaction.",
      },
      { status: 500 }
    );
  }
}

/* ---------------------------------------------------------
   UPDATE TRANSACTION
----------------------------------------------------------*/

export async function PATCH(request: Request) {
  const access = await checkWriteAccess();

  if (!access.allowed) {
    return access.response;
  }

  try {
    const body = await request.json();

    const {
      id,
      customerId,
      productId,
      distributorId,
      transactionDate,
      poNumber,
      transactionType,
      buyPrice,
      sellPrice,
      proratePrice,
      subscriptionStart,
      subscriptionEnd,
      prorateDays,
      quantity,
      invoiceStatus,
      paymentStatus,
      remarks,
    } = body;

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          message: "Transaction ID is required.",
        },
        { status: 400 }
      );
    }

    const existing = await prisma.transaction.findUnique({
      where: {
        id: Number(id),
      },
    });

    if (!existing) {
      return NextResponse.json(
        {
          success: false,
          message: "Transaction not found.",
        },
        { status: 404 }
      );
    }

    let periodLabel = existing.periodLabel;

    if (subscriptionStart && subscriptionEnd) {
      const start = new Date(subscriptionStart);
      const end = new Date(subscriptionEnd);

      periodLabel = `${start.toLocaleDateString(
        "en-GB"
      )} to ${end.toLocaleDateString("en-GB")}`;
    }

    const transaction = await prisma.transaction.update({
      where: {
        id: Number(id),
      },

      data: {
        customerId: Number(customerId),
        productId: Number(productId),

        distributorId: distributorId
          ? Number(distributorId)
          : null,

        transactionDate: new Date(transactionDate),

        poNumber: poNumber || null,
        transactionType: transactionType || null,

        buyPrice: Number(buyPrice),
        sellPrice: Number(sellPrice),

        proratePrice:
          proratePrice !== "" &&
          proratePrice !== null &&
          proratePrice !== undefined
            ? Number(proratePrice)
            : null,

        subscriptionStart: subscriptionStart
          ? new Date(subscriptionStart)
          : null,

        subscriptionEnd: subscriptionEnd
          ? new Date(subscriptionEnd)
          : null,

        prorateDays:
          prorateDays !== "" &&
          prorateDays !== null &&
          prorateDays !== undefined
            ? Number(prorateDays)
            : null,

        periodLabel,

        quantity: Number(quantity),

        invoiceStatus: invoiceStatus || null,
        paymentStatus: paymentStatus || null,
        remarks: remarks || null,
      },
    });

    return NextResponse.json({
      success: true,
      transaction,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to update transaction.",
      },
      { status: 500 }
    );
  }
}
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth/session";

const WRITE_ROLES = ["ADMIN", "FINANCE"];

async function checkWriteAccess() {
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

  if (!WRITE_ROLES.includes(session.role)) {
    return NextResponse.json(
      {
        success: false,
        message: "You do not have permission to modify distributors.",
      },
      { status: 403 }
    );
  }

  return null;
}

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

    const distributors = await prisma.distributor.findMany({
      orderBy: {
        name: "asc",
      },
      include: {
        transactions: {
          select: {
            sellPrice: true,
            buyPrice: true,
            proratePrice: true,
            quantity: true,
          },
        },
      },
    });

    const result = distributors.map((distributor) => {
      let totalRevenue = 0;
      let totalProfit = 0;

      for (const transaction of distributor.transactions) {
        const sellPrice = Number(transaction.sellPrice);
        const buyPrice = Number(transaction.buyPrice);

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

        totalRevenue += revenue;
        totalProfit += profit;
      }

      return {
        id: distributor.id,
        name: distributor.name,
        transactionCount: distributor.transactions.length,
        totalRevenue,
        totalProfit,
        createdAt: distributor.createdAt,
        updatedAt: distributor.updatedAt,
      };
    });

    return NextResponse.json({
      success: true,
      distributors: result,
    });
  } catch (error) {
    console.error("Distributors GET error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to load distributors.",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const accessError = await checkWriteAccess();

  if (accessError) {
    return accessError;
  }

  try {
    const body = await request.json();

    const name = String(body.name ?? "").trim();

    if (!name) {
      return NextResponse.json(
        {
          success: false,
          message: "Distributor name is required.",
        },
        { status: 400 }
      );
    }

    const existingDistributor =
      await prisma.distributor.findUnique({
        where: {
          name,
        },
      });

    if (existingDistributor) {
      return NextResponse.json(
        {
          success: false,
          message: "Distributor already exists.",
        },
        { status: 409 }
      );
    }

    const distributor = await prisma.distributor.create({
      data: {
        name,
      },
    });

    return NextResponse.json({
      success: true,
      distributor,
    });
  } catch (error) {
    console.error("Distributors POST error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to create distributor.",
      },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  const accessError = await checkWriteAccess();

  if (accessError) {
    return accessError;
  }

  try {
    const body = await request.json();

    const id = Number(body.id);
    const name = String(body.name ?? "").trim();

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          message: "Distributor ID is required.",
        },
        { status: 400 }
      );
    }

    if (!name) {
      return NextResponse.json(
        {
          success: false,
          message: "Distributor name is required.",
        },
        { status: 400 }
      );
    }

    const existingDistributor =
      await prisma.distributor.findUnique({
        where: {
          id,
        },
      });

    if (!existingDistributor) {
      return NextResponse.json(
        {
          success: false,
          message: "Distributor not found.",
        },
        { status: 404 }
      );
    }

    const duplicateDistributor =
      await prisma.distributor.findFirst({
        where: {
          name,
          NOT: {
            id,
          },
        },
      });

    if (duplicateDistributor) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Another distributor with this name already exists.",
        },
        { status: 409 }
      );
    }

    const distributor = await prisma.distributor.update({
      where: {
        id,
      },
      data: {
        name,
      },
    });

    return NextResponse.json({
      success: true,
      distributor,
    });
  } catch (error) {
    console.error("Distributors PATCH error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to update distributor.",
      },
      { status: 500 }
    );
  }
}
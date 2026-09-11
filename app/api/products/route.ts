import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const products = await prisma.product.findMany({
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

    const result = products.map((product) => {
      let totalRevenue = 0;
      let totalProfit = 0;

      for (const transaction of product.transactions) {
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

        const profit =
          (sellPrice - buyPrice) * quantity;

        totalRevenue += revenue;
        totalProfit += profit;
      }

      return {
        id: product.id,
        name: product.name,
        transactionCount: product.transactions.length,
        totalRevenue,
        totalProfit,
        createdAt: product.createdAt,
        updatedAt: product.updatedAt,
      };
    });

    return NextResponse.json({
      success: true,
      products: result,
    });
  } catch (error) {
    console.error("Products GET error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to load products.",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const name = String(body.name ?? "").trim();

    if (!name) {
      return NextResponse.json(
        {
          success: false,
          message: "Product name is required.",
        },
        { status: 400 }
      );
    }

    const existingProduct = await prisma.product.findUnique({
      where: {
        name,
      },
    });

    if (existingProduct) {
      return NextResponse.json(
        {
          success: false,
          message: "Product already exists.",
        },
        { status: 409 }
      );
    }

    const product = await prisma.product.create({
      data: {
        name,
      },
    });

    return NextResponse.json({
      success: true,
      product,
    });
  } catch (error) {
    console.error("Products POST error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to create product.",
      },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();

    const id = Number(body.id);
    const name = String(body.name ?? "").trim();

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          message: "Product ID is required.",
        },
        { status: 400 }
      );
    }

    if (!name) {
      return NextResponse.json(
        {
          success: false,
          message: "Product name is required.",
        },
        { status: 400 }
      );
    }

    const existingProduct = await prisma.product.findUnique({
      where: {
        id,
      },
    });

    if (!existingProduct) {
      return NextResponse.json(
        {
          success: false,
          message: "Product not found.",
        },
        { status: 404 }
      );
    }

    const duplicateProduct = await prisma.product.findFirst({
      where: {
        name,
        NOT: {
          id,
        },
      },
    });

    if (duplicateProduct) {
      return NextResponse.json(
        {
          success: false,
          message: "Another product with this name already exists.",
        },
        { status: 409 }
      );
    }

    const product = await prisma.product.update({
      where: {
        id,
      },
      data: {
        name,
      },
    });

    return NextResponse.json({
      success: true,
      product,
    });
  } catch (error) {
    console.error("Products PATCH error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to update product.",
      },
      { status: 500 }
    );
  }
}
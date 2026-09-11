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
          message: "You do not have permission to modify customers.",
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

    const customers = await prisma.customer.findMany({
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

    const result = customers.map((customer) => {
      let totalRevenue = 0;
      let totalProfit = 0;

      for (const transaction of customer.transactions) {
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
        id: customer.id,
        name: customer.name,
        transactionCount: customer.transactions.length,
        totalRevenue,
        totalProfit,
        createdAt: customer.createdAt,
        updatedAt: customer.updatedAt,
      };
    });

    return NextResponse.json({
      success: true,
      customers: result,
    });
  } catch (error) {
    console.error("Customers GET error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to load customers.",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const access = await checkWriteAccess();

  if (!access.allowed) {
    return access.response;
  }

  try {
    const body = await request.json();
    const name = String(body.name ?? "").trim();

    if (!name) {
      return NextResponse.json(
        {
          success: false,
          message: "Customer name is required.",
        },
        { status: 400 }
      );
    }

    const existingCustomer = await prisma.customer.findUnique({
      where: { name },
    });

    if (existingCustomer) {
      return NextResponse.json(
        {
          success: false,
          message: "Customer already exists.",
        },
        { status: 409 }
      );
    }

    const customer = await prisma.customer.create({
      data: { name },
    });

    return NextResponse.json({
      success: true,
      customer,
    });
  } catch (error) {
    console.error("Customers POST error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to create customer.",
      },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  const access = await checkWriteAccess();

  if (!access.allowed) {
    return access.response;
  }

  try {
    const body = await request.json();

    const id = Number(body.id);
    const name = String(body.name ?? "").trim();

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          message: "Customer ID is required.",
        },
        { status: 400 }
      );
    }

    if (!name) {
      return NextResponse.json(
        {
          success: false,
          message: "Customer name is required.",
        },
        { status: 400 }
      );
    }

    const existingCustomer = await prisma.customer.findUnique({
      where: { id },
    });

    if (!existingCustomer) {
      return NextResponse.json(
        {
          success: false,
          message: "Customer not found.",
        },
        { status: 404 }
      );
    }

    const duplicateCustomer = await prisma.customer.findFirst({
      where: {
        name,
        NOT: { id },
      },
    });

    if (duplicateCustomer) {
      return NextResponse.json(
        {
          success: false,
          message: "Another customer with this name already exists.",
        },
        { status: 409 }
      );
    }

    const customer = await prisma.customer.update({
      where: { id },
      data: { name },
    });

    return NextResponse.json({
      success: true,
      customer,
    });
  } catch (error) {
    console.error("Customers PATCH error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to update customer.",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  const access = await checkWriteAccess();

  if (!access.allowed) {
    return access.response;
  }

  try {
    const body = await request.json();
    const id = Number(body.id);

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          message: "Customer ID is required.",
        },
        { status: 400 }
      );
    }

    const customer = await prisma.customer.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            transactions: true,
          },
        },
      },
    });

    if (!customer) {
      return NextResponse.json(
        {
          success: false,
          message: "Customer not found.",
        },
        { status: 404 }
      );
    }

    if (customer._count.transactions > 0) {
      return NextResponse.json(
        {
          success: false,
          message:
            "This customer cannot be deleted because it has transaction history.",
        },
        { status: 409 }
      );
    }

    await prisma.customer.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: "Customer deleted successfully.",
    });
  } catch (error) {
    console.error("Customers DELETE error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to delete customer.",
      },
      { status: 500 }
    );
  }
}

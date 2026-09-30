import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const customerCount = await prisma.customer.count();
    const transactionCount = await prisma.transaction.count();

    return Response.json({
      success: true,
      message: "Database connection successful",
      customerCount,
      transactionCount,
    });
  } catch (error) {
    console.error(error);

    return Response.json(
      {
        success: false,
        message: "Database connection failed",
      },
      { status: 500 }
    );
  }
}
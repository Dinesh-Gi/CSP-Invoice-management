import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const [customers, products, distributors] =
      await Promise.all([
        prisma.customer.findMany({
          orderBy: {
            name: "asc",
          },
          select: {
            id: true,
            name: true,
          },
        }),

        prisma.product.findMany({
          orderBy: {
            name: "asc",
          },
          select: {
            id: true,
            name: true,
          },
        }),

        prisma.distributor.findMany({
          orderBy: {
            name: "asc",
          },
          select: {
            id: true,
            name: true,
          },
        }),
      ]);

    return Response.json({
      success: true,
      customers,
      products,
      distributors,
    });
  } catch (error) {
    console.error(
      "Master Data API error:",
      error
    );

    return Response.json(
      {
        success: false,
        message:
          "Failed to load master data.",
      },
      {
        status: 500,
      }
    );
  }
}
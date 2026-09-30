import "dotenv/config";
import * as XLSX from "xlsx";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not defined");
}

const adapter = new PrismaPg({
  connectionString,
});

const prisma = new PrismaClient({
  adapter,
});

const EXCEL_FILE = "./ZEIT_CSP_Tracker.xlsx";

/**
 * Convert Excel/text value into a clean string.
 *
 * Important:
 * We preserve "-" because the original Excel file uses "-"
 * as a meaningful value in some fields.
 */
function cleanString(value: unknown): string | null {
  if (value === null || value === undefined) {
    return null;
  }

  const text = String(value).trim();

  if (!text) {
    return null;
  }

  return text;
}

/**
 * Convert Excel/text value into a number.
 */
function cleanNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }

  const text = String(value).trim();

  if (!text || text === "-") {
    return null;
  }

  const number = Number(text.replace(/,/g, ""));

  return Number.isFinite(number) ? number : null;
}

/**
 * Parse Excel dates.
 */
function parseExcelDate(value: unknown): Date | null {
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }

  if (typeof value === "number") {
    const date = XLSX.SSF.parse_date_code(value);

    if (!date) {
      return null;
    }

    return new Date(
      date.y,
      date.m - 1,
      date.d,
      date.H || 0,
      date.M || 0,
      date.S || 0
    );
  }

  if (typeof value === "string") {
    const text = value.trim();

    if (!text || text === "-") {
      return null;
    }

    /**
     * Handles:
     * DD/MM/YYYY
     * DD-MM-YYYY
     */
    const match = text.match(
      /^(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})$/
    );

    if (match) {
      const day = Number(match[1]);
      const month = Number(match[2]);
      const year = Number(match[3]);

      const date = new Date(year, month - 1, day);

      return Number.isNaN(date.getTime()) ? null : date;
    }

    const date = new Date(text);

    if (!Number.isNaN(date.getTime())) {
      return date;
    }
  }

  return null;
}

/**
 * Parse subscription period.
 *
 * Examples:
 * 03/06/2026 to 27/06/2026
 * Perpetual
 * Prepetual
 * -
 */
function parsePeriod(
  value: unknown
): {
  start: Date | null;
  end: Date | null;
  label: string | null;
} {
  const label = cleanString(value);

  if (!label) {
    return {
      start: null,
      end: null,
      label: null,
    };
  }

  const match = label.match(
    /^(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})\s+to\s+(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})$/i
  );

  if (!match) {
    return {
      start: null,
      end: null,
      label,
    };
  }

  const start = new Date(
    Number(match[3]),
    Number(match[2]) - 1,
    Number(match[1])
  );

  const end = new Date(
    Number(match[6]),
    Number(match[5]) - 1,
    Number(match[4])
  );

  return {
    start,
    end,
    label,
  };
}

/**
 * Get or create Customer.
 */
async function getOrCreateCustomer(name: string) {
  return prisma.customer.upsert({
    where: {
      name,
    },
    update: {},
    create: {
      name,
    },
  });
}

/**
 * Get or create Product.
 */
async function getOrCreateProduct(name: string) {
  return prisma.product.upsert({
    where: {
      name,
    },
    update: {},
    create: {
      name,
    },
  });
}

/**
 * Get or create Distributor.
 */
async function getOrCreateDistributor(name: string) {
  return prisma.distributor.upsert({
    where: {
      name,
    },
    update: {},
    create: {
      name,
    },
  });
}

/**
 * Import distributor names from Vendors sheet.
 *
 * Vendors sheet:
 * Column A contains distributor names.
 */
async function importVendors(sheet: XLSX.WorkSheet) {
  const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
    header: 1,
    defval: null,
    raw: true,
  });

  let distributorsImported = 0;

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];

    const distributor = cleanString(row?.[0]);

    if (!distributor) {
      continue;
    }

    /**
     * These are status values in the Vendors sheet,
     * not distributor names.
     */
    const statusValues = [
      "Yes",
      "No",
      "Credit Note",
      "Not Applicable",
    ];

    if (statusValues.includes(distributor)) {
      continue;
    }

    await getOrCreateDistributor(distributor);

    distributorsImported++;

    console.log(`Distributor processed: ${distributor}`);
  }

  console.log(
    `\nVendors processed: ${distributorsImported}`
  );
}

/**
 * Import Main Tracker sheet.
 */
async function importMainTracker(sheet: XLSX.WorkSheet) {
  const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
    header: 1,
    defval: null,
    raw: true,
  });

  if (rows.length < 2) {
    throw new Error(
      "Main Tracker sheet does not contain data."
    );
  }

  /**
   * Excel continuation rows sometimes leave
   * Customer Company Name blank.
   *
   * We remember the previous populated customer.
   */
  let currentCustomer: string | null = null;

  /**
   * Same approach for Date Loaded.
   *
   * Instead of querying the database for every continuation row,
   * we remember the previous populated date.
   */
  let currentTransactionDate: Date | null = null;

  let imported = 0;
  let skipped = 0;
  let updated = 0;
  let created = 0;

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];

    const excelRow = i + 1;

    /**
     * -------------------------------
     * Read basic Excel values
     * -------------------------------
     */

    const dateLoaded = parseExcelDate(row?.[1]);

    const customerFromExcel = cleanString(row?.[2]);

    /**
     * Update current customer whenever
     * Excel contains a new customer.
     */
    if (customerFromExcel) {
      currentCustomer = customerFromExcel;
    }

    /**
     * Update current transaction date whenever
     * Excel contains a new date.
     */
    if (dateLoaded) {
      currentTransactionDate = dateLoaded;
    }

    const transactionType = cleanString(row?.[4]);

    const productName = cleanString(row?.[5]);

    const buyPrice = cleanNumber(row?.[6]);

    const sellPrice = cleanNumber(row?.[7]);

    const proratePrice = cleanNumber(row?.[8]);

    const prorateDaysValue = cleanNumber(row?.[9]);

    const period = parsePeriod(row?.[10]);

    const quantity = cleanNumber(row?.[11]);

    const distributorName = cleanString(row?.[15]);

    const invoiceStatus = cleanString(row?.[16]);

    const paymentStatus = cleanString(row?.[17]);

    const remarks = cleanString(row?.[18]);

    const poNumber = cleanString(row?.[3]);

    /**
     * -------------------------------
     * Skip invalid/blank rows
     * -------------------------------
     */

    /**
     * A row without a product is not a transaction.
     */
    if (!productName) {
      skipped++;

      continue;
    }

    /**
     * Customer is required.
     */
    if (!currentCustomer) {
      console.warn(
        `Skipping Excel row ${excelRow}: no customer found.`
      );

      skipped++;

      continue;
    }

    /**
     * Buy Price is required.
     */
    if (buyPrice === null) {
      console.warn(
        `Skipping Excel row ${excelRow}: missing Buy Price.`
      );

      skipped++;

      continue;
    }

    /**
     * Sell Price is required.
     */
    if (sellPrice === null) {
      console.warn(
        `Skipping Excel row ${excelRow}: missing Sell Price.`
      );

      skipped++;

      continue;
    }

    /**
     * Quantity is required.
     */
    if (quantity === null) {
      console.warn(
        `Skipping Excel row ${excelRow}: missing Quantity.`
      );

      skipped++;

      continue;
    }

    /**
     * Date Loaded is required by our database.
     *
     * If this is a continuation row, currentTransactionDate
     * contains the previous populated date.
     */
    if (!currentTransactionDate) {
      console.warn(
        `Skipping Excel row ${excelRow}: no transaction date found.`
      );

      skipped++;

      continue;
    }

    /**
     * -------------------------------
     * Create lookup records
     * -------------------------------
     */

    const customer = await getOrCreateCustomer(
      currentCustomer
    );

    const product = await getOrCreateProduct(
      productName
    );

    let distributorId: number | null = null;

    if (distributorName) {
      const distributor =
        await getOrCreateDistributor(distributorName);

      distributorId = distributor.id;
    }

    /**
     * -------------------------------
     * Prepare transaction data
     * -------------------------------
     */

    const transactionData = {
      customerId: customer.id,

      productId: product.id,

      distributorId,

      transactionDate: currentTransactionDate,

      poNumber,

      transactionType,

      buyPrice,

      sellPrice,

      proratePrice,

      subscriptionStart: period.start,

      subscriptionEnd: period.end,

      prorateDays:
        prorateDaysValue !== null
          ? Math.round(prorateDaysValue)
          : null,

      periodLabel: period.label,

      quantity: Math.round(quantity),

      invoiceStatus,

      paymentStatus,

      remarks,

      sourceRow: excelRow,
    };

    /**
     * -------------------------------
     * SAFE IMPORT
     * -------------------------------
     *
     * sourceRow is unique in the database.
     *
     * If this Excel row already exists:
     *     UPDATE it.
     *
     * If this Excel row does not exist:
     *     CREATE it.
     *
     * This makes the importer safe to run multiple times.
     */

    const existingTransaction =
      await prisma.transaction.findUnique({
        where: {
          sourceRow: excelRow,
        },
        select: {
          id: true,
        },
      });

    if (existingTransaction) {
      await prisma.transaction.update({
        where: {
          id: existingTransaction.id,
        },
        data: transactionData,
      });

      updated++;

      console.log(
        `Updated row ${excelRow}: ${currentCustomer} → ${productName}`
      );
    } else {
      await prisma.transaction.create({
        data: transactionData,
      });

      created++;

      console.log(
        `Imported row ${excelRow}: ${currentCustomer} → ${productName}`
      );
    }

    imported++;
  }

  console.log("\n--------------------------------------");
  console.log(" Main Tracker Import Summary");
  console.log("--------------------------------------");

  console.log(`Processed: ${imported}`);
  console.log(`Created:   ${created}`);
  console.log(`Updated:   ${updated}`);
  console.log(`Skipped:   ${skipped}`);
}

/**
 * Main import function.
 */
async function main() {
  console.log("======================================");
  console.log(" ZEIT CSP Tracker Excel Import");
  console.log("======================================\n");

  console.log(`Reading: ${EXCEL_FILE}\n`);

  /**
   * Read Excel workbook.
   */
  const workbook = XLSX.readFile(EXCEL_FILE, {
    cellDates: true,
  });

  console.log("Sheets found:");

  console.log(workbook.SheetNames.join(", "));

  console.log("");

  /**
   * Find required sheets.
   */
  const vendorsSheet =
    workbook.Sheets["Vendors"];

  const mainTrackerSheet =
    workbook.Sheets["Main Tracker"];

  if (!vendorsSheet) {
    throw new Error(
      'Sheet "Vendors" was not found.'
    );
  }

  if (!mainTrackerSheet) {
    throw new Error(
      'Sheet "Main Tracker" was not found.'
    );
  }

  /**
   * Import distributors.
   */
  await importVendors(vendorsSheet);

  /**
   * Import transactions.
   */
  await importMainTracker(mainTrackerSheet);

  /**
   * -------------------------------
   * Final database counts
   * -------------------------------
   */

  const customers =
    await prisma.customer.count();

  const products =
    await prisma.product.count();

  const distributors =
    await prisma.distributor.count();

  const transactions =
    await prisma.transaction.count();

  console.log("\n======================================");
  console.log(" Import completed successfully");
  console.log("======================================");

  console.log(`Customers:     ${customers}`);
  console.log(`Products:      ${products}`);
  console.log(`Distributors:  ${distributors}`);
  console.log(`Transactions:  ${transactions}`);

  console.log("======================================\n");
}

/**
 * Run import.
 */
main()
  .catch((error) => {
    console.error("\n======================================");
    console.error(" Import failed");
    console.error("======================================");

    console.error(error);

    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
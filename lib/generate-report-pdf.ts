import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

type ReportTransaction = {
  id: number;
  date: string;
  customer: string;
  product: string;
  distributor: string | null;
  poNumber: string | null;
  transactionType: string | null;
  buyPrice: number;
  sellPrice: number;
  proratePrice: number | null;
  quantity: number;
  revenue: number;
  profit: number;
  margin: number;
  invoiceStatus: string | null;
  paymentStatus: string | null;
  remarks: string | null;
};

type ReportData = {
  filters: {
    fromDate: string;
    toDate: string;
    customer: string;
    distributor: string;
    invoiceStatus: string;
    transactionType: string;
  };
  summary: {
    transactionCount: number;
    totalQuantity: number;
    totalRevenue: number;
    totalProfit: number;
    overallMargin: number;
  };
  customerSummary: Array<{
    customer: string;
    transactionCount: number;
    totalQuantity: number;
    totalRevenue: number;
    totalProfit: number;
    margin: number;
  }>;
  distributorSummary: Array<{
    distributor: string;
    transactionCount: number;
    totalQuantity: number;
    totalRevenue: number;
    totalProfit: number;
    margin: number;
  }>;
  invoiceStatusSummary: Array<{
    status: string;
    transactionCount: number;
    totalRevenue: number;
  }>;
  transactionTypeSummary: Array<{
    transactionType: string;
    transactionCount: number;
    totalRevenue: number;
  }>;
  dateSummary: Array<{
    date: string;
    transactionCount: number;
    totalQuantity: number;
    totalRevenue: number;
    totalProfit: number;
  }>;
  transactions: ReportTransaction[];
};

function money(value: number) {
  return `Rs. ${value.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function number(value: number) {
  return value.toLocaleString("en-IN");
}

function safe(value: string | null | undefined) {
  return value || "-";
}

function filterLabel(value: string) {
  return value || "All";
}

export function generateReportPDF(report: ReportData) {
  const doc = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  const addHeader = () => {
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text("ZiniosEdge CSP Management", 14, 16);

    doc.setFontSize(13);
    doc.setFont("helvetica", "normal");
    doc.text("CSP Tracker Report", 14, 23);

    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);

    const generatedAt = new Date().toLocaleString("en-IN");

    doc.text(
      `Generated: ${generatedAt}`,
      pageWidth - 14,
      16,
      { align: "right" }
    );

    doc.setTextColor(0, 0, 0);
  };

  const addFooter = () => {
    const pageCount = doc.getNumberOfPages();

    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);

      doc.setFontSize(8);
      doc.setTextColor(110, 110, 110);

      doc.text(
        "ZiniosEdge CSP Tracker",
        14,
        pageHeight - 8
      );

      doc.text(
        `Page ${i} of ${pageCount}`,
        pageWidth - 14,
        pageHeight - 8,
        { align: "right" }
      );

      doc.setTextColor(0, 0, 0);
    }
  };

  // --------------------------------------------------
  // PAGE 1 - SUMMARY
  // --------------------------------------------------

  addHeader();

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");

  let y = 32;

  doc.text(
    `Date Range: ${filterLabel(report.filters.fromDate)} to ${filterLabel(report.filters.toDate)}`,
    14,
    y
  );

  y += 6;

  doc.text(
    `Customer: ${filterLabel(report.filters.customer)}`,
    14,
    y
  );

  doc.text(
    `Distributor: ${filterLabel(report.filters.distributor)}`,
    95,
    y
  );

  y += 6;

  doc.text(
    `Invoice Status: ${filterLabel(report.filters.invoiceStatus)}`,
    14,
    y
  );

  doc.text(
    `Transaction Type: ${filterLabel(report.filters.transactionType)}`,
    95,
    y
  );

  y += 12;

  // KPI table

  autoTable(doc, {
    startY: y,
    head: [["Metric", "Value"]],
    body: [
      ["Total Transactions", number(report.summary.transactionCount)],
      ["Total Quantity", number(report.summary.totalQuantity)],
      ["Total Revenue", money(report.summary.totalRevenue)],
      ["Total P/L", money(report.summary.totalProfit)],
      [
        "Overall Margin",
        `${report.summary.overallMargin.toFixed(2)}%`,
      ],
    ],
    theme: "grid",
    headStyles: {
      fontStyle: "bold",
    },
    styles: {
      fontSize: 9,
      cellPadding: 4,
    },
    columnStyles: {
      0: { cellWidth: 70 },
      1: { cellWidth: 60 },
    },
  });

  y = (doc as any).lastAutoTable.finalY + 10;

  // Customer Summary

  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("Customer Performance", 14, y);

  y += 4;

  autoTable(doc, {
    startY: y,
    head: [
      [
        "Customer",
        "Transactions",
        "Quantity",
        "Revenue",
        "P/L",
        "Margin",
      ],
    ],
    body: report.customerSummary.map((item) => [
      item.customer,
      number(item.transactionCount),
      number(item.totalQuantity),
      money(item.totalRevenue),
      money(item.totalProfit),
      `${item.margin.toFixed(2)}%`,
    ]),
    theme: "grid",
    styles: {
      fontSize: 7.5,
      cellPadding: 3,
    },
    headStyles: {
      fontStyle: "bold",
    },
  });

  // --------------------------------------------------
  // DISTRIBUTOR SUMMARY
  // --------------------------------------------------

  doc.addPage();

  addHeader();

  y = 32;

  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("Distributor Performance", 14, y);

  y += 4;

  autoTable(doc, {
    startY: y,
    head: [
      [
        "Distributor",
        "Transactions",
        "Quantity",
        "Revenue",
        "P/L",
        "Margin",
      ],
    ],
    body: report.distributorSummary.map((item) => [
      item.distributor,
      number(item.transactionCount),
      number(item.totalQuantity),
      money(item.totalRevenue),
      money(item.totalProfit),
      `${item.margin.toFixed(2)}%`,
    ]),
    theme: "grid",
    styles: {
      fontSize: 8,
      cellPadding: 3,
    },
    headStyles: {
      fontStyle: "bold",
    },
  });

  y = (doc as any).lastAutoTable.finalY + 12;

  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("Invoice Status Summary", 14, y);

  y += 4;

  autoTable(doc, {
    startY: y,
    head: [
      ["Invoice Status", "Transactions", "Revenue"],
    ],
    body: report.invoiceStatusSummary.map((item) => [
      safe(item.status),
      number(item.transactionCount),
      money(item.totalRevenue),
    ]),
    theme: "grid",
    styles: {
      fontSize: 8,
      cellPadding: 3,
    },
    headStyles: {
      fontStyle: "bold",
    },
  });

  y = (doc as any).lastAutoTable.finalY + 12;

  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("Transaction Type Summary", 14, y);

  y += 4;

  autoTable(doc, {
    startY: y,
    head: [
      ["Transaction Type", "Transactions", "Revenue"],
    ],
    body: report.transactionTypeSummary.map((item) => [
      safe(item.transactionType),
      number(item.transactionCount),
      money(item.totalRevenue),
    ]),
    theme: "grid",
    styles: {
      fontSize: 8,
      cellPadding: 3,
    },
    headStyles: {
      fontStyle: "bold",
    },
  });

  // --------------------------------------------------
  // DATE SUMMARY
  // --------------------------------------------------

  doc.addPage();

  addHeader();

  y = 32;

  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("Date-wise Summary", 14, y);

  y += 4;

  autoTable(doc, {
    startY: y,
    head: [
      [
        "Date",
        "Transactions",
        "Quantity",
        "Revenue",
        "P/L",
      ],
    ],
    body: report.dateSummary.map((item) => [
      item.date,
      number(item.transactionCount),
      number(item.totalQuantity),
      money(item.totalRevenue),
      money(item.totalProfit),
    ]),
    theme: "grid",
    styles: {
      fontSize: 8,
      cellPadding: 3,
    },
    headStyles: {
      fontStyle: "bold",
    },
  });

  // --------------------------------------------------
  // DETAILED TRANSACTIONS
  // --------------------------------------------------

  doc.addPage();

  addHeader();

  y = 32;

  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("Detailed Transaction Report", 14, y);

  y += 4;

  autoTable(doc, {
    startY: y,
    head: [
      [
        "Date",
        "Customer",
        "Product",
        "Distributor",
        "PO Number",
        "Type",
        "Qty",
        "Buy",
        "Sell",
        "Prorate",
        "Revenue",
        "P/L",
        "Invoice",
        "Payment",
      ],
    ],
    body: report.transactions.map((item) => [
      item.date,
      item.customer,
      item.product,
      safe(item.distributor),
      safe(item.poNumber),
      safe(item.transactionType),
      number(item.quantity),
      money(item.buyPrice),
      money(item.sellPrice),
      item.proratePrice
        ? money(item.proratePrice)
        : "-",
      money(item.revenue),
      money(item.profit),
      safe(item.invoiceStatus),
      safe(item.paymentStatus),
    ]),
    theme: "grid",
    styles: {
      fontSize: 6.5,
      cellPadding: 2,
      overflow: "linebreak",
    },
    headStyles: {
      fontStyle: "bold",
      fontSize: 6.5,
    },
    columnStyles: {
      0: { cellWidth: 19 },
      1: { cellWidth: 32 },
      2: { cellWidth: 32 },
      3: { cellWidth: 25 },
      4: { cellWidth: 22 },
      5: { cellWidth: 18 },
      6: { cellWidth: 10 },
      7: { cellWidth: 19 },
      8: { cellWidth: 19 },
      9: { cellWidth: 19 },
      10: { cellWidth: 22 },
      11: { cellWidth: 22 },
      12: { cellWidth: 22 },
      13: { cellWidth: 20 },
    },
  });

  // Footer on every page

  addFooter();

  // Download

  const date = new Date()
    .toISOString()
    .slice(0, 10);

  doc.save(`ZEIT-CSP-Report-${date}.pdf`);
}
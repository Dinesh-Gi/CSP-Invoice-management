"use client";

import { useEffect, useMemo, useState } from "react";

type Invoice = {
  id: number;
  sourceRow: number | null;
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
  invoiceStatus: string | null;
  paymentStatus: string | null;
  remarks: string | null;
  subscriptionStart: string | null;
  subscriptionEnd: string | null;
  prorateDays: number | null;
  periodLabel: string | null;
  createdAt: string;
  updatedAt: string;
};

type InvoiceSummary = {
  totalInvoices: number;
  invoiceSent: number;
  pendingInvoice: number;
  notSet: number;
  totalRevenue: number;
  totalProfit: number;
};

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [summary, setSummary] = useState<InvoiceSummary>({
    totalInvoices: 0,
    invoiceSent: 0,
    pendingInvoice: 0,
    notSet: 0,
    totalRevenue: 0,
    totalProfit: 0,
  });

  const [search, setSearch] = useState("");
  const [invoiceStatus, setInvoiceStatus] = useState("All");
  const [paymentStatus, setPaymentStatus] = useState("All");
  const [distributor, setDistributor] = useState("All");
  const [transactionType, setTransactionType] = useState("All");

  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(
    null
  );

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadInvoices();
  }, []);

  async function loadInvoices() {
    try {
      setLoading(true);

      const response = await fetch("/api/invoices", {
        cache: "no-store",
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to load invoices.");
      }

      setInvoices(data.invoices || []);
      setSummary(
        data.summary || {
          totalInvoices: 0,
          invoiceSent: 0,
          pendingInvoice: 0,
          notSet: 0,
          totalRevenue: 0,
          totalProfit: 0,
        }
      );
    } catch (error) {
      console.error("Invoice loading error:", error);
      alert("Failed to load invoice data.");
    } finally {
      setLoading(false);
    }
  }

  const invoiceStatuses = useMemo(
    () =>
      Array.from(
        new Set(
          invoices
            .map((item) => item.invoiceStatus?.trim())
            .filter((item): item is string => Boolean(item))
        )
      ).sort(),
    [invoices]
  );

  const paymentStatuses = useMemo(
    () =>
      Array.from(
        new Set(
          invoices
            .map((item) => item.paymentStatus?.trim())
            .filter((item): item is string => Boolean(item))
        )
      ).sort(),
    [invoices]
  );

  const distributors = useMemo(
    () =>
      Array.from(
        new Set(
          invoices
            .map((item) => item.distributor?.trim())
            .filter((item): item is string => Boolean(item))
        )
      ).sort(),
    [invoices]
  );

  const transactionTypes = useMemo(
    () =>
      Array.from(
        new Set(
          invoices
            .map((item) => item.transactionType?.trim())
            .filter((item): item is string => Boolean(item))
        )
      ).sort(),
    [invoices]
  );

  const filteredInvoices = useMemo(() => {
    const searchText = search.trim().toLowerCase();

    return invoices.filter((invoice) => {
      const matchesSearch =
        !searchText ||
        invoice.customer.toLowerCase().includes(searchText) ||
        invoice.product.toLowerCase().includes(searchText) ||
        (invoice.poNumber || "").toLowerCase().includes(searchText) ||
        (invoice.distributor || "").toLowerCase().includes(searchText) ||
        (invoice.transactionType || "").toLowerCase().includes(searchText) ||
        (invoice.remarks || "").toLowerCase().includes(searchText);

      const matchesInvoiceStatus =
        invoiceStatus === "All" ||
        (invoice.invoiceStatus || "Not Set").trim() === invoiceStatus;

      const matchesPaymentStatus =
        paymentStatus === "All" ||
        (invoice.paymentStatus || "Not Set").trim() === paymentStatus;

      const matchesDistributor =
        distributor === "All" ||
        (invoice.distributor || "Not Set").trim() === distributor;

      const matchesTransactionType =
        transactionType === "All" ||
        (invoice.transactionType || "Not Set").trim() === transactionType;

      return (
        matchesSearch &&
        matchesInvoiceStatus &&
        matchesPaymentStatus &&
        matchesDistributor &&
        matchesTransactionType
      );
    });
  }, [
    invoices,
    search,
    invoiceStatus,
    paymentStatus,
    distributor,
    transactionType,
  ]);

  const filteredRevenue = useMemo(
    () => filteredInvoices.reduce((sum, item) => sum + item.revenue, 0),
    [filteredInvoices]
  );

  const filteredProfit = useMemo(
    () => filteredInvoices.reduce((sum, item) => sum + item.profit, 0),
    [filteredInvoices]
  );

  function formatCurrency(value: number) {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  }

  function formatDate(value: string | null) {
    if (!value) return "-";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return "-";

    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }

  function getInvoiceStatusClass(status: string | null) {
    const value = status?.trim().toLowerCase();

    if (value === "invoice sent") {
      return "bg-green-100 text-green-700";
    }

    if (value === "need to send invoice") {
      return "bg-amber-100 text-amber-700";
    }

    if (value === "credit note") {
      return "bg-purple-100 text-purple-700";
    }

    if (value === "hold") {
      return "bg-red-100 text-red-700";
    }

    return "bg-gray-100 text-gray-600";
  }

  function getPaymentStatusClass(status: string | null) {
    const value = status?.trim().toLowerCase();

    if (value === "yes") {
      return "bg-green-100 text-green-700";
    }

    if (value === "no") {
      return "bg-red-100 text-red-700";
    }

    if (value === "not applicable") {
      return "bg-gray-100 text-gray-600";
    }

    return "bg-gray-100 text-gray-600";
  }

  function clearFilters() {
    setSearch("");
    setInvoiceStatus("All");
    setPaymentStatus("All");
    setDistributor("All");
    setTransactionType("All");
  }

  return (
    <div className="min-h-screen bg-white px-8 py-8 text-gray-950">
      {/* Page Header */}
      <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Invoice Management
          </h1>

          <p className="mt-2 text-sm text-gray-500">
            Monitor invoice status, revenue, payments and customer billing
            activity.
          </p>
        </div>

        <button
          type="button"
          onClick={loadInvoices}
          className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-blue-700"
        >
          Refresh Data
        </button>
      </div>

      {/* Summary Cards */}
      <div className="mb-8 grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-6">
        <SummaryCard
          title="Total Invoice Records"
          value={summary.totalInvoices.toLocaleString("en-IN")}
          icon="📄"
          className="bg-blue-50"
        />

        <SummaryCard
          title="Invoice Sent"
          value={summary.invoiceSent.toLocaleString("en-IN")}
          icon="✓"
          className="bg-green-50"
        />

        <SummaryCard
          title="Need to Send"
          value={summary.pendingInvoice.toLocaleString("en-IN")}
          icon="!"
          className="bg-amber-50"
        />

        <SummaryCard
          title="Not Set"
          value={summary.notSet.toLocaleString("en-IN")}
          icon="—"
          className="bg-gray-50"
        />

        <SummaryCard
          title="Total Revenue"
          value={formatCurrency(summary.totalRevenue)}
          icon="₹"
          className="bg-indigo-50"
        />

        <SummaryCard
          title="Total P/L"
          value={formatCurrency(summary.totalProfit)}
          icon="↗"
          className="bg-emerald-50"
        />
      </div>

      {/* Filters */}
      <div className="mb-6 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold">Invoice Filters</h2>

            <p className="mt-1 text-xs text-gray-500">
              Filter invoice records using customer, status, distributor or
              transaction type.
            </p>
          </div>

          <button
            type="button"
            onClick={clearFilters}
            className="rounded-lg border border-gray-200 px-4 py-2 text-xs font-bold text-gray-600 transition hover:bg-gray-50"
          >
            Clear Filters
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
          {/* Search */}
          <div className="xl:col-span-1">
            <label className="mb-2 block text-xs font-bold text-gray-600">
              Search
            </label>

            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Customer, product, PO..."
              className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          {/* Invoice Status */}
          <FilterSelect
            label="Invoice Status"
            value={invoiceStatus}
            onChange={setInvoiceStatus}
            options={invoiceStatuses}
          />

          {/* Payment Status */}
          <FilterSelect
            label="Payment Status"
            value={paymentStatus}
            onChange={setPaymentStatus}
            options={paymentStatuses}
          />

          {/* Distributor */}
          <FilterSelect
            label="Distributor"
            value={distributor}
            onChange={setDistributor}
            options={distributors}
          />

          {/* Transaction Type */}
          <FilterSelect
            label="Transaction Type"
            value={transactionType}
            onChange={setTransactionType}
            options={transactionTypes}
          />
        </div>
      </div>

      {/* Filtered Summary */}
      <div className="mb-5 flex flex-col gap-3 rounded-2xl border border-blue-100 bg-blue-50 px-5 py-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-blue-600">
            Current View
          </p>

          <p className="mt-1 text-sm font-semibold text-gray-800">
            Showing {filteredInvoices.length} of {invoices.length} invoice
            records
          </p>
        </div>

        <div className="flex flex-wrap gap-5 text-sm">
          <div>
            <span className="text-gray-500">Revenue:</span>{" "}
            <span className="font-bold text-gray-900">
              {formatCurrency(filteredRevenue)}
            </span>
          </div>

          <div>
            <span className="text-gray-500">P/L:</span>{" "}
            <span className="font-bold text-green-700">
              {formatCurrency(filteredProfit)}
            </span>
          </div>
        </div>
      </div>

      {/* Invoice Table */}
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-200 px-6 py-5">
          <h2 className="text-lg font-bold">Invoice Records</h2>

          <p className="mt-1 text-sm text-gray-500">
            Invoice information is synchronized directly from the CSP Tracker
            transactions.
          </p>
        </div>

        {loading ? (
          <div className="flex min-h-[300px] items-center justify-center">
            <div className="text-sm font-semibold text-gray-500">
              Loading invoice records...
            </div>
          </div>
        ) : filteredInvoices.length === 0 ? (
          <div className="flex min-h-[300px] flex-col items-center justify-center px-6 text-center">
            <div className="mb-3 text-4xl">📄</div>

            <h3 className="text-base font-bold text-gray-800">
              No invoice records found
            </h3>

            <p className="mt-1 text-sm text-gray-500">
              Try changing the filters or search criteria.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-[1800px] w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50 text-left">
                  <th className="whitespace-nowrap px-4 py-4 font-bold text-gray-600">
                    Date
                  </th>

                  <th className="whitespace-nowrap px-4 py-4 font-bold text-gray-600">
                    Customer
                  </th>

                  <th className="whitespace-nowrap px-4 py-4 font-bold text-gray-600">
                    Product
                  </th>

                  <th className="whitespace-nowrap px-4 py-4 font-bold text-gray-600">
                    PO Number
                  </th>

                  <th className="whitespace-nowrap px-4 py-4 font-bold text-gray-600">
                    Distributor
                  </th>

                  <th className="whitespace-nowrap px-4 py-4 font-bold text-gray-600">
                    Type
                  </th>

                  <th className="whitespace-nowrap px-4 py-4 text-right font-bold text-gray-600">
                    Qty
                  </th>

                  <th className="whitespace-nowrap px-4 py-4 text-right font-bold text-gray-600">
                    Revenue
                  </th>

                  <th className="whitespace-nowrap px-4 py-4 text-right font-bold text-gray-600">
                    P/L
                  </th>

                  <th className="whitespace-nowrap px-4 py-4 font-bold text-gray-600">
                    Invoice Status
                  </th>

                  <th className="whitespace-nowrap px-4 py-4 font-bold text-gray-600">
                    Payment
                  </th>

                  <th className="whitespace-nowrap px-4 py-4 font-bold text-gray-600">
                    Remarks
                  </th>

                  <th className="sticky right-0 z-10 whitespace-nowrap border-l border-gray-200 bg-gray-50 px-4 py-4 text-center font-bold text-gray-600">
                    Action
                  </th>
                </tr>
              </thead>

              <tbody>
                {filteredInvoices.map((invoice) => (
                  <tr
                    key={invoice.id}
                    className="border-b border-gray-100 transition hover:bg-blue-50/40"
                  >
                    <td className="whitespace-nowrap px-4 py-4 text-gray-700">
                      {formatDate(invoice.date)}
                    </td>

                    <td className="max-w-[220px] px-4 py-4 font-semibold text-gray-900">
                      <div className="truncate" title={invoice.customer}>
                        {invoice.customer}
                      </div>
                    </td>

                    <td className="max-w-[300px] px-4 py-4 text-gray-700">
                      <div className="truncate" title={invoice.product}>
                        {invoice.product}
                      </div>
                    </td>

                    <td className="whitespace-nowrap px-4 py-4 text-gray-700">
                      {invoice.poNumber || "-"}
                    </td>

                    <td className="whitespace-nowrap px-4 py-4 text-gray-700">
                      {invoice.distributor || "-"}
                    </td>

                    <td className="whitespace-nowrap px-4 py-4">
                      {invoice.transactionType ? (
                        <span className="rounded-md bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-700">
                          {invoice.transactionType}
                        </span>
                      ) : (
                        "-"
                      )}
                    </td>

                    <td className="whitespace-nowrap px-4 py-4 text-right font-semibold text-gray-800">
                      {invoice.quantity.toLocaleString("en-IN")}
                    </td>

                    <td className="whitespace-nowrap px-4 py-4 text-right font-semibold text-gray-900">
                      {formatCurrency(invoice.revenue)}
                    </td>

                    <td className="whitespace-nowrap px-4 py-4 text-right font-semibold text-green-700">
                      {formatCurrency(invoice.profit)}
                    </td>

                    <td className="whitespace-nowrap px-4 py-4">
                      <span
                        className={`rounded-full px-3 py-1.5 text-xs font-bold ${getInvoiceStatusClass(
                          invoice.invoiceStatus
                        )}`}
                      >
                        {invoice.invoiceStatus || "Not Set"}
                      </span>
                    </td>

                    <td className="whitespace-nowrap px-4 py-4">
                      <span
                        className={`rounded-full px-3 py-1.5 text-xs font-bold ${getPaymentStatusClass(
                          invoice.paymentStatus
                        )}`}
                      >
                        {invoice.paymentStatus || "Not Set"}
                      </span>
                    </td>

                    <td className="max-w-[240px] px-4 py-4 text-gray-600">
                      <div
                        className="truncate"
                        title={invoice.remarks || ""}
                      >
                        {invoice.remarks || "-"}
                      </div>
                    </td>

                    <td className="sticky right-0 z-10 border-l border-gray-100 bg-white px-4 py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => setSelectedInvoice(invoice)}
                          className="rounded-lg bg-blue-50 px-3 py-2 text-xs font-bold text-blue-700 transition hover:bg-blue-100"
                        >
                          View
                        </button>

                        <a
                          href={`/tracker/${invoice.id}/edit`}
                          className="rounded-lg bg-amber-50 px-3 py-2 text-xs font-bold text-amber-700 transition hover:bg-amber-100"
                        >
                          Edit
                        </a>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* View Modal */}
      {selectedInvoice && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-6"
          onClick={() => setSelectedInvoice(null)}
        >
          <div
            className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-2xl bg-white shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-gray-200 px-6 py-5">
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  Invoice Record
                </h2>

                <p className="mt-1 text-xs text-gray-500">
                  Transaction ID: #{selectedInvoice.id}
                  {selectedInvoice.sourceRow
                    ? ` • Excel Row: ${selectedInvoice.sourceRow}`
                    : ""}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSelectedInvoice(null)}
                className="rounded-lg bg-gray-100 px-3 py-2 text-sm font-bold text-gray-600 transition hover:bg-gray-200"
              >
                Close
              </button>
            </div>

            <div className="grid grid-cols-1 gap-5 p-6 md:grid-cols-2">
              <DetailItem label="Date" value={formatDate(selectedInvoice.date)} />

              <DetailItem
                label="Customer"
                value={selectedInvoice.customer}
              />

              <DetailItem label="Product" value={selectedInvoice.product} />

              <DetailItem
                label="PO Number"
                value={selectedInvoice.poNumber || "-"}
              />

              <DetailItem
                label="Distributor"
                value={selectedInvoice.distributor || "-"}
              />

              <DetailItem
                label="Transaction Type"
                value={selectedInvoice.transactionType || "-"}
              />

              <DetailItem
                label="Quantity"
                value={selectedInvoice.quantity.toLocaleString("en-IN")}
              />

              <DetailItem
                label="Buy Price"
                value={formatCurrency(selectedInvoice.buyPrice)}
              />

              <DetailItem
                label="Sell Price"
                value={formatCurrency(selectedInvoice.sellPrice)}
              />

              <DetailItem
                label="Prorate Price"
                value={
                  selectedInvoice.proratePrice !== null
                    ? formatCurrency(selectedInvoice.proratePrice)
                    : "-"
                }
              />

              <DetailItem
                label="Revenue"
                value={formatCurrency(selectedInvoice.revenue)}
              />

              <DetailItem
                label="P/L"
                value={formatCurrency(selectedInvoice.profit)}
              />

              <DetailItem
                label="Invoice Status"
                value={selectedInvoice.invoiceStatus || "Not Set"}
              />

              <DetailItem
                label="Payment Status"
                value={selectedInvoice.paymentStatus || "Not Set"}
              />

              <DetailItem
                label="Prorate Days"
                value={
                  selectedInvoice.prorateDays !== null
                    ? selectedInvoice.prorateDays.toString()
                    : "-"
                }
              />

              <DetailItem
                label="Period"
                value={selectedInvoice.periodLabel || "-"}
              />

              <DetailItem
                label="Subscription Start"
                value={formatDate(selectedInvoice.subscriptionStart)}
              />

              <DetailItem
                label="Subscription End"
                value={formatDate(selectedInvoice.subscriptionEnd)}
              />

              <div className="md:col-span-2">
                <p className="mb-2 text-xs font-bold uppercase tracking-wide text-gray-500">
                  Remarks
                </p>

                <div className="rounded-xl bg-gray-50 px-4 py-4 text-sm text-gray-800">
                  {selectedInvoice.remarks || "No remarks"}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 border-t border-gray-200 px-6 py-5">
              <button
                type="button"
                onClick={() => setSelectedInvoice(null)}
                className="rounded-xl border border-gray-200 px-5 py-3 text-sm font-bold text-gray-600 transition hover:bg-gray-50"
              >
                Close
              </button>

              <a
                href={`/tracker/${selectedInvoice.id}/edit`}
                className="rounded-xl bg-amber-500 px-5 py-3 text-sm font-bold text-white transition hover:bg-amber-600"
              >
                Edit Transaction
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SummaryCard({
  title,
  value,
  icon,
  className,
}: {
  title: string;
  value: string;
  icon: string;
  className: string;
}) {
  return (
    <div
      className={`rounded-2xl border border-gray-100 p-5 shadow-sm ${className}`}
    >
      <div className="mb-4 flex items-center justify-between">
        <p className="text-xs font-bold uppercase tracking-wide text-gray-500">
          {title}
        </p>

        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-sm font-black text-gray-700 shadow-sm">
          {icon}
        </div>
      </div>

      <p className="text-2xl font-bold tracking-tight text-gray-950">
        {value}
      </p>
    </div>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
}) {
  return (
    <div>
      <label className="mb-2 block text-xs font-bold text-gray-600">
        {label}
      </label>

      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
      >
        <option value="All">All</option>

        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </div>
  );
}

function DetailItem({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-4">
      <p className="mb-1 text-xs font-bold uppercase tracking-wide text-gray-500">
        {label}
      </p>

      <p className="text-sm font-semibold text-gray-900">{value}</p>
    </div>
  );
}
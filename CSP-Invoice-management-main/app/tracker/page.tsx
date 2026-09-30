"use client";

import { useEffect, useMemo, useState } from "react";

type Transaction = {
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
  margin: number;
  invoiceStatus: string | null;
  paymentStatus: string | null;
  remarks: string | null;
  subscriptionStart: string | null;
  subscriptionEnd: string | null;
  prorateDays: number | null;
  periodLabel: string | null;
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(value);
}

function formatDate(value: string | null) {
  if (!value) return "-";

  return new Date(value).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function getStatusClass(status: string | null) {
  const value = status?.trim().toLowerCase();

  if (value === "invoice sent") {
    return "bg-green-100 text-green-700";
  }

  if (value === "need to send invoice") {
    return "bg-orange-100 text-orange-700";
  }

  if (value === "yes") {
    return "bg-green-100 text-green-700";
  }

  if (value === "no") {
    return "bg-red-100 text-red-700";
  }

  if (value === "not applicable") {
    return "bg-gray-100 text-gray-700";
  }

  return "bg-gray-100 text-gray-600";
}

function QuantityIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M8 4h8M6 7h12M5 20h14V9H5z" />
      <path d="M8 12h8M8 15h5" />
    </svg>
  );
}

export default function TrackerPage() {
  /* ---------------------------------------------------------
     USER / ROLE
  ----------------------------------------------------------*/

  const [userRole, setUserRole] = useState("");
  const [checkingRole, setCheckingRole] = useState(true);

  const canModifyTransactions =
    userRole === "ADMIN" ||
    userRole === "FINANCE" ||
    userRole === "SALES";

  /* ---------------------------------------------------------
     TRANSACTIONS
  ----------------------------------------------------------*/

  const [transactions, setTransactions] = useState<Transaction[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  /* ---------------------------------------------------------
     FILTERS
  ----------------------------------------------------------*/

  const [search, setSearch] = useState("");
  const [transactionType, setTransactionType] = useState("All");
  const [invoiceStatus, setInvoiceStatus] = useState("All");
  const [paymentStatus, setPaymentStatus] = useState("All");
  const [distributor, setDistributor] = useState("All");

  /* ---------------------------------------------------------
     PAGINATION
  ----------------------------------------------------------*/

  const [page, setPage] = useState(1);
  const pageSize = 15;

  /* ---------------------------------------------------------
     URL FILTERS
  ----------------------------------------------------------*/

  /*
   * Allows View buttons from Customers, Products, Distributors,
   * Invoices and Payments to open this page with the correct
   * records already filtered.
   */

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);

    const customerParam = params.get("customer");
    const productParam = params.get("product");
    const distributorParam = params.get("distributor");
    const invoiceStatusParam = params.get("invoiceStatus");
    const paymentStatusParam = params.get("paymentStatus");
    const transactionTypeParam = params.get("transactionType");

    if (customerParam) {
      setSearch(customerParam);
    } else if (productParam) {
      setSearch(productParam);
    }

    if (distributorParam) {
      setDistributor(distributorParam);
    }

    if (invoiceStatusParam) {
      setInvoiceStatus(invoiceStatusParam);
    }

    if (paymentStatusParam) {
      setPaymentStatus(paymentStatusParam);
    }

    if (transactionTypeParam) {
      setTransactionType(transactionTypeParam);
    }

    setPage(1);
  }, []);

  /* ---------------------------------------------------------
     SELECTED TRANSACTION
  ----------------------------------------------------------*/

  const [selectedTransaction, setSelectedTransaction] =
    useState<Transaction | null>(null);

  /* ---------------------------------------------------------
     LOAD USER ROLE
  ----------------------------------------------------------*/

  useEffect(() => {
    async function loadUserRole() {
      try {
        const response = await fetch("/api/auth/me", {
          cache: "no-store",
        });

        if (!response.ok) {
          window.location.href = "/login";
          return;
        }

        const data = await response.json();

        if (data.success && data.user) {
          setUserRole(data.user.role);
        } else {
          window.location.href = "/login";
        }
      } catch (error) {
        console.error("Unable to load user role:", error);
      } finally {
        setCheckingRole(false);
      }
    }

    loadUserRole();
  }, []);

  /* ---------------------------------------------------------
     LOAD TRANSACTIONS
  ----------------------------------------------------------*/

  useEffect(() => {
    async function loadTransactions() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch("/api/transactions", {
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error("Failed to load transactions.");
        }

        const result = await response.json();

        const rows = Array.isArray(result)
          ? result
          : result.transactions ?? result.data ?? [];

        setTransactions(rows);
      } catch (err) {
        console.error(err);

        setError(
          err instanceof Error
            ? err.message
            : "Unable to load transactions."
        );
      } finally {
        setLoading(false);
      }
    }

    loadTransactions();
  }, []);

  /* ---------------------------------------------------------
     FILTER OPTIONS
  ----------------------------------------------------------*/

  const transactionTypes = useMemo(() => {
    return [
      "All",
      ...Array.from(
        new Set(
          transactions
            .map((item) => item.transactionType)
            .filter(
              (item): item is string => Boolean(item)
            )
        )
      ).sort(),
    ];
  }, [transactions]);

  const invoiceStatuses = useMemo(() => {
    return [
      "All",
      ...Array.from(
        new Set(
          transactions
            .map((item) => item.invoiceStatus)
            .filter(
              (item): item is string => Boolean(item)
            )
        )
      ).sort(),
    ];
  }, [transactions]);

  const paymentStatuses = useMemo(() => {
    return [
      "All",
      ...Array.from(
        new Set(
          transactions
            .map((item) => item.paymentStatus)
            .filter(
              (item): item is string => Boolean(item)
            )
        )
      ).sort(),
    ];
  }, [transactions]);

  const distributors = useMemo(() => {
    return [
      "All",
      ...Array.from(
        new Set(
          transactions
            .map((item) => item.distributor)
            .filter(
              (item): item is string => Boolean(item)
            )
        )
      ).sort(),
    ];
  }, [transactions]);

  /* ---------------------------------------------------------
     FILTERING
  ----------------------------------------------------------*/

  const filteredTransactions = useMemo(() => {
    const query = search.trim().toLowerCase();

    return transactions.filter((item) => {
      const matchesSearch =
        !query ||
        item.customer.toLowerCase().includes(query) ||
        item.product.toLowerCase().includes(query) ||
        (item.poNumber ?? "").toLowerCase().includes(query) ||
        (item.distributor ?? "").toLowerCase().includes(query) ||
        (item.remarks ?? "").toLowerCase().includes(query);

      const matchesTransactionType =
        transactionType === "All" ||
        (item.transactionType ?? "") === transactionType;

      const matchesInvoiceStatus =
        invoiceStatus === "All" ||
        (item.invoiceStatus ?? "") === invoiceStatus;

      const matchesPaymentStatus =
        paymentStatus === "All" ||
        (item.paymentStatus ?? "") === paymentStatus;

      const matchesDistributor =
        distributor === "All" ||
        (item.distributor ?? "") === distributor;

      return (
        matchesSearch &&
        matchesTransactionType &&
        matchesInvoiceStatus &&
        matchesPaymentStatus &&
        matchesDistributor
      );
    });
  }, [
    transactions,
    search,
    transactionType,
    invoiceStatus,
    paymentStatus,
    distributor,
  ]);

  /* ---------------------------------------------------------
     PAGINATION
  ----------------------------------------------------------*/

  const totalPages = Math.max(
    1,
    Math.ceil(filteredTransactions.length / pageSize)
  );

  const currentPage = Math.min(page, totalPages);

  const paginatedTransactions = filteredTransactions.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  /* ---------------------------------------------------------
     SUMMARY VALUES
  ----------------------------------------------------------*/

  const totalRevenue = filteredTransactions.reduce(
    (sum, item) => sum + Number(item.revenue || 0),
    0
  );

  const totalProfit = filteredTransactions.reduce(
    (sum, item) => sum + Number(item.profit || 0),
    0
  );

  const totalQuantity = filteredTransactions.reduce(
    (sum, item) => sum + Number(item.quantity || 0),
    0
  );

  /* ---------------------------------------------------------
     RESET FILTERS
  ----------------------------------------------------------*/

  function resetFilters() {
    setSearch("");
    setTransactionType("All");
    setInvoiceStatus("All");
    setPaymentStatus("All");
    setDistributor("All");
    setPage(1);
  }

  /* ---------------------------------------------------------
     ROLE CHECKING
  ----------------------------------------------------------*/

  if (checkingRole) {
    return (
      <main className="min-h-screen bg-[#f8f7f3]">
        <div className="flex min-h-[calc(100vh-76px)] items-center justify-center">
          <div className="text-center">
            <div className="mx-auto h-9 w-9 animate-spin rounded-full border-4 border-gray-200 border-t-amber-500" />

            <p className="mt-4 text-sm font-medium text-gray-500">
              Loading...
            </p>
          </div>
        </div>
      </main>
    );
  }

  /* ---------------------------------------------------------
     PAGE
  ----------------------------------------------------------*/

  return (
    <main className="min-h-screen bg-[#f8f7f3]">
      <div className="mx-auto max-w-[1800px] px-5 py-5 sm:px-6 lg:px-8">

        {/* ---------------------------------------------------
            PAGE HEADER
        ---------------------------------------------------- */}

        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500">
              {filteredTransactions.length.toLocaleString("en-IN")} matching records
            </p>
          </div>

          {canModifyTransactions && (
            <a
              href="/tracker/add"
              className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-4 py-2.5 text-sm font-bold text-white shadow-[0_8px_18px_rgba(245,158,11,0.22)] transition hover:-translate-y-px hover:bg-amber-600"
            >
              <span className="text-base leading-none">+</span>
              Add Transaction
            </a>
          )}
        </div>

        {/* ---------------------------------------------------
            ERROR
        ---------------------------------------------------- */}

        {error && (
          <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-medium text-red-700">
            {error}
          </div>
        )}

        {/* Compact Quantity Summary */}
        <section className="mb-5 overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_6px_22px_rgba(15,23,42,0.04)]">
          <div className="flex min-h-[86px] items-center gap-3 px-5 py-3.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600 ring-1 ring-amber-100">
              <QuantityIcon />
            </div>

            <div className="flex min-w-0 items-center gap-3 sm:gap-5">
              <div>
                <p className="text-[10px] font-extrabold uppercase tracking-[0.1em] text-slate-400">
                  Quantity
                </p>
                <p className="mt-0.5 text-2xl font-black tracking-tight text-slate-950">
                  {totalQuantity.toLocaleString("en-IN")}
                </p>
              </div>

              <div className="hidden h-8 w-px bg-slate-200 sm:block" />

              <p className="hidden text-xs font-medium text-slate-500 sm:block">
                Total license / service quantity for the current filters
              </p>
            </div>
          </div>
        </section>

        {/* ---------------------------------------------------
            FILTERS
        ---------------------------------------------------- */}

        <section className="mb-5 rounded-2xl border border-slate-200/80 bg-white p-4.5 shadow-[0_6px_22px_rgba(15,23,42,0.04)]">

          <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-base font-extrabold tracking-tight text-slate-950">
                Search & Filters
              </h2>

              <p className="mt-1 text-[11px] font-medium text-slate-500">
                Search across customers, products, PO numbers,
                distributors and remarks.
              </p>
            </div>

            <button
              type="button"
              onClick={resetFilters}
              className="zeit-btn zeit-btn-secondary min-h-9 h-9 px-3 text-xs text-blue-700"
            >
              Reset Filters
            </button>
          </div>

          <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-5">

            {/* Search */}

            <div className="xl:col-span-1">
              <label className="mb-2 block text-[10px] font-extrabold uppercase tracking-[0.08em] text-slate-500">
                Search
              </label>

              <input
                type="text"
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setPage(1);
                }}
                placeholder="Customer, PO, product..."
                className="zeit-input h-10 text-sm"
              />
            </div>

            {/* Transaction Type */}

            <div>
              <label className="mb-2 block text-[10px] font-extrabold uppercase tracking-[0.08em] text-slate-500">
                Transaction Type
              </label>

              <select
                value={transactionType}
                onChange={(event) => {
                  setTransactionType(event.target.value);
                  setPage(1);
                }}
                className="zeit-input h-10 text-sm"
              >
                {transactionTypes.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>

            {/* Invoice */}

            <div>
              <label className="mb-2 block text-[10px] font-extrabold uppercase tracking-[0.08em] text-slate-500">
                Invoice Status
              </label>

              <select
                value={invoiceStatus}
                onChange={(event) => {
                  setInvoiceStatus(event.target.value);
                  setPage(1);
                }}
                className="zeit-input h-10 text-sm"
              >
                {invoiceStatuses.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>

            {/* Payment */}

            <div>
              <label className="mb-2 block text-[10px] font-extrabold uppercase tracking-[0.08em] text-slate-500">
                Payment Status
              </label>

              <select
                value={paymentStatus}
                onChange={(event) => {
                  setPaymentStatus(event.target.value);
                  setPage(1);
                }}
                className="zeit-input h-10 text-sm"
              >
                {paymentStatuses.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>

            {/* Distributor */}

            <div>
              <label className="mb-2 block text-[10px] font-extrabold uppercase tracking-[0.08em] text-slate-500">
                Distributor
              </label>

              <select
                value={distributor}
                onChange={(event) => {
                  setDistributor(event.target.value);
                  setPage(1);
                }}
                className="zeit-input h-10 text-sm"
              >
                {distributors.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </section>

        {/* ---------------------------------------------------
            MAIN TRACKER TABLE
        ---------------------------------------------------- */}

        <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_8px_28px_rgba(15,23,42,0.05)]">

          <div className="flex flex-col gap-2 border-b border-slate-100 px-5 py-4 md:flex-row md:items-center md:justify-between">

            <div>
              <h2 className="text-base font-extrabold tracking-tight text-slate-950">
                Transaction Records
              </h2>

              <p className="mt-1 text-[11px] font-medium text-slate-500">
                Showing {paginatedTransactions.length} of{" "}
                {filteredTransactions.length} matching records
              </p>
            </div>

            <div className="text-[11px] font-medium text-slate-400">
              Excel-compatible transaction fields
            </div>
          </div>

          {/* Loading */}

          {loading ? (
            <div className="flex min-h-[400px] items-center justify-center">
              <div className="text-center">
                <div className="mx-auto mb-4 h-9 w-9 animate-spin rounded-full border-4 border-gray-200 border-t-amber-500" />

                <p className="text-xs font-medium text-slate-500">
                  Loading transactions...
                </p>
              </div>
            </div>
          ) : paginatedTransactions.length === 0 ? (
            <div className="p-12 text-center">
              <p className="font-semibold text-gray-800">
                No transactions found.
              </p>

              <p className="mt-1 text-sm text-gray-500">
                Try changing your search or filters.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[2600px] border-collapse">

                {/* Table Header */}

                <thead>
                  <tr className="bg-gray-50">

                    <th className="sticky left-0 z-20 border-b border-r border-slate-200/80 bg-slate-50/90 px-4 py-3 text-left text-[10px] font-extrabold uppercase tracking-[0.08em] text-slate-500">
                      SL
                    </th>

                    <th className="border-b border-slate-100 px-4 py-3 text-left text-[10px] font-extrabold uppercase tracking-[0.08em] text-slate-500">
                      Date Loaded
                    </th>

                    <th className="border-b border-slate-100 px-4 py-3 text-left text-[10px] font-extrabold uppercase tracking-[0.08em] text-slate-500">
                      Customer Company Name
                    </th>

                    <th className="border-b border-slate-100 px-4 py-3 text-left text-[10px] font-extrabold uppercase tracking-[0.08em] text-slate-500">
                      PO Number
                    </th>

                    <th className="border-b border-slate-100 px-4 py-3 text-left text-[10px] font-extrabold uppercase tracking-[0.08em] text-slate-500">
                      Transaction Type
                    </th>

                    <th className="border-b border-slate-100 px-4 py-3 text-left text-[10px] font-extrabold uppercase tracking-[0.08em] text-slate-500">
                      License Description
                    </th>

                    <th className="border-b border-slate-100 px-4 py-3 text-right text-[10px] font-extrabold uppercase tracking-[0.08em] text-slate-500">
                      Buy Price
                    </th>

                    <th className="border-b border-slate-100 px-4 py-3 text-right text-[10px] font-extrabold uppercase tracking-[0.08em] text-slate-500">
                      Sell Price
                    </th>

                    <th className="border-b border-slate-100 px-4 py-3 text-right text-[10px] font-extrabold uppercase tracking-[0.08em] text-slate-500">
                      Prorate Price
                    </th>

                    <th className="border-b border-slate-100 px-4 py-3 text-center text-[10px] font-extrabold uppercase tracking-[0.08em] text-slate-500">
                      Prorate Days
                    </th>

                    <th className="border-b border-slate-100 px-4 py-3 text-left text-[10px] font-extrabold uppercase tracking-[0.08em] text-slate-500">
                      Prorate Period
                    </th>

                    <th className="border-b border-slate-100 px-4 py-3 text-center text-[10px] font-extrabold uppercase tracking-[0.08em] text-slate-500">
                      Qty
                    </th>

                    <th className="border-b border-slate-100 px-4 py-3 text-right text-[10px] font-extrabold uppercase tracking-[0.08em] text-slate-500">
                      Total Revenue
                    </th>

                    <th className="border-b border-slate-100 px-4 py-3 text-right text-[10px] font-extrabold uppercase tracking-[0.08em] text-slate-500">
                      P/L
                    </th>

                    <th className="border-b border-slate-100 px-4 py-3 text-right text-[10px] font-extrabold uppercase tracking-[0.08em] text-slate-500">
                      Margin %
                    </th>

                    <th className="border-b border-slate-100 px-4 py-3 text-left text-[10px] font-extrabold uppercase tracking-[0.08em] text-slate-500">
                      Distributor
                    </th>

                    <th className="border-b border-slate-100 px-4 py-3 text-left text-[10px] font-extrabold uppercase tracking-[0.08em] text-slate-500">
                      Invoice Status
                    </th>

                    <th className="border-b border-slate-100 px-4 py-3 text-left text-[10px] font-extrabold uppercase tracking-[0.08em] text-slate-500">
                      Payment Received
                    </th>

                    <th className="border-b border-slate-100 px-4 py-3 text-left text-[10px] font-extrabold uppercase tracking-[0.08em] text-slate-500">
                      Remarks
                    </th>

                    <th className="sticky right-0 z-20 border-b border-l border-slate-200/80 bg-slate-50/90 px-4 py-3 text-center text-[10px] font-extrabold uppercase tracking-[0.08em] text-slate-500">
                      Action
                    </th>
                  </tr>
                </thead>

                {/* Table Body */}

                <tbody className="divide-y divide-slate-100">

                  {paginatedTransactions.map((item, index) => (
                    <tr
                      key={item.id}
                      className="group transition-all duration-150 hover:bg-amber-50/35"
                    >

                      {/* SL */}

                      <td className="sticky left-0 z-10 whitespace-nowrap border-r border-slate-100 bg-white px-4 py-3 text-sm font-semibold text-gray-700 group-hover:bg-amber-50/35">
                        {(currentPage - 1) * pageSize +
                          index +
                          1}
                      </td>

                      {/* Date */}

                      <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700">
                        {formatDate(item.date)}
                      </td>

                      {/* Customer */}

                      <td className="px-4 py-3">
                        <p className="max-w-[220px] truncate text-sm font-semibold text-gray-900">
                          {item.customer}
                        </p>
                      </td>

                      {/* PO */}

                      <td className="px-4 py-3 text-sm text-gray-700">
                        {item.poNumber || "-"}
                      </td>

                      {/* Type */}

                      <td className="px-4 py-3">
                        <span className="rounded-md bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-700">
                          {item.transactionType || "Not Set"}
                        </span>
                      </td>

                      {/* Product */}

                      <td className="px-4 py-3">
                        <p className="max-w-[300px] truncate text-sm text-gray-800">
                          {item.product}
                        </p>
                      </td>

                      {/* Buy */}

                      <td className="whitespace-nowrap px-4 py-3 text-right text-sm text-gray-700">
                        {formatCurrency(item.buyPrice)}
                      </td>

                      {/* Sell */}

                      <td className="whitespace-nowrap px-4 py-3 text-right text-sm font-medium text-gray-900">
                        {formatCurrency(item.sellPrice)}
                      </td>

                      {/* Prorate */}

                      <td className="whitespace-nowrap px-4 py-3 text-right text-sm text-gray-700">
                        {item.proratePrice !== null
                          ? formatCurrency(item.proratePrice)
                          : "-"}
                      </td>

                      {/* Days */}

                      <td className="px-4 py-3 text-center text-sm text-gray-700">
                        {item.prorateDays ?? "-"}
                      </td>

                      {/* Period */}

                      <td className="px-4 py-3 text-sm text-gray-700">
                        {item.periodLabel || "-"}
                      </td>

                      {/* Quantity */}

                      <td className="px-4 py-3 text-center text-sm font-semibold text-gray-900">
                        {item.quantity}
                      </td>

                      {/* Revenue */}

                      <td className="whitespace-nowrap px-4 py-3 text-right text-sm font-bold text-gray-900">
                        {formatCurrency(item.revenue)}
                      </td>

                      {/* Profit */}

                      <td className="whitespace-nowrap px-4 py-3 text-right text-sm font-semibold text-green-700">
                        {formatCurrency(item.profit)}
                      </td>

                      {/* Margin */}

                      <td className="whitespace-nowrap px-4 py-3 text-right text-sm font-semibold text-gray-900">
                        {Number(item.margin || 0).toFixed(2)}%
                      </td>

                      {/* Distributor */}

                      <td className="px-4 py-3 text-sm text-gray-700">
                        {item.distributor || "Not Assigned"}
                      </td>

                      {/* Invoice */}

                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex min-h-7 items-center whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-bold ring-1 ring-inset ${getStatusClass(
                            item.invoiceStatus
                          )}`}
                        >
                          {item.invoiceStatus || "Not Set"}
                        </span>
                      </td>

                      {/* Payment */}

                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex min-h-7 items-center whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-bold ring-1 ring-inset ${getStatusClass(
                            item.paymentStatus
                          )}`}
                        >
                          {item.paymentStatus || "Not Set"}
                        </span>
                      </td>

                      {/* Remarks */}

                      <td className="px-4 py-3">
                        <p
                          title={item.remarks || ""}
                          className="max-w-[280px] truncate text-sm text-gray-600"
                        >
                          {item.remarks || "-"}
                        </p>
                      </td>

                      {/* Actions */}

                      <td className="sticky right-0 z-10 border-l border-slate-100 bg-white px-4 py-3 text-center group-hover:bg-amber-50/35">
                        <div className="flex items-center justify-center gap-2">

                          {/* View - Everyone */}

                          <button
                            type="button"
                            onClick={() =>
                              setSelectedTransaction(item)
                            }
                            className="inline-flex h-8 items-center rounded-lg bg-blue-50 px-3 text-xs font-bold text-amber-700 ring-1 ring-amber-100 transition hover:-translate-y-px hover:bg-amber-100"
                          >
                            View
                          </button>

                          {/* Edit - Write roles only */}

                          {canModifyTransactions && (
                            <a
                              href={`/tracker/${item.id}/edit`}
                              className="inline-flex h-8 items-center rounded-lg bg-amber-50 px-3 text-xs font-bold text-amber-700 ring-1 ring-amber-100 transition hover:-translate-y-px hover:bg-amber-100"
                            >
                              Edit
                            </a>
                          )}

                        </div>
                      </td>
                    </tr>
                  ))}

                </tbody>
              </table>
            </div>
          )}

          {/* -------------------------------------------------
              PAGINATION
          -------------------------------------------------- */}

          {!loading &&
            filteredTransactions.length > 0 && (
              <div className="flex flex-col gap-3 border-t border-slate-100 px-5 py-3.5 sm:flex-row sm:items-center sm:justify-between">

                <p className="text-xs font-medium text-slate-500">
                  Page {currentPage} of {totalPages}
                </p>

                <div className="flex items-center gap-2">

                  <button
                    type="button"
                    disabled={currentPage === 1}
                    onClick={() =>
                      setPage((value) =>
                        Math.max(1, value - 1)
                      )
                    }
                    className="zeit-btn zeit-btn-secondary h-9 px-3 text-xs disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Previous
                  </button>

                  <div className="zeit-btn zeit-btn-primary h-9 min-w-9 px-3 text-xs">
                    {currentPage}
                  </div>

                  <button
                    type="button"
                    disabled={currentPage === totalPages}
                    onClick={() =>
                      setPage((value) =>
                        Math.min(totalPages, value + 1)
                      )
                    }
                    className="zeit-btn zeit-btn-secondary h-9 px-3 text-xs disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Next
                  </button>

                </div>
              </div>
            )}

        </section>
      </div>

      {/* -----------------------------------------------------
          VIEW TRANSACTION MODAL
      ------------------------------------------------------ */}

      {selectedTransaction && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-[2px]"
          onClick={() => setSelectedTransaction(null)}
        >
          <div
            className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-3xl border border-slate-200 bg-white shadow-[0_24px_70px_rgba(15,23,42,0.18)]"
            onClick={(event) => event.stopPropagation()}
          >

            {/* Modal Header */}

            <div className="sticky top-0 flex items-center justify-between border-b border-slate-100 bg-white px-6 py-5">

              <div>
                <h2 className="text-xl font-bold text-gray-950">
                  Transaction Details
                </h2>

                <p className="mt-1 text-[11px] font-medium text-slate-500">
                  Record #{selectedTransaction.id}
                  {selectedTransaction.sourceRow
                    ? ` • Excel Row ${selectedTransaction.sourceRow}`
                    : ""}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSelectedTransaction(null)}
                className="zeit-btn zeit-btn-secondary h-9 px-3 text-xs"
              >
                Close
              </button>

            </div>

            {/* Modal Details */}

            <div className="grid gap-5 p-6 md:grid-cols-2">

              <div>
                <p className="text-[10px] font-extrabold uppercase tracking-[0.08em] text-slate-500">
                  Customer Company Name
                </p>

                <p className="mt-1 text-sm font-bold text-slate-900">
                  {selectedTransaction.customer}
                </p>
              </div>

              <div>
                <p className="text-[10px] font-extrabold uppercase tracking-[0.08em] text-slate-500">
                  Date Loaded
                </p>

                <p className="mt-1 text-sm font-semibold text-slate-800">
                  {formatDate(selectedTransaction.date)}
                </p>
              </div>

              <div>
                <p className="text-[10px] font-extrabold uppercase tracking-[0.08em] text-slate-500">
                  PO Number
                </p>

                <p className="mt-1 text-sm font-semibold text-slate-800">
                  {selectedTransaction.poNumber || "-"}
                </p>
              </div>

              <div>
                <p className="text-[10px] font-extrabold uppercase tracking-[0.08em] text-slate-500">
                  Transaction Type
                </p>

                <p className="mt-1 text-sm font-semibold text-slate-800">
                  {selectedTransaction.transactionType ||
                    "Not Set"}
                </p>
              </div>

              <div className="md:col-span-2">
                <p className="text-[10px] font-extrabold uppercase tracking-[0.08em] text-slate-500">
                  License Description
                </p>

                <p className="mt-1 text-sm font-semibold text-slate-800">
                  {selectedTransaction.product}
                </p>
              </div>

              <div>
                <p className="text-[10px] font-extrabold uppercase tracking-[0.08em] text-slate-500">
                  Buy Price
                </p>

                <p className="mt-1 text-sm font-bold text-slate-900">
                  {formatCurrency(
                    selectedTransaction.buyPrice
                  )}
                </p>
              </div>

              <div>
                <p className="text-[10px] font-extrabold uppercase tracking-[0.08em] text-slate-500">
                  Sell Price
                </p>

                <p className="mt-1 text-sm font-bold text-slate-900">
                  {formatCurrency(
                    selectedTransaction.sellPrice
                  )}
                </p>
              </div>

              <div>
                <p className="text-[10px] font-extrabold uppercase tracking-[0.08em] text-slate-500">
                  Prorate Price
                </p>

                <p className="mt-1 text-sm font-semibold text-slate-800">
                  {selectedTransaction.proratePrice !== null
                    ? formatCurrency(
                        selectedTransaction.proratePrice
                      )
                    : "-"}
                </p>
              </div>

              <div>
                <p className="text-[10px] font-extrabold uppercase tracking-[0.08em] text-slate-500">
                  Quantity
                </p>

                <p className="mt-1 text-sm font-bold text-slate-900">
                  {selectedTransaction.quantity}
                </p>
              </div>

              <div>
                <p className="text-[10px] font-extrabold uppercase tracking-[0.08em] text-slate-500">
                  Total Revenue
                </p>

                <p className="mt-1 text-sm font-black text-blue-700">
                  {formatCurrency(
                    selectedTransaction.revenue
                  )}
                </p>
              </div>

              <div>
                <p className="text-[10px] font-extrabold uppercase tracking-[0.08em] text-slate-500">
                  P/L
                </p>

                <p className="mt-1 text-sm font-black text-emerald-600">
                  {formatCurrency(
                    selectedTransaction.profit
                  )}
                </p>
              </div>

              <div>
                <p className="text-[10px] font-extrabold uppercase tracking-[0.08em] text-slate-500">
                  Margin %
                </p>

                <p className="mt-1 font-bold text-gray-900">
                  {Number(
                    selectedTransaction.margin || 0
                  ).toFixed(2)}
                  %
                </p>
              </div>

              <div>
                <p className="text-[10px] font-extrabold uppercase tracking-[0.08em] text-slate-500">
                  Distributor
                </p>

                <p className="mt-1 text-sm font-semibold text-slate-800">
                  {selectedTransaction.distributor ||
                    "Not Assigned"}
                </p>
              </div>

              <div>
                <p className="text-[10px] font-extrabold uppercase tracking-[0.08em] text-slate-500">
                  Prorate Days
                </p>

                <p className="mt-1 text-sm font-semibold text-slate-800">
                  {selectedTransaction.prorateDays ?? "-"}
                </p>
              </div>

              <div>
                <p className="text-[10px] font-extrabold uppercase tracking-[0.08em] text-slate-500">
                  Prorate Period
                </p>

                <p className="mt-1 text-sm font-semibold text-slate-800">
                  {selectedTransaction.periodLabel || "-"}
                </p>
              </div>

              <div>
                <p className="text-[10px] font-extrabold uppercase tracking-[0.08em] text-slate-500">
                  Subscription Start
                </p>

                <p className="mt-1 text-sm font-semibold text-slate-800">
                  {formatDate(
                    selectedTransaction.subscriptionStart
                  )}
                </p>
              </div>

              <div>
                <p className="text-[10px] font-extrabold uppercase tracking-[0.08em] text-slate-500">
                  Subscription End
                </p>

                <p className="mt-1 text-sm font-semibold text-slate-800">
                  {formatDate(
                    selectedTransaction.subscriptionEnd
                  )}
                </p>
              </div>

              <div>
                <p className="text-[10px] font-extrabold uppercase tracking-[0.08em] text-slate-500">
                  Invoice Status
                </p>

                <div className="mt-2">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${getStatusClass(
                      selectedTransaction.invoiceStatus
                    )}`}
                  >
                    {selectedTransaction.invoiceStatus ||
                      "Not Set"}
                  </span>
                </div>
              </div>

              <div>
                <p className="text-[10px] font-extrabold uppercase tracking-[0.08em] text-slate-500">
                  Payment Received
                </p>

                <div className="mt-2">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${getStatusClass(
                      selectedTransaction.paymentStatus
                    )}`}
                  >
                    {selectedTransaction.paymentStatus ||
                      "Not Set"}
                  </span>
                </div>
              </div>

              <div className="md:col-span-2">
                <p className="text-[10px] font-extrabold uppercase tracking-[0.08em] text-slate-500">
                  Remarks
                </p>

                <div className="mt-2 rounded-xl border border-slate-200 bg-slate-50/80 p-4 text-sm leading-6 text-slate-700">
                  {selectedTransaction.remarks || "No remarks"}
                </div>
              </div>

            </div>

            {/* Modal Footer */}

            <div className="border-t border-slate-200/80 bg-slate-50/90 px-6 py-4 text-right">
              <button
                type="button"
                onClick={() => setSelectedTransaction(null)}
                className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-4 py-2.5 text-sm font-bold text-white shadow-[0_8px_18px_rgba(245,158,11,0.22)] transition hover:-translate-y-px hover:bg-amber-600"
              >
                Close
              </button>
            </div>

          </div>
        </div>
      )}
    </main>
  );
}
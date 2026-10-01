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
  }).format(Number(value || 0));
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

function getStatusClass(status: string | null) {
  const value = status?.trim().toLowerCase();

  if (value === "invoice sent") {
    return "bg-green-100 text-green-700 ring-green-200";
  }

  if (value === "need to send invoice") {
    return "bg-orange-100 text-orange-700 ring-orange-200";
  }

  if (value === "yes") {
    return "bg-green-100 text-green-700 ring-green-200";
  }

  if (value === "no") {
    return "bg-red-100 text-red-700 ring-red-200";
  }

  if (value === "not applicable") {
    return "bg-gray-100 text-gray-700 ring-gray-200";
  }

  return "bg-gray-100 text-gray-600 ring-gray-200";
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

function SearchIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-4-4" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M6 6l12 12" />
      <path d="M18 6L6 18" />
    </svg>
  );
}

function EyeIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z" />
      <circle cx="12" cy="12" r="2.5" />
    </svg>
  );
}

function EditIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4Z" />
    </svg>
  );
}

function ChevronLeftIcon() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m15 18-6-6 6-6" />
    </svg>
  );
}

function ChevronRightIcon() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}

export default function TrackerPage() {
  /* ---------------------------------------------------------
     USER / ROLE
  ---------------------------------------------------------- */

  const [userRole, setUserRole] = useState("");
  const [checkingRole, setCheckingRole] = useState(true);

  const canModifyTransactions =
    userRole === "ADMIN" ||
    userRole === "FINANCE" ||
    userRole === "SALES";

  /* ---------------------------------------------------------
     TRANSACTIONS
  ---------------------------------------------------------- */

  const [transactions, setTransactions] = useState<Transaction[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  /* ---------------------------------------------------------
     FILTERS
  ---------------------------------------------------------- */

  const [search, setSearch] = useState("");
  const [transactionType, setTransactionType] = useState("All");
  const [invoiceStatus, setInvoiceStatus] = useState("All");
  const [paymentStatus, setPaymentStatus] = useState("All");
  const [distributor, setDistributor] = useState("All");

  /* ---------------------------------------------------------
     PAGINATION
  ---------------------------------------------------------- */

  const [page, setPage] = useState(1);
  const pageSize = 15;

  /* ---------------------------------------------------------
     SELECTED TRANSACTION
  ---------------------------------------------------------- */

  const [selectedTransaction, setSelectedTransaction] =
    useState<Transaction | null>(null);

  /* ---------------------------------------------------------
     URL FILTERS
  ---------------------------------------------------------- */

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
     LOAD USER ROLE
  ---------------------------------------------------------- */

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
  ---------------------------------------------------------- */

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
  ---------------------------------------------------------- */

  const transactionTypes = useMemo(() => {
    return [
      "All",
      ...Array.from(
        new Set(
          transactions
            .map((item) => item.transactionType)
            .filter((item): item is string => Boolean(item))
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
            .filter((item): item is string => Boolean(item))
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
            .filter((item): item is string => Boolean(item))
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
            .filter((item): item is string => Boolean(item))
        )
      ).sort(),
    ];
  }, [transactions]);

  /* ---------------------------------------------------------
     FILTERING
  ---------------------------------------------------------- */

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
  ---------------------------------------------------------- */

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
     SUMMARY
  ---------------------------------------------------------- */

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
     RESET
  ---------------------------------------------------------- */

  function resetFilters() {
    setSearch("");
    setTransactionType("All");
    setInvoiceStatus("All");
    setPaymentStatus("All");
    setDistributor("All");
    setPage(1);
  }

  /* ---------------------------------------------------------
     ROLE LOADING
  ---------------------------------------------------------- */

  if (checkingRole) {
    return (
      <main className="min-h-screen bg-[#f8f7f3]">
        <div className="flex min-h-screen items-center justify-center">
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
  ---------------------------------------------------------- */

  return (
    <main className="min-h-screen bg-[#f8f7f3]">
      <div className="mx-auto max-w-[1900px] px-4 py-4 sm:px-5 lg:px-6">

        {/* HEADER */}

        <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-xl font-black tracking-tight text-slate-950">
              CSP Tracker
            </h1>

            <p className="mt-1 text-xs font-medium text-slate-500">
              {filteredTransactions.length.toLocaleString("en-IN")} matching
              records
            </p>
          </div>

          {canModifyTransactions && (
            <a
              href="/tracker/add"
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-amber-500 px-4 text-sm font-bold text-white shadow-[0_8px_18px_rgba(245,158,11,0.20)] transition hover:bg-amber-600"
            >
              <span className="text-lg leading-none">+</span>
              Add Transaction
            </a>
          )}
        </div>

        {/* ERROR */}

        {error && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {error}
          </div>
        )}

        {/* SUMMARY */}

        <section className="mb-3 grid grid-cols-1 gap-2.5 sm:grid-cols-3">
          <div className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 shadow-[0_3px_14px_rgba(15,23,42,0.03)]">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
                <QuantityIcon />
              </div>

              <div>
                <p className="text-[10px] font-extrabold uppercase tracking-wide text-slate-400">
                  Quantity
                </p>

                <p className="mt-0.5 text-lg font-black text-slate-950">
                  {totalQuantity.toLocaleString("en-IN")}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 shadow-[0_3px_14px_rgba(15,23,42,0.03)]">
            <p className="text-[10px] font-extrabold uppercase tracking-wide text-slate-400">
              Revenue
            </p>

            <p className="mt-0.5 text-lg font-black text-slate-950">
              {formatCurrency(totalRevenue)}
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 shadow-[0_3px_14px_rgba(15,23,42,0.03)]">
            <p className="text-[10px] font-extrabold uppercase tracking-wide text-slate-400">
              P/L
            </p>

            <p className="mt-0.5 text-lg font-black text-emerald-600">
              {formatCurrency(totalProfit)}
            </p>
          </div>
        </section>

        {/* FILTERS */}

        <section className="mb-3 rounded-xl border border-slate-200 bg-white p-3 shadow-[0_3px_14px_rgba(15,23,42,0.03)]">
          <div className="mb-2.5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-[13px] font-extrabold text-slate-950">
                Search & Filters
              </h2>

              <p className="mt-0.5 text-[10px] text-slate-500">
                Search customers, products, PO numbers, distributors and
                remarks.
              </p>
            </div>

            <button
              type="button"
              onClick={resetFilters}
              className="h-8 rounded-lg border border-slate-200 px-2.5 text-[11px] font-bold text-slate-600 transition hover:bg-slate-50"
            >
              Reset
            </button>
          </div>

          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
            {/* Search */}

            <div className="relative">
              <label className="mb-1 block text-[9px] font-extrabold uppercase tracking-wide text-slate-500">
                Search
              </label>

              <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                  <SearchIcon />
                </span>

                <input
                  type="text"
                  value={search}
                  onChange={(event) => {
                    setSearch(event.target.value);
                    setPage(1);
                  }}
                  placeholder="Customer, PO, product..."
                  className="h-9 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-xs outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-100"
                />
              </div>
            </div>

            {/* Transaction Type */}

            <div>
              <label className="mb-1 block text-[9px] font-extrabold uppercase tracking-wide text-slate-500">
                Transaction Type
              </label>

              <select
                value={transactionType}
                onChange={(event) => {
                  setTransactionType(event.target.value);
                  setPage(1);
                }}
                className="h-9 w-full rounded-lg border border-slate-200 bg-white px-2.5 text-xs outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-100"
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
              <label className="mb-1 block text-[9px] font-extrabold uppercase tracking-wide text-slate-500">
                Invoice Status
              </label>

              <select
                value={invoiceStatus}
                onChange={(event) => {
                  setInvoiceStatus(event.target.value);
                  setPage(1);
                }}
                className="h-9 w-full rounded-lg border border-slate-200 bg-white px-2.5 text-xs outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-100"
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
              <label className="mb-1 block text-[9px] font-extrabold uppercase tracking-wide text-slate-500">
                Payment Status
              </label>

              <select
                value={paymentStatus}
                onChange={(event) => {
                  setPaymentStatus(event.target.value);
                  setPage(1);
                }}
                className="h-9 w-full rounded-lg border border-slate-200 bg-white px-2.5 text-xs outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-100"
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
              <label className="mb-1 block text-[9px] font-extrabold uppercase tracking-wide text-slate-500">
                Distributor
              </label>

              <select
                value={distributor}
                onChange={(event) => {
                  setDistributor(event.target.value);
                  setPage(1);
                }}
                className="h-9 w-full rounded-lg border border-slate-200 bg-white px-2.5 text-xs outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-100"
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

        {/* TABLE */}

        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-[0_4px_18px_rgba(15,23,42,0.04)]">
          <div className="flex flex-col gap-2 border-b border-slate-100 px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-[13px] font-extrabold text-slate-950">
                Transaction Records
              </h2>

              <p className="mt-0.5 text-[11px] font-medium text-slate-500">
                Showing {paginatedTransactions.length} of{" "}
                {filteredTransactions.length} records
              </p>
            </div>

            <div className="text-[9px] font-semibold uppercase tracking-wide text-slate-400">
              Compact View
            </div>
          </div>

          {/* LOADING */}

          {loading ? (
            <div className="flex min-h-[220px] items-center justify-center">
              <div className="text-center">
                <div className="mx-auto mb-4 h-9 w-9 animate-spin rounded-full border-4 border-gray-200 border-t-amber-500" />

                <p className="text-xs font-medium text-slate-500">
                  Loading transactions...
                </p>
              </div>
            </div>
          ) : paginatedTransactions.length === 0 ? (
            <div className="flex min-h-[150px] items-center justify-center px-4 text-center">
              <p className="text-[13px] font-semibold text-gray-800">
                No transactions found.
              </p>

              <p className="mt-1 text-xs text-gray-500">
                Try changing your search or filters.
              </p>
            </div>
          ) : (
            <div className="w-full overflow-hidden">
              <table className="w-full table-fixed border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    <th className="w-[5%] px-2.5 py-2 text-left text-[9px] font-extrabold uppercase tracking-wide text-slate-500">
                      #
                    </th>

                    <th className="w-[9%] px-2.5 py-2 text-left text-[9px] font-extrabold uppercase tracking-wide text-slate-500">
                      Date
                    </th>

                    <th className="w-[17%] px-2.5 py-2 text-left text-[9px] font-extrabold uppercase tracking-wide text-slate-500">
                      Customer
                    </th>

                    <th className="w-[21%] px-2.5 py-2 text-left text-[9px] font-extrabold uppercase tracking-wide text-slate-500">
                      License / Product
                    </th>

                    <th className="w-[10%] px-2.5 py-2 text-left text-[9px] font-extrabold uppercase tracking-wide text-slate-500">
                      Type
                    </th>

                    <th className="w-[7%] px-2.5 py-2 text-center text-[9px] font-extrabold uppercase tracking-wide text-slate-500">
                      Qty
                    </th>

                    <th className="w-[12%] px-2.5 py-2 text-right text-[9px] font-extrabold uppercase tracking-wide text-slate-500">
                      Revenue
                    </th>

                    <th className="w-[10%] px-2.5 py-2 text-left text-[9px] font-extrabold uppercase tracking-wide text-slate-500">
                      Status
                    </th>

                    <th className="w-[9%] px-2.5 py-2 text-center text-[9px] font-extrabold uppercase tracking-wide text-slate-500">
                      Action
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {paginatedTransactions.map((item, index) => (
                    <tr
                      key={item.id}
                      className="group transition-colors hover:bg-amber-50/40"
                    >
                      {/* Number */}

                      <td className="px-2.5 py-2 text-xs font-semibold text-slate-500">
                        {(currentPage - 1) * pageSize + index + 1}
                      </td>

                      {/* Date */}

                      <td className="px-2.5 py-2 text-[11px] font-medium text-slate-600">
                        {formatDate(item.date)}
                      </td>

                      {/* Customer */}

                      <td className="px-2.5 py-2">
                        <div className="min-w-0">
                          <p
                            className="truncate text-[12px] font-bold text-slate-900"
                            title={item.customer}
                          >
                            {item.customer}
                          </p>

                          {item.poNumber && (
                            <p
                              className="mt-0.5 truncate text-[11px] text-slate-400"
                              title={item.poNumber}
                            >
                              PO: {item.poNumber}
                            </p>
                          )}
                        </div>
                      </td>

                      {/* Product */}

                      <td className="px-2.5 py-2">
                        <p
                          className="truncate text-[12px] font-medium text-slate-700"
                          title={item.product}
                        >
                          {item.product}
                        </p>

                        {item.distributor && (
                          <p
                            className="mt-0.5 truncate text-[11px] text-slate-400"
                            title={item.distributor}
                          >
                            {item.distributor}
                          </p>
                        )}
                      </td>

                      {/* Type */}

                      <td className="px-2.5 py-2">
                        <span className="inline-flex max-w-full truncate rounded-lg bg-slate-100 px-2 py-1 text-[10px] font-bold text-slate-600">
                          {item.transactionType || "Not Set"}
                        </span>
                      </td>

                      {/* Quantity */}

                      <td className="px-3 py-3 text-center">
                        <span className="text-[12px] font-bold text-slate-900">
                          {item.quantity}
                        </span>
                      </td>

                      {/* Revenue */}

                      <td className="px-2.5 py-2 text-right">
                        <p className="text-[12px] font-black text-slate-900">
                          {formatCurrency(item.revenue)}
                        </p>

                        <p className="mt-0.5 text-[9px] font-semibold text-emerald-600">
                          P/L {formatCurrency(item.profit)}
                        </p>
                      </td>

                      {/* Status */}

                      <td className="px-2.5 py-2">
                        <div className="flex flex-col items-start gap-1">
                          <span
                            className={`inline-flex max-w-full truncate rounded-full px-2 py-1 text-[9px] font-bold ring-1 ring-inset ${getStatusClass(
                              item.invoiceStatus
                            )}`}
                          >
                            {item.invoiceStatus || "Not Set"}
                          </span>

                          <span
                            className={`inline-flex max-w-full truncate rounded-full px-2 py-1 text-[9px] font-bold ring-1 ring-inset ${getStatusClass(
                              item.paymentStatus
                            )}`}
                          >
                            Payment: {item.paymentStatus || "Not Set"}
                          </span>
                        </div>
                      </td>

                      {/* Actions */}

                      <td className="px-2 py-2">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setSelectedTransaction(item)}
                            title="View transaction"
                            className="inline-flex h-8 items-center gap-1 rounded-lg bg-blue-50 px-2.5 text-[10px] font-bold text-blue-700 ring-1 ring-blue-100 transition hover:bg-blue-100"
                          >
                            <EyeIcon />
                            View
                          </button>

                          {canModifyTransactions && (
                            <a
                              href={`/tracker/${item.id}/edit`}
                              title="Edit transaction"
                              className="inline-flex h-8 items-center gap-1 rounded-lg bg-amber-50 px-2.5 text-[10px] font-bold text-amber-700 ring-1 ring-amber-100 transition hover:bg-amber-100"
                            >
                              <EditIcon />
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

          {/* PAGINATION */}

          {!loading && filteredTransactions.length > 0 && (
            <div className="flex flex-col gap-3 border-t border-slate-100 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs font-medium text-slate-500">
                Page {currentPage} of {totalPages}
              </p>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={currentPage === 1}
                  onClick={() =>
                    setPage((value) => Math.max(1, value - 1))
                  }
                  className="inline-flex h-9 items-center gap-1 rounded-lg border border-slate-200 px-3 text-xs font-bold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ChevronLeftIcon />
                  Previous
                </button>

                <div className="flex h-9 min-w-9 items-center justify-center rounded-lg bg-amber-500 px-3 text-xs font-black text-white">
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
                  className="inline-flex h-9 items-center gap-1 rounded-lg border border-slate-200 px-3 text-xs font-bold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Next
                  <ChevronRightIcon />
                </button>
              </div>
            </div>
          )}
        </section>
      </div>

      {/* =====================================================
          RIGHT SIDE TRANSACTION DRAWER
      ===================================================== */}

      {selectedTransaction && (
        <div
          className="fixed inset-0 z-[60] bg-slate-950/35 backdrop-blur-[2px]"
          onClick={() => setSelectedTransaction(null)}
        >
          <aside
            className="absolute inset-y-0 right-0 flex w-full max-w-xl flex-col bg-white shadow-[-20px_0_60px_rgba(15,23,42,0.16)]"
            onClick={(event) => event.stopPropagation()}
          >
            {/* HEADER */}

            <div className="flex shrink-0 items-center justify-between border-b border-slate-200 bg-white px-6 py-5">
              <div className="min-w-0">
                <p className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-amber-600">
                  Transaction Details
                </p>

                <h2
                  className="mt-1 truncate text-lg font-black text-slate-950"
                  title={selectedTransaction.customer}
                >
                  {selectedTransaction.customer}
                </h2>

                <p className="mt-1 text-[11px] font-medium text-slate-400">
                  Record #{selectedTransaction.id}
                  {selectedTransaction.sourceRow
                    ? ` • Excel Row ${selectedTransaction.sourceRow}`
                    : ""}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSelectedTransaction(null)}
                aria-label="Close transaction details"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
              >
                <CloseIcon />
              </button>
            </div>

            {/* BODY */}

            <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
              {/* OVERVIEW */}

              <section className="mb-6">
                <h3 className="mb-3 text-[10px] font-extrabold uppercase tracking-[0.12em] text-slate-400">
                  Overview
                </h3>

                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3">
                    <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                      Date
                    </p>

                    <p className="mt-1 text-sm font-bold text-slate-900">
                      {formatDate(selectedTransaction.date)}
                    </p>
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3">
                    <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                      Transaction Type
                    </p>

                    <p className="mt-1 text-sm font-bold text-slate-900">
                      {selectedTransaction.transactionType || "Not Set"}
                    </p>
                  </div>

                  <div className="col-span-2 rounded-xl border border-slate-200 bg-slate-50/70 p-3">
                    <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                      License / Product
                    </p>

                    <p className="mt-1 text-sm font-bold text-slate-900">
                      {selectedTransaction.product}
                    </p>
                  </div>

                  <div className="col-span-2 rounded-xl border border-slate-200 bg-slate-50/70 p-3">
                    <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                      PO Number
                    </p>

                    <p className="mt-1 text-sm font-bold text-slate-900">
                      {selectedTransaction.poNumber || "-"}
                    </p>
                  </div>

                  <div className="col-span-2 rounded-xl border border-slate-200 bg-slate-50/70 p-3">
                    <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                      Distributor
                    </p>

                    <p className="mt-1 text-sm font-bold text-slate-900">
                      {selectedTransaction.distributor || "Not Assigned"}
                    </p>
                  </div>
                </div>
              </section>

              {/* COMMERCIAL */}

              <section className="mb-6">
                <h3 className="mb-3 text-[10px] font-extrabold uppercase tracking-[0.12em] text-slate-400">
                  Commercial Details
                </h3>

                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl border border-slate-200 p-3">
                    <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                      Buy Price
                    </p>

                    <p className="mt-1 text-sm font-bold text-slate-900">
                      {formatCurrency(selectedTransaction.buyPrice)}
                    </p>
                  </div>

                  <div className="rounded-xl border border-slate-200 p-3">
                    <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                      Sell Price
                    </p>

                    <p className="mt-1 text-sm font-bold text-slate-900">
                      {formatCurrency(selectedTransaction.sellPrice)}
                    </p>
                  </div>

                  <div className="rounded-xl border border-slate-200 p-3">
                    <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                      Prorate Price
                    </p>

                    <p className="mt-1 text-sm font-bold text-slate-900">
                      {selectedTransaction.proratePrice !== null
                        ? formatCurrency(selectedTransaction.proratePrice)
                        : "-"}
                    </p>
                  </div>

                  <div className="rounded-xl border border-slate-200 p-3">
                    <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                      Quantity
                    </p>

                    <p className="mt-1 text-sm font-black text-slate-900">
                      {selectedTransaction.quantity}
                    </p>
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                    <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                      Revenue
                    </p>

                    <p className="mt-1 text-base font-black text-slate-900">
                      {formatCurrency(selectedTransaction.revenue)}
                    </p>
                  </div>

                  <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-3">
                    <p className="text-[10px] font-bold uppercase tracking-wide text-emerald-600">
                      P/L
                    </p>

                    <p className="mt-1 text-base font-black text-emerald-700">
                      {formatCurrency(selectedTransaction.profit)}
                    </p>
                  </div>

                  <div className="rounded-xl border border-slate-200 p-3">
                    <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                      Margin
                    </p>

                    <p className="mt-1 text-sm font-black text-slate-900">
                      {Number(
                        selectedTransaction.margin || 0
                      ).toFixed(2)}
                      %
                    </p>
                  </div>
                </div>
              </section>

              {/* SUBSCRIPTION */}

              <section className="mb-6">
                <h3 className="mb-3 text-[10px] font-extrabold uppercase tracking-[0.12em] text-slate-400">
                  Subscription
                </h3>

                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl border border-slate-200 p-3">
                    <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                      Subscription Start
                    </p>

                    <p className="mt-1 text-sm font-bold text-slate-900">
                      {formatDate(
                        selectedTransaction.subscriptionStart
                      )}
                    </p>
                  </div>

                  <div className="rounded-xl border border-slate-200 p-3">
                    <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                      Subscription End
                    </p>

                    <p className="mt-1 text-sm font-bold text-slate-900">
                      {formatDate(
                        selectedTransaction.subscriptionEnd
                      )}
                    </p>
                  </div>

                  <div className="rounded-xl border border-slate-200 p-3">
                    <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                      Prorate Days
                    </p>

                    <p className="mt-1 text-sm font-bold text-slate-900">
                      {selectedTransaction.prorateDays ?? "-"}
                    </p>
                  </div>

                  <div className="rounded-xl border border-slate-200 p-3">
                    <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                      Prorate Period
                    </p>

                    <p className="mt-1 text-sm font-bold text-slate-900">
                      {selectedTransaction.periodLabel || "-"}
                    </p>
                  </div>
                </div>
              </section>

              {/* STATUS */}

              <section className="mb-6">
                <h3 className="mb-3 text-[10px] font-extrabold uppercase tracking-[0.12em] text-slate-400">
                  Status
                </h3>

                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl border border-slate-200 p-3">
                    <p className="mb-2 text-[10px] font-bold uppercase tracking-wide text-slate-400">
                      Invoice
                    </p>

                    <span
                      className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold ring-1 ring-inset ${getStatusClass(
                        selectedTransaction.invoiceStatus
                      )}`}
                    >
                      {selectedTransaction.invoiceStatus || "Not Set"}
                    </span>
                  </div>

                  <div className="rounded-xl border border-slate-200 p-3">
                    <p className="mb-2 text-[10px] font-bold uppercase tracking-wide text-slate-400">
                      Payment
                    </p>

                    <span
                      className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold ring-1 ring-inset ${getStatusClass(
                        selectedTransaction.paymentStatus
                      )}`}
                    >
                      {selectedTransaction.paymentStatus || "Not Set"}
                    </span>
                  </div>
                </div>
              </section>

              {/* REMARKS */}

              <section>
                <h3 className="mb-3 text-[10px] font-extrabold uppercase tracking-[0.12em] text-slate-400">
                  Remarks
                </h3>

                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-700">
                  {selectedTransaction.remarks || "No remarks"}
                </div>
              </section>
            </div>

            {/* FOOTER */}

            <div className="flex shrink-0 items-center justify-between border-t border-slate-200 bg-white px-6 py-4">
              {canModifyTransactions ? (
                <a
                  href={`/tracker/${selectedTransaction.id}/edit`}
                  className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-4 py-2.5 text-sm font-bold text-white shadow-[0_8px_18px_rgba(245,158,11,0.22)] transition hover:bg-amber-600"
                >
                  <EditIcon />
                  Edit Transaction
                </a>
              ) : (
                <span />
              )}

              <button
                type="button"
                onClick={() => setSelectedTransaction(null)}
                className="inline-flex items-center rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
              >
                Close
              </button>
            </div>
          </aside>
        </div>
      )}
    </main>
  );
}
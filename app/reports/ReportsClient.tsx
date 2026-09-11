"use client";

import { generateReportPDF } from "@/lib/generate-report-pdf";
import { useEffect, useMemo, useState } from "react";

type Summary = {
  transactionCount: number;
  totalQuantity: number;
  totalRevenue: number;
  totalProfit: number;
  overallMargin: number;
};

type CustomerSummary = {
  customer: string;
  transactionCount: number;
  quantity: number;
  revenue: number;
  profit: number;
  margin: number;
};

type DistributorSummary = {
  distributor: string;
  transactionCount: number;
  quantity: number;
  revenue: number;
  profit: number;
  margin: number;
};

type InvoiceStatusSummary = {
  invoiceStatus: string;
  transactionCount: number;
  revenue: number;
  profit: number;
};

type TransactionTypeSummary = {
  transactionType: string;
  transactionCount: number;
  quantity: number;
  revenue: number;
  profit: number;
  margin: number;
};

type DateSummary = {
  date: string;
  transactionCount: number;
  quantity: number;
  revenue: number;
  profit: number;
  margin: number;
};

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

type SessionUser = {
  id: number;
  name: string;
  email: string;
  role: string;
};

type ReportData = {
  success: boolean;
  summary: Summary;
  customerSummary: CustomerSummary[];
  distributorSummary: DistributorSummary[];
  invoiceStatusSummary: InvoiceStatusSummary[];
  transactionTypeSummary: TransactionTypeSummary[];
  dateSummary: DateSummary[];
  transactions: Transaction[];
};

export default function ReportsPage() {
  const [report, setReport] = useState<ReportData | null>(null);
  const [user, setUser] = useState<SessionUser | null>(null);
  const [checkingRole, setCheckingRole] = useState(true);

  const canGenerateReports =
    user?.role === "ADMIN" ||
    user?.role === "FINANCE" ||
    user?.role === "MANAGEMENT";

  const [loading, setLoading] = useState(true);

  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [customer, setCustomer] = useState("");
  const [distributor, setDistributor] = useState("");
  const [invoiceStatus, setInvoiceStatus] = useState("");
  const [transactionType, setTransactionType] = useState("");

  const [customers, setCustomers] = useState<string[]>([]);
  const [distributors, setDistributors] = useState<string[]>([]);
  const [invoiceStatuses, setInvoiceStatuses] = useState<string[]>([]);
  const [transactionTypes, setTransactionTypes] = useState<string[]>([]);

  useEffect(() => {
    async function loadUser() {
      try {
        const response = await fetch("/api/auth/me", {
          cache: "no-store",
        });

        if (!response.ok) {
          setCheckingRole(false);
          return;
        }

        const data = await response.json();

        if (data.success && data.user) {
          setUser(data.user);
        }
      } catch (error) {
        console.error("Unable to load report user:", error);
      } finally {
        setCheckingRole(false);
      }
    }

    loadUser();
  }, []);

  useEffect(() => {
    loadMasterData();
    loadReport();
  }, []);

  async function loadMasterData() {
    try {
      const response = await fetch("/api/master-data", {
        cache: "no-store",
      });

      const data = await response.json();

      if (data.success) {
        setCustomers(
          (data.customers || [])
            .map((item: { name: string }) => item.name)
            .filter(Boolean)
            .sort()
        );

        setDistributors(
          (data.distributors || [])
            .map((item: { name: string }) => item.name)
            .filter(Boolean)
            .sort()
        );
      }
    } catch (error) {
      console.error("Master data loading error:", error);
    }
  }

  async function loadReport(customFilters?: {
    fromDate?: string;
    toDate?: string;
    customer?: string;
    distributor?: string;
    invoiceStatus?: string;
    transactionType?: string;
  }) {
    try {
      setLoading(true);

      const params = new URLSearchParams();

      const filters = {
        fromDate: customFilters?.fromDate ?? fromDate,
        toDate: customFilters?.toDate ?? toDate,
        customer: customFilters?.customer ?? customer,
        distributor: customFilters?.distributor ?? distributor,
        invoiceStatus: customFilters?.invoiceStatus ?? invoiceStatus,
        transactionType:
          customFilters?.transactionType ?? transactionType,
      };

      if (filters.fromDate) {
        params.set("fromDate", filters.fromDate);
      }

      if (filters.toDate) {
        params.set("toDate", filters.toDate);
      }

      if (filters.customer) {
        params.set("customer", filters.customer);
      }

      if (filters.distributor) {
        params.set("distributor", filters.distributor);
      }

      if (filters.invoiceStatus) {
        params.set("invoiceStatus", filters.invoiceStatus);
      }

      if (filters.transactionType) {
        params.set("transactionType", filters.transactionType);
      }

      const query = params.toString();

      const response = await fetch(
        `/api/reports${query ? `?${query}` : ""}`,
        {
          cache: "no-store",
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to load report.");
      }

      setReport(data);

      const uniqueInvoiceStatuses = Array.from(
        new Set(
          (data.transactions || [])
            .map((item: Transaction) =>
              item.invoiceStatus?.trim()
            )
            .filter(Boolean)
        )
      ).sort() as string[];

      const uniqueTransactionTypes = Array.from(
        new Set(
          (data.transactions || [])
            .map((item: Transaction) =>
              item.transactionType?.trim()
            )
            .filter(Boolean)
        )
      ).sort() as string[];

      setInvoiceStatuses(uniqueInvoiceStatuses);
      setTransactionTypes(uniqueTransactionTypes);
    } catch (error) {
      console.error("Report loading error:", error);
      setReport(null);
    } finally {
      setLoading(false);
    }
  }

  function applyFilters() {
    loadReport();
  }

  function clearFilters() {
    setFromDate("");
    setToDate("");
    setCustomer("");
    setDistributor("");
    setInvoiceStatus("");
    setTransactionType("");

    loadReport({
      fromDate: "",
      toDate: "",
      customer: "",
      distributor: "",
      invoiceStatus: "",
      transactionType: "",
    });
  }

  function generatePDF() {
    if (!report) return;

    generateReportPDF({
      filters: {
        fromDate,
        toDate,
        customer,
        distributor,
        invoiceStatus,
        transactionType,
      },
      summary: report.summary,
      customerSummary: report.customerSummary.map((item) => ({
        customer: item.customer,
        transactionCount: item.transactionCount,
        totalQuantity: item.quantity,
        totalRevenue: item.revenue,
        totalProfit: item.profit,
        margin: item.margin,
      })),
      distributorSummary: report.distributorSummary.map((item) => ({
        distributor: item.distributor,
        transactionCount: item.transactionCount,
        totalQuantity: item.quantity,
        totalRevenue: item.revenue,
        totalProfit: item.profit,
        margin: item.margin,
      })),
      invoiceStatusSummary: report.invoiceStatusSummary.map((item) => ({
        status: item.invoiceStatus,
        transactionCount: item.transactionCount,
        totalRevenue: item.revenue,
      })),
      transactionTypeSummary: report.transactionTypeSummary.map((item) => ({
        transactionType: item.transactionType,
        transactionCount: item.transactionCount,
        totalRevenue: item.revenue,
      })),
      dateSummary: report.dateSummary.map((item) => ({
        date: item.date,
        transactionCount: item.transactionCount,
        totalQuantity: item.quantity,
        totalRevenue: item.revenue,
        totalProfit: item.profit,
      })),
      transactions: report.transactions,
    });
  }

  function formatCurrency(value: number) {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  }

  function formatCompactCurrency(value: number) {
    const absolute = Math.abs(value);

    if (absolute >= 10000000) {
      return `₹${(value / 10000000).toFixed(2)} Cr`;
    }

    if (absolute >= 100000) {
      return `₹${(value / 100000).toFixed(2)} L`;
    }

    if (absolute >= 1000) {
      return `₹${(value / 1000).toFixed(1)}K`;
    }

    return `₹${value.toFixed(0)}`;
  }

  function formatDate(value: string) {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return "-";
    }

    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }

  const topCustomers = useMemo(() => {
    return report?.customerSummary.slice(0, 10) || [];
  }, [report]);

  const topDistributors = useMemo(() => {
    return report?.distributorSummary.slice(0, 10) || [];
  }, [report]);

  const maxCustomerRevenue = useMemo(() => {
    return Math.max(
      ...topCustomers.map((item) => item.revenue),
      1
    );
  }, [topCustomers]);

  const maxDistributorRevenue = useMemo(() => {
    return Math.max(
      ...topDistributors.map((item) => item.revenue),
      1
    );
  }, [topDistributors]);

  if (checkingRole) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <div className="text-sm font-medium text-gray-500">
          Loading reports...
        </div>
      </div>
    );
  }

  const activeFilterCount = [
    fromDate,
    toDate,
    customer,
    distributor,
    invoiceStatus,
    transactionType,
  ].filter(Boolean).length;

  return (
    <div className="min-h-screen bg-gray-50/70 px-4 py-6 text-gray-950 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1800px]">
        {/* Header */}
        <div className="mb-7 flex flex-col gap-5 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.15em] text-blue-600">
              <span className="h-2 w-2 rounded-full bg-blue-600" />
              Analytics
              <span className="text-gray-300">/</span>
              Reports
            </div>

            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
              Business Reports
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-500">
              Analyze CSP transactions, revenue, profitability, customers,
              distributors and invoice activity.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {canGenerateReports && (
              <button
                type="button"
                onClick={generatePDF}
                disabled={!report || loading}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-red-600 px-5 text-sm font-bold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-red-700 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50"
              >
                <DocumentIcon />
                Generate PDF
              </button>
            )}

            <button
              type="button"
              onClick={() => loadReport()}
              disabled={loading}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 text-sm font-bold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-blue-700 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50"
            >
              <RefreshIcon />
              Refresh Report
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-7 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-base font-bold">
                Report Filters
              </h2>

              <p className="mt-1 text-xs text-gray-500">
                Select the reporting period and business dimensions.
              </p>
            </div>

            <div className="flex items-center gap-3">
              {activeFilterCount > 0 && (
                <span className="rounded-full bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-700">
                  {activeFilterCount} filter
                  {activeFilterCount === 1 ? "" : "s"} active
                </span>
              )}

              <button
                type="button"
                onClick={clearFilters}
                className="rounded-lg px-2.5 py-1.5 text-xs font-bold text-gray-500 transition hover:bg-gray-50 hover:text-blue-600"
              >
                Clear
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            <FilterField label="From Date">
              <input
                type="date"
                value={fromDate}
                onChange={(event) => setFromDate(event.target.value)}
                className="report-input"
              />
            </FilterField>

            <FilterField label="To Date">
              <input
                type="date"
                value={toDate}
                onChange={(event) => setToDate(event.target.value)}
                className="report-input"
              />
            </FilterField>

            <FilterField label="Customer">
              <select
                value={customer}
                onChange={(event) => setCustomer(event.target.value)}
                className="report-input"
              >
                <option value="">All Customers</option>
                {customers.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </FilterField>

            <FilterField label="Distributor">
              <select
                value={distributor}
                onChange={(event) =>
                  setDistributor(event.target.value)
                }
                className="report-input"
              >
                <option value="">All Distributors</option>
                {distributors.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </FilterField>

            <FilterField label="Invoice Status">
              <select
                value={invoiceStatus}
                onChange={(event) =>
                  setInvoiceStatus(event.target.value)
                }
                className="report-input"
              >
                <option value="">All Statuses</option>
                {invoiceStatuses.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </FilterField>

            <FilterField label="Transaction Type">
              <select
                value={transactionType}
                onChange={(event) =>
                  setTransactionType(event.target.value)
                }
                className="report-input"
              >
                <option value="">All Types</option>
                {transactionTypes.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </FilterField>
          </div>

          <div className="mt-4 flex justify-end">
            <button
              type="button"
              onClick={applyFilters}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 text-sm font-bold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-blue-700 hover:shadow-md"
            >
              <FilterIcon />
              Apply Filters
            </button>
          </div>
        </div>

        {loading ? (
          <LoadingState />
        ) : !report ? (
          <ErrorState onRetry={() => loadReport()} />
        ) : (
          <>
            {/* Summary */}
            <div className="mb-7 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
              <MetricCard
                title="Transactions"
                value={report.summary.transactionCount.toLocaleString(
                  "en-IN"
                )}
                subtitle="Transactions in report"
                icon={<DocumentIcon />}
                iconClass="bg-blue-50 text-blue-600"
              />

              <MetricCard
                title="Quantity"
                value={report.summary.totalQuantity.toLocaleString(
                  "en-IN"
                )}
                subtitle="Total licenses / units"
                icon={<QuantityIcon />}
                iconClass="bg-violet-50 text-violet-600"
              />

              <MetricCard
                title="Revenue"
                value={formatCompactCurrency(
                  report.summary.totalRevenue
                )}
                subtitle="Total revenue"
                icon={<RevenueIcon />}
                iconClass="bg-indigo-50 text-indigo-600"
              />

              <MetricCard
                title="P/L"
                value={formatCompactCurrency(
                  report.summary.totalProfit
                )}
                subtitle="Total profit / loss"
                icon={<ProfitIcon />}
                iconClass="bg-emerald-50 text-emerald-600"
              />

              <MetricCard
                title="Overall Margin"
                value={`${report.summary.overallMargin.toFixed(2)}%`}
                subtitle="Profitability"
                icon={<MarginIcon />}
                iconClass="bg-amber-50 text-amber-600"
              />
            </div>

            {/* Analytics Grid */}
            <div className="mb-7 grid grid-cols-1 gap-6 xl:grid-cols-2">
              {/* Customer Report */}
              <ReportCard
                title="Customer Performance"
                subtitle="Top customers by revenue"
              >
                {topCustomers.length === 0 ? (
                  <EmptyMini />
                ) : (
                  <div className="space-y-5">
                    {topCustomers.map((item, index) => {
                      const percentage =
                        (item.revenue / maxCustomerRevenue) * 100;

                      return (
                        <div key={item.customer}>
                          <div className="mb-2 flex items-center justify-between gap-4">
                            <div className="flex min-w-0 items-center gap-3">
                              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-xs font-bold text-gray-500">
                                {index + 1}
                              </span>

                              <span
                                className="truncate text-sm font-bold text-gray-800"
                                title={item.customer}
                              >
                                {item.customer}
                              </span>
                            </div>

                            <span className="shrink-0 text-sm font-bold text-gray-900">
                              {formatCompactCurrency(item.revenue)}
                            </span>
                          </div>

                          <div className="ml-10 h-2 overflow-hidden rounded-full bg-gray-100">
                            <div
                              className="h-full rounded-full bg-blue-600 transition-all"
                              style={{
                                width: `${percentage}%`,
                              }}
                            />
                          </div>

                          <div className="ml-10 mt-1.5 flex justify-between text-[11px] text-gray-400">
                            <span>
                              {item.transactionCount} transactions
                            </span>

                            <span>
                              P/L {formatCompactCurrency(item.profit)}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </ReportCard>

              {/* Distributor Report */}
              <ReportCard
                title="Distributor Performance"
                subtitle="Revenue by backend distributor"
              >
                {topDistributors.length === 0 ? (
                  <EmptyMini />
                ) : (
                  <div className="space-y-5">
                    {topDistributors.map((item, index) => {
                      const percentage =
                        (item.revenue / maxDistributorRevenue) * 100;

                      return (
                        <div key={item.distributor}>
                          <div className="mb-2 flex items-center justify-between gap-4">
                            <div className="flex min-w-0 items-center gap-3">
                              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-xs font-bold text-gray-500">
                                {index + 1}
                              </span>

                              <span
                                className="truncate text-sm font-bold text-gray-800"
                                title={item.distributor}
                              >
                                {item.distributor}
                              </span>
                            </div>

                            <span className="shrink-0 text-sm font-bold text-gray-900">
                              {formatCompactCurrency(item.revenue)}
                            </span>
                          </div>

                          <div className="ml-10 h-2 overflow-hidden rounded-full bg-gray-100">
                            <div
                              className="h-full rounded-full bg-indigo-600 transition-all"
                              style={{
                                width: `${percentage}%`,
                              }}
                            />
                          </div>

                          <div className="ml-10 mt-1.5 flex justify-between text-[11px] text-gray-400">
                            <span>
                              {item.transactionCount} transactions
                            </span>

                            <span>
                              P/L {formatCompactCurrency(item.profit)}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </ReportCard>
            </div>

            {/* Summary Tables */}
            <div className="mb-7 grid grid-cols-1 gap-6 xl:grid-cols-2">
              {/* Invoice Status */}
              <ReportCard
                title="Invoice Status"
                subtitle="Billing status distribution"
              >
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[600px]">
                    <thead>
                      <tr className="border-b border-gray-100 text-left">
                        <th className="px-2 py-3 text-xs font-bold uppercase tracking-wide text-gray-400">
                          Status
                        </th>
                        <th className="px-2 py-3 text-right text-xs font-bold uppercase tracking-wide text-gray-400">
                          Records
                        </th>
                        <th className="px-2 py-3 text-right text-xs font-bold uppercase tracking-wide text-gray-400">
                          Revenue
                        </th>
                        <th className="px-2 py-3 text-right text-xs font-bold uppercase tracking-wide text-gray-400">
                          P/L
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {report.invoiceStatusSummary.map((item) => (
                        <tr
                          key={item.invoiceStatus}
                          className="border-b border-gray-100 transition hover:bg-blue-50/30"
                        >
                          <td className="px-2 py-3 text-sm font-semibold text-gray-700">
                            <span className="inline-flex items-center gap-2">
                              <span className="h-2 w-2 rounded-full bg-blue-500" />
                              {item.invoiceStatus}
                            </span>
                          </td>

                          <td className="px-2 py-3 text-right text-sm font-bold text-gray-800">
                            {item.transactionCount}
                          </td>

                          <td className="px-2 py-3 text-right text-sm font-semibold text-gray-800">
                            {formatCurrency(item.revenue)}
                          </td>

                          <td className="px-2 py-3 text-right text-sm font-semibold text-emerald-600">
                            {formatCurrency(item.profit)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </ReportCard>

              {/* Transaction Type */}
              <ReportCard
                title="Transaction Type"
                subtitle="Revenue by transaction category"
              >
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[600px]">
                    <thead>
                      <tr className="border-b border-gray-100 text-left">
                        <th className="px-2 py-3 text-xs font-bold uppercase tracking-wide text-gray-400">
                          Type
                        </th>
                        <th className="px-2 py-3 text-right text-xs font-bold uppercase tracking-wide text-gray-400">
                          Records
                        </th>
                        <th className="px-2 py-3 text-right text-xs font-bold uppercase tracking-wide text-gray-400">
                          Revenue
                        </th>
                        <th className="px-2 py-3 text-right text-xs font-bold uppercase tracking-wide text-gray-400">
                          P/L
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {report.transactionTypeSummary.map((item) => (
                        <tr
                          key={item.transactionType}
                          className="border-b border-gray-100 transition hover:bg-blue-50/30"
                        >
                          <td className="px-2 py-3 text-sm font-semibold text-gray-700">
                            {item.transactionType}
                          </td>

                          <td className="px-2 py-3 text-right text-sm font-bold text-gray-800">
                            {item.transactionCount}
                          </td>

                          <td className="px-2 py-3 text-right text-sm font-semibold text-gray-800">
                            {formatCurrency(item.revenue)}
                          </td>

                          <td className="px-2 py-3 text-right text-sm font-semibold text-emerald-600">
                            {formatCurrency(item.profit)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </ReportCard>
            </div>

            {/* Date Summary */}
            <div className="mb-7 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
              <div className="border-b border-gray-100 px-5 py-5 sm:px-6">
                <h2 className="text-lg font-bold">
                  Date-wise Summary
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  Daily transaction, revenue and profitability summary.
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-[800px] w-full">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50/90">
                      <th className="px-5 py-3 text-left text-xs font-bold uppercase tracking-wide text-gray-500">
                        Date
                      </th>

                      <th className="px-5 py-3 text-right text-xs font-bold uppercase tracking-wide text-gray-500">
                        Transactions
                      </th>

                      <th className="px-5 py-3 text-right text-xs font-bold uppercase tracking-wide text-gray-500">
                        Quantity
                      </th>

                      <th className="px-5 py-3 text-right text-xs font-bold uppercase tracking-wide text-gray-500">
                        Revenue
                      </th>

                      <th className="px-5 py-3 text-right text-xs font-bold uppercase tracking-wide text-gray-500">
                        P/L
                      </th>

                      <th className="px-5 py-3 text-right text-xs font-bold uppercase tracking-wide text-gray-500">
                        Margin
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {report.dateSummary.map((item) => (
                      <tr
                        key={item.date}
                        className="border-b border-gray-100 transition hover:bg-blue-50/30"
                      >
                        <td className="px-5 py-3.5 text-sm font-semibold text-gray-800">
                          {formatDate(item.date)}
                        </td>

                        <td className="px-5 py-3.5 text-right text-sm font-semibold text-gray-700">
                          {item.transactionCount}
                        </td>

                        <td className="px-5 py-3.5 text-right text-sm font-semibold text-gray-700">
                          {item.quantity.toLocaleString("en-IN")}
                        </td>

                        <td className="px-5 py-3.5 text-right text-sm font-bold text-gray-900">
                          {formatCurrency(item.revenue)}
                        </td>

                        <td className="px-5 py-3.5 text-right text-sm font-bold text-emerald-600">
                          {formatCurrency(item.profit)}
                        </td>

                        <td className="px-5 py-3.5 text-right text-sm font-bold text-blue-600">
                          {item.margin.toFixed(2)}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Detailed Report */}
            <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
              <div className="flex flex-col gap-4 border-b border-gray-100 px-5 py-5 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <h2 className="text-lg font-bold">
                    Detailed Transaction Report
                  </h2>

                  <p className="mt-1 text-sm text-gray-500">
                    Complete transaction-level information included in
                    this report.
                  </p>
                </div>

                <div className="rounded-xl bg-gray-50 px-3 py-2 text-xs font-bold text-gray-600 ring-1 ring-gray-200">
                  {report.transactions.length} records
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-[1600px] w-full">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50/90">
                      <th className="px-4 py-4 text-left text-xs font-bold uppercase tracking-wide text-gray-500">
                        Date
                      </th>

                      <th className="px-4 py-4 text-left text-xs font-bold uppercase tracking-wide text-gray-500">
                        Customer
                      </th>

                      <th className="px-4 py-4 text-left text-xs font-bold uppercase tracking-wide text-gray-500">
                        Product
                      </th>

                      <th className="px-4 py-4 text-left text-xs font-bold uppercase tracking-wide text-gray-500">
                        PO Number
                      </th>

                      <th className="px-4 py-4 text-left text-xs font-bold uppercase tracking-wide text-gray-500">
                        Distributor
                      </th>

                      <th className="px-4 py-4 text-left text-xs font-bold uppercase tracking-wide text-gray-500">
                        Type
                      </th>

                      <th className="px-4 py-4 text-right text-xs font-bold uppercase tracking-wide text-gray-500">
                        Qty
                      </th>

                      <th className="px-4 py-4 text-right text-xs font-bold uppercase tracking-wide text-gray-500">
                        Revenue
                      </th>

                      <th className="px-4 py-4 text-right text-xs font-bold uppercase tracking-wide text-gray-500">
                        P/L
                      </th>

                      <th className="px-4 py-4 text-right text-xs font-bold uppercase tracking-wide text-gray-500">
                        Margin
                      </th>

                      <th className="px-4 py-4 text-left text-xs font-bold uppercase tracking-wide text-gray-500">
                        Invoice
                      </th>

                      <th className="px-4 py-4 text-left text-xs font-bold uppercase tracking-wide text-gray-500">
                        Payment
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {report.transactions.map((item) => (
                      <tr
                        key={item.id}
                        className="border-b border-gray-100 transition hover:bg-blue-50/30"
                      >
                        <td className="whitespace-nowrap px-4 py-4 text-sm text-gray-600">
                          {formatDate(item.date)}
                        </td>

                        <td className="max-w-[220px] px-4 py-4">
                          <div
                            className="truncate text-sm font-bold text-gray-900"
                            title={item.customer}
                          >
                            {item.customer}
                          </div>
                        </td>

                        <td className="max-w-[260px] px-4 py-4">
                          <div
                            className="truncate text-sm text-gray-700"
                            title={item.product}
                          >
                            {item.product}
                          </div>
                        </td>

                        <td className="whitespace-nowrap px-4 py-4 text-sm text-gray-600">
                          {item.poNumber || "—"}
                        </td>

                        <td className="whitespace-nowrap px-4 py-4 text-sm text-gray-700">
                          {item.distributor || "—"}
                        </td>

                        <td className="whitespace-nowrap px-4 py-4 text-sm text-gray-700">
                          {item.transactionType || "—"}
                        </td>

                        <td className="px-4 py-4 text-right text-sm font-bold text-gray-800">
                          {item.quantity.toLocaleString("en-IN")}
                        </td>

                        <td className="px-4 py-4 text-right text-sm font-bold text-gray-900">
                          {formatCurrency(item.revenue)}
                        </td>

                        <td className="px-4 py-4 text-right text-sm font-bold text-emerald-600">
                          {formatCurrency(item.profit)}
                        </td>

                        <td className="px-4 py-4 text-right text-sm font-bold text-blue-600">
                          {item.margin.toFixed(2)}%
                        </td>

                        <td className="whitespace-nowrap px-4 py-4 text-sm text-gray-700">
                          {item.invoiceStatus || "Not Set"}
                        </td>

                        <td className="whitespace-nowrap px-4 py-4 text-sm text-gray-700">
                          {item.paymentStatus || "Not Set"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>

      <style jsx>{`
        .report-input {
          height: 44px;
          width: 100%;
          border-radius: 12px;
          border: 1px solid #d1d5db;
          background: white;
          padding: 0 12px;
          font-size: 14px;
          font-weight: 500;
          color: #374151;
          outline: none;
        }

        .report-input:focus {
          border-color: #3b82f6;
          background: white;
          box-shadow: 0 0 0 4px #eff6ff;
        }
      `}</style>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Components                                                                 */
/* -------------------------------------------------------------------------- */

function MetricCard({
  title,
  value,
  subtitle,
  icon,
  iconClass,
}: {
  title: string;
  value: string;
  subtitle: string;
  icon: React.ReactNode;
  iconClass: string;
}) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-gray-300 hover:shadow-md">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-wide text-gray-400">
            {title}
          </p>

          <p className="mt-3 truncate text-2xl font-bold tracking-tight text-gray-950">
            {value}
          </p>

          <p className="mt-1 text-xs text-gray-400">{subtitle}</p>
        </div>

        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${iconClass}`}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}

function ReportCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="mb-6">
        <h2 className="text-lg font-bold text-gray-950">{title}</h2>

        <p className="mt-1 text-sm text-gray-500">{subtitle}</p>
      </div>

      {children}
    </div>
  );
}

function FilterField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wide text-gray-500">
        {label}
      </label>

      {children}
    </div>
  );
}

function EmptyMini() {
  return (
    <div className="flex min-h-[180px] items-center justify-center rounded-xl bg-gray-50 text-sm text-gray-400">
      No data available.
    </div>
  );
}

function LoadingState() {
  return (
    <div className="flex min-h-[500px] flex-col items-center justify-center rounded-2xl border border-gray-200 bg-white shadow-sm">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600" />

      <p className="mt-4 text-sm font-semibold text-gray-500">
        Generating report...
      </p>
    </div>
  );
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center rounded-2xl border border-gray-200 bg-white text-center shadow-sm">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-500">
        <AlertIcon />
      </div>

      <h2 className="mt-4 text-lg font-bold text-gray-900">
        Unable to generate report
      </h2>

      <p className="mt-2 text-sm text-gray-500">
        Please try refreshing the report.
      </p>

      <button
        type="button"
        onClick={onRetry}
        className="mt-5 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-blue-700"
      >
        Try Again
      </button>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Icons                                                                      */
/* -------------------------------------------------------------------------- */

function DocumentIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <path d="M14 2v6h6" />
      <path d="M8 13h8" />
      <path d="M8 17h6" />
    </svg>
  );
}

function QuantityIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M8 6h13" />
      <path d="M8 12h13" />
      <path d="M8 18h13" />
      <path d="M3 6h.01" />
      <path d="M3 12h.01" />
      <path d="M3 18h.01" />
    </svg>
  );
}

function RevenueIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 2v20" />
      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7H14a3.5 3.5 0 0 1 0 7H6" />
    </svg>
  );
}

function ProfitIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 3v18h18" />
      <path d="m7 16 4-5 3 3 5-7" />
    </svg>
  );
}

function MarginIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M8 16l8-8" />
      <circle cx="8.5" cy="8.5" r="1" />
      <circle cx="15.5" cy="15.5" r="1" />
    </svg>
  );
}

function FilterIcon() {
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
      <path d="M4 6h16" />
      <path d="M7 12h10" />
      <path d="M10 18h4" />
    </svg>
  );
}

function RefreshIcon() {
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
      <path d="M20 11a8.1 8.1 0 0 0-15.5-2M4 5v4h4" />
      <path d="M4 13a8.1 8.1 0 0 0 15.5 2M20 19v-4h-4" />
    </svg>
  );
}

function AlertIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M10.3 3.9 2.5 17a2 2 0 0 0 1.7 3h15.6a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />
      <path d="M12 9v4" />
      <path d="M12 17h.01" />
    </svg>
  );
}
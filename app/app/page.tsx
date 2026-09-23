"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type Summary = {
  totalRevenue: number;
  totalProfit: number;
  overallMargin: number;
  totalTransactions: number;
  totalQuantity: number;
  actionRequiredCount: number;
};

type StatusItem = {
  name: string;
  count: number;
  revenue: number;
};

type TransactionType = {
  name: string;
  count: number;
  revenue: number;
  profit: number;
};

type BreakdownItem = {
  name: string;
  transactions: number;
  quantity: number;
  revenue: number;
  profit: number;
};

type MonthlyTrend = {
  month: string;
  revenue: number;
  profit: number;
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

type DashboardData = {
  success: boolean;
  summary: Summary;
  invoiceStatuses: StatusItem[];
  paymentStatuses: StatusItem[];
  transactionTypes: TransactionType[];
  revenueByCustomer: BreakdownItem[];
  revenueByProduct: BreakdownItem[];
  revenueByDistributor: BreakdownItem[];
  monthlyTrend: MonthlyTrend[];
  actionRequired: Transaction[];
  recentTransactions: Transaction[];
};

const chartColors = [
  "#2563eb",
  "#16a34a",
  "#f59e0b",
  "#dc2626",
  "#7c3aed",
  "#0891b2",
  "#db2777",
  "#4f46e5",
];

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

function MetricTile({
  label,
  value,
  hint,
  icon,
  tone,
}: {
  label: string;
  value: string;
  hint: string;
  icon: React.ReactNode;
  tone: "blue" | "green" | "violet" | "amber";
}) {
  const toneClasses = {
    blue: "bg-blue-50 text-blue-600 ring-blue-100",
    green: "bg-emerald-50 text-emerald-600 ring-emerald-100",
    violet: "bg-violet-50 text-violet-600 ring-violet-100",
    amber: "bg-amber-50 text-amber-600 ring-amber-100",
  }[tone];

  return (
    <div className="zeit-metric">
      <div className={`zeit-metric-icon ring-1 ${toneClasses}`}>
        {icon}
      </div>

      <div className="min-w-0">
        <p className="zeit-metric-label">{label}</p>
        <p className="zeit-metric-value">{value}</p>
        <p className={`zeit-metric-hint ${tone === "amber" ? "text-amber-600" : ""}`}>
          {hint}
        </p>
      </div>
    </div>
  );
}

function RupeeIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
      aria-hidden="true">
      <path d="M7 5h10" />
      <path d="M7 9h8.5" />
      <path d="M9 5c4.5 0 7 2 7 5s-2.5 5-7 5" />
      <path d="m9 15 6 5" />
    </svg>
  );
}

function QuantityIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
      aria-hidden="true">
      <path d="M8 4h8M6 7h12M5 20h14V9H5z" />
      <path d="M8 12h8M8 15h5" />
    </svg>
  );
}

function TransactionsIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
      aria-hidden="true">
      <rect x="4" y="4" width="16" height="16" rx="2" />
      <path d="M8 8h8M8 12h6M8 16h4" />
    </svg>
  );
}

function ProfitIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
      aria-hidden="true">
      <path d="M4 19V5" />
      <path d="M4 19h16" />
      <path d="m7 15 4-4 3 2 5-6" />
      <path d="M16 7h3v3" />
    </svg>
  );
}

function MarginIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
      aria-hidden="true">
      <circle cx="12" cy="12" r="8.5" />
      <path d="M9 9l6 6M15 9h.01M9 15h.01" />
    </svg>
  );
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("en-IN").format(value);
}

function formatDate(value: string) {
  if (!value) return "-";

  return new Date(value).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function statusBadge(status: string | null) {
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

  return "bg-gray-100 text-gray-600";
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => {
    async function loadDashboard() {
      try {
        setLoading(true);

        const response = await fetch("/api/dashboard", {
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error("Failed to load dashboard.");
        }

        const result = await response.json();

        if (!result.success) {
          throw new Error(
            result.message || "Failed to load dashboard."
          );
        }

        setData(result);
      } catch (err) {
        console.error(err);

        setError(
          err instanceof Error
            ? err.message
            : "Unable to load dashboard."
        );
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, []);

  const topCustomers = useMemo(() => {
    return data?.revenueByCustomer?.slice(0, 8) ?? [];
  }, [data]);

  const topProducts = useMemo(() => {
    return data?.revenueByProduct?.slice(0, 8) ?? [];
  }, [data]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white p-8">
        <div className="flex min-h-[500px] items-center justify-center">
          <div className="text-center">
            <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600" />

            <p className="text-sm font-medium text-gray-600">
              Loading dashboard...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-white p-8">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
          <h2 className="text-lg font-bold text-red-800">
            Dashboard Error
          </h2>

          <p className="mt-2 text-sm text-red-700">
            {error || "Unable to load dashboard data."}
          </p>

          <button
            onClick={() => window.location.reload()}
            className="mt-4 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const {
    summary,
    invoiceStatuses,
    paymentStatuses,
    transactionTypes,
    monthlyTrend,
    actionRequired,
    recentTransactions,
    revenueByDistributor,
  } = data;

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_right,_rgba(245,158,11,0.09),_transparent_30%),linear-gradient(180deg,_#fbfaf7_0%,_#f7f5ef_100%)]">
      <div className="mx-auto max-w-[1680px] space-y-7 px-5 py-6 sm:px-6 lg:px-8 lg:py-8">

        {/* Dashboard Header */}
        <section className="relative overflow-hidden rounded-[1.6rem] border border-amber-100/80 bg-white px-6 py-7 shadow-[0_12px_35px_rgba(15,23,42,0.06)] sm:px-8 lg:px-9">
          <div className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-amber-100/70 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-28 right-28 h-52 w-52 rounded-full bg-orange-100/60 blur-3xl" />

          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-[0.2em] text-amber-600">
                <span className="h-2 w-2 rounded-full bg-amber-500 shadow-sm shadow-amber-500/40" />
                CSP Management
                <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[10px] tracking-[0.12em] text-amber-700">
                  LIVE
                </span>
              </div>

              <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
                Dashboard Overview
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500 sm:text-[15px]">
                A live snapshot of revenue, profitability, invoice progress,
                payments and CSP transaction activity.
              </p>
            </div>

            <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white/85 px-4 py-3 shadow-sm ring-1 ring-white/60">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600 ring-1 ring-amber-100">
                <QuantityIcon />
              </div>
              <div>
                <p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-slate-400">
                  Total Quantity
                </p>
                <p className="mt-0.5 text-xl font-black tracking-tight text-slate-950">
                  {formatNumber(summary.totalQuantity)}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Compact KPI Summary */}
        <section className="zeit-metric-strip">
          <div className="zeit-metric-grid">
            <MetricTile
              label="Total Revenue"
              value={formatCompactCurrency(summary.totalRevenue)}
              hint="Across all transactions"
              icon={<RupeeIcon />}
              tone="blue"
            />
            <MetricTile
              label="Total P/L"
              value={formatCompactCurrency(summary.totalProfit)}
              hint="Overall gross profit"
              icon={<ProfitIcon />}
              tone="green"
            />
            <MetricTile
              label="Overall Margin"
              value={`${summary.overallMargin.toFixed(2)}%`}
              hint="Calculated from Buy Price"
              icon={<MarginIcon />}
              tone="violet"
            />
            <MetricTile
              label="Transactions"
              value={formatNumber(summary.totalTransactions)}
              hint={`${summary.actionRequiredCount} require action`}
              icon={<TransactionsIcon />}
              tone="amber"
            />
          </div>
        </section>

        {/* Financial Trend + Invoice Status */}
        <section className="grid grid-cols-1 gap-6 xl:grid-cols-3">

          {/* Monthly Trend */}
          <div className="overflow-hidden rounded-[1.4rem] border border-slate-200/80 bg-white p-6 shadow-[0_8px_28px_rgba(15,23,42,0.05)] xl:col-span-2">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-extrabold tracking-tight text-slate-950">
                  Revenue & P/L Trend
                </h2>

                <p className="mt-1 text-sm leading-5 text-slate-500">
                  Monthly financial performance
                </p>
              </div>
            </div>

            <div className="h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyTrend}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                  />

                  <XAxis
                    dataKey="month"
                    tick={{ fontSize: 12 }}
                  />

                  <YAxis
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value) =>
                      `₹${(value / 100000).toFixed(1)}L`
                    }
                  />

                  <Tooltip
                    formatter={(value, name) => [
                      formatCurrency(Number(value)),
                      name === "revenue"
                        ? "Revenue"
                        : "P/L",
                    ]}
                  />

                  <Legend />

                  <Bar
                    dataKey="revenue"
                    name="Revenue"
                    fill="#2563eb"
                    radius={[5, 5, 0, 0]}
                  />

                  <Bar
                    dataKey="profit"
                    name="P/L"
                    fill="#16a34a"
                    radius={[5, 5, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Invoice Status */}
          <div className="overflow-hidden rounded-[1.4rem] border border-slate-200/80 bg-white p-6 shadow-[0_8px_28px_rgba(15,23,42,0.05)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_14px_35px_rgba(15,23,42,0.07)]">
            <div className="mb-4">
              <h2 className="text-lg font-extrabold tracking-tight text-slate-950">
                Invoice Status
              </h2>

              <p className="mt-1 text-sm leading-5 text-slate-500">
                Current invoice position
              </p>
            </div>

            <div className="h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={invoiceStatuses}
                    dataKey="count"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={3}
                  >
                    {invoiceStatuses.map((_, index) => (
                      <Cell
                        key={`invoice-${index}`}
                        fill={
                          chartColors[
                            index % chartColors.length
                          ]
                        }
                      />
                    ))}
                  </Pie>

                  <Tooltip
                    formatter={(value) => [
                      `${value} transactions`,
                      "Count",
                    ]}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="space-y-3">
              {invoiceStatuses.map((item, index) => (
                <div
                  key={item.name}
                  className="flex items-center justify-between"
                >
                  <div className="flex min-w-0 items-center gap-2">
                    <span
                      className="h-2.5 w-2.5 shrink-0 rounded-full ring-4 ring-slate-50"
                      style={{
                        backgroundColor:
                          chartColors[
                            index % chartColors.length
                          ],
                      }}
                    />

                    <span className="truncate text-sm text-gray-700">
                      {item.name}
                    </span>
                  </div>

                  <span className="ml-3 text-sm font-bold text-gray-900">
                    {item.count}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Action Required */}
        <section className="overflow-hidden rounded-[1.4rem] border border-slate-200/80 bg-white shadow-[0_8px_28px_rgba(15,23,42,0.05)]">
          <div className="flex flex-col gap-3 border-b border-gray-200 p-6 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-lg font-extrabold tracking-tight text-slate-950">
                Action Required
              </h2>

              <p className="mt-1 text-sm leading-5 text-slate-500">
                Transactions requiring invoice or payment follow-up.
              </p>
            </div>

            <div className="rounded-full bg-orange-50 px-4 py-2 text-sm font-bold text-orange-700 ring-1 ring-orange-100">
              {summary.actionRequiredCount} Pending
            </div>
          </div>

          {actionRequired.length === 0 ? (
            <div className="p-10 text-center">
              <p className="font-semibold text-green-700">
                All transactions are up to date.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1000px]">
                <thead className="bg-slate-50/90">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wide text-gray-500">
                      Customer
                    </th>

                    <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wide text-gray-500">
                      Product
                    </th>

                    <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wide text-gray-500">
                      Date
                    </th>

                    <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wide text-gray-500">
                      Revenue
                    </th>

                    <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wide text-gray-500">
                      Invoice
                    </th>

                    <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wide text-gray-500">
                      Payment
                    </th>

                    <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wide text-gray-500">
                      Action
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {actionRequired.slice(0, 8).map((item) => (
                    <tr
                      key={item.id}
                      className="transition-all duration-150 hover:bg-amber-50/55"
                    >
                      <td className="px-6 py-4">
                        <p className="max-w-[220px] truncate text-sm font-semibold text-gray-900">
                          {item.customer}
                        </p>
                      </td>

                      <td className="px-6 py-4">
                        <p className="max-w-[260px] truncate text-sm text-gray-700">
                          {item.product}
                        </p>
                      </td>

                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-600">
                        {formatDate(item.date)}
                      </td>

                      <td className="whitespace-nowrap px-6 py-4 text-sm font-semibold text-gray-900">
                        {formatCurrency(item.revenue)}
                      </td>

                      <td className="px-6 py-4">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${statusBadge(
                            item.invoiceStatus
                          )}`}
                        >
                          {item.invoiceStatus || "Not Set"}
                        </span>
                      </td>

                      <td className="px-6 py-4">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${statusBadge(
                            item.paymentStatus
                          )}`}
                        >
                          {item.paymentStatus || "Not Set"}
                        </span>
                      </td>

                      <td className="px-6 py-4">
                        <a
                          href="/tracker"
                          className="text-sm font-semibold text-amber-700 hover:text-amber-900"
                        >
                          View
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Customer + Product */}
        <section className="grid grid-cols-1 gap-6 xl:grid-cols-2">

          {/* Customers */}
          <div className="overflow-hidden rounded-[1.4rem] border border-slate-200/80 bg-white p-6 shadow-[0_8px_28px_rgba(15,23,42,0.05)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_14px_35px_rgba(15,23,42,0.07)]">
            <div className="mb-5">
              <h2 className="text-lg font-extrabold tracking-tight text-slate-950">
                Top Customers by Revenue
              </h2>

              <p className="mt-1 text-sm leading-5 text-slate-500">
                Highest-value customer accounts
              </p>
            </div>

            <div className="h-[360px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={topCustomers}
                  layout="vertical"
                  margin={{
                    left: 20,
                    right: 20,
                  }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    horizontal={false}
                  />

                  <XAxis
                    type="number"
                    tick={{ fontSize: 11 }}
                    tickFormatter={(value) =>
                      `₹${(value / 100000).toFixed(1)}L`
                    }
                  />

                  <YAxis
                    type="category"
                    dataKey="name"
                    width={150}
                    tick={{ fontSize: 11 }}
                  />

                  <Tooltip
                    formatter={(value) => [
                      formatCurrency(Number(value)),
                      "Revenue",
                    ]}
                  />

                  <Bar
                    dataKey="revenue"
                    fill="#2563eb"
                    radius={[0, 5, 5, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Products */}
          <div className="overflow-hidden rounded-[1.4rem] border border-slate-200/80 bg-white p-6 shadow-[0_8px_28px_rgba(15,23,42,0.05)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_14px_35px_rgba(15,23,42,0.07)]">
            <div className="mb-5">
              <h2 className="text-lg font-extrabold tracking-tight text-slate-950">
                Top Products by Revenue
              </h2>

              <p className="mt-1 text-sm leading-5 text-slate-500">
                Highest-value licenses and services
              </p>
            </div>

            <div className="space-y-4">
              {topProducts.map((item, index) => {
                const maxRevenue =
                  topProducts[0]?.revenue || 1;

                const percentage =
                  (item.revenue / maxRevenue) * 100;

                return (
                  <div key={item.name}>
                    <div className="mb-1 flex items-center justify-between gap-3">
                      <p className="max-w-[70%] truncate text-sm font-medium text-gray-800">
                        {index + 1}. {item.name}
                      </p>

                      <p className="whitespace-nowrap text-sm font-bold text-gray-900">
                        {formatCurrency(item.revenue)}
                      </p>
                    </div>

                    <div className="h-2.5 overflow-hidden rounded-full bg-slate-100 ring-1 ring-slate-200/60">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-blue-600 to-cyan-500 shadow-[0_0_10px_rgba(37,99,235,0.22)]"
                        style={{
                          width: `${percentage}%`,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Distributor + Transaction Type */}
        <section className="grid grid-cols-1 gap-6 xl:grid-cols-2">

          {/* Distributor */}
          <div className="overflow-hidden rounded-[1.4rem] border border-slate-200/80 bg-white p-6 shadow-[0_8px_28px_rgba(15,23,42,0.05)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_14px_35px_rgba(15,23,42,0.07)]">
            <div className="mb-5">
              <h2 className="text-lg font-extrabold tracking-tight text-slate-950">
                Distributor Performance
              </h2>

              <p className="mt-1 text-sm leading-5 text-slate-500">
                Revenue and transaction distribution
              </p>
            </div>

            <div className="space-y-4">
              {revenueByDistributor.map((item) => (
                <div
                  key={item.name}
                  className="rounded-2xl border border-slate-200/80 bg-slate-50/70 p-4 transition-all duration-150 hover:border-amber-100 hover:bg-amber-50/45"
                >
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-gray-900">
                      {item.name}
                    </p>

                    <p className="font-bold text-blue-600">
                      {formatCurrency(item.revenue)}
                    </p>
                  </div>

                  <div className="mt-2 flex gap-5 text-xs text-gray-500">
                    <span>
                      Transactions:{" "}
                      <strong className="text-gray-800">
                        {item.transactions}
                      </strong>
                    </span>

                    <span>
                      Quantity:{" "}
                      <strong className="text-gray-800">
                        {item.quantity}
                      </strong>
                    </span>

                    <span>
                      P/L:{" "}
                      <strong className="text-green-700">
                        {formatCurrency(item.profit)}
                      </strong>
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Transaction Type */}
          <div className="overflow-hidden rounded-[1.4rem] border border-slate-200/80 bg-white p-6 shadow-[0_8px_28px_rgba(15,23,42,0.05)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_14px_35px_rgba(15,23,42,0.07)]">
            <div className="mb-5">
              <h2 className="text-lg font-extrabold tracking-tight text-slate-950">
                Transaction Type
              </h2>

              <p className="mt-1 text-sm leading-5 text-slate-500">
                Net New, Renewal, Prorate and other transactions
              </p>
            </div>

            <div className="space-y-3">
              {transactionTypes.map((item) => (
                <div
                  key={item.name}
                  className="flex items-center justify-between rounded-2xl border border-slate-200/80 p-4 transition-colors duration-150 hover:bg-slate-50"
                >
                  <div>
                    <p className="font-semibold text-gray-900">
                      {item.name}
                    </p>

                    <p className="mt-1 text-xs text-gray-500">
                      {item.count} transactions
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="font-bold text-gray-900">
                      {formatCurrency(item.revenue)}
                    </p>

                    <p className="mt-1 text-xs font-medium text-green-600">
                      P/L {formatCurrency(item.profit)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Payment Status + Recent Transactions */}
        <section className="grid grid-cols-1 gap-6 xl:grid-cols-3">

          {/* Payment */}
          <div className="overflow-hidden rounded-[1.4rem] border border-slate-200/80 bg-white p-6 shadow-[0_8px_28px_rgba(15,23,42,0.05)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_14px_35px_rgba(15,23,42,0.07)]">
            <div className="mb-5">
              <h2 className="text-lg font-extrabold tracking-tight text-slate-950">
                Payment Status
              </h2>

              <p className="mt-1 text-sm leading-5 text-slate-500">
                Payment collection overview
              </p>
            </div>

            <div className="space-y-4">
              {paymentStatuses.map((item) => (
                <div
                  key={item.name}
                  className="flex items-center justify-between border-b border-gray-100 pb-4 last:border-0"
                >
                  <div>
                    <p className="text-sm font-semibold text-gray-800">
                      {item.name}
                    </p>

                    <p className="mt-1 text-xs text-gray-500">
                      {item.count} transactions
                    </p>
                  </div>

                  <p className="text-sm font-bold text-gray-900">
                    {formatCurrency(item.revenue)}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Transactions */}
          <div className="overflow-hidden rounded-[1.4rem] border border-slate-200/80 bg-white shadow-[0_8px_28px_rgba(15,23,42,0.05)] xl:col-span-2">
            <div className="flex items-center justify-between border-b border-gray-200 p-6">
              <div>
                <h2 className="text-lg font-extrabold tracking-tight text-slate-950">
                  Recent Transactions
                </h2>

                <p className="mt-1 text-sm leading-5 text-slate-500">
                  Latest entries in the CSP tracker
                </p>
              </div>

              <a
                href="/tracker"
                className="text-sm font-semibold text-amber-700 hover:text-amber-900"
              >
                View All →
              </a>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[800px]">
                <thead className="bg-slate-50/90">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wide text-gray-500">
                      Customer
                    </th>

                    <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wide text-gray-500">
                      Product
                    </th>

                    <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wide text-gray-500">
                      Type
                    </th>

                    <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wide text-gray-500">
                      Revenue
                    </th>

                    <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wide text-gray-500">
                      Invoice
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {recentTransactions.slice(0, 8).map((item) => (
                    <tr
                      key={item.id}
                      className="transition-all duration-150 hover:bg-amber-50/55"
                    >
                      <td className="px-6 py-4">
                        <p className="max-w-[180px] truncate text-sm font-semibold text-gray-900">
                          {item.customer}
                        </p>

                        <p className="mt-1 text-xs text-gray-500">
                          {formatDate(item.date)}
                        </p>
                      </td>

                      <td className="px-6 py-4">
                        <p className="max-w-[220px] truncate text-sm text-gray-700">
                          {item.product}
                        </p>
                      </td>

                      <td className="px-6 py-4 text-sm text-gray-600">
                        {item.transactionType || "Not Set"}
                      </td>

                      <td className="px-6 py-4 text-sm font-bold text-gray-900">
                        {formatCurrency(item.revenue)}
                      </td>

                      <td className="px-6 py-4">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${statusBadge(
                            item.invoiceStatus
                          )}`}
                        >
                          {item.invoiceStatus || "Not Set"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* Footer */}
        <div className="flex flex-col gap-1 border-t border-slate-200/80 pt-5 pb-2 text-center text-xs text-slate-400 sm:flex-row sm:items-center sm:justify-between sm:text-left">
          <span>ZEIT CSP Tracker</span>
          <span>Data powered by PostgreSQL • CSP transaction calculations</span>
        </div>
      </div>
    </div>
  );
}

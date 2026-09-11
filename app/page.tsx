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
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-[1600px] space-y-6 p-6 lg:p-8">

        {/* Dashboard Header */}
        <section className="flex flex-col gap-5 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-blue-600">
              <span className="h-2 w-2 rounded-full bg-blue-600" />
              CSP Management
            </div>

            <h1 className="mt-2 text-2xl font-bold tracking-tight text-gray-950 sm:text-3xl">
              Dashboard Overview
            </h1>

            <p className="mt-1 max-w-2xl text-sm text-gray-500">
              Monitor revenue, profitability, invoices, payments and CSP transaction activity.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
              <p className="text-[11px] font-bold uppercase tracking-wide text-gray-400">
                Total Quantity
              </p>
              <p className="mt-1 text-xl font-bold text-gray-900">
                {formatNumber(summary.totalQuantity)}
              </p>
            </div>
          </div>
        </section>

        {/* KPI Cards */}
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">

          {/* Revenue */}
          <div className="group rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">
                  Total Revenue
                </p>

                <p className="mt-2 text-3xl font-bold tracking-tight text-gray-950">
                  {formatCurrency(summary.totalRevenue)}
                </p>

                <p className="mt-2 text-xs text-gray-500">
                  Based on all transactions
                </p>
              </div>

              <div className="rounded-xl bg-blue-50 px-3 py-2 text-xl ring-1 ring-blue-100">
                ₹
              </div>
            </div>
          </div>

          {/* Profit */}
          <div className="group rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">
                  Total P/L
                </p>

                <p className="mt-2 text-3xl font-bold tracking-tight text-gray-950">
                  {formatCurrency(summary.totalProfit)}
                </p>

                <p className="mt-2 text-xs text-green-600">
                  Overall gross profit
                </p>
              </div>

              <div className="rounded-xl bg-green-50 px-3 py-2 text-xl ring-1 ring-green-100">
                ↗
              </div>
            </div>
          </div>

          {/* Margin */}
          <div className="group rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">
                  Overall Margin
                </p>

                <p className="mt-2 text-3xl font-bold tracking-tight text-gray-950">
                  {summary.overallMargin.toFixed(2)}%
                </p>

                <p className="mt-2 text-xs text-gray-500">
                  Calculated from Buy Price
                </p>
              </div>

              <div className="rounded-xl bg-purple-50 px-3 py-2 text-xl ring-1 ring-purple-100">
                %
              </div>
            </div>
          </div>

          {/* Transactions */}
          <div className="group rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">
                  Transactions
                </p>

                <p className="mt-2 text-3xl font-bold tracking-tight text-gray-950">
                  {formatNumber(summary.totalTransactions)}
                </p>

                <p className="mt-2 text-xs text-orange-600">
                  {summary.actionRequiredCount} require action
                </p>
              </div>

              <div className="rounded-xl bg-orange-50 px-3 py-2 text-xl ring-1 ring-orange-100">
                #
              </div>
            </div>
          </div>
        </section>

        {/* Financial Trend + Invoice Status */}
        <section className="grid grid-cols-1 gap-6 xl:grid-cols-3">

          {/* Monthly Trend */}
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm xl:col-span-2">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold tracking-tight text-gray-950">
                  Revenue & P/L Trend
                </h2>

                <p className="mt-1 text-sm text-gray-500">
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
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition hover:shadow-md">
            <div className="mb-4">
              <h2 className="text-lg font-bold tracking-tight text-gray-950">
                Invoice Status
              </h2>

              <p className="mt-1 text-sm text-gray-500">
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
                      className="h-3 w-3 shrink-0 rounded-full"
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
        <section className="rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="flex flex-col gap-3 border-b border-gray-200 p-6 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-lg font-bold tracking-tight text-gray-950">
                Action Required
              </h2>

              <p className="mt-1 text-sm text-gray-500">
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
                <thead className="bg-gray-50/80">
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

                <tbody className="divide-y divide-gray-100">
                  {actionRequired.slice(0, 8).map((item) => (
                    <tr
                      key={item.id}
                      className="transition hover:bg-blue-50/40"
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
                          className="text-sm font-semibold text-blue-600 hover:text-blue-800"
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
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition hover:shadow-md">
            <div className="mb-5">
              <h2 className="text-lg font-bold tracking-tight text-gray-950">
                Top Customers by Revenue
              </h2>

              <p className="mt-1 text-sm text-gray-500">
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
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition hover:shadow-md">
            <div className="mb-5">
              <h2 className="text-lg font-bold tracking-tight text-gray-950">
                Top Products by Revenue
              </h2>

              <p className="mt-1 text-sm text-gray-500">
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

                    <div className="h-2 overflow-hidden rounded-full bg-gray-100">
                      <div
                        className="h-full rounded-full bg-blue-600"
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
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition hover:shadow-md">
            <div className="mb-5">
              <h2 className="text-lg font-bold tracking-tight text-gray-950">
                Distributor Performance
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Revenue and transaction distribution
              </p>
            </div>

            <div className="space-y-4">
              {revenueByDistributor.map((item) => (
                <div
                  key={item.name}
                  className="rounded-xl border border-gray-100 bg-gray-50 p-4"
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
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition hover:shadow-md">
            <div className="mb-5">
              <h2 className="text-lg font-bold tracking-tight text-gray-950">
                Transaction Type
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Net New, Renewal, Prorate and other transactions
              </p>
            </div>

            <div className="space-y-3">
              {transactionTypes.map((item) => (
                <div
                  key={item.name}
                  className="flex items-center justify-between rounded-xl border border-gray-100 p-4"
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
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition hover:shadow-md">
            <div className="mb-5">
              <h2 className="text-lg font-bold tracking-tight text-gray-950">
                Payment Status
              </h2>

              <p className="mt-1 text-sm text-gray-500">
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
          <div className="rounded-2xl border border-gray-200 bg-white shadow-sm xl:col-span-2">
            <div className="flex items-center justify-between border-b border-gray-200 p-6">
              <div>
                <h2 className="text-lg font-bold tracking-tight text-gray-950">
                  Recent Transactions
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  Latest entries in the CSP tracker
                </p>
              </div>

              <a
                href="/tracker"
                className="text-sm font-semibold text-blue-600 hover:text-blue-800"
              >
                View All →
              </a>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[800px]">
                <thead className="bg-gray-50/80">
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

                <tbody className="divide-y divide-gray-100">
                  {recentTransactions.slice(0, 8).map((item) => (
                    <tr
                      key={item.id}
                      className="transition hover:bg-blue-50/40"
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
        <div className="flex flex-col gap-1 border-t border-gray-200 pt-5 pb-2 text-center text-xs text-gray-400 sm:flex-row sm:items-center sm:justify-between sm:text-left">
          <span>ZEIT CSP Tracker</span>
          <span>Data powered by PostgreSQL • CSP transaction calculations</span>
        </div>
      </div>
    </div>
  );
}

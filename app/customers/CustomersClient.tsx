"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

type Distributor = {
  id: number;
  name: string;
  transactionCount: number;
  totalRevenue: number;
  totalProfit: number;
  createdAt: string;
  updatedAt: string;
};

export default function DistributorsPage() {
  const [distributors, setDistributors] = useState<Distributor[]>([]);
  const [search, setSearch] = useState("");
  const [newDistributor, setNewDistributor] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  async function loadDistributors() {
    try {
      setLoading(true);

      const response = await fetch("/api/distributors", {
        cache: "no-store",
      });

      const data = await response.json();

      if (data.success) {
        setDistributors(data.distributors ?? []);
      } else {
        setMessage(data.message || "Failed to load distributors.");
      }
    } catch (error) {
      console.error(error);
      setMessage("Failed to load distributors.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDistributors();
  }, []);

  async function handleAddDistributor(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const name = newDistributor.trim();

    if (!name) {
      setMessage("Please enter a distributor name.");
      return;
    }

    try {
      setSaving(true);
      setMessage("");

      const response = await fetch("/api/distributors", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        setMessage(data.message || "Failed to add distributor.");
        return;
      }

      setNewDistributor("");
      setMessage("Distributor added successfully.");

      await loadDistributors();
    } catch (error) {
      console.error(error);
      setMessage("Failed to add distributor.");
    } finally {
      setSaving(false);
    }
  }

  const filteredDistributors = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    if (!keyword) return distributors;

    return distributors.filter((distributor) =>
      distributor.name.toLowerCase().includes(keyword)
    );
  }, [distributors, search]);

  const totalTransactions = distributors.reduce(
    (sum, distributor) => sum + distributor.transactionCount,
    0
  );

  const totalRevenue = distributors.reduce(
    (sum, distributor) => sum + distributor.totalRevenue,
    0
  );

  const totalProfit = distributors.reduce(
    (sum, distributor) => sum + distributor.totalProfit,
    0
  );

  function formatCurrency(value: number) {
    return `₹${value.toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
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
    if (!value) return "-";

    return new Date(value).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }

  return (
    <main className="min-h-screen bg-[#f8f7f3] text-slate-950">
      <div className="mx-auto max-w-[1600px] px-4 py-4 sm:px-6 lg:px-7">
        {/* Page Header */}
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-lg font-black tracking-tight text-slate-950">
              Distributors
            </h1>

            <p className="mt-0.5 text-[11px] font-medium text-slate-500">
              Manage distributor accounts and review linked CSP activity
            </p>
          </div>

          <form
            onSubmit={handleAddDistributor}
            className="flex w-full gap-2 sm:w-auto"
          >
            <input
              type="text"
              value={newDistributor}
              onChange={(event) => setNewDistributor(event.target.value)}
              placeholder="Distributor name"
              className="h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 outline-none shadow-sm transition placeholder:text-slate-400 focus:border-amber-400 focus:ring-2 focus:ring-amber-100 sm:w-60"
            />

            <button
              type="submit"
              disabled={saving}
              className="inline-flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-lg bg-[#f59e0b] px-3.5 text-xs font-extrabold text-white shadow-sm transition hover:bg-[#d97706] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <span className="text-base leading-none">+</span>
              {saving ? "Adding..." : "Add Distributor"}
            </button>
          </form>
        </div>

        {/* Message */}
        {message && (
          <div className="mb-4 flex items-center justify-between gap-3 rounded-lg border border-amber-200 bg-amber-50 px-3.5 py-2.5 text-xs font-semibold text-amber-800">
            <span>{message}</span>

            <button
              type="button"
              onClick={() => setMessage("")}
              className="rounded px-1.5 py-0.5 text-amber-700 transition hover:bg-amber-100"
              aria-label="Dismiss message"
            >
              ×
            </button>
          </div>
        )}

        {/* KPI Cards */}
        <section className="mb-4 grid grid-cols-2 gap-2.5 lg:grid-cols-4">
          <MetricTile
            label="Distributors"
            value={distributors.length.toLocaleString("en-IN")}
            hint="Master records"
            icon={<DistributorIcon />}
            tone="orange"
          />

          <MetricTile
            label="Transactions"
            value={totalTransactions.toLocaleString("en-IN")}
            hint="Linked records"
            icon={<TransactionsIcon />}
            tone="blue"
          />

          <MetricTile
            label="Revenue"
            value={formatCompactCurrency(totalRevenue)}
            hint="Transaction value"
            icon={<RevenueIcon />}
            tone="green"
          />

          <MetricTile
            label="P/L"
            value={formatCompactCurrency(totalProfit)}
            hint="Overall result"
            icon={<ProfitIcon />}
            tone={totalProfit >= 0 ? "green" : "red"}
          />
        </section>

        {/* Distributor Directory */}
        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          {/* Toolbar */}
          <div className="flex flex-col gap-2.5 border-b border-slate-100 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2.5">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-50 text-amber-600 ring-1 ring-amber-100">
                <DistributorIcon />
              </div>

              <div>
                <h2 className="text-xs font-black tracking-tight text-slate-950">
                  Distributor Directory
                </h2>

                <p className="text-[10px] font-medium text-slate-400">
                  {filteredDistributors.length} of {distributors.length} shown
                </p>
              </div>
            </div>

            <div className="relative w-full sm:w-72">
              <SearchIcon />

              <input
                type="text"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search distributor..."
                className="h-8 w-full rounded-lg border border-slate-200 bg-slate-50 pl-8 pr-3 text-xs font-medium text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-amber-400 focus:bg-white focus:ring-2 focus:ring-amber-100"
              />
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="min-w-[900px] w-full text-left">
              <thead className="border-b border-slate-100 bg-slate-50/80">
                <tr>
                  <th className="w-12 px-4 py-2.5 text-center text-[9px] font-extrabold uppercase tracking-[0.08em] text-slate-400">
                    #
                  </th>

                  <th className="px-4 py-2.5 text-[9px] font-extrabold uppercase tracking-[0.08em] text-slate-400">
                    Distributor
                  </th>

                  <th className="px-4 py-2.5 text-center text-[9px] font-extrabold uppercase tracking-[0.08em] text-slate-400">
                    Transactions
                  </th>

                  <th className="px-4 py-2.5 text-right text-[9px] font-extrabold uppercase tracking-[0.08em] text-slate-400">
                    Revenue
                  </th>

                  <th className="px-4 py-2.5 text-right text-[9px] font-extrabold uppercase tracking-[0.08em] text-slate-400">
                    P/L
                  </th>

                  <th className="px-4 py-2.5 text-center text-[9px] font-extrabold uppercase tracking-[0.08em] text-slate-400">
                    Created
                  </th>

                  <th className="px-4 py-2.5 text-center text-[9px] font-extrabold uppercase tracking-[0.08em] text-slate-400">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-16 text-center">
                      <div className="mx-auto h-5 w-5 animate-spin rounded-full border-2 border-slate-200 border-t-amber-500" />

                      <p className="mt-2 text-[11px] font-medium text-slate-500">
                        Loading distributors...
                      </p>
                    </td>
                  </tr>
                ) : filteredDistributors.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-16 text-center">
                      <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600 ring-1 ring-amber-100">
                        <DistributorIcon />
                      </div>

                      <p className="mt-2 text-sm font-bold text-slate-700">
                        No distributors found
                      </p>

                      <p className="mt-1 text-[11px] font-medium text-slate-400">
                        Try a different search term or add a new distributor.
                      </p>

                      {search && (
                        <button
                          type="button"
                          onClick={() => setSearch("")}
                          className="mt-3 text-[10px] font-bold text-blue-600 hover:text-blue-700"
                        >
                          Clear search
                        </button>
                      )}
                    </td>
                  </tr>
                ) : (
                  filteredDistributors.map((distributor, index) => (
                    <tr
                      key={distributor.id}
                      className="group transition-colors hover:bg-slate-50/70"
                    >
                      <td className="px-4 py-2.5 text-center text-[10px] font-bold text-slate-400">
                        {index + 1}
                      </td>

                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-2.5">
                          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-[10px] font-black text-slate-600 transition group-hover:bg-amber-50 group-hover:text-amber-600">
                            {getInitials(distributor.name)}
                          </div>

                          <div className="min-w-0">
                            <div className="truncate text-xs font-bold text-slate-900">
                              {distributor.name}
                            </div>

                            <div className="mt-0.5 text-[9px] font-medium text-slate-400">
                              ID: {distributor.id}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-2.5 text-center">
                        <span className="inline-flex min-w-7 items-center justify-center rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-extrabold text-blue-700 ring-1 ring-blue-100">
                          {distributor.transactionCount}
                        </span>
                      </td>

                      <td className="px-4 py-2.5 text-right text-xs font-bold text-blue-700">
                        {formatCurrency(distributor.totalRevenue)}
                      </td>

                      <td
                        className={`px-4 py-2.5 text-right text-xs font-bold ${
                          distributor.totalProfit >= 0
                            ? "text-emerald-600"
                            : "text-red-600"
                        }`}
                      >
                        {formatCurrency(distributor.totalProfit)}
                      </td>

                      <td className="px-4 py-2.5 text-center text-[10px] font-medium text-slate-500">
                        {formatDate(distributor.createdAt)}
                      </td>

                      <td className="px-4 py-2.5">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            title="View distributor transactions"
                            onClick={() => {
                              window.location.href = `/tracker?distributor=${encodeURIComponent(
                                distributor.name
                              )}`;
                            }}
                            className="inline-flex h-7 items-center justify-center gap-1 rounded-md border border-blue-100 bg-blue-50 px-2.5 text-[10px] font-extrabold text-blue-700 transition hover:bg-blue-100"
                          >
                            <EyeIcon />
                            View
                          </button>

                          <a
                            href={`/distributors/${distributor.id}/edit`}
                            title="Edit distributor"
                            className="inline-flex h-7 items-center justify-center gap-1 rounded-md border border-amber-100 bg-amber-50 px-2.5 text-[10px] font-extrabold text-amber-700 transition hover:bg-amber-100"
                          >
                            <EditIcon />
                            Edit
                          </a>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Footer */}
          {!loading && filteredDistributors.length > 0 && (
            <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/50 px-4 py-2">
              <p className="text-[9px] font-medium text-slate-400">
                Showing {filteredDistributors.length} distributor
                {filteredDistributors.length === 1 ? "" : "s"}
              </p>

              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="text-[10px] font-bold text-blue-600 hover:text-blue-700"
                >
                  Clear filter
                </button>
              )}
            </div>
          )}
        </section>
      </div>
    </main>
  );
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
  tone: "orange" | "blue" | "green" | "red";
}) {
  const toneClasses = {
    orange: "bg-amber-50 text-amber-600 ring-amber-100",
    blue: "bg-blue-50 text-blue-600 ring-blue-100",
    green: "bg-emerald-50 text-emerald-600 ring-emerald-100",
    red: "bg-red-50 text-red-600 ring-red-100",
  }[tone];

  return (
    <div className="flex min-w-0 items-center gap-2.5 rounded-xl border border-slate-200 bg-white px-3 py-3 shadow-sm">
      <div
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ring-1 ${toneClasses}`}
      >
        {icon}
      </div>

      <div className="min-w-0">
        <p className="truncate text-[9px] font-extrabold uppercase tracking-[0.08em] text-slate-400">
          {label}
        </p>

        <p className="mt-0.5 truncate text-base font-black tracking-tight text-slate-950 sm:text-lg">
          {value}
        </p>

        <p className="truncate text-[9px] font-medium text-slate-400">
          {hint}
        </p>
      </div>
    </div>
  );
}

function getInitials(value: string) {
  const parts = value.trim().split(/\s+/).filter(Boolean);

  if (parts.length === 0) return "D";

  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }

  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

function IconBase({ children }: { children: React.ReactNode }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

function DistributorIcon() {
  return (
    <IconBase>
      <rect x="4" y="4" width="16" height="16" rx="2" />
      <path d="M8 8h8M8 12h8M8 16h4" />
    </IconBase>
  );
}

function TransactionsIcon() {
  return (
    <IconBase>
      <rect x="4" y="4" width="16" height="16" rx="2" />
      <path d="M8 8h8M8 12h6M8 16h4" />
    </IconBase>
  );
}

function RevenueIcon() {
  return (
    <IconBase>
      <path d="M12 3v18" />
      <path d="M16.5 7.2c-.8-1.1-2.1-1.7-3.9-1.7-2.2 0-3.6 1.1-3.6 2.7 0 4.2 7.5 1.8 7.5 5.9 0 1.7-1.5 2.8-3.8 2.8-1.9 0-3.3-.6-4.2-1.8" />
    </IconBase>
  );
}

function ProfitIcon() {
  return (
    <IconBase>
      <path d="M4 19V5" />
      <path d="M4 19h16" />
      <path d="m7 15 4-4 3 2 5-6" />
      <path d="M16 7h3v3" />
    </IconBase>
  );
}

function SearchIcon() {
  return (
    <svg
      className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-4-4" />
    </svg>
  );
}

function EyeIcon() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z" />
      <circle cx="12" cy="12" r="2.5" />
    </svg>
  );
}

function EditIcon() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4Z" />
    </svg>
  );
}
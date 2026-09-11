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

type SessionUser = {
  id: number;
  name: string;
  email: string;
  role: string;
};

export default function DistributorsPage() {
  const [distributors, setDistributors] = useState<Distributor[]>([]);
  const [search, setSearch] = useState("");
  const [newDistributor, setNewDistributor] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const [user, setUser] = useState<SessionUser | null>(null);
  const [checkingRole, setCheckingRole] = useState(true);

  const canModifyDistributors =
    user?.role === "ADMIN" || user?.role === "FINANCE";

  async function loadUser() {
    try {
      const response = await fetch("/api/auth/me");

      if (!response.ok) {
        setUser(null);
        return;
      }

      const data = await response.json();

      if (data.success && data.user) {
        setUser(data.user);
      }
    } catch (error) {
      console.error("Unable to load user:", error);
      setUser(null);
    } finally {
      setCheckingRole(false);
    }
  }

  async function loadDistributors() {
    try {
      setLoading(true);

      const response = await fetch("/api/distributors");
      const data = await response.json();

      if (data.success) {
        setDistributors(data.distributors);
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
    loadUser();
    loadDistributors();
  }, []);

  async function handleAddDistributor(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (!canModifyDistributors) {
      setMessage("You do not have permission to add distributors.");
      return;
    }

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
        body: JSON.stringify({
          name,
        }),
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

    if (!keyword) {
      return distributors;
    }

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

  function formatDate(value: string) {
    if (!value) return "-";

    return new Date(value).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }

  if (checkingRole) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <div className="text-sm font-medium text-gray-500">
          Loading distributors...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/70 px-4 py-6 text-gray-950 sm:px-6 lg:px-8">
      {/* Page Header */}
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-blue-600">
            <span className="h-2 w-2 rounded-full bg-blue-600" />
            Distributor Management
          </div>

          <h1 className="mt-2 text-2xl font-bold tracking-tight text-gray-950 sm:text-3xl">
            Distributors
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Manage backend distributors and view their transaction
            performance.
          </p>
        </div>

        {canModifyDistributors && (
          <form
            onSubmit={handleAddDistributor}
            className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row"
          >
            <input
              type="text"
              value={newDistributor}
              onChange={(event) =>
                setNewDistributor(event.target.value)
              }
              placeholder="Distributor name"
              className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-50 sm:w-64"
            />

            <button
              type="submit"
              disabled={saving}
              className="whitespace-nowrap rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-blue-700 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? "Adding..." : "+ Add Distributor"}
            </button>
          </form>
        )}
      </div>

      {/* Message */}
      {message && (
        <div className="mb-6 flex items-start gap-3 rounded-2xl border border-blue-200 bg-blue-50 px-5 py-4 text-sm font-medium text-blue-700 shadow-sm">
          <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-100 font-bold">
            ✓
          </span>
          <span>
          {message}
          </span>
        </div>
      )}

      {/* Summary Cards */}
      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-gray-500">
              Total Distributors
            </p>
            <span className="rounded-lg bg-blue-50 text-blue-700 px-2.5 py-1.5 text-[11px] font-bold">
              DB
            </span>
          </div>

          <p className="mt-3 text-3xl font-bold tracking-tight text-gray-950">
            {distributors.length}
          </p>

          <p className="mt-1 text-xs text-gray-400">
            Active master records
          </p>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-gray-500">
              Total Transactions
            </p>
            <span className="rounded-lg bg-violet-50 text-violet-700 px-2.5 py-1.5 text-[11px] font-bold">
              #
            </span>
          </div>

          <p className="mt-3 text-3xl font-bold tracking-tight text-gray-950">
            {totalTransactions}
          </p>

          <p className="mt-1 text-xs text-gray-400">
            Transactions linked to distributors
          </p>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-gray-500">
              Total Revenue
            </p>
            <span className="rounded-lg bg-indigo-50 text-indigo-700 px-2.5 py-1.5 text-[11px] font-bold">
              ₹
            </span>
          </div>

          <p className="mt-3 text-3xl font-bold tracking-tight text-blue-700">
            {formatCurrency(totalRevenue)}
          </p>

          <p className="mt-1 text-xs text-gray-400">
            Based on transaction revenue
          </p>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-gray-500">
              Total P/L
            </p>
            <span className="rounded-lg bg-emerald-50 text-emerald-700 px-2.5 py-1.5 text-[11px] font-bold">
              ↗
            </span>
          </div>

          <p
            className={`mt-3 text-3xl font-bold tracking-tight ${
              totalProfit >= 0
                ? "text-emerald-600"
                : "text-red-600"
            }`}
          >
            {formatCurrency(totalProfit)}
          </p>

          <p className="mt-1 text-xs text-gray-400">
            Based on transaction P/L
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="mb-4 flex flex-col gap-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-bold tracking-tight text-gray-950">
            Distributor List
          </h2>

          <p className="mt-1 text-xs text-gray-500">
            {filteredDistributors.length} distributor
            {filteredDistributors.length === 1 ? "" : "s"} shown
          </p>
        </div>

        <input
          type="text"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search distributor..."
          className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-50 sm:w-72"
        />
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left">
            <thead className="border-b border-gray-200 bg-gray-50/95">
              <tr>
                <th className="px-5 py-4 text-[11px] font-bold uppercase tracking-[0.08em] text-gray-500">
                  #
                </th>

                <th className="px-5 py-4 text-[11px] font-bold uppercase tracking-[0.08em] text-gray-500">
                  Distributor
                </th>

                <th className="px-5 py-4 text-center text-[11px] font-bold uppercase tracking-[0.08em] text-gray-500">
                  Transactions
                </th>

                <th className="px-5 py-4 text-right text-[11px] font-bold uppercase tracking-[0.08em] text-gray-500">
                  Revenue
                </th>

                <th className="px-5 py-4 text-right text-[11px] font-bold uppercase tracking-[0.08em] text-gray-500">
                  P/L
                </th>

                <th className="px-5 py-4 text-center text-[11px] font-bold uppercase tracking-[0.08em] text-gray-500">
                  Created
                </th>

                <th className="px-5 py-4 text-center text-[11px] font-bold uppercase tracking-[0.08em] text-gray-500">
                  Action
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-5 py-14 text-center text-sm text-gray-500"
                  >
                    Loading distributors...
                  </td>
                </tr>
              ) : filteredDistributors.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-5 py-14 text-center text-sm text-gray-500"
                  >
                    No distributors found.
                  </td>
                </tr>
              ) : (
                filteredDistributors.map((distributor, index) => (
                  <tr
                    key={distributor.id}
                    className="group transition hover:bg-blue-50/40"
                  >
                    <td className="px-5 py-4 text-sm font-semibold text-gray-400">
                      {index + 1}
                    </td>

                    <td className="px-5 py-4">
                      <div className="font-semibold text-gray-950">
                        {distributor.name}
                      </div>

                      <div className="mt-1 text-xs text-gray-400">
                        ID: {distributor.id}
                      </div>
                    </td>

                    <td className="px-5 py-4 text-center">
                      <span className="inline-flex min-w-10 justify-center rounded-full bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-700 ring-1 ring-blue-100">
                        {distributor.transactionCount}
                      </span>
                    </td>

                    <td className="px-5 py-4 text-right text-sm font-bold text-blue-700">
                      {formatCurrency(distributor.totalRevenue)}
                    </td>

                    <td
                      className={`px-5 py-4 text-right text-sm font-semibold ${
                        distributor.totalProfit >= 0
                          ? "text-emerald-600"
                          : "text-red-600"
                      }`}
                    >
                      {formatCurrency(distributor.totalProfit)}
                    </td>

                    <td className="px-5 py-4 text-center text-sm text-gray-600">
                      {formatDate(distributor.createdAt)}
                    </td>

                    <td className="px-5 py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            window.location.href = `/tracker?distributor=${encodeURIComponent(
                              distributor.name
                            )}`;
                          }}
                          className="rounded-xl bg-blue-50 px-3.5 py-2 text-xs font-bold text-blue-700 ring-1 ring-blue-100 transition hover:bg-blue-100 hover:ring-blue-200"
                        >
                          View
                        </button>

                        {canModifyDistributors && (
                          <a
                            href={`/distributors/${distributor.id}/edit`}
                            className="rounded-xl bg-amber-50 px-3.5 py-2 text-xs font-bold text-amber-700 ring-1 ring-amber-100 transition hover:bg-amber-100 hover:ring-amber-200"
                          >
                            Edit
                          </a>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
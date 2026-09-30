"use client";

import { useEffect, useMemo, useState } from "react";

type Customer = {
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

export default function CustomersClient() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [newCustomer, setNewCustomer] = useState("");
  const [adding, setAdding] = useState(false);

  const [user, setUser] = useState<SessionUser | null>(null);
  const [checkingRole, setCheckingRole] = useState(true);

  const canModifyCustomers =
    user?.role === "ADMIN" ||
    user?.role === "FINANCE" ||
    user?.role === "SALES";

  useEffect(() => {
    async function loadUser() {
      try {
        const response = await fetch("/api/auth/me");

        if (!response.ok) {
          window.location.href = "/login";
          return;
        }

        const data = await response.json();

        if (!data.success || !data.user) {
          window.location.href = "/login";
          return;
        }

        setUser(data.user);
      } catch (error) {
        console.error("Unable to load user:", error);
        window.location.href = "/login";
      } finally {
        setCheckingRole(false);
      }
    }

    loadUser();
  }, []);

  async function loadCustomers() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/customers");

      if (!response.ok) {
        throw new Error("Failed to load customers.");
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || "Failed to load customers.");
      }

      setCustomers(data.customers ?? []);
    } catch (err) {
      console.error(err);
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load customers."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCustomers();
  }, []);

  async function handleAddCustomer() {
    if (!canModifyCustomers) {
      setError("You do not have permission to add customers.");
      return;
    }

    const name = newCustomer.trim();

    if (!name) {
      setError("Please enter a customer name.");
      return;
    }

    try {
      setAdding(true);
      setError("");

      const response = await fetch("/api/customers", {
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
        throw new Error(
          data.message || "Failed to create customer."
        );
      }

      setNewCustomer("");
      setShowAdd(false);

      await loadCustomers();
    } catch (err) {
      console.error(err);
      setError(
        err instanceof Error
          ? err.message
          : "Failed to create customer."
      );
    } finally {
      setAdding(false);
    }
  }

  const filteredCustomers = useMemo(() => {
    const term = search.trim().toLowerCase();

    if (!term) {
      return customers;
    }

    return customers.filter((customer) =>
      customer.name.toLowerCase().includes(term)
    );
  }, [customers, search]);

  const totalCustomers = customers.length;

  const totalTransactions = customers.reduce(
    (sum, customer) => sum + customer.transactionCount,
    0
  );

  const totalRevenue = customers.reduce(
    (sum, customer) => sum + customer.totalRevenue,
    0
  );

  const totalProfit = customers.reduce(
    (sum, customer) => sum + customer.totalProfit,
    0
  );

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

function StatTile({
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
  tone: "blue" | "violet" | "indigo" | "green" | "red";
}) {
  const toneClasses = {
    blue: "bg-blue-50 text-blue-600 ring-blue-100",
    violet: "bg-violet-50 text-violet-600 ring-violet-100",
    indigo: "bg-indigo-50 text-indigo-600 ring-indigo-100",
    green: "bg-emerald-50 text-emerald-600 ring-emerald-100",
    red: "bg-red-50 text-red-600 ring-red-100",
  }[tone];

  return (
    <div className="group flex min-h-[100px] items-center gap-3 px-4 py-4 sm:px-5">
      <div
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ring-1 transition-transform duration-200 group-hover:scale-105 ${toneClasses}`}
      >
        {icon}
      </div>

      <div className="min-w-0">
        <p className="text-[10px] font-extrabold uppercase tracking-[0.1em] text-slate-400">
          {label}
        </p>
        <p className="mt-1 truncate text-xl font-black tracking-tight text-slate-950 sm:text-2xl">
          {value}
        </p>
        <p className="mt-0.5 truncate text-[11px] font-medium text-slate-400">
          {hint}
        </p>
      </div>
    </div>
  );
}

function CustomersIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
      aria-hidden="true">
      <path d="M16 20a4 4 0 0 0-8 0" />
      <circle cx="12" cy="9" r="3" />
      <path d="M19 20a3.2 3.2 0 0 0-2.2-3" />
      <path d="M17 6.2a2.8 2.8 0 0 1 0 5.6" />
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

function RevenueIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
      aria-hidden="true">
      <path d="M12 3v18" />
      <path d="M16.5 7.2c-.8-1.1-2.1-1.7-3.9-1.7-2.2 0-3.6 1.1-3.6 2.7 0 4.2 7.5 1.8 7.5 5.9 0 1.7-1.5 2.8-3.8 2.8-1.9 0-3.3-.6-4.2-1.8" />
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
      <main className="min-h-screen bg-[#f8f7f3]">
        <div className="mx-auto max-w-[1500px] px-6 py-12">
          <div className="rounded-2xl border border-gray-200 bg-white p-12 text-center shadow-sm">
            <p className="text-sm text-gray-500">
              Loading...
            </p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f8f7f3]">
      <div className="mx-auto max-w-[1500px] px-5 py-5 sm:px-6 lg:px-8">

        {/* Page tools */}
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500">
              {totalCustomers} customer accounts
            </p>
          </div>

          {canModifyCustomers && (
            <button
              type="button"
              onClick={() => {
                setShowAdd(!showAdd);
                setError("");
              }}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#f59e0b] px-4 text-sm font-extrabold text-white shadow-[0_7px_18px_rgba(245,158,11,0.22)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#d97706] hover:shadow-[0_10px_22px_rgba(245,158,11,0.27)]"
            >
              <span className="text-base leading-none">+</span>
              Add Customer
            </button>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-medium text-red-700">
            {error}
          </div>
        )}

        {/* Add Customer */}
        {canModifyCustomers && showAdd && (
          <section className="mb-5 rounded-2xl border border-blue-100 bg-white p-5 shadow-[0_6px_22px_rgba(15,23,42,0.04)]">
            <div className="mb-4">
              <h2 className="text-base font-bold text-gray-900">
                Add New Customer
              </h2>

              <p className="mt-1 text-xs font-medium text-slate-500">
                Enter the customer company name.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <input
                type="text"
                value={newCustomer}
                onChange={(e) => setNewCustomer(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddCustomer();
                  }
                }}
                placeholder="Customer company name"
                className="zeit-input flex-1 text-sm"
              />

              <button
                type="button"
                disabled={adding}
                onClick={handleAddCustomer}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#f59e0b] px-4 text-sm font-extrabold text-white shadow-[0_7px_18px_rgba(245,158,11,0.18)] transition hover:bg-[#d97706] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {adding ? "Adding..." : "Add Customer"}
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowAdd(false);
                  setNewCustomer("");
                }}
                className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 shadow-sm transition hover:bg-[#fffaf0]"
              >
                Cancel
              </button>
            </div>
          </section>
        )}

        {/* Compact Summary */}
        <section className="mb-6 overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_7px_22px_rgba(15,23,42,0.045)]">
          <div className="grid grid-cols-2 divide-x divide-y divide-slate-200/80 lg:grid-cols-4 lg:divide-y-0">
            <StatTile
              label="Customers"
              value={totalCustomers.toLocaleString("en-IN")}
              hint="Registered"
              icon={<CustomersIcon />}
              tone="blue"
            />
            <StatTile
              label="Transactions"
              value={totalTransactions.toLocaleString("en-IN")}
              hint="CSP records"
              icon={<TransactionsIcon />}
              tone="violet"
            />
            <StatTile
              label="Revenue"
              value={formatCompactCurrency(totalRevenue)}
              hint="Across customers"
              icon={<RevenueIcon />}
              tone="indigo"
            />
            <StatTile
              label="P/L"
              value={formatCompactCurrency(totalProfit)}
              hint="Overall result"
              icon={<ProfitIcon />}
              tone={totalProfit >= 0 ? "green" : "red"}
            />
          </div>
        </section>

        {/* Customer List */}
        <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_8px_28px_rgba(15,23,42,0.05)]">

          {/* Toolbar */}
          <div className="flex flex-col gap-4 border-b border-slate-100 p-5 lg:flex-row lg:items-center lg:justify-between">

            <div>
              <h2 className="text-base font-extrabold tracking-tight text-slate-950">
                Customer List
              </h2>

              <p className="mt-1 text-xs font-medium text-slate-500">
                {filteredCustomers.length} customer
                {filteredCustomers.length === 1 ? "" : "s"} shown
              </p>
            </div>

            <div className="w-full lg:w-96">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search customer..."
                className="zeit-input text-sm"
              />
            </div>

          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            {loading ? (
              <div className="p-12 text-center">
                <p className="text-sm text-gray-500">
                  Loading customers...
                </p>
              </div>
            ) : filteredCustomers.length === 0 ? (
              <div className="p-12 text-center">
                <p className="text-base font-semibold text-gray-700">
                  No customers found
                </p>

                <p className="mt-1 text-xs font-medium text-slate-500">
                  Try changing your search or add a new customer.
                </p>
              </div>
            ) : (
              <table className="min-w-[1000px] w-full text-left">
                <thead className="bg-slate-50/90">
                  <tr>
                    <th className="px-5 py-3.5 text-[11px] font-extrabold uppercase tracking-[0.08em] text-slate-500">
                      #
                    </th>

                    <th className="px-5 py-3.5 text-[11px] font-extrabold uppercase tracking-[0.08em] text-slate-500">
                      Customer
                    </th>

                    <th className="px-5 py-4 text-right text-xs font-bold uppercase tracking-wide text-gray-500">
                      Transactions
                    </th>

                    <th className="px-5 py-4 text-right text-xs font-bold uppercase tracking-wide text-gray-500">
                      Revenue
                    </th>

                    <th className="px-5 py-4 text-right text-xs font-bold uppercase tracking-wide text-gray-500">
                      P/L
                    </th>

                    <th className="px-5 py-4 text-center text-xs font-bold uppercase tracking-wide text-gray-500">
                      Created
                    </th>

                    <th className="px-5 py-4 text-center text-xs font-bold uppercase tracking-wide text-gray-500">
                      Action
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {filteredCustomers.map((customer, index) => (
                    <tr
                      key={customer.id}
                      className="transition-all duration-150 hover:bg-amber-50/30"
                    >
                      <td className="px-5 py-3.5 text-xs font-bold text-slate-400">
                        {index + 1}
                      </td>

                      <td className="px-5 py-3.5">
                        <div className="font-bold text-slate-900">
                          {customer.name}
                        </div>

                        <div className="mt-1 text-[11px] text-slate-400">
                          Customer ID: {customer.id}
                        </div>
                      </td>

                      <td className="px-5 py-3.5 text-right text-sm font-semibold text-slate-700">
                        {customer.transactionCount}
                      </td>

                      <td className="px-5 py-3.5 text-right text-sm font-bold text-blue-700">
                        {formatCurrency(customer.totalRevenue)}
                      </td>

                      <td
                        className={`px-5 py-3.5 text-right text-sm font-bold ${
                          customer.totalProfit >= 0
                            ? "text-emerald-600"
                            : "text-red-600"
                        }`}
                      >
                        {formatCurrency(customer.totalProfit)}
                      </td>

                      <td className="px-5 py-3.5 text-center text-sm text-slate-600">
                        {formatDate(customer.createdAt)}
                      </td>

                      <td className="px-5 py-3.5 text-center">
                        <div className="flex items-center justify-center gap-2">

                          <button
                            type="button"
                            onClick={() => {
                              window.location.href = `/tracker?customer=${encodeURIComponent(
                                customer.name
                              )}`;
                            }}
                            className="inline-flex h-8 items-center rounded-lg bg-blue-50 px-3 text-xs font-extrabold text-blue-700 ring-1 ring-blue-100 transition hover:-translate-y-px hover:bg-blue-100"
                          >
                            View
                          </button>

                          {canModifyCustomers && (
                            <a
                              href={`/customers/${customer.id}/edit`}
                              className="inline-flex h-8 items-center rounded-lg bg-amber-50 px-3 text-xs font-extrabold text-amber-700 ring-1 ring-amber-100 transition hover:-translate-y-px hover:bg-amber-100"
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
            )}
          </div>
        </section>

      </div>
    </main>
  );
}
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
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(
    null
  );

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

  async function handleDeleteCustomer() {
    if (!canModifyCustomers) {
      setError("You do not have permission to delete customers.");
      setCustomerToDelete(null);
      return;
    }

    if (!customerToDelete) return;

    if (customerToDelete.transactionCount > 0) {
      setError(
        "This customer cannot be deleted because it has transaction history."
      );
      setCustomerToDelete(null);
      return;
    }

    try {
      setDeletingId(customerToDelete.id);
      setError("");

      const response = await fetch("/api/customers", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: customerToDelete.id,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to delete customer.");
      }

      setCustomerToDelete(null);
      await loadCustomers();
    } catch (err) {
      console.error(err);
      setError(
        err instanceof Error
          ? err.message
          : "Failed to delete customer."
      );
    } finally {
      setDeletingId(null);
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
      <main className="min-h-screen bg-gray-50/70">
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
    <main className="min-h-screen bg-gray-50/70">
      <div className="mx-auto max-w-[1500px] px-4 py-6 sm:px-6 lg:px-8">

        {/* Page Header */}
        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-blue-600">
              <span className="h-2 w-2 rounded-full bg-blue-600" />
              Customer Management
            </div>

            <h1 className="mt-2 text-2xl font-bold tracking-tight text-gray-950 sm:text-3xl">
              Customers
            </h1>

            <p className="mt-1 text-sm text-gray-500">
              Manage customers and view their CSP transaction summary
            </p>
          </div>

          {canModifyCustomers && (
            <button
              type="button"
              onClick={() => {
                setShowAdd(!showAdd);
                setError("");
              }}
              className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-blue-700 hover:shadow-md"
            >
              + Add Customer
            </button>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-medium text-red-700 shadow-sm">
              <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-red-100 font-bold">
                !
              </span>
              <span>
            {error}
              </span>
            </div>
        )}

        {/* Add Customer */}
        {canModifyCustomers && showAdd && (
          <section className="mb-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="mb-4">
              <h2 className="text-base font-bold tracking-tight text-gray-950">
                Add New Customer
              </h2>

              <p className="mt-1 text-sm text-gray-500">
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
                className="flex-1 rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm outline-none transition placeholder:text-gray-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
              />

              <button
                type="button"
                disabled={adding}
                onClick={handleAddCustomer}
                className="rounded-xl bg-gray-900 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-gray-800 hover:shadow disabled:cursor-not-allowed disabled:opacity-50"
              >
                {adding ? "Adding..." : "Add Customer"}
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowAdd(false);
                  setNewCustomer("");
                }}
                className="rounded-xl border border-gray-300 px-5 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </section>
        )}

        {/* Summary Cards */}
        <div className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">

          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-gray-500">
                Total Customers
              </p>
              <span className="rounded-lg bg-blue-50 text-blue-700 px-2.5 py-1.5 text-[11px] font-bold">
                Customers
              </span>
            </div>

            <p className="mt-3 text-3xl font-bold tracking-tight text-gray-950">
              {totalCustomers}
            </p>

            <p className="mt-1 text-xs text-gray-400">
              Registered customers
            </p>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-gray-500">
                Transactions
              </p>
              <span className="rounded-lg bg-violet-50 text-violet-700 px-2.5 py-1.5 text-[11px] font-bold">
                Transactions
              </span>
            </div>

            <p className="mt-3 text-3xl font-bold tracking-tight text-gray-950">
              {totalTransactions}
            </p>

            <p className="mt-1 text-xs text-gray-400">
              Total CSP transactions
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
              Across all customers
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
              Overall profit / loss
            </p>
          </div>

        </div>

        {/* Customer List */}
        <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">

          {/* Toolbar */}
          <div className="flex flex-col gap-4 border-b border-gray-100 bg-white p-6 lg:flex-row lg:items-center lg:justify-between">

            <div>
              <h2 className="text-lg font-bold tracking-tight text-gray-950">
                Customer List
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                {filteredCustomers.length} customer
                {filteredCustomers.length === 1 ? "" : "s"} shown
              </p>
            </div>

            <div className="w-full lg:w-80">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search customer..."
                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm outline-none transition placeholder:text-gray-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
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

                <p className="mt-1 text-sm text-gray-500">
                  Try changing your search or add a new customer.
                </p>
              </div>
            ) : (
              <table className="min-w-[1000px] w-full text-left">
                <thead className="bg-gray-50/95">
                  <tr>
                    <th className="px-5 py-4 text-[11px] font-bold uppercase tracking-[0.08em] text-gray-500">
                      #
                    </th>

                    <th className="px-5 py-4 text-[11px] font-bold uppercase tracking-[0.08em] text-gray-500">
                      Customer
                    </th>

                    <th className="px-5 py-4 text-right text-[11px] font-bold uppercase tracking-[0.08em] text-gray-500">
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
                  {filteredCustomers.map((customer, index) => (
                    <tr
                      key={customer.id}
                      className="transition hover:bg-blue-50/40"
                    >
                      <td className="px-5 py-4 text-sm font-semibold text-gray-400">
                        {index + 1}
                      </td>

                      <td className="px-5 py-4">
                        <div className="font-semibold text-gray-900">
                          {customer.name}
                        </div>

                        <div className="mt-1 text-xs text-gray-400">
                          Customer ID: {customer.id}
                        </div>
                      </td>

                      <td className="px-5 py-4 text-right text-sm font-semibold text-gray-700">
                        {customer.transactionCount}
                      </td>

                      <td className="px-5 py-4 text-right text-sm font-bold text-blue-700">
                        {formatCurrency(customer.totalRevenue)}
                      </td>

                      <td
                        className={`px-5 py-4 text-right text-sm font-semibold ${
                          customer.totalProfit >= 0
                            ? "text-emerald-600"
                            : "text-red-600"
                        }`}
                      >
                        {formatCurrency(customer.totalProfit)}
                      </td>

                      <td className="px-5 py-4 text-center text-sm font-medium text-gray-600">
                        {formatDate(customer.createdAt)}
                      </td>

                      <td className="px-5 py-4 text-center">
                        <div className="flex items-center justify-center gap-2">

                          <button
                            type="button"
                            onClick={() => {
                              window.location.href = `/tracker?customer=${encodeURIComponent(
                                customer.name
                              )}`;
                            }}
                            className="rounded-xl bg-blue-50 px-3.5 py-2 text-xs font-bold text-blue-700 ring-1 ring-blue-100 transition hover:bg-blue-100 hover:ring-blue-200"
                          >
                            View
                          </button>

                          {canModifyCustomers && (
                            <a
                              href={`/customers/${customer.id}/edit`}
                              className="rounded-xl bg-amber-50 px-3.5 py-2 text-xs font-bold text-amber-700 ring-1 ring-amber-100 transition hover:bg-amber-100 hover:ring-amber-200"
                            >
                              Edit
                            </a>
                          )}

                          {canModifyCustomers && (
                            <button
                              type="button"
                              disabled={deletingId === customer.id}
                              onClick={() => {
                                setError("");
                                setCustomerToDelete(customer);
                              }}
                              className="rounded-xl bg-red-50 px-3.5 py-2 text-xs font-bold text-red-700 ring-1 ring-red-100 transition hover:bg-red-100 hover:ring-red-200 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              Delete
                            </button>
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

        {/* Delete Confirmation */}
        {customerToDelete && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-gray-950/50 p-4 backdrop-blur-sm"
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-customer-title"
          >
            <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white shadow-2xl">
              <div className="p-6">
                <div className="flex items-start gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-red-50 text-lg text-red-600 ring-1 ring-red-100">
                    !
                  </div>

                  <div>
                    <h2
                      id="delete-customer-title"
                      className="text-lg font-bold tracking-tight text-gray-950"
                    >
                      Delete Customer?
                    </h2>
                    <p className="mt-1 text-sm leading-6 text-gray-500">
                      You are about to delete{" "}
                      <span className="font-semibold text-gray-900">
                        {customerToDelete.name}
                      </span>
                      .
                    </p>
                  </div>
                </div>

                {customerToDelete.transactionCount > 0 ? (
                  <div className="mt-5 rounded-xl border border-orange-200 bg-orange-50 px-4 py-3 text-sm text-orange-800">
                    <p className="font-semibold">
                      Deletion is not allowed.
                    </p>
                    <p className="mt-1">
                      This customer has{" "}
                      <span className="font-bold">
                        {customerToDelete.transactionCount} transaction
                        {customerToDelete.transactionCount === 1 ? "" : "s"}
                      </span>{" "}
                      and must be retained for historical records.
                    </p>
                  </div>
                ) : (
                  <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                    This customer has no transaction history. This action
                    cannot be undone.
                  </div>
                )}

                <div className="mt-6 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setCustomerToDelete(null)}
                    disabled={deletingId !== null}
                    className="rounded-xl border border-gray-300 px-5 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Cancel
                  </button>

                  {customerToDelete.transactionCount === 0 && (
                    <button
                      type="button"
                      onClick={handleDeleteCustomer}
                      disabled={deletingId === customerToDelete.id}
                      className="rounded-xl bg-red-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-red-700 hover:shadow disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {deletingId === customerToDelete.id
                        ? "Deleting..."
                        : "Delete Customer"}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </main>
  );
}
"use client";

import { FormEvent, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

type Customer = {
  id: number;
  name: string;
  transactionCount: number;
  totalRevenue: number;
  totalProfit: number;
};

export default function EditCustomerPage() {
  const router = useRouter();
  const params = useParams();

  const customerId = Array.isArray(params.id)
    ? params.id[0]
    : params.id;

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadCustomer() {
      try {
        setLoading(true);
        setError("");

        if (!customerId) {
          throw new Error("Customer ID is missing.");
        }

        const response = await fetch("/api/customers");

        if (!response.ok) {
          throw new Error("Failed to load customers.");
        }

        const data = await response.json();

        if (!data.success) {
          throw new Error(
            data.message || "Failed to load customers."
          );
        }

        const foundCustomer = (data.customers ?? []).find(
          (item: Customer) =>
            item.id === Number(customerId)
        );

        if (!foundCustomer) {
          throw new Error("Customer not found.");
        }

        setCustomer(foundCustomer);
        setName(foundCustomer.name);
      } catch (err) {
        console.error(err);

        setError(
          err instanceof Error
            ? err.message
            : "Unable to load customer."
        );
      } finally {
        setLoading(false);
      }
    }

    loadCustomer();
  }, [customerId]);

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    const trimmedName = name.trim();

    if (!trimmedName) {
      setError("Please enter the customer name.");
      return;
    }

    if (!customerId) {
      setError("Customer ID is missing.");
      return;
    }

    try {
      setSaving(true);
      setError("");

      const response = await fetch("/api/customers", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: Number(customerId),
          name: trimmedName,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Failed to update customer."
        );
      }

      router.push("/customers");
      router.refresh();
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : "Failed to update customer."
      );
    } finally {
      setSaving(false);
    }
  }

  function formatCurrency(value: number) {
    return `₹${value.toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50">
        <div className="mx-auto max-w-[1000px] px-6 py-10">
          <div className="rounded-2xl border border-gray-200 bg-white p-12 text-center shadow-sm">
            <p className="text-sm text-gray-500">
              Loading customer...
            </p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-[1000px] px-6 py-8">

        {/* Header */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Edit Customer
            </h1>

            <p className="mt-1 text-sm text-gray-500">
              Update customer information
            </p>
          </div>

          <button
            type="button"
            onClick={() => router.push("/customers")}
            className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
          >
            ← Back to Customers
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-medium text-red-700">
            {error}
          </div>
        )}

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="space-y-6"
        >
          <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">

            <div className="mb-6">
              <h2 className="text-lg font-bold text-gray-900">
                Customer Information
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Update the customer company name.
              </p>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-700">
                Customer Company Name *
              </label>

              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter customer company name"
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>
          </section>

          {/* Existing Summary */}
          {customer && (
            <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <div className="mb-5">
                <h2 className="text-lg font-bold text-gray-900">
                  Customer Summary
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  Existing transaction information
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-3">

                <div className="rounded-xl bg-gray-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Transactions
                  </p>

                  <p className="mt-2 text-xl font-bold text-gray-900">
                    {customer.transactionCount}
                  </p>
                </div>

                <div className="rounded-xl bg-gray-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Total Revenue
                  </p>

                  <p className="mt-2 text-xl font-bold text-blue-600">
                    {formatCurrency(customer.totalRevenue)}
                  </p>
                </div>

                <div className="rounded-xl bg-gray-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Total P/L
                  </p>

                  <p
                    className={`mt-2 text-xl font-bold ${
                      customer.totalProfit >= 0
                        ? "text-emerald-600"
                        : "text-red-600"
                    }`}
                  >
                    {formatCurrency(customer.totalProfit)}
                  </p>
                </div>

              </div>
            </section>
          )}

          {/* Actions */}
          <section className="flex items-center justify-end gap-3 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">

            <button
              type="button"
              onClick={() => router.push("/customers")}
              className="rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? "Saving..." : "Update Customer"}
            </button>

          </section>
        </form>
      </div>
    </main>
  );
}
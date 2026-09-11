"use client";

import { FormEvent, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

type Distributor = {
  id: number;
  name: string;
  transactionCount: number;
  totalRevenue: number;
  totalProfit: number;
  createdAt: string;
  updatedAt: string;
};

export default function EditDistributorPage() {
  const params = useParams();
  const router = useRouter();

  const distributorId = Number(params.id);

  const [distributor, setDistributor] = useState<Distributor | null>(null);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function loadDistributor() {
      try {
        setLoading(true);

        const response = await fetch("/api/distributors");
        const data = await response.json();

        if (!response.ok || !data.success) {
          setMessage(data.message || "Failed to load distributor.");
          return;
        }

        const found = data.distributors.find(
          (item: Distributor) => item.id === distributorId
        );

        if (!found) {
          setMessage("Distributor not found.");
          return;
        }

        setDistributor(found);
        setName(found.name);
      } catch (error) {
        console.error(error);
        setMessage("Failed to load distributor.");
      } finally {
        setLoading(false);
      }
    }

    if (distributorId) {
      loadDistributor();
    }
  }, [distributorId]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedName = name.trim();

    if (!trimmedName) {
      setMessage("Distributor name is required.");
      return;
    }

    try {
      setSaving(true);
      setMessage("");

      const response = await fetch("/api/distributors", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: distributorId,
          name: trimmedName,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        setMessage(data.message || "Failed to update distributor.");
        return;
      }

      router.push("/distributors");
      router.refresh();
    } catch (error) {
      console.error(error);
      setMessage("Failed to update distributor.");
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
      <div className="min-h-screen bg-white px-6 py-6">
        <div className="rounded-xl border border-gray-200 bg-white p-8 text-center text-sm text-gray-500 shadow-sm">
          Loading distributor...
        </div>
      </div>
    );
  }

  if (!distributor) {
    return (
      <div className="min-h-screen bg-white px-6 py-6">
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-sm font-medium text-red-700">
          {message || "Distributor not found."}
        </div>

        <button
          type="button"
          onClick={() => router.push("/distributors")}
          className="mt-4 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-blue-700"
        >
          Back to Distributors
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white px-6 py-6 text-gray-950">
      {/* Header */}
      <div className="mb-6">
        <button
          type="button"
          onClick={() => router.push("/distributors")}
          className="mb-3 text-sm font-semibold text-blue-600 hover:text-blue-700"
        >
          ← Back to Distributors
        </button>

        <h1 className="text-2xl font-bold tracking-tight text-gray-950">
          Edit Distributor
        </h1>

        <p className="mt-1 text-sm text-gray-500">
          Update the distributor master record.
        </p>
      </div>

      {/* Message */}
      {message && (
        <div className="mb-5 rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {message}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        {/* Edit Form */}
        <div className="xl:col-span-2">
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold text-gray-950">
              Distributor Details
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Change the distributor name below.
            </p>

            <form onSubmit={handleSubmit} className="mt-6">
              <label className="mb-2 block text-sm font-semibold text-gray-700">
                Distributor Name
              </label>

              <input
                type="text"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Enter distributor name"
                className="w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />

              <div className="mt-6 flex items-center gap-3">
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-lg bg-blue-600 px-6 py-3 text-sm font-bold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving ? "Updating..." : "Update Distributor"}
                </button>

                <button
                  type="button"
                  onClick={() => router.push("/distributors")}
                  className="rounded-lg border border-gray-200 bg-white px-6 py-3 text-sm font-bold text-gray-700 transition hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Existing Summary */}
        <div>
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold text-gray-950">
              Current Summary
            </h2>

            <div className="mt-5 space-y-4">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                  Distributor
                </p>

                <p className="mt-1 text-base font-bold text-gray-950">
                  {distributor.name}
                </p>
              </div>

              <div className="border-t border-gray-100 pt-4">
                <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                  Transactions
                </p>

                <p className="mt-1 text-xl font-bold text-blue-600">
                  {distributor.transactionCount}
                </p>
              </div>

              <div className="border-t border-gray-100 pt-4">
                <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                  Total Revenue
                </p>

                <p className="mt-1 text-xl font-bold text-gray-950">
                  {formatCurrency(distributor.totalRevenue)}
                </p>
              </div>

              <div className="border-t border-gray-100 pt-4">
                <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                  Total P/L
                </p>

                <p
                  className={`mt-1 text-xl font-bold ${
                    distributor.totalProfit >= 0
                      ? "text-emerald-600"
                      : "text-red-600"
                  }`}
                >
                  {formatCurrency(distributor.totalProfit)}
                </p>
              </div>

              <div className="border-t border-gray-100 pt-4">
                <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                  Distributor ID
                </p>

                <p className="mt-1 text-sm font-semibold text-gray-700">
                  {distributor.id}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
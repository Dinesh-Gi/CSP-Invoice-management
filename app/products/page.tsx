"use client";

import { useEffect, useMemo, useState } from "react";

type Product = {
  id: number;
  name: string;
  transactionCount: number;
  totalRevenue: number;
  totalProfit: number;
  createdAt: string;
  updatedAt: string;
};

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [newProduct, setNewProduct] = useState("");
  const [adding, setAdding] = useState(false);

  async function loadProducts() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/products");

      if (!response.ok) {
        throw new Error("Failed to load products.");
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(
          data.message || "Failed to load products."
        );
      }

      setProducts(data.products ?? []);
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : "Unable to load products."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProducts();
  }, []);

  async function handleAddProduct() {
    const name = newProduct.trim();

    if (!name) {
      setError("Please enter a product name.");
      return;
    }

    try {
      setAdding(true);
      setError("");

      const response = await fetch("/api/products", {
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
          data.message || "Failed to create product."
        );
      }

      setNewProduct("");
      setShowAdd(false);

      await loadProducts();
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : "Failed to create product."
      );
    } finally {
      setAdding(false);
    }
  }

  const filteredProducts = useMemo(() => {
    const term = search.trim().toLowerCase();

    if (!term) {
      return products;
    }

    return products.filter((product) =>
      product.name.toLowerCase().includes(term)
    );
  }, [products, search]);

  const totalProducts = products.length;

  const totalTransactions = products.reduce(
    (sum, product) => sum + product.transactionCount,
    0
  );

  const totalRevenue = products.reduce(
    (sum, product) => sum + product.totalRevenue,
    0
  );

  const totalProfit = products.reduce(
    (sum, product) => sum + product.totalProfit,
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

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-[1500px] px-6 py-6">

        {/* Page Header */}
        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Products
            </h1>

            <p className="mt-1 text-sm text-gray-500">
              Manage CSP license products and view transaction summaries
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              setShowAdd(!showAdd);
              setError("");
            }}
            className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
          >
            + Add Product
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-medium text-red-700">
            {error}
          </div>
        )}

        {/* Add Product */}
        {showAdd && (
          <section className="mb-6 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="mb-4">
              <h2 className="text-base font-bold text-gray-900">
                Add New Product
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Enter the license or product description.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <input
                type="text"
                value={newProduct}
                onChange={(e) => setNewProduct(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddProduct();
                  }
                }}
                placeholder="License / Product description"
                className="flex-1 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />

              <button
                type="button"
                disabled={adding}
                onClick={handleAddProduct}
                className="rounded-lg bg-gray-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {adding ? "Adding..." : "Add Product"}
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowAdd(false);
                  setNewProduct("");
                }}
                className="rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </section>
        )}

        {/* Summary Cards */}
        <div className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">

          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-gray-500">
              Total Products
            </p>

            <p className="mt-2 text-2xl font-bold text-gray-900">
              {totalProducts}
            </p>

            <p className="mt-1 text-xs text-gray-400">
              Registered license products
            </p>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-gray-500">
              Transactions
            </p>

            <p className="mt-2 text-2xl font-bold text-gray-900">
              {totalTransactions}
            </p>

            <p className="mt-1 text-xs text-gray-400">
              Total product transactions
            </p>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-gray-500">
              Total Revenue
            </p>

            <p className="mt-2 text-2xl font-bold text-blue-600">
              {formatCurrency(totalRevenue)}
            </p>

            <p className="mt-1 text-xs text-gray-400">
              Across all products
            </p>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-gray-500">
              Total P/L
            </p>

            <p
              className={`mt-2 text-2xl font-bold ${
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

        {/* Product List */}
        <section className="rounded-2xl border border-gray-200 bg-white shadow-sm">

          {/* Toolbar */}
          <div className="flex flex-col gap-4 border-b border-gray-100 p-5 lg:flex-row lg:items-center lg:justify-between">

            <div>
              <h2 className="text-lg font-bold text-gray-900">
                Product List
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                {filteredProducts.length} product
                {filteredProducts.length === 1 ? "" : "s"} shown
              </p>
            </div>

            <div className="w-full lg:w-80">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search product / license..."
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">

            {loading ? (
              <div className="p-12 text-center">
                <p className="text-sm text-gray-500">
                  Loading products...
                </p>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="p-12 text-center">
                <p className="text-base font-semibold text-gray-700">
                  No products found
                </p>

                <p className="mt-1 text-sm text-gray-500">
                  Try changing your search or add a new product.
                </p>
              </div>
            ) : (
              <table className="min-w-[1050px] w-full text-left">

                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-5 py-4 text-xs font-bold uppercase tracking-wide text-gray-500">
                      #
                    </th>

                    <th className="px-5 py-4 text-xs font-bold uppercase tracking-wide text-gray-500">
                      License / Product
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

                <tbody className="divide-y divide-gray-100">

                  {filteredProducts.map((product, index) => (
                    <tr
                      key={product.id}
                      className="transition hover:bg-blue-50/40"
                    >

                      <td className="px-5 py-4 text-sm font-medium text-gray-500">
                        {index + 1}
                      </td>

                      <td className="px-5 py-4">
                        <div className="max-w-[500px] font-semibold text-gray-900">
                          {product.name}
                        </div>

                        <div className="mt-1 text-xs text-gray-400">
                          Product ID: {product.id}
                        </div>
                      </td>

                      <td className="px-5 py-4 text-right text-sm font-semibold text-gray-700">
                        {product.transactionCount}
                      </td>

                      <td className="px-5 py-4 text-right text-sm font-semibold text-blue-700">
                        {formatCurrency(product.totalRevenue)}
                      </td>

                      <td
                        className={`px-5 py-4 text-right text-sm font-semibold ${
                          product.totalProfit >= 0
                            ? "text-emerald-600"
                            : "text-red-600"
                        }`}
                      >
                        {formatCurrency(product.totalProfit)}
                      </td>

                      <td className="px-5 py-4 text-center text-sm text-gray-600">
                        {formatDate(product.createdAt)}
                      </td>

                      <td className="px-5 py-4 text-center">
                        <div className="flex items-center justify-center gap-2">

                          <button
                            type="button"
                            onClick={() => {
                              window.location.href = `/tracker?product=${encodeURIComponent(
                                product.name
                              )}`;
                            }}
                            className="rounded-lg bg-blue-50 px-3 py-2 text-xs font-bold text-blue-700 transition hover:bg-blue-100"
                          >
                            View
                          </button>

                          <a
                            href={`/products/${product.id}/edit`}
                            className="rounded-lg bg-amber-50 px-3 py-2 text-xs font-bold text-amber-700 transition hover:bg-amber-100"
                          >
                            Edit
                          </a>

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
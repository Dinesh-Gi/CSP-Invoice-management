
"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type Option = {
  id: number;
  name: string;
};

type LineItem = {
  id: string;
  productId: string;
  transactionType: string;
  distributorId: string;
  buyPrice: string;
  sellPrice: string;
  proratePrice: string;
  subscriptionStart: string;
  subscriptionEnd: string;
  quantity: string;
  expanded: boolean;
};

function createLineItem(): LineItem {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    productId: "",
    transactionType: "",
    distributorId: "",
    buyPrice: "",
    sellPrice: "",
    proratePrice: "",
    subscriptionStart: "",
    subscriptionEnd: "",
    quantity: "1",
    expanded: true,
  };
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(value);
}

function calculateProrateDays(
  start: string,
  end: string
): number | null {
  if (!start || !end) return null;

  const startDate = new Date(start);
  const endDate = new Date(end);

  const difference = endDate.getTime() - startDate.getTime();

  const days =
    Math.floor(difference / (1000 * 60 * 60 * 24)) + 1;

  return days > 0 ? days : null;
}

function calculateLineRevenue(item: LineItem) {
  const sellPrice = Number(item.sellPrice || 0);
  const proratePrice =
    item.proratePrice === ""
      ? null
      : Number(item.proratePrice);
  const quantity = Number(item.quantity || 0);

  if (
    proratePrice !== null &&
    !Number.isNaN(proratePrice) &&
    proratePrice !== 0
  ) {
    return proratePrice * quantity;
  }

  return sellPrice * quantity;
}

function calculateLineProfit(item: LineItem) {
  const buyPrice = Number(item.buyPrice || 0);
  const sellPrice = Number(item.sellPrice || 0);
  const quantity = Number(item.quantity || 0);

  return (sellPrice - buyPrice) * quantity;
}

export default function AddTransactionPage() {
  const router = useRouter();

  const [customers, setCustomers] = useState<Option[]>([]);
  const [products, setProducts] = useState<Option[]>([]);
  const [distributors, setDistributors] = useState<Option[]>([]);

  const [loadingOptions, setLoadingOptions] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [showAddCustomer, setShowAddCustomer] = useState(false);
  const [newCustomerName, setNewCustomerName] = useState("");
  const [addingCustomer, setAddingCustomer] = useState(false);

  const [showAddProduct, setShowAddProduct] = useState(false);
  const [newProductName, setNewProductName] = useState("");
  const [addingProduct, setAddingProduct] = useState(false);

  const [form, setForm] = useState({
    customerId: "",
    transactionDate: new Date().toISOString().split("T")[0],
    poNumber: "",
    invoiceStatus: "",
    paymentStatus: "",
    remarks: "",
  });

  const [items, setItems] = useState<LineItem[]>([
    createLineItem(),
  ]);

  useEffect(() => {
    async function loadOptions() {
      try {
        const response = await fetch("/api/master-data", {
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error("Failed to load master data.");
        }

        const data = await response.json();

        setCustomers(data.customers ?? []);
        setProducts(data.products ?? []);
        setDistributors(data.distributors ?? []);
      } catch (err) {
        console.error(err);
        setError(
          err instanceof Error
            ? err.message
            : "Unable to load form data."
        );
      } finally {
        setLoadingOptions(false);
      }
    }

    loadOptions();
  }, []);

  function updateCommonField(
    field: keyof typeof form,
    value: string
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function updateItem(
    id: string,
    field: keyof LineItem,
    value: string | boolean
  ) {
    setItems((current) =>
      current.map((item) =>
        item.id === id
          ? {
              ...item,
              [field]: value,
            }
          : item
      )
    );
  }

  function addItem() {
    setItems((current) => [
      ...current,
      createLineItem(),
    ]);
  }

  function removeItem(id: string) {
    setItems((current) => {
      if (current.length === 1) {
        return current;
      }

      return current.filter((item) => item.id !== id);
    });
  }

  async function handleAddCustomer() {
    const customerName = newCustomerName.trim();

    if (!customerName) {
      setError("Please enter the customer name.");
      return;
    }

    setAddingCustomer(true);
    setError("");

    try {
      const response = await fetch("/api/customers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: customerName,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message || "Failed to add customer."
        );
      }

      const customer = result.customer;

      setCustomers((current) =>
        [...current, customer].sort((a, b) =>
          a.name.localeCompare(b.name)
        )
      );

      updateCommonField(
        "customerId",
        String(customer.id)
      );

      setNewCustomerName("");
      setShowAddCustomer(false);
    } catch (err) {
      console.error(err);
      setError(
        err instanceof Error
          ? err.message
          : "Failed to add customer."
      );
    } finally {
      setAddingCustomer(false);
    }
  }

  async function handleAddProduct() {
    const productName = newProductName.trim();

    if (!productName) {
      setError("Please enter the product name.");
      return;
    }

    setAddingProduct(true);
    setError("");

    try {
      const response = await fetch("/api/products", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: productName,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message || "Failed to add product."
        );
      }

      const product = result.product;

      setProducts((current) =>
        [...current, product].sort((a, b) =>
          a.name.localeCompare(b.name)
        )
      );

      setItems((current) => {
        const target = current.find(
          (item) => item.productId === ""
        );

        if (!target) {
          return current;
        }

        return current.map((item) =>
          item.id === target.id
            ? {
                ...item,
                productId: String(product.id),
              }
            : item
        );
      });

      setNewProductName("");
      setShowAddProduct(false);
    } catch (err) {
      console.error(err);
      setError(
        err instanceof Error
          ? err.message
          : "Failed to add product."
      );
    } finally {
      setAddingProduct(false);
    }
  }

  const totals = useMemo(() => {
    return items.reduce(
      (summary, item) => {
        summary.quantity += Number(item.quantity || 0);
        summary.revenue += calculateLineRevenue(item);
        summary.profit += calculateLineProfit(item);
        return summary;
      },
      {
        quantity: 0,
        revenue: 0,
        profit: 0,
      }
    );
  }, [items]);

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setSaving(true);
    setError("");

    try {
      if (!form.customerId) {
        throw new Error("Please select a customer.");
      }

      if (!form.transactionDate) {
        throw new Error("Please select the Date Loaded.");
      }

      if (items.length === 0) {
        throw new Error(
          "Please add at least one license/product."
        );
      }

      for (let index = 0; index < items.length; index += 1) {
        const item = items[index];
        const row = index + 1;

        if (!item.productId) {
          throw new Error(
            `Please select a license/product for item ${row}.`
          );
        }

        if (!item.buyPrice) {
          throw new Error(
            `Please enter the Buy Price for item ${row}.`
          );
        }

        if (!item.sellPrice) {
          throw new Error(
            `Please enter the Sell Price for item ${row}.`
          );
        }

        if (
          !item.quantity ||
          Number(item.quantity) < 1 ||
          !Number.isInteger(Number(item.quantity))
        ) {
          throw new Error(
            `Quantity must be at least 1 for item ${row}.`
          );
        }

        if (
          item.subscriptionStart &&
          item.subscriptionEnd &&
          new Date(item.subscriptionEnd) <
            new Date(item.subscriptionStart)
        ) {
          throw new Error(
            `End Date cannot be before Start Date for item ${row}.`
          );
        }
      }

      const response = await fetch(
        "/api/transaction-batches",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            customerId: Number(form.customerId),
            transactionDate: form.transactionDate,
            poNumber: form.poNumber || null,
            invoiceStatus:
              form.invoiceStatus || null,
            paymentStatus:
              form.paymentStatus || null,
            remarks: form.remarks || null,
            items: items.map((item) => ({
              productId: Number(item.productId),
              transactionType:
                item.transactionType || null,
              distributorId: item.distributorId
                ? Number(item.distributorId)
                : null,
              buyPrice: Number(item.buyPrice),
              sellPrice: Number(item.sellPrice),
              proratePrice:
                item.proratePrice !== ""
                  ? Number(item.proratePrice)
                  : null,
              subscriptionStart:
                item.subscriptionStart || null,
              subscriptionEnd:
                item.subscriptionEnd || null,
              prorateDays: calculateProrateDays(
                item.subscriptionStart,
                item.subscriptionEnd
              ),
              quantity: Number(item.quantity),
            })),
          }),
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message ||
            "Failed to create transaction batch."
        );
      }

      router.push("/tracker");
      router.refresh();
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : "Failed to save transactions."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-[1400px] items-center justify-between px-6 py-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Add Transaction
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Add one or multiple CSP licenses in a single transaction batch
            </p>
          </div>

          <button
            type="button"
            onClick={() => router.push("/tracker")}
            className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50"
          >
            ← Back to Tracker
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-[1400px] px-6 py-5">
        {error && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {error}
          </div>
        )}

        {loadingOptions ? (
          <div className="rounded-2xl border bg-white p-10 text-center shadow-sm">
            <p className="text-sm text-gray-500">
              Loading form data...
            </p>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="space-y-4"
          >
            <section className="rounded-2xl border bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-lg font-bold text-gray-900">
                    Transaction Details
                  </h2>
                  <p className="mt-1 text-xs text-gray-500">
                    These details apply to all license items in this batch.
                  </p>
                </div>

                <div className="rounded-lg bg-orange-50 px-3 py-2 text-right">
                  <p className="text-[10px] font-bold uppercase tracking-wide text-orange-600">
                    License Items
                  </p>
                  <p className="text-lg font-bold text-gray-900">
                    {items.length}
                  </p>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <label className="text-sm font-semibold text-gray-700">
                      Customer *
                    </label>

                    <button
                      type="button"
                      onClick={() =>
                        setShowAddCustomer(
                          (current) => !current
                        )
                      }
                      className="text-xs font-bold text-blue-600 hover:text-blue-800"
                    >
                      + Add Customer
                    </button>
                  </div>

                  <select
                    value={form.customerId}
                    onChange={(event) =>
                      updateCommonField(
                        "customerId",
                        event.target.value
                      )
                    }
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm"
                  >
                    <option value="">
                      Select Customer
                    </option>
                    {customers.map((customer) => (
                      <option
                        key={customer.id}
                        value={customer.id}
                      >
                        {customer.name}
                      </option>
                    ))}
                  </select>

                  {showAddCustomer && (
                    <div className="mt-2 rounded-xl border border-blue-200 bg-blue-50/40 p-3">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={newCustomerName}
                          onChange={(event) =>
                            setNewCustomerName(
                              event.target.value
                            )
                          }
                          placeholder="Customer name"
                          className="min-w-0 flex-1 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
                        />
                        <button
                          type="button"
                          disabled={addingCustomer}
                          onClick={handleAddCustomer}
                          className="rounded-lg bg-gray-900 px-4 py-2 text-xs font-bold text-white disabled:opacity-50"
                        >
                          {addingCustomer
                            ? "Adding..."
                            : "Add"}
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-gray-700">
                    Date Loaded *
                  </label>
                  <input
                    type="date"
                    value={form.transactionDate}
                    onChange={(event) =>
                      updateCommonField(
                        "transactionDate",
                        event.target.value
                      )
                    }
                    className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-gray-700">
                    PO Number
                  </label>
                  <input
                    type="text"
                    value={form.poNumber}
                    onChange={(event) =>
                      updateCommonField(
                        "poNumber",
                        event.target.value
                      )
                    }
                    placeholder="Enter PO number"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-gray-700">
                    Invoice Status
                  </label>
                  <select
                    value={form.invoiceStatus}
                    onChange={(event) =>
                      updateCommonField(
                        "invoiceStatus",
                        event.target.value
                      )
                    }
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm"
                  >
                    <option value="">Select Status</option>
                    <option value="Invoice Sent">
                      Invoice Sent
                    </option>
                    <option value="Need to send invoice">
                      Need to send invoice
                    </option>
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-gray-700">
                    Payment Received
                  </label>
                  <select
                    value={form.paymentStatus}
                    onChange={(event) =>
                      updateCommonField(
                        "paymentStatus",
                        event.target.value
                      )
                    }
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm"
                  >
                    <option value="">Select Status</option>
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                    <option value="Not Applicable">
                      Not Applicable
                    </option>
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-gray-700">
                    Remarks
                  </label>
                  <input
                    type="text"
                    value={form.remarks}
                    onChange={(event) =>
                      updateCommonField(
                        "remarks",
                        event.target.value
                      )
                    }
                    placeholder="Optional remarks"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm"
                  />
                </div>
              </div>
            </section>

            <section className="rounded-2xl border bg-white shadow-sm">
              <div className="flex items-center justify-between border-b px-5 py-4">
                <div>
                  <h2 className="text-lg font-bold text-gray-900">
                    License / Transaction Items
                  </h2>
                  <p className="mt-1 text-xs text-gray-500">
                    Add multiple licenses with separate pricing, quantity and distributor details.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddProduct(
                        (current) => !current
                      );
                      setError("");
                    }}
                    className="rounded-lg border border-orange-200 bg-orange-50 px-3 py-2 text-xs font-bold text-orange-600 hover:bg-orange-100"
                  >
                    {showAddProduct
                      ? "− Close Product"
                      : "+ Add Product"}
                  </button>

                  <button
                    type="button"
                    onClick={addItem}
                    className="rounded-lg bg-gray-900 px-3 py-2 text-xs font-bold text-white hover:bg-gray-800"
                  >
                    + Add License
                  </button>
                </div>
              </div>

              {showAddProduct && (
                <div className="border-b border-orange-100 bg-orange-50/40 px-5 py-3">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newProductName}
                      onChange={(event) =>
                        setNewProductName(
                          event.target.value
                        )
                      }
                      placeholder="Enter product / license name"
                      className="min-w-0 flex-1 rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm"
                    />
                    <button
                      type="button"
                      disabled={addingProduct}
                      onClick={handleAddProduct}
                      className="rounded-lg bg-orange-500 px-4 py-2.5 text-xs font-bold text-white disabled:opacity-50"
                    >
                      {addingProduct
                        ? "Adding..."
                        : "Add Product"}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowAddProduct(false);
                        setNewProductName("");
                      }}
                      className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-xs font-bold text-gray-700"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              <div className="space-y-3 p-4">
                {items.map((item, index) => {
                  const productName =
                    products.find(
                      (product) =>
                        String(product.id) ===
                        item.productId
                    )?.name ?? "Select license / product";

                  const revenue =
                    calculateLineRevenue(item);
                  const profit =
                    calculateLineProfit(item);
                  const prorateDays =
                    calculateProrateDays(
                      item.subscriptionStart,
                      item.subscriptionEnd
                    );

                  return (
                    <div
                      key={item.id}
                      className="overflow-hidden rounded-xl border border-gray-200 bg-gray-50/60"
                    >
                      <button
                        type="button"
                        onClick={() =>
                          updateItem(
                            item.id,
                            "expanded",
                            !item.expanded
                          )
                        }
                        className="flex w-full items-center justify-between gap-4 px-4 py-3 text-left hover:bg-gray-100"
                      >
                        <div className="flex min-w-0 items-center gap-3">
                          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gray-900 text-xs font-bold text-white">
                            {index + 1}
                          </span>

                          <div className="min-w-0">
                            <p className="truncate text-sm font-bold text-gray-900">
                              {productName}
                            </p>
                            <p className="text-[11px] text-gray-500">
                              Qty {item.quantity || 0}
                              {" • "}
                              Revenue {formatCurrency(revenue)}
                              {" • "}
                              P/L {formatCurrency(profit)}
                            </p>
                          </div>
                        </div>

                        <span className="shrink-0 text-xs font-bold text-gray-500">
                          {item.expanded
                            ? "▲ Collapse"
                            : "▼ Details"}
                        </span>
                      </button>

                      {item.expanded && (
                        <div className="border-t border-gray-200 bg-white p-4">
                          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
                            <div className="lg:col-span-2">
                              <label className="mb-1.5 block text-xs font-semibold text-gray-600">
                                License / Product *
                              </label>
                              <select
                                value={item.productId}
                                onChange={(event) =>
                                  updateItem(
                                    item.id,
                                    "productId",
                                    event.target.value
                                  )
                                }
                                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
                              >
                                <option value="">
                                  Select License / Product
                                </option>
                                {products.map(
                                  (product) => (
                                    <option
                                      key={product.id}
                                      value={product.id}
                                    >
                                      {product.name}
                                    </option>
                                  )
                                )}
                              </select>
                            </div>

                            <div>
                              <label className="mb-1.5 block text-xs font-semibold text-gray-600">
                                Transaction Type
                              </label>
                              <select
                                value={item.transactionType}
                                onChange={(event) =>
                                  updateItem(
                                    item.id,
                                    "transactionType",
                                    event.target.value
                                  )
                                }
                                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
                              >
                                <option value="">
                                  Select Type
                                </option>
                                <option value="Renewal">
                                  Renewal
                                </option>
                                <option value="Prorate">
                                  Prorate
                                </option>
                                <option value="Net New">
                                  Net New
                                </option>
                                <option value="NA">NA</option>
                                <option value="-">-</option>
                              </select>
                            </div>

                            <div>
                              <label className="mb-1.5 block text-xs font-semibold text-gray-600">
                                Distributor
                              </label>
                              <select
                                value={item.distributorId}
                                onChange={(event) =>
                                  updateItem(
                                    item.id,
                                    "distributorId",
                                    event.target.value
                                  )
                                }
                                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
                              >
                                <option value="">
                                  Select Distributor
                                </option>
                                {distributors.map(
                                  (distributor) => (
                                    <option
                                      key={distributor.id}
                                      value={
                                        distributor.id
                                      }
                                    >
                                      {distributor.name}
                                    </option>
                                  )
                                )}
                              </select>
                            </div>

                            <div>
                              <label className="mb-1.5 block text-xs font-semibold text-gray-600">
                                Buy Price *
                              </label>
                              <input
                                type="number"
                                step="0.01"
                                min="0"
                                value={item.buyPrice}
                                onChange={(event) =>
                                  updateItem(
                                    item.id,
                                    "buyPrice",
                                    event.target.value
                                  )
                                }
                                placeholder="0.00"
                                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                              />
                            </div>

                            <div>
                              <label className="mb-1.5 block text-xs font-semibold text-gray-600">
                                Sell Price *
                              </label>
                              <input
                                type="number"
                                step="0.01"
                                min="0"
                                value={item.sellPrice}
                                onChange={(event) =>
                                  updateItem(
                                    item.id,
                                    "sellPrice",
                                    event.target.value
                                  )
                                }
                                placeholder="0.00"
                                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                              />
                            </div>

                            <div>
                              <label className="mb-1.5 block text-xs font-semibold text-gray-600">
                                Prorate Price
                              </label>
                              <input
                                type="number"
                                step="0.01"
                                min="0"
                                value={item.proratePrice}
                                onChange={(event) =>
                                  updateItem(
                                    item.id,
                                    "proratePrice",
                                    event.target.value
                                  )
                                }
                                placeholder="Optional"
                                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                              />
                            </div>

                            <div>
                              <label className="mb-1.5 block text-xs font-semibold text-gray-600">
                                Quantity *
                              </label>
                              <input
                                type="number"
                                min="1"
                                step="1"
                                value={item.quantity}
                                onChange={(event) =>
                                  updateItem(
                                    item.id,
                                    "quantity",
                                    event.target.value
                                  )
                                }
                                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                              />
                            </div>

                            <div>
                              <label className="mb-1.5 block text-xs font-semibold text-gray-600">
                                Start Date
                              </label>
                              <input
                                type="date"
                                value={
                                  item.subscriptionStart
                                }
                                onChange={(event) =>
                                  updateItem(
                                    item.id,
                                    "subscriptionStart",
                                    event.target.value
                                  )
                                }
                                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                              />
                            </div>

                            <div>
                              <label className="mb-1.5 block text-xs font-semibold text-gray-600">
                                End Date
                              </label>
                              <input
                                type="date"
                                value={
                                  item.subscriptionEnd
                                }
                                onChange={(event) =>
                                  updateItem(
                                    item.id,
                                    "subscriptionEnd",
                                    event.target.value
                                  )
                                }
                                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                              />
                            </div>

                            <div>
                              <label className="mb-1.5 block text-xs font-semibold text-gray-600">
                                Prorate Days
                              </label>
                              <div className="rounded-lg border bg-gray-50 px-3 py-2 text-sm font-semibold text-gray-700">
                                {prorateDays ?? "-"}
                              </div>
                            </div>

                            <div className="flex items-end justify-end">
                              <button
                                type="button"
                                disabled={items.length === 1}
                                onClick={() =>
                                  removeItem(item.id)
                                }
                                className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-40"
                              >
                                Remove License
                              </button>
                            </div>
                          </div>

                          <div className="mt-4 grid gap-3 sm:grid-cols-3">
                            <div className="rounded-lg border bg-gray-50 px-3 py-2">
                              <p className="text-[10px] font-bold uppercase tracking-wide text-gray-500">
                                Revenue
                              </p>
                              <p className="mt-1 text-sm font-bold text-gray-900">
                                {formatCurrency(revenue)}
                              </p>
                            </div>

                            <div className="rounded-lg border bg-gray-50 px-3 py-2">
                              <p className="text-[10px] font-bold uppercase tracking-wide text-gray-500">
                                P/L
                              </p>
                              <p className="mt-1 text-sm font-bold text-gray-900">
                                {formatCurrency(profit)}
                              </p>
                            </div>

                            <div className="rounded-lg border bg-gray-50 px-3 py-2">
                              <p className="text-[10px] font-bold uppercase tracking-wide text-gray-500">
                                Margin
                              </p>
                              <p className="mt-1 text-sm font-bold text-gray-900">
                                {Number(item.buyPrice)
                                  ? (
                                      ((Number(item.sellPrice) -
                                        Number(item.buyPrice)) /
                                        Number(item.buyPrice)) *
                                      100
                                    ).toFixed(2)
                                  : "0.00"}
                                %
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>

            <section className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl border bg-white p-4 shadow-sm">
                <p className="text-[10px] font-bold uppercase tracking-wide text-gray-500">
                  Total Quantity
                </p>
                <p className="mt-1 text-xl font-bold text-gray-900">
                  {totals.quantity}
                </p>
              </div>

              <div className="rounded-xl border bg-white p-4 shadow-sm">
                <p className="text-[10px] font-bold uppercase tracking-wide text-gray-500">
                  Total Revenue
                </p>
                <p className="mt-1 text-xl font-bold text-gray-900">
                  {formatCurrency(totals.revenue)}
                </p>
              </div>

              <div className="rounded-xl border bg-white p-4 shadow-sm">
                <p className="text-[10px] font-bold uppercase tracking-wide text-gray-500">
                  Total P/L
                </p>
                <p className="mt-1 text-xl font-bold text-gray-900">
                  {formatCurrency(totals.profit)}
                </p>
              </div>
            </section>

            <section className="flex items-center justify-end gap-3 rounded-xl border bg-white p-4 shadow-sm">
              <button
                type="button"
                onClick={() => router.push("/tracker")}
                className="rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={saving}
                className="rounded-lg bg-gray-900 px-6 py-2.5 text-sm font-semibold text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving
                  ? "Saving..."
                  : `Save ${items.length} License${
                      items.length === 1 ? "" : "s"
                    }`}
              </button>
            </section>
          </form>
        )}
      </div>
    </main>
  );
}
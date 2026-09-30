"use client";

import { FormEvent, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

type Option = {
  id: number;
  name: string;
};

export default function EditTransactionPage() {
  const router = useRouter();
  const params = useParams();
  const transactionId = Array.isArray(params.id) ? params.id[0] : params.id;

  const [customers, setCustomers] = useState<Option[]>([]);
  const [products, setProducts] = useState<Option[]>([]);
  const [distributors, setDistributors] = useState<Option[]>([]);

  const [loadingOptions, setLoadingOptions] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [showAddCustomer, setShowAddCustomer] =
  useState(false);

  const [newCustomerName, setNewCustomerName] =
  useState("");

  const [addingCustomer, setAddingCustomer] =
  useState(false);

  const [form, setForm] = useState({
    customerId: "",
    transactionDate: new Date().toISOString().split("T")[0],
    poNumber: "",
    transactionType: "",
    productId: "",
    buyPrice: "",
    sellPrice: "",
    proratePrice: "",
    subscriptionStart: "",
    subscriptionEnd: "",
    quantity: "1",
    distributorId: "",
    invoiceStatus: "",
    paymentStatus: "",
    remarks: "",
  });

  useEffect(() => {
    async function loadData() {
      try {
        setLoadingOptions(true);

        const [masterResponse, transactionsResponse] =
          await Promise.all([
            fetch("/api/master-data"),
            fetch("/api/transactions"),
          ]);

        if (!masterResponse.ok) {
          throw new Error("Failed to load master data.");
        }

        if (!transactionsResponse.ok) {
          throw new Error("Failed to load transaction data.");
        }

        const masterData = await masterResponse.json();
        const transactionsData = await transactionsResponse.json();

        setCustomers(masterData.customers ?? []);
        setProducts(masterData.products ?? []);
        setDistributors(masterData.distributors ?? []);

        const transaction = (transactionsData.transactions ?? []).find(
          (item: { id: number }) => item.id === Number(transactionId)
        );

        if (!transaction) {
          throw new Error("Transaction not found.");
        }

        const toDateInput = (value: string | null | undefined) => {
          if (!value) return "";
          return new Date(value).toISOString().split("T")[0];
        };

        setForm({
          customerId: String(
            transaction.customerId ??
              customers.find((item) => item.name === transaction.customer)?.id ??
              ""
          ),
          transactionDate: toDateInput(transaction.date),
          poNumber: transaction.poNumber ?? "",
          transactionType: transaction.transactionType ?? "",
          productId: String(
            transaction.productId ??
              products.find((item) => item.name === transaction.product)?.id ??
              ""
          ),
          buyPrice: String(transaction.buyPrice ?? ""),
          sellPrice: String(transaction.sellPrice ?? ""),
          proratePrice:
            transaction.proratePrice !== null &&
            transaction.proratePrice !== undefined
              ? String(transaction.proratePrice)
              : "",
          subscriptionStart: toDateInput(transaction.subscriptionStart),
          subscriptionEnd: toDateInput(transaction.subscriptionEnd),
          quantity: String(transaction.quantity ?? 1),
          distributorId: String(
            transaction.distributorId ??
              distributors.find((item) => item.name === transaction.distributor)?.id ??
              ""
          ),
          invoiceStatus: transaction.invoiceStatus ?? "",
          paymentStatus: transaction.paymentStatus ?? "",
          remarks: transaction.remarks ?? "",
        });
      } catch (err) {
        console.error(err);
        setError(
          err instanceof Error
            ? err.message
            : "Unable to load transaction data."
        );
      } finally {
        setLoadingOptions(false);
      }
    }

    if (transactionId) {
      loadData();
    }
  }, [transactionId]);

  function updateField(
    field: keyof typeof form,
    value: string
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function calculateRevenue() {
    const sellPrice = Number(form.sellPrice || 0);
    const proratePrice =
      form.proratePrice === ""
        ? null
        : Number(form.proratePrice);

    const quantity = Number(form.quantity || 0);

    if (
      proratePrice !== null &&
      !Number.isNaN(proratePrice) &&
      proratePrice !== 0
    ) {
      return proratePrice * quantity;
    }

    return sellPrice * quantity;
  }

  function calculateProfit() {
    const buyPrice = Number(form.buyPrice || 0);
    const sellPrice = Number(form.sellPrice || 0);
    const quantity = Number(form.quantity || 0);

    return (sellPrice - buyPrice) * quantity;
  }

  function calculateMargin() {
    const buyPrice = Number(form.buyPrice || 0);
    const sellPrice = Number(form.sellPrice || 0);

    if (!buyPrice) {
      return 0;
    }

    return ((sellPrice - buyPrice) / buyPrice) * 100;
  }

  function calculateProrateDays() {
    if (
      !form.subscriptionStart ||
      !form.subscriptionEnd
    ) {
      return null;
    }

    const start = new Date(form.subscriptionStart);
    const end = new Date(form.subscriptionEnd);

    const difference =
      end.getTime() - start.getTime();

    const days =
      Math.floor(
        difference / (1000 * 60 * 60 * 24)
      ) + 1;

    return days > 0 ? days : null;
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
        body: JSON.stringify({ name: customerName }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message || "Failed to add customer."
        );
      }

      const customer = result.customer;

      setCustomers((current) => {
        if (current.some((item) => item.id === customer.id)) {
          return current;
        }

        return [...current, customer].sort((a, b) =>
          a.name.localeCompare(b.name)
        );
      });

      updateField("customerId", String(customer.id));
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

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setSaving(true);
    setError("");

    try {
      if (!transactionId) {
        throw new Error("Transaction ID is missing.");
      }

      if (!form.customerId) {
        throw new Error("Please select a customer.");
      }

      if (!form.productId) {
        throw new Error(
          "Please select a license/product."
        );
      }

      if (!form.buyPrice) {
        throw new Error(
          "Please enter the Buy Price."
        );
      }

      if (!form.sellPrice) {
        throw new Error(
          "Please enter the Sell Price."
        );
      }

      if (!form.quantity) {
        throw new Error(
          "Please enter the quantity."
        );
      }

      const response = await fetch(
        "/api/transactions",
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            id: Number(transactionId),
            customerId: Number(form.customerId),
            productId: Number(form.productId),
            distributorId:
              form.distributorId
                ? Number(form.distributorId)
                : null,

            transactionDate:
              form.transactionDate,

            poNumber:
              form.poNumber || null,

            transactionType:
              form.transactionType || null,

            buyPrice:
              Number(form.buyPrice),

            sellPrice:
              Number(form.sellPrice),

            proratePrice:
              form.proratePrice
                ? Number(form.proratePrice)
                : null,

            subscriptionStart:
              form.subscriptionStart || null,

            subscriptionEnd:
              form.subscriptionEnd || null,

            prorateDays:
              calculateProrateDays(),

            quantity:
              Number(form.quantity),

            invoiceStatus:
              form.invoiceStatus || null,

            paymentStatus:
              form.paymentStatus || null,

            remarks:
              form.remarks || null,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message ||
            "Failed to update transaction."
        );
      }

      router.push("/tracker");
      router.refresh();
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : "Failed to update transaction."
      );
    } finally {
      setSaving(false);
    }
  }

  const revenue = calculateRevenue();
  const profit = calculateProfit();
  const margin = calculateMargin();
  const prorateDays = calculateProrateDays();

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Header */}

      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-[1400px] items-center justify-between px-6 py-5">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Edit Transaction
            </h1>

            <p className="mt-1 text-sm text-gray-500">
              Update the CSP transaction details
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

      <div className="mx-auto max-w-[1400px] px-6 py-6">
        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-medium text-red-700">
            {error}
          </div>
        )}

        {loadingOptions ? (
          <div className="rounded-2xl border bg-white p-10 text-center shadow-sm">
            <p className="text-gray-500">
              Loading transaction data...
            </p>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="space-y-6"
          >
            {/* Customer / Transaction */}

            <section className="rounded-2xl border bg-white p-6 shadow-sm">
              <div className="mb-6">
                <h2 className="text-lg font-bold text-gray-900">
                  Transaction Details
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  Basic customer and transaction information
                </p>
              </div>

              <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <label className="text-sm font-semibold text-gray-700">
                      Customer *
                    </label>

                    <button
                      type="button"
                      onClick={() => setShowAddCustomer(!showAddCustomer)}
                      className="text-sm font-semibold text-blue-600 hover:text-blue-800"
                    >
                      + Add Customer
                    </button>
                  </div>

                  <select
                    value={form.customerId}
                    onChange={(e) =>
                      updateField("customerId", e.target.value)
                    }
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm"
                  >
                    <option value="">Select Customer</option>

                    {customers.map((customer) => (
                      <option key={customer.id} value={customer.id}>
                        {customer.name}
                      </option>
                    ))}
                  </select>

                  {showAddCustomer && (
                    <div className="mt-3 rounded-xl border border-gray-200 bg-gray-50 p-4">
                      <label className="mb-2 block text-sm font-semibold text-gray-700">
                        New Customer Name
                      </label>

                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={newCustomerName}
                          onChange={(e) =>
                            setNewCustomerName(e.target.value)
                          }
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              handleAddCustomer();
                            }
                          }}
                          placeholder="Enter customer name"
                          className="flex-1 rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm"
                        />

                        <button
                          type="button"
                          disabled={addingCustomer}
                          onClick={handleAddCustomer}
                          className="rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {addingCustomer ? "Adding..." : "Add"}
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
                    onChange={(e) =>
                      updateField(
                        "transactionDate",
                        e.target.value
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
                    onChange={(e) =>
                      updateField(
                        "poNumber",
                        e.target.value
                      )
                    }
                    placeholder="Enter PO number"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-gray-700">
                    Transaction Type
                  </label>

                  <select
                    value={form.transactionType}
                    onChange={(e) =>
                      updateField(
                        "transactionType",
                        e.target.value
                      )
                    }
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm"
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
                    <option value="NA">
                      NA
                    </option>
                    <option value="-">
                      -
                    </option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="mb-2 block text-sm font-semibold text-gray-700">
                    License Description *
                  </label>

                  <select
                    value={form.productId}
                    onChange={(e) =>
                      updateField(
                        "productId",
                        e.target.value
                      )
                    }
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm"
                  >
                    <option value="">
                      Select License / Product
                    </option>

                    {products.map((product) => (
                      <option
                        key={product.id}
                        value={product.id}
                      >
                        {product.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </section>

            {/* Pricing */}

            <section className="rounded-2xl border bg-white p-6 shadow-sm">
              <div className="mb-6">
                <h2 className="text-lg font-bold text-gray-900">
                  Pricing & Quantity
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  Pricing information and automatic calculations
                </p>
              </div>

              <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-gray-700">
                    Buy Price *
                  </label>

                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={form.buyPrice}
                    onChange={(e) =>
                      updateField(
                        "buyPrice",
                        e.target.value
                      )
                    }
                    placeholder="0.00"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-gray-700">
                    Sell Price *
                  </label>

                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={form.sellPrice}
                    onChange={(e) =>
                      updateField(
                        "sellPrice",
                        e.target.value
                      )
                    }
                    placeholder="0.00"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-gray-700">
                    Prorate Price
                  </label>

                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={form.proratePrice}
                    onChange={(e) =>
                      updateField(
                        "proratePrice",
                        e.target.value
                      )
                    }
                    placeholder="Optional"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-gray-700">
                    Quantity *
                  </label>

                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={form.quantity}
                    onChange={(e) =>
                      updateField(
                        "quantity",
                        e.target.value
                      )
                    }
                    className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm"
                  />
                </div>
              </div>

              {/* Calculations */}

              <div className="mt-6 grid gap-4 md:grid-cols-3">
                <div className="rounded-xl bg-gray-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Total Revenue
                  </p>

                  <p className="mt-2 text-xl font-bold text-gray-900">
                    ₹
                    {revenue.toLocaleString(
                      "en-IN",
                      {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      }
                    )}
                  </p>
                </div>

                <div className="rounded-xl bg-gray-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                    P/L
                  </p>

                  <p className="mt-2 text-xl font-bold text-gray-900">
                    ₹
                    {profit.toLocaleString(
                      "en-IN",
                      {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      }
                    )}
                  </p>
                </div>

                <div className="rounded-xl bg-gray-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Margin
                  </p>

                  <p className="mt-2 text-xl font-bold text-gray-900">
                    {margin.toFixed(2)}%
                  </p>
                </div>
              </div>
            </section>

            {/* Subscription */}

            <section className="rounded-2xl border bg-white p-6 shadow-sm">
              <div className="mb-6">
                <h2 className="text-lg font-bold text-gray-900">
                  Prorate Period
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  Enter the subscription period when applicable
                </p>
              </div>

              <div className="grid gap-5 md:grid-cols-3">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-gray-700">
                    Start Date
                  </label>

                  <input
                    type="date"
                    value={form.subscriptionStart}
                    onChange={(e) =>
                      updateField(
                        "subscriptionStart",
                        e.target.value
                      )
                    }
                    className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-gray-700">
                    End Date
                  </label>

                  <input
                    type="date"
                    value={form.subscriptionEnd}
                    onChange={(e) =>
                      updateField(
                        "subscriptionEnd",
                        e.target.value
                      )
                    }
                    className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-gray-700">
                    Prorate Days
                  </label>

                  <div className="rounded-lg border bg-gray-50 px-3 py-2.5 text-sm font-semibold text-gray-700">
                    {prorateDays ?? "-"}
                  </div>
                </div>
              </div>
            </section>

            {/* Invoice / Distributor */}

            <section className="rounded-2xl border bg-white p-6 shadow-sm">
              <div className="mb-6">
                <h2 className="text-lg font-bold text-gray-900">
                  Invoice & Payment
                </h2>
              </div>

              <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-gray-700">
                    Backend Distributor
                  </label>

                  <select
                    value={form.distributorId}
                    onChange={(e) =>
                      updateField(
                        "distributorId",
                        e.target.value
                      )
                    }
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm"
                  >
                    <option value="">
                      Select Distributor
                    </option>

                    {distributors.map(
                      (distributor) => (
                        <option
                          key={distributor.id}
                          value={distributor.id}
                        >
                          {distributor.name}
                        </option>
                      )
                    )}
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-gray-700">
                    Invoice Status
                  </label>

                  <select
                    value={form.invoiceStatus}
                    onChange={(e) =>
                      updateField(
                        "invoiceStatus",
                        e.target.value
                      )
                    }
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm"
                  >
                    <option value="">
                      Select Status
                    </option>

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
                    onChange={(e) =>
                      updateField(
                        "paymentStatus",
                        e.target.value
                      )
                    }
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm"
                  >
                    <option value="">
                      Select Status
                    </option>

                    <option value="Yes">
                      Yes
                    </option>

                    <option value="No">
                      No
                    </option>

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
                    onChange={(e) =>
                      updateField(
                        "remarks",
                        e.target.value
                      )
                    }
                    placeholder="Optional remarks"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm"
                  />
                </div>
              </div>
            </section>

            {/* Actions */}

            <section className="flex items-center justify-end gap-3 rounded-2xl border bg-white p-5 shadow-sm">
              <button
                type="button"
                onClick={() =>
                  router.push("/tracker")
                }
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
                  : "Update Transaction"}
              </button>
            </section>
          </form>
        )}
      </div>
    </main>
  );
}
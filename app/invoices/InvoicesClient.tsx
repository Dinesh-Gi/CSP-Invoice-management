"use client";

import { useEffect, useMemo, useState } from "react";

type Invoice = {
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
  invoiceStatus: string | null;
  paymentStatus: string | null;
  remarks: string | null;
  subscriptionStart: string | null;
  subscriptionEnd: string | null;
  prorateDays: number | null;
  periodLabel: string | null;
  createdAt: string;
  updatedAt: string;
};

type SessionUser = {
  id: number;
  name: string;
  email: string;
  role: string;
};

type InvoiceSummary = {
  totalInvoices: number;
  invoiceSent: number;
  pendingInvoice: number;
  notSet: number;
  totalRevenue: number;
  totalProfit: number;
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(value) || 0);
}

function formatDate(value: string | null) {
  if (!value) return "Not Set";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function getInvoiceStatus(status: string | null) {
  const normalized = status?.trim().toLowerCase();

  if (normalized === "invoice sent") {
    return {
      label: "Invoice Sent",
      className: "bg-emerald-50 text-emerald-700 ring-emerald-200",
      dot: "bg-emerald-500",
    };
  }

  if (normalized === "need to send invoice") {
    return {
      label: "Need to Send",
      className: "bg-amber-50 text-amber-700 ring-amber-200",
      dot: "bg-amber-500",
    };
  }

  if (normalized === "hold") {
    return {
      label: "Hold",
      className: "bg-red-50 text-red-700 ring-red-200",
      dot: "bg-red-500",
    };
  }

  if (normalized === "credit note") {
    return {
      label: "Credit Note",
      className: "bg-purple-50 text-purple-700 ring-purple-200",
      dot: "bg-purple-500",
    };
  }

  return {
    label: status?.trim() || "Not Set",
    className: "bg-gray-50 text-gray-600 ring-gray-200",
    dot: "bg-gray-400",
  };
}

function getPaymentStatus(status: string | null) {
  const normalized = status?.trim().toLowerCase();

  if (normalized === "yes") {
    return {
      label: "Payment Received",
      className: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    };
  }

  if (normalized === "no") {
    return {
      label: "Payment Pending",
      className: "bg-red-50 text-red-700 ring-red-200",
    };
  }

  if (normalized === "not applicable") {
    return {
      label: "Not Applicable",
      className: "bg-blue-50 text-blue-700 ring-blue-200",
    };
  }

  return {
    label: status?.trim() || "Not Set",
    className: "bg-gray-50 text-gray-600 ring-gray-200",
  };
}

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [summary, setSummary] = useState<InvoiceSummary>({
    totalInvoices: 0,
    invoiceSent: 0,
    pendingInvoice: 0,
    notSet: 0,
    totalRevenue: 0,
    totalProfit: 0,
  });

  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [invoiceStatus, setInvoiceStatus] = useState("All");
  const [paymentStatus, setPaymentStatus] = useState("All");
  const [distributor, setDistributor] = useState("All");
  const [transactionType, setTransactionType] = useState("All");
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [user, setUser] = useState<SessionUser | null>(null);
  const [checkingRole, setCheckingRole] = useState(true);

  const canEditTransactions =
    user?.role === "ADMIN" ||
    user?.role === "FINANCE" ||
    user?.role === "SALES";

  useEffect(() => {
    async function loadUser() {
      try {
        const response = await fetch("/api/auth/me", {
          cache: "no-store",
        });

        if (!response.ok) {
          return;
        }

        const data = await response.json();

        if (data.success && data.user) {
          setUser(data.user);
        }
      } catch (error) {
        console.error("Unable to load user:", error);
      } finally {
        setCheckingRole(false);
      }
    }

    loadUser();
  }, []);

  useEffect(() => {
    loadInvoices();
  }, []);

  async function loadInvoices() {
    try {
      setLoading(true);

      const response = await fetch("/api/invoices", {
        cache: "no-store",
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to load invoices.");
      }

      setInvoices(data.invoices || []);

      setSummary(
        data.summary || {
          totalInvoices: 0,
          invoiceSent: 0,
          pendingInvoice: 0,
          notSet: 0,
          totalRevenue: 0,
          totalProfit: 0,
        }
      );
    } catch (error) {
      console.error("Invoice loading error:", error);
    } finally {
      setLoading(false);
    }
  }

  const invoiceStatuses = useMemo(
    () =>
      Array.from(
        new Set(
          invoices
            .map((item) => item.invoiceStatus?.trim())
            .filter((item): item is string => Boolean(item))
        )
      ).sort(),
    [invoices]
  );

  const paymentStatuses = useMemo(
    () =>
      Array.from(
        new Set(
          invoices
            .map((item) => item.paymentStatus?.trim())
            .filter((item): item is string => Boolean(item))
        )
      ).sort(),
    [invoices]
  );

  const distributors = useMemo(
    () =>
      Array.from(
        new Set(
          invoices
            .map((item) => item.distributor?.trim())
            .filter((item): item is string => Boolean(item))
        )
      ).sort(),
    [invoices]
  );

  const transactionTypes = useMemo(
    () =>
      Array.from(
        new Set(
          invoices
            .map((item) => item.transactionType?.trim())
            .filter((item): item is string => Boolean(item))
        )
      ).sort(),
    [invoices]
  );

  const filteredInvoices = useMemo(() => {
    const searchText = search.trim().toLowerCase();

    return invoices.filter((invoice) => {
      const matchesSearch =
        !searchText ||
        invoice.customer.toLowerCase().includes(searchText) ||
        invoice.product.toLowerCase().includes(searchText) ||
        (invoice.poNumber || "").toLowerCase().includes(searchText) ||
        (invoice.distributor || "").toLowerCase().includes(searchText) ||
        (invoice.transactionType || "").toLowerCase().includes(searchText) ||
        (invoice.remarks || "").toLowerCase().includes(searchText);

      const matchesInvoiceStatus =
        invoiceStatus === "All" ||
        (invoice.invoiceStatus || "Not Set").trim() === invoiceStatus;

      const matchesPaymentStatus =
        paymentStatus === "All" ||
        (invoice.paymentStatus || "Not Set").trim() === paymentStatus;

      const matchesDistributor =
        distributor === "All" ||
        (invoice.distributor || "Not Set").trim() === distributor;

      const matchesTransactionType =
        transactionType === "All" ||
        (invoice.transactionType || "Not Set").trim() === transactionType;

      return (
        matchesSearch &&
        matchesInvoiceStatus &&
        matchesPaymentStatus &&
        matchesDistributor &&
        matchesTransactionType
      );
    });
  }, [invoices, search, invoiceStatus, paymentStatus, distributor, transactionType]);

  const invoiceSentCount = invoices.filter(
    (item) => item.invoiceStatus?.trim().toLowerCase() === "invoice sent"
  ).length;
  const needToSendCount = invoices.filter(
    (item) => item.invoiceStatus?.trim().toLowerCase() === "need to send invoice"
  ).length;
  const invoiceNotSetCount = invoices.filter(
    (item) => !item.invoiceStatus?.trim()
  ).length;
  const paymentReceivedCount = invoices.filter(
    (item) => item.paymentStatus?.trim().toLowerCase() === "yes"
  ).length;
  const paymentPendingCount = invoices.filter(
    (item) => item.paymentStatus?.trim().toLowerCase() === "no"
  ).length;
  const paymentNotSetCount = invoices.filter(
    (item) => !item.paymentStatus?.trim()
  ).length;

  const invoiceStatusAmounts = useMemo(() => ({
    needToSend: invoices
      .filter((item) => item.invoiceStatus?.trim().toLowerCase() === "need to send invoice")
      .reduce((sum, item) => sum + item.revenue, 0),
    invoiceSent: invoices
      .filter((item) => item.invoiceStatus?.trim().toLowerCase() === "invoice sent")
      .reduce((sum, item) => sum + item.revenue, 0),
  }), [invoices]);

  const paymentStatusAmounts = useMemo(() => ({
    pending: invoices
      .filter((item) => item.paymentStatus?.trim().toLowerCase() === "no")
      .reduce((sum, item) => sum + item.revenue, 0),
    received: invoices
      .filter((item) => item.paymentStatus?.trim().toLowerCase() === "yes")
      .reduce((sum, item) => sum + item.revenue, 0),
  }), [invoices]);

  const hasFilters =
    search.trim() !== "" ||
    invoiceStatus !== "All" ||
    paymentStatus !== "All" ||
    distributor !== "All" ||
    transactionType !== "All";

  function clearFilters() {
    setSearch("");
    setInvoiceStatus("All");
    setPaymentStatus("All");
    setDistributor("All");
    setTransactionType("All");
  }

  const actionRequired = useMemo(
    () =>
      invoices.filter(
        (item) =>
          item.invoiceStatus?.trim().toLowerCase() !== "invoice sent" ||
          item.paymentStatus?.trim().toLowerCase() === "no"
      ),
    [invoices]
  );

  const actionRequiredVisible = actionRequired.slice(0, 6);

  if (checkingRole) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-sm font-medium text-gray-500">Loading invoices...</div>
      </div>
    );
  }

  const quickFilter = (invoiceValue: string, paymentValue = "All") => {
    setInvoiceStatus(invoiceValue);
    setPaymentStatus(paymentValue);
    setSearch("");
  };

  return (
    <main className="min-h-screen bg-gray-50/70 text-gray-950">
      <div className="mx-auto w-full max-w-[1800px] px-4 py-6 sm:px-6 lg:px-8 xl:px-10">
        <header className="mb-5 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-blue-600">
                <span className="h-2 w-2 rounded-full bg-blue-600" /> Invoice Desk
              </div>
              <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Invoice Management</h1>
              <p className="mt-1.5 max-w-3xl text-sm text-gray-500">
                Manage the invoice lifecycle from <strong>Need to Send</strong> to <strong>Invoice Sent</strong> and <strong>Payment Received</strong>.
              </p>
            </div>
            <button
              type="button"
              onClick={loadInvoices}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-5 text-sm font-bold text-gray-700 shadow-sm transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
            >
              <RefreshIcon /> Refresh Data
            </button>
          </div>
        </header>

        {/* Excel-style workflow summary */}
        <section className="mb-6 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
          <div className="mb-5 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-base font-bold text-gray-950">Invoice &amp; Payment Overview</h2>
              <p className="mt-1 text-xs text-gray-500">Use the workflow below to see exactly what needs to be invoiced and what needs payment follow-up.</p>
            </div>
            <span className="text-xs font-semibold text-gray-400">{summary.totalInvoices.toLocaleString("en-IN")} total records</span>
          </div>

          <div className="grid gap-5 lg:grid-cols-2">
            <div className="rounded-xl border border-gray-200 bg-gray-50/60 p-4">
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-gray-900">Invoice Workflow</h3>
                  <p className="mt-0.5 text-[11px] text-gray-500">Invoice preparation and sending status</p>
                </div>
                <span className="rounded-full bg-white px-2.5 py-1 text-[10px] font-bold text-gray-500 ring-1 ring-gray-200">Invoice</span>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <StatusCard
                  label="Need to Send"
                  count={needToSendCount}
                  value={formatCompactCurrency(invoiceStatusAmounts.needToSend)}
                  tone="amber"
                  active={invoiceStatus === "Need to Send Invoice" && paymentStatus === "All"}
                  onClick={() => quickFilter("Need to Send Invoice")}
                  icon={<AlertIcon />}
                />
                <StatusCard
                  label="Invoice Sent"
                  count={invoiceSentCount}
                  value={formatCompactCurrency(invoiceStatusAmounts.invoiceSent)}
                  tone="green"
                  active={invoiceStatus === "Invoice Sent" && paymentStatus === "All"}
                  onClick={() => quickFilter("Invoice Sent")}
                  icon={<CheckIcon />}
                />
                <StatusCard
                  label="Not Set"
                  count={invoiceNotSetCount}
                  value="Invoice status missing"
                  tone="gray"
                  active={invoiceStatus === "Not Set" && paymentStatus === "All"}
                  onClick={() => quickFilter("Not Set")}
                  icon={<MinusIcon />}
                />
              </div>
            </div>

            <div className="rounded-xl border border-gray-200 bg-gray-50/60 p-4">
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-gray-900">Payment Workflow</h3>
                  <p className="mt-0.5 text-[11px] text-gray-500">Track collections after the invoice is sent</p>
                </div>
                <span className="rounded-full bg-white px-2.5 py-1 text-[10px] font-bold text-gray-500 ring-1 ring-gray-200">Payment</span>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <StatusCard
                  label="Payment Pending"
                  count={paymentPendingCount}
                  value={formatCompactCurrency(paymentStatusAmounts.pending)}
                  tone="red"
                  active={paymentStatus === "No" && invoiceStatus === "All"}
                  onClick={() => quickFilter("All", "No")}
                  icon={<AlertIcon />}
                />
                <StatusCard
                  label="Payment Received"
                  count={paymentReceivedCount}
                  value={formatCompactCurrency(paymentStatusAmounts.received)}
                  tone="blue"
                  active={paymentStatus === "Yes" && invoiceStatus === "All"}
                  onClick={() => quickFilter("All", "Yes")}
                  icon={<CheckIcon />}
                />
                <StatusCard
                  label="Not Set"
                  count={paymentNotSetCount}
                  value="Payment status missing"
                  tone="gray"
                  active={paymentStatus === "Not Set" && invoiceStatus === "All"}
                  onClick={() => quickFilter("All", "Not Set")}
                  icon={<MinusIcon />}
                />
              </div>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2 rounded-xl border border-blue-100 bg-blue-50/50 px-4 py-3">
            <span className="text-xs font-bold text-blue-800">How to use:</span>
            <span className="text-xs text-blue-700">Click <strong>Need to Send</strong> to prepare invoices.</span>
            <span className="text-blue-300">→</span>
            <span className="text-xs text-blue-700">Click <strong>Invoice Sent</strong> after sending.</span>
            <span className="text-blue-300">→</span>
            <span className="text-xs text-blue-700">Follow <strong>Payment Pending</strong> until payment is received.</span>
          </div>
        </section>

        {/* Action queue */}
        <section className="mb-6 overflow-hidden rounded-2xl border border-amber-200 bg-white shadow-sm">
          <div className="flex flex-col gap-3 border-b border-amber-100 bg-amber-50/70 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <div>
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100 text-amber-700"><AlertIcon /></span>
                <h2 className="font-bold text-gray-950">Action Required</h2>
                <span className="rounded-full bg-amber-600 px-2.5 py-1 text-[11px] font-bold text-white">{actionRequired.length}</span>
              </div>
              <p className="mt-1 pl-10 text-xs text-gray-500">Start here each time you open Invoice Management.</p>
            </div>
            <button type="button" onClick={() => quickFilter("Need to Send Invoice")} className="rounded-lg bg-white px-3.5 py-2 text-xs font-bold text-amber-700 ring-1 ring-amber-200 transition hover:bg-amber-100">
              Show invoices to send
            </button>
          </div>

          {actionRequired.length === 0 ? (
            <div className="px-6 py-10 text-center">
              <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-emerald-50 text-emerald-600"><CheckIcon /></div>
              <p className="mt-3 text-sm font-bold text-gray-800">Everything is up to date</p>
              <p className="mt-1 text-xs text-gray-500">No invoice or payment action is currently outstanding.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {actionRequiredVisible.map((invoice) => {
                const invoiceState = getInvoiceStatus(invoice.invoiceStatus);
                const paymentState = getPaymentStatus(invoice.paymentStatus);
                return (
                  <div key={invoice.id} className="px-5 py-4 transition hover:bg-gray-50 sm:px-6">
                    <div className="grid gap-4 lg:grid-cols-[1.6fr_1fr_auto] lg:items-center">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="truncate text-sm font-bold text-gray-900">{invoice.customer}</p>
                          <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ring-1 ring-inset ${invoiceState.className}`}>{invoiceState.label}</span>
                          <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ring-1 ring-inset ${paymentState.className}`}>{paymentState.label}</span>
                        </div>
                        <p className="mt-1 truncate text-xs text-gray-500">{invoice.product}</p>
                        <p className="mt-1 text-xs text-gray-400">PO: {invoice.poNumber || "Not Set"} · {formatDate(invoice.date)}</p>
                      </div>
                      <div className="grid grid-cols-2 gap-4 sm:max-w-sm">
                        <div><p className="text-[10px] font-bold uppercase tracking-wide text-gray-400">Invoice Amount</p><p className="mt-1 text-sm font-bold text-gray-900">{formatCurrency(invoice.revenue)}</p></div>
                        <div><p className="text-[10px] font-bold uppercase tracking-wide text-gray-400">Quantity</p><p className="mt-1 text-sm font-bold text-gray-900">{invoice.quantity.toLocaleString("en-IN")}</p></div>
                      </div>
                      <div className="flex shrink-0 gap-2 lg:justify-end">
                        <button type="button" onClick={() => setSelectedInvoice(invoice)} className="rounded-lg border border-gray-200 bg-white px-3.5 py-2 text-xs font-bold text-gray-700 hover:bg-gray-50">View</button>
                        {canEditTransactions && <a href={`/tracker/${invoice.id}/edit`} className="rounded-lg bg-blue-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-blue-700">Update</a>}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Register */}
        <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-200 px-5 py-5 sm:px-6">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-lg font-bold tracking-tight">Invoice Register</h2>
                  <span className="rounded-md bg-gray-100 px-2.5 py-1 text-[11px] font-bold text-gray-600">{filteredInvoices.length} shown</span>
                </div>
                <p className="mt-1 text-sm text-gray-500">Complete invoice details from the CSP Tracker, including PO, product, pricing and payment status.</p>
              </div>
              {hasFilters && <button type="button" onClick={clearFilters} className="self-start rounded-lg px-3 py-2 text-xs font-bold text-blue-600 hover:bg-blue-50 lg:self-auto">Clear filters</button>}
            </div>

            <div className="mt-5 rounded-xl border border-gray-200 bg-gray-50/70 p-3">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
                <div className="relative xl:col-span-1">
                  <SearchIcon />
                  <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search customer, PO, product..." className="h-11 w-full rounded-xl border border-gray-200 bg-white pl-10 pr-4 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50" />
                </div>
                <StyledSelect label="Invoice Status" value={invoiceStatus} onChange={setInvoiceStatus} options={invoiceStatuses} />
                <StyledSelect label="Payment Status" value={paymentStatus} onChange={setPaymentStatus} options={paymentStatuses} />
                <StyledSelect label="Distributor" value={distributor} onChange={setDistributor} options={distributors} />
                <StyledSelect label="Transaction Type" value={transactionType} onChange={setTransactionType} options={transactionTypes} />
              </div>
            </div>
          </div>

          {loading ? <LoadingState /> : filteredInvoices.length === 0 ? <EmptyState clearFilters={clearFilters} /> : (
            <div className="overflow-x-auto">
              <table className="min-w-[1750px] w-full">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50/95">
                    <TableHeader>Date</TableHeader>
                    <TableHeader>Customer / PO</TableHeader>
                    <TableHeader>Product / Period</TableHeader>
                    <TableHeader>Distributor</TableHeader>
                    <TableHeader>Type</TableHeader>
                    <TableHeader align="right">Qty</TableHeader>
                    <TableHeader align="right">Invoice Amount</TableHeader>
                    <TableHeader>Invoice Status</TableHeader>
                    <TableHeader>Payment Status</TableHeader>
                    <TableHeader>Remarks</TableHeader>
                    <th className="sticky right-0 z-20 border-l border-gray-200 bg-gray-50 px-5 py-4 text-center text-[11px] font-bold uppercase tracking-wide text-gray-500">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredInvoices.map((invoice) => {
                    const invoiceState = getInvoiceStatus(invoice.invoiceStatus);
                    const paymentState = getPaymentStatus(invoice.paymentStatus);
                    return (
                      <tr key={invoice.id} className="group border-b border-gray-100 hover:bg-blue-50/30">
                        <td className="whitespace-nowrap px-5 py-4 text-sm text-gray-600">{formatDate(invoice.date)}</td>
                        <td className="max-w-[250px] px-5 py-4"><p className="truncate text-sm font-bold text-gray-900">{invoice.customer}</p><p className="mt-1 text-xs text-gray-500">PO: {invoice.poNumber || "Not Set"}</p></td>
                        <td className="max-w-[330px] px-5 py-4"><p className="truncate text-sm text-gray-800">{invoice.product}</p><p className="mt-1 truncate text-xs text-gray-500">{invoice.periodLabel || "Subscription period not set"}{invoice.prorateDays ? ` · ${invoice.prorateDays} days` : ""}</p></td>
                        <td className="px-5 py-4 text-sm text-gray-700">{invoice.distributor || "Not Assigned"}</td>
                        <td className="px-5 py-4"><span className="rounded-md bg-gray-100 px-2.5 py-1.5 text-xs font-semibold text-gray-600">{invoice.transactionType || "Not Set"}</span></td>
                        <td className="whitespace-nowrap px-5 py-4 text-right text-sm font-bold">{invoice.quantity.toLocaleString("en-IN")}</td>
                        <td className="whitespace-nowrap px-5 py-4 text-right text-sm font-bold text-blue-700">{formatCurrency(invoice.revenue)}</td>
                        <td className="whitespace-nowrap px-5 py-4"><span className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-bold ring-1 ring-inset ${invoiceState.className}`}><span className={`h-1.5 w-1.5 rounded-full ${invoiceState.dot}`} />{invoiceState.label}</span></td>
                        <td className="whitespace-nowrap px-5 py-4"><span className={`inline-flex rounded-full px-3 py-1.5 text-xs font-bold ring-1 ring-inset ${paymentState.className}`}>{paymentState.label}</span></td>
                        <td className="max-w-[250px] px-5 py-4"><p title={invoice.remarks || ""} className="truncate text-sm text-gray-500">{invoice.remarks || "—"}</p></td>
                        <td className="sticky right-0 z-10 border-l border-gray-100 bg-white px-4 py-4 text-center shadow-[-8px_0_12px_-12px_rgba(15,23,42,0.25)] group-hover:bg-blue-50/70">
                          <div className="flex justify-center gap-2">
                            <button type="button" onClick={() => setSelectedInvoice(invoice)} className="rounded-lg bg-blue-50 px-3 py-2 text-xs font-bold text-blue-700 hover:bg-blue-100">View</button>
                            {canEditTransactions && <a href={`/tracker/${invoice.id}/edit`} className="rounded-lg bg-amber-50 px-3 py-2 text-xs font-bold text-amber-700 hover:bg-amber-100">Update</a>}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {!loading && filteredInvoices.length > 0 && <div className="flex flex-col gap-2 border-t border-gray-200 bg-gray-50/50 px-5 py-4 text-xs text-gray-500 sm:flex-row sm:justify-between"><span>Showing <strong className="text-gray-700">{filteredInvoices.length}</strong> of <strong className="text-gray-700">{invoices.length}</strong> records</span><span>Invoice data is synchronized with CSP Tracker transactions.</span></div>}
        </section>
      </div>

      {selectedInvoice && <InvoiceModal invoice={selectedInvoice} onClose={() => setSelectedInvoice(null)} formatCurrency={formatCurrency} formatDate={formatDate} getInvoiceStatus={getInvoiceStatus} getPaymentStatus={getPaymentStatus} canEditTransactions={canEditTransactions} />}
    </main>
  );
}

/* -------------------------------------------------------------------------- */
/* Components                                                                 */
/* -------------------------------------------------------------------------- */

function StatusCard({
  label,
  count,
  value,
  tone,
  active,
  onClick,
  icon,
}: {
  label: string;
  count: number;
  value: string;
  tone: "amber" | "green" | "red" | "blue" | "gray";
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
}) {
  const styles = {
    amber: "border-amber-200 bg-amber-50/50 text-amber-700",
    green: "border-emerald-200 bg-emerald-50/50 text-emerald-700",
    red: "border-red-200 bg-red-50/50 text-red-700",
    blue: "border-blue-200 bg-blue-50/50 text-blue-700",
    gray: "border-gray-200 bg-gray-50 text-gray-600",
  }[tone];

  return (
    <button type="button" onClick={onClick} className={`rounded-xl border p-4 text-left transition hover:-translate-y-0.5 hover:shadow-sm ${styles} ${active ? "ring-2 ring-blue-500 ring-offset-1" : ""}`}>
      <div className="flex items-start justify-between gap-3">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/80">{icon}</span>
        <span className="text-2xl font-bold text-gray-950">{count.toLocaleString("en-IN")}</span>
      </div>
      <p className="mt-3 text-sm font-bold text-gray-800">{label}</p>
      <p className="mt-1 text-xs font-semibold text-gray-500">{value}</p>
    </button>
  );
}

function KpiCard({
  title,
  value,
  subtitle,
  icon,
  iconClass,
}: {
  title: string;
  value: string;
  subtitle: string;
  icon: React.ReactNode;
  iconClass: string;
}) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-gray-300 hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-xs font-bold uppercase tracking-wide text-gray-500">
            {title}
          </p>

          <p className="mt-3 truncate text-xl font-bold tracking-tight text-gray-950 sm:text-2xl">
            {value}
          </p>

          <p className="mt-1 truncate text-xs text-gray-400">{subtitle}</p>
        </div>

        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${iconClass}`}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}

function StyledSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
}) {
  return (
    <div>
      <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wide text-gray-500">
        {label}
      </label>

      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-11 w-full rounded-xl border border-gray-200 bg-gray-50 px-3 text-sm font-medium text-gray-700 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-50"
      >
        <option value="All">All</option>

        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </div>
  );
}

function TableHeader({
  children,
  align = "left",
}: {
  children: React.ReactNode;
  align?: "left" | "right";
}) {
  return (
    <th
      className={`whitespace-nowrap px-5 py-4 text-${align} text-xs font-bold uppercase tracking-wide text-gray-500`}
    >
      {children}
    </th>
  );
}

function LoadingState() {
  return (
    <div className="flex min-h-[420px] flex-col items-center justify-center">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600" />

      <p className="mt-4 text-sm font-semibold text-gray-500">
        Loading invoice records...
      </p>
    </div>
  );
}

function EmptyState({ clearFilters }: { clearFilters: () => void }) {
  return (
    <div className="flex min-h-[420px] flex-col items-center justify-center px-6 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-100 text-gray-400">
        <DocumentIcon />
      </div>

      <h3 className="mt-5 text-base font-bold text-gray-900">
        No invoice records found
      </h3>

      <p className="mt-2 max-w-md text-sm leading-6 text-gray-500">
        No transactions match the current search or filter selection.
      </p>

      <button
        type="button"
        onClick={clearFilters}
        className="mt-5 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-blue-700"
      >
        Clear Filters
      </button>
    </div>
  );
}

function InvoiceModal({
  invoice,
  onClose,
  formatCurrency,
  formatDate,
  getInvoiceStatus,
  getPaymentStatus,
  canEditTransactions,
}: {
  invoice: Invoice;
  onClose: () => void;
  formatCurrency: (value: number) => string;
  formatDate: (value: string | null) => string;
  getInvoiceStatus: (status: string | null) => {
    label: string;
    className: string;
    dot: string;
  };
  getPaymentStatus: (status: string | null) => {
    label: string;
    className: string;
  };
  canEditTransactions: boolean;
}) {
  const invoiceState = getInvoiceStatus(invoice.invoiceStatus);
  const paymentState = getPaymentStatus(invoice.paymentStatus);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-gray-950/50 p-4 backdrop-blur-sm sm:p-6"
      onClick={onClose}
    >
      <div
        className="max-h-[92vh] w-full max-w-5xl overflow-hidden rounded-2xl bg-white shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-start justify-between border-b border-gray-200 px-5 py-5 sm:px-7">
          <div className="min-w-0">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <DocumentIcon />
              </div>

              <div>
                <h2 className="text-lg font-bold text-gray-950 sm:text-xl">
                  Invoice Record
                </h2>

                <p className="mt-0.5 text-xs text-gray-400">
                  Transaction #{invoice.id}
                  {invoice.sourceRow
                    ? ` • Excel Row ${invoice.sourceRow}`
                    : ""}
                </p>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="ml-4 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-500 transition hover:bg-gray-200 hover:text-gray-700"
            aria-label="Close"
          >
            <CloseIcon />
          </button>
        </div>

        {/* Modal Body */}
        <div className="max-h-[calc(92vh-145px)] overflow-y-auto p-5 sm:p-7">
          {/* Status Banner */}
          <div className="mb-6 flex flex-col gap-4 rounded-2xl border border-gray-200 bg-gray-50 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-gray-400">
                Invoice Status
              </p>

              <span
                className={`mt-2 inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-bold ring-1 ring-inset ${invoiceState.className}`}
              >
                <span
                  className={`h-1.5 w-1.5 rounded-full ${invoiceState.dot}`}
                />
                {invoiceState.label}
              </span>
            </div>

            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-gray-400">
                Payment Status
              </p>

              <span
                className={`mt-2 inline-flex rounded-full px-3 py-1.5 text-xs font-bold ring-1 ring-inset ${paymentState.className}`}
              >
                {paymentState.label}
              </span>
            </div>
          </div>

          {/* Main Information */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <DetailCard label="Customer" value={invoice.customer} />

            <DetailCard label="Product" value={invoice.product} />

            <DetailCard label="Date" value={formatDate(invoice.date)} />

            <DetailCard
              label="PO Number"
              value={invoice.poNumber || "Not available"}
            />

            <DetailCard
              label="Distributor"
              value={invoice.distributor || "Not assigned"}
            />

            <DetailCard
              label="Transaction Type"
              value={invoice.transactionType || "Not set"}
            />

            <DetailCard
              label="Quantity"
              value={invoice.quantity.toLocaleString("en-IN")}
            />

            <DetailCard
              label="Buy Price"
              value={formatCurrency(invoice.buyPrice)}
            />

            <DetailCard
              label="Sell Price"
              value={formatCurrency(invoice.sellPrice)}
            />

            <DetailCard
              label="Prorate Price"
              value={
                invoice.proratePrice !== null
                  ? formatCurrency(invoice.proratePrice)
                  : "Not applicable"
              }
            />

            <DetailCard
              label="Revenue"
              value={formatCurrency(invoice.revenue)}
              valueClass="text-blue-700"
            />

            <DetailCard
              label="P/L"
              value={formatCurrency(invoice.profit)}
              valueClass="text-emerald-700"
            />

            <DetailCard
              label="Prorate Days"
              value={
                invoice.prorateDays !== null
                  ? invoice.prorateDays.toString()
                  : "—"
              }
            />

            <DetailCard
              label="Subscription Start"
              value={formatDate(invoice.subscriptionStart)}
            />

            <DetailCard
              label="Subscription End"
              value={formatDate(invoice.subscriptionEnd)}
            />

            <DetailCard
              label="Billing Period"
              value={invoice.periodLabel || "—"}
            />
          </div>

          {/* Remarks */}
          <div className="mt-5">
            <p className="mb-2 text-xs font-bold uppercase tracking-wide text-gray-400">
              Remarks
            </p>

            <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-4 text-sm leading-6 text-gray-700">
              {invoice.remarks || "No remarks available."}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex flex-col-reverse gap-3 border-t border-gray-200 bg-gray-50/70 px-5 py-4 sm:flex-row sm:justify-end sm:px-7">
          <button
            type="button"
            onClick={onClose}
            className="h-11 rounded-xl border border-gray-300 bg-white px-5 text-sm font-bold text-gray-600 transition hover:bg-gray-50"
          >
            Close
          </button>

          {canEditTransactions && (
            <a
              href={`/tracker/${invoice.id}/edit`}
              className="inline-flex h-11 items-center justify-center rounded-xl bg-blue-600 px-5 text-sm font-bold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-blue-700 hover:shadow-md"
            >
              Edit Transaction
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

function DetailCard({
  label,
  value,
  valueClass = "text-gray-900",
}: {
  label: string;
  value: string;
  valueClass?: string;
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-gray-50/60 p-4 transition hover:border-gray-300 hover:bg-white">
      <p className="text-[11px] font-bold uppercase tracking-wide text-gray-400">
        {label}
      </p>

      <p className={`mt-2 break-words text-sm font-bold ${valueClass}`}>
        {value}
      </p>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

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

/* -------------------------------------------------------------------------- */
/* Icons                                                                      */
/* -------------------------------------------------------------------------- */

function DocumentIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <path d="M14 2v6h6" />
      <path d="M8 13h8" />
      <path d="M8 17h6" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg
      width="19"
      height="19"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m5 12 4 4L19 6" />
    </svg>
  );
}

function AlertIcon() {
  return (
    <svg
      width="19"
      height="19"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M10.3 3.9 2.5 17a2 2 0 0 0 1.7 3h15.6a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />
      <path d="M12 9v4" />
      <path d="M12 17h.01" />
    </svg>
  );
}

function MinusIcon() {
  return (
    <svg
      width="19"
      height="19"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    >
      <path d="M5 12h14" />
    </svg>
  );
}

function RevenueIcon() {
  return (
    <svg
      width="19"
      height="19"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 2v20" />
      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7H14a3.5 3.5 0 0 1 0 7H6" />
    </svg>
  );
}

function ProfitIcon() {
  return (
    <svg
      width="19"
      height="19"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 3v18h18" />
      <path d="m7 16 4-5 3 3 5-7" />
    </svg>
  );
}

function RefreshIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M20 11a8.1 8.1 0 0 0-15.5-2M4 5v4h4" />
      <path d="M4 13a8.1 8.1 0 0 0 15.5 2M20 19v-4h-4" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg
      className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    >
      <path d="M6 6l12 12M18 6 6 18" />
    </svg>
  );
}
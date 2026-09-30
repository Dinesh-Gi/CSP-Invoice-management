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
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function formatDate(value: string | null) {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "-";

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function getInvoiceStatus(status: string | null) {
  const value = status?.trim().toLowerCase();

  if (value === "invoice sent") {
    return {
      label: "Invoice Sent",
      className: "bg-emerald-50 text-emerald-700 ring-emerald-200",
      dot: "bg-emerald-500",
    };
  }

  if (value === "need to send invoice") {
    return {
      label: "Need to Send",
      className: "bg-amber-50 text-amber-700 ring-amber-200",
      dot: "bg-amber-500",
    };
  }

  if (value === "credit note") {
    return {
      label: "Credit Note",
      className: "bg-violet-50 text-violet-700 ring-violet-200",
      dot: "bg-violet-500",
    };
  }

  if (value === "hold") {
    return {
      label: "Hold",
      className: "bg-red-50 text-red-700 ring-red-200",
      dot: "bg-red-500",
    };
  }

  return {
    label: "Not Set",
    className: "bg-gray-50 text-gray-600 ring-gray-200",
    dot: "bg-gray-400",
  };
}

function getPaymentStatus(status: string | null) {
  const value = status?.trim().toLowerCase();

  if (value === "yes") {
    return {
      label: "Paid",
      className: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    };
  }

  if (value === "no") {
    return {
      label: "Pending",
      className: "bg-red-50 text-red-700 ring-red-200",
    };
  }

  if (value === "not applicable") {
    return {
      label: "N/A",
      className: "bg-gray-50 text-gray-600 ring-gray-200",
    };
  }

  return {
    label: "Not Set",
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
      invoices
        .filter(
          (item) =>
            item.invoiceStatus?.trim().toLowerCase() !== "invoice sent" ||
            item.paymentStatus?.trim().toLowerCase() === "no"
        )
        .slice(0, 6),
    [invoices]
  );

  if (checkingRole) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-sm font-medium text-gray-500">Loading invoices...</div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#f8f7f3] text-slate-950">
      <div className="mx-auto w-full max-w-[1800px] px-5 py-5 sm:px-6 lg:px-8 xl:px-10">
        <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="mb-1.5 flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-[0.2em] text-amber-600">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
              Finance / Invoice Desk
            </div>

            <p className="text-sm font-medium text-slate-500">
              {summary.totalInvoices.toLocaleString("en-IN")} invoice records · track sending and payment progress
            </p>
          </div>

          <button
            type="button"
            onClick={loadInvoices}
            className="zeit-btn h-10 bg-[#f59e0b] px-4 text-white shadow-[0_6px_16px_rgba(245,158,11,0.18)] hover:bg-[#d97706] hover:shadow-[0_8px_20px_rgba(245,158,11,0.23)]"
          >
            <RefreshIcon />
            Refresh Data
          </button>
        </div>

        <section className="zeit-metric-strip mb-5">
          <div className="zeit-metric-grid xl:grid-cols-6">
            <KpiCard title="Invoice Value" value={formatCompactCurrency(summary.totalRevenue)} subtitle={`${summary.totalInvoices} records`} icon={<RevenueIcon />} iconClass="bg-amber-50 text-amber-600 ring-1 ring-amber-100 ring-blue-100" />
            <KpiCard title="Invoice Sent" value={invoiceSentCount.toLocaleString("en-IN")} subtitle="Completed" icon={<CheckIcon />} iconClass="bg-emerald-50 text-emerald-600 ring-emerald-100" />
            <KpiCard title="Need to Send" value={needToSendCount.toLocaleString("en-IN")} subtitle="Action required" icon={<AlertIcon />} iconClass="bg-amber-50 text-amber-600 ring-amber-100" />
            <KpiCard title="Payment Pending" value={paymentPendingCount.toLocaleString("en-IN")} subtitle="Awaiting collection" icon={<AlertIcon />} iconClass="bg-red-50 text-red-600 ring-red-100" />
            <KpiCard title="Payment Received" value={paymentReceivedCount.toLocaleString("en-IN")} subtitle="Confirmed paid" icon={<CheckIcon />} iconClass="bg-emerald-50 text-emerald-600 ring-emerald-100" />
            <KpiCard title="Missing Status" value={(invoiceNotSetCount + paymentNotSetCount).toLocaleString("en-IN")} subtitle={`${invoiceNotSetCount} invoice · ${paymentNotSetCount} payment`} icon={<MinusIcon />} iconClass="bg-slate-50 text-slate-500 ring-slate-200" />
          </div>
        </section>

        <section className="mb-6 grid grid-cols-1 gap-6 xl:grid-cols-[1.5fr_1fr]">
          <div className="overflow-hidden rounded-2xl border border-amber-200/80 bg-white shadow-[0_8px_26px_rgba(15,23,42,0.045)]">
            <div className="flex items-center justify-between border-b border-amber-100 bg-[#fffaf0] px-5 py-3.5">
              <div>
                <h2 className="font-bold text-gray-950">Action Required</h2>
                <p className="mt-1 text-xs text-gray-500">Invoices that are not sent or payments still pending.</p>
              </div>
              <button type="button" onClick={() => { setInvoiceStatus("Need to Send Invoice"); setPaymentStatus("All"); }} className="zeit-btn h-9 bg-white px-3 text-xs font-extrabold text-amber-700 ring-1 ring-amber-200 hover:bg-amber-50">View Need to Send</button>
            </div>
            <div className="divide-y divide-slate-100">
              {actionRequired.length === 0 ? (
                <div className="p-8 text-center text-sm text-gray-500">No invoice actions currently require attention.</div>
              ) : actionRequired.map((invoice) => {
                const invoiceState = getInvoiceStatus(invoice.invoiceStatus);
                const paymentState = getPaymentStatus(invoice.paymentStatus);
                return (
                  <div key={invoice.id} className="flex flex-col gap-3 px-5 py-3.5 sm:flex-row sm:items-center sm:justify-between hover:bg-slate-50">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate text-sm font-bold text-gray-900">{invoice.customer}</p>
                        <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ring-1 ring-inset ${invoiceState.className}`}>{invoiceState.label}</span>
                        <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ring-1 ring-inset ${paymentState.className}`}>{paymentState.label}</span>
                      </div>
                      <p className="mt-1 truncate text-xs text-gray-500">{invoice.product} · PO {invoice.poNumber || "Not Set"}</p>
                    </div>
                    <div className="flex shrink-0 items-center gap-3">
                      <span className="text-sm font-bold text-gray-900">{formatCurrency(invoice.revenue)}</span>
                      <button type="button" onClick={() => setSelectedInvoice(invoice)} className="inline-flex h-8 items-center rounded-lg bg-blue-50 px-3 text-xs font-extrabold text-blue-700 ring-1 ring-blue-100 hover:-translate-y-px hover:bg-blue-100">View</button>
                      {canEditTransactions && <a href={`/tracker/${invoice.id}/edit`} className="inline-flex h-8 items-center rounded-lg bg-amber-50 px-3 text-xs font-extrabold text-amber-700 ring-1 ring-amber-100 hover:-translate-y-px hover:bg-amber-100">Update</a>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_8px_26px_rgba(15,23,42,0.045)]">
            <div className="mb-4">
              <h2 className="font-bold text-gray-950">Invoice Workflow</h2>
              <p className="mt-1 text-xs text-gray-500">Quick view of the current billing pipeline.</p>
            </div>
            <div className="space-y-3">
              <WorkflowRow label="Need to Send" count={needToSendCount} onClick={() => { setInvoiceStatus("Need to Send Invoice"); setPaymentStatus("All"); }} tone="amber" />
              <WorkflowRow label="Invoice Sent" count={invoiceSentCount} onClick={() => { setInvoiceStatus("Invoice Sent"); setPaymentStatus("All"); }} tone="green" />
              <WorkflowRow label="Payment Pending" count={paymentPendingCount} onClick={() => { setInvoiceStatus("All"); setPaymentStatus("No"); }} tone="red" />
              <WorkflowRow label="Payment Received" count={paymentReceivedCount} onClick={() => { setInvoiceStatus("All"); setPaymentStatus("Yes"); }} tone="blue" />
              <WorkflowRow label="Missing Status" count={invoiceNotSetCount + paymentNotSetCount} onClick={() => { setInvoiceStatus("Not Set"); setPaymentStatus("Not Set"); }} tone="gray" />
            </div>
          </div>
        </section>

        <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_10px_32px_rgba(15,23,42,0.05)]">
          <div className="border-b border-slate-100 px-5 py-3.5 sm:px-6">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
              <div>
                <h2 className="text-lg font-bold tracking-tight">Invoice Register</h2>
                <p className="mt-1 text-sm text-gray-500">Detailed invoice and payment tracking linked to CSP transactions.</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="rounded-lg bg-slate-50 px-3 py-2 text-xs font-extrabold text-slate-500 ring-1 ring-slate-200">{filteredInvoices.length} records</span>
                {hasFilters && <button type="button" onClick={clearFilters} className="zeit-btn h-9 px-3 text-xs text-blue-700">Clear filters</button>}
              </div>
            </div>

            <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
              <div className="relative xl:col-span-1">
                <SearchIcon />
                <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Customer, PO, product, distributor..." className="zeit-input h-11 w-full pl-10 pr-4 text-sm" />
              </div>
              <StyledSelect label="Invoice Status" value={invoiceStatus} onChange={setInvoiceStatus} options={["All", ...invoiceStatuses]} />
              <StyledSelect label="Payment Status" value={paymentStatus} onChange={setPaymentStatus} options={["All", ...paymentStatuses]} />
              <StyledSelect label="Distributor" value={distributor} onChange={setDistributor} options={["All", ...distributors]} />
              <StyledSelect label="Transaction Type" value={transactionType} onChange={setTransactionType} options={["All", ...transactionTypes]} />
            </div>
          </div>

          {loading ? <LoadingState /> : filteredInvoices.length === 0 ? <EmptyState clearFilters={clearFilters} /> : (
            <div className="overflow-x-auto">
              <table className="min-w-[1750px] w-full">
                <thead>
                  <tr className="border-b border-slate-200/80 bg-[#fafaf8]">
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
                    <th className="sticky right-0 z-20 border-l border-slate-200/80 bg-gray-50 px-5 py-3.5 text-center text-[11px] font-bold uppercase tracking-wide text-gray-500">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredInvoices.map((invoice) => {
                    const invoiceState = getInvoiceStatus(invoice.invoiceStatus);
                    const paymentState = getPaymentStatus(invoice.paymentStatus);
                    return (
                      <tr key={invoice.id} className="group border-b border-slate-100 hover:bg-amber-50/25">
                        <td className="whitespace-nowrap px-5 py-3.5 text-sm text-gray-600">{formatDate(invoice.date)}</td>
                        <td className="max-w-[250px] px-5 py-3.5"><p className="truncate text-sm font-bold text-gray-900">{invoice.customer}</p><p className="mt-1 text-xs text-gray-500">PO: {invoice.poNumber || "Not Set"}</p></td>
                        <td className="max-w-[330px] px-5 py-3.5"><p className="truncate text-sm text-gray-800">{invoice.product}</p><p className="mt-1 truncate text-xs text-gray-500">{invoice.periodLabel || "Subscription period not set"}{invoice.prorateDays ? ` · ${invoice.prorateDays} days` : ""}</p></td>
                        <td className="px-5 py-3.5 text-sm text-gray-700">{invoice.distributor || "Not Assigned"}</td>
                        <td className="px-5 py-3.5"><span className="rounded-md bg-gray-100 px-2.5 py-1.5 text-xs font-semibold text-gray-600">{invoice.transactionType || "Not Set"}</span></td>
                        <td className="whitespace-nowrap px-5 py-3.5 text-right text-sm font-bold">{invoice.quantity.toLocaleString("en-IN")}</td>
                        <td className="whitespace-nowrap px-5 py-3.5 text-right text-sm font-bold text-blue-700">{formatCurrency(invoice.revenue)}</td>
                        <td className="whitespace-nowrap px-5 py-3.5"><span className={`inline-flex items-center gap-2 rounded-full px-2.5 py-1 text-[11px] font-extrabold ring-1 ring-inset ${invoiceState.className}`}><span className={`h-1.5 w-1.5 rounded-full ${invoiceState.dot}`} />{invoiceState.label}</span></td>
                        <td className="whitespace-nowrap px-5 py-3.5"><span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-extrabold ring-1 ring-inset ${paymentState.className}`}>{paymentState.label}</span></td>
                        <td className="max-w-[250px] px-5 py-3.5"><p title={invoice.remarks || ""} className="truncate text-sm text-gray-500">{invoice.remarks || "—"}</p></td>
                        <td className="sticky right-0 z-10 border-l border-slate-100 bg-white px-4 py-3.5 text-center shadow-[-8px_0_12px_-12px_rgba(15,23,42,0.25)] group-hover:bg-amber-50/60">
                          <div className="flex justify-center gap-2">
                            <button type="button" onClick={() => setSelectedInvoice(invoice)} className="inline-flex h-8 items-center rounded-lg bg-blue-50 px-3 text-xs font-extrabold text-blue-700 ring-1 ring-blue-100 hover:-translate-y-px hover:bg-blue-100">View</button>
                            {canEditTransactions && <a href={`/tracker/${invoice.id}/edit`} className="inline-flex h-8 items-center rounded-lg bg-amber-50 px-3 text-xs font-extrabold text-amber-700 ring-1 ring-amber-100 hover:-translate-y-px hover:bg-amber-100">Update</a>}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {!loading && filteredInvoices.length > 0 && <div className="flex flex-col gap-2 border-t border-slate-200/80 bg-gray-50/50 px-5 py-3.5 text-xs text-gray-500 sm:flex-row sm:justify-between"><span>Showing <strong className="text-gray-700">{filteredInvoices.length}</strong> of <strong className="text-gray-700">{invoices.length}</strong> records</span><span>Invoice data is synchronized with CSP Tracker transactions.</span></div>}
        </section>
      </div>

      {selectedInvoice && <InvoiceModal invoice={selectedInvoice} onClose={() => setSelectedInvoice(null)} formatCurrency={formatCurrency} formatDate={formatDate} getInvoiceStatus={getInvoiceStatus} getPaymentStatus={getPaymentStatus} canEditTransactions={canEditTransactions} />}
    </main>
  );
}

/* -------------------------------------------------------------------------- */
/* Components                                                                 */
/* -------------------------------------------------------------------------- */

function WorkflowRow({
  label,
  count,
  onClick,
  tone,
}: {
  label: string;
  count: number;
  onClick: () => void;
  tone: "amber" | "green" | "red" | "blue" | "gray";
}) {
  const toneClass = {
    amber: "bg-amber-50 text-amber-700 ring-amber-100",
    green: "bg-emerald-50 text-emerald-700 ring-emerald-100",
    red: "bg-red-50 text-red-700 ring-red-100",
    blue: "bg-blue-50 text-blue-700 ring-blue-100",
    gray: "bg-gray-50 text-gray-600 ring-gray-200",
  }[tone];

  return (
    <button type="button" onClick={onClick} className="flex w-full items-center justify-between rounded-xl border border-slate-200/80 bg-white px-4 py-3 text-left transition-all duration-150 hover:-translate-y-px hover:border-blue-100 hover:bg-amber-50/25 hover:shadow-sm">
      <span className="text-sm font-semibold text-gray-700">{label}</span>
      <span className={`rounded-lg px-3 py-1.5 text-xs font-bold ring-1 ${toneClass}`}>{count.toLocaleString("en-IN")}</span>
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
    <div className="zeit-metric group">
      <div className={`zeit-metric-icon ring-1 ${iconClass} transition-transform duration-200 group-hover:scale-105`}>
        {icon}
      </div>

      <div className="min-w-0">
        <p className="zeit-metric-label">{title}</p>
        <p className="zeit-metric-value">{value}</p>
        <p className="zeit-metric-hint">{subtitle}</p>
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
        className="zeit-input h-11 w-full px-3 text-sm"
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
      className={`whitespace-nowrap px-5 py-3.5 text-${align} text-[10px] font-extrabold uppercase tracking-[0.08em] text-slate-500`}
    >
      {children}
    </th>
  );
}

function LoadingState() {
  return (
    <div className="flex min-h-[420px] flex-col items-center justify-center">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200/80 border-t-blue-600" />

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
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm sm:p-6"
      onClick={onClose}
    >
      <div
        className="max-h-[92vh] w-full max-w-5xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_24px_70px_rgba(15,23,42,0.18)]"
        onClick={(event) => event.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-start justify-between border-b border-slate-200/80 px-5 py-5 sm:px-7">
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
          <div className="mb-6 flex flex-col gap-4 rounded-2xl border border-slate-200/80 bg-[#fffaf0] p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-gray-400">
                Invoice Status
              </p>

              <span
                className={`mt-2 inline-flex items-center gap-2 rounded-full px-2.5 py-1 text-[11px] font-extrabold ring-1 ring-inset ${invoiceState.className}`}
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
                className={`mt-2 inline-flex rounded-full px-2.5 py-1 text-[11px] font-extrabold ring-1 ring-inset ${paymentState.className}`}
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

            <div className="rounded-xl border border-slate-200/80 bg-gray-50 px-4 py-4 text-sm leading-6 text-gray-700">
              {invoice.remarks || "No remarks available."}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex flex-col-reverse gap-3 border-t border-slate-200/80 bg-gray-50/70 px-5 py-3.5 sm:flex-row sm:justify-end sm:px-7">
          <button
            type="button"
            onClick={onClose}
            className="h-11 rounded-xl border border-gray-300 bg-white px-5 text-sm font-bold text-gray-600 transition hover:bg-slate-50"
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
    <div className="rounded-xl border border-slate-200/80 bg-gray-50/60 p-4 transition hover:border-gray-300 hover:bg-white">
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
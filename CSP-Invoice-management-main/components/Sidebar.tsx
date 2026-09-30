"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

type SessionUser = {
  id: number;
  name: string;
  email: string;
  role: "ADMIN" | "FINANCE" | "SALES" | "MANAGEMENT" | "VIEWER" | string;
};

function Icon({ name }: { name: string }) {
  const common = {
    width: 20,
    height: 20,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.9,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };

  switch (name) {
    case "dashboard":
      return <svg {...common}><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></svg>;
    case "tracker":
      return <svg {...common}><path d="M5 5h14" /><path d="M5 9h14" /><path d="M5 13h9" /><path d="M5 17h11" /><path d="M5 21h7" /></svg>;
    case "customers":
      return <svg {...common}><circle cx="9" cy="8" r="3" /><path d="M3.5 20c.7-3.4 2.5-5 5.5-5s4.8 1.6 5.5 5" /><path d="M16 5.5a3 3 0 0 1 0 5.7" /><path d="M18 15c1.7.5 2.7 1.8 3.2 4" /></svg>;
    case "distributors":
      return <svg {...common}><rect x="4" y="4" width="16" height="16" rx="2" /><path d="M8 8h8" /><path d="M8 12h8" /><path d="M8 16h5" /></svg>;
    case "invoices":
      return <svg {...common}><path d="M6 3h9l3 3v15H6z" /><path d="M15 3v4h4" /><path d="M9 12h6" /><path d="M9 16h5" /></svg>;
    case "reports":
      return <svg {...common}><path d="M4 19V5" /><path d="M4 19h16" /><path d="M8 15v-4" /><path d="M12 15V8" /><path d="M16 15v-6" /></svg>;
    case "users":
      return <svg {...common}><circle cx="9" cy="8" r="3" /><path d="M3.5 20c.7-3.4 2.5-5 5.5-5s4.8 1.6 5.5 5" /><path d="M16 11h5" /><path d="M18.5 8.5v5" /></svg>;
    default:
      return <svg {...common}><circle cx="12" cy="12" r="8" /></svg>;
  }
}

const workspaceItems = [
  { href: "/", label: "Dashboard", icon: "dashboard" },
  { href: "/tracker", label: "CSP Tracker", icon: "tracker" },
  { href: "/customers", label: "Customers", icon: "customers" },
  { href: "/distributors", label: "Distributors", icon: "distributors" },
  { href: "/invoices", label: "Invoices", icon: "invoices" },
  { href: "/reports", label: "Reports", icon: "reports" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [user, setUser] = useState<SessionUser | null>(null);

  useEffect(() => {
    let active = true;
    fetch("/api/auth/me", { cache: "no-store" })
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => {
        if (active && data?.success && data.user) setUser(data.user);
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, []);

  const isAdmin = user?.role === "ADMIN";

  return (
    <aside className="fixed inset-y-0 left-0 z-40 flex w-72 flex-col border-r border-slate-200 bg-white shadow-[4px_0_18px_rgba(15,23,42,0.04)]">
      <div className="border-t-4 border-amber-500 px-5 pb-5 pt-6">
        <div className="flex items-center justify-center">
          <Image
            src="/ziniosedge-logo.png"
            alt="ZiniosEdge"
            width={245}
            height={72}
            priority
            className="h-auto w-[225px] object-contain"
          />
        </div>
        <p className="mt-2 pl-1 text-[12px] font-bold uppercase tracking-[0.22em] text-slate-400">
          CSP Management
        </p>
      </div>

      <div className="px-4 pb-5">
        <div className="rounded-2xl border border-amber-100 bg-[#fffaf0] px-4 py-4">
          <div className="flex items-center gap-3">
            <span className="h-3 w-3 rounded-full bg-emerald-500 shadow-[0_0_0_5px_rgba(16,185,129,0.08)]" />
            <div className="min-w-0">
              <p className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-amber-600">Workspace</p>
              <p className="truncate text-sm font-bold text-slate-700">ZEIT CSP Tracker</p>
            </div>
          </div>
        </div>
      </div>

      <nav className="min-h-0 flex-1 overflow-y-auto px-3 pb-5">
        <p className="px-2 pb-3 pt-3 text-[11px] font-extrabold uppercase tracking-[0.18em] text-slate-400">Workspace</p>
        <div className="space-y-1.5">
          {workspaceItems.map((item) => {
            const active = item.href === "/" ? pathname === "/" : pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={[
                  "group flex h-12 items-center gap-3 rounded-2xl px-3.5 text-sm font-bold transition-all",
                  active
                    ? "bg-amber-500 text-white shadow-[0_10px_22px_rgba(245,158,11,0.24)]"
                    : "text-slate-700 hover:bg-amber-50 hover:text-slate-900",
                ].join(" ")}
              >
                <span className={[
                  "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-colors",
                  active ? "bg-white/15 text-white" : "bg-slate-50 text-slate-500 group-hover:bg-white group-hover:text-amber-600",
                ].join(" ")}>
                  <Icon name={item.icon} />
                </span>
                <span>{item.label}</span>
                {active && <span className="ml-auto h-2.5 w-2.5 rounded-full bg-white" />}
              </Link>
            );
          })}
        </div>

        {isAdmin && (
          <>
            <p className="px-2 pb-3 pt-7 text-[11px] font-extrabold uppercase tracking-[0.18em] text-slate-400">Administration</p>
            <Link
              href="/users"
              className={[
                "group flex h-12 items-center gap-3 rounded-2xl px-3.5 text-sm font-bold transition-all",
                pathname === "/users" || pathname.startsWith("/users/")
                  ? "bg-amber-500 text-white shadow-[0_10px_22px_rgba(245,158,11,0.24)]"
                  : "text-slate-700 hover:bg-amber-50 hover:text-slate-900",
              ].join(" ")}
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-50 text-slate-500 group-hover:text-amber-600">
                <Icon name="users" />
              </span>
              <span>User Management</span>
            </Link>
          </>
        )}
      </nav>

      <div className="border-t border-slate-100 p-4">
        <div className="rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-3">
          <p className="text-sm font-bold text-slate-700">Microsoft CSP</p>
          <p className="mt-0.5 text-xs text-slate-500">Invoice & transaction management</p>
        </div>
      </div>
    </aside>
  );
}

"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

type SessionUser = {
  id: number;
  name: string;
  email: string;
  role:
    | "ADMIN"
    | "FINANCE"
    | "SALES"
    | "MANAGEMENT"
    | "VIEWER"
    | string;
};

type SidebarProps = {
  collapsed: boolean;
  onToggle: () => void;
};

function Icon({ name }: { name: string }) {
  const common = {
    width: 16,
    height: 16,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };

  switch (name) {
    case "dashboard":
      return (
        <svg {...common}>
          <rect x="3" y="3" width="7" height="7" rx="1" />
          <rect x="14" y="3" width="7" height="7" rx="1" />
          <rect x="3" y="14" width="7" height="7" rx="1" />
          <rect x="14" y="14" width="7" height="7" rx="1" />
        </svg>
      );

    case "tracker":
      return (
        <svg {...common}>
          <path d="M5 5h14" />
          <path d="M5 9h14" />
          <path d="M5 13h9" />
          <path d="M5 17h11" />
          <path d="M5 21h7" />
        </svg>
      );

    case "customers":
      return (
        <svg {...common}>
          <circle cx="9" cy="8" r="3" />
          <path d="M3.5 20c.7-3.4 2.5-5 5.5-5s4.8 1.6 5.5 5" />
          <path d="M16 5.5a3 3 0 0 1 0 5.7" />
          <path d="M18 15c1.7.5 2.7 1.8 3.2 4" />
        </svg>
      );

    case "distributors":
      return (
        <svg {...common}>
          <rect x="4" y="4" width="16" height="16" rx="2" />
          <path d="M8 8h8" />
          <path d="M8 12h8" />
          <path d="M8 16h5" />
        </svg>
      );

    case "invoices":
      return (
        <svg {...common}>
          <path d="M6 3h9l3 3v15H6z" />
          <path d="M15 3v4h4" />
          <path d="M9 12h6" />
          <path d="M9 16h5" />
        </svg>
      );

    case "reports":
      return (
        <svg {...common}>
          <path d="M4 19V5" />
          <path d="M4 19h16" />
          <path d="M8 15v-4" />
          <path d="M12 15V8" />
          <path d="M16 15v-6" />
        </svg>
      );

    case "users":
      return (
        <svg {...common}>
          <circle cx="9" cy="8" r="3" />
          <path d="M3.5 20c.7-3.4 2.5-5 5.5-5s4.8 1.6 5.5 5" />
          <path d="M16 11h5" />
          <path d="M18.5 8.5v5" />
        </svg>
      );

    default:
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="8" />
        </svg>
      );
  }
}

function ChevronIcon({ collapsed }: { collapsed: boolean }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {collapsed ? (
        <path d="m9 18 6-6-6-6" />
      ) : (
        <path d="m15 18-6-6 6-6" />
      )}
    </svg>
  );
}

const workspaceItems = [
  {
    href: "/",
    label: "Dashboard",
    icon: "dashboard",
  },
  {
    href: "/tracker",
    label: "CSP Tracker",
    icon: "tracker",
  },
  {
    href: "/customers",
    label: "Customers",
    icon: "customers",
  },
  {
    href: "/distributors",
    label: "Distributors",
    icon: "distributors",
  },
  {
    href: "/invoices",
    label: "Invoices",
    icon: "invoices",
  },
  {
    href: "/reports",
    label: "Reports",
    icon: "reports",
  },
];

export default function Sidebar({
  collapsed,
  onToggle,
}: SidebarProps) {
  const pathname = usePathname();

  const [user, setUser] =
    useState<SessionUser | null>(null);

  useEffect(() => {
    let active = true;

    fetch("/api/auth/me", {
      cache: "no-store",
    })
      .then((response) =>
        response.ok ? response.json() : null
      )
      .then((data) => {
        if (
          active &&
          data?.success &&
          data.user
        ) {
          setUser(data.user);
        }
      })
      .catch(() => undefined);

    return () => {
      active = false;
    };
  }, []);

  const isAdmin = user?.role === "ADMIN";

  return (
    <aside
      className={[
        "fixed inset-y-0 left-0 z-40 flex flex-col",
        "border-r border-slate-200 bg-white",
        "transition-[width] duration-200 ease-in-out",
        collapsed ? "w-[64px]" : "w-[232px]",
      ].join(" ")}
    >
      {/* BRAND */}
      <div
        className={[
          "relative border-t-[3px] border-amber-500",
          "border-b border-slate-100",
          collapsed
            ? "flex h-[58px] items-center justify-center"
            : "flex h-[58px] items-center px-4",
        ].join(" ")}
      >
        {collapsed ? (
          <div
            className="
              flex h-8 w-8 items-center justify-center
              rounded-lg bg-slate-950
              text-[11px] font-black tracking-tight text-white
            "
          >
            ZE
          </div>
        ) : (
          <Image
            src="/ziniosedge-logo.png"
            alt="ZiniosEdge"
            width={180}
            height={54}
            priority
            className="h-auto w-[165px] object-contain"
          />
        )}

        {/* COLLAPSE */}
        <button
          type="button"
          onClick={onToggle}
          aria-label={
            collapsed
              ? "Expand sidebar"
              : "Collapse sidebar"
          }
          title={
            collapsed
              ? "Expand sidebar"
              : "Collapse sidebar"
          }
          className="
            absolute right-[-11px] top-1/2
            flex h-[22px] w-[22px]
            -translate-y-1/2
            items-center justify-center
            rounded-full
            border border-slate-200
            bg-white
            text-slate-500
            shadow-sm
            transition
            hover:border-amber-300
            hover:bg-amber-50
            hover:text-amber-600
          "
        >
          <ChevronIcon collapsed={collapsed} />
        </button>
      </div>

      {/* WORKSPACE STATUS */}
      <div
        className={
          collapsed
            ? "px-2 py-2"
            : "px-3 py-2"
        }
      >
        <div
          title={
            collapsed
              ? "ZEIT CSP Tracker"
              : undefined
          }
          className={[
            "border border-amber-100 bg-[#fffaf0]",
            collapsed
              ? "flex h-8 items-center justify-center rounded-md"
              : "flex h-8 items-center gap-2 rounded-md px-2",
          ].join(" ")}
        >
          <span
            className="
              h-2 w-2 shrink-0 rounded-full
              bg-emerald-500
            "
          />

          {!collapsed && (
            <span className="truncate text-[11px] font-semibold text-slate-700">
              ZEIT CSP Tracker
            </span>
          )}
        </div>
      </div>

      {/* NAVIGATION */}
      <nav className="min-h-0 flex-1 overflow-y-auto px-2 pb-2">
        {!collapsed && (
          <p className="px-2 pb-1 pt-1 text-[9px] font-bold uppercase tracking-[0.16em] text-slate-400">
            Workspace
          </p>
        )}

        <div className="space-y-0.5">
          {workspaceItems.map((item) => {
            const active =
              item.href === "/"
                ? pathname === "/"
                : pathname === item.href ||
                  pathname.startsWith(
                    `${item.href}/`
                  );

            return (
              <Link
                key={item.href}
                href={item.href}
                title={
                  collapsed
                    ? item.label
                    : undefined
                }
                className={[
                  "group relative flex h-[34px] items-center",
                  "rounded-md text-[12px] font-medium",
                  "transition-colors duration-100",
                  collapsed
                    ? "justify-center"
                    : "gap-2 px-2",
                  active
                    ? "bg-amber-500 text-white"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-950",
                ].join(" ")}
              >
                <span
                  className={[
                    "flex h-7 w-7 shrink-0 items-center justify-center rounded-md",
                    active
                      ? "text-white"
                      : "text-slate-500 group-hover:text-amber-600",
                  ].join(" ")}
                >
                  <Icon name={item.icon} />
                </span>

                {!collapsed && (
                  <span className="truncate">
                    {item.label}
                  </span>
                )}

                {active && !collapsed && (
                  <span className="ml-auto h-1.5 w-1.5 rounded-full bg-white" />
                )}

                {active && collapsed && (
                  <span className="absolute right-1 top-1/2 h-1.5 w-1.5 -translate-y-1/2 rounded-full bg-amber-500" />
                )}
              </Link>
            );
          })}
        </div>

        {/* ADMIN */}
        {isAdmin && (
          <div className="mt-3">
            {!collapsed && (
              <p className="px-2 pb-1 pt-1 text-[9px] font-bold uppercase tracking-[0.16em] text-slate-400">
                Administration
              </p>
            )}

            <Link
              href="/users"
              title={
                collapsed
                  ? "User Management"
                  : undefined
              }
              className={[
                "group relative flex h-[34px] items-center",
                "rounded-md text-[12px] font-medium",
                "transition-colors duration-100",
                collapsed
                  ? "justify-center"
                  : "gap-2 px-2",
                pathname === "/users" ||
                pathname.startsWith("/users/")
                  ? "bg-amber-500 text-white"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-950",
              ].join(" ")}
            >
              <span
                className={[
                  "flex h-7 w-7 shrink-0 items-center justify-center rounded-md",
                  pathname === "/users" ||
                  pathname.startsWith("/users/")
                    ? "text-white"
                    : "text-slate-500 group-hover:text-amber-600",
                ].join(" ")}
              >
                <Icon name="users" />
              </span>

              {!collapsed && (
                <span>User Management</span>
              )}

              {(pathname === "/users" ||
                pathname.startsWith("/users/")) && (
                <span
                  className={
                    collapsed
                      ? "absolute right-1 top-1/2 h-1.5 w-1.5 -translate-y-1/2 rounded-full bg-amber-500"
                      : "ml-auto h-1.5 w-1.5 rounded-full bg-white"
                  }
                />
              )}
            </Link>
          </div>
        )}
      </nav>

      {/* FOOTER */}
      {!collapsed && (
        <div className="border-t border-slate-100 px-3 py-2">
          <p className="truncate text-[10px] font-medium text-slate-400">
            Microsoft CSP · Invoice Management
          </p>
        </div>
      )}
    </aside>
  );
}
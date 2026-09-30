"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import ThemeSelector from "@/components/ThemeSelector";

const pageTitles: Record<string, { title: string; description: string }> = {
  "/": {
    title: "Dashboard",
    description: "Overview of your Microsoft CSP business",
  },
  "/tracker": {
    title: "CSP Tracker",
    description: "Manage CSP transactions and invoice information",
  },
  "/tracker/add": {
    title: "Add Transaction",
    description: "Create a new CSP transaction",
  },
  "/customers": {
    title: "Customers",
    description: "Manage your customer accounts",
  },
  "/products": {
    title: "Products",
    description: "Manage licenses and products",
  },
  "/distributors": {
    title: "Distributors",
    description: "Manage backend distributors",
  },
  "/invoices": {
    title: "Invoices",
    description: "Track invoice status and payment collection",
  },
  "/payments": {
    title: "Payments",
    description: "Track payment collection",
  },
  "/renewals": {
    title: "Renewals",
    description: "Monitor upcoming renewals",
  },
  "/reports": {
    title: "Reports",
    description: "Business and financial reports",
  },
  "/users": {
    title: "User Management",
    description: "Manage application users and access",
  },
};

type LoggedInUser = {
  id: number;
  name: string;
  email: string;
  role: string;
};

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();

  const [user, setUser] = useState<LoggedInUser | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    async function loadUser() {
      try {
        const response = await fetch("/api/auth/me", {
          cache: "no-store",
        });

        if (!response.ok) return;

        const data = await response.json();

        if (data.success && data.user) {
          setUser(data.user);
        }
      } catch (error) {
        console.error("Unable to load current user:", error);
      }
    }

    loadUser();
  }, []);

  const page =
    pageTitles[pathname] ??
    pageTitles[
      Object.keys(pageTitles).find(
        (path) => path !== "/" && pathname.startsWith(path)
      ) ?? "/"
    ];

  async function handleLogout() {
    try {
      setLoggingOut(true);

      const response = await fetch("/api/auth/logout", {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Logout failed");
      }

      router.replace("/login");
      router.refresh();
    } catch (error) {
      console.error("Logout error:", error);
      alert("Unable to logout. Please try again.");
    } finally {
      setLoggingOut(false);
    }
  }

  function getInitials(name: string) {
    const parts = name.trim().split(/\s+/);

    if (parts.length === 1) {
      return parts[0].slice(0, 2).toUpperCase();
    }

    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  }

  function formatRole(role: string) {
    return role
      .toLowerCase()
      .replace(/\b\w/g, (letter) => letter.toUpperCase());
  }

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl">
      <div className="flex min-h-[78px] items-center justify-between gap-6 px-6 py-3 lg:px-8">
        {/* Page Title */}
        <div className="min-w-0">
          <div className="mb-1.5 flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-blue-600" />

            <span className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-blue-600">
              ZEIT CSP
            </span>
          </div>

          <h1 className="truncate text-xl font-extrabold tracking-tight text-slate-950 sm:text-2xl">
            {page.title}
          </h1>

          <p className="mt-0.5 hidden text-sm text-slate-500 sm:block">
            {page.description}
          </p>
        </div>

        {/* Right Side */}
        <div className="flex shrink-0 items-center gap-2.5 sm:gap-3">
          {/* Theme Selector */}
          <ThemeSelector />

          {/* Notifications */}
          <button
            type="button"
            aria-label="Notifications"
            className="group relative flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-500 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600 hover:shadow-md"
          >
            <BellIcon />

            <span className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white" />
          </button>

          {/* User Profile */}
          <div className="hidden items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50/70 px-3 py-2 sm:flex">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-cyan-500 text-sm font-extrabold text-white shadow-sm">
              {user ? getInitials(user.name) : "U"}
            </div>

            <div className="min-w-0">
              <p className="max-w-[150px] truncate text-sm font-bold text-slate-900">
                {user?.name ?? "User"}
              </p>

              <p className="mt-0.5 text-[11px] font-semibold text-slate-500">
                {user ? formatRole(user.role) : "CSP Management"}
              </p>
            </div>
          </div>

          {/* Logout */}
          <button
            type="button"
            onClick={handleLogout}
            disabled={loggingOut}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-red-200 bg-red-50 px-3.5 text-sm font-bold text-red-600 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-red-300 hover:bg-red-100 hover:shadow-md disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-50 sm:px-4"
          >
            <LogoutIcon />

            <span className="hidden sm:inline">
              {loggingOut ? "Signing out..." : "Logout"}
            </span>
          </button>
        </div>
      </div>
    </header>
  );
}

function IconBase({
  children,
  width = 18,
  height = 18,
}: {
  children: React.ReactNode;
  width?: number;
  height?: number;
}) {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

function BellIcon() {
  return (
    <IconBase>
      <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
      <path d="M10 21h4" />
    </IconBase>
  );
}

function LogoutIcon() {
  return (
    <IconBase width={17} height={17}>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </IconBase>
  );
}
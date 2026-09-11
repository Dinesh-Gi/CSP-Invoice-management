"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const pageTitles: Record<
  string,
  {
    title: string;
    description: string;
  }
> = {
  "/": {
    title: "Dashboard",
    description: "Overview of your Microsoft CSP business",
  },
  "/tracker": {
    title: "CSP Tracker",
    description:
      "Manage customers, licenses, pricing, invoices and payments",
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
    description: "Track invoice status",
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
        const response = await fetch("/api/auth/me");

        if (!response.ok) {
          return;
        }

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
        (path) =>
          path !== "/" &&
          pathname.startsWith(path)
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

    return (
      parts[0][0] +
      parts[parts.length - 1][0]
    ).toUpperCase();
  }

  function formatRole(role: string) {
    return role
      .toLowerCase()
      .replace(/\b\w/g, (letter) =>
        letter.toUpperCase()
      );
  }

  return (
    <header className="sticky top-0 z-30 border-b border-gray-200 bg-white">
      <div className="flex h-[76px] items-center justify-between px-8">

        {/* Page Information */}

        <div>
          <h1 className="text-xl font-bold text-gray-950">
            {page.title}
          </h1>

          <p className="mt-0.5 text-sm text-gray-500">
            {page.description}
          </p>
        </div>

        {/* Right Side */}

        <div className="flex items-center gap-4">

          {/* Notification */}

          <button
            type="button"
            className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-600 transition hover:bg-gray-50"
            aria-label="Notifications"
          >
            <span className="text-lg">
              🔔
            </span>

            <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-red-500" />
          </button>

          {/* User */}

          <div className="flex items-center gap-3 border-l border-gray-200 pl-4">

            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white">
              {user ? getInitials(user.name) : "U"}
            </div>

            <div className="hidden sm:block">
              <p className="text-sm font-semibold text-gray-900">
                {user?.name ?? "User"}
              </p>

              <p className="text-xs text-gray-500">
                {user ? formatRole(user.role) : "CSP Management"}
              </p>
            </div>

          </div>

          {/* Logout */}

          <button
            type="button"
            onClick={handleLogout}
            disabled={loggingOut}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 text-sm font-bold text-red-600 transition hover:border-red-300 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <LogoutIcon />

            {loggingOut
              ? "Signing out..."
              : "Logout"}
          </button>

        </div>
      </div>
    </header>
  );
}

function LogoutIcon() {
  return (
    <svg
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line
        x1="21"
        y1="12"
        x2="9"
        y2="12"
      />
    </svg>
  );
}
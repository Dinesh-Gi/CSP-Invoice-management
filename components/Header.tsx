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

  const [user, setUser] =
    useState<LoggedInUser | null>(null);

  const [loggingOut, setLoggingOut] =
    useState(false);

  useEffect(() => {
    async function loadUser() {
      try {
        const response = await fetch(
          "/api/auth/me",
          {
            cache: "no-store",
          }
        );

        if (!response.ok) return;

        const data = await response.json();

        if (data.success && data.user) {
          setUser(data.user);
        }
      } catch (error) {
        console.error(
          "Unable to load current user:",
          error
        );
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

      const response = await fetch(
        "/api/auth/logout",
        {
          method: "POST",
        }
      );

      if (!response.ok) {
        throw new Error("Logout failed");
      }

      router.replace("/login");
      router.refresh();
    } catch (error) {
      console.error(
        "Logout error:",
        error
      );

      alert(
        "Unable to logout. Please try again."
      );
    } finally {
      setLoggingOut(false);
    }
  }

  function getInitials(name: string) {
    const parts = name
      .trim()
      .split(/\s+/);

    if (parts.length === 1) {
      return parts[0]
        .slice(0, 2)
        .toUpperCase();
    }

    return `${parts[0][0]}${
      parts[parts.length - 1][0]
    }`.toUpperCase();
  }

  function formatRole(role: string) {
    return role
      .toLowerCase()
      .replace(
        /\b\w/g,
        (letter) => letter.toUpperCase()
      );
  }

  return (
    <header
      className="
        sticky top-0 z-30
        h-[62px]
        border-b border-slate-200
        bg-white/95
        backdrop-blur-xl
      "
    >
      <div
        className="
          flex h-full
          items-center
          justify-between
          gap-4
          px-4
          lg:px-5
        "
      >
        {/* PAGE TITLE */}

        <div className="flex min-w-0 items-center gap-3">
          <div className="hidden h-6 w-[3px] rounded-full bg-amber-500 sm:block" />

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-[9px] font-extrabold uppercase tracking-[0.16em] text-amber-600">
                ZEIT CSP
              </span>

              <span className="hidden text-slate-300 sm:inline">
                /
              </span>

              <h1 className="truncate text-[14px] font-bold tracking-tight text-slate-700">
                {pathname === "/tracker"
                  ? "CSP Management"
                  : page.title}
              </h1>
            </div>

            <p className="hidden truncate text-[9px] font-medium text-slate-400 lg:block">
              {pathname === "/tracker"
                ? "Transaction and invoice management"
                : page.description}
            </p>
          </div>
        </div>

        {/* RIGHT CONTROLS */}

        <div className="flex shrink-0 items-center gap-2">
          {/* NOTIFICATION */}

          <button
            type="button"
            aria-label="Notifications"
            title="Notifications"
            className="
              relative flex
              h-8 w-8
              items-center justify-center
              rounded-lg
              border border-slate-200
              bg-white
              text-slate-500
              transition
              hover:border-amber-200
              hover:bg-amber-50
              hover:text-amber-600
            "
          >
            <BellIcon
              width={16}
              height={16}
            />

            <span
              className="
                absolute
                right-1.5 top-1.5
                h-1.5 w-1.5
                rounded-full
                bg-red-500
                ring-2 ring-white
              "
            />
          </button>

          {/* USER */}

          <div
            className="
              hidden
              items-center
              gap-2
              rounded-lg
              border border-slate-200
              bg-slate-50/60
              px-2 py-1
              sm:flex
            "
          >
            <div
              className="
                flex h-7 w-7
                items-center justify-center
                rounded-lg
                bg-gradient-to-br
                from-blue-600
                to-cyan-500
                text-[10px]
                font-extrabold
                text-white
              "
            >
              {user
                ? getInitials(user.name)
                : "U"}
            </div>

            <div className="min-w-0">
              <p
                className="
                  max-w-[120px]
                  truncate
                  text-[11px]
                  font-bold
                  text-slate-900
                "
              >
                {user?.name ?? "User"}
              </p>

              <p className="text-[9px] font-semibold text-slate-500">
                {user
                  ? formatRole(user.role)
                  : "CSP Management"}
              </p>
            </div>
          </div>

          {/* LOGOUT */}

          <button
            type="button"
            onClick={handleLogout}
            disabled={loggingOut}
            className="
              inline-flex
              h-8
              items-center
              justify-center
              gap-1.5
              rounded-lg
              border border-red-200
              bg-red-50
              px-2.5
              text-[11px]
              font-bold
              text-red-600
              transition
              hover:border-red-300
              hover:bg-red-100
              disabled:cursor-not-allowed
              disabled:opacity-50
            "
          >
            <LogoutIcon />

            <span className="hidden sm:inline">
              {loggingOut
                ? "Signing out..."
                : "Logout"}
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

function BellIcon({
  width = 18,
  height = 18,
}: {
  width?: number;
  height?: number;
}) {
  return (
    <IconBase
      width={width}
      height={height}
    >
      <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
      <path d="M10 21h4" />
    </IconBase>
  );
}

function LogoutIcon() {
  return (
    <IconBase
      width={15}
      height={15}
    >
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />

      <polyline points="16 17 21 12 16 7" />

      <line
        x1="21"
        y1="12"
        x2="9"
        y2="12"
      />
    </IconBase>
  );
}
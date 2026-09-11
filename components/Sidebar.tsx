"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

type SessionUser = {
  id: number;
  name: string;
  email: string;
  role: string;
};

const menuItems = [
  { name: "Dashboard", href: "/", icon: "▦" },
  { name: "CSP Tracker", href: "/tracker", icon: "☷" },
  { name: "Customers", href: "/customers", icon: "◉" },
  { name: "Distributors", href: "/distributors", icon: "◆" },
  { name: "Invoices", href: "/invoices", icon: "▤" },
  { name: "Reports", href: "/reports", icon: "▥" },
];

export default function Sidebar() {
  const pathname = usePathname();

  const [user, setUser] = useState<SessionUser | null>(null);

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
        console.error("Unable to load sidebar user:", error);
      }
    }

    loadUser();
  }, []);

  const isAdmin = user?.role === "ADMIN";

  return (
    <aside className="fixed left-0 top-0 z-40 flex h-screen w-64 flex-col border-r border-gray-200 bg-white">
      {/* Logo */}
      <div className="border-b border-gray-200 px-6 py-5">
        <Link href="/" className="block">
          <img
            src="/ziniosedge-logo.png"
            alt="ZiniosEdge"
            className="h-auto w-[190px] object-contain"
          />

          <div className="mt-2 text-xs font-bold tracking-[0.18em] text-gray-500">
            CSP MANAGEMENT
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-5">
        <p className="mb-3 px-3 text-[11px] font-bold uppercase tracking-widest text-gray-400">
          Main Menu
        </p>

        <div className="space-y-1">
          {menuItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/" && pathname.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
                  isActive
                    ? "bg-blue-600 text-white shadow-sm"
                    : "text-gray-700 hover:bg-gray-100 hover:text-gray-950"
                }`}
              >
                <span
                  className={`flex h-8 w-8 items-center justify-center rounded-lg text-sm ${
                    isActive
                      ? "bg-white/15 text-white"
                      : "bg-gray-100 text-gray-600 group-hover:bg-white"
                  }`}
                >
                  {item.icon}
                </span>

                <span>{item.name}</span>
              </Link>
            );
          })}

          {/* Admin Only */}
          {isAdmin && (
            <Link
              href="/users"
              className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
                pathname === "/users" || pathname.startsWith("/users/")
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-gray-700 hover:bg-gray-100 hover:text-gray-950"
              }`}
            >
              <span
                className={`flex h-8 w-8 items-center justify-center rounded-lg text-sm ${
                  pathname === "/users" || pathname.startsWith("/users/")
                    ? "bg-white/15 text-white"
                    : "bg-gray-100 text-gray-600 group-hover:bg-white"
                }`}
              >
                ♙
              </span>

              <span>User Management</span>
            </Link>
          )}
        </div>
      </nav>

      {/* Footer */}
      <div className="border-t border-gray-200 p-4">
        <div className="rounded-xl bg-gray-50 p-4">
          <p className="text-xs font-semibold text-gray-500">
            CSP Tracker
          </p>

          <p className="mt-1 text-sm font-bold text-gray-900">
            ZEIT
          </p>

          <p className="mt-2 text-xs text-gray-500">
            Microsoft CSP Management
          </p>
        </div>
      </div>
    </aside>
  );
}
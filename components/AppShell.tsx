"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import ThemeProvider from "@/components/ThemeProvider";

export default function AppShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const [sidebarCollapsed, setSidebarCollapsed] =
    useState(false);

  useEffect(() => {
    try {
      const saved =
        window.localStorage.getItem(
          "zeit-sidebar-collapsed"
        );

      if (saved === "true") {
        setSidebarCollapsed(true);
      }
    } catch {
      // Ignore localStorage errors.
    }
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem(
        "zeit-sidebar-collapsed",
        String(sidebarCollapsed)
      );
    } catch {
      // Ignore localStorage errors.
    }
  }, [sidebarCollapsed]);

  if (pathname === "/login") {
    return <>{children}</>;
  }

  return (
    <ThemeProvider>
      <div className="min-h-screen bg-[var(--theme-page)]">
        <Sidebar
          collapsed={sidebarCollapsed}
          onToggle={() =>
            setSidebarCollapsed(
              (current) => !current
            )
          }
        />

        <div
          className={[
            "min-h-screen",
            "transition-[margin] duration-200 ease-in-out",
            sidebarCollapsed
              ? "ml-[64px]"
              : "ml-[232px]",
          ].join(" ")}
        >
          <Header />

          <main
            className="
              min-h-[calc(100vh-54px)]
              bg-transparent
            "
          >
            {children}
          </main>
        </div>
      </div>
    </ThemeProvider>
  );
}
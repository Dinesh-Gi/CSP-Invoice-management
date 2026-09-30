"use client";

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

  if (pathname === "/login") {
    return <>{children}</>;
  }

  return (
    <ThemeProvider>
      <div className="min-h-screen bg-[var(--theme-page)]">
        <Sidebar />

        <div className="ml-72 min-h-screen">
          <Header />

          <main className="min-h-[calc(100vh-78px)] bg-transparent">
            {children}
          </main>
        </div>
      </div>
    </ThemeProvider>
  );
}

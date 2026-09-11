"use client";

import { usePathname } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";

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
    <>
      <Sidebar />

      <div className="ml-64 min-h-screen bg-white">
        <Header />

        <main className="min-h-[calc(100vh-76px)] bg-white">
          {children}
        </main>
      </div>
    </>
  );
}
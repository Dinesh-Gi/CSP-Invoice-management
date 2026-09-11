import type { Metadata } from "next";
import "./globals.css";
import AppShell from "@/components/AppShell";

export const metadata: Metadata = {
  title: "ZEIT CSP Tracker",
  description: "ZiniosEdge Microsoft CSP Management Dashboard",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-white text-gray-950 antialiased">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
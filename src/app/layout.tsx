// src/app/layout.tsx
import "./globals.css";
import type { Metadata } from "next";
import { SiteHeader } from "@/components/SiteHeader";

export const metadata: Metadata = {
  title: "Chamber Booking",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-[#f5f5f7] text-[#111827]">
  <SiteHeader />

  <main className="min-h-screen">
  <div className="mx-auto max-w-6xl px-6 pb-10 pt-[10px]">{children}</div>
</main>
</body>
    </html>
  );
}


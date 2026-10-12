import type { Metadata } from "next";
import "./globals.css";
import { TenantProvider } from "../context/TenantContext";
import { AppLayout } from "../components/layout/AppLayout";

export const metadata: Metadata = {
  title: "AI Tender Portal — Bidder-Side Enterprise SaaS",
  description: "Find, evaluate, qualify, prepare, approve, and submit winning tender bids with verified company evidence and deterministic compliance intelligence.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-[#f8f9ff]">
        <TenantProvider>
          <AppLayout>{children}</AppLayout>
        </TenantProvider>
      </body>
    </html>
  );
}

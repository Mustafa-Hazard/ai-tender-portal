"use client";

import React, { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { ProtectedRoute } from "./ProtectedRoute";

const AUTH_PAGES = ["/login", "/signup"];

export function AppLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isAuthPage = AUTH_PAGES.includes(pathname);

  if (isAuthPage) {
    return <main className="min-h-screen bg-slate-50">{children}</main>;
  }

  return (
    <ProtectedRoute>
      <div className="flex min-h-screen bg-slate-50">
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <Header />
          <main className="flex-1 p-6 lg:p-8 max-w-[1520px] w-full mx-auto">
            {children}
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}
